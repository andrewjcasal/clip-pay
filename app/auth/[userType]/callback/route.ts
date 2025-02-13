import { NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@/app/auth/actions"
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

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userType: string }> }
) {
  console.log("=== Auth Callback Start ===")
  const requestUrl = new URL(request.url)
  console.log("Request URL:", requestUrl.toString())

  // Get and validate user type from URL params
  const { userType } = await params
  console.log("User Type from URL:", userType)

  if (!userType || !["creator", "brand"].includes(userType)) {
    console.error("Invalid user type:", userType)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
        "Invalid user type"
      )}`
    )
  }

  console.log("Search params:", Object.fromEntries(requestUrl.searchParams))
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (!code) {
    console.log("No code provided")
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=No code provided`
    )
  }

  const supabase = await createServerActionClient()

  try {
    console.log("Exchanging code for session...")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Session exchange error:", error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/signin?error=${encodeURIComponent(
          error.message
        )}`
      )
    }
    console.log("Session exchange successful, user:", data.session.user.id)

    // First check if profile exists
    console.log("Checking for existing profile...")
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

    // If no profile exists, create one with the user type from URL
    if (!existingProfile) {
      console.log("No existing profile, creating new one with type:", userType)
      const { data: profile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: data.session.user.id,
          user_type: userType,
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
      console.log("Profile created successfully")
    }

    // Get the final profile state, using the URL user type for new profiles
    const profile = existingProfile || {
      user_type: userType,
      onboarding_completed: false,
    }
    console.log("Final profile state:", profile)

    // Determine redirect URL based on the profile's user type
    const onboardingPath =
      profile.user_type === "brand" ? "brand/profile" : "creator"
    const redirectUrl = !profile.onboarding_completed
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/${onboardingPath}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}${next}`

    console.log("Redirecting to:", redirectUrl)
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
