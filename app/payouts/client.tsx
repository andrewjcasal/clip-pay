"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { SubmissionWithDetails } from "./page"

interface PayoutsClientProps {
  submissions: SubmissionWithDetails[]
}

export function PayoutsClient({ submissions }: PayoutsClientProps) {
  const [processingPayment, setProcessingPayment] = useState(false)

  const handleProcessPayment = async (submissionId: string) => {
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to process payment")
      }

      toast.success("Payment processed successfully")
      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("Failed to process payment")
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pending Payouts</h1>
          <p className="text-zinc-400 mt-2">
            Review and process payments for approved submissions that have
            reached their payout due date.
          </p>
        </div>

        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-[#2B2D31] rounded-lg">
              <p className="text-zinc-400">No pending payouts</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-[#2B2D31] rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-white">
                      {submission.campaign.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      by {submission.creator.profile.organization_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">
                      Due{" "}
                      {formatDistanceToNow(
                        new Date(submission.payout_due_date!),
                        {
                          addSuffix: true,
                        }
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">RPM</p>
                    <p className="text-xl font-semibold text-white">
                      ${Number(submission.campaign.rpm).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Views</p>
                    <p className="text-xl font-semibold text-white">
                      {submission.views.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Amount Due</p>
                    <p className="text-xl font-semibold text-white">
                      $
                      {(
                        (submission.views * Number(submission.campaign.rpm)) /
                        1000
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleProcessPayment(submission.id)}
                    disabled={processingPayment}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                  >
                    {processingPayment ? "Processing..." : "Process Payment"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
