import {
  createServerSupabaseClient,
  getAuthenticatedUser,
} from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./brand-client"
import { CreatorDashboardClient } from "./creator-client"

interface Brand {
  name: string
}

interface Submission {
  id: string
  video_url: string
  file_path: string | null
  transcription: string
  creator_id: string
  status: string
  created_at: string
  views: number
  profiles: {
    full_name: string
    email: string
  }
}

export interface Campaign {
  id: string
  title: string
  budget_pool: number
  rpm: number
  guidelines: string
  video_outline: string | null
  status: string
  brand_id: string
  created_at: string
  brand: Brand
}

interface CampaignWithSubmissions extends Campaign {
  submissions: Submission[]
  activeSubmissionsCount: number
}

interface CreatorCampaign extends Campaign {
  submission: {
    id: string
    status: string
    video_url: string | null
    file_path: string | null
  } | null
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }
  console.log("here A")

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_type, organization_name, onboarding_completed")
    .eq("id", session.user.id)
    .single()
  console.log("here B", profile)
  console.log("here C", session.user.id)

  // If onboarding not completed, redirect to appropriate onboarding flow
  if (!profile?.onboarding_completed) {
    redirect(
      `/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator/profile"}`
    )
  }

  // For brands, get campaigns with submissions
  if (profile?.user_type === "brand") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name:organization_name")
      .eq("id", session.user.id)
      .single()

    if (!profile) {
      console.error("Profile not found for user:", session.user.id)
      throw new Error("Profile not found")
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
      .eq("brand_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching campaigns:", error)
      throw error
    }

    // Transform the data to match the expected format
    const transformedCampaigns: CampaignWithSubmissions[] = campaigns.map(
      (campaign: any) => ({
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
          profiles: {
            full_name: submission.creator?.user?.full_name || "",
            email: submission.creator?.user?.email || "",
          },
        })),
        activeSubmissionsCount: (campaign.submissions || []).filter(
          (s: any) => s.status === "active"
        ).length,
      })
    )

    return (
      <DashboardClient
        initialCampaigns={transformedCampaigns}
        brandId={session.user.id}
      />
    )
  }

  // For creators, get available campaigns
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands (
        name:profiles!inner (
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
    .eq("submissions.creator_id", session.user.id)
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
      brand_id: campaign.brand_id,
      created_at: campaign.created_at,
      brand: {
        name: campaign.brand?.name?.organization_name || "",
      },
      submission: campaign.submission?.[0] || null,
    })
  )

  return <CreatorDashboardClient transformedCampaigns={transformedCampaigns} />
  // return null
}
