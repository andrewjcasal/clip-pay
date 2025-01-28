import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function CreatorsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: creators, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "creator")
    .order("created_at", { ascending: false })

  console.log("Creators data:", creators)
  console.log("Query error:", error)

  if (!creators || creators.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Creators</h1>
        <div className="bg-[#2B2D31] rounded-lg p-6">
          <p className="text-zinc-400">No creators found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Creators</h1>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <div className="space-y-4">
          {creators?.map((creator) => (
            <div
              key={creator.id}
              className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-md text-white"
            >
              <div>
                <p className="font-medium">
                  {creator.organization_name || "No name"}
                </p>
                <p className="text-sm text-zinc-400">{creator.email}</p>
              </div>
              <div className="text-sm text-zinc-400">
                {new Date(creator.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
