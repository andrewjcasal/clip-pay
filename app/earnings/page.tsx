import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { EarningsClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EarningsPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user profile to check if they're a creator
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (!profile || profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  // Get total earned from all approved submissions
  const { data: totalEarnedData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", session.user.id)
    .eq("status", "approved")

  const totalEarned =
    totalEarnedData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  // Get available for payout (approved submissions that haven't been paid out)
  const { data: availableData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", session.user.id)
    .eq("status", "approved")
    .eq("paid_out", false)

  const availableForPayout =
    availableData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  // Get pending earnings (pending submissions)
  const { data: pendingData } = await supabase
    .from("submissions")
    .select("earned")
    .eq("creator_id", session.user.id)
    .eq("status", "pending")

  const pendingEarnings =
    pendingData?.reduce((sum, sub) => sum + (sub.earned || 0), 0) || 0

  // Get recent submissions with earnings
  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      `
      id,
      campaign_title,
      earned,
      status,
      created_at
    `
    )
    .eq("creator_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Earnings</h1>
      <EarningsClient
        hasStripeAccount={!!profile.stripe_account_id}
        totalEarned={totalEarned}
        availableForPayout={availableForPayout}
        pendingEarnings={pendingEarnings}
        submissions={submissions || []}
      />
    </div>
  )
}
