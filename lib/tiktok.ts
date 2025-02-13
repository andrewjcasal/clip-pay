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

  async getVideoInfo(url: string, accessToken: string): Promise<VideoInfo | null> {
    console.log("=== TikTok getVideoInfo Start ===")
    console.log("Input URL:", url)
    console.log("Using access token:", accessToken.slice(0, 10) + "...")
    
    const videoId = this.extractVideoId(url)
    console.log("Extracted video ID:", videoId)
    
    if (!videoId) {
      console.error("Failed to extract video ID from URL:", url)
      throw new Error("Invalid TikTok URL")
    }

    const apiUrl = "https://open.tiktokapis.com/v2/video/query/?fields=id,title,view_count,create_time"
    const requestBody = {
      filters: {
        video_ids: [videoId]
      }
    }
    console.log("Making request to TikTok API:", apiUrl)
    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log("TikTok API Raw Response:", JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        console.error("TikTok API error response:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        })
        throw new Error(`TikTok API error: ${JSON.stringify(responseData)}`)
      }

      if (!responseData.data || !responseData.data.videos || !responseData.data.videos.length) {
        console.log("No video data found in response")
        return null
      }

      const video = responseData.data.videos[0]
      console.log("Processed video data:", {
        id: video.id,
        title: video.title,
        views: video.view_count,
        create_time: video.create_time
      })
      
      console.log("=== TikTok getVideoInfo End ===")
      
      return {
        id: video.id,
        title: video.title,
        views: video.view_count,
        create_time: video.create_time,
      }
    } catch (error) {
      console.error("Error fetching video info:", error)
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
} 