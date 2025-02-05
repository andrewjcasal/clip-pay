"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  submitVideo,
  getCreatorCampaigns,
  updateSubmissionVideoUrl,
  checkForNotifications,
  markNotificationAsSeen,
} from "./actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"

interface Campaign {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string | null
  status: string | null
  brand: {
    name: string
    payment_verified?: boolean
  }
  submission: {
    id: string
    status: string
    video_url: string | null
    file_path: string | null
    campaign_id: string
  } | null
}

interface NotificationMetadata {
  campaign_title?: string
  submission_id?: string
}

interface CreatorDashboardClientProps {
  transformedCampaigns: Campaign[]
  email: string
}

export function CreatorDashboardClient({
  transformedCampaigns = [],
  email,
}: CreatorDashboardClientProps) {
  const [campaigns, setCampaigns] = useState(transformedCampaigns)
  const [newCampaigns, setNewCampaigns] = useState<Campaign[]>([])
  const [hasNewCampaigns, setHasNewCampaigns] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  )
  const [videoUrl, setVideoUrl] = useState("")
  const [updatingUrl, setUpdatingUrl] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedCampaignId, setSubmittedCampaignId] = useState<string | null>(
    null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [copiedCampaign, setCopiedCampaign] = useState<string | null>(null)

  const isJustSubmitted =
    selectedCampaign && selectedCampaign.id === submittedCampaignId

  useEffect(() => {
    // Poll for updates every minute
    const pollInterval = setInterval(async () => {
      try {
        // Check for new campaigns
        const latestCampaigns = await getCreatorCampaigns()

        // Update existing campaign statuses
        setCampaigns((prevCampaigns) => {
          return prevCampaigns.map((prevCampaign) => {
            const updatedCampaign = latestCampaigns.find(
              (c) => c.id === prevCampaign.id
            )
            if (
              updatedCampaign?.submission?.status !==
              prevCampaign.submission?.status
            ) {
              // If the status has changed, update the selected campaign as well
              if (selectedCampaign?.id === prevCampaign.id && updatedCampaign) {
                setSelectedCampaign(updatedCampaign)
              }
              return updatedCampaign || prevCampaign
            }
            return prevCampaign
          })
        })

        // Check for new campaigns
        const newOnes = latestCampaigns.filter(
          (newCampaign) =>
            !campaigns.some((existing) => existing.id === newCampaign.id)
        )

        if (newOnes.length > 0) {
          setNewCampaigns(newOnes)
          setHasNewCampaigns(true)
          toast.success(
            `${newOnes.length} new campaign${newOnes.length > 1 ? "s" : ""} available!`
          )
        }

        // Check for notifications
        const notifications = await checkForNotifications()
        if (notifications && notifications.length > 0) {
          notifications.forEach(async (notification) => {
            const metadata = notification.metadata as NotificationMetadata
            const campaign = latestCampaigns.find(
              (c) => c.submission?.id === metadata?.submission_id
            )
            if (campaign?.submission) {
              const status =
                campaign.submission.status === "pending"
                  ? "submitted"
                  : campaign.submission.status
              toast.success(
                `Your video for campaign "${metadata?.campaign_title}" has been ${status}!`,
                {
                  description:
                    campaign.submission.status === "approved"
                      ? "You can now add your public video URL to start earning."
                      : "Please check the campaign guidelines and submit a new video.",
                  duration: 5000,
                  action: {
                    label: "View Campaign",
                    onClick: () => {
                      setSelectedCampaign(campaign)
                    },
                  },
                }
              )
              await markNotificationAsSeen(notification.id)
            }
          })
        }
      } catch (error) {
        console.error("Error polling for updates:", error)
      }
    }, 60000) // Poll every minute

    return () => clearInterval(pollInterval)
  }, [campaigns, selectedCampaign])

  const handleShowNewCampaigns = () => {
    setCampaigns((prev) => [...newCampaigns, ...prev])
    setNewCampaigns([])
    setHasNewCampaigns(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      if (droppedFile.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit")
        return
      }
      setFile(droppedFile)
    }
  }, [])

  const handleSubmit = async () => {
    if (!selectedCampaign) return
    setIsSubmitting(true)

    try {
      // Check file size before uploading (100MB limit)
      if (file && file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit")
        return
      }

      const submission = await submitVideo({
        campaignId: selectedCampaign.id,
        videoUrl: videoUrl || undefined,
        file: file || undefined,
      })

      // Update the campaigns list to show submitted status
      const updatedCampaigns = campaigns.map((campaign) =>
        campaign.id === selectedCampaign.id
          ? {
              ...campaign,
              submission,
            }
          : campaign
      )
      setSelectedCampaign({ ...selectedCampaign, submission })
      setCampaigns(updatedCampaigns)

      setFile(null)
      setVideoUrl("")
      setSubmittedCampaignId(selectedCampaign.id)
      toast.success("Video submitted successfully!")
    } catch (error) {
      console.error("Error submitting campaign:", error)
      toast.error("Failed to submit video. Please try again.")
      setSubmittedCampaignId(null)
      setFile(null)
      setVideoUrl("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = (text: string, campaignId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCampaign(campaignId)
    setTimeout(() => setCopiedCampaign(""), 2000)
  }

  const handleUpdateVideoUrl = async (submissionId: string) => {
    if (!videoUrl) return

    setUpdatingUrl(true)
    try {
      await updateSubmissionVideoUrl(submissionId, videoUrl)

      // Update local state
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) => {
          if (campaign.submission?.id === submissionId) {
            return {
              ...campaign,
              submission: {
                ...campaign.submission,
                video_url: videoUrl,
              },
            }
          }
          return campaign
        })
      )

      toast.success("Video URL updated successfully!")
      setVideoUrl("")
    } catch (error) {
      console.error("Error updating video URL:", error)
      toast.error("Failed to update video URL. Please try again.")
    } finally {
      setUpdatingUrl(false)
    }
  }

  const renderSubmissionSection = () => {
    if (isJustSubmitted) {
      return (
        <div className="space-y-4 border-t border-zinc-700 pt-6">
          <div className="bg-green-500/10 text-green-500 p-4 rounded-md space-y-3">
            <h3 className="text-lg font-medium">
              Video Successfully Submitted!
            </h3>
            <p className="text-sm">
              Your video has been submitted for review. You can view all your
              submissions in your{" "}
              <Button
                variant="link"
                className="text-green-500 p-0 h-auto font-semibold hover:text-green-400"
                onClick={() => {
                  /* TODO: Add navigation to submissions page */
                }}
              >
                submissions dashboard
              </Button>
              .
            </p>
          </div>
        </div>
      )
    }

    if (selectedCampaign?.submission) {
      return (
        <div className="space-y-4 border-t border-zinc-700 pt-6">
          <div className="bg-[#5865F2]/10 text-[#5865F2] p-4 rounded-lg border border-[#5865F2]/20 space-y-3">
            <h3 className="text-lg font-medium">
              You&apos;ve already submitted for this campaign
            </h3>
            {selectedCampaign.submission.status === "approved" ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Your submission has been approved! To start earning, please
                  update your submission with a public video URL.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="publicVideoUrl" className="text-zinc-300">
                    Public Video URL
                  </Label>
                  <Input
                    id="publicVideoUrl"
                    type="url"
                    placeholder="Enter public video URL (YouTube, TikTok, etc.)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="border-0 bg-[#1E1F22] text-white"
                  />
                  <Button
                    onClick={() =>
                      selectedCampaign.submission &&
                      handleUpdateVideoUrl(selectedCampaign.submission.id)
                    }
                    disabled={
                      !videoUrl || updatingUrl || !selectedCampaign.submission
                    }
                    className="bg-[#5865F2] hover:bg-[#4752C4] w-full mt-2"
                  >
                    {updatingUrl ? "Updating..." : "Update Video URL"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">
                View your submission in your{" "}
                <Button
                  variant="link"
                  className="text-[#5865F2] p-0 h-auto font-semibold hover:text-[#4752C4]"
                  onClick={() => {
                    /* TODO: Add navigation to submissions page */
                  }}
                >
                  submissions dashboard
                </Button>
                .
              </p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 border-t border-zinc-700 pt-6">
        <h3 className="text-lg font-medium text-white">Apply for Campaign</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-zinc-300">
              Upload Video
            </Label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 transition-colors
                ${
                  isDragging
                    ? "border-[#5865F2] bg-[#5865F2]/10"
                    : file
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-700 hover:border-zinc-600 bg-[#1E1F22]"
                }
              `}
            >
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div
                  className={`rounded-full p-3 transition-colors ${
                    file ? "bg-green-500/10" : "bg-zinc-800"
                  }`}
                >
                  <Upload
                    className={`h-6 w-6 ${
                      file ? "text-green-500" : "text-zinc-400"
                    }`}
                  />
                </div>
                {file ? (
                  <>
                    <div className="text-sm text-green-500 font-medium">
                      {file.name}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-zinc-400 hover:text-zinc-300"
                    >
                      Remove file
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">
                        Drag and drop your video here, or click to browse
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports MP4, MOV, and other common video formats
                      </p>
                    </div>
                    <Input
                      id="file"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!file && !videoUrl)}
            className="bg-[#5865F2]"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1e] via-[#2B2D31] to-[#1a1b1e]">
      <DashboardHeader
        userType="creator"
        email={email}
        showRefreshButton={hasNewCampaigns}
        refreshButtonText="New campaigns available"
        onRefresh={() => window.location.reload()}
      />

      {/* Metrics */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">Total Earned</h3>
            <p className="text-2xl font-semibold text-white">$0</p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">
              Active Campaigns
            </h3>
            <p className="text-2xl font-semibold text-white">
              {campaigns.length}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">Total Views</h3>
            <p className="text-2xl font-semibold text-white">0</p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400">Avg. RPM</h3>
            <p className="text-2xl font-semibold text-white">$0</p>
          </div>
        </div>
      </div>

      {/* Campaign list and details */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex gap-4">
          <div className="w-[30%] bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Available Campaigns
              </h2>
            </div>
            {campaigns.length > 0 ? (
              <>
                <div className="space-y-2">
                  {hasNewCampaigns && (
                    <button
                      onClick={handleShowNewCampaigns}
                      className="w-full bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/20 rounded-lg p-3 mb-4 text-sm font-medium transition-colors"
                    >
                      Show {newCampaigns.length} new campaign
                      {newCampaigns.length > 1 ? "s" : ""}
                    </button>
                  )}
                  <div className="space-y-4 pr-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className="w-full bg-[#2B2D31] rounded-lg p-6 text-left hover:bg-[#2B2D31]/80 transition-all group relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2 flex-1">
                              <h3 className="text-white font-medium text-lg group-hover:text-[#5865F2] transition-colors line-clamp-1">
                                {campaign.title}
                              </h3>
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-sm text-zinc-400">
                                  by {campaign.brand?.name || "Unknown Brand"}
                                </span>
                                {campaign.brand?.payment_verified && (
                                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Verified Payment
                                  </span>
                                )}
                              </div>
                            </div>
                            {campaign.submission && (
                              <span
                                className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium border ${
                                  campaign.submission.status === "approved"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : campaign.submission.status === "rejected"
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20"
                                }`}
                              >
                                {campaign.submission.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  campaign.submission.status.slice(1)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-4">
                            <div className="px-3 py-1.5 bg-black/20 rounded-md">
                              <p className="text-sm font-medium text-white">
                                ${Number(campaign.rpm).toFixed(2)}{" "}
                                <span className="text-zinc-400 font-normal">
                                  RPM
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400/0 group-hover:bg-emerald-400/50 transition-all"></div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-400">
                  No campaigns available at the moment.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Check back soon for new opportunities!
                </p>
              </div>
            )}
          </div>
          <div className="flex-1 sticky top-24">
            <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6">
              {selectedCampaign ? (
                <div className="space-y-6">
                  {/* Campaign details */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">
                          {selectedCampaign.title}
                        </h2>
                        <div className="flex items-center gap-2">
                          <p className="text-zinc-400">
                            by {selectedCampaign.brand?.name || "Unknown Brand"}
                          </p>
                          {selectedCampaign.brand?.payment_verified && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              Verified Payment
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                              <Share className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-72 bg-[#2B2D31] border-zinc-800"
                          >
                            <DropdownMenuItem
                              className="text-white focus:bg-[#5865F2] cursor-pointer flex items-center justify-between"
                              onClick={() =>
                                handleCopy(
                                  `${window.location.origin}/campaigns/${selectedCampaign.id}`,
                                  selectedCampaign.id
                                )
                              }
                            >
                              <span className="text-sm">
                                Copy public campaign link
                              </span>
                              {copiedCampaign === selectedCampaign.id && (
                                <span className="text-xs text-zinc-400">
                                  Copied!
                                </span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                        <p className="text-sm text-zinc-400 mb-1">
                          Budget Pool
                        </p>
                        <p className="text-2xl font-semibold text-white">
                          ${Number(selectedCampaign.budget_pool).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                        <p className="text-sm text-zinc-400 mb-1">RPM</p>
                        <p className="text-2xl font-semibold text-white">
                          ${Number(selectedCampaign.rpm).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white">
                        Guidelines
                      </h3>
                      <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {selectedCampaign.guidelines}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission section */}
                  {renderSubmissionSection()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-white">
                    Select a campaign to view details
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Click on any campaign from the list to view more information
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
