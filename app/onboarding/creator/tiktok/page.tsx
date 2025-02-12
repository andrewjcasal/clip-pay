import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { TikTokAuthForm } from "./form"

export default async function TikTokAuthPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get user profile to check if they've already connected TikTok
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, tiktok_connected")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  // If they've already connected TikTok, move to the next step
  if (profile.tiktok_connected) {
    redirect("/onboarding/creator/profile")
  }

  return <TikTokAuthForm />
}
