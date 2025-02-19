import { CampaignWithSubmissions, Submission } from "../page"
import { cn } from "@/lib/utils"
import { VideoPlayer } from "@/components/video-player"
import { formatDistanceToNow } from "date-fns"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { approveSubmission } from "../actions"
import { FormErrors } from "@/types/campaigns"

interface CampaignDetailsSlideProps {
  campaign: CampaignWithSubmissions | null
  onClose: () => void
  setCampaigns: (campaigns: CampaignWithSubmissions[]) => void
}

export function CampaignDetailsSlide({
  campaign,
  onClose,
  setCampaigns,
}: CampaignDetailsSlideProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  if (!campaign) return null

  // Add effect to select first submission when campaign changes
  useEffect(() => {
    if (campaign && campaign.submissions.length > 0) {
      const sortedSubmissions = [...campaign.submissions].sort((a, b) => {
        // Sort pending submissions to the top
        if (a.status === "pending" && b.status !== "pending") return -1
        if (a.status !== "pending" && b.status === "pending") return 1
        // Then sort by most recent
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
      setSelectedSubmission(sortedSubmissions[0])
    } else {
      setSelectedSubmission(null)
    }
  }, [campaign])

  const handleApprove = async (submissionId: string) => {
    try {
      await approveSubmission(submissionId)

      // Update local state
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) => {
          const updatedSubmissions = campaign.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "approved",
                  payout_status: "pending",
                  auto_moderation_result: submission.auto_moderation_result,
                }
              : submission
          )
          return {
            ...campaign,
            submissions: updatedSubmissions,
            activeSubmissionsCount: updatedSubmissions.filter(
              (s) => s.status === "active"
            ).length,
          }
        })
      )

      // Update selected campaign state
      setSelectedCampaign((prev) => {
        if (!prev) return null
        return {
          ...prev,
          submissions: prev.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "approved",
                  payout_status: "pending",
                  auto_moderation_result: submission.auto_moderation_result,
                }
              : submission
          ),
        }
      })

      toast.success("Submission approved successfully")
    } catch (error) {
      console.error("Error approving submission:", error)
      toast.error("Failed to approve submission")
    }
  }

  const handleReject = async (submissionId: string) => {
    try {
      await rejectSubmission(submissionId)

      // Update local state
      setCampaigns(
        campaigns.map((campaign) => ({
          ...campaign,
          submissions: campaign.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "rejected",
                  auto_moderation_result: submission.auto_moderation_result,
                }
              : submission
          ),
        }))
      )

      // Update selected campaign state
      setSelectedCampaign((prev) => {
        if (!prev) return null
        return {
          ...prev,
          submissions: prev.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "rejected",
                  auto_moderation_result: submission.auto_moderation_result,
                }
              : submission
          ),
        }
      })
    } catch (error) {
      console.error("Error rejecting submission:", error)
      toast.error("Failed to reject submission")
    }
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full md:w-[800px] lg:w-[1000px] bg-white transform transition-transform duration-300 ease-in-out shadow-xl z-[60] overscroll-contain ${
        campaign ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {campaign && (
        <div className="h-full flex flex-col bg-white">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200 bg-white">
            <h2 className="text-lg font-semibold text-zinc-900">
              Campaign Details
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Submissions List Panel - 30% width */}
            <div className="w-[30%] border-r border-zinc-200 overflow-y-auto">
              <div className="p-3">
                <h3 className="text-sm font-medium text-zinc-900 mb-2">
                  Submissions ({campaign.submissions.length})
                </h3>
                <div className="space-y-1.5">
                  {campaign.submissions
                    .sort((a, b) => {
                      // Sort pending submissions to the top
                      if (a.status === "pending" && b.status !== "pending")
                        return -1
                      if (a.status !== "pending" && b.status === "pending")
                        return 1
                      // Then sort by most recent
                      return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                      )
                    })
                    .map((submission) => (
                      <div
                        key={submission.id}
                        onClick={() => setSelectedSubmission(submission)}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors",
                          selectedSubmission?.id === submission.id
                            ? "bg-zinc-100"
                            : "hover:bg-zinc-50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm text-zinc-900 truncate">
                              {submission.creator.full_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatDistanceToNow(
                                new Date(submission.created_at)
                              )}{" "}
                              ago
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              submission.status === "approved"
                                ? "bg-green-50 text-green-700"
                                : submission.status === "rejected"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-yellow-50 text-yellow-700"
                            )}
                          >
                            {submission.status.charAt(0).toUpperCase() +
                              submission.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Main Content Panel - 70% width */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                {/* Campaign details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900">
                      {campaign.title}
                    </h2>
                    <span
                      className={cn(
                        "text-sm px-2.5 py-0.5 rounded-full font-medium",
                        campaign.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {(campaign.status || "Draft").charAt(0).toUpperCase() +
                        (campaign.status || "Draft").slice(1)}
                    </span>
                  </div>
                </div>

                <Accordion type="single" collapsible className="border-none">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="flex-row-reverse justify-end gap-2 hover:no-underline py-2 [&>svg]:text-zinc-900">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-zinc-900">
                          Campaign Details
                        </span>
                        <span
                          className="text-sm text-zinc-900"
                          data-state-hide="open"
                        >
                          Budget Pool: ${campaign.budget_pool} · RPM: $
                          {campaign.rpm}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-3">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900 mb-2">
                            Guidelines
                          </h4>
                          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                            <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                              {campaign.guidelines}
                            </p>
                          </div>
                        </div>

                        {campaign.video_outline && (
                          <div>
                            <h4 className="text-sm font-medium text-zinc-900 mb-2">
                              Video Outline (Content Brief)
                            </h4>
                            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                              <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                                {campaign.video_outline}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {selectedSubmission && (
                  <div className="border-t border-zinc-200 pt-3">
                    <h3 className="text-base font-medium text-zinc-900 mb-2">
                      Selected Submission
                    </h3>
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
                      {selectedSubmission.file_path && (
                        <VideoPlayer
                          url={selectedSubmission.file_path}
                          isSupabaseStorage={true}
                        />
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-zinc-900">
                            {selectedSubmission.creator.full_name ||
                              "Anonymous"}
                          </span>
                          <span className="text-zinc-500">
                            {selectedSubmission.creator.email}
                          </span>
                          <span className="text-zinc-400">
                            submitted{" "}
                            {formatDistanceToNow(
                              new Date(selectedSubmission.created_at)
                            )}{" "}
                            ago
                          </span>
                        </div>

                        {selectedSubmission.status === "pending" ? (
                          <div className="flex gap-3">
                            <Button
                              onClick={() =>
                                handleApprove(selectedSubmission.id)
                              }
                              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handleReject(selectedSubmission.id)
                              }
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:text-red-600 dark:bg-white-600 dark:border-red-600 dark:text-red-600 dark:hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "text-sm px-4 py-3 rounded-lg",
                              selectedSubmission.status === "approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            )}
                          >
                            <div className="font-semibold mb-1">
                              {selectedSubmission.status === "approved"
                                ? "Submission Approved"
                                : "Submission Rejected"}
                            </div>
                            {selectedSubmission.auto_moderation_result
                              ?.reason && (
                              <div className="text-sm font-normal">
                                {
                                  selectedSubmission.auto_moderation_result
                                    .reason
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedSubmission.transcription && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900 mb-2">
                            Transcription
                          </h4>
                          <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                            {selectedSubmission.transcription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
