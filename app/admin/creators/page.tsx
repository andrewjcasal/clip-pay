import { getAuthenticatedUser } from "@/lib/supabase-server"

export default async function AdminCreatorsPage() {
  const { supabase } = await getAuthenticatedUser()

  const { data: creators, error } = await supabase
    .from("profiles")
    .select("*, submissions(count)")
    .eq("user_type", "creator")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching creators:", error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Creators</h1>
      <div className="bg-[#2B2D31] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-[#1E1F22]">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Organization
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Stripe Account
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Submissions
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {creators?.map((creator) => (
              <tr key={creator.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.organization_name || "Not set"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.stripe_account_id || "Not set"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.submissions?.[0]?.count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(creator.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
