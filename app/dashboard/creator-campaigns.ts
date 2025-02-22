import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, Submission } from "./page"

export interface CreatorCampaign extends Campaign {
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

  try {
    // First, let's check all campaigns without joins
    const { data: allCampaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*")

    // Then check brands separately
    const { data: allBrands, error: brandsError } = await supabase
      .from("brands")
      .select("*")

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        brand:brands!inner (
          id,
          payment_verified,
          user_id
        ),
        submission:submissions!left (
          id,
          status,
          video_url,
          file_path,
          campaign_id,
          views
        ),
        submissions:submissions (
          payout_amount,
          status
        )
        `
      )
      .eq("status", "active")
      .eq("submission.user_id", user.id)
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

    // Get brand profiles in a separate query
    const brandUserIds = campaigns.map((campaign) => campaign.brand.user_id)

    const { data: brandProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, organization_name")
      .in("user_id", brandUserIds)

    if (profileError) {
      console.error("Error fetching brand profiles:", profileError)
    }

    // Create a map for quick lookup
    const profileMap = new Map(
      brandProfiles?.map((profile) => [
        profile.user_id,
        profile.organization_name,
      ]) || []
    )

    // Transform the data to match the expected format
    const transformedCampaigns: CreatorCampaign[] = campaigns.map(
      (campaign: any) => {
        const brandName = profileMap.get(campaign.brand.user_id)
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
            name: brandName || "Unknown Brand",
            payment_verified: campaign.brand?.payment_verified || false,
          },
          submission: campaign.submission?.[0] || null,
        }

        return transformed
      }
    )

    return transformedCampaigns
  } catch (error) {
    console.error("Unexpected error in getCreatorCampaigns:", error)
    throw error
  }
}
