import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { PayoutsClient } from "./client"
import { Database } from "@/types/supabase"
import { TikTokAPI } from "@/lib/tiktok"

type Tables = Database["public"]["Tables"]
type SubmissionRow = Tables["submissions"]["Row"]
type CampaignRow = Tables["campaigns"]["Row"]
type ProfileRow = Tables["profiles"]["Row"]
type CreatorRow = Tables["creators"]["Row"]

export interface SubmissionWithDetails {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  payout_due_date: string | null
  views: number
  campaign: Pick<
    CampaignRow,
    "title" | "rpm" | "budget_pool" | "referral_bonus_rate"
  > & {
    brand: {
      profile: Pick<ProfileRow, "organization_name">
    }
  }
  creator: Array<{
    profile: Pick<ProfileRow, "organization_name" | "referred_by">
    tiktok_access_token: string | null
  }>
}

export default async function PayoutsPage() {
  const supabase = await createServerSupabaseClient()
  const tiktokApi = new TikTokAPI()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get user profile and brand details to check if they're a brand and payment verified
  const { data: brand } = await supabase
    .from("brands")
    .select(
      `
      *,
      profiles!inner (
        user_type
      )
    `
    )
    .eq("user_id", user.id)
    .single()

  if (!brand || brand.profiles?.user_type !== "brand") {
    redirect("/dashboard")
  }

  // Check if brand has completed payment setup
  if (!brand.payment_verified) {
    redirect("/onboarding/brand/payments")
  }

  // Get all approved submissions past their due date for this brand's campaigns only
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(
      `
      *,
      campaign:campaigns!inner (
        title,
        rpm,
        budget_pool,
        referral_bonus_rate,
        brand:brands!inner (
          profile:profiles (
            organization_name
          )
        )
      ),
      creator:creators (
        profile:profiles (
          organization_name,
          referred_by
        ),
        tiktok_access_token
      )
    `
    )
    .eq("status", "approved")
    .eq("campaign.user_id", brand.user_id)
    .not("video_url", "is", null)
    .lte("payout_due_date", new Date().toISOString())
    .order("payout_due_date", { ascending: true })
    .returns<SubmissionWithDetails[]>()

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  // Update views for each submission
  if (submissions) {
    for (const submission of submissions) {
      if (submission.video_url && submission.creator[0]?.tiktok_access_token) {
        try {
          const views = await tiktokApi.getVideoViews(
            submission.video_url,
            submission.creator[0].tiktok_access_token
          )

          // Update the views in the database
          await supabase
            .from("submissions")
            .update({ views })
            .eq("id", submission.id)

          // Update the views in our local submissions data
          submission.views = views
        } catch (error) {
          console.error("Error updating views for submission:", error)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="brand" email={user.email || ""} />
      <main className="lg:ml-64 min-h-screen pt-20 lg:pt-8">
        <PayoutsClient submissions={submissions || []} />
      </main>
    </div>
  )
}
