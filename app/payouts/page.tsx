import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { PayoutsClient } from "./client"
import { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type SubmissionRow = Tables["submissions"]["Row"]
type CampaignRow = Tables["campaigns"]["Row"]
type ProfileRow = Tables["profiles"]["Row"]

export interface SubmissionWithDetails extends SubmissionRow {
  campaign: Pick<CampaignRow, "title" | "rpm"> & {
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

  // Get user profile to check if they're a brand
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.user_type !== "brand") {
    redirect("/dashboard")
  }

  // Get all approved submissions past their due date
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(
      `
      *,
      campaign:campaigns (
        title,
        rpm,
        brand:brands (
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
    .lte("payout_due_date", new Date().toISOString())
    .order("payout_due_date", { ascending: true })
    .returns<SubmissionWithDetails[]>()

  console.log("abc", submissions)
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <DashboardHeader userType="brand" email={user.email || ""} />
      <PayoutsClient submissions={submissions || []} />
    </div>
  )
}
