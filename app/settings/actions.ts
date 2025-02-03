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
