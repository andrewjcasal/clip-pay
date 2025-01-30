"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js"
import { loadStripe, type SetupIntent } from "@stripe/stripe-js"
import {
  completeOnboardingWithPayment,
  skipPaymentSetup,
} from "@/app/actions/brand"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Step2FormProps {
  clientSecret: string
  userId: string
}

function PaymentForm({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSubmit")
    setIsLoading(true)
    setError(null)

    try {
      if (!stripe || !elements) {
        throw new Error("Stripe not loaded")
      }

      // Confirm the setup
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      })
    } catch (err) {
      console.error("Error in payment setup:", err)
      setError(
        err instanceof Error ? err.message : "Failed to set up payment method"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await skipPaymentSetup()

      if (result.success) {
        router.push("/dashboard")
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error("Error skipping payment setup:", err)
      setError(
        err instanceof Error ? err.message : "Failed to skip payment setup"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded text-red-500">
          {error}
        </div>
      )}

      <div className="text-sm text-zinc-400 space-y-4">
        <p>
          Add a payment method to verify your brand and start working with
          creators. Your card will only be charged when you approve a
          creator&apos;s submission.
        </p>
      </div>

      <PaymentElement />
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={isLoading}
          className="flex-1"
        >
          Skip for Now
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "Setting up..." : "Set up payments"}
        </Button>
      </div>
    </form>
  )
}

export function Step2Form({ clientSecret, userId }: Step2FormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <Card className="w-full max-w-md border-none bg-[#2B2D31] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Set up payments
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Add a payment method to get verified status
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <PaymentForm userId={userId} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  )
}
