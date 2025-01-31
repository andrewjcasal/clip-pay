import { createServerSupabaseClient } from "@/lib/supabase-server"
import { PublicCampaignView } from "./public-view"

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id
  const supabase = await createServerSupabaseClient()

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brand:brands!inner (
        id,
        profiles (
          organization_name
        )
      )
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching campaign:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1e] via-[#2B2D31] to-[#1a1b1e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Error Loading Campaign
          </h1>
          <p className="text-zinc-400">
            {error.message === "JWT token is invalid"
              ? "This campaign requires authentication."
              : "Unable to load campaign details."}
          </p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1e] via-[#2B2D31] to-[#1a1b1e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Campaign Not Found
          </h1>
          <p className="text-zinc-400">
            This campaign may have ended or doesn't exist.
          </p>
        </div>
      </div>
    )
  }

  return <PublicCampaignView campaign={campaign} />
}
