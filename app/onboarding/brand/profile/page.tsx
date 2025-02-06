import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Step1Form } from "./form"

export default async function BrandOnboardingStep1() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name")
    .eq("user_id", user.id)
    .single()

  console.log("profile", profile?.organization_name)

  // If user already has an organization name, redirect to step 2
  if (profile?.organization_name) {
    redirect("/onboarding/brand/step2")
  }

  return <Step1Form />
}
