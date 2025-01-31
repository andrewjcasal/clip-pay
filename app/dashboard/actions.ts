"use server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

type BrandProfile = {
  brand: {
    user_id: string
    profiles: {
      organization_name: string
    }
  }
}

type Campaign = {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  status: string
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
  brandId,
}: {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  video_outline: string
  brandId: string
}) {
  const supabase = await createServerSupabaseClient()
  const session = await supabase.auth.getSession()

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
    .eq("id", session.data.session?.user.id)
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

    // Debug: Check raw profiles table
    const { data: rawProfile, error: rawProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // Get the creator's profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select()
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      throw new Error("Creator profile not found")
    }

    // Debug: Check if user has correct profile type
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    // Debug: Try a direct RLS test
    const { data: rlsTest, error: rlsTestError } = await supabase
      .from("submissions")
      .select()
      .limit(1)

    // Ensure user is a creator type
    if (userProfile?.user_type !== "creator") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ user_type: "creator" })
        .eq("id", user.id)

      if (updateError) {
        throw new Error("Failed to update profile type")
      }
    }

    // Debug: Check if user has a creator record
    const { data: creatorRecord, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!creatorRecord) {
      // If no creator record exists, create one
      const { data: newCreator, error: insertError } = await supabase
        .from("creators")
        .insert({ user_id: user.id })
        .select()
        .single()

      if (insertError) {
        throw new Error("Failed to create creator record")
      }
    }

    let finalVideoUrl = videoUrl

    // If a file was provided, upload it to Supabase Storage
    if (file) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
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

    // Create the submission record
    const { data: submission, error } = await supabase
      .from("submissions")
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        video_url: finalVideoUrl,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/dashboard")
    return submission
  } catch (error) {
    console.error("Error in submitVideo:", error)
    throw error
  }
}

export async function getCreatorCampaigns() {
  const supabase = await createServerSupabaseClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      title,
      budget_pool,
      rpm,
      guidelines,
      status,
      brand:brands!inner (
        user_id,
        profiles (
          organization_name
        )
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<Campaign[]>()

  if (!campaigns) return []

  // Transform the campaigns data
  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: campaign.budget_pool,
    rpm: campaign.rpm,
    guidelines: campaign.guidelines,
    status: campaign.status,
    brand: {
      name: campaign.brand?.profiles?.organization_name || "Unknown Brand",
    },
    submission: null,
  }))
}
