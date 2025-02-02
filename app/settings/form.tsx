"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface SettingsFormProps {
  email: string
  userType: "creator" | "brand"
}

export function SettingsForm({ email, userType }: SettingsFormProps) {
  const [newEmail, setNewEmail] = useState(email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error

      toast.success("Email update initiated", {
        description: "Please check your new email for a confirmation link.",
      })
    } catch (error) {
      console.error("Error updating email:", error)
      toast.error("Failed to update email", {
        description:
          error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error

      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Failed to update password", {
        description:
          error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Email Address</h2>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              New Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="border-0 bg-[#1E1F22] text-white focus:ring-2 focus:ring-[#5865F2]"
              placeholder="Enter new email address"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || newEmail === email}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            {isLoading ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </div>

      <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-zinc-300">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-0 bg-[#1E1F22] text-white focus:ring-2 focus:ring-[#5865F2]"
              placeholder="Enter new password"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !newPassword}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  )
}
