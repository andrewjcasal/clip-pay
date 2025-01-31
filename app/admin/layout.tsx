import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { AdminNav } from "./components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdminNav />
        {children}
      </div>
    </div>
  )
}
