"use client"

import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, LogOut } from "lucide-react"

interface LeftNavProps {
  userType: "creator" | "brand"
  email: string
}

export function LeftNav({ userType, email }: LeftNavProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/signin")
  }

  return (
    <div className="w-64 bg-[#2B2D31] border-r border-zinc-800 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">Creator Pay</h1>
        <p className="text-sm text-zinc-400">
          {userType === "creator" ? "Creator" : "Brand"} Platform
        </p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          {userType === "creator" && (
            <>
              <Link
                href="/submissions"
                className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                Submissions
              </Link>
              <Link
                href="/refer"
                className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                Refer & Earn
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="space-y-4">
          <Link
            href="/settings"
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <div className="flex-1 truncate">
              <div className="text-sm">{email}</div>
              <div className="text-xs text-zinc-500">Account Settings</div>
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}
