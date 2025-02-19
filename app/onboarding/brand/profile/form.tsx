"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBrandProfile } from "@/app/actions/brand"
import Image from "next/image"

export function Step1Form() {
  const [organizationName, setOrganizationName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateBrandProfile(organizationName)

      if (result.success) {
        router.push("/onboarding/brand/payments")
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (err) {
      setError("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Brand Details</h1>
          <p className="text-base text-[#475467]">
            Tell us about your organization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <Label
              htmlFor="organizationName"
              className="text-sm font-medium text-[#1D2939]"
            >
              Organization Name
            </Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black placeholder:text-[#475467]"
              placeholder="Enter your organization name"
              required
            />
          </div>

          <div className="text-sm text-[#475467] space-y-4">
            <p>
              Next, you'll have the option to add a payment method. This will be
              used to:
            </p>
            <ul className="list-disc pl-4 space-y-2">
              <li>Pay creators for their approved submissions</li>
              <li>Ensure timely payouts for successful campaigns</li>
              <li>Build trust with creators (verified payment status)</li>
            </ul>
            <p>
              You can skip the payment setup for now, but your brand won't be
              marked as verified until you add a payment method.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  )
}
