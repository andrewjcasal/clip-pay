"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { SupabaseClient } from "@supabase/supabase-js"

interface BrandProfile {
  organization_name: string
}

interface Result {
  success: boolean
  error?: string
}

// Brand repository for database operations
export class BrandRepository {
  constructor(private supabase: SupabaseClient) {}

  async createProfile(userId: string) {
    return this.supabase.from("profiles").insert({
      user_id: userId,
      user_type: "brand",
      onboarding_completed: false,
    })
  }

  async updateProfile(userId: string, profile: Partial<BrandProfile>) {
    return this.supabase.from("profiles").update(profile).eq("user_id", userId)
  }

  async completeOnboarding(userId: string) {
    return this.supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId)
  }

  async setupPayment(userId: string, paymentToken: string) {
    return this.supabase.from("brands").insert({
      user_id: userId,
      stripe_customer_id: `cus_${paymentToken}`,
      payment_verified: true,
    })
  }

  async getBrandPaymentStatus(userId: string) {
    return this.supabase
      .from("brands")
      .select("stripe_customer_id, payment_verified")
      .eq("user_id", userId)
      .single()
  }
}

// Auth service for authentication operations
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password,
    })
  }
}

// Server actions that use the repository
export async function signUpBrand(
  email: string,
  password: string
): Promise<Result> {
  const supabase = await createServerSupabaseClient()
  const authService = new AuthService(supabase)
  const brandRepo = new BrandRepository(supabase)

  try {
    const { data, error } = await authService.signUp(email, password)
    if (error) throw error
    if (!data.user) throw new Error("No user data returned")

    const { error: profileError } = await brandRepo.createProfile(data.user.id)
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
  const brandRepo = new BrandRepository(supabase)

  try {
    const { error } = await brandRepo.updateProfile(userId, profile)
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
  const brandRepo = new BrandRepository(supabase)

  try {
    const { error } = await brandRepo.setupPayment(userId, paymentToken)
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
  const brandRepo = new BrandRepository(supabase)

  try {
    const { error } = await brandRepo.completeOnboarding(userId)
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
  const brandRepo = new BrandRepository(supabase)

  try {
    const { data, error } = await brandRepo.getBrandPaymentStatus(userId)
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
