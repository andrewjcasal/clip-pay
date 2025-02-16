import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReferralClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ReferPage() {
  const supabase = await createServerSupabaseClient()
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
    .eq("user_id", user.id)
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

  // Get referred creators
  const { data: referredCreators } = await supabase
    .from("profiles")
    .select(
      `
      user_id,
      organization_name,
      created_at,
      creators (
        total_earned
      )
    `
    )
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="creator" email={user.email || ""} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <div className="max-w-[800px] mx-auto">
            <ReferralClient
              referralCode={referralData?.code || ""}
              referredCreators={referredCreators || []}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
