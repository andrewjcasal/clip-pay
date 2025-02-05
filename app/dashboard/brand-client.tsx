"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import ReactPlayer from "react-player"
import {
  approveSubmission,
  rejectSubmission,
  createCampaign,
  pollNewSubmissions,
} from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"

type SubmissionCreator = {
  full_name: string | null
  email: string | null
}

type Submission = {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  campaign_id: string
  created_at: string
  transcription: string | null
  views: number
  creator_id: string
  creator: SubmissionCreator
  payout_status?: string
}

interface CampaignWithSubmissions {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string | null
  video_outline: string | null
  status: string | null
  brand: {
    name: string
    payment_verified: boolean
  }
  submission: Submission | null
  submissions: Submission[]
  activeSubmissionsCount: number
}

interface DashboardClientProps {
  initialCampaigns: CampaignWithSubmissions[]
  brandId: string
  email: string
}

interface NewCampaign {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  video_outline: string
  referral_bonus_rate: string
}

interface FormErrors {
  title?: boolean
  budget_pool?: boolean
  rpm?: boolean
  guidelines?: boolean
}

export function DashboardClient({
  initialCampaigns,
  brandId,
  email,
}: DashboardClientProps) {
  const [campaigns, setCampaigns] =
    useState<CampaignWithSubmissions[]>(initialCampaigns)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignWithSubmissions | null>(null)
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    title: "",
    budget_pool: "",
    rpm: "",
    guidelines: "",
    video_outline: "",
    referral_bonus_rate: "10",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [hasNewCampaigns] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const router = useRouter()

  useEffect(() => {
    // Poll for new submissions every minute
    const pollInterval = setInterval(async () => {
      try {
        const campaignIds = campaigns.map((campaign) => campaign.id)
        const newSubmissions = await pollNewSubmissions(campaignIds)

        if (newSubmissions && newSubmissions.length > 0) {
          // Update campaigns with new submissions, checking for duplicates
          setCampaigns((currentCampaigns) =>
            currentCampaigns.map((campaign) => {
              const newSubmission = newSubmissions.find(
                (s) => s.campaign_id === campaign.id
              )
              if (newSubmission) {
                // Check if we already have this submission
                const isDuplicate = campaign.submissions.some(
                  (existingSubmission) =>
                    existingSubmission.id === newSubmission.id
                )

                // If it's a duplicate, return the campaign unchanged
                if (isDuplicate) {
                  return campaign
                }

                // If it's not a duplicate, add the new submission
                return {
                  ...campaign,
                  submissions: [
                    ...campaign.submissions,
                    {
                      ...newSubmission,
                      creator: {
                        full_name: newSubmission.creator.organization_name,
                        email: newSubmission.creator.email,
                      },
                    } as Submission,
                  ],
                  activeSubmissionsCount: campaign.activeSubmissionsCount + 1,
                }
              }
              return campaign
            })
          )

          // Only show toast if there were actually new submissions added
          const hasNewNonDuplicateSubmissions = campaigns.some((campaign) =>
            newSubmissions.some(
              (newSub) =>
                newSub.campaign_id === campaign.id &&
                !campaign.submissions.some(
                  (existingSub) => existingSub.id === newSub.id
                )
            )
          )

          if (hasNewNonDuplicateSubmissions) {
            toast.success("New submission received!", {
              description:
                "A creator has submitted a video to one of your campaigns.",
              action: {
                label: "Refresh",
                onClick: () => router.refresh(),
              },
            })
          }
        }
      } catch (error) {
        console.error("Error polling for new submissions:", error)
      }
    }, 60000) // Poll every minute

    return () => clearInterval(pollInterval)
  }, [campaigns])

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!newCampaign.title.trim()) {
      newErrors.title = true
    }
    if (!newCampaign.budget_pool || Number(newCampaign.budget_pool) <= 0) {
      newErrors.budget_pool = true
    }
    if (!newCampaign.rpm || Number(newCampaign.rpm) <= 0) {
      newErrors.rpm = true
    }
    if (!newCampaign.guidelines.trim()) {
      newErrors.guidelines = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateCampaign = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const newCampaignData = await createCampaign({
        ...newCampaign,
        brandId,
      })

      // Update local state with the new campaign
      setCampaigns((prevCampaigns) => [
        {
          id: newCampaignData.id,
          title: newCampaignData.title,
          budget_pool: String(newCampaignData.budget_pool),
          rpm: String(newCampaignData.rpm),
          guidelines: newCampaignData.guidelines,
          video_outline: newCampaignData.video_outline,
          status: newCampaignData.status,
          brand: {
            name: "Loading...", // This will be updated on the next data fetch
            payment_verified: false,
          },
          submission: null,
          submissions: [],
          activeSubmissionsCount: 0,
        } as CampaignWithSubmissions,
        ...prevCampaigns,
      ])

      setShowNewCampaign(false)
      setNewCampaign({
        title: "",
        budget_pool: "",
        rpm: "",
        guidelines: "",
        video_outline: "",
        referral_bonus_rate: "10",
      })
      setShowSuccessDialog(true)

      // Force a server refresh to ensure data consistency
      router.refresh()
    } catch (error) {
      console.error("Failed to create campaign:", error)
      toast.error("Failed to create campaign")
    } finally {
      setIsLoading(false)
    }
  }

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
              ? { ...submission, status: "rejected" }
              : submission
          ),
        }))
      )
    } catch (error) {
      console.error("Error rejecting submission:", error)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCampaign(null)
      }
    }

    if (selectedCampaign) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [selectedCampaign])

  return (
    <div>
      <DashboardHeader
        userType="brand"
        email={email}
        onRefresh={() => router.refresh()}
        showRefreshButton={hasNewCampaigns}
        refreshButtonText="Refresh to see new campaigns"
      />

      {/* Metrics */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">Total Budget</h3>
            <p className="text-2xl font-semibold text-white">
              $
              {campaigns
                .reduce(
                  (total, campaign) =>
                    total + Number(campaign.budget_pool || 0),
                  0
                )
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">
              Active Campaigns
            </h3>
            <p className="text-2xl font-semibold text-white">
              {campaigns.filter((c) => c.status === "active").length}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">
              Total Submissions
            </h3>
            <p className="text-2xl font-semibold text-white">
              {campaigns.reduce(
                (total, campaign) =>
                  total + (campaign.submissions?.length || 0),
                0
              )}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">Average RPM</h3>
            <p className="text-2xl font-semibold text-white">
              $
              {(
                campaigns.reduce(
                  (total, campaign) => total + Number(campaign.rpm || 0),
                  0
                ) / (campaigns.length || 1)
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
          <Button
            onClick={() => setShowNewCampaign(true)}
            className="bg-[#5865F2] hover:bg-[#4752C4]"
          >
            Create New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-[#2B2D31] border border-zinc-800 rounded-lg p-6 hover:bg-[#2B2D31]/90 transition-all group relative"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-3 flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="text-xl font-semibold text-white group-hover:text-[#5865F2] transition-colors hover:text-[#5865F2]"
                      >
                        {campaign.title}
                      </button>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="text-zinc-400">
                        RPM:{" "}
                        <span className="text-white font-medium">
                          ${campaign.rpm}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-400">
                    <p className="font-medium mb-1">Guidelines:</p>
                    <p className="whitespace-pre-wrap line-clamp-2 text-zinc-300">
                      {campaign.guidelines}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    {campaign.submissions.length > 0 && (
                      <span className="px-2 py-0.5 bg-[#5865F2]/10 text-[#5865F2] text-sm font-medium rounded-full border border-[#5865F2]/20">
                        {campaign.submissions.length}{" "}
                        {campaign.submissions.length === 1
                          ? "submission"
                          : "submissions"}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-medium ${
                        campaign.status === "active"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          campaign.status === "active"
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        } animate-pulse`}
                      ></span>
                      {campaign.status}
                    </span>
                  </div>

                  {campaign.submissions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {campaign.submissions
                          .slice(0, 3)
                          .map((submission, index) => (
                            <div
                              key={`${campaign.id}-${submission.id}-avatar-${index}`}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-[#2B2D31] ${
                                submission.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : submission.status === "approved"
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {submission.creator.full_name?.[0] || "?"}
                            </div>
                          ))}
                      </div>
                      {campaign.submissions.length > 3 && (
                        <span className="text-xs text-zinc-500">
                          +{campaign.submissions.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setSelectedCampaign(campaign)}
                    className="shrink-0 bg-black/20 text-white hover:bg-black/30 hover:text-white border-zinc-800"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Campaign Dialog */}
        <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
          <DialogContent className="bg-[#2B2D31] border-zinc-800 text-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Create New Campaign
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-300">
                    Campaign Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={newCampaign.title}
                    onChange={(e) => {
                      setNewCampaign({ ...newCampaign, title: e.target.value })
                      setErrors({ ...errors, title: false })
                    }}
                    className={`border-0 bg-[#1E1F22] text-white ${
                      errors.title ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Enter campaign title"
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500">Title is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_pool" className="text-zinc-300">
                    Budget Pool <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="budget_pool"
                    value={newCampaign.budget_pool}
                    onChange={(e) => {
                      setNewCampaign({
                        ...newCampaign,
                        budget_pool: e.target.value,
                      })
                      setErrors({ ...errors, budget_pool: false })
                    }}
                    className={`border-0 bg-[#1E1F22] text-white ${
                      errors.budget_pool ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Enter budget amount"
                    type="number"
                  />
                  {errors.budget_pool && (
                    <p className="text-xs text-red-500">
                      Valid budget amount is required
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rpm" className="text-zinc-300">
                    RPM (Rate per 1000 views){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rpm"
                    value={newCampaign.rpm}
                    onChange={(e) => {
                      setNewCampaign({ ...newCampaign, rpm: e.target.value })
                      setErrors({ ...errors, rpm: false })
                    }}
                    className={`border-0 bg-[#1E1F22] text-white ${
                      errors.rpm ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Enter RPM"
                    type="number"
                  />
                  {errors.rpm && (
                    <p className="text-xs text-red-500">
                      Valid RPM is required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="referral_bonus_rate"
                    className="text-zinc-300"
                  >
                    Referral Bonus Rate (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="referral_bonus_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Enter referral bonus rate"
                      value={newCampaign.referral_bonus_rate}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          referral_bonus_rate: e.target.value,
                        })
                      }
                      className="border-0 bg-[#1E1F22] text-white pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Percentage of RPM that referrers earn as bonus when their
                    referred creators submit content
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guidelines" className="text-zinc-300">
                  Guidelines <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="guidelines"
                  value={newCampaign.guidelines}
                  onChange={(e) => {
                    setNewCampaign({
                      ...newCampaign,
                      guidelines: e.target.value,
                    })
                    setErrors({ ...errors, guidelines: false })
                  }}
                  className={`border-0 bg-[#1E1F22] text-white min-h-[100px] ${
                    errors.guidelines ? "ring-2 ring-red-500" : ""
                  }`}
                  placeholder="Enter campaign guidelines"
                />
                {errors.guidelines && (
                  <p className="text-xs text-red-500">
                    Guidelines are required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_outline" className="text-zinc-300">
                  Video Outline
                </Label>
                <Textarea
                  id="video_outline"
                  value={newCampaign.video_outline}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      video_outline: e.target.value,
                    })
                  }
                  className="border-0 bg-[#1E1F22] text-white min-h-[100px]"
                  placeholder="Enter video outline"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewCampaign(false)}
                  className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={isLoading}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  {isLoading ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="bg-[#2B2D31] border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Campaign Created
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-green-500/10 text-green-500 p-4 rounded-lg space-y-2">
                <p className="font-medium">Campaign successfully created!</p>
                <p className="text-sm text-green-400">
                  Your campaign is now live and available for creators to view
                  and submit videos.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Campaign Details Dialog */}
        <Dialog
          open={!!selectedCampaign}
          onOpenChange={() => setSelectedCampaign(null)}
        >
          <DialogContent className="bg-[#2B2D31] border-zinc-800 text-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-bold text-white">
                  {selectedCampaign?.title}
                </DialogTitle>
              </div>
            </DialogHeader>

            {selectedCampaign && (
              <div className="space-y-6 py-4">
                {/* Campaign Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-1">
                      Budget Pool
                    </h3>
                    <p className="text-lg font-semibold text-white">
                      ${selectedCampaign.budget_pool}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-1">
                      RPM
                    </h3>
                    <p className="text-lg font-semibold text-white">
                      ${selectedCampaign.rpm}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">
                    Guidelines
                  </h3>
                  <div className="bg-black/20 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">
                      {selectedCampaign.guidelines}
                    </p>
                  </div>
                </div>

                {selectedCampaign.video_outline && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">
                      Video Outline
                    </h3>
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-white whitespace-pre-wrap">
                        {selectedCampaign.video_outline}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submissions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Submissions ({selectedCampaign.submissions.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedCampaign.submissions
                      .sort((a, b) => {
                        // Sort pending submissions to the top
                        if (a.status === "pending" && b.status !== "pending")
                          return -1
                        if (a.status !== "pending" && b.status === "pending")
                          return 1
                        // For non-pending submissions, sort by most recent first
                        return (
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                        )
                      })
                      .map((submission) => (
                        <div
                          key={`${selectedCampaign.id}-${submission.id}-details`}
                          className="bg-black/20 rounded-lg p-4 space-y-3"
                        >
                          {submission.video_url && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40">
                              <ReactPlayer
                                url={submission.video_url}
                                width="100%"
                                height="100%"
                                controls
                              />
                            </div>
                          )}

                          {submission.status === "pending" ? (
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={() => handleApprove(submission.id)}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                              >
                                Approve Submission
                              </Button>
                              <Button
                                onClick={() => handleReject(submission.id)}
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-600/10 flex-1"
                              >
                                Reject Submission
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-center py-2">
                              <span
                                className={`text-sm ${
                                  submission.status === "approved"
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                You have {submission.status} this submission
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">
                                {submission.creator.full_name || "Anonymous"}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {submission.creator.email}
                              </p>
                              <p className="text-sm text-zinc-400">
                                Submitted{" "}
                                {formatDistanceToNow(
                                  new Date(submission.created_at)
                                )}{" "}
                                ago
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {submission.status !== "pending" && (
                                <span
                                  className={`px-2 py-1 rounded text-sm ${
                                    submission.status === "approved"
                                      ? "bg-green-500/20 text-green-500"
                                      : "bg-red-500/20 text-red-500"
                                  }`}
                                >
                                  {submission.status.charAt(0).toUpperCase() +
                                    submission.status.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>

                          {submission.transcription && (
                            <div>
                              <h4 className="text-sm font-medium text-zinc-400 mb-1">
                                Transcription
                              </h4>
                              <p className="text-sm text-zinc-300 line-clamp-3">
                                {submission.transcription}
                              </p>
                            </div>
                          )}

                          {submission.views > 0 && (
                            <p className="text-sm text-zinc-400">
                              Views: {submission.views.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}

                    {selectedCampaign.submissions.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-zinc-400">No submissions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
