import { getAuthenticatedUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { CreatorOnboardingForm } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export default async function CreatorOnboarding() {
  const { session, supabase } = await getAuthenticatedUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name, stripe_account_id")
    .eq("id", session.user.id)
    .single()

  // If user already has completed onboarding, redirect to dashboard
  if (profile?.organization_name && profile?.stripe_account_id) {
    redirect("/dashboard")
  }

  let accountLink
  try {
    // Create or get Stripe Connect account
    if (!profile?.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: "express",
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      })

      await supabase
        .from("profiles")
        .update({ stripe_account_id: account.id })
        .eq("id", session.user.id)

      accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        type: "account_onboarding",
      })
    } else {
      // Get existing account link
      accountLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        type: "account_onboarding",
      })
    }
  } catch (error) {
    console.error("Stripe setup error:", error)
    throw new Error("Failed to setup Stripe Connect account")
  }

  return <CreatorOnboardingForm accountLinkUrl={accountLink.url} />
}
