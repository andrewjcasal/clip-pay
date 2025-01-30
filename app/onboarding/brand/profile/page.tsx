import { getAuthenticatedUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Step1Form } from "./form"

export default async function BrandOnboardingStep1() {
  const { session, supabase } = await getAuthenticatedUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name")
    .eq("id", session.user.id)
    .single()

  // If user already has an organization name, redirect to step 2
  if (profile?.organization_name) {
    redirect("/onboarding/brand/step2")
  }

  return <Step1Form userId={session.user.id} />
}
