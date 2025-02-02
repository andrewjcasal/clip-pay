"use client"

import { Bell, Settings, LogOut } from "lucide-react"
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
  showRefreshButton?: boolean
  refreshButtonText?: string
  onRefresh?: () => void
}

export function DashboardHeader({
  userType,
  email,
  showRefreshButton,
  refreshButtonText = "Refresh",
  onRefresh,
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
            <h1 className="text-2xl font-bold text-white">
              {userType === "creator" ? "Creator" : "Brand"} Platform
            </h1>
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
                  href="/campaigns"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Campaigns
                </Link>
                <Link
                  href="/submissions"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Submissions
                </Link>
              </>
            )}
            <div className="flex items-center gap-4 ml-4 border-l border-zinc-800 pl-4">
              {showRefreshButton && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  className="text-sm"
                >
                  {refreshButtonText}
                </Button>
              )}
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
