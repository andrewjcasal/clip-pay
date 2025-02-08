import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { NotificationsClient, type Notification } from "./client"
import { DashboardHeader } from "../dashboard/header"
import { Database } from "@/types/supabase"

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>()

  // Transform notifications to ensure read is boolean
  const transformedNotifications = (notifications || []).map(
    (n): Notification => ({
      id: n.id,
      recipient_id: n.recipient_id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      created_at: n.created_at,
      read: !!n.seen,
    })
  )

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">
            {user.user_metadata.user_type === "brand"
              ? "Brand Platform"
              : "Creator Platform"}
          </h1>
          <DashboardHeader userType={user.user_metadata.user_type} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <NotificationsClient notifications={transformedNotifications} />
      </div>
    </div>
  )
}
