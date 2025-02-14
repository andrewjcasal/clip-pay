"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function updateUserEmail(newEmail: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ email: newEmail })

  if (error) {
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function updateUserPassword(newPassword: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function updateAutoApproval(enabled: boolean) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Get the brand ID for the current user
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (brandError || !brand) {
    throw new Error("Brand not found")
  }

  // Update the auto_approval setting
  const { error } = await supabase
    .from("brands")
    .update({ auto_approval_enabled: enabled })
    .eq("id", brand.id)

  if (error) {
    throw error
  }

  revalidatePath("/settings")
  return { success: true }
}
