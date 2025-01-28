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
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {displayNotifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className={`flex flex-col items-start p-4 ${
              !notification.read ? "bg-gray-50" : ""
            }`}
          >
            <div className="font-semibold">{notification.title}</div>
            <div className="text-sm text-gray-500">{notification.message}</div>
          </DropdownMenuItem>
        ))}
        {hasMore && (
          <DropdownMenuItem asChild className="p-2 text-center">
            <Link
              href="/notifications"
              className="w-full text-sm text-blue-500 hover:text-blue-600"
            >
              View all notifications
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
