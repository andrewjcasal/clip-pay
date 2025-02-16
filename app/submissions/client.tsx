"use client"

import { useState } from "react"
import { X, Search, Star, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { updateSubmissionVideoUrl } from "@/app/actions/creator"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import type { SubmissionWithCampaign } from "./page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Checkbox } from "@/components/ui/checkbox"
import { VideoUrlInput } from "@/components/video-url-input"

interface SubmissionsClientProps {
  submissions: SubmissionWithCampaign[]
  email: string
}

type TabType = "approved" | "pending" | "fulfilled" | "archived"

export function SubmissionsClient({
  submissions: initialSubmissions,
  email,
}: SubmissionsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("approved")
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCampaign | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<
    string | null
  >(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState(initialSubmissions)

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
    if (!videoUrls[submissionId]) {
      return
    }

    try {
      setUpdatingSubmissionId(submissionId)

      const result = await updateSubmissionVideoUrl(
        submissionId,
        videoUrls[submissionId]
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to update video URL")
      }

      setVideoUrls((prev) => {
        const newState = {
          ...prev,
          [submissionId]: "",
        }

        return newState
      })

      toast.success("Video URL updated successfully!")
    } catch (error) {
      console.error("Error updating video URL:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update video URL"
      )
    } finally {
      setUpdatingSubmissionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader userType="creator" email={email} />

      {/* Main content - Add left margin to account for navigation */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <div className="space-y-6">
            {/* Header with title */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#101828]">Submissions</h1>
            </div>

            {/* Status Tabs */}
            <div className="border-b border-[#E4E7EC]">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const count = submissions.filter((s) => {
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

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-3 text-sm font-medium whitespace-nowrap",
                        activeTab === tab.id
                          ? "text-[#5865F2] border-b-2 border-[#5865F2]"
                          : "text-[#475467] hover:text-[#101828]"
                      )}
                    >
                      {tab.label}
                      <span className="ml-2 text-xs rounded-full bg-[#F9FAFB] text-[#475467] px-2 py-0.5">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Table */}
            <div className="border border-[#E4E7EC] rounded-lg bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E7EC]">
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-[#475467]">
                        Campaign
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-[#475467]">
                        Submitted
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-[#475467]">
                        Brand
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-[#475467]">
                        Performance
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-sm font-medium text-[#475467]">
                        Status
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="group hover:bg-[#F9FAFB] cursor-pointer"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#101828]">
                          {submission.campaign.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#475467]">
                          {new Date(submission.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}{" "}
                          {new Date(submission.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#F9FAFB] flex items-center justify-center">
                            <span className="text-xs font-medium text-[#475467]">
                              {submission.campaign.brand.profile?.organization_name?.charAt(
                                0
                              )}
                            </span>
                          </div>
                          <span className="text-sm text-[#475467]">
                            {
                              submission.campaign.brand.profile
                                ?.organization_name
                            }
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#475467]">
                              Views
                            </span>
                            <span className="text-xs font-medium text-[#101828]">
                              {submission.views}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#475467]">
                              Earned
                            </span>
                            <span className="text-xs font-medium text-[#101828]">
                              $
                              {(
                                (submission.views *
                                  Number(submission.campaign.rpm)) /
                                1000
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            submission.status === "approved"
                              ? "bg-[#ECFDF3] text-[#027A48]"
                              : submission.status === "rejected"
                                ? "bg-[#FEF3F2] text-[#B42318]"
                                : submission.status === "fulfilled"
                                  ? "bg-[#EFF8FF] text-[#175CD3]"
                                  : "bg-[#FFFAEB] text-[#B54708]"
                          )}
                        >
                          {submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-start">
              <p className="text-sm text-[#475467]">
                Showing {filteredSubmissions.length} submissions
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Submission Details Slide-in */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[600px] bg-white transform transition-transform duration-300 ease-in-out ${
          selectedSubmission ? "translate-x-0" : "translate-x-full"
        } shadow-xl z-[60] overscroll-contain`}
      >
        {selectedSubmission && (
          <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-200">
              <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
                Submission Details
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-6">
                {/* Campaign Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="text-xl md:text-2xl font-bold text-zinc-900 truncate group relative"
                      title={selectedSubmission.campaign.title}
                    >
                      {selectedSubmission.campaign.title}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                          selectedSubmission.status === "approved"
                            ? "bg-[#ECFDF3] text-[#027A48]"
                            : selectedSubmission.status === "rejected"
                              ? "bg-[#FEF3F2] text-[#B42318]"
                              : selectedSubmission.status === "fulfilled"
                                ? "bg-[#EFF8FF] text-[#175CD3]"
                                : "bg-[#FFFAEB] text-[#B54708]"
                        )}
                      >
                        {selectedSubmission.status.charAt(0).toUpperCase() +
                          selectedSubmission.status.slice(1)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Submitted{" "}
                        {new Date(
                          selectedSubmission.created_at
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F9FAFB] flex items-center justify-center">
                      <span className="text-xs font-medium text-[#475467]">
                        {selectedSubmission.campaign.brand.profile?.organization_name?.charAt(
                          0
                        )}
                      </span>
                    </div>
                    <span className="text-sm text-zinc-600">
                      {
                        selectedSubmission.campaign.brand.profile
                          ?.organization_name
                      }
                    </span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="flex gap-4 bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-zinc-600">Views</p>
                    <p className="text-base font-semibold text-zinc-900">
                      {selectedSubmission.views}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-600">Earned</p>
                    <p className="text-base font-semibold text-zinc-900">
                      $
                      {(
                        (selectedSubmission.views *
                          Number(selectedSubmission.campaign.rpm)) /
                        1000
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-600">Campaign RPM</p>
                    <p className="text-base font-semibold text-zinc-900">
                      ${Number(selectedSubmission.campaign.rpm).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Submission Date */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                  <p className="text-sm text-zinc-600 mb-1">Submitted On</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {new Date(selectedSubmission.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                {/* Public Video URL Section - Only show for approved submissions */}
                {selectedSubmission.status === "approved" && (
                  <div className="space-y-4">
                    <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 p-4 rounded-lg">
                      <VideoUrlInput
                        submissionId={selectedSubmission.id}
                        currentUrl={selectedSubmission.video_url}
                        onUpdate={(views) => {
                          // Update the submissions list with new views
                          const updatedSubmissions = submissions.map((sub) =>
                            sub.id === selectedSubmission.id
                              ? {
                                  ...sub,
                                  views,
                                  video_url: videoUrls[selectedSubmission.id],
                                }
                              : sub
                          )
                          setSubmissions(updatedSubmissions)

                          // Update the selected submission
                          setSelectedSubmission({
                            ...selectedSubmission,
                            views,
                            video_url: videoUrls[selectedSubmission.id],
                          })
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Submission Video */}
                {selectedSubmission.file_path && (
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-zinc-900">
                      Submission Video
                    </h4>
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <VideoPlayer
                        url={selectedSubmission.file_path}
                        isSupabaseStorage={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-[55]"
          onClick={() => setSelectedSubmission(null)}
        />
      )}

      {/* Add Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-zinc-200">
          <DialogTitle className="sr-only">Video Submission</DialogTitle>
          <div className="aspect-video w-full bg-black">
            {selectedVideo && (
              <VideoPlayer url={selectedVideo} autoPlay={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
