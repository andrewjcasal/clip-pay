import { createServerSupabaseClient } from "@/lib/supabase-server"
import { CampaignWithSubmissions } from "./page"
import { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]

interface SubmissionWithCreator {
  id: string
  video_url: string | null
  file_path: string | null
  transcription: string | null
  status: string
  created_at: string
  views: number | null
  creator_id: string
  creator: {
    organization_name: string | null
    email: string | null
  } | null
}

interface CampaignWithSubmissionsList {
  id: string
  title: string
  budget_pool: number
  rpm: number
  guidelines: string | null
  video_outline: string | null
  status: string | null
  brand_id: string
  created_at: string
  updated_at: string
  referral_bonus_rate: number
  submissions: SubmissionWithCreator[] | null
}

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
          organization_name,
          email
        )
      )
    `
    )
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })
    .returns<CampaignWithSubmissionsList[]>()

  if (error) {
    throw error
  }

  if (!campaigns) {
    return []
  }

  return campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: String(campaign.budget_pool),
    rpm: String(campaign.rpm),
    guidelines: campaign.guidelines || "",
    video_outline: campaign.video_outline,
    status: campaign.status || "",
    brand: {
      name: profile.name || "",
      payment_verified: false,
    },
    submission: null,
    submissions: (campaign.submissions || []).map((submission) => ({
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
        full_name: submission.creator?.organization_name || "",
        email: submission.creator?.email || "",
      },
    })),
    activeSubmissionsCount: (campaign.submissions || []).filter(
      (s) => s.status === "active"
    ).length,
  }))
}
