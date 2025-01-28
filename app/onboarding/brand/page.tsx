import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { BrandOnboardingClient } from "./client"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export default async function BrandOnboarding() {
  console.log("Secret Key:", process.env.STRIPE_SECRET_KEY?.slice(-4))
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_name, stripe_customer_id")
    .eq("id", session.user.id)
    .single()

  // If user already has an organization name, redirect to dashboard
  if (profile?.organization_name) {
    redirect("/dashboard")
  }

  let setupIntent
  try {
    // Create or get setup intent
    if (!profile?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      })
      console.log("Created customer:", customer.id)

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", session.user.id)

      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ["card"],
      })
      console.log("Created setup intent:", setupIntent.id)
    } else {
      // Existing customer - create new setup intent
      setupIntent = await stripe.setupIntents.create({
        customer: profile.stripe_customer_id,
        payment_method_types: ["card"],
      })
    }
  } catch (error) {
    console.error("Detailed Stripe error:", error)
  }

  if (!setupIntent?.client_secret) {
    throw new Error("Failed to create setup intent")
  }
  console.log(
    "Setup intent client secret:",
    setupIntent.client_secret.slice(-10)
  )

  return (
    <BrandOnboardingClient
      userEmail={session.user.email as string}
      clientSecret={setupIntent.client_secret}
    />
  )
}
