"use server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { Campaign } from "./page"
import { writeFile, readFile } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import { join } from "path"
import { unlink } from "fs/promises"
import { Deepgram } from "@deepgram/sdk"
import { Alternatives } from "@deepgram/sdk/dist/enums"

const execAsync = promisify(exec)

// Ensure DEEPGRAM_API_KEY is available
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
if (!DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY is not set in environment variables")
}

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

type BrandProfile = {
  brand: {
    user_id: string
    profiles: {
      organization_name: string
    }
  }
}

export async function approveSubmission(submissionId: string) {
  const supabase = await createServerSupabaseClient()

  // Get payout duration from env (default to 7 days for production)
  const payoutDurationMinutes = Number(
    process.env.NEXT_PUBLIC_PAYOUT_DURATION_MINUTES || "10080"
  )

  // Calculate due date
  const payoutDueDate = new Date()
  payoutDueDate.setMinutes(payoutDueDate.getMinutes() + payoutDurationMinutes)

  const { data, error } = await supabase
    .from("submissions")
    .update({
      status: "approved",
      payout_due_date: payoutDueDate.toISOString(),
      payout_status: "pending",
    })
    .eq("id", submissionId)

  if (error) {
    console.error("Error approving submission:", error)
    throw error
  }

  revalidatePath("/dashboard")
  return data
}

export async function rejectSubmission(submissionId: string) {
  const supabase = await createServerSupabaseClient()

  // Try a simpler select first to verify the submission
  const { error: checkError } = await supabase
    .from("submissions")
    .select(
      `
      id,
      campaign_id,
      status,
      campaign:campaigns (
        id,
        brand_id
      )
    `
    )
    .eq("id", submissionId)

  if (checkError) {
    throw new Error(`Error checking submission: ${checkError.message}`)
  }

  // Then try the update
  const { data, error } = await supabase
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", submissionId)

  if (error) {
    console.error("Error rejecting submission:", error)
    throw error
  }

  revalidatePath("/dashboard")
  return data
}

export async function createCampaign({
  title,
  budget_pool,
  rpm,
  guidelines,
  video_outline,
  referral_bonus_rate,
  brandId,
}: {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  video_outline: string
  referral_bonus_rate: string
  brandId: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from("profiles")
    .select(
      `
    *,
    brands (
      id,
      payment_verified
    )
  `
    )
    .eq("id", user?.id)
    .single()

  if (!data?.brands?.id) {
    throw new Error("Brand not found")
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      title,
      budget_pool,
      rpm,
      guidelines,
      video_outline,
      referral_bonus_rate,
      brand_id: data.brands.id,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating campaign:", error)
    throw error
  }

  revalidatePath("/dashboard")
  return campaign
}

async function processVideo(
  videoPath: string,
  userId: string
): Promise<{ audioPath: string; transcription: string }> {
  try {
    console.log("Starting video processing for path:", videoPath)

    // Create unique names for the audio file
    const audioFileName = `${userId}_${Date.now()}.wav` // Changed to WAV for better quality
    const audioPath = join("/tmp", audioFileName)
    console.log("Will extract audio to:", audioPath)

    // Extract audio using ffmpeg with improved parameters
    console.log("Running ffmpeg command...")
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 -af "volume=1.5" "${audioPath}"`
    console.log("FFmpeg command:", ffmpegCommand)
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    if (stderr) {
      console.log("ffmpeg stderr:", stderr)
    }
    console.log("ffmpeg stdout:", stdout)

    // Verify audio file exists and has content
    const audioStats = await readFile(audioPath)
    console.log("Extracted audio file size:", audioStats.length, "bytes")

    // Read the audio file
    const audioFile = await readFile(audioPath)
    console.log("Successfully read audio file")

    // Transcribe using Deepgram with more options
    console.log("Sending to Deepgram for transcription...")
    const response = await deepgram.transcription.preRecorded(
      { buffer: audioFile, mimetype: "audio/wav" },
      {
        smart_format: true,
        punctuate: true,
        utterances: true,
        model: "general-enhanced", // Use enhanced model
        language: "en-US",
        tier: "enhanced",
        detect_language: true,
        diarize: true,
        numerals: true,
        profanity_filter: false,
      }
    )

    console.log("Full Deepgram response:", JSON.stringify(response, null, 2))

    if (!response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      console.error("No transcript in response. Full response:", response)
      throw new Error("Failed to get transcription from Deepgram")
    }

    // Clean up the audio file
    await unlink(audioPath)
    console.log("Cleaned up temporary audio file")

    return {
      audioPath,
      transcription: response.results.channels[0].alternatives[0].transcript,
    }
  } catch (error) {
    console.error("Detailed error in video processing:", error)
    if (error instanceof Error) {
      console.error("Error stack:", error.stack)
    }
    throw new Error(
      `Failed to process video: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function submitVideo({
  campaignId,
  videoUrl,
  file,
}: {
  campaignId: string
  videoUrl?: string
  file?: File
}) {
  const supabase = await createServerSupabaseClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Not authenticated")
    }

    // Get the creator's profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select()
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      throw new Error("Creator profile not found")
    }

    // Ensure user is a creator type
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (userProfile?.user_type !== "creator") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ user_type: "creator" })
        .eq("id", user.id)

      if (updateError) {
        throw new Error("Failed to update profile type")
      }
    }

    let finalVideoUrl = videoUrl
    let filePath = null
    let transcription = null

    // If a file was provided, process it
    if (file) {
      // First save the file temporarily
      const tempVideoPath = join(
        "/tmp",
        `${user.id}_${Date.now()}_${file.name}`
      )
      await writeFile(tempVideoPath, Buffer.from(await file.arrayBuffer()))

      // Process the video to extract audio and get transcription
      const processedData = await processVideo(tempVideoPath, user.id)
      transcription = processedData.transcription

      // Clean up the temporary video file
      await unlink(tempVideoPath)

      // Upload the original video to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`
      filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(filePath)

      finalVideoUrl = publicUrl
    }

    // Create the submission with transcription
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        video_url: finalVideoUrl,
        file_path: filePath,
        transcription,
        status: "active",
      })
      .select()
      .single()

    if (submissionError) {
      throw submissionError
    }

    revalidatePath("/dashboard")
    return submission
  } catch (error) {
    console.error("Error in submitVideo:", error)
    throw error
  }
}

export async function getCreatorCampaigns(): Promise<Campaign[]> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands!inner (
        id,
        brand_profile:profiles!inner (
          organization_name
        )
      ),
      submission:submissions!left (
        id,
        status,
        video_url,
        file_path,
        campaign_id
      )
    `
    )
    .eq("status", "active")
    .eq("submissions.creator_id", user?.id)
    .order("created_at", { ascending: false })

  if (!campaigns) return []

  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: String(campaign.budget_pool),
    rpm: String(campaign.rpm),
    guidelines: campaign.guidelines,
    video_outline: campaign.video_outline,
    status: campaign.status,
    brand: {
      name: campaign.brand?.brand_profile?.organization_name || "Unknown Brand",
    },
    submission: campaign.submission?.[0] || null,
  }))
}
