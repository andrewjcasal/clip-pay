import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { CreatorOnboardingForm } from "./form"

export default async function CreatorOnboarding() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name, onboarding_completed")
    .eq("user_id", user.id)
    .single()

  // If user already has completed onboarding, redirect to dashboard
  if (profile?.organization_name && profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  return <CreatorOnboardingForm />
}
