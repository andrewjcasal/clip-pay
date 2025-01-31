import { createServerSupabaseClient } from "@/lib/supabase-server"

export default async function CampaignsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      brands (
        id,
        profiles (
          organization_name
        )
      ),
      submissions (
        id,
        status,
        creator_id,
        profiles (
          organization_name
        )
      )
    `
    )
    .order("created_at", { ascending: false })

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <div className="bg-[#2B2D31] rounded-lg p-6">
          <p className="text-zinc-400">No campaigns found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Campaigns</h1>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 bg-[#1E1F22] rounded-md text-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{campaign.title}</h3>
                  <p className="text-sm text-zinc-400">
                    by {campaign.brands?.profiles?.organization_name}
                  </p>
                </div>
                <div className="text-sm">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      campaign.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-zinc-400">Budget Pool</p>
                  <p className="font-medium">${campaign.budget_pool}</p>
                </div>
                <div>
                  <p className="text-zinc-400">RPM</p>
                  <p className="font-medium">${campaign.rpm}</p>
                </div>
                <div>
                  <p className="text-zinc-400">Submissions</p>
                  <p className="font-medium">
                    {campaign.submissions?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
