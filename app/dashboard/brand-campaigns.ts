import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Campaign } from "./page"

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

export const getBrandCampaigns = async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("No session found")
  }

  // First get the brand ID and profile
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("name:organization_name")
    .eq("id", session.user.id)
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
    budget_pool: campaign.budget_pool,
    rpm: campaign.rpm,
    guidelines: campaign.guidelines,
    video_outline: campaign.video_outline,
    status: campaign.status,
    brand_id: campaign.brand_id,
    created_at: campaign.created_at,
    brand: {
      name: profile.name,
    },
    submissions: (campaign.submissions || []).map((submission: any) => ({
      id: submission.id,
      video_url: submission.video_url || "",
      file_path: submission.file_path,
      transcription: submission.transcription || "",
      creator_id: submission.creator_id,
      status: submission.status,
      created_at: submission.created_at,
      views: submission.views,
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
