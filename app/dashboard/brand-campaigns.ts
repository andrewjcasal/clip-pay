import { createServerSupabaseClient } from "@/lib/supabase-server"
import { CampaignWithSubmissions } from "./page"

export const getBrandCampaigns = async (): Promise<
  CampaignWithSubmissions[]
> => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No user found")
  }

  // First get the brand ID and profile
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!profile || !brand) {
    throw new Error("Brand or profile not found")
  }

  // Get all campaigns with submissions
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      submissions (
        id,
        campaign_id,
        user_id,
        video_url,
        file_path,
        transcription,
        status,
        created_at,
        views
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Brand campaigns error:", error)
    throw error
  }

  if (!campaigns) {
    return []
  }

  // Get all creator IDs from submissions
  const creatorIds = campaigns
    .flatMap((c) => c.submissions || [])
    .map((s) => s.user_id)
    .filter((id): id is string => !!id)

  // Get creator profiles
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, organization_name")
    .in("id", creatorIds)

  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: String(campaign.budget_pool),
    rpm: String(campaign.rpm),
    guidelines: campaign.guidelines || "",
    video_outline: campaign.video_outline,
    status: campaign.status || "",
    brand: {
      name: profile.organization_name || "",
      payment_verified: false,
    },
    submission: null,
    submissions: (campaign.submissions || []).map(
      (submission: {
        id: string
        user_id: string
        video_url: string | null
        file_path: string | null
        transcription: string | null
        status: string
        created_at: string
        views: number
        campaign_id: string
      }) => {
        const creator = creators?.find((c) => c.id === submission.user_id)
        return {
          id: submission.id,
          video_url: submission.video_url || "",
          file_path: submission.file_path,
          transcription: submission.transcription || "",
          status: submission.status,
          campaign_id: campaign.id,
          creator_id: submission.user_id,
          created_at: submission.created_at,
          views: submission.views || 0,
          creator: {
            full_name: creator?.organization_name || "",
            email: user.email || "",
          },
        }
      }
    ),
    activeSubmissionsCount: (campaign.submissions || []).filter(
      (s: { status: string }) => s.status === "active"
    ).length,
  }))
}
