import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Users</h2>
        <div className="space-y-4">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-md text-white"
            >
              <div>
                <p className="font-medium">
                  {user.organization_name || "No name"}
                </p>
                <p className="text-sm text-zinc-400">{user.user_type}</p>
              </div>
              <div className="text-sm text-zinc-400">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
