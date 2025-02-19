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
import {
  approveSubmission,
  rejectSubmission,
  createCampaign,
  pollNewSubmissions,
  updateCampaignViews,
} from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  FileText,
  Users,
  RotateCw,
  X,
  RefreshCw,
} from "lucide-react"
import { VideoPlayer } from "@/components/video-player"

type SubmissionCreator = {
  full_name: string | null
  email: string | null
  organization_name: string | null
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
  user_id: string
  creator: SubmissionCreator
  payout_status?: string
  auto_moderation_result?: {
    approved: boolean
    reason: string
    confidence: number
  }
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
    referral_bonus_rate: "0.10",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [hasNewCampaigns] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const router = useRouter()
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [isRefreshingViews, setIsRefreshingViews] = useState(false)

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
                      user_id: newSubmission.user_id,
                      creator: {
                        full_name:
                          newSubmission.creator.organization_name || null,
                        email: newSubmission.creator.email || null,
                        organization_name:
                          newSubmission.creator.organization_name || null,
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
          id: newCampaignData.campaign.id,
          title: newCampaignData.campaign.title,
          budget_pool: String(newCampaignData.campaign.budget_pool),
          rpm: String(newCampaignData.campaign.rpm),
          guidelines: newCampaignData.campaign.guidelines,
          video_outline: newCampaignData.campaign.video_outline,
          status: newCampaignData.campaign.status,
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
        referral_bonus_rate: "0.10",
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
      setCampaigns((prevCampaigns: CampaignWithSubmissions[]) =>
        prevCampaigns.map((campaign) => ({
          ...campaign,
          submissions: campaign.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "approved",
                  payout_status: "pending",
                  auto_moderation_result: submission.auto_moderation_result,
                }
              : submission
          ),
          activeSubmissionsCount: campaign.submissions.filter(
            (s) => s.status === "active"
          ).length,
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
                    Average CPM
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
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="budget_pool"
                    value={newCampaign.budget_pool}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setNewCampaign({
                        ...newCampaign,
                        budget_pool: value || "",
                      })
                      setErrors({ ...errors, budget_pool: false })
                    }}
                    className="pl-7 bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                    placeholder="0"
                    type="text"
                    min="0"
                  />
                </div>
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
                  CPM (Cost per 1000 views){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="rpm"
                    value={newCampaign.rpm}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed)) {
                        setNewCampaign({
                          ...newCampaign,
                          rpm: parsed.toFixed(2),
                        })
                      } else {
                        setNewCampaign({
                          ...newCampaign,
                          rpm: "",
                        })
                      }
                      setErrors({ ...errors, rpm: false })
                    }}
                    className="pl-7 bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  />
                </div>
                {errors.rpm && (
                  <p className="text-xs text-red-500">Valid CPM is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="referral_bonus_rate"
                  className="text-sm font-medium text-zinc-900"
                >
                  Referral Bonus Rate ($ per 1000 views)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="referral_bonus_rate"
                    value={newCampaign.referral_bonus_rate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed)) {
                        const capped = Math.min(parsed, 1)
                        setNewCampaign({
                          ...newCampaign,
                          referral_bonus_rate: capped.toFixed(2),
                        })
                      } else {
                        setNewCampaign({
                          ...newCampaign,
                          referral_bonus_rate: "",
                        })
                      }
                    }}
                    className="pl-7 h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black"
                    placeholder="0.00"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    inputMode="decimal"
                  />
                </div>
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
                Video Outline (Content Brief)
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
                className="dark:bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={isLoading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
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
                              .reduce(
                                (total, sub) => total + (sub.views || 0),
                                0
                              )
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
                                  setSelectedCampaign((prev) => {
                                    if (!prev) return null
                                    return {
                                      ...prev,
                                      submissions: prev.submissions.map(
                                        (sub) => ({
                                          ...sub,
                                          views: sub.views,
                                        })
                                      ),
                                    }
                                  })
                                  setCampaigns((prevCampaigns) =>
                                    prevCampaigns.map((c) =>
                                      c.id === selectedCampaign.id
                                        ? {
                                            ...c,
                                            submissions: c.submissions.map(
                                              (sub) => ({
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
                                {selectedSubmission.views?.toLocaleString() ||
                                  0}{" "}
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
