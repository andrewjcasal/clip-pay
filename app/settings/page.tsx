import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

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
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    redirect("/signin")
  }

  // Get creator's Stripe account status if they are a creator
  let hasStripeAccount = false
  let autoApprovalEnabled = false

  if (profile.user_type === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("stripe_account_id, stripe_account_status")
      .eq("user_id", user.id)
      .single()

    // Only consider the account connected if it's active
    hasStripeAccount = creator?.stripe_account_status === "active"
  } else if (profile.user_type === "brand") {
    // Get brand's auto-approval setting
    const { data: brand } = await supabase
      .from("brands")
      .select("auto_approval_enabled")
      .eq("user_id", user.id)
      .single()

    autoApprovalEnabled = brand?.auto_approval_enabled || false
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        userType={profile.user_type as "creator" | "brand"}
        email={user.email || ""}
      />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Account Settings
                </h1>
                <p className="text-zinc-600">
                  Manage your account settings and preferences
                </p>
              </div>

              <SettingsForm
                email={user.email || ""}
                userType={profile.user_type as "creator" | "brand"}
                hasStripeAccount={hasStripeAccount}
                autoApprovalEnabled={autoApprovalEnabled}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
