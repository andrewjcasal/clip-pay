"use client"

import Link from "next/link"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
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
      <NotificationsDropdown notifications={[]} />
      <UserNav />
    </div>
  )
}
