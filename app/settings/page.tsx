import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  // Get user profile to check type
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/signin")
  }

  // Get creator's Stripe account status if they are a creator
  let hasStripeAccount = false
  if (profile.user_type === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    hasStripeAccount = !!creator?.stripe_account_id
  }

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-zinc-400">
              Manage your account settings and preferences
            </p>
          </div>

          <SettingsForm
            email={user.email || ""}
            userType={profile.user_type as "creator" | "brand"}
            hasStripeAccount={hasStripeAccount}
          />
        </div>
      </div>
    </div>
  )
}
