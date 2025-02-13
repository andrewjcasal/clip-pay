"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Upload,
  Share,
  X,
  DollarSign,
  Users,
  ArrowUpRight,
  RotateCw,
  Pencil,
} from "lucide-react"
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
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import ReactPlayer from "react-player"

interface Campaign {
  id: string
  title: string
  budget_pool: string
  remaining_budget?: number
  rpm: string
  guidelines: string | null
  status: string | null
  video_outline: string | null
  brand: {
    name: string
    payment_verified: boolean
  }
  submission: {
    id: string
    status: string
    video_url: string | null
    file_path: string | null
    campaign_id: string
    views?: number
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

function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: Campaign
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
          {campaign.submission && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                campaign.submission.status === "approved"
                  ? "bg-green-50 text-green-700"
                  : campaign.submission.status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : "bg-[#5865F2]/10 text-[#5865F2]"
              )}
            >
              {campaign.submission.status.charAt(0).toUpperCase() +
                campaign.submission.status.slice(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm text-zinc-500">by</span>
          <span className="text-sm text-zinc-600">
            {campaign.brand?.name || "Unknown Brand"}
          </span>
          {campaign.brand?.payment_verified && (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5865F2]"></span>
              <span className="text-xs text-[#5865F2]">Verified</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            $
            {Number(
              campaign.remaining_budget || campaign.budget_pool
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          {campaign.remaining_budget !== Number(campaign.budget_pool) && (
            <p className="text-xs text-zinc-500">
              of $
              {Number(campaign.budget_pool).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              total
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            $
            {Number(campaign.rpm).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-zinc-500">RPM</p>
        </div>
      </div>
    </div>
  )
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
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

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

  useEffect(() => {
    if (selectedCampaign?.submission?.video_url) {
      setVideoUrl(selectedCampaign.submission.video_url)
    } else {
      setVideoUrl("")
    }
    setIsEditing(false)
  }, [selectedCampaign])

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

      // Update selected campaign if it's the one being edited
      if (selectedCampaign?.submission?.id === submissionId) {
        setSelectedCampaign({
          ...selectedCampaign,
          submission: {
            ...selectedCampaign.submission,
            video_url: videoUrl,
          },
        })
      }

      setIsEditing(false)
      toast.success("Video URL updated successfully!")
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
        <div className="space-y-4 border-t border-zinc-200 pt-6">
          <div className="bg-[#5865F2]/10 text-[#5865F2] p-4 rounded-lg border border-[#5865F2]/20 space-y-3">
            <h3 className="text-lg font-medium">
              {selectedCampaign.submission.status === "approved"
                ? "Your submission has been approved! 🎉"
                : selectedCampaign.submission.status === "fulfilled"
                  ? "You've been paid for your submission! 🎉 ⭐️ ⭐️ ⭐️"
                  : "You've already submitted for this campaign"}
            </h3>
            {selectedCampaign.submission.status === "approved" ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  Your submission has been approved! To start earning, please
                  update your submission with a public video URL.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="publicVideoUrl"
                      className="text-sm font-medium text-zinc-900"
                    >
                      Public Video URL
                    </Label>
                    {selectedCampaign.submission?.video_url && (
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-zinc-100"
                      >
                        <Pencil className="h-4 w-4 text-zinc-500" />
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    {selectedCampaign.submission?.video_url && !isEditing ? (
                      <div className="bg-[#5865F2]/10 text-[#5865F2] p-3 rounded-lg border border-[#5865F2]/20 break-all">
                        {selectedCampaign.submission.video_url}
                      </div>
                    ) : (
                      <Input
                        id="publicVideoUrl"
                        type="url"
                        placeholder="Enter public video URL (YouTube, TikTok, etc.)"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="h-10 bg-white border-zinc-200 text-zinc-900 focus:border-[#5865F2] focus:ring-[#5865F2]/20"
                      />
                    )}
                  </div>
                  {(isEditing || !selectedCampaign.submission?.video_url) && (
                    <Button
                      onClick={() =>
                        selectedCampaign.submission &&
                        handleUpdateVideoUrl(selectedCampaign.submission.id)
                      }
                      disabled={
                        !videoUrl || updatingUrl || !selectedCampaign.submission
                      }
                      className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white mt-3"
                    >
                      {updatingUrl ? "Updating..." : "Update Video URL"}
                    </Button>
                  )}
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
            <Label htmlFor="file" className="text-zinc-900">
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
                    ? "border-[#5865F2] bg-[#5865F2]/5"
                    : file
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                }
              `}
            >
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div
                  className={`rounded-full p-3 transition-colors ${
                    file ? "bg-green-500/10" : "bg-zinc-100"
                  }`}
                >
                  <Upload
                    className={`h-6 w-6 ${
                      file ? "text-green-500" : "text-zinc-600"
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
                      className="text-zinc-600 hover:text-zinc-900"
                    >
                      Remove file
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
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
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="creator" email={email} />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Total Earned
                  </span>
                </div>
                <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.5C8 3.22386 8.22386 3 8.5 3C8.77614 3 9 3.22386 9 3.5C9 3.77614 8.77614 4 8.5 4C8.22386 4 8 3.77614 8 3.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 7.5C8 7.22386 8.22386 7 8.5 7C8.77614 7 9 7.22386 9 7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 11.5C8 11.2239 8.22386 11 8.5 11C8.77614 11 9 11.2239 9 11.5C9 11.7761 8.77614 12 8.5 12C8.22386 12 8 11.7761 8 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                  $0
                </p>
              </div>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Active Campaigns
                  </span>
                </div>
                <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.5C8 3.22386 8.22386 3 8.5 3C8.77614 3 9 3.22386 9 3.5C9 3.77614 8.77614 4 8.5 4C8.22386 4 8 3.77614 8 3.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 7.5C8 7.22386 8.22386 7 8.5 7C8.77614 7 9 7.22386 9 7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 11.5C8 11.2239 8.22386 11 8.5 11C8.77614 11 9 11.2239 9 11.5C9 11.7761 8.77614 12 8.5 12C8.22386 12 8 11.7761 8 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                  {campaigns.length}
                </p>
              </div>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-zinc-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
                      <path d="M12 7L12 13" strokeLinecap="round" />
                      <path d="M16 13L12 13" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Total Views
                  </span>
                </div>
                <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.5C8 3.22386 8.22386 3 8.5 3C8.77614 3 9 3.22386 9 3.5C9 3.77614 8.77614 4 8.5 4C8.22386 4 8 3.77614 8 3.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 7.5C8 7.22386 8.22386 7 8.5 7C8.77614 7 9 7.22386 9 7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 11.5C8 11.2239 8.22386 11 8.5 11C8.77614 11 9 11.2239 9 11.5C9 11.7761 8.77614 12 8.5 12C8.22386 12 8 11.7761 8 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                  {campaigns
                    .reduce((total, campaign) => {
                      // Get the views from the submission if it exists
                      const submissionViews = campaign.submission?.views || 0
                      return total + submissionViews
                    }, 0)
                    .toLocaleString()}
                </p>
              </div>
            </Card>

            <Card className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
                    <RotateCw className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    Avg. RPM
                  </span>
                </div>
                <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.5C8 3.22386 8.22386 3 8.5 3C8.77614 3 9 3.22386 9 3.5C9 3.77614 8.77614 4 8.5 4C8.22386 4 8 3.77614 8 3.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 7.5C8 7.22386 8.22386 7 8.5 7C8.77614 7 9 7.22386 9 7.5C9 7.77614 8.77614 8 8.5 8C8.22386 8 8 7.77614 8 7.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 11.5C8 11.2239 8.22386 11 8.5 11C8.77614 11 9 11.2239 9 11.5C9 11.7761 8.77614 12 8.5 12C8.22386 12 8 11.7761 8 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
                  $0
                </p>
              </div>
            </Card>
          </div>

          {/* Available Campaigns Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  Available Campaigns
                </h2>
                <p className="text-sm text-zinc-500">
                  Apply to campaigns and start earning
                </p>
              </div>
              {hasNewCampaigns && (
                <Button
                  onClick={handleShowNewCampaigns}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  Show New Campaigns
                </Button>
              )}
            </div>

            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
              {campaigns.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-zinc-600">
                    No campaigns available at the moment.
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Check back soon for new opportunities!
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

          {/* Campaign Details Slide-in */}
          <div
            className={`fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[600px] bg-white transform transition-transform duration-300 ease-in-out shadow-xl z-[60] overscroll-contain ${
              selectedCampaign ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {selectedCampaign && (
              <div className="h-full flex flex-col bg-white">
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200 bg-white">
                  <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
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
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                  <div className="space-y-4 md:space-y-6">
                    {/* Campaign details */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-bold text-zinc-900">
                          {selectedCampaign.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-zinc-600">
                            by {selectedCampaign.brand?.name || "Unknown Brand"}
                          </p>
                          {selectedCampaign.brand?.payment_verified && (
                            <span className="inline-flex items-center gap-1.5 bg-[#5865F2]/10 text-[#5865F2] px-2.5 py-1 rounded-full text-xs font-medium border border-[#5865F2]/20">
                              <span className="h-2 w-2 rounded-full bg-[#5865F2] animate-pulse"></span>
                              Verified Payment
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
                          <p className="text-sm text-zinc-600 mb-1">
                            Budget Pool
                          </p>
                          <div className="space-y-1">
                            <p className="text-lg md:text-2xl font-semibold text-zinc-900">
                              $
                              {Number(
                                selectedCampaign.remaining_budget ||
                                  selectedCampaign.budget_pool
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-xs text-zinc-500">
                              of $
                              {Number(
                                selectedCampaign.budget_pool
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              total
                            </p>
                          </div>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
                          <p className="text-sm text-zinc-600 mb-1">RPM</p>
                          <p className="text-lg md:text-2xl font-semibold text-zinc-900">
                            $
                            {Number(selectedCampaign.rpm).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-base md:text-lg font-medium text-zinc-900">
                          Guidelines
                        </h3>
                        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
                          <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                            {selectedCampaign.guidelines}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submission section */}
                    {renderSubmissionSection()}
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

          {/* Add Video Modal */}
          <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-zinc-200">
              <DialogTitle className="sr-only">Video Submission</DialogTitle>
              <div className="aspect-video w-full bg-black">
                {selectedVideo && (
                  <ReactPlayer
                    url={selectedVideo}
                    width="100%"
                    height="100%"
                    controls
                    playing
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
