import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/utils/supabase-server"
import { LandingContent } from "./content"

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return <LandingContent />
}
