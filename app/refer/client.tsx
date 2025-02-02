"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ReferralClientProps {
  referralCode: string
}

export function ReferralClient({ referralCode }: ReferralClientProps) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success("Referral code copied to clipboard")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Refer Creators</h1>
          <p className="text-zinc-400">
            Share your referral code and earn a percentage of RPM when your
            referred creators submit content
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Your Referral Code
            </h2>
            <div className="flex items-center gap-4">
              <code className="bg-[#1E1F22] text-white px-4 py-2 rounded-lg flex-1">
                {referralCode}
              </code>
              <Button
                onClick={handleCopyCode}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Copy Code
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">
              How it Works
            </h2>
            <div className="space-y-4 text-zinc-400">
              <p>1. Share your referral code with other creators</p>
              <p>
                2. When they sign up using your code, they become your referral
              </p>
              <p>
                3. You earn a percentage of the RPM whenever your referrals
                submit content
              </p>
              <p>4. Track your referral earnings in the Earnings page</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
