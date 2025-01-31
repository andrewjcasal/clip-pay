"use server"

import { getAuthenticatedUser } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateBrandProfile(organizationName: string) {
  const { session, supabase } = await getAuthenticatedUser()

  try {
    // Update profile with organization name
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_name: organizationName,
      })
      .eq("id", session.user.id)

    if (updateError) throw updateError

    revalidatePath("/onboarding/brand/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating brand profile:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

export async function completeOnboardingWithPayment(setupIntentId: string) {
  const { session, supabase } = await getAuthenticatedUser()

  try {
    // Update profile to mark as brand and complete onboarding
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        user_type: "brand",
      })
      .eq("id", session.user.id)

    if (updateError) throw updateError

    // Store the setupIntentId and mark as verified
    const { error: brandError } = await supabase
      .from("brands")
      .update({
        setup_intent_id: setupIntentId,
        payment_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)

    if (brandError) throw brandError

    return { success: true }
  } catch (error) {
    console.error("Error completing onboarding with payment:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding",
    }
  }
}

export async function skipPaymentSetup() {
  const { session, supabase } = await getAuthenticatedUser()

  try {
    // First update profile to mark as brand
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        user_type: "brand",
      })
      .eq("id", session.user.id)

    if (profileError) throw profileError

    // Then create/update brand record
    const { error: brandError } = await supabase
      .from("brands")
      .update({
        payment_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
    if (brandError) throw brandError

    revalidatePath("/onboarding/brand/step2")
    return { success: true }
  } catch (error) {
    console.error("Error skipping payment setup:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to skip payment setup",
    }
  }
}
