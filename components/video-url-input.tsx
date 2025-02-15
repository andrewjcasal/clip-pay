import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { updateSubmissionVideoUrl } from "@/app/actions/creator"

interface VideoUrlInputProps {
  submissionId: string
  currentUrl: string | null
  onUpdate?: (views: number) => void
}

export function VideoUrlInput({
  submissionId,
  currentUrl,
  onUpdate,
}: VideoUrlInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    if (!videoUrl) return

    try {
      setIsUpdating(true)
      const result = await updateSubmissionVideoUrl(submissionId, videoUrl)

      if (result.success) {
        toast.success("Video URL updated successfully!")
        setIsEditing(false)
        setVideoUrl("")
        onUpdate?.(result.views)
      } else {
        toast.error(result.error || "Failed to update video URL")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update video URL"
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="videoUrl" className="text-sm font-medium text-zinc-900">
          Public Video URL
        </Label>
        {currentUrl && !isEditing && (
          <Button
            onClick={() => {
              setVideoUrl(currentUrl)
              setIsEditing(true)
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-zinc-100"
            data-testid="edit-video-url-button"
          >
            <Pencil className="h-4 w-4 text-zinc-500" />
          </Button>
        )}
      </div>
      <div className="relative">
        {currentUrl && !isEditing ? (
          <div className="bg-[#5865F2]/10 text-[#5865F2] p-3 rounded-lg border border-[#5865F2]/20 break-all">
            {currentUrl}
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter your public video URL"
              className="flex-1 text-zinc-900"
              data-testid="video-url-input"
            />
            <Button
              onClick={handleUpdate}
              disabled={!videoUrl || isUpdating}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="update-video-url-button"
              aria-disabled={!videoUrl || isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
