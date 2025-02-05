"use client"

import Link from "next/link"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

interface NavLink {
  href: string
  label: string
}

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]
interface Notification extends Omit<NotificationRow, "read"> {
  read: boolean
}

const brandLinks: NavLink[] = [
  { href: "/dashboard", label: "Campaigns" },
  { href: "/dashboard/payouts", label: "Payouts" },
  { href: "/dashboard/refer", label: "Refer" },
]

const creatorLinks: NavLink[] = [
  { href: "/dashboard", label: "Campaigns" },
  { href: "/submissions", label: "Submissions" },
  { href: "/earnings", label: "Earnings" },
  { href: "/refer", label: "Refer" },
]

export function DashboardHeader({ userType }: { userType: string }) {
  const links = userType === "brand" ? brandLinks : creatorLinks
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("read", false)
        .order("created_at", { ascending: false })

      if (!error && notifs) {
        // Transform notifications to ensure read is boolean
        const transformedNotifications = notifs.map((n) => ({
          ...n,
          read: !!n.read,
        }))
        setNotifications(transformedNotifications)
      }
    }

    // Fetch notifications immediately
    fetchNotifications()

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Refetch notifications when there's any change
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="flex items-center space-x-4">
      <nav className="flex space-x-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 text-sm transition-colors hover:text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <NotificationsDropdown notifications={notifications} />
      <UserNav />
    </div>
  )
}
