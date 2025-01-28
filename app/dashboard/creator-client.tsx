"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

interface Campaign {
  id: string
  title: string
  budget_pool: number
  rpm: number
  guidelines: string
  status: string
  brand: {
    organization_name: string
  }
  submission: {
    id: string
    status: string
    video_url: string | null
    file_path: string | null
  } | null
}

interface CreatorDashboardClientProps {
  transformedCampaigns: Campaign[]
}

export function CreatorDashboardClient({
  transformedCampaigns = [],
}: CreatorDashboardClientProps) {
  const [initialCampaigns, setInitialCampaigns] = useState(transformedCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  )
  const [videoUrl, setVideoUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedCampaign) return
    setIsSubmitting(true)

    try {
      let filePath = null
      let videoUrl = null

      if (file) {
        // Upload video to Supabase Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(fileName, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw uploadError
        }
        filePath = fileName

        // Get the public URL of the uploaded video
        const {
          data: { publicUrl },
        } = supabase.storage.from("videos").getPublicUrl(fileName)
        console.log("publicUrl", publicUrl)

        videoUrl = publicUrl
      }

      // Submit to API for audio processing
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          video_url: videoUrl,
          file_path: filePath,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      // Update the campaigns list to show submitted status
      const submissionData = await response.json()
      const updatedCampaigns = initialCampaigns.map((campaign) =>
        campaign.id === selectedCampaign.id
          ? {
              ...campaign,
              submission: submissionData,
            }
          : campaign
      )
      setSelectedCampaign({ ...selectedCampaign, submission: submissionData })
      setInitialCampaigns(updatedCampaigns)

      setFile(null)
      setVideoUrl("")
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting campaign:", error)
      setIsSubmitted(false)
      setFile(null)
      setVideoUrl("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSubmissionSection = () => {
    if (selectedCampaign?.submission) {
      return (
        <div className="space-y-4 mb-4">
          <div className="bg-blue-500/10 text-blue-500 p-4 rounded-md space-y-3">
            <h3 className="text-lg font-medium">
              You've already submitted for this campaign
            </h3>
            <p className="text-sm">
              View your submission in your{" "}
              <Button
                variant="link"
                className="text-blue-500 p-0 h-auto font-semibold hover:text-blue-400"
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

    if (isSubmitted) {
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
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="border-0 bg-[#1E1F22] text-white"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  ✕
                </Button>
              )}
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
    <div className="min-h-screen bg-[#313338]">
      {/* Remove the Top Nav */}
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Total Earned</h3>
          <p className="text-2xl font-semibold text-white">$0</p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">
            Active Campaigns
          </h3>
          <p className="text-2xl font-semibold text-white">
            {initialCampaigns.length}
          </p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Total Views</h3>
          <p className="text-2xl font-semibold text-white">0</p>
        </div>
        <div className="bg-[#2B2D31] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-zinc-400">Avg. RPM</h3>
          <p className="text-2xl font-semibold text-white">$0</p>
        </div>
      </div>

      {/* Campaign list and details */}
      <div className="flex gap-4 p-4">
        <div className="w-[30%] bg-[#2B2D31] rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Available Campaigns
            </h2>
          </div>
          <div className="space-y-2">
            {initialCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedCampaign?.id === campaign.id
                    ? "bg-[#404249]"
                    : "hover:bg-[#35373C]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-medium">{campaign.title}</h3>
                    {campaign.submission && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                        Submitted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">
                    by {campaign.brand?.organization_name || "Unknown Brand"}
                  </p>
                  <p className="text-sm text-zinc-400">RPM: ${campaign.rpm}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[70%] bg-[#2B2D31] rounded-lg p-4">
          {selectedCampaign ? (
            <div className="flex flex-col h-full">
              {/* Show existing submission notice at top if it exists */}
              {selectedCampaign.submission && (
                <div className="mb-6">
                  <div className="bg-blue-500/10 text-blue-500 p-4 rounded-md space-y-3">
                    <h3 className="text-lg font-medium">
                      You've already submitted for this campaign
                    </h3>
                    <p className="text-sm">
                      View your submission in your{" "}
                      <Button
                        variant="link"
                        className="text-blue-500 p-0 h-auto font-semibold hover:text-blue-400"
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
              )}

              {/* Campaign details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedCampaign.title}
                  </h2>
                  <p className="text-zinc-400">
                    by{" "}
                    {selectedCampaign.brand?.organization_name ||
                      "Unknown Brand"}
                  </p>
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
              </div>

              {/* Show submission form at bottom if no existing submission */}
              {!selectedCampaign.submission && (
                <div className="mt-auto pt-6">
                  {isSubmitted ? (
                    <div className="bg-green-500/10 text-green-500 p-4 rounded-md space-y-3">
                      <h3 className="text-lg font-medium">
                        Video Successfully Submitted!
                      </h3>
                      <p className="text-sm">
                        Your video has been submitted for review. You can view
                        all your submissions in your{" "}
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
                  ) : (
                    <div className="space-y-4">{renderSubmissionSection()}</div>
                  )}
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
    </div>
  )
}
