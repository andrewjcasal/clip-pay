import { redirect } from "next/navigation"
import { completeOnboardingWithPayment } from "@/app/actions/brand"
import { ConfirmationForm } from "./form"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export default async function BrandOnboardingConfirmation(props: {
  searchParams: Promise<{ setup_intent: string }>
}) {
  const searchParams = await props.searchParams
  const { setup_intent } = await searchParams // searchParams should be awaited

  // If no setup_intent in URL, redirect to step 2
  if (!setup_intent) {
    redirect("/onboarding/brand/step2")
  }

  try {
    // Retrieve the setup intent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent)
    if (!setupIntent.payment_method || !setupIntent.customer) {
      throw new Error("Invalid setup intent")
    }

    // Set the payment method as default for the customer
    await stripe.customers.update(setupIntent.customer as string, {
      invoice_settings: {
        default_payment_method: setupIntent.payment_method as string,
      },
    })

    // Complete the onboarding with the setup intent
    const result = await completeOnboardingWithPayment(
      searchParams.setup_intent
    )
    if (!result.success) {
      // If there's an error, go back to step 2
      redirect("/onboarding/brand/step2")
    }

    return <ConfirmationForm />
  } catch (error) {
    console.error("Error in confirmation:", error)
    redirect("/onboarding/brand/step2")
  }
}
