"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function approveSubmission(submissionId: string) {
  const supabase = createServerActionClient({ cookies })

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
  const supabase = createServerActionClient({ cookies })

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
  brandId,
}: {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  video_outline: string
  brandId: string
}) {
  const supabase = createServerActionClient({ cookies })

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      title,
      budget_pool,
      rpm,
      guidelines,
      video_outline,
      brand_id: brandId,
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

export async function submitVideo({
  campaignId,
  videoUrl,
  file,
}: {
  campaignId: string
  videoUrl?: string
  file?: File
}) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session) throw new Error("No session found")

    let filePath = null
    let finalVideoUrl = videoUrl || null

    if (file) {
      // Upload video to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }
      filePath = fileName

      // Get the public URL of the uploaded video
      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(fileName)
      finalVideoUrl = publicUrl
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        campaign_id: campaignId,
        creator_id: session.user.id,
        video_url: finalVideoUrl,
        file_path: filePath,
        status: "active",
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error creating submission:", submissionError)
      throw submissionError
    }

    revalidatePath("/dashboard")
    return submission
  } catch (error) {
    console.error("Error in video submission:", error)
    throw error
  }
}
