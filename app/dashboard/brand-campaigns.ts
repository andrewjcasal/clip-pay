import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign, CampaignWithSubmissions } from "./page"

interface Submission {
  id: string
  video_url: string
  file_path: string | null
  transcription: string
  creator_id: string
  status: string
  created_at: string
  views: number
  creator: {
    full_name: string
    email: string
  }
}

export interface CampaignWithSubmissions extends Campaign {
  submissions: Submission[]
  activeSubmissionsCount: number
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

  // Transform the data to match the expected format
  return campaigns.map((campaign: any) => ({
    id: campaign.id,
    title: campaign.title,
    budget_pool: String(campaign.budget_pool),
    rpm: String(campaign.rpm),
    guidelines: campaign.guidelines,
    status: campaign.status,
    brand: {
      name: profile.name,
    },
    submission: null,
    submissions: (campaign.submissions || []).map((submission: any) => ({
      id: submission.id,
      video_url: submission.video_url || "",
      file_path: submission.file_path,
      status: submission.status,
      campaign_id: campaign.id,
      creator: {
        full_name: submission.creator?.full_name || "",
        email: submission.creator?.email || "",
      },
    })),
    activeSubmissionsCount: (campaign.submissions || []).filter(
      (s: any) => s.status === "active"
    ).length,
  }))
}
