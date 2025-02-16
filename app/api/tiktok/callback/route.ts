import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { TikTokAPI } from "@/lib/tiktok"

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/signin`)
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    console.error("TikTok auth error:", error)
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator/tiktok?error=auth`
    )
  }

  if (!code || !state) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator/tiktok?error=missing_params`
    )
  }

  try {
    // Verify state token and get code verifier
    const { data: creator } = await supabase
      .from("creators")
      .select("tiktok_oauth_state, tiktok_code_verifier")
      .eq("user_id", user.id)
      .single()

    if (
      !creator ||
      creator.tiktok_oauth_state !== state ||
      !creator.tiktok_code_verifier
    ) {
      throw new Error("Invalid state token or missing code verifier")
    }

    // Exchange code for access token using code verifier
    const tiktokApi = new TikTokAPI()
    const tokenData = await tiktokApi.getAccessToken(
      code,
      creator.tiktok_code_verifier
    )

    // Store TikTok credentials in Supabase
    const { error: updateCreatorError } = await supabase
      .from("creators")
      .update({
        tiktok_connected: true,
        tiktok_access_token: tokenData.access_token,
        tiktok_refresh_token: tokenData.refresh_token,
        tiktok_open_id: tokenData.open_id,
        tiktok_oauth_state: null, // Clear the state token
        tiktok_code_verifier: null, // Clear the code verifier
      })
      .eq("user_id", user.id)

    if (updateCreatorError) {
      throw updateCreatorError
    }

    // Also update the profiles table
    const { error: updateProfileError } = await supabase
      .from("creators")
      .update({
        tiktok_connected: true,
      })
      .eq("user_id", user.id)

    if (updateProfileError) {
      throw updateProfileError
    }

    // Create a notification for successful connection
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "tiktok_connected",
      title: "TikTok Account Connected",
      message: "Your TikTok account has been successfully connected.",
    })

    // Redirect to the next onboarding step
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator/profile?success=tiktok`
    )
  } catch (error) {
    console.error("Error in TikTok callback:", error)
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/creator/tiktok?error=callback`
    )
  }
}
