"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { SubmissionWithDetails } from "./page"
import { ExternalLink, DollarSign, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { loadStripe } from "@stripe/stripe-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface PayoutsClientProps {
  submissions: SubmissionWithDetails[]
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function PayoutsClient({ submissions }: PayoutsClientProps) {
  const router = useRouter()
  const [processingPayment, setProcessingPayment] = useState(false)
  const [verifiedViews, setVerifiedViews] = useState<Record<string, number>>({})
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithDetails | null>(submissions[0] || null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const handleProcessPayment = async (submissionId: string) => {
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          verifiedViews: verifiedViews[submissionId],
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/signin")
          return
        }
        throw new Error(data.error || "Failed to process payment")
      }

      const { clientSecret, transactionId } = data

      // Show loading state
      toast.loading("Processing payment...")

      // Confirm the payment on the server
      const confirmResponse = await fetch("/api/payouts/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split("_secret_")[0],
        }),
        credentials: "include",
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || "Failed to confirm payment")
      }

      if (confirmData.status === "succeeded") {
        // Payment successful
        toast.dismiss()
        toast.success("Payment processed successfully")

        // Refresh the page to update the list
        router.refresh()
      } else {
        throw new Error(`Payment failed with status: ${confirmData.status}`)
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.dismiss()
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      )
    } finally {
      setProcessingPayment(false)
    }
  }

  const calculatePaymentAmount = (views: number, rpm: number) => {
    return (views * rpm) / 1000
  }

  const calculateServiceFee = (paymentAmount: number) => {
    return paymentAmount * 0.2 // 20% service fee
  }

  const calculateTotalCost = (paymentAmount: number) => {
    return paymentAmount + calculateServiceFee(paymentAmount)
  }

  const isPaymentTooLow = (
    paymentAmount: number,
    totalCreatorEarnings: number
  ) => {
    // Individual submission must be at least $10 and total earnings must be at least $25
    return paymentAmount < 10 || totalCreatorEarnings < 25
  }

  // Calculate total earnings for a creator
  const calculateTotalCreatorEarnings = (creatorId: string) => {
    return submissions
      .filter((sub) => sub.creator.user_id === creatorId)
      .reduce((total, sub) => {
        const earnings = calculatePaymentAmount(
          sub.views,
          Number(sub.campaign.rpm)
        )
        return total + earnings
      }, 0)
  }

  const handleViewsChange = (submissionId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setVerifiedViews((prev) => ({
      ...prev,
      [submissionId]: numValue,
    }))
  }

  if (submissions.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
            <DollarSign className="w-10 h-10 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-zinc-900">
              No pending payouts
            </h2>
            <p className="text-zinc-600">
              When creators submit content and you approve it, you'll see
              pending payouts here ready to be processed.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-black hover:bg-black/90 text-white"
          >
            View Campaigns
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh)]">
      {/* Left Panel - Submissions List */}
      <div className="w-[30%] border-r border-zinc-200 overflow-y-auto">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            Pending Payouts
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            {submissions.length} submissions awaiting payment
          </p>
        </div>
        <div className="divide-y divide-zinc-200">
          {submissions.map((submission) => (
            <button
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className={cn(
                "w-full text-left p-4 hover:bg-zinc-50 transition-colors",
                selectedSubmission?.id === submission.id && "bg-zinc-50"
              )}
            >
              <div className="space-y-1">
                <h3 className="font-medium text-zinc-900 line-clamp-1">
                  {submission.campaign.title}
                </h3>
                <p className="text-sm text-zinc-600">
                  by{" "}
                  {submission.creator.profile.organization_name ||
                    "Unknown Creator"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-zinc-500">
                    Due{" "}
                    {formatDistanceToNow(
                      new Date(submission.payout_due_date!),
                      { addSuffix: true }
                    )}
                  </span>
                  <span className="text-sm font-medium text-zinc-900">
                    ${Number(submission.campaign.rpm).toFixed(2)} RPM
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Payment Processing */}
      <div className="flex-1 overflow-y-auto">
        {selectedSubmission ? (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  {selectedSubmission.campaign.title}
                </h1>
                <p className="text-zinc-600 mt-2">
                  Process payment for{" "}
                  {selectedSubmission.creator.profile.organization_name ||
                    "Unknown Creator"}
                </p>
              </div>

              <div className="space-y-3">
                {/* Video Section */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Submission Video - 1/3 width */}
                  {selectedSubmission.file_path && (
                    <div
                      className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 p-3 rounded-lg cursor-pointer hover:bg-zinc-100"
                      onClick={() => {
                        setSelectedVideo(
                          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${selectedSubmission.file_path}`
                        )
                        setVideoModalOpen(true)
                      }}
                    >
                      <Video className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 mb-0.5">
                          Submission Video
                        </p>
                        <p className="text-sm text-zinc-600 hover:text-zinc-900 truncate block">
                          Click to view video
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Public Video URL - 2/3 width */}
                  {selectedSubmission.video_url && (
                    <div className="col-span-2 flex items-center gap-2 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                      <ExternalLink className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 mb-0.5">
                          Public Video URL
                        </p>
                        <a
                          href={selectedSubmission.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-600 hover:text-zinc-900 truncate block"
                        >
                          {selectedSubmission.video_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Modal */}
                <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                  <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-zinc-200">
                    <VisuallyHidden>
                      <DialogTitle>Submission Video Preview</DialogTitle>
                    </VisuallyHidden>
                    <div className="aspect-video w-full bg-black">
                      {selectedVideo && (
                        <VideoPlayer url={selectedVideo} autoPlay={true} />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-zinc-600 mb-1">
                        Campaign Stats
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-zinc-500">RPM:</span>{" "}
                          <span className="font-semibold text-zinc-900">
                            $
                            {Number(selectedSubmission.campaign.rpm).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-zinc-200" />
                        <div>
                          <span className="text-sm text-zinc-500">Budget:</span>{" "}
                          <span className="font-semibold text-zinc-900">
                            $
                            {Number(
                              selectedSubmission.campaign.budget_pool
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-zinc-200" />
                        <div>
                          <span className="text-sm text-zinc-500">Views:</span>{" "}
                          <span className="font-semibold text-zinc-900">
                            {selectedSubmission.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubmission.creator.profile.referred_by && (
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                  <p className="text-sm text-zinc-600 mb-1">Referred by</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {selectedSubmission.creator.profile.organization_name ||
                      "Unknown Creator"}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Will receive $
                    {Number(
                      selectedSubmission.campaign.referral_bonus_rate
                    ).toFixed(2)}{" "}
                    per 1,000 views
                  </p>
                </div>
              )}

              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-900">
                    Payment Calculation
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    {selectedSubmission.views.toLocaleString()} views × $
                    {Number(selectedSubmission.campaign.rpm).toFixed(2)} for
                    every 1,000 views
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-zinc-600">Creator Payment</p>
                    <p className="text-sm font-medium text-zinc-900">
                      $
                      {calculatePaymentAmount(
                        selectedSubmission.views,
                        Number(selectedSubmission.campaign.rpm)
                      ).toFixed(2)}
                    </p>
                  </div>
                  {selectedSubmission.creator.profile.referred_by && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-zinc-600">
                          Referrer Payment
                        </p>
                        <span className="text-xs text-zinc-500">
                          ($
                          {Number(
                            selectedSubmission.campaign.referral_bonus_rate
                          ).toFixed(2)}
                          /1K views)
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900">
                        $
                        {(
                          (selectedSubmission.views *
                            Number(
                              selectedSubmission.campaign.referral_bonus_rate
                            )) /
                          1000
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-zinc-600">Service Fee</p>
                      <span className="text-xs text-zinc-500">(20%)</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900">
                      +$
                      {calculateServiceFee(
                        calculatePaymentAmount(
                          selectedSubmission.views,
                          Number(selectedSubmission.campaign.rpm)
                        )
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="h-px bg-zinc-200" />
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-zinc-900">
                      Total Cost
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">
                      $
                      {calculateTotalCost(
                        calculatePaymentAmount(
                          selectedSubmission.views,
                          Number(selectedSubmission.campaign.rpm)
                        )
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200">
                  {(() => {
                    const submissionEarnings = calculatePaymentAmount(
                      selectedSubmission.views,
                      Number(selectedSubmission.campaign.rpm)
                    )
                    const totalCreatorEarnings = calculateTotalCreatorEarnings(
                      selectedSubmission.creator.user_id
                    )
                    const isTooLow = isPaymentTooLow(
                      submissionEarnings,
                      totalCreatorEarnings
                    )

                    if (isTooLow) {
                      return (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-amber-600">
                            {submissionEarnings < 10
                              ? "This submission must earn at least $10.00 to be processed"
                              : totalCreatorEarnings < 25
                                ? "Total creator earnings must be at least $25.00 to process any payments"
                                : "Payment amount is too low"}
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-zinc-600">
                            Campaign Budget
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <p className="text-sm text-zinc-900 font-medium">
                              Remaining after payment:
                            </p>
                            <p className="text-sm font-semibold text-zinc-900">
                              $
                              {(
                                Number(
                                  selectedSubmission.campaign.budget_pool
                                ) - submissionEarnings
                              ).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            Only the creator payment amount is deducted from the
                            budget pool
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-600">
                            Total Creator Earnings
                          </p>
                          <p className="text-sm font-semibold text-zinc-900">
                            ${totalCreatorEarnings.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="flex justify-end items-center gap-3">
                {isPaymentTooLow(
                  calculatePaymentAmount(
                    selectedSubmission.views,
                    Number(selectedSubmission.campaign.rpm)
                  ),
                  calculateTotalCreatorEarnings(
                    selectedSubmission.creator.user_id
                  )
                ) ? (
                  <Button
                    onClick={() => setSelectedSubmission(null)}
                    className="bg-[#5865F2] dark:bg-[#5865F2] hover:bg-[#4752C4] dark:hover:bg-[#4752C4] text-white dark:text-white"
                  >
                    Acknowledge
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleProcessPayment(selectedSubmission.id)}
                    disabled={processingPayment}
                    className="bg-[#5865F2] dark:bg-[#5865F2] hover:bg-[#4752C4] dark:hover:bg-[#4752C4] text-white dark:text-white"
                  >
                    {processingPayment ? "Processing..." : "Process Payment"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-zinc-600">
              Select a submission to process payment
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
