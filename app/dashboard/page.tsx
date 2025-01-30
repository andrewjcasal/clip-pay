import { getAuthenticatedUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"
import { CreatorDashboardClient } from "./creator-client"

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
  brand: {
    name: string
  }
  submissions: {
    id: string
    video_url: string | null
    file_path: string | null
    transcription: string | null
    status: string
    created_at: string
    views: number
    profiles: {
      full_name: string
      email: string
    }
  }[]
}

export default async function DashboardPage() {
  const { session, supabase } = await getAuthenticatedUser()

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name, onboarding_completed")
    .eq("id", session.user.id)
    .single()

  // If onboarding not completed, redirect to appropriate onboarding flow
  if (!profile?.onboarding_completed) {
    redirect(
      `/onboarding/${profile?.user_type === "brand" ? "brand" : "creator"}`
    )
  }

  // For brands, get campaigns with submissions
  if (profile?.user_type === "brand") {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!brand) {
      console.error("Brand not found for user:", session.user.id)
      throw new Error("Brand not found")
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
          profiles (
            full_name,
            email
          )
        )
      `
      )
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching campaigns:", error)
      throw error
    }

    return <DashboardClient initialCampaigns={campaigns} brandId={brand.id} />
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
  const transformedCampaigns = campaigns.map((campaign) => ({
    ...campaign,
    brand: {
      name: campaign.brand?.name?.organization_name,
    },
    submission: campaign.submission?.[0] || null,
  }))

  return <CreatorDashboardClient transformedCampaigns={transformedCampaigns} />
}
