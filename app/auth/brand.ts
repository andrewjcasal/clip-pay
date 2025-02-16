"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"

interface BrandProfile {
  organization_name: string
}

interface Result {
  success: boolean
  error?: string
}

export async function signUpBrand(
  email: string,
  password: string
): Promise<Result> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (!data.user) {
      throw new Error("No user data returned")
    }

    // Create brand profile
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      user_type: "brand",
      onboarding_completed: false,
    })

    if (profileError) throw profileError

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create account",
    }
  }
}

export async function updateBrandProfile(
  userId: string,
  profile: Partial<BrandProfile>
): Promise<Result> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

export async function setupBrandPayment(
  userId: string,
  paymentToken: string
): Promise<Result> {
  const supabase = await createServerSupabaseClient()

  try {
    // In a real implementation, this would interact with Stripe
    // For now, we'll just update the database
    const { error } = await supabase.from("brands").insert({
      user_id: userId,
      stripe_customer_id: `cus_${paymentToken}`,
      payment_verified: true,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to setup payment",
    }
  }
}

export async function completeBrandOnboarding(userId: string): Promise<Result> {
  const supabase = await createServerSupabaseClient()

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding",
    }
  }
}

interface CampaignPermissionResult {
  allowed: boolean
  reason?: string
}

export async function canCreateCampaign(
  userId: string
): Promise<CampaignPermissionResult> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("brands")
      .select("stripe_customer_id, payment_verified")
      .eq("user_id", userId)
      .single()

    if (error) throw error

    if (!data.stripe_customer_id || !data.payment_verified) {
      return {
        allowed: false,
        reason: "payment_required",
      }
    }

    return { allowed: true }
  } catch (error) {
    return {
      allowed: false,
      reason: "error",
    }
  }
}
