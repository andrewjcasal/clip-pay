import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SubmissionsClient } from "./client"

export default async function SubmissionsPage() {
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
    .select("user_type")
    .eq("id", user.id)
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
          profiles (
            organization_name
          )
        )
      )
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError)
    return <div>Error loading submissions</div>
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <DashboardHeader
        userType={profile.user_type as "creator" | "brand"}
        email={user.email || ""}
      />
      <SubmissionsClient submissions={submissions || []} />
    </div>
  )
}
