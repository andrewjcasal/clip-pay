import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, Submission } from "./page"

interface CreatorCampaign extends Campaign {
  submission: Submission | null
  remaining_budget?: number
}

export const getCreatorCampaigns = async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands (
        payment_verified,
        brand_profile:profiles (
          organization_name
        )
      ),
      submission:submissions (
        id,
        status,
        video_url,
        file_path
      ),
      submissions:submissions (
        payout_amount,
        status
      )
      `
    )
    .eq("status", "active")
    .eq("submissions.user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching campaigns:", error)
    throw error
  }

  // Transform the data to match the expected format
  const transformedCampaigns: CreatorCampaign[] = campaigns.map(
    (campaign: any) => {
      // Calculate remaining budget
      const totalSpent =
        campaign.submissions
          ?.filter(
            (submission: { status: string }) =>
              submission.status === "fulfilled"
          )
          .reduce(
            (sum: number, submission: { payout_amount: string | null }) =>
              sum + (Number(submission.payout_amount) || 0),
            0
          ) || 0

      const remainingBudget = Number(campaign.budget_pool) - totalSpent

      return {
        id: campaign.id,
        title: campaign.title,
        budget_pool: String(campaign.budget_pool),
        remaining_budget: remainingBudget,
        rpm: String(campaign.rpm),
        guidelines: campaign.guidelines,
        status: campaign.status,
        video_outline: campaign.video_outline,
        brand: {
          name:
            campaign.brand?.brand_profile?.organization_name || "Unknown Brand",
          payment_verified: campaign.brand?.payment_verified || false,
        },
        submission: campaign.submission?.[0] || null,
      }
    }
  )

  return transformedCampaigns
}
