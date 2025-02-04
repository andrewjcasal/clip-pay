"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Database } from "@/types/supabase"

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

export function SubmissionsClient({ submissions }: SubmissionsClientProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string
    title: string
    brand: string
    rpm: number
  } | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Submissions</h1>
        </div>

        <div className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {submission.campaign.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {submission.campaign.brand.profiles[0]
                        ?.organization_name || "Unknown Brand"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">
                        Submitted{" "}
                        {formatDistanceToNow(new Date(submission.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-500">
                        {(submission.views || 0).toLocaleString()} views
                      </span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-500">
                        ${submission.campaign.rpm} RPM
                      </span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        submission.status === "approved"
                          ? "bg-green-500/10 text-green-400"
                          : submission.status === "rejected"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {submission.status.charAt(0).toUpperCase() +
                        submission.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-2/3">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      {submission.video_url && (
                        <iframe
                          src={submission.video_url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      )}
                    </div>
                  </div>
                  <div className="w-1/3 bg-[#1E1F22] rounded-lg p-4">
                    <h3 className="text-sm font-medium text-white mb-2">
                      Transcription
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {submission.transcription ||
                        "Processing transcription..."}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 text-center">
              <p className="text-zinc-400">No submissions yet</p>
              <p className="text-sm text-zinc-500 mt-1">
                Start submitting videos to campaigns to earn money
              </p>
            </div>
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
