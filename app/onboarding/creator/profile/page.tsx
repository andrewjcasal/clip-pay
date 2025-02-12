import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { ProfileForm } from "./form"

export default async function CreatorProfilePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get both profile and creator data
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name, onboarding_completed")
    .eq("user_id", user.id)
    .single()

  const { data: creator } = await supabase
    .from("creators")
    .select("tiktok_connected")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  // If onboarding is already complete, go to dashboard
  if (profile.onboarding_completed) {
    redirect("/dashboard")
  }

  // If TikTok is not connected, go back to TikTok auth
  if (!creator?.tiktok_connected) {
    redirect("/onboarding/creator/tiktok")
  }

  return <ProfileForm />
}
