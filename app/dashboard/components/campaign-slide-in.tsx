import { Button } from "@/components/ui/button"
import { RefreshCw, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { CampaignWithSubmissions, Submission } from "@/types/campaigns"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { VideoPlayer } from "@/components/video-player"
import { SetStateAction, Dispatch, useEffect } from "react"

interface CampaignSlideInProps {
  selectedCampaign: CampaignWithSubmissions | null
  setSelectedCampaign: Dispatch<SetStateAction<CampaignWithSubmissions | null>>
  isRefreshingViews: boolean
  handleApprove: (submissionId: string) => void
  handleReject: (submissionId: string) => void
  setSelectedSubmission: Dispatch<SetStateAction<Submission | null>>
  selectedSubmission: Submission | null
  setCampaigns: Dispatch<SetStateAction<CampaignWithSubmissions[]>>
  setIsRefreshingViews: Dispatch<SetStateAction<boolean>>
  updateCampaignViews: (
    campaignId: string
  ) => Promise<{ success: boolean; error?: string }>
}

export const CampaignSlideIn = ({
  selectedCampaign,
  setSelectedCampaign,
  isRefreshingViews,
  handleApprove,
  handleReject,
  setSelectedSubmission,
  selectedSubmission,
  setCampaigns,
  setIsRefreshingViews,
  updateCampaignViews,
}: CampaignSlideInProps) => {
  // Calculate remaining budget
  const calculateRemainingBudget = (campaign: CampaignWithSubmissions) => {
    const totalSpent = campaign.submissions
      .filter((submission) => submission.status === "fulfilled")
      .reduce((sum, submission) => {
        const paymentAmount = (submission.views * Number(campaign.rpm)) / 1000
        return sum + paymentAmount
      }, 0)
    const remaining = Number(campaign.budget_pool) - totalSpent
    return remaining
  }

  // Add effect to select first submission when campaign changes
  useEffect(() => {
    if (selectedCampaign && selectedCampaign.submissions.length > 0) {
      const sortedSubmissions = [...selectedCampaign.submissions].sort(
        (a, b) => {
          // Sort pending submissions to the top
          if (a.status === "pending" && b.status !== "pending") return -1
          if (a.status !== "pending" && b.status === "pending") return 1
          // Then sort by most recent
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
      )
      setSelectedSubmission(sortedSubmissions[0])
    } else {
      setSelectedSubmission(null)
    }
  }, [selectedCampaign])

  // Update remaining budget when campaign changes
  useEffect(() => {
    if (selectedCampaign) {
      const remaining = calculateRemainingBudget(selectedCampaign)
      if (remaining !== selectedCampaign.remaining_budget) {
        setSelectedCampaign({
          ...selectedCampaign,
          remaining_budget: remaining,
          has_insufficient_budget: remaining < 10, // Mark as insufficient if less than $10
        })
      }
    }
  }, [selectedCampaign])

  // Add effect to fetch views when campaign is selected
  useEffect(() => {
    if (selectedCampaign) {
      const fetchViews = async () => {
        try {
          setIsRefreshingViews(true)
          const result = await updateCampaignViews(selectedCampaign.id)
          if (result.success) {
            // Only update the views in the state
            setSelectedCampaign((prev) => {
              if (!prev) return null
              return {
                ...prev,
                submissions: prev.submissions.map((sub) => ({
                  ...sub,
                  views: sub.views, // Keep existing views as they were updated in the database
                })),
              }
            })
            setCampaigns((prevCampaigns) =>
              prevCampaigns.map((c) =>
                c.id === selectedCampaign.id
                  ? {
                      ...c,
                      submissions: c.submissions.map((sub) => ({
                        ...sub,
                        views: sub.views, // Keep existing views as they were updated in the database
                      })),
                    }
                  : c
              )
            )
          } else if (result.error) {
            toast.error("Failed to fetch views")
          }
        } catch (error) {
          console.error("Error fetching views:", error)
          toast.error("Failed to fetch views")
        } finally {
          setIsRefreshingViews(false)
        }
      }

      fetchViews()
    }
  }, [selectedCampaign?.id])

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full md:w-[800px] lg:w-[1000px] bg-white transform transition-transform duration-300 ease-in-out shadow-xl z-[60] overscroll-contain ${
        selectedCampaign ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {selectedCampaign && (
        <div className="h-full flex flex-col bg-white">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Campaign Details
              </h2>
              {isRefreshingViews && (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                  <span className="text-sm text-zinc-500">
                    Updating views...
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCampaign(null)}
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
                  Submissions ({selectedCampaign.submissions.length})
                </h3>
                <div className="space-y-1.5">
                  {selectedCampaign.submissions
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
                          <div className="flex flex-col items-end gap-1">
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
                            <span className="text-xs text-zinc-500">
                              {submission.views?.toLocaleString() || 0} views
                            </span>
                          </div>
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
                      {selectedCampaign.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-600">
                          Total Views:
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          {selectedCampaign.submissions
                            .reduce((total, sub) => total + (sub.views || 0), 0)
                            .toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              setIsRefreshingViews(true)
                              const result = await updateCampaignViews(
                                selectedCampaign.id
                              )
                              if (result.success) {
                                setSelectedCampaign(
                                  (prev: CampaignWithSubmissions | null) => {
                                    if (!prev) return null
                                    return {
                                      ...prev,
                                      submissions: prev.submissions.map(
                                        (sub: Submission) => ({
                                          ...sub,
                                          views: sub.views,
                                        })
                                      ),
                                    }
                                  }
                                )
                                setCampaigns(
                                  (prevCampaigns: CampaignWithSubmissions[]) =>
                                    prevCampaigns.map(
                                      (c: CampaignWithSubmissions) =>
                                        c.id === selectedCampaign.id
                                          ? {
                                              ...c,
                                              submissions: c.submissions.map(
                                                (sub: Submission) => ({
                                                  ...sub,
                                                  views: sub.views,
                                                })
                                              ),
                                            }
                                          : c
                                    )
                                )
                              } else if (result.error) {
                                toast.error("Failed to fetch views")
                              }
                            } catch (error) {
                              console.error("Error fetching views:", error)
                              toast.error("Failed to fetch views")
                            } finally {
                              setIsRefreshingViews(false)
                            }
                          }}
                          className="h-8 w-8"
                          disabled={isRefreshingViews}
                        >
                          <RefreshCw
                            className={cn(
                              "h-4 w-4",
                              isRefreshingViews && "animate-spin"
                            )}
                          />
                        </Button>
                      </div>
                      <span
                        className={cn(
                          "text-sm px-2.5 py-0.5 rounded-full font-medium",
                          selectedCampaign.has_insufficient_budget
                            ? "bg-red-50 text-red-700"
                            : selectedCampaign.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {selectedCampaign.has_insufficient_budget
                          ? "Insufficient Budget"
                          : (selectedCampaign.status || "Draft")
                              .charAt(0)
                              .toUpperCase() +
                            (selectedCampaign.status || "Draft").slice(1)}
                      </span>
                    </div>
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
                          Budget Pool: ${selectedCampaign.budget_pool} ·
                          Remaining Pool: $
                          {selectedCampaign.remaining_budget?.toFixed(2)}
                          {selectedCampaign.has_insufficient_budget && (
                            <span className="text-red-700">
                              {" "}
                              · Insufficient
                            </span>
                          )}{" "}
                          · RPM: ${selectedCampaign.rpm}
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
                              {selectedCampaign.guidelines}
                            </p>
                          </div>
                        </div>

                        {selectedCampaign.video_outline && (
                          <div>
                            <h4 className="text-sm font-medium text-zinc-900 mb-2">
                              Video Outline (Content Brief)
                            </h4>
                            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                              <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                                {selectedCampaign.video_outline}
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
                        <div className="flex items-center gap-2 text-sm justify-between">
                          <div>
                            <span className="font-medium text-zinc-900">
                              {selectedSubmission.creator.full_name ||
                                "Anonymous"}
                            </span>
                            <span className="ml-1 text-zinc-400">
                              submitted{" "}
                              {formatDistanceToNow(
                                new Date(selectedSubmission.created_at)
                              )}{" "}
                              ago
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-zinc-900">
                              {selectedSubmission.views?.toLocaleString() || 0}{" "}
                              views
                            </span>
                          </div>
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
