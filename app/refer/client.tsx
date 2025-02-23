"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { StripeConnectBanner } from "@/components/stripe-connect-banner"

interface ReferredCreator {
  user_id: string
  organization_name: string | null
  created_at: string
  creators:
    | {
        total_earned: number | null
      }[]
    | null
}

interface ReferralClientProps {
  referralCode: string
  referredCreators: ReferredCreator[]
  hasStripeAccount: boolean
}

export function ReferralClient({
  referralCode,
  referredCreators,
  hasStripeAccount,
}: ReferralClientProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success("Referral code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate total earnings from referrals
  const totalReferralEarnings = referredCreators.reduce((total, creator) => {
    return total + (creator.creators?.[0]?.total_earned || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Refer Creators</h1>
        <p className="text-zinc-600">
          Share your referral code with other creators and earn a bonus on their
          earnings
        </p>
      </div>

      {!hasStripeAccount && (
        <StripeConnectBanner
          totalEarnings={totalReferralEarnings}
          context="referral"
        />
      )}

      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            Your Referral Code
          </h2>
          <div className="flex items-center gap-4">
            <code className="bg-zinc-50 text-zinc-900 px-4 py-2 rounded-lg flex-1 border border-zinc-200">
              {referralCode}
            </code>
            <Button
              onClick={handleCopy}
              className="bg-black hover:bg-black/90 text-white"
            >
              Copy Code
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">
            How it Works
          </h2>
          <div className="space-y-4 text-zinc-600">
            <p>1. Share your referral code with other creators</p>
            <p>
              2. When they sign up using your code, they become your referral
            </p>
            <p>
              3. You earn a percentage of the RPM whenever your referrals submit
              content
            </p>
            <p>4. Track your referral earnings in the Earnings page</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">
          Referred Creators
        </h2>
        <div className="space-y-4">
          {referredCreators.length > 0 ? (
            referredCreators.map((creator) => (
              <div
                key={creator.user_id}
                className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200"
              >
                <div>
                  <h3 className="font-medium text-zinc-900">
                    {creator.organization_name || "Unnamed Creator"}
                  </h3>
                  <p className="text-sm text-zinc-600">
                    Joined{" "}
                    {formatDistanceToNow(new Date(creator.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-900">
                    ${(creator.creators?.[0]?.total_earned || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-600">Total Earned</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-600">
              No referred creators yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
