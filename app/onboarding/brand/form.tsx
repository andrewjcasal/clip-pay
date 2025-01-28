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

interface BrandOnboardingClientProps {
  userEmail: string
}

export function BrandOnboardingClient({
  userEmail,
}: BrandOnboardingClientProps) {
  const [organizationName, setOrganizationName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ organization_name: organizationName })
        .eq("email", userEmail)

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      console.error("Error in brand onboarding:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
