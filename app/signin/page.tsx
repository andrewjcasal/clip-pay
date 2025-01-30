import { getOptionalUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import SignInForm from "./form"

export default async function SignInPage() {
  const { session } = await getOptionalUser()

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return <SignInForm />
}
