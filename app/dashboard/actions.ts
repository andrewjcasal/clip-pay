"use server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { writeFile, readFile } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import { join } from "path"
import { unlink } from "fs/promises"
import { Deepgram } from "@deepgram/sdk"
import { Database } from "@/types/supabase"

const execAsync = promisify(exec)

// Ensure DEEPGRAM_API_KEY is available
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
if (!DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY is not set in environment variables")
}

const deepgram = new Deepgram(DEEPGRAM_API_KEY)

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Brand = Database["public"]["Tables"]["brands"]["Row"]

interface ProfileWithBrand extends Pick<Profile, "id"> {
  brands: Pick<Brand, "id">
}

interface Campaign {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string | null
  video_outline: string | null
  status: string | null
  brand: {
    name: string
    payment_verified: boolean
  }
  submission: {
    id: string
    status: string
    video_url: string | null
    file_path: string | null
    campaign_id: string
  } | null
}

type PollSubmissionResponse = {
  id: string
  video_url: string | null
  file_path: string | null
  transcription: string | null
  status: string
  created_at: string
  views: number
  creator_id: string
  campaign_id: string
  creator: {
    organization_name: string | null
    email: string | null
  }
}

export async function approveSubmission(submissionId: string) {
  const supabase = await createServerSupabaseClient()

  // Get submission and campaign details first
  const { data: submission } = await supabase
    .from("submissions")
    .select(
      `
      id,
      creator_id,
      campaign:campaigns (
        title
      )
    `
    )
    .eq("id", submissionId)
    .single()

  if (!submission) {
    throw new Error("Submission not found")
  }

  // Get payout duration from env (default to 7 days for production)
  const payoutDurationMinutes = Number(
    process.env.NEXT_PUBLIC_PAYOUT_DURATION_MINUTES || "10080"
  )

  // Calculate due date
  const payoutDueDate = new Date()
  payoutDueDate.setMinutes(payoutDueDate.getMinutes() + payoutDurationMinutes)

  const { error } = await supabase
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

  // Create a notification for the creator
  const { error: notificationError } = await supabase
    .from("notifications")
    .insert({
      recipient_id: submission.creator_id,
      type: "submission_approved",
      title: "Submission Approved",
      message: `Your submission for campaign "${submission.campaign.title}" has been approved!`,
      metadata: {
        submission_id: submissionId,
        campaign_title: submission.campaign.title,
      },
    })

  if (notificationError) {
    console.error("Error creating notification:", notificationError)
    // Don't throw here, as the submission was already approved
  }

  revalidatePath("/dashboard")
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
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("Auth error:", authError)
    throw new Error("Authentication failed")
  }

  if (!user) {
    throw new Error("Not authenticated")
  }

  // First get the user's profile to get their brand
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select<string, ProfileWithBrand>("id, brands!inner (id)")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile fetch error:", profileError)
    throw new Error("Failed to fetch user profile")
  }

  if (!profile?.brands?.id) {
    console.error("No brand found for user:", user.id)
    throw new Error("No brand found for user")
  }

  const userBrandId = profile.brands.id

  if (userBrandId !== brandId) {
    console.error(
      "Brand mismatch. User brand:",
      userBrandId,
      "Request brand:",
      brandId
    )
    throw new Error("Unauthorized: Brand does not belong to user")
  }

  // Convert string values to numbers and validate
  const numericBudgetPool = Number(budget_pool)
  const numericRpm = Number(rpm)
  const numericReferralRate = Number(referral_bonus_rate)

  if (isNaN(numericBudgetPool) || numericBudgetPool <= 0) {
    throw new Error("Invalid budget pool amount")
  }

  if (isNaN(numericRpm) || numericRpm <= 0) {
    throw new Error("Invalid RPM amount")
  }

  if (
    isNaN(numericReferralRate) ||
    numericReferralRate < 0 ||
    numericReferralRate > 100
  ) {
    throw new Error("Invalid referral bonus rate")
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      title,
      budget_pool: numericBudgetPool,
      rpm: numericRpm,
      guidelines,
      video_outline,
      referral_bonus_rate: numericReferralRate,
      brand_id: brandId,
      status: "active",
    })
    .select()
    .single()

  if (campaignError) {
    console.error("Error creating campaign:", campaignError)
    throw campaignError
  }

  revalidatePath("/dashboard")
  return campaign
}

async function processVideo(
  videoPath: string,
  userId: string
): Promise<{ audioPath: string; transcription: string }> {
  try {
    // Create unique names for the audio file
    const audioFileName = `${userId}_${Date.now()}.wav` // Changed to WAV for better quality
    const audioPath = join("/tmp", audioFileName)

    // Extract audio using ffmpeg with improved parameters
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 -af "volume=1.5" "${audioPath}"`
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    // Read the audio file
    const audioFile = await readFile(audioPath)

    // Transcribe using Deepgram with more options
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

    if (!response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      console.error("No transcript in response. Full response:", response)
      throw new Error("Failed to get transcription from Deepgram")
    }

    // Clean up the audio file
    await unlink(audioPath)

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
        status: "pending",
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

  if (!user?.id) {
    return []
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands!inner (
        payment_verified,
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
    .order("created_at", { ascending: false })

  if (!campaigns) return []

  const transformedCampaigns = campaigns.map((campaign) => {
    return {
      id: campaign.id,
      title: campaign.title,
      budget_pool: String(campaign.budget_pool),
      rpm: String(campaign.rpm),
      guidelines: campaign.guidelines,
      video_outline: campaign.video_outline,
      status: campaign.status,
      brand: {
        name:
          campaign.brand?.brand_profile?.organization_name || "Unknown Brand",
        payment_verified: !!campaign.brand?.payment_verified,
      },
      submission: campaign.submission?.[0] || null,
    }
  })

  return transformedCampaigns
}

export async function pollNewSubmissions(campaignIds: string[]) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      video_url,
      file_path,
      transcription,
      status,
      created_at,
      views,
      creator_id,
      campaign_id,
      creator:creator_profiles(
        organization_name,
        email
      )
    `
    )
    .eq("status", "pending")
    .in("campaign_id", campaignIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<PollSubmissionResponse[]>()

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export const updateSubmissionVideoUrl = async (
  submissionId: string,
  videoUrl: string
) => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Update the submission with the new video URL
  const { data, error } = await supabase
    .from("submissions")
    .update({
      video_url: videoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("creator_id", user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Update the checkForNotifications function to use the notifications table
export const checkForNotifications = async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return notifications
}

// Update the markNotificationAsSeen function to use the notifications table
export const markNotificationAsSeen = async (notificationId: string) => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id)

  if (error) {
    throw error
  }
}
