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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DollarSign, FileText, Users, RotateCw, X } from "lucide-react"

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

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: CampaignWithSubmissions
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-lg group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-zinc-900 truncate">
            {campaign.title}
          </h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              campaign.status === "active"
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            )}
          >
            {(campaign.status || "Draft").charAt(0).toUpperCase() +
              (campaign.status || "Draft").slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {campaign.submissions.length > 0 && (
            <span className="text-sm text-zinc-600">
              {campaign.submissions.length}{" "}
              {campaign.submissions.length === 1 ? "submission" : "submissions"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            ${Number(campaign.budget_pool).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">Budget Pool</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            ${Number(campaign.rpm).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">RPM</p>
        </div>
      </div>
    </div>
  )
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)

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
              ? { ...submission, status: "rejected" }
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
              ? { ...submission, status: "rejected" }
              : submission
          ),
        }
      })
    } catch (error) {
      console.error("Error rejecting submission:", error)
      toast.error("Failed to reject submission")
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
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="brand" email={email} />

      {/* Metrics */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Total Budget
                  </span>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                $
                {campaigns
                  .reduce(
                    (total, campaign) =>
                      total + Number(campaign.budget_pool || 0),
                    0
                  )
                  .toLocaleString()}
              </p>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Active Campaigns
                  </span>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                {campaigns.filter((c) => c.status === "active").length}
              </p>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Total Submissions
                  </span>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                {campaigns.reduce(
                  (total, campaign) =>
                    total + (campaign.submissions?.length || 0),
                  0
                )}
              </p>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <RotateCw className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Average RPM
                  </span>
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                $
                {(
                  campaigns.reduce(
                    (total, campaign) => total + Number(campaign.rpm || 0),
                    0
                  ) / (campaigns.length || 1)
                ).toFixed(2)}
              </p>
            </Card>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  Your Campaigns
                </h2>
                <p className="text-sm text-zinc-500">
                  Manage your active campaigns and submissions
                </p>
              </div>
              <Button
                onClick={() => setShowNewCampaign(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Create Campaign
              </Button>
            </div>

            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
              {campaigns.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-zinc-600">No campaigns created yet.</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Create your first campaign to start receiving submissions!
                  </p>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => setSelectedCampaign(campaign)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Campaign Dialog */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-900 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Create New Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-zinc-900"
                >
                  Campaign Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={newCampaign.title}
                  onChange={(e) => {
                    setNewCampaign({ ...newCampaign, title: e.target.value })
                    setErrors({ ...errors, title: false })
                  }}
                  className={cn(
                    "bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                    errors.title && "ring-2 ring-red-500 border-red-500"
                  )}
                  placeholder="Enter campaign title"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">Title is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="budget_pool"
                  className="text-sm font-medium text-zinc-900"
                >
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
                  className={cn(
                    "bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                    errors.budget_pool && "ring-2 ring-red-500 border-red-500"
                  )}
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
                <Label
                  htmlFor="rpm"
                  className="text-sm font-medium text-zinc-900"
                >
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
                  className={cn(
                    "bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                    errors.rpm && "ring-2 ring-red-500 border-red-500"
                  )}
                  placeholder="Enter RPM"
                  type="number"
                />
                {errors.rpm && (
                  <p className="text-xs text-red-500">Valid RPM is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="referral_bonus_rate"
                  className="text-sm font-medium text-zinc-900"
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
                    className="bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
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
              <Label
                htmlFor="guidelines"
                className="text-sm font-medium text-zinc-900"
              >
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
                className={cn(
                  "bg-white border-zinc-200 text-zinc-900 min-h-[100px] focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                  errors.guidelines && "ring-2 ring-red-500 border-red-500"
                )}
                placeholder="Enter campaign guidelines"
              />
              {errors.guidelines && (
                <p className="text-xs text-red-500">Guidelines are required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="video_outline"
                className="text-sm font-medium text-zinc-900"
              >
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
                className="bg-white border-zinc-200 text-zinc-900 min-h-[100px] focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                placeholder="Enter video outline"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNewCampaign(false)}
                className="border-zinc-200 text-zinc-900 hover:bg-zinc-50"
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
        <DialogContent className="bg-white border-zinc-200 text-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Campaign Created
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#ECFDF3] text-[#027A48] p-4 rounded-lg space-y-2">
              <p className="font-medium">Campaign successfully created!</p>
              <p className="text-sm">
                Your campaign is now live and available for creators to view and
                submit videos.
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

      {/* Campaign Details Slide-in */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[800px] lg:w-[1000px] bg-white transform transition-transform duration-300 ease-in-out shadow-xl z-[60] overscroll-contain ${
          selectedCampaign ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCampaign && (
          <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-between p-3 border-b border-zinc-200 bg-white">
              <h2 className="text-lg font-semibold text-zinc-900">
                Campaign Details
              </h2>
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
                        {selectedCampaign.title}
                      </h2>
                      <span
                        className={cn(
                          "text-sm px-2.5 py-0.5 rounded-full font-medium",
                          selectedCampaign.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {(selectedCampaign.status || "Draft")
                          .charAt(0)
                          .toUpperCase() +
                          (selectedCampaign.status || "Draft").slice(1)}
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
                            Budget Pool: ${selectedCampaign.budget_pool} · RPM:
                            ${selectedCampaign.rpm}
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
                                Video Outline
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
                        {selectedSubmission.video_url && (
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                            <ReactPlayer
                              url={selectedSubmission.video_url}
                              width="100%"
                              height="100%"
                              controls
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-zinc-900">
                              {selectedSubmission.creator.full_name ||
                                "Anonymous"}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {selectedSubmission.creator.email}
                            </p>
                            <p className="text-sm text-zinc-500">
                              Submitted{" "}
                              {formatDistanceToNow(
                                new Date(selectedSubmission.created_at)
                              )}{" "}
                              ago
                            </p>
                          </div>
                          {selectedSubmission.status === "pending" ? (
                            <div className="flex gap-3">
                              <Button
                                onClick={() =>
                                  handleApprove(selectedSubmission.id)
                                }
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() =>
                                  handleReject(selectedSubmission.id)
                                }
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "text-sm font-medium rounded-full px-3 py-1",
                                selectedSubmission.status === "approved"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              )}
                            >
                              {selectedSubmission.status === "approved"
                                ? "You have approved this submission"
                                : "You have rejected this submission"}
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

      {/* Overlay */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-[55]"
          onClick={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  )
}
