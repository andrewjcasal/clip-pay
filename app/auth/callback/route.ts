import { NextResponse } from "next/server"
import { createServerActionClient } from "../actions"
import { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Get the project ref from the Supabase URL
function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  const matches = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!matches) throw new Error("Invalid Supabase URL format")
  return matches[1]
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const state = requestUrl.searchParams.get("state")

  // Try to parse user_type from state
  let userType: "creator" | "brand" | null = null
  if (state) {
    try {
      const stateData = JSON.parse(state)
      userType = stateData.user_type
    } catch (e) {
      console.error("Failed to parse state:", e)
    }
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=No code provided`
    )
  }

  const supabase = await createServerActionClient()

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Session exchange error:", error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
          error.message
        )}`
      )
    }

    // First check if profile exists

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("user_type, onboarding_completed")
      .eq("user_id", data.session.user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Failed to fetch profile:", fetchError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
          "Failed to fetch user profile"
        )}`
      )
    }

    // If no profile exists, create one with the user type
    if (!existingProfile) {
      const { data: profile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.session.user.id,
          user_type: userType || "creator", // Default to creator if not specified
          onboarding_completed: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Failed to create profile:", insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
            "Failed to create user profile"
          )}`
        )
      }
    }

    // Get the final profile state
    const profile = existingProfile || {
      user_type: userType || "creator",
      onboarding_completed: false,
    }

    // Determine redirect URL
    const redirectUrl = !profile.onboarding_completed
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/${
          profile.user_type === "brand" ? "brand/profile" : "creator"
        }`
      : `${process.env.NEXT_PUBLIC_BASE_URL}${next}`

    const response = NextResponse.redirect(redirectUrl)

    // Set the auth cookie
    const cookieName = `sb-${getProjectRef()}-auth-token`
    response.cookies.set(cookieName, JSON.stringify(data.session), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
        "Authentication failed"
      )}`
    )
  }
}
