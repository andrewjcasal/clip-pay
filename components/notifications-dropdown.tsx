"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
}

export function NotificationsDropdown({
  notifications,
}: {
  notifications: Notification[]
}) {
  const hasUnread = notifications.some((n) => !n.read)
  const displayNotifications = notifications.slice(0, 4)
  const hasMore = notifications.length > 4

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-zinc-400" />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#313338]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-[#2B2D31] border-zinc-700"
      >
        {displayNotifications.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400 text-center">
            No new notifications
          </div>
        ) : (
          <>
            {displayNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-4 border-b border-zinc-700 last:border-0 ${
                  !notification.read ? "bg-[#5865F2]/5" : ""
                }`}
              >
                <div className="font-semibold text-white">
                  {notification.title}
                </div>
                <div className="text-sm text-zinc-400 mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </DropdownMenuItem>
            ))}
            {hasMore && (
              <DropdownMenuItem
                asChild
                className="p-2 text-center hover:bg-[#5865F2]/5"
              >
                <Link
                  href="/notifications"
                  className="w-full text-sm text-[#5865F2] hover:text-[#5865F2]/90"
                >
                  View all notifications
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
