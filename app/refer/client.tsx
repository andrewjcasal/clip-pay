"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ReferralClientProps {
  referralCode: string
}

export function ReferralClient({ referralCode }: ReferralClientProps) {
  const [copied, setCopied] = useState("")
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://creatorpay.com"

  const handleCopy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Referral Program
          </h1>
        </div>

        {/* Referral Code Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Your Referral Code
            </h2>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="bg-[#1E1F22] border-zinc-800 text-white"
              />
              <Button
                onClick={() => handleCopy(referralCode, "code")}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8"
              >
                {copied === "code" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Your Sign-up Link
            </h2>
            <div className="flex gap-2">
              <Input
                value={`${baseUrl}/signup?ref=${referralCode}`}
                readOnly
                className="bg-[#1E1F22] border-zinc-800 text-white"
              />
              <Button
                onClick={() =>
                  handleCopy(`${baseUrl}/signup?ref=${referralCode}`, "link")
                }
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8"
              >
                {copied === "link" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            How It Works
          </h2>
          <div className="space-y-4 text-zinc-400">
            <p className="text-lg">
              Share your referral code or sign-up link with other creators. When
              they join using your code and successfully submit content for
              campaigns, you'll earn bonus rewards!
            </p>
            <p className="text-lg">
              You can also share individual campaigns directly from the
              campaigns page to refer creators to specific opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
