import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Deepgram } from "@deepgram/sdk"
import { spawn } from "child_process"
import { unlink, readFile } from "fs/promises"
import { createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import fetch from "node-fetch"
import { SupabaseClient } from "@supabase/supabase-js"

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY!)

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { campaign_id, video_url, file_path } = await req.json()

    if (!campaign_id || (!video_url && !file_path)) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        campaign_id,
        creator_id: session.user.id,
        video_url,
        file_path,
        status: "active",
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error creating submission:", submissionError)
      return new NextResponse("Error creating submission", { status: 500 })
    }

    // Process video in background
    processVideo(video_url || file_path, submission.id, supabase).catch(
      console.error
    )

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error in submissions route:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

async function processVideo(
  videoSource: string,
  submissionId: string,
  supabase: SupabaseClient
) {
  try {
    // Download video to temp file
    const tempVideoPath = `/tmp/${submissionId}.mp4`
    const tempAudioPath = `/tmp/${submissionId}.wav`

    if (videoSource.startsWith("http")) {
      // Download from URL
      const response = await fetch(videoSource)
      if (!response.ok) throw new Error("Failed to fetch video")
      await pipeline(response.body!, createWriteStream(tempVideoPath))
    } else {
      // Get from Supabase storage
      const { data, error } = await supabase.storage
        .from("videos")
        .download(videoSource)
      if (error) throw error
      await pipeline(data, createWriteStream(tempVideoPath))
    }

    // Extract audio using ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempVideoPath,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        tempAudioPath,
      ])

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve(code)
        else reject(new Error(`ffmpeg exited with code ${code}`))
      })
    })

    // Transcribe with Deepgram
    const audioBuffer = await readFile(tempAudioPath)
    const { results } = await deepgram.transcription.preRecorded(
      {
        buffer: audioBuffer,
        mimetype: "audio/wav",
      },
      {
        smart_format: true,
        punctuate: true,
      }
    )

    // Update submission with transcription
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        transcription: results.channels[0].alternatives[0].transcript,
        processed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (updateError) throw updateError

    // Cleanup temp files
    await Promise.all([unlink(tempVideoPath), unlink(tempAudioPath)])
  } catch (err) {
    console.error("Error processing video:", err)
    const error = err as Error
    await supabase
      .from("submissions")
      .update({
        processing_error: error.message,
      })
      .eq("id", submissionId)
  }
}
