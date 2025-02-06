import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Step2Form } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export default async function BrandOnboardingStep2() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  console.log("user", user)

  // Debug query
  const { data: brandDebug, error: debugError } = await supabase
    .from("brands")
    .select()
    .eq("user_id", user.id)

  console.log("Debug brand query:", { data: brandDebug, error: debugError })

  // Get brand record with organization name from profile
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*, profiles (organization_name)")
    .eq("user_id", user.id)
    .single()

  if (!brand?.profiles?.organization_name) {
    redirect("/onboarding/brand/profile")
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
        email: user.email,
        metadata: {
          user_id: user.id,
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

  return <Step2Form clientSecret={setupIntent.client_secret} />
}
