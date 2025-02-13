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

    // First, let's check all campaigns without joins
    const { data: allCampaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*")
    console.log("All campaigns (no joins):", allCampaigns)

    // Then check brands separately
    const { data: allBrands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
    console.log("All brands:", allBrands)

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

    // Add debug logging for campaigns length
    console.log("Number of campaigns found:", campaigns?.length || 0)

    // Log each campaign's basic info
    campaigns?.forEach((campaign, index) => {
      console.log(`Campaign ${index + 1} details:`, {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        brand_id: campaign.brand?.id,
        brand_user_id: campaign.brand?.user_id,
        brand_payment_verified: campaign.brand?.payment_verified,
      })
    })

    // Get brand profiles in a separate query
    const brandUserIds = campaigns.map((campaign) => campaign.brand.user_id)
    console.log("Brand user IDs to look up:", brandUserIds)

    const { data: brandProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, organization_name")
      .in("user_id", brandUserIds)

    if (profileError) {
      console.error("Error fetching brand profiles:", profileError)
    }

    console.log("Brand profiles:", brandProfiles)

    // Create a map for quick lookup
    const profileMap = new Map(
      brandProfiles?.map((profile) => [
        profile.user_id,
        profile.organization_name,
      ]) || []
    )

    console.log("Profile map entries:", Array.from(profileMap.entries()))
    console.log(
      "Looking up brand name for user_id:",
      campaigns[0]?.brand.user_id
    )
    console.log(
      "Found brand name:",
      profileMap.get(campaigns[0]?.brand.user_id)
    )

    // Transform the data to match the expected format
    const transformedCampaigns: CreatorCampaign[] = campaigns.map(
      (campaign: any) => {
        const brandName = profileMap.get(campaign.brand.user_id)
        console.log(`Brand name lookup for campaign ${campaign.id}:`, {
          brand_user_id: campaign.brand.user_id,
          found_name: brandName,
        })

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
