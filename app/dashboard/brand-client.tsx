"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  approveSubmission,
  rejectSubmission,
  pollNewSubmissions,
  updateCampaignViews,
} from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { DollarSign, FileText, Users, RotateCw } from "lucide-react"
import { CampaignSlideIn } from "./components/campaign-slide-in"
import { CampaignWithSubmissions, Submission } from "@/types/campaigns"
import { CampaignCard } from "./components/campaign-card"
import { CreateCampaignModal } from "./components/create-campaign-modal"
import { Metrics } from "./components/metrics"

interface DashboardClientProps {
  initialCampaigns: CampaignWithSubmissions[]
  brandId: string
  email: string
  organization_name: string
}

export function DashboardClient({
  initialCampaigns,
  brandId,
  email,
  organization_name,
}: DashboardClientProps) {
  const [campaigns, setCampaigns] =
    useState<CampaignWithSubmissions[]>(initialCampaigns)

  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignWithSubmissions | null>(null)
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
      <DashboardHeader
        userType="brand"
        email={email}
        organization_name={organization_name}
      />

      {/* Metrics */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <Metrics campaigns={campaigns} />
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

      <CreateCampaignModal
        open={showNewCampaign}
        onOpenChange={setShowNewCampaign}
        brandId={brandId}
        setCampaigns={setCampaigns}
      />
      <CampaignSlideIn
        selectedCampaign={selectedCampaign}
        setSelectedCampaign={setSelectedCampaign}
        isRefreshingViews={isRefreshingViews}
        handleApprove={handleApprove}
        handleReject={handleReject}
        setSelectedSubmission={setSelectedSubmission}
        selectedSubmission={selectedSubmission}
        setCampaigns={setCampaigns}
        setIsRefreshingViews={setIsRefreshingViews}
        updateCampaignViews={updateCampaignViews}
      />

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
