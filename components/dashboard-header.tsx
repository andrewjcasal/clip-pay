"use client"

import { Bell, Settings, LogOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

interface DashboardHeaderProps {
  userType: "creator" | "brand"
  email: string
  onRefresh?: () => void
  showRefreshButton?: boolean
  refreshButtonText?: string
}

export function DashboardHeader({
  userType,
  email,
  onRefresh,
  showRefreshButton,
  refreshButtonText,
}: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/signin")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <div className="border-b border-zinc-800 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="hover:opacity-80 transition-opacity flex items-center gap-3"
            >
              <h1 className="text-2xl font-bold text-white">Clip Pay</h1>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  userType === "creator"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {userType === "creator" ? "Creator" : "Brand"}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            {userType === "creator" ? (
              <>
                <Link
                  href="/submissions"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  My Submissions
                </Link>
                <Link
                  href="/earnings"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Earnings
                </Link>
                <Link
                  href="/refer"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Refer
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/payouts"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Payouts
                </Link>
              </>
            )}
            <div className="flex items-center gap-4 ml-4 border-l border-zinc-800 pl-4">
              <Link href="/notifications">
                <Bell className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-[#2B2D31] border-zinc-800 text-white"
                >
                  <div className="px-3 py-2 text-sm text-zinc-400 truncate border-b border-zinc-800">
                    {email}
                  </div>
                  <DropdownMenuItem
                    className="text-zinc-400 hover:text-white focus:text-white focus:bg-zinc-800"
                    onClick={() => router.push("/settings")}
                  >
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
