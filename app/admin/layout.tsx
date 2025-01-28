import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminNav } from "./components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  // First, try to get the raw profile data
  const { data: rawProfile, error: rawError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()

  console.log("Raw profile query:", {
    userId: session.user.id,
    profile: rawProfile,
    error: rawError,
  })

  // Then try the user_type query
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", session.user.id)
    .single()

  console.log("User type query:", {
    userId: session.user.id,
    profile,
    error,
  })

  console.log("profile", profile)

  if (profile?.user_type !== "admin") {
    console.log("Not admin, redirecting. User type:", profile?.user_type)
    redirect("/dashboard")
  }

  // Check if user is admin
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  console.log("admin", admin)

  if (!admin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="flex">
        <div className="w-64 min-h-screen bg-[#2B2D31] p-4">
          <div className="text-white font-bold text-xl mb-6">Admin Panel</div>
          <AdminNav />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
