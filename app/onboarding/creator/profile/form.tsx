"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCreatorProfile } from "@/app/actions/creator"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function ProfileForm() {
  const [organizationName, setOrganizationName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateCreatorProfile(
        organizationName,
        referralCode || null
      )

      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Error in creator onboarding:", error)
      setError(error instanceof Error ? error.message : "Something went wrong")
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
          <h1 className="text-2xl font-semibold text-black">
            Complete Your Profile
          </h1>
          <p className="text-base text-[#475467]">Tell us about you</p>
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
              Name
            </Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black placeholder:text-[#475467]"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="referralCode"
              className="text-sm font-medium text-[#1D2939]"
            >
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black placeholder:text-[#475467]"
              placeholder="Enter referral code if you have one"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 hover:bg-black/90 text-white dark:bg-[#5865F2] bg-[#5865F2] dark:hover:bg-[#4752C4] dark:hover:bg-[#4752C4] dark:text-white"
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  )
}
