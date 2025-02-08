import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { PayoutsClient } from "./client"
import { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type SubmissionRow = Tables["submissions"]["Row"]
type CampaignRow = Tables["campaigns"]["Row"]
type ProfileRow = Tables["profiles"]["Row"]

export interface SubmissionWithDetails {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  payout_due_date: string | null
  campaign: Pick<CampaignRow, "title" | "rpm" | "budget_pool"> & {
    brand: {
      profile: Pick<ProfileRow, "organization_name">
    }
  }
  creator: {
    profile: Pick<ProfileRow, "organization_name">
  }
}

export default async function PayoutsPage() {
  const supabase = await createServerSupabaseClient()
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
        brand:brands!inner (
          profile:profiles (
            organization_name
          )
        )
      ),
      creator:creators (
        profile:profiles (
          organization_name
        )
      )
    `
    )
    .eq("status", "approved")
    .eq("campaign.user_id", brand.user_id) // Filter by brand's ID
    .lte("payout_due_date", new Date().toISOString())
    .order("payout_due_date", { ascending: true })
    .returns<SubmissionWithDetails[]>()

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="brand" email={user.email || ""} />
      <main className="lg:ml-64 min-h-screen">
        <PayoutsClient submissions={submissions || []} />
      </main>
    </div>
  )
}
