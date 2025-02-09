"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function OnboardingForm() {
  const [organizationName, setOrganizationName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!stripe || !elements) {
        throw new Error("Stripe not loaded")
      }

      // Get current user first to ensure we have the ID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")

      // Create brand record
      const { error: brandError } = await supabase.from("brands").insert({
        user_id: user.id,
      })

      if (brandError) throw brandError

      // Confirm the setup
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      })

      if (result.error) throw result.error

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          organization_name: organizationName,
          onboarding_completed: true,
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      router.push("/dashboard")
    } catch (error) {
      console.error("Error in brand onboarding:", error)
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded text-red-500">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="organizationName" className="text-zinc-300">
          Organization Name
        </Label>
        <Input
          id="organizationName"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="border-0 bg-[#1E1F22] text-white focus:ring-2 focus:ring-[#5865F2]"
          placeholder="Enter your organization name"
          required
        />
      </div>

      <PaymentElement />

      <Button
        type="submit"
        className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
        disabled={isLoading}
      >
        {isLoading ? "Setting up..." : "Complete Setup"}
      </Button>
    </form>
  )
}

export function BrandOnboardingClient({
  clientSecret,
}: {
  clientSecret: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <Card className="w-full max-w-md border-none bg-[#2B2D31] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Tell us about your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#5865F2",
                    colorBackground: "#1E1F22",
                    colorText: "#FFFFFF",
                  },
                },
              }}
            >
              <OnboardingForm />
            </Elements>
          ) : (
            <div>Loading...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OnboardingPage() {
  return <OnboardingForm />
}

export async function getServerSideProps() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  return {
    props: {
      accountType: "brand" as const,
      userEmail: user.email || "",
    },
  }
}
