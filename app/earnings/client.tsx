"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface Transaction {
  id: string
  amount: number
  status: string
  created: number
  arrival_date: number | null
  description: string | null
  type: string
}

interface EarningsClientProps {
  hasStripeAccount: boolean
  totalEarned: number
  availableForPayout: number
  pendingEarnings: number
  submissions: Array<{
    id: string
    campaign_title: string
    brand_name: string
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!hasStripeAccount) return

      setIsLoading(true)
      try {
        const response = await fetch("/api/stripe/transactions")
        const data = await response.json()
        if (response.ok) {
          setTransactions(data.transactions)
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [hasStripeAccount])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-black" />
            <h3 className="text-sm font-medium text-zinc-900">Total Earned</h3>
          </div>
          <p className="text-2xl font-semibold text-zinc-900">
            ${totalEarned.toFixed(2)}
          </p>
        </div>

        <div className="col-span-2 bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Bank Account Status
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                {hasStripeAccount
                  ? "Your bank account is connected and ready to receive payments"
                  : "Link your bank account to start receiving payments"}
              </p>
            </div>
            {hasStripeAccount ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              </div>
            ) : (
              <Button
                onClick={() => (window.location.href = "/api/stripe/connect")}
                className="bg-black hover:bg-black/90 text-white"
              >
                Connect Now
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Recent Activity
          </h2>
          {availableForPayout > 0 && hasStripeAccount && (
            <Button
              onClick={() => (window.location.href = "/api/stripe/payout")}
              className="bg-black hover:bg-black/90 text-white"
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
                className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200"
              >
                <div>
                  <h3 className="font-medium text-zinc-900">
                    {submission.campaign_title}
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {submission.brand_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-900">
                    ${submission.earned.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm capitalize ${
                      submission.status === "fulfilled"
                        ? "text-emerald-600"
                        : submission.status === "approved"
                          ? "text-blue-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {submission.status === "fulfilled"
                      ? "Paid"
                      : submission.status === "approved"
                        ? "Ready for Payment"
                        : "Pending"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-600">
              No earnings activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
