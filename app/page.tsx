import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { LandingContent } from "./content"

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return <LandingContent />
}
