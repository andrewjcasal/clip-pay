import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, Submission } from "./page"

interface CreatorCampaign extends Campaign {
  submission: Submission | null
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
          name:profiles (
            organization_name
          )
      ),
      submission:submissions (
        id,
        status,
        video_url,
        file_path
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
    (campaign: any) => ({
      id: campaign.id,
      title: campaign.title,
      budget_pool: campaign.budget_pool,
      rpm: campaign.rpm,
      guidelines: campaign.guidelines,
      video_outline: campaign.video_outline,
      status: campaign.status,
      user_id: campaign.user_id,
      created_at: campaign.created_at,
      brand: {
        name: campaign.brand?.name?.organization_name || "",
        payment_verified: !!campaign.brand?.payment_verified,
      },
      submission: campaign.submission?.[0] || null,
    })
  )

  return transformedCampaigns
}
