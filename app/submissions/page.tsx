import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "../dashboard/header"
import { SubmissionsClient } from "./client"

export const dynamic = "force-dynamic"

export default async function SubmissionsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) {
    console.error("Session error:", sessionError)
    redirect("/signin")
  }

  if (!user) {
    redirect("/signin")
  }

  const userType = user.user_metadata.user_type

  if (userType !== "creator") {
    redirect("/dashboard")
  }

  // Get all submissions for the creator with campaign and brand info
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
      <div className="border-b border-zinc-800 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Creator Platform
              </h1>
              <p className="text-sm text-zinc-400">
                View and manage your submissions
              </p>
            </div>
            <DashboardHeader userType={userType} />
          </div>
        </div>
      </div>
      <SubmissionsClient submissions={submissions} />
    </div>
  )
}
