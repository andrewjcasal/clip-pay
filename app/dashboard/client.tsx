"use client"

import { useState } from "react"
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

      setCampaigns([newCampaignData, ...campaigns])
      setShowNewCampaign(false)
      setNewCampaign({
        title: "",
        budget_pool: "",
        rpm: "",
        guidelines: "",
        video_outline: "",
      })
      setShowSuccessDialog(true)
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
                >
                  View Details
                </Button>
              </div>

              {campaign.submissions?.length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="submissions">
                    <AccordionTrigger className="text-zinc-400">
                      {campaign.submissions.length} Submissions
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {campaign.submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className="bg-[#313338] rounded p-4 flex justify-between items-center"
                          >
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
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="text-sm text-zinc-400">
                <p className="font-medium mb-2">Guidelines:</p>
                <p className="whitespace-pre-wrap">{campaign.guidelines}</p>
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
    </div>
  )
}
