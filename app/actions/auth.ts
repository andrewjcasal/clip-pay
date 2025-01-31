"use server"
import { redirect } from "next/navigation"
import { createServerActionClient } from "../auth/actions"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  try {
    const supabase = await createServerActionClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Get session to check if sign in was successful
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw new Error("Failed to get session after sign in")
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single()

    // Redirect based on onboarding status
    if (!profile?.onboarding_completed) {
      redirect(
        `/onboarding/${session.user.user_metadata.user_type === "brand" ? "brand/profile" : "creator/profile"}`
      )
    }

    redirect("/dashboard")
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred")
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const userType = formData.get("userType") as "brand" | "creator" | "admin"

  if (!email || !password || !userType) {
    throw new Error("All fields are required")
  }

  try {
    const supabase = await createServerActionClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
        data: {
          user_type: userType,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      // For admin users, set onboarding_completed to true
      if (userType === "admin") {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", data.user.id)
      }

      return // Success case just returns
    }

    throw new Error("Failed to create user")
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred")
  }
}

export async function signOut() {
  try {
    const supabase = await createServerActionClient()
    await supabase.auth.signOut()
    redirect("/signin")
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred")
  }
}
