import { getOptionalUser } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { SignUpForm } from "./form"

export default async function SignUpPage() {
  const { session } = await getOptionalUser()

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return <SignUpForm />
}
