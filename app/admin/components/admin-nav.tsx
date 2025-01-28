"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/campaigns", label: "Campaigns" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-4 mb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 text-sm rounded-md transition-colors",
            pathname === link.href
              ? "bg-[#5865F2] text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
