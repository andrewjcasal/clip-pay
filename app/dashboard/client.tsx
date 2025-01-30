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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { approveSubmission, rejectSubmission, createCampaign } from "./actions"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface Submission {
  id: string
  video_url: string
  transcription: string
  creator_id: string
  status: string
  created_at: string
  views: number
  profiles: {
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
}

export function DashboardClient({
  initialCampaigns,
  brandId,
}: DashboardClientProps) {
  const [campaigns, setCampaigns] =
    useState<CampaignWithSubmissions[]>(initialCampaigns)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignWithSubmissions | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    budget_pool: "",
    rpm: "",
    guidelines: "",
    video_outline: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen bg-[#313338]">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Total Budget</h3>
          <p className="text-2xl font-semibold text-white">
            $
            {campaigns
              .reduce(
                (total, campaign) => total + Number(campaign.budget_pool || 0),
                0
              )
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">
            Active Campaigns
          </h3>
          <p className="text-2xl font-semibold text-white">
            {campaigns.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">
            Total Submissions
          </h3>
          <p className="text-2xl font-semibold text-white">
            {campaigns.reduce(
              (total, campaign) => total + (campaign.submissions?.length || 0),
              0
            )}
          </p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
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

      {/* Campaigns List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Campaigns</h2>
          <Button onClick={() => setShowNewCampaign(true)}>
            Create New Campaign
          </Button>
        </div>

        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-[#2B2D31] rounded-lg p-6 space-y-4"
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
                  className="bg-[#1E1F22] text-white hover:bg-[#2B2D31] hover:text-white border-zinc-700"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                value={newCampaign.title}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Pool</Label>
              <Input
                id="budget"
                type="number"
                value={newCampaign.budget_pool}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    budget_pool: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpm">RPM (Rate per thousand views)</Label>
              <Input
                id="rpm"
                type="number"
                step="0.01"
                value={newCampaign.rpm}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, rpm: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guidelines">Guidelines</Label>
              <Textarea
                id="guidelines"
                value={newCampaign.guidelines}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, guidelines: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outline">Video Outline (Optional)</Label>
              <Textarea
                id="outline"
                value={newCampaign.video_outline || ""}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    video_outline: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Created Successfully</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Your campaign has been created and is now live for creators to view.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
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
                              {submission.profiles?.full_name || "Anonymous"}
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
