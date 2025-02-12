import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import crypto from "crypto"

// Generate a random code verifier
function generateCodeVerifier() {
  return crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

// Generate code challenge from verifier
function generateCodeChallenge(verifier: string) {
  const hash = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
  return hash
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TikTok OAuth configuration
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    console.error("Missing TIKTOK_CLIENT_KEY environment variable")
    return NextResponse.json(
      { error: "TikTok client configuration error" },
      { status: 500 }
    )
  }

  // Debug log configuration
  console.log("TikTok Configuration:", {
    clientKey,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tiktok/callback/`,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  })

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tiktok/callback/`
  const scope = "user.info.basic,video.list"

  // Generate CSRF state token and PKCE verifier
  const state = Math.random().toString(36).substring(7)
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  try {
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("user_id", user.id)
      .single()

    console.log("creator exists", creator)

    const { error: updateError } = await supabase
      .from("creators")
      .update({
        tiktok_oauth_state: state,
        tiktok_code_verifier: codeVerifier,
      })
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    // Use standard TikTok OAuth URL
    const authUrl =
      "https://www.tiktok.com/v2/auth/authorize/?" +
      `client_key=${clientKey}` +
      `&scope=${scope}` +
      "&response_type=code" +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      "&code_challenge_method=S256"

    console.log("Full TikTok Auth URL:", authUrl)
    console.log("Redirect URI:", redirectUri)
    console.log("Code Challenge:", codeChallenge)

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Error in TikTok auth:", error)
    return NextResponse.json(
      { error: "Failed to initiate authentication" },
      { status: 500 }
    )
  }
}
