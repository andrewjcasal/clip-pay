import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function BrandsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: brands, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", "brand")
    .order("created_at", { ascending: false })

  console.log("Brands data:", brands)
  console.log("Query error:", error)

  if (!brands || brands.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Brands</h1>
        <div className="bg-[#2B2D31] rounded-lg p-6">
          <p className="text-zinc-400">No brands found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Brands</h1>
      <div className="bg-[#2B2D31] rounded-lg p-6">
        <div className="space-y-4">
          {brands?.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between p-4 bg-[#1E1F22] rounded-md text-white"
            >
              <div>
                <p className="font-medium">
                  {brand.organization_name || "No name"}
                </p>
                <p className="text-sm text-zinc-400">{brand.email}</p>
              </div>
              <div className="text-sm text-zinc-400">
                {new Date(brand.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
