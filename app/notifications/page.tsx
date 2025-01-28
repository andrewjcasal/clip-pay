import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NotificationsClient } from "./client"
import { DashboardHeader } from "../dashboard/header"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/signin")
  }

  const userType = session.user.user_metadata.user_type

  // Get unread notifications for the user
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", session.user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">
            {userType === "brand" ? "Brand Platform" : "Creator Platform"}
          </h1>
          <DashboardHeader userType={userType} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <NotificationsClient notifications={notifications || []} />
      </div>
    </div>
  )
}
