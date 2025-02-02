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
import { Campaign } from "./page"
import { formatDistanceToNow } from "date-fns"
import ReactPlayer from "react-player"
import { approveSubmission, rejectSubmission, createCampaign } from "./actions"
import { useRouter } from "next/navigation"
import { Bell, Settings, X, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"

interface Submission {
  id: string
  video_url: string
  file_path: string | null
  transcription: string
  creator_id: string
  status: string
  created_at: string
  views: number
  creator: {
    full_name: string
    email: string
  }
}

interface CampaignWithSubmissions extends Campaign {
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
  const [hasNewSubmission, setHasNewSubmission] = useState(false)
  const [hasNewCampaigns, setHasNewCampaigns] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Poll for new submissions every minute
    const pollInterval = setInterval(async () => {
      const { data: newSubmissions } = await supabase
        .from("submissions")
        .select(
          `
          id,
          video_url,
          file_path,
          transcription,
          status,
          created_at,
          views,
          creator_id,
          campaign_id,
          creator:creator_profiles (
            full_name:organization_name,
            email
          )
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)

      if (newSubmissions && newSubmissions.length > 0) {
        const latestSubmission = newSubmissions[0]
        // Check if this is a new submission we haven't seen
        const isNewSubmission = campaigns.some(
          (campaign) =>
            campaign.id === latestSubmission.campaign_id &&
            !campaign.submissions.some((s) => s.id === latestSubmission.id)
        )

        if (isNewSubmission) {
          // Update the campaigns with the new submission
          setCampaigns((currentCampaigns) =>
            currentCampaigns.map((campaign) =>
              campaign.id === latestSubmission.campaign_id
                ? {
                    ...campaign,
                    submissions: [
                      {
                        id: latestSubmission.id,
                        video_url: latestSubmission.video_url || "",
                        file_path: latestSubmission.file_path,
                        transcription: latestSubmission.transcription || "",
                        creator_id: latestSubmission.creator_id,
                        status: latestSubmission.status,
                        created_at: latestSubmission.created_at,
                        views: latestSubmission.views,
                        creator: {
                          full_name:
                            latestSubmission.creator?.[0]?.full_name || "",
                          email: latestSubmission.creator?.[0]?.email || "",
                        },
                      } as Submission,
                      ...campaign.submissions,
                    ],
                  }
                : campaign
            )
          )
          setHasNewSubmission(true)
          toast.success("New submission received!", {
            description:
              "A creator has submitted a video to one of your campaigns.",
            action: {
              label: "Refresh",
              onClick: () => window.location.reload(),
            },
          })
        }
      }
    }, 60000) // Poll every minute

    return () => clearInterval(pollInterval)
  }, [campaigns, supabase])

  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true)

      const newCampaignData = await createCampaign({
        ...newCampaign,
        brandId,
      })

      // Update local state with the new campaign
      setCampaigns((prevCampaigns) => [
        {
          ...newCampaignData,
          submissions: [],
          activeSubmissionsCount: 0,
        },
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      await approveSubmission(submissionId)

      // Update local state
      setCampaigns(
        campaigns.map((campaign) => ({
          ...campaign,
          submissions: campaign.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "approved",
                  payout_status: "pending",
                }
              : submission
          ),
        }))
      )
    } catch (error) {
      console.error("Error approving submission:", error)
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/signin")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Failed to log out")
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1e] via-[#2B2D31] to-[#1a1b1e]">
      <DashboardHeader
        userType="brand"
        email={email}
        showRefreshButton={hasNewCampaigns}
        refreshButtonText="Refresh to see new campaign"
        onRefresh={() => window.location.reload()}
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

      {/* Campaigns List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Campaigns</h2>
          <Button
            onClick={() => setShowNewCampaign(true)}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            Create New Campaign
          </Button>
        </div>

        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 space-y-4 hover:border-zinc-700/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Budget: ${Number(campaign.budget_pool).toLocaleString()} •
                    RPM: ${campaign.rpm} • Status:{" "}
                    <span
                      className={`capitalize ${
                        campaign.status === "active"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCampaign(campaign)}
                  className="bg-black/20 text-white hover:bg-black/30 hover:text-white border-zinc-800"
                >
                  View Details
                </Button>
              </div>

              <div className="text-sm text-zinc-400">
                <p className="font-medium mb-2">Guidelines:</p>
                <p className="whitespace-pre-wrap line-clamp-2">
                  {campaign.guidelines}
                </p>
              </div>
            </div>
          ))}
        </div>
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
                  Campaign Title
                </Label>
                <Input
                  id="title"
                  value={newCampaign.title}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, title: e.target.value })
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                  placeholder="Enter campaign title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_pool" className="text-zinc-300">
                  Budget Pool
                </Label>
                <Input
                  id="budget_pool"
                  value={newCampaign.budget_pool}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      budget_pool: e.target.value,
                    })
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                  placeholder="Enter budget amount"
                  type="number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rpm" className="text-zinc-300">
                  RPM (Rate per 1000 views)
                </Label>
                <Input
                  id="rpm"
                  value={newCampaign.rpm}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, rpm: e.target.value })
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                  placeholder="Enter RPM"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral_bonus_rate" className="text-zinc-300">
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
                Guidelines
              </Label>
              <Textarea
                id="guidelines"
                value={newCampaign.guidelines}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, guidelines: e.target.value })
                }
                className="border-0 bg-[#1E1F22] text-white min-h-[100px]"
                placeholder="Enter campaign guidelines"
              />
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

      {/* Overlay */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={() => setSelectedCampaign(null)}
        />
      )}

      {/* Campaign Details Slide-in */}
      <div
        className={`fixed inset-y-0 right-0 w-[600px] bg-[#2B2D31] transform transition-transform duration-300 ease-in-out ${
          selectedCampaign ? "translate-x-0" : "translate-x-full"
        } shadow-xl z-50`}
      >
        {selectedCampaign && (
          <div
            className="h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-700">
              <h2 className="text-xl font-semibold text-white">
                Campaign Details
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCampaign(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">
                    {selectedCampaign.title}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-zinc-400">
                    <span>
                      Budget: $
                      {Number(selectedCampaign.budget_pool).toLocaleString()}
                    </span>
                    <span>RPM: ${selectedCampaign.rpm}</span>
                    <span
                      className={`capitalize ${
                        selectedCampaign.status === "active"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selectedCampaign.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-medium text-white">Guidelines</h4>
                  <p className="text-zinc-400 whitespace-pre-wrap">
                    {selectedCampaign.guidelines}
                  </p>
                </div>

                {selectedCampaign.video_outline && (
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-white">
                      Video Outline
                    </h4>
                    <p className="text-zinc-400 whitespace-pre-wrap">
                      {selectedCampaign.video_outline}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">
                    Submissions ({selectedCampaign.submissions?.length || 0})
                  </h4>
                  <div className="space-y-4">
                    {selectedCampaign.submissions?.map((submission) => (
                      <div
                        key={submission.id}
                        className="bg-[#1E1F22] rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-white">
                              {submission.creator.full_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-zinc-400">
                              Submitted{" "}
                              {formatDistanceToNow(
                                new Date(submission.created_at),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {submission.status === "active" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(submission.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(submission.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {submission.status === "approved" && (
                              <span className="text-green-400 text-sm">
                                Approved
                              </span>
                            )}
                            {submission.status === "rejected" && (
                              <span className="text-red-400 text-sm">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                        {submission.video_url && (
                          <div className="aspect-video rounded-md overflow-hidden bg-black">
                            <ReactPlayer
                              url={submission.video_url}
                              width="100%"
                              height="100%"
                              controls
                            />
                          </div>
                        )}
                        {submission.transcription && (
                          <div className="text-sm text-zinc-400">
                            <p className="font-medium mb-1">Transcription:</p>
                            <p className="line-clamp-3">
                              {submission.transcription}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {!selectedCampaign.submissions?.length && (
                      <p className="text-zinc-400 text-center py-4">
                        No submissions yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
