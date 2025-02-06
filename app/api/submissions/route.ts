import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { Deepgram } from "@deepgram/sdk"
import { spawn } from "child_process"
import { unlink, readFile, writeFile } from "fs/promises"
import { SupabaseClient } from "@supabase/supabase-js"

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("Missing DEEPGRAM_API_KEY environment variable")
}

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY)

// For Netlify, we need to export config
export const config = {
  runtime: "nodejs18.x",
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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
        user_id: user.id,
        file_path,
        status: "pending",
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
      const arrayBuffer = await response.arrayBuffer()
      await writeFile(tempVideoPath, Buffer.from(arrayBuffer))
    } else {
      // Get from Supabase storage
      const { data, error } = await supabase.storage
        .from("videos")
        .download(videoSource)
      if (error) throw error
      const arrayBuffer = await data.arrayBuffer()
      await writeFile(tempVideoPath, Buffer.from(arrayBuffer))
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
    const source = {
      buffer: audioBuffer,
      mimetype: "audio/wav",
    }

    const response = await deepgram.transcription.preRecorded(source, {
      smart_format: true,
      punctuate: true,
    })

    if (!response?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      throw new Error("Failed to get transcription from Deepgram")
    }

    // Update submission with transcription
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        transcription: response.results.channels[0].alternatives[0].transcript,
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
