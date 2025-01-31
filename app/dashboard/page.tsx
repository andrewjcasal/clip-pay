import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./brand-client"
import { CreatorDashboardClient } from "./creator-client"
import { getCreatorCampaigns } from "./creator-campaigns"
import { getBrandCampaigns } from "./brand-campaigns"

export interface Brand {
  name: string
}

export interface Submission {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  campaign_id: string
}

export interface Campaign {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  status: string
  brand: Brand
  submission: Submission | null
}

export interface CampaignWithSubmissions extends Campaign {
  submissions: Submission[]
  activeSubmissionsCount: number
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, user_type, organization_name, onboarding_completed")
    .eq("id", user.id)
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
  return <CreatorDashboardClient transformedCampaigns={transformedCampaigns} />
}
