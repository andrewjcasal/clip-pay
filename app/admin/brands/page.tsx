import { getAuthenticatedUser } from "@/lib/supabase-server"

export default async function AdminBrandsPage() {
  const { supabase } = await getAuthenticatedUser()

  const { data: brands, error } = await supabase
    .from("brands")
    .select(
      `
      *,
      profiles (
        email,
        organization_name
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching brands:", error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Brands</h1>
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
                Stripe Customer
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
            {brands?.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {brand.profiles?.organization_name || "Not set"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {brand.profiles?.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {brand.stripe_customer_id || "Not set"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(brand.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
