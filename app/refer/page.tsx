import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "../dashboard/header"
import { ReferralClient } from "./client"

export const dynamic = "force-dynamic"

export default async function ReferralPage() {
  const supabase = await createServerSupabaseClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User error:", userError)
    redirect("/signin")
  }

  // Get user profile with type
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile error:", profileError)
    redirect("/signin")
  }

  if (profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  // Get user's referral code
  let { data: referralData } = await supabase
    .from("referrals")
    .select("code")
    .eq("profile_id", user.id)
    .single()

  // If no referral code exists, create one
  if (!referralData) {
    const code = `CREATOR${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const { data: newCode, error: createError } = await supabase
      .from("referrals")
      .insert([
        {
          profile_id: user.id,
          code,
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("Error creating referral code:", createError)
      return <div>Error creating referral code</div>
    }

    referralData = newCode
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Creator Platform
              </h1>
              <p className="text-sm text-zinc-400">Share your referral code</p>
            </div>
            <DashboardHeader userType={profile.user_type} />
          </div>
        </div>
      </div>
      <ReferralClient referralCode={referralData?.code || ""} />
    </div>
  )
}
