import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/supabase-server"
import { completeOnboardingWithPayment } from "@/app/actions/brand"
import { ConfirmationForm } from "./form"

export default async function BrandOnboardingConfirmation(props: {
  searchParams: Promise<{ setup_intent: string }>
}) {
  const searchParams = await props.searchParams
  const { setup_intent } = await searchParams // searchParams should be awaited

  // If no setup_intent in URL, redirect to step 2
  if (!setup_intent) {
    redirect("/onboarding/brand/step2")
  }

  // Complete the onboarding with the setup intent
  const result = await completeOnboardingWithPayment(searchParams.setup_intent)
  if (!result.success) {
    // If there's an error, go back to step 2
    redirect("/onboarding/brand/step2")
  }

  return <ConfirmationForm />
}
