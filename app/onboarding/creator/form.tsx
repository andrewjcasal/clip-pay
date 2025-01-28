"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { loadConnectAndInitialize } from "@stripe/connect-js"

type OnboardingStep = "profile" | "verification" | "platforms" | "complete"

export default function CreatorOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile")
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [profile, setProfile] = useState({
    organizationName: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [stripeConnect, setStripeConnect] = useState<any>(null)

  useEffect(() => {
    const checkEmailVerification = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsEmailVerified(user?.email_confirmed_at != null)
    }

    checkEmailVerification()
  }, [])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/creator/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationName: profile.organizationName }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push("/creator/dashboard")
    } catch (error) {
      console.error("Setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Set up your profile
              </h2>
              <p className="text-zinc-400">Enter your organization details</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-zinc-300">
                  Organization Name
                </Label>
                <Input
                  id="organizationName"
                  value={profile.organizationName}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      organizationName: e.target.value,
                    }))
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                  placeholder="Your organization name"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-[#5865F2]"
              >
                {isLoading ? "Setting up..." : "Continue"}
              </Button>
            </div>
          </div>
        )

      case "verification":
        if (!clientSecret || !stripeConnect) return null

        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Complete Your Setup
              </h2>
              <p className="text-zinc-400">
                Please complete the verification process
              </p>
            </div>

            <div className="bg-[#1E1F22] rounded-lg p-4">
              <ConnectComponentsProvider stripe={stripeConnect}>
                <ConnectAccountOnboarding clientSecret={clientSecret} />
              </ConnectComponentsProvider>
            </div>
          </div>
        )

      case "platforms":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">
                Connect your platforms
              </h2>
              <p className="text-zinc-400">Link your social media accounts</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  // Add platform connection logic here
                  setCurrentStep("complete")
                }}
                className="w-full bg-[#5865F2]"
              >
                Connect Platforms
              </Button>
            </div>
          </div>
        )

      case "complete":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">All set!</h2>
              <p className="text-zinc-400">Your profile is ready to go</p>
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-[#5865F2]"
            >
              Go to Dashboard
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md border-none bg-[#2B2D31]">
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>
    </div>
  )
}
