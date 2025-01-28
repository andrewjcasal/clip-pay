import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function CampaignsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, brands(*)")
    .order("created_at", { ascending: false })

  console.log("Campaigns data:", campaigns)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Campaigns</h1>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <div className="space-y-4">
          {campaigns?.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-md text-white"
            >
              <div>
                <p className="font-medium">{campaign.title}</p>
                <p className="text-sm text-zinc-400">
                  by {campaign.brands?.organization_name}
                </p>
              </div>
              <div className="text-sm text-zinc-400">
                {new Date(campaign.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
