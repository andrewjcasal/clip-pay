import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, CampaignWithSubmissions, Submission } from "./page"

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
    .select("name:organization_name")
    .eq("id", user.id)
    .single()

  if (!profile || !brand) {
    throw new Error("Brand or profile not found")
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      submissions (
        id,
        video_url,
        file_path,
        transcription,
        status,
        created_at,
        views,
        creator_id,
        creator:creator_profiles (
          full_name:organization_name,
          email
        )
      )
    `
    )
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  interface RawSubmission {
    id: string
    video_url: string | null
    file_path: string | null
    transcription: string | null
    status: string
    campaign_id: string
    creator_id: string
    created_at: string
    views: number | null
    creator: {
      full_name: string | null
      email: string | null
    } | null
  }

  interface RawCampaign {
    id: string
    title: string
    budget_pool: number
    rpm: number
    guidelines: string
    video_outline: string | null
    status: string
    submissions: RawSubmission[] | null
  }

  return campaigns.map((campaign: RawCampaign) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: String(campaign.budget_pool),
    rpm: String(campaign.rpm),
    guidelines: campaign.guidelines,
    video_outline: campaign.video_outline,
    status: campaign.status,
    brand: {
      name: profile.name,
    },
    submission: null,
    submissions: (campaign.submissions || []).map(
      (submission: RawSubmission): Submission => ({
        id: submission.id,
        video_url: submission.video_url || "",
        file_path: submission.file_path,
        transcription: submission.transcription || "",
        status: submission.status,
        campaign_id: campaign.id,
        creator_id: submission.creator_id,
        created_at: submission.created_at,
        views: submission.views || 0,
        creator: {
          full_name: submission.creator?.full_name || "",
          email: submission.creator?.email || "",
        },
      })
    ),
    activeSubmissionsCount: (campaign.submissions || []).filter(
      (s) => s.status === "active"
    ).length,
  }))
}
