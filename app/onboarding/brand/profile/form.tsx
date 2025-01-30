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
import { updateBrandProfile } from "@/app/actions/brand"

export function Step1Form({ userId }: { userId: string }) {
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
        router.push("/onboarding/brand/step2")
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
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <Card className="w-full max-w-md border-none bg-[#2B2D31] text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome to Creator Pay
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Let&apos;s start by setting up your brand profile
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="text-sm text-zinc-400 space-y-4">
              <p>
                Next, you&apos;ll have the option to add a payment method. This
                will be used to:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Pay creators for their approved submissions</li>
                <li>Ensure timely payouts for successful campaigns</li>
                <li>Build trust with creators (verified payment status)</li>
              </ul>
              <p>
                You can skip the payment setup for now, but your brand
                won&apos;t be marked as verified until you add a payment method.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
