import ReactPlayer from "react-player"
import { toast } from "sonner"

interface VideoPlayerProps {
  url: string | null
  isSupabaseStorage?: boolean
  autoPlay?: boolean
  className?: string
}

export function VideoPlayer({
  url,
  isSupabaseStorage = false,
  autoPlay = false,
  className = "",
}: VideoPlayerProps) {
  if (!url) return null

  const videoUrl = isSupabaseStorage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${url}`
    : url

  return (
    <div
      className={`aspect-video w-full rounded-lg overflow-hidden bg-black ${className}`}
    >
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        controls
        playing={autoPlay}
        playsinline
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous",
            },
          },
        }}
        onError={(e) => {
          console.error("Video playback error:", e)
          toast.error("Failed to load video. Please try again.")
        }}
      />
    </div>
  )
}
