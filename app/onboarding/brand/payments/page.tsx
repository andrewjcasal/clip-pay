import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Step2Form } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // First get the profile to ensure we have an organization name
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name")
    .eq("user_id", user.id)
    .single()

  if (!profile?.organization_name) {
    redirect("/onboarding/brand/profile")
  }

  // Get brand record
  let { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // If brand record doesn't exist, create it
  if (!brand) {
    const { data: newBrand, error: insertError } = await supabase
      .from("brands")
      .insert({ user_id: user.id })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating brand:", insertError)
      throw new Error("Failed to create brand record")
    }

    brand = newBrand
  }

  // If user already has a Stripe customer ID and has completed onboarding, redirect to dashboard
  if (brand?.stripe_customer_id && brand?.payment_verified) {
    // Update profile to mark onboarding as complete
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id)

    redirect("/dashboard")
  }

  let setupIntent
  try {
    // Create or get setup intent
    if (!brand?.stripe_customer_id) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })

      // Update brand with Stripe customer ID
      await supabase
        .from("brands")
        .update({ stripe_customer_id: customer.id })
        .eq("user_id", user.id)

      // Create setup intent for new customer
      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ["card"],
      })
    } else {
      // Create setup intent for existing customer
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
