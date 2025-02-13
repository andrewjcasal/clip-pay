"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { skipPaymentSetup } from "@/app/actions/brand"
import Image from "next/image"

// Load stripe outside of component to avoid recreating strip object on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Step2FormProps {
  clientSecret: string
}

function PaymentForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isElementReady, setIsElementReady] = useState(false)
  const router = useRouter()
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

      // Confirm the setup
      await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/onboarding/brand/confirmation`,
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

      <div className="text-sm text-[#475467] space-y-4">
        <p>
          Add a payment method to verify your brand and start working with
          creators. Your card will only be charged when you approve a creator's
          submission.
        </p>
      </div>

      <div className="bg-white rounded-lg relative min-h-[200px]">
        {!isElementReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="animate-pulse space-y-4 w-full px-4">
              <div className="h-10 bg-gray-100 rounded w-full"></div>
              <div className="h-10 bg-gray-100 rounded w-2/3"></div>
              <div className="h-10 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        )}
        <PaymentElement onReady={() => setIsElementReady(true)} />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleSkip}
          disabled={isLoading}
          variant="outline"
          className="dark:text-white flex-1 h-11 border-[#CBD5E1] hover:border-[#5865F2] text-[#1D2939] hover:text-[#5865F2] hover:bg-transparent"
        >
          Skip for Now
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 bg-black hover:bg-black/90 text-white"
          disabled={isLoading || !isElementReady}
        >
          {isLoading ? "Setting up..." : "Set up payments"}
        </Button>
      </div>
    </form>
  )
}

export function Step2Form({ clientSecret }: Step2FormProps) {
  const [isStripeLoaded, setIsStripeLoaded] = useState(false)

  useEffect(() => {
    // Check if Stripe is loaded
    stripePromise.then(() => setIsStripeLoaded(true))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Set up payments</h1>
          <p className="text-base text-[#475467]">
            Add a payment method to get verified status
          </p>
        </div>

        {isStripeLoaded ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#000000",
                  colorBackground: "#FFFFFF",
                  colorText: "#1D2939",
                  colorDanger: "#EF4444",
                  fontFamily: "inherit",
                  borderRadius: "0.5rem",
                },
              },
              loader: "always",
            }}
          >
            <PaymentForm />
          </Elements>
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-2/3"></div>
            <div className="h-10 bg-gray-100 rounded w-1/2"></div>
          </div>
        )}
      </div>
    </div>
  )
}
