import { createServerSupabaseClient } from "@/lib/supabase-server"

interface TokenResponse {
  access_token: string
  refresh_token: string
  open_id: string
  expires_in: number
  refresh_expires_in: number
}

interface VideoInfo {
  id: string
  title: string
  views: number
  create_time: number
}

export class TikTokAPI {
  private clientKey: string
  private clientSecret: string
  private redirectUri: string
  private accessToken: string | null = null
  private tokenExpiry: number | null = null
  private isSandbox: boolean = true // Add sandbox mode flag
  private baseUrl = "https://open.tiktokapis.com/v2"

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || ""
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || ""
    this.redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tiktok/callback/`
  }

  async getAccessToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`TikTok API error: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  private async getClientToken() {
    // Return existing token if it's still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${data.error_description}`)
    }

    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)
    return this.accessToken
  }

  async getVideoInfo(videoUrl: string, accessToken: string, userId?: string): Promise<{
    views: number
  }> {
    console.log("=== TikTok getVideoInfo Start ===")
    console.log("Video URL:", videoUrl)
    console.log("Access Token (first 10 chars):", accessToken?.slice(0, 10))
    console.log("User ID:", userId)

    try {
      console.log("Extracting video ID...")
      const videoId = this.extractVideoId(videoUrl)
      if (!videoId) {
        throw new Error("Could not extract video ID from URL")
      }
      console.log("Extracted video ID:", videoId)

      console.log("Making request to TikTok API...")
      const requestBody = {
        filters: {
          video_ids: [videoId]
        }
      }
      console.log("Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${this.baseUrl}/video/query/?fields=view_count`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("TikTok API Response Status:", response.status)
      const responseData = await response.json()
      console.log("TikTok API Response:", JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        const error = responseData
        console.log("Response not OK, error:", error)
        
        // If token is invalid and we have the user ID, try to refresh it
        if (
          error.error?.code === "access_token_invalid" &&
          userId
        ) {
          console.log("Token invalid, attempting refresh flow...")
          // Get the refresh token from the database
          const supabase = await createServerSupabaseClient()
          console.log("Fetching refresh token for user:", userId)
          const { data: creator, error: dbError } = await supabase
            .from("creators")
            .select("tiktok_refresh_token")
            .eq("user_id", userId)
            .single()

          if (dbError) {
            console.error("Error fetching refresh token:", dbError)
            throw new Error("Failed to fetch refresh token")
          }

          console.log("Creator data:", creator)
          console.log("Refresh token found:", creator?.tiktok_refresh_token ? "Yes" : "No")

          if (creator?.tiktok_refresh_token) {
            console.log("Attempting to refresh token...")
            // Refresh the token
            const tokens = await this.refreshAccessToken(creator.tiktok_refresh_token)
            console.log("Token refresh successful, new access token (first 10 chars):", tokens.access_token.slice(0, 10))

            console.log("Updating tokens in database...")
            // Update the tokens in the database
            const { error: updateError } = await supabase
              .from("creators")
              .update({
                tiktok_access_token: tokens.access_token,
                tiktok_refresh_token: tokens.refresh_token,
              })
              .eq("user_id", userId)

            if (updateError) {
              console.error("Error updating tokens in database:", updateError)
              throw new Error("Failed to update tokens in database")
            }

            console.log("Tokens updated successfully, retrying video info request...")
            // Retry the request with the new access token
            return this.getVideoInfo(videoUrl, tokens.access_token)
          } else {
            console.log("No refresh token found for user")
            throw new Error("No refresh token available")
          }
        }

        throw new Error(`TikTok API error: ${JSON.stringify(error)}`)
      }

      console.log("Successful response, processing data...")
      if (!responseData.data?.videos || !responseData.data.videos.length) {
        throw new Error("No video data found in response")
      }

      const videoData = responseData.data.videos[0]
      console.log("Video data:", videoData)

      if (typeof videoData.view_count !== 'number') {
        throw new Error("Invalid view count in response")
      }

      return {
        views: videoData.view_count,
      }
    } catch (error) {
      console.error("Error in getVideoInfo:", error)
      throw error
    }
  }

  private extractVideoId(url: string): string | null {
    // Handle both web and mobile URLs
    const patterns = [
      /video\/(\d+)/i,                    // Web URL format
      /tiktok\.com\/@[\w.-]+\/(\d+)/i,    // Profile URL format
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
  }> {
    console.log("=== Starting Token Refresh ===")
    console.log("Using refresh token (first 10 chars):", refreshToken.slice(0, 10))
    console.log("Client key available:", !!this.clientKey)
    console.log("Client secret available:", !!this.clientSecret)

    try {
      const response = await fetch(
        "https://open-api.tiktok.com/oauth/refresh_token/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        }
      )

      console.log("Refresh token response status:", response.status)
      const data = await response.json()
      console.log("Refresh token response:", JSON.stringify(data, null, 2))

      if (!response.ok) {
        console.error("Token refresh failed:", data)
        throw new Error(`Failed to refresh TikTok access token: ${JSON.stringify(data)}`)
      }

      console.log("Token refresh successful")
      return {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
      }
    } catch (error) {
      console.error("Error in refreshAccessToken:", error)
      throw error
    }
  }
} 