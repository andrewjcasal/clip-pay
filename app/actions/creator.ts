"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/supabase"
import { TikTokAPI } from "@/lib/tiktok"

interface ReferralData {
  profile_id: string
}

export async function updateCreatorProfile(
  organizationName: string,
  referralCode: string | null
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "User not found" }
  }

  try {
    // If referral code provided, verify it
    let referrerId = null
    if (referralCode) {
      // First get the referrer's profile ID from the referrals table
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("profile_id")
        .eq("code", referralCode)
        .maybeSingle()

      if (referralError || !referralData) {
        console.error("Error checking referral code:", referralError)
        return { success: false, error: "Invalid referral code" }
      }

      // Get the referrer's profile to ensure they are a creator
      const { data: referrerProfile, error: referrerError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", referralData.profile_id)
        .single()

      if (
        referrerError ||
        !referrerProfile ||
        referrerProfile.user_type !== "creator"
      ) {
        return { success: false, error: "Invalid referral code" }
      }

      // Store the referrer's profile_id from the referrals table
      referrerId = referralData.profile_id

      // Create notification for referrer
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: referrerId,
          type: "new_referral",
          title: "New Creator Referral",
          message: `${organizationName} has joined using your referral code!`,
          metadata: {
            referred_creator_id: user.id,
            referred_creator_name: organizationName,
          },
        } satisfies Database["public"]["Tables"]["notifications"]["Insert"])

      if (notificationError) {
        console.error(
          "Error creating referral notification:",
          notificationError
        )
        // Don't throw here, as we still want to complete the profile update
      }
    }

    // Update profile with organization name and referral info
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_name: organizationName,
        referred_by: referrerId, // This should be the profile_id from the referrals table
        onboarding_completed: true,
        user_type: "creator",
      } satisfies Database["public"]["Tables"]["profiles"]["Update"])
      .eq("user_id", user.id)

    if (updateError) throw updateError

    // Create welcome notification for the new creator
    const { error: welcomeNotificationError } = await supabase
      .from("notifications")
      .insert({
        recipient_id: user.id,
        type: "welcome",
        title: "Welcome to Creator Pay!",
        message:
          "Your creator profile has been set up successfully. Start exploring campaigns and submitting videos!",
        metadata: {
          organization_name: organizationName,
        },
      } satisfies Database["public"]["Tables"]["notifications"]["Insert"])

    if (welcomeNotificationError) {
      console.error(
        "Error creating welcome notification:",
        welcomeNotificationError
      )
      // Don't throw here, as the profile update was successful
    }

    revalidatePath("/onboarding/creator")
    return { success: true }
  } catch (error) {
    console.error("Error updating creator profile:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

export async function updateSubmissionVideoUrl(
  submissionId: string,
  videoUrl: string
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Get the creator's TikTok access token

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("tiktok_access_token")
      .eq("user_id", user.id)
      .single()

    if (creatorError) {
      console.error("Error fetching creator:", creatorError)
      throw creatorError
    }

    if (!creator?.tiktok_access_token) {
      return { success: false, error: "TikTok not connected" }
    }

    // Get video info from TikTok
    const tiktokApi = new TikTokAPI()

    const videoInfo = await tiktokApi.getVideoInfo(
      videoUrl,
      creator.tiktok_access_token,
      user.id
    )

    if (!videoInfo) {
      return { success: false, error: "Could not fetch video information" }
    }

    // Update the submission with video URL and views

    const { data: updatedSubmission, error: updateError } = await supabase
      .from("submissions")
      .update({
        video_url: videoUrl,
        views: videoInfo.views,
      })
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
      // Let's first check if the submission exists and who owns it
      const { data: existingSubmission, error: checkError } = await supabase
        .from("submissions")
        .select("id, user_id")
        .eq("id", submissionId)
        .single()

      if (checkError) {
        console.error("Error checking submission:", checkError)
        throw new Error("Failed to verify submission ownership")
      } else {
        if (existingSubmission.user_id !== user.id) {
          throw new Error(
            "You do not have permission to update this submission"
          )
        }
      }
      throw updateError
    }

    revalidatePath("/submissions")
    revalidatePath("/dashboard")

    return { success: true, views: videoInfo.views }
  } catch (error) {
    console.error("Error in updateSubmissionVideoUrl:", error)
    throw error
  }
}
