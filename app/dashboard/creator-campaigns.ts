import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, Submission } from "./page"

interface CreatorCampaign extends Campaign {
  submission: Submission | null
  remaining_budget?: number
}

export const getCreatorCampaigns = async () => {
  console.log("=== Starting getCreatorCampaigns ===")
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("No user found in getCreatorCampaigns")
    throw new Error("User not authenticated")
  }
  console.log("User found:", user.id)

  try {
    console.log("Fetching campaigns with query...")
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        brand:brands!inner (
          payment_verified,
          user_id
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
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw error
    }

    console.log("Raw campaigns data:", campaigns)

    // Get brand profiles in a separate query
    const brandUserIds = campaigns.map((campaign) => campaign.brand.user_id)
    const { data: brandProfiles } = await supabase
      .from("profiles")
      .select("id, organization_name")
      .in("id", brandUserIds)

    console.log("Brand profiles:", brandProfiles)

    // Create a map for quick lookup
    const profileMap = new Map(
      brandProfiles?.map((profile) => [
        profile.id,
        profile.organization_name,
      ]) || []
    )

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

        const transformed = {
          id: campaign.id,
          title: campaign.title,
          budget_pool: String(campaign.budget_pool),
          remaining_budget: remainingBudget,
          rpm: String(campaign.rpm),
          guidelines: campaign.guidelines,
          status: campaign.status,
          video_outline: campaign.video_outline,
          brand: {
            name: profileMap.get(campaign.brand.user_id) || "Unknown Brand",
            payment_verified: campaign.brand?.payment_verified || false,
          },
          submission: campaign.submission?.[0] || null,
        }
        console.log("Transformed campaign:", transformed)
        return transformed
      }
    )

    console.log("=== Finished getCreatorCampaigns ===")
    return transformedCampaigns
  } catch (error) {
    console.error("Unexpected error in getCreatorCampaigns:", error)
    throw error
  }
}
