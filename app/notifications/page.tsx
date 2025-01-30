import { getAuthenticatedUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { NotificationsClient } from "./client"
import { DashboardHeader } from "../dashboard/header"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const { session, supabase } = await getAuthenticatedUser()

  const { data: notifications, error: authError } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">
            {session.user.user_metadata.user_type === "brand"
              ? "Brand Platform"
              : "Creator Platform"}
          </h1>
          <DashboardHeader userType={session.user.user_metadata.user_type} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <NotificationsClient notifications={notifications || []} />
      </div>
    </div>
  )
}
