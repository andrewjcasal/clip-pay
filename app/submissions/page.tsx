import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SubmissionsClient } from "./client"
import type { Campaign } from "@/types/database"
import { updateVideoViews } from "../dashboard/page"
import { getCreatorCampaigns } from "../dashboard/creator-campaigns"

export type SubmissionWithCampaign = {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  created_at: string
  views: number
  earned: number | null
  campaign: Pick<Campaign, "id" | "title" | "rpm"> & {
    brand: {
      profile: {
        organization_name: string | null
      }
    }
  }
}

export default async function SubmissionsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: creator } = await supabase
    .from("creators")
    .select(
      "stripe_account_id, stripe_account_status, tiktok_access_token, user_id"
    )
    .eq("user_id", user.id)
    .single()

  updateVideoViews(await getCreatorCampaigns(), creator!)

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    redirect("/signin")
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(
      `
      *,
      campaign:campaigns (
        id,
        title,
        rpm,
        brand:brands (
          profile:profiles (
            organization_name
          )
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<SubmissionWithCampaign[]>()

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <DashboardHeader
        userType={profile.user_type as "creator" | "brand"}
        email={user.email || ""}
        organization_name={profile.organization_name}
      />
      <SubmissionsClient
        submissions={submissions || []}
        email={user.email || ""}
      />
    </div>
  )
}
