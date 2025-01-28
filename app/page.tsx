import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { LandingContent } from "./content"

export default async function LandingPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return <LandingContent />
}
