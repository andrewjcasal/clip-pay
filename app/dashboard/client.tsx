"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Campaign } from "./page"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "../../lib/supabaseClient"
import ReactPlayer from "react-player"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

  const handleCreateCampaign = async () => {
    try {
      setIsLoading(true)
      console.log("Creating campaign with data:", {
        ...newCampaign,
        brandId,
      })

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCampaign,
          brandId,
        }),
      })

      const responseText = await response.text()
      console.log("Campaign creation response:", {
        status: response.status,
        ok: response.ok,
        text: responseText,
      })

      if (!response.ok) {
        throw new Error(responseText)
      }

      const newCampaignData = JSON.parse(responseText)
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
    } catch (error) {
      console.error("Failed to create campaign:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      // Get payout duration from env (default to 7 days for production)
      const payoutDurationMinutes = Number(
        process.env.NEXT_PUBLIC_PAYOUT_DURATION_MINUTES || "10080"
      )

      // Calculate due date
      const payoutDueDate = new Date()
      payoutDueDate.setMinutes(
        payoutDueDate.getMinutes() + payoutDurationMinutes
      )

      const { data, error } = await supabase
        .from("submissions")
        .update({
          status: "approved",
          payout_due_date: payoutDueDate.toISOString(),
          payout_status: "pending",
        })
        .eq("id", submissionId)

      console.log("Submission update response:", {
        data,
        error,
        submissionId,
        payoutDueDate,
      })

      if (error) throw error

      // Update local state...
      setCampaigns(
        campaigns.map((campaign) => ({
          ...campaign,
          submissions: campaign.submissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  status: "approved",
                  payout_due_date: payoutDueDate.toISOString(),
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
      // Log the submission ID and campaign we're trying to update
      const campaign = campaigns.find((c) =>
        c.submissions.some((s) => s.id === submissionId)
      )
      console.log("Attempting to update:", {
        submissionId,
        campaignId: campaign?.id,
        brandId,
      })

      // Try a simpler select first
      const { data: checkData, error: checkError } = await supabase
        .from("submissions")
        .select(
          `
          id,
          campaign_id,
          status,
          campaign:campaigns (
            id,
            brand_id
          )
        `
        )
        .eq("id", submissionId)

      console.log("Check submission details:", {
        data: checkData,
        error: checkError?.message,
        hint: checkError?.hint,
        code: checkError?.code,
      })

      // Then try the update
      const { data, error } = await supabase
        .from("submissions")
        .update({ status: "rejected" })
        .eq("id", submissionId)

      console.log("Update attempt:", {
        data,
        error: error?.message,
        hint: error?.hint,
        code: error?.code,
      })

      if (error) throw error

      // Update the local state to reflect the change
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
            +{campaigns.length}
          </p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Creators</h3>
          <p className="text-2xl font-semibold text-white">
            +
            {new Set(
              campaigns.flatMap(
                (campaign) =>
                  campaign.submissions?.map((sub) => sub.creator_id) || []
              )
            ).size.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Potential Creators</p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Total Views</h3>
          <p className="text-2xl font-semibold text-white">
            {campaigns
              .reduce(
                (total, campaign) =>
                  total +
                  (campaign.submissions
                    ?.filter((sub) => sub.status === "approved")
                    .reduce(
                      (subTotal, sub) => subTotal + (sub.views || 0),
                      0
                    ) || 0),
                0
              )
              .toLocaleString()}
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h3 className="text-xl font-medium text-white mb-4">
            No campaigns yet
          </h3>
          <p className="text-zinc-400 mb-6">
            Create your first campaign to start working with creators
          </p>
          <Button
            onClick={() => setShowNewCampaign(true)}
            className="bg-[#5865F2]"
          >
            Create Campaign
          </Button>
        </div>
      ) : (
        // Campaign list and details
        <div className="flex gap-4 p-4">
          {/* Left sidebar */}
          <div className="w-[30%] bg-[#2B2D31] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Campaigns</h2>
              <Button
                onClick={() => setShowNewCampaign(true)}
                className="bg-[#5865F2] px-3 py-1 h-8"
                size="sm"
              >
                New
              </Button>
            </div>
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedCampaign?.id === campaign.id
                      ? "bg-[#404249]"
                      : "hover:bg-[#35373C]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-medium">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        Pool: ${campaign.budget_pool}
                      </p>
                      <p className="text-sm text-zinc-400">
                        RPM: ${campaign.rpm}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Active Submissions: {campaign.activeSubmissionsCount}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        campaign.status === "active"
                          ? "bg-green-500/10 text-green-500"
                          : campaign.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-zinc-500/10 text-zinc-500"
                      }`}
                    >
                      {campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[70%] bg-[#2B2D31] rounded-lg p-4">
            {selectedCampaign ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedCampaign.title}
                  </h2>
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>Pool: ${selectedCampaign.budget_pool}</span>
                    <span>RPM: ${selectedCampaign.rpm}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Guidelines</h3>
                  <p className="text-zinc-400 whitespace-pre-wrap">
                    {selectedCampaign.guidelines}
                  </p>
                </div>

                {/* Submissions section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Submissions
                  </h3>
                  {selectedCampaign.submissions &&
                  selectedCampaign.submissions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCampaign.submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="bg-[#313338] rounded border border-zinc-700 px-4"
                        >
                          {submission.status === "rejected" ? (
                            <Accordion type="single" collapsible>
                              <AccordionItem
                                value="submission"
                                className="border-none"
                              >
                                <AccordionTrigger className="text-rose-400/70 hover:no-underline py-2">
                                  <div className="flex items-center gap-2">
                                    <span>Submission Rejected</span>
                                    <span className="text-sm text-zinc-500">
                                      {formatDistanceToNow(
                                        new Date(submission.created_at),
                                        {
                                          addSuffix: true,
                                        }
                                      )}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3 pt-2">
                                    <div>
                                      <p className="text-sm font-medium text-zinc-400 mb-1">
                                        Video URL
                                      </p>
                                      <ReactPlayer
                                        url={submission.video_url}
                                        controls={true}
                                      />
                                    </div>

                                    {submission.transcription && (
                                      <div>
                                        <p className="text-sm font-medium text-zinc-400 mb-1">
                                          Transcription
                                        </p>
                                        <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                                          {submission.transcription}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-zinc-400 mb-1">
                                  Video URL
                                </p>
                                <ReactPlayer
                                  url={submission.video_url}
                                  controls={true}
                                />
                              </div>

                              {submission.transcription && (
                                <div>
                                  <p className="text-sm font-medium text-zinc-400 mb-1">
                                    Transcription
                                  </p>
                                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                                    {submission.transcription}
                                  </p>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2">
                                <span
                                  className={`text-sm px-2 py-1 rounded ${
                                    submission.status === "active"
                                      ? "bg-yellow-500/10 text-yellow-500"
                                      : submission.status === "approved"
                                      ? "bg-green-500/10 text-green-500"
                                      : "bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {submission.status.charAt(0).toUpperCase() +
                                    submission.status.slice(1)}
                                </span>

                                {/* Approve and Reject Buttons */}
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleApprove(submission.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(submission.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500">No submissions yet</p>
                  )}
                </div>

                {selectedCampaign.status === "pending" && (
                  <div className="bg-yellow-500/10 text-yellow-500 px-4 py-3 rounded-md">
                    This campaign is pending review. We'll notify you once it's
                    approved.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                Select a campaign to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="bg-[#2B2D31] text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                value={newCampaign.title}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, title: e.target.value }))
                }
                className="border-0 bg-[#1E1F22] text-white"
                placeholder="Enter campaign title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget Pool</Label>
              <Input
                id="budget"
                type="number"
                value={newCampaign.budget_pool}
                onChange={(e) =>
                  setNewCampaign((prev) => ({
                    ...prev,
                    budget_pool: e.target.value,
                  }))
                }
                className="border-0 bg-[#1E1F22] text-white"
                placeholder="Enter budget amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpm">RPM (Rate per 1000 views)</Label>
              <Input
                id="rpm"
                type="number"
                value={newCampaign.rpm}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, rpm: e.target.value }))
                }
                className="border-0 bg-[#1E1F22] text-white"
                placeholder="Enter RPM amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guidelines">Guidelines</Label>
              <Textarea
                id="guidelines"
                value={newCampaign.guidelines}
                onChange={(e) =>
                  setNewCampaign((prev) => ({
                    ...prev,
                    guidelines: e.target.value,
                  }))
                }
                className="border-0 bg-[#1E1F22] text-white min-h-[100px]"
                placeholder="Enter campaign guidelines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_outline">Video Outline</Label>
              <Textarea
                id="video_outline"
                value={newCampaign.video_outline}
                onChange={(e) =>
                  setNewCampaign((prev) => ({
                    ...prev,
                    video_outline: e.target.value,
                  }))
                }
                className="border-0 bg-[#1E1F22] text-white min-h-[100px]"
                placeholder="Enter video outline or script requirements"
              />
            </div>

            <Button
              onClick={handleCreateCampaign}
              disabled={isLoading}
              className="w-full bg-[#5865F2]"
            >
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-[#2B2D31] text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Campaign Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-zinc-400">
              Your campaign has been created and is pending review. We'll notify
              you once it's approved.
            </p>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-[#5865F2]"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
