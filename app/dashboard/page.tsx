import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./brand-client"
import { CreatorDashboardClient } from "./creator-client"
import { CreatorCampaign, getCreatorCampaigns } from "./creator-campaigns"
import { getBrandCampaigns } from "./brand-campaigns"
import { TikTokAPI } from "@/lib/tiktok"

export interface Brand {
  payment_verified?: boolean
  profile?: {
    organization_name: string
  }
}

export interface Submission {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  campaign_id: string
  transcription: string | null
  user_id: string
  created_at: string
  views: number
  creator: {
    full_name: string | null
    email: string | null
    organization_name: string | null
  }
  auto_moderation_result?: {
    approved: boolean
    reason: string
    confidence: number
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

interface Creator {
  stripe_account_id: string | null
  stripe_account_status: string | null
  tiktok_access_token: string | null
  user_id: string
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const tiktokApi = new TikTokAPI()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get user profile to check type
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, user_type, organization_name")
    .eq("user_id", user.id)
    .single()

  // If onboarding not completed, redirect to appropriate onboarding flow
  if (!profile?.onboarding_completed) {
    redirect(
      `/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator"}`
    )
  }

  let brandId: string | null = null
  let creator: Creator | null = null
  if (profile?.user_type === "brand") {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id", user.id)
      .single()

    brandId = brand?.id || null
  } else {
    // Get creator data if user is a creator
    const { data } = await supabase
      .from("creators")
      .select("stripe_account_id, stripe_account_status, tiktok_access_token")
      .eq("user_id", user.id)
      .single()

    creator = data as Creator

    // If creator has TikTok connected, update video views
    if (creator?.tiktok_access_token) {
      const campaigns = await getCreatorCampaigns()

      return (
        <div className="min-h-screen bg-[#313338]">
          {profile?.user_type === "brand" && brandId ? (
            <DashboardClient
              initialCampaigns={await getBrandCampaigns()}
              brandId={brandId}
              email={user.email || ""}
              organization_name={profile.organization_name}
            />
          ) : (
            <CreatorDashboardClient
              transformedCampaigns={campaigns}
              email={user.email || ""}
              creator={creator}
              organization_name={profile.organization_name}
            />
          )}
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      {profile?.user_type === "brand" && brandId ? (
        <DashboardClient
          initialCampaigns={await getBrandCampaigns()}
          brandId={brandId}
          email={user.email || ""}
          organization_name={profile.organization_name}
        />
      ) : (
        <CreatorDashboardClient
          transformedCampaigns={await getCreatorCampaigns()}
          email={user.email || ""}
          creator={creator}
          organization_name={profile.organization_name}
        />
      )}
    </div>
  )
}

export const updateVideoViews = async (
  campaigns: CreatorCampaign[],
  creator: Creator
) => {
  const tiktokApi = new TikTokAPI()
  const supabase = await createServerSupabaseClient()

  // Get all video URLs that need updating
  const videoUrls = campaigns
    .map((campaign) => campaign.submission?.video_url)
    .filter((url): url is string => url !== null && url !== undefined)

  if (videoUrls.length > 0 && creator.tiktok_access_token) {
    try {
      // Fetch views for all videos concurrently
      const videoInfoResults = await Promise.all(
        videoUrls.map((url) =>
          tiktokApi
            .getVideoInfo(
              url,
              creator!.tiktok_access_token as string,
              creator!.user_id
            )
            .then((info) => ({ url, info }))
        )
      )

      // Create a map of URL to video info
      const videoInfo = Object.fromEntries(
        videoInfoResults.map(({ url, info }) => [url, info])
      )

      // Update views in database concurrently
      await Promise.all(
        videoInfoResults.map(({ url, info }) =>
          supabase
            .from("submissions")
            .update({ views: info.views })
            .eq("video_url", url)
        )
      )

      // Update the campaigns with new view counts
      campaigns.forEach((campaign) => {
        if (campaign.submission?.video_url) {
          const info = videoInfo[campaign.submission.video_url]
          if (info) {
            campaign.submission.views = info.views
          }
        }
      })
    } catch (error) {
      console.error("Error updating video views:", error)
    }
  }
}
