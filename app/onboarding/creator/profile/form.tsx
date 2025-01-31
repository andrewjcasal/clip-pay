"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Step1Form() {
  const [fullName, setFullName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      // If referral code provided, verify it
      let referrerId = null
      if (referralCode) {
        const { data: referralData, error: referralError } = await supabase
          .from("referrals")
          .select("profile_id")
          .eq("code", referralCode)
          .single()

        if (referralError) {
          if (referralError.code === "PGRST116") {
            setError("Invalid referral code")
            setLoading(false)
            return
          }
          throw referralError
        }
        referrerId = referralData.profile_id
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          referred_by: referrerId,
          onboarding_completed: true,
        })
        .eq("id", user?.id)

      if (updateError) throw updateError

      router.push("/dashboard")
    } catch (err) {
      console.error("Error:", err)
      setError("Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-white">
          Full Name
        </Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="bg-[#1E1F22] border-zinc-800 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralCode" className="text-white">
          Referral Code (Optional)
        </Label>
        <Input
          id="referralCode"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="bg-[#1E1F22] border-zinc-800 text-white"
          placeholder="Enter referral code if you have one"
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <Button
        type="submit"
        disabled={loading || !fullName}
        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
      >
        {loading ? "Creating Profile..." : "Continue"}
      </Button>
    </form>
  )
}
