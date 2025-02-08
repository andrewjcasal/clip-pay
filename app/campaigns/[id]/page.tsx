import { createServerSupabaseClient } from "@/lib/supabase-server"
import { PublicCampaignView } from "./public-view"
import { headers } from "next/headers"

// Ensure this page is dynamically rendered and revalidated
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Force dynamic rendering by reading headers
  headers()

  const id = (await params).id
  const supabase = await createServerSupabaseClient()

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands!inner (
        id,
        profiles (
          organization_name
        )
      ),
      submissions!campaign_id (
        payout_amount,
        status
      )
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching campaign:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Error Loading Campaign
          </h1>
          <p className="text-zinc-600">
            {error.message === "JWT token is invalid"
              ? "This campaign requires authentication."
              : "Unable to load campaign details."}
          </p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Campaign Not Found
          </h1>
          <p className="text-zinc-600">
            This campaign may have ended or doesn't exist.
          </p>
        </div>
      </div>
    )
  }

  // Calculate remaining budget pool
  const totalSpent =
    campaign.submissions
      ?.filter(
        (submission: { status: string }) => submission.status === "fulfilled"
      )
      .reduce(
        (sum: number, submission: { payout_amount: string | null }) =>
          sum + (Number(submission.payout_amount) || 0),
        0
      ) || 0

  const remainingBudget = Number(campaign.budget_pool) - totalSpent

  return (
    <PublicCampaignView
      campaign={{ ...campaign, remaining_budget: remainingBudget }}
    />
  )
}
