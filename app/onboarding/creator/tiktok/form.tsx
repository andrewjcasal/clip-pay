"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function TikTokAuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTikTokAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the TikTok OAuth URL from our API
      const response = await fetch("/api/tiktok/auth")
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.url) {
        throw new Error("No authentication URL returned")
      }

      // Redirect to TikTok OAuth flow
      window.location.href = data.url
    } catch (err) {
      console.error("Error initiating TikTok auth:", err)
      setError(
        err instanceof Error ? err.message : "Failed to connect with TikTok"
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">
            Connect Your TikTok Account
          </h1>
          <p className="text-base text-[#475467]">
            Link your TikTok account to automatically track views and earnings
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 rounded text-red-500">
              {error}
            </div>
          )}

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-zinc-900">Why connect TikTok?</h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-start gap-2">
                <div className="mt-1 w-1 h-1 rounded-full bg-zinc-600" />
                <span>Automatically track views on your submitted videos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 w-1 h-1 rounded-full bg-zinc-600" />
                <span>Calculate earnings based on real-time view counts</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 w-1 h-1 rounded-full bg-zinc-600" />
                <span>
                  Receive notifications when you hit earning milestones
                </span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleTikTokAuth}
            disabled={isLoading}
            className="w-full h-11 bg-white hover:bg-zinc-200 border border-zinc-400 text-black flex items-center justify-center gap-2"
          >
            <Image
              src="/tiktok.png"
              alt="TikTok"
              width={20}
              height={20}
              className="flex-shrink-0"
            />
            {isLoading ? "Connecting..." : "Connect TikTok Account"}
          </Button>

          <p className="text-xs text-center text-zinc-500">
            By connecting your account, you agree to our{" "}
            <a
              href="/legal/terms"
              className="text-blue-600 hover:text-blue-800"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/legal/privacy"
              className="text-blue-600 hover:text-blue-800"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
