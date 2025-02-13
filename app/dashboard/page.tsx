import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./brand-client"
import { CreatorDashboardClient } from "./creator-client"
import { getCreatorCampaigns } from "./creator-campaigns"
import { getBrandCampaigns } from "./brand-campaigns"

export interface Brand {
  payment_verified?: boolean
  profile?: {
    organization_name: string
  }
}

export interface Submission {
  id: string
  status: string
  video_url: string
  file_path: string | null
  campaign_id: string
  transcription: string
  user_id: string
  created_at: string
  views: number
  creator: {
    full_name: string
    email: string
  }
}

export interface Campaign {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string | null
  status: string | null
  video_outline: string | null
  brand: {
    name: string
    payment_verified: boolean
  }
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
    .select("user_type, onboarding_completed")
    .eq("user_id", user.id)
    .single()

  // If onboarding not completed, redirect to appropriate onboarding flow
  if (!profile?.onboarding_completed) {
    redirect(
      `/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator"}`
    )
  }

  let brandId: string | null = null
  if (profile?.user_type === "brand") {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id", user.id)
      .single()

    brandId = brand?.id || null
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      {profile?.user_type === "brand" && brandId ? (
        <DashboardClient
          initialCampaigns={await getBrandCampaigns()}
          brandId={brandId}
          email={user.email || ""}
        />
      ) : (
        <CreatorDashboardClient
          transformedCampaigns={await getCreatorCampaigns()}
          email={user.email || ""}
        />
      )}
    </div>
  )
}
