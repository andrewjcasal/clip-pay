"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateUserEmail, updateUserPassword } from "./actions"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface SettingsFormProps {
  email: string
  userType: "creator" | "brand"
  hasStripeAccount: boolean
}

export function SettingsForm({
  email,
  userType,
  hasStripeAccount,
}: SettingsFormProps) {
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")

    if (newEmail !== confirmEmail) {
      setEmailError("Email addresses do not match")
      return
    }

    try {
      await updateUserEmail(newEmail)
      toast.success("Email updated successfully")
      setNewEmail("")
      setConfirmEmail("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      )
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    try {
      await updateUserPassword(newPassword)
      toast.success("Password updated successfully")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password"
      )
    }
  }

  return (
    <div className="space-y-8">
      {/* Email Section */}
      <div className="max-w-[550px] mx-auto">
        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">
            Email Address
          </h2>
          <div className="space-y-4">
            <div className="text-sm text-zinc-400 mb-4">
              Current email: <span className="text-white">{email}</span>
            </div>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <Label htmlFor="email">New Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-[#1E1F22] border-zinc-700 text-white mt-1"
                  placeholder="Enter new email address"
                />
              </div>
              <div>
                <Label htmlFor="confirmEmail">Confirm Email Address</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="bg-[#1E1F22] border-zinc-700 text-white mt-1"
                  placeholder="Confirm new email address"
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-400">{emailError}</p>
              )}
              <Button
                type="submit"
                disabled={!newEmail || !confirmEmail}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Update Email
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="max-w-[550px] mx-auto">
        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">Password</h2>
          <div className="space-y-4">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1E1F22] border-zinc-700 text-white mt-1"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1E1F22] border-zinc-700 text-white mt-1"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
              <Button
                type="submit"
                disabled={!newPassword || !confirmPassword}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Settings Section for Creators */}
      {userType === "creator" && (
        <div className="max-w-[550px] mx-auto">
          <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Payment Settings
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Link your bank account to receive payments for your content
                </p>
              </div>
              {hasStripeAccount ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Bank Account Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-500/20">
                  Not Connected
                </span>
              )}
            </div>

            <div className="bg-black/20 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">
                  How it works:
                </h3>
                <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4">
                  <li>Connect your bank account securely through Stripe</li>
                  <li>
                    Get paid automatically when your content reaches payout
                    thresholds
                  </li>
                  <li>Track your earnings and payouts in the Earnings page</li>
                  <li>Receive payments directly to your bank account</li>
                </ul>
              </div>

              <Link
                href="/earnings"
                className="inline-flex items-center gap-2 text-[#5865F2] hover:text-[#4752C4] text-sm"
              >
                View your earnings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-6">
              {hasStripeAccount ? (
                <Button
                  onClick={() => (window.location.href = "/earnings")}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  View Earnings Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => (window.location.href = "/api/stripe/connect")}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  Connect Bank Account
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
