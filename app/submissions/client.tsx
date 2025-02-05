"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Database } from "@/types/supabase"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSubmissionVideoUrl } from "@/app/dashboard/actions"
import { toast } from "sonner"

type Tables = Database["public"]["Tables"]
type SubmissionRow = Tables["submissions"]["Row"]
type CampaignRow = Tables["campaigns"]["Row"]
type ProfileRow = Tables["profiles"]["Row"]

interface SubmissionWithCampaign extends SubmissionRow {
  campaign: Pick<CampaignRow, "id" | "title" | "rpm"> & {
    brand: {
      profiles: Pick<ProfileRow, "organization_name">[]
    }
  }
}

interface SubmissionsClientProps {
  submissions: SubmissionWithCampaign[]
}

type TabType = "approved" | "pending" | "fulfilled" | "archived"

export function SubmissionsClient({ submissions }: SubmissionsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string
    title: string
    brand: string
    rpm: number
  } | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<
    string | null
  >(null)

  const tabs: { id: TabType; label: string }[] = [
    { id: "pending", label: "Pending Submissions" },
    { id: "approved", label: "Approved Submissions" },
    { id: "fulfilled", label: "Fulfilled" },
    { id: "archived", label: "Archived (Rejected)" },
  ]

  const filteredSubmissions = submissions.filter((submission) => {
    switch (activeTab) {
      case "pending":
        return submission.status === "pending"
      case "approved":
        return submission.status === "approved"
      case "fulfilled":
        return submission.status === "fulfilled"
      case "archived":
        return submission.status === "rejected"
      default:
        return true
    }
  })

  const handleUpdateVideoUrl = async (submissionId: string, url: string) => {
    if (!url) return

    setUpdatingSubmissionId(submissionId)
    try {
      await updateSubmissionVideoUrl(submissionId, url)
      toast.success("Video URL updated successfully!")
      setVideoUrl("")
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error("Error updating video URL:", error)
      toast.error("Failed to update video URL. Please try again.")
    } finally {
      setUpdatingSubmissionId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Submissions</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-800">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-white border-b-2 border-[#5865F2]"
                    : "text-zinc-400 hover:text-zinc-300"
                )}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  {
                    submissions.filter((s) => {
                      switch (tab.id) {
                        case "pending":
                          return s.status === "pending"
                        case "approved":
                          return s.status === "approved"
                        case "fulfilled":
                          return s.status === "fulfilled"
                        case "archived":
                          return s.status === "rejected"
                        default:
                          return false
                      }
                    }).length
                  }
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submissions list */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-[#2B2D31] rounded-lg">
              <p className="text-zinc-400">No {activeTab} submissions found</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-[#2B2D31] rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-white">
                      {submission.campaign.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      for{" "}
                      {submission.campaign.brand.profiles[0]?.organization_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-sm px-3 py-1 rounded-full border",
                        submission.status === "approved"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : submission.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20"
                      )}
                    >
                      {submission.status.charAt(0).toUpperCase() +
                        submission.status.slice(1)}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {formatDistanceToNow(new Date(submission.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">RPM</p>
                    <p className="text-xl font-semibold text-white">
                      ${Number(submission.campaign.rpm).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Views</p>
                    <p className="text-xl font-semibold text-white">
                      {submission.views}
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-1">Earned</p>
                    <p className="text-xl font-semibold text-white">
                      $
                      {(
                        (submission.views * Number(submission.campaign.rpm)) /
                        1000
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {submission.status === "approved" && (
                  <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg space-y-3">
                    <Label
                      htmlFor={`video-url-${submission.id}`}
                      className="text-sm text-zinc-300"
                    >
                      Add Public Video URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`video-url-${submission.id}`}
                        type="url"
                        placeholder="Enter public video URL (YouTube, TikTok, etc.)"
                        value={
                          submission.id === updatingSubmissionId ? videoUrl : ""
                        }
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="flex-1 border-0 bg-[#1E1F22] text-white"
                      />
                      <Button
                        onClick={() =>
                          handleUpdateVideoUrl(submission.id, videoUrl)
                        }
                        disabled={
                          !videoUrl || updatingSubmissionId === submission.id
                        }
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white shrink-0"
                      >
                        {updatingSubmissionId === submission.id
                          ? "Updating..."
                          : "Update URL"}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Add your public video URL to start earning from views
                    </p>
                  </div>
                )}

                {submission.video_url && (
                  <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Draft URL:</span>
                      <a
                        href={submission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#5865F2] hover:underline"
                      >
                        {submission.video_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campaign Details Slide-in */}
      <div
        className={`fixed inset-y-0 right-0 w-[400px] bg-[#2B2D31] transform transition-transform duration-300 ease-in-out ${
          selectedCampaign ? "translate-x-0" : "translate-x-full"
        } shadow-xl z-50`}
      >
        {selectedCampaign && (
          <div className="h-full flex flex-col">
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
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {selectedCampaign.title}
                </h3>
                <p className="text-zinc-400">by {selectedCampaign.brand}</p>
              </div>
              <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-3 rounded-lg">
                <p className="text-sm text-zinc-400">RPM</p>
                <p className="text-lg font-semibold text-white">
                  ${selectedCampaign.rpm}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  )
}
