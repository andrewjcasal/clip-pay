import { NextResponse } from "next/server"
import { createServerActionClient } from "../actions"

// Get the project ref from the Supabase URL
function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  const matches = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!matches) throw new Error("Invalid Supabase URL format")
  return matches[1]
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const next = requestUrl.searchParams.get("next") || "/dashboard"

    console.log("=== Auth Callback Start ===")

    if (!code) {
      console.log("No code provided in callback")
      return NextResponse.redirect(`${requestUrl.origin}/signin`)
    }

    // Get the project ref
    const projectRef = getProjectRef()
    console.log("Project ref:", projectRef)

    // Exchange the code for a session
    console.log("Exchanging code for session...")
    const supabase = await createServerActionClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.log("Failed to exchange code for session:", error.message)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(error.message)}`
      )
    }

    console.log("Session exchange successful for user:", data.session.user.id)

    // Get user profile
    console.log("Fetching user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type, organization_name, onboarding_completed")
      .eq("id", data.session.user.id)
      .single()

    if (profileError) {
      console.log("Failed to fetch profile:", profileError.message)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent("Failed to fetch user profile")}`
      )
    }

    console.log("Profile status:", {
      user_type: profile?.user_type,
      has_organization_name: !!profile?.organization_name,
      onboarding_completed: profile?.onboarding_completed,
    })

    // Create response with appropriate redirect
    const redirectUrl = !profile?.onboarding_completed
      ? `${requestUrl.origin}/onboarding/${profile?.user_type === "brand" ? "brand/profile" : "creator/profile"}`
      : `${requestUrl.origin}${next}`

    console.log("Redirecting to:", redirectUrl)
    const response = NextResponse.redirect(redirectUrl)

    // Set the Supabase auth cookie
    const cookieName = `sb-${projectRef}-auth-token`
    console.log("Setting cookie:", { name: cookieName })

    response.cookies.set(cookieName, JSON.stringify(data.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.RENDER_EXTERNAL_HOSTNAME
          : undefined,
    })

    console.log("=== Auth Callback End ===")
    return response
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      `${requestUrl.origin}/signin?error=${encodeURIComponent("An unexpected error occurred")}`
    )
  }
}
