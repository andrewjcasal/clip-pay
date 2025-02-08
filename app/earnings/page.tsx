import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { EarningsClient } from "./client"
import { DashboardHeader } from "@/components/dashboard-header"
import { createServerSupabaseClient } from "@/lib/supabase-server"

type ProfileResponse = {
  user_type: string
  creator: {
    stripe_account_id: string | null
    stripe_account_status: string | null
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EarningsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile to check if they're a creator
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      user_type,
      creator:creators (
        stripe_account_id,
        stripe_account_status
      )
    `
    )
    .eq("user_id", user.id)
    .single<ProfileResponse>()

  console.log("profile", profile)
  if (!profile || profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  // Get recent submissions with earnings
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(
      `
      id,
      status,
      payout_amount,
      created_at,
      campaign:campaigns (
        id,
        title,
        brand:brands (
          profile:profiles (
            organization_name
          )
        )
      )
    `
    )
    .eq("user_id", user.id)
    .in("status", ["fulfilled", "approved", "pending"])
    .order("created_at", { ascending: false })
    .limit(10)

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
  }
  console.log("Submissions found:", submissions)

  // Get total earned from all approved and fulfilled submissions
  const { data: totalEarnedData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", user.id)
    .in("status", ["approved", "fulfilled"])

  console.log("Total earned data:", totalEarnedData)

  const totalEarned =
    totalEarnedData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  // Get available for payout (approved submissions that haven't been paid out)
  const { data: availableData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", user.id)
    .eq("status", "approved")
    .eq("paid_out", false)

  const availableForPayout =
    availableData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  // Get pending earnings (pending submissions)
  const { data: pendingData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", user.id)
    .eq("status", "pending")

  const pendingEarnings =
    pendingData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="creator" email={user.email || ""} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <div className="max-w-[800px] mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Earnings</h1>
                <p className="text-zinc-600">
                  Manage your earnings and payouts
                </p>
              </div>
              <EarningsClient
                hasStripeAccount={
                  !!profile.creator?.stripe_account_id &&
                  profile.creator?.stripe_account_status === "active"
                }
                totalEarned={totalEarned}
                availableForPayout={availableForPayout}
                pendingEarnings={pendingEarnings}
                submissions={
                  submissions?.map((submission) => ({
                    id: submission.id,
                    campaign_title:
                      submission.campaign?.title || "Unknown Campaign",
                    brand_name:
                      submission.campaign?.brand?.profile?.organization_name ||
                      "Unknown Brand",
                    earned: submission.payout_amount || 0,
                    status: submission.status,
                    created_at: submission.created_at,
                  })) || []
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
