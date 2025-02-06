"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { Database } from "@/types/supabase"

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
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("profile_id")
        .eq("code", referralCode)
        .maybeSingle<ReferralData>()

      if (referralError) {
        console.error("Error checking referral code:", referralError)
        return { success: false, error: "Invalid referral code" }
      }

      if (!referralData) {
        return { success: false, error: "Invalid referral code" }
      }

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
        referred_by: referrerId,
        onboarding_completed: true,
        user_type: "creator",
      } satisfies Database["public"]["Tables"]["profiles"]["Update"])
      .eq("user_id", user.id)

    if (updateError) throw updateError

    // Create creator profile record
    const { error: creatorError } = await supabase
      .from("creators")
      .insert({
        user_id: user.id,
      } satisfies Database["public"]["Tables"]["creators"]["Insert"])
      .select()
      .single()

    if (creatorError && creatorError.code !== "23505") {
      // Ignore unique constraint violations
      throw creatorError
    }

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
