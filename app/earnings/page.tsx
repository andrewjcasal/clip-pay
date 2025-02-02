import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function EarningsPage() {
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

  // Only creators can access this page
  if (profile.user_type !== "creator") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <DashboardHeader userType="creator" email={user.email || ""} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Earnings</h1>
            <p className="text-zinc-400">
              Track your earnings from video submissions and referrals
            </p>
          </div>
          {/* Earnings content will go here */}
        </div>
      </div>
    </div>
  )
}
