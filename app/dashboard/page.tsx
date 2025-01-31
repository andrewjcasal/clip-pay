import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./brand-client"
import { CreatorDashboardClient } from "./creator-client"
import { getCreatorCampaigns } from "./creator-campaigns"
import { getBrandCampaigns } from "./brand-campaigns"

export interface Brand {
  name: string
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

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_type, organization_name, onboarding_completed")
    .eq("id", session.user.id)
    .single()

  // If onboarding not completed, redirect to appropriate onboarding flow
  if (!profile?.onboarding_completed) {
    redirect(
      `/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator/profile"}`
    )
  }

  // For brands, get campaigns with submissions
  if (profile?.user_type === "brand") {
    const transformedCampaigns = await getBrandCampaigns()
    return (
      <DashboardClient
        initialCampaigns={transformedCampaigns}
        brandId={profile.id}
      />
    )
  }

  // For creators, get available campaigns
  const transformedCampaigns = await getCreatorCampaigns()

  return (
    <CreatorDashboardClient
      transformedCampaigns={transformedCampaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        budget_pool: String(campaign.budget_pool),
        rpm: String(campaign.rpm),
        guidelines: campaign.guidelines,
        status: campaign.status,
        brand: campaign.brand,
        submission: null,
      }))}
    />
  )
}
