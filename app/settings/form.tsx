"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  updateUserEmail,
  updateUserPassword,
  updateAutoApproval,
} from "./actions"
import { ArrowRight, Shield } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PaymentMethodDisplay } from "./payment-method"
import { Switch } from "@/components/ui/switch"

interface SettingsFormProps {
  email: string
  userType: "creator" | "brand"
  hasStripeAccount: boolean
  autoApprovalEnabled?: boolean
}

export function SettingsForm({
  email,
  userType,
  hasStripeAccount,
  autoApprovalEnabled = false,
}: SettingsFormProps) {
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isAutoApprovalEnabled, setIsAutoApprovalEnabled] =
    useState(autoApprovalEnabled)

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
      setShowEmailDialog(false)
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
      setShowPasswordDialog(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password"
      )
    }
  }

  return (
    <div className="divide-y divide-zinc-200">
      {/* Email Section */}
      <div className="py-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Email</h3>
          <p className="text-sm text-zinc-600 mt-1">{email}</p>
        </div>
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
              size="sm"
            >
              Change email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change email address</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateEmail} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="email">New Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1.5"
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
                  className="mt-1.5"
                  placeholder="Confirm new email address"
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmailDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newEmail || !confirmEmail}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
                >
                  Update Email
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Section */}
      <div className="py-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Password</h3>
          <p className="text-sm text-zinc-600 mt-1">
            Last changed 3 months ago
          </p>
        </div>
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
              size="sm"
            >
              Change password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5"
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
                  className="mt-1.5"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newPassword || !confirmPassword}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Auto-Approval Section for Brands */}
      {userType === "brand" && (
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-zinc-900">
                  Auto-Approval Settings
                </h3>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                  Beta
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-1">
                Automatically approve or reject submissions based on your
                campaign requirements
              </p>
            </div>
            <Switch
              checked={isAutoApprovalEnabled}
              onCheckedChange={async (checked) => {
                try {
                  await updateAutoApproval(checked)
                  setIsAutoApprovalEnabled(checked)
                  toast.success(
                    checked
                      ? "Auto-approval enabled successfully"
                      : "Auto-approval disabled successfully"
                  )
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to update auto-approval settings"
                  )
                }
              }}
            />
          </div>
          {isAutoApprovalEnabled && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                When enabled, submissions will be automatically approved if they
                meet your campaign requirements. This includes minimum view
                count, engagement rate, and other metrics you've specified.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Settings Section for Brands */}
      {userType === "brand" && (
        <div className="py-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-zinc-900">
              Payment Method
            </h3>
          </div>
          <PaymentMethodDisplay />
        </div>
      )}

      {/* Payment Settings Section for Creators */}
      {userType === "creator" && (
        <div className="py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-900">
                Payment Settings
              </h3>
              {hasStripeAccount ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 mt-1">
              Manage your bank account for receiving payments
            </p>
          </div>
          {hasStripeAccount ? (
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
              size="sm"
              onClick={() => (window.location.href = "/earnings")}
            >
              View earnings
            </Button>
          ) : (
            <Button
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
              size="sm"
              onClick={() => (window.location.href = "/api/stripe/connect")}
            >
              Connect bank
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
