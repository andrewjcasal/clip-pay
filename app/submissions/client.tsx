"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface Submission {
  id: string
  video_url: string
  file_path: string | null
  transcription: string | null
  status: string
  created_at: string
  campaign: {
    id: string
    title: string
    rpm: string
    brand: {
      profiles: {
        organization_name: string
      }
    }
  }
}

interface SubmissionsClientProps {
  submissions: Submission[]
}

export function SubmissionsClient({ submissions }: SubmissionsClientProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string
    title: string
    brand: string
    rpm: string
  } | null>(null)

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-[#2B2D31] rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <button className="text-xl font-semibold text-white">
                    {submission.campaign.title}
                  </button>
                  <p className="text-zinc-400">
                    Brand:{" "}
                    {submission.campaign.brand.profiles.organization_name}
                  </p>
                  <button
                    className="text-sm text-zinc-400 transition-colors hover:text-white underline"
                    onClick={() =>
                      setSelectedCampaign({
                        id: submission.campaign.id,
                        title: submission.campaign.title,
                        brand:
                          submission.campaign.brand.profiles.organization_name,
                        rpm: submission.campaign.rpm,
                      })
                    }
                  >
                    View Campaign
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === "approved"
                        ? "bg-green-500/10 text-green-500"
                        : submission.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
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
                    <iframe
                      src={submission.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                <div className="w-1/3 bg-[#1E1F22] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-2">
                    Transcription
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {submission.transcription || "Processing transcription..."}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-zinc-400">
                  Submitted:{" "}
                  {formatDistanceToNow(new Date(submission.created_at), {
                    addSuffix: true,
                  })}
                </div>
                <div className="text-zinc-400">
                  RPM: ${submission.campaign.rpm}
                </div>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="text-center text-zinc-400 py-12">
              No submissions yet. Check the dashboard for available campaigns!
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
