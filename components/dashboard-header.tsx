"use client"

import {
  Bell,
  Settings,
  LogOut,
  Home,
  FileText,
  DollarSign,
  Share2,
  X,
  Menu,
} from "lucide-react"
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
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

interface DashboardHeaderProps {
  userType: "creator" | "brand"
  email: string
}

export function DashboardHeader({ userType, email }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [showNotifications, setShowNotifications] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/signin")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const navItems =
    userType === "creator"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/submissions", label: "My Submissions", icon: FileText },
          { href: "/earnings", label: "Earnings", icon: DollarSign },
          { href: "/refer", label: "Refer", icon: Share2 },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/payouts", label: "Payouts", icon: DollarSign },
        ]

  return (
    <>
      {/* Mobile/Tablet Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <button
            onClick={() => setIsNavOpen(true)}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Left Navigation */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 z-50 transition-transform duration-300 lg:translate-x-0",
          isNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile/tablet */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setIsNavOpen(false)}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div className="p-3 border-b border-zinc-200">
            <div className="flex justify-center">
              <Link href="/dashboard">
                <Logo className="h-8 w-auto" />
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="h-px bg-zinc-200 my-4" />

            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    setShowNotifications(true)
                    setIsNavOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  Notifications
                </button>
              </li>
            </ul>
          </nav>

          {/* User Info & Settings */}
          <div className="space-y-4 p-4 border-t border-zinc-200">
            <div className="px-2">
              <span className="text-sm text-zinc-500 max-w-[180px] truncate block">
                {email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-600 hover:text-zinc-900"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white border-zinc-200"
                >
                  <DropdownMenuItem
                    className="text-zinc-600 hover:text-zinc-900 focus:text-zinc-900 focus:bg-zinc-50"
                    onClick={() => {
                      router.push("/settings")
                      setIsNavOpen(false)
                    }}
                  >
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 hover:text-red-700 focus:text-red-700 hover:bg-red-50 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => router.push("/settings")}
                className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Overlay for mobile/tablet */}
      {isNavOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-0 left-64 w-[400px] bg-white shadow-xl z-50 rounded-lg mt-2 ml-6">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900">
                  Notifications
                </h2>
                <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  2
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded-lg cursor-pointer">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      New campaign available
                    </p>
                    <p className="text-xs text-zinc-500">2 minutes ago</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
                {/* Add more notifications here */}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
