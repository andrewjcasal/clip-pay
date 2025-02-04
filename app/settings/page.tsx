import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./form"

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="ml-64">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Account Settings
              </h1>
              <p className="text-zinc-400">
                Manage your account settings and preferences
              </p>
            </div>

            <SettingsForm email={user.email || ""} />
          </div>
        </div>
      </div>
    </div>
  )
}
