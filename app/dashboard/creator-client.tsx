"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitVideo, getCreatorCampaigns } from "./actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RealtimeChannel } from "@supabase/supabase-js"
import Link from "next/link"

interface Campaign {
  id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  status: string
  brand: {
    name: string
  }
  submission: null
}

interface CreatorDashboardClientProps {
  transformedCampaigns: Campaign[]
}

// Add interface for the Supabase response
interface CampaignResponse {
  id: string
  title: string
  budget_pool: number
  rpm: number
  guidelines: string
  status: string
  brands: {
    name: string
  }
}

export function CreatorDashboardClient({
  transformedCampaigns = [],
}: CreatorDashboardClientProps) {
  const [campaigns, setCampaigns] = useState(transformedCampaigns)
  const [newCampaigns, setNewCampaigns] = useState<Campaign[]>([])
  const [hasNewCampaigns, setHasNewCampaigns] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  )
  const [videoUrl, setVideoUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedCampaignId, setSubmittedCampaignId] = useState<string | null>(
    null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [showNewCampaignBanner, setShowNewCampaignBanner] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const isJustSubmitted =
    selectedCampaign && selectedCampaign.id === submittedCampaignId

  useEffect(() => {
    // Poll for new campaigns every minute
    const pollInterval = setInterval(async () => {
      try {
        const latestCampaigns = await getCreatorCampaigns()

        // Check if there are any new campaigns
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
      } catch (error) {
        console.error("Error polling for campaigns:", error)
      }
    }, 60000) // Poll every minute

    return () => clearInterval(pollInterval)
  }, [campaigns])

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
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 border-t border-zinc-700 pt-6">
        <h3 className="text-lg font-medium text-white">Apply for Campaign</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-zinc-300">
              Video URL
            </Label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="Enter video URL (YouTube, TikTok, etc.)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="border-0 bg-[#1E1F22] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-zinc-300">
              Or Upload Video
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
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Creator Platform
              </h1>
              <p className="text-sm text-zinc-400">
                Browse and apply for brand campaigns
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/dashboard"
                className="text-white hover:text-zinc-300 transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/submissions"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                My Submissions
              </a>
              <a
                href="/earnings"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Earnings
              </a>
              {hasNewCampaigns && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="text-sm"
                >
                  New campaigns available
                </Button>
              )}
              <div className="flex items-center gap-4 ml-4 border-l border-zinc-800 pl-4">
                <Link href="/notifications">
                  <Bell className="text-zinc-400 hover:text-white transition-colors" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-[#2B2D31] border-zinc-800"
                  >
                    <DropdownMenuItem
                      className="text-white focus:bg-[#5865F2] cursor-pointer"
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                      className="w-full bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 rounded-lg p-3 text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#5865F2]">
                          <span className="font-medium">
                            {newCampaigns.length} new campaign
                            {newCampaigns.length > 1 ? "s" : ""} available!
                          </span>
                        </p>
                        <span className="text-xs text-[#5865F2]/70 group-hover:text-[#5865F2] transition-colors">
                          Click to view
                        </span>
                      </div>
                    </button>
                  )}
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCampaign?.id === campaign.id
                          ? "bg-black/40 border border-zinc-700/50"
                          : "hover:bg-black/30 border border-transparent hover:border-zinc-800/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-medium">
                            {campaign.title}
                          </h3>
                          {campaign.submission && (
                            <span className="text-xs px-2 py-1 rounded-full bg-[#5865F2]/10 text-[#5865F2]">
                              Submitted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">
                          by {campaign.brand?.name || "Unknown Brand"}
                        </p>
                        <p className="text-sm text-zinc-400">
                          RPM: ${campaign.rpm}
                        </p>
                      </div>
                    </div>
                  ))}
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
          <div className="flex-1 self-start bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6">
            {selectedCampaign ? (
              <div className="space-y-6">
                {/* Campaign details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedCampaign.title}
                    </h2>
                    <p className="text-zinc-400">
                      by {selectedCampaign.brand?.name || "Unknown Brand"}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-3 rounded-lg">
                      <p className="text-sm text-zinc-400">Budget Pool</p>
                      <p className="text-lg font-semibold text-white">
                        ${selectedCampaign.budget_pool}
                      </p>
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-3 rounded-lg">
                      <p className="text-sm text-zinc-400">RPM</p>
                      <p className="text-lg font-semibold text-white">
                        ${selectedCampaign.rpm}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">
                      Guidelines
                    </h3>
                    <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">
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
  )
}
