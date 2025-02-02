import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { CreatorOnboardingForm } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

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
    .select("organization_name, stripe_account_id, onboarding_completed")
    .eq("id", user.id)
    .single()

  // If user already has completed onboarding, redirect to dashboard
  if (
    profile?.organization_name &&
    profile?.stripe_account_id &&
    profile?.onboarding_completed
  ) {
    redirect("/dashboard")
  }

  return <CreatorOnboardingForm />
}
