"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/campaigns", label: "Campaigns" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-4 py-2 text-sm font-medium rounded-md",
            pathname === item.href
              ? "bg-[#4752C4] text-white"
              : "text-zinc-300 hover:bg-[#2B2D31]"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
