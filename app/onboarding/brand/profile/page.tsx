import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Step1Form } from "./form"

export default async function BrandOnboardingStep1() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Session:", session)
  if (!session) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name")
    .eq("id", session.user.id)
    .single()

  console.log("Profile:", !!profile?.organization_name)
  // If user already has an organization name, redirect to step 2
  if (profile?.organization_name) {
    redirect("/onboarding/brand/step2")
  }

  return <Step1Form />
}
