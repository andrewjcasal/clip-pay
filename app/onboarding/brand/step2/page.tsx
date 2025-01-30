import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Step2Form } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export default async function BrandOnboardingStep2() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  // Get brand record with organization name from profile
  const { data: brand } = await supabase
    .from("brands")
    .select(
      `
      *,
      profiles!inner (
        organization_name
      )
    `
    )
    .eq("user_id", session.user.id)
    .single()

  // If user doesn't have an organization name, redirect to step 1
  if (!brand?.profiles?.organization_name) {
    redirect("/onboarding/brand/step1")
  }

  // If user already has a Stripe customer ID and has completed onboarding, redirect to dashboard
  if (brand?.stripe_customer_id) {
    const customer = await stripe.customers.retrieve(brand.stripe_customer_id)
    if (
      !("deleted" in customer) &&
      customer.invoice_settings.default_payment_method
    ) {
      redirect("/dashboard")
    }
  }

  let setupIntent
  try {
    // Create or get setup intent
    if (!brand?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
          brand_id: brand.id,
        },
      })

      await supabase
        .from("brands")
        .update({ stripe_customer_id: customer.id })
        .eq("id", brand.id)

      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ["card"],
      })
    } else {
      // Existing customer - create new setup intent
      setupIntent = await stripe.setupIntents.create({
        customer: brand.stripe_customer_id,
        payment_method_types: ["card"],
      })
    }
  } catch (error) {
    console.error("Stripe setup error:", error)
    throw new Error("Failed to setup payment")
  }

  if (!setupIntent?.client_secret) {
    throw new Error("Failed to create setup intent")
  }

  return (
    <Step2Form
      clientSecret={setupIntent.client_secret}
      userId={session.user.id}
    />
  )
}
