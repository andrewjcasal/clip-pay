"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface EarningsClientProps {
  hasStripeAccount: boolean
  totalEarned: number
  availableForPayout: number
  pendingEarnings: number
  submissions: Array<{
    id: string
    campaign_title: string
    earned: number
    status: string
    created_at: string
  }>
}

export function EarningsClient({
  hasStripeAccount,
  totalEarned,
  availableForPayout,
  pendingEarnings,
  submissions,
}: EarningsClientProps) {
  return (
    <div className="space-y-6">
      {!hasStripeAccount && (
        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Connect Your Bank Account
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Link your bank account to start receiving payments
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/api/stripe/connect")}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Connect Now
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-[#5865F2]" />
            <h3 className="text-sm font-medium text-zinc-400">Total Earned</h3>
          </div>
          <p className="text-2xl font-semibold text-white">
            ${totalEarned.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-medium text-zinc-400">
              Available for Payout
            </h3>
          </div>
          <p className="text-2xl font-semibold text-white">
            ${availableForPayout.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-medium text-zinc-400">
              Pending Earnings
            </h3>
          </div>
          <p className="text-2xl font-semibold text-white">
            ${pendingEarnings.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          {availableForPayout > 0 && hasStripeAccount && (
            <Button
              onClick={() => (window.location.href = "/api/stripe/payout")}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Cash Out (${availableForPayout.toFixed(2)})
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 bg-black/20 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-white">
                    {submission.campaign_title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    ${submission.earned.toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-400">{submission.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-400">
              No earnings activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
