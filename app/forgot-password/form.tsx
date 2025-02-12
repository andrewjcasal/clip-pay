"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/app/actions/auth"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await forgotPassword(email)

      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage("Check your email for the password reset link")
      }
    } catch (error) {
      setMessage("Failed to send reset link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-[#1D2939]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black"
          placeholder="anna@gmail.com"
          required
        />
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("error") || message.includes("Failed")
              ? "text-red-500"
              : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  )
}
