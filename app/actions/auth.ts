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
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Failed to get session after sign in")
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, user_type")
      .eq("user_id", user.id)
      .single()

    // Check if user is admin
    if (profile?.user_type === "admin") {
      redirect("/admin")
    }

    // Redirect based on onboarding status
    if (!profile?.onboarding_completed) {
      redirect(
        `/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator"}`
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
  "use server"

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const userType = formData.get("userType") as "creator" | "brand"

  if (!email || !password || !userType) {
    throw new Error("Missing required fields")
  }

  const supabase = await createServerActionClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/${userType}/callback`,
    },
  })

  if (error) {
    throw error
  }

  return { success: true }
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

export async function forgotPassword(email: string) {
  "use server"

  const supabase = await createServerActionClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to send reset link",
    }
  }
}

export async function resetPassword(password: string) {
  "use server"

  const supabase = await createServerActionClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reset password",
    }
  }
}

export async function signInWithGoogle(userType: "creator" | "brand") {
  console.log("Starting Google sign in with user type:", userType)
  const supabase = await createServerActionClient()

  // Use the exact URL pattern that matches Supabase configuration
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const redirectUrl = new URL(`/auth/${userType}/callback`, baseUrl)
  console.log("Redirect URL:", redirectUrl.toString())

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  console.log("Google sign in response:", { data, error })
  if (error) {
    console.error("Google sign in error:", error)
    throw error
  }

  if (data?.url) {
    console.log("Redirecting to:", data.url)
    return data.url
  }

  throw new Error("No authentication URL returned")
}
