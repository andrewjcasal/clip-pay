"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

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
        .single()

      if (referralError) {
        if (referralError.code === "PGRST116") {
          return { success: false, error: "Invalid referral code" }
        }
        throw referralError
      }
      referrerId = referralData.profile_id
    }

    // Update profile with organization name and referral info
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_name: organizationName,
        referred_by: referrerId,
        onboarding_completed: true,
        user_type: "creator",
      })
      .eq("id", user.id)

    if (updateError) throw updateError

    // Create creator profile record
    const { error: creatorError } = await supabase
      .from("creators")
      .insert({
        user_id: user.id,
      })
      .select()
      .single()

    if (creatorError && creatorError.code !== "23505") {
      // Ignore unique constraint violations
      throw creatorError
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
