"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { updateSubmissionVideoUrl } from "@/app/dashboard/actions"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import ReactPlayer from "react-player"
import { SubmissionWithCampaign } from "./page"

interface SubmissionsClientProps {
  submissions: SubmissionWithCampaign[]
}

type TabType = "approved" | "pending" | "fulfilled" | "archived"

export function SubmissionsClient({ submissions }: SubmissionsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("approved")
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string
    title: string
    brand: string
    rpm: number
  } | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<
    string | null
  >(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const tabs: { id: TabType; label: string }[] = [
    { id: "approved", label: "Approved Submissions" },
    { id: "pending", label: "Pending Submissions" },
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

  const handleUpdateVideoUrl = async (submissionId: string) => {
    const url = videoUrls[submissionId]
    if (!url) return

    setUpdatingSubmissionId(submissionId)
    try {
      await updateSubmissionVideoUrl(submissionId, url)
      toast.success("Video URL updated successfully!")
      setVideoUrls((prev) => ({ ...prev, [submissionId]: "" }))
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
          <h1 className="text-2xl font-bold text-zinc-900">My Submissions</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-zinc-900 border-b-2 border-[#5865F2]"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
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
            <div className="text-center py-12 bg-white border border-zinc-200 rounded-lg">
              <p className="text-zinc-500">No {activeTab} submissions found</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-zinc-900">
                      {submission.campaign.title}
                    </h3>
                    <p className="text-sm text-zinc-600">
                      for {submission.campaign.brand.profile?.organization_name}
                      {submission.file_path && (
                        <>
                          {" · "}
                          <button
                            onClick={() => {
                              setSelectedVideo(
                                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${submission.file_path}`
                              )
                              setVideoModalOpen(true)
                            }}
                            className="text-[#5865F2] hover:underline"
                          >
                            Watch submission
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-sm px-3 py-1 rounded-full border",
                        submission.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : submission.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
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
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                    <p className="text-sm text-zinc-600 mb-1">RPM</p>
                    <p className="text-xl font-semibold text-zinc-900">
                      ${Number(submission.campaign.rpm).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                    <p className="text-sm text-zinc-600 mb-1">Views</p>
                    <p className="text-xl font-semibold text-zinc-900">
                      {submission.views}
                    </p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                    <p className="text-sm text-zinc-600 mb-1">Earned</p>
                    <p className="text-xl font-semibold text-zinc-900">
                      $
                      {(
                        (submission.views * Number(submission.campaign.rpm)) /
                        1000
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {submission.status === "approved" && !submission.video_url && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="video-url" className="border-none">
                        <AccordionTrigger className="flex items-center justify-between px-4 py-3 hover:no-underline">
                          <span className="text-sm text-zinc-700">
                            Add Public Video URL
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                id={`video-url-${submission.id}`}
                                type="url"
                                placeholder="Enter public video URL (YouTube, TikTok, etc.)"
                                value={videoUrls[submission.id] || ""}
                                onChange={(e) =>
                                  setVideoUrls((prev) => ({
                                    ...prev,
                                    [submission.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 border border-zinc-200 bg-white text-zinc-900"
                              />
                              <Button
                                onClick={() =>
                                  handleUpdateVideoUrl(submission.id)
                                }
                                disabled={
                                  !videoUrls[submission.id] ||
                                  updatingSubmissionId === submission.id
                                }
                                className="bg-[#5865F2] hover:bg-[#4752C4] text-white shrink-0"
                              >
                                {updatingSubmissionId === submission.id
                                  ? "Updating..."
                                  : "Update URL"}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {submission.video_url && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="video-url" className="border-none">
                        <AccordionTrigger className="flex items-center justify-between px-4 py-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-700">
                              Public Video URL:
                            </span>
                            <a
                              href={submission.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#5865F2] hover:underline max-w-[300px] truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {submission.video_url}
                            </a>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                id={`video-url-${submission.id}`}
                                type="url"
                                placeholder="Enter new public video URL"
                                value={videoUrls[submission.id] || ""}
                                onChange={(e) =>
                                  setVideoUrls((prev) => ({
                                    ...prev,
                                    [submission.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 border border-zinc-200 bg-white text-zinc-900"
                              />
                              <Button
                                onClick={() =>
                                  handleUpdateVideoUrl(submission.id)
                                }
                                disabled={
                                  !videoUrls[submission.id] ||
                                  updatingSubmissionId === submission.id
                                }
                                className="bg-[#5865F2] hover:bg-[#4752C4] text-white shrink-0"
                              >
                                {updatingSubmissionId === submission.id
                                  ? "Updating..."
                                  : "Update URL"}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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

      {/* Add Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-[#2B2D31] border-zinc-800">
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
  )
}
