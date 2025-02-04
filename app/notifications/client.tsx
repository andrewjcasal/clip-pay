"use client"

import { formatDistanceToNow } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]
type Notification = Omit<NotificationRow, "read"> & { read: boolean }

export function NotificationsClient({
  notifications,
}: {
  notifications: Notification[]
}) {
  const supabase = createClientComponentClient<Database>()

  const handleMarkAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false)

    if (!error) {
      window.location.reload()
    }
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white">Unread Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 bg-[#2B2D31] rounded-lg">
            No unread notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 rounded-lg bg-[#2B2D31] border-zinc-700 hover:bg-[#2E3035] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">
                    {notification.title}
                  </h3>
                  <p className="text-zinc-400">{notification.message}</p>
                </div>
                <span className="text-sm text-zinc-500">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
