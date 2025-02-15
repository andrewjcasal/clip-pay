import { TikTokAPI } from "@/lib/tiktok"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Mock the Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe("TikTokAPI", () => {
  let api: TikTokAPI
  const mockUserId = "test-user-id"
  const mockAccessToken = "test-access-token"
  const mockRefreshToken = "test-refresh-token"
  
  const mockSupabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    api = new TikTokAPI()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe("getAccessToken", () => {
    it("should exchange code for access token successfully", async () => {
      const mockCode = "test-code"
      const mockCodeVerifier = "test-code-verifier"
      const mockResponse = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        open_id: "test-open-id",
        expires_in: 86400,
        refresh_expires_in: 604800,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.getAccessToken(mockCode, mockCodeVerifier)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        "https://open.tiktokapis.com/v2/oauth/token/",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
          },
        })
      )
    })

    it("should handle token exchange errors", async () => {
      const mockCode = "invalid-code"
      const mockCodeVerifier = "test-code-verifier"
      const mockError = { error: "invalid_grant", error_description: "Invalid code" }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.getAccessToken(mockCode, mockCodeVerifier)).rejects.toThrow(
        /TikTok API error/
      )
    })
  })

  describe("getVideoInfo", () => {
    const mockVideoUrl = "https://www.tiktok.com/@user/video/1234567890"
    const mockVideoId = "1234567890"

    it("should fetch video views successfully", async () => {
      const mockVideoResponse = {
        data: {
          videos: [
            {
              id: mockVideoId,
              view_count: 1000,
            },
          ],
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVideoResponse),
      })

      const result = await api.getVideoInfo(mockVideoUrl, mockAccessToken, mockUserId)

      expect(result).toEqual({ views: 1000 })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/video/query/"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mockAccessToken}`,
            "Accept": "application/json",
          },
          body: JSON.stringify({
            filters: {
              video_ids: [mockVideoId],
            },
          }),
        })
      )
    })

    it("should handle invalid access token and refresh successfully", async () => {
      // Mock initial failed request
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: { code: "access_token_invalid" } }),
        })
        // Mock refresh token request
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              access_token: "new-access-token",
              refresh_token: "new-refresh-token",
            },
          }),
        })
        // Mock retry with new token
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              videos: [{ id: mockVideoId, view_count: 1000 }],
            },
          }),
        })

      // Mock Supabase queries
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { tiktok_refresh_token: mockRefreshToken },
          error: null,
        }),
      }

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      }

      // First call returns select chain, second call returns update chain
      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockUpdateChain)

      const result = await api.getVideoInfo(mockVideoUrl, mockAccessToken, mockUserId)

      expect(result).toEqual({ views: 1000 })
      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(mockSupabase.from).toHaveBeenCalledWith("creators")
      expect(mockSelectChain.select).toHaveBeenCalledWith("tiktok_refresh_token")
      expect(mockSelectChain.eq).toHaveBeenCalledWith("user_id", mockUserId)
      expect(mockSelectChain.single).toHaveBeenCalled()
      expect(mockUpdateChain.update).toHaveBeenCalledWith({
        tiktok_access_token: "new-access-token",
        tiktok_refresh_token: "new-refresh-token",
      })
      expect(mockUpdateChain.eq).toHaveBeenCalledWith("user_id", mockUserId)
    })

    it("should handle video not found", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { videos: [] } }),
      })

      await expect(
        api.getVideoInfo(mockVideoUrl, mockAccessToken, mockUserId)
      ).rejects.toThrow("No video data found in response")
    })

    it("should handle invalid video URL", async () => {
      const invalidUrl = "https://tiktok.com/invalid"
      
      await expect(
        api.getVideoInfo(invalidUrl, mockAccessToken, mockUserId)
      ).rejects.toThrow("Could not extract video ID from URL")
    })
  })

  describe("refreshAccessToken", () => {
    it("should refresh token successfully", async () => {
      const mockResponse = {
        data: {
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await api.refreshAccessToken(mockRefreshToken)

      expect(result).toEqual({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      })
      expect(global.fetch).toHaveBeenCalledWith(
        "https://open-api.tiktok.com/oauth/refresh_token/",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    })

    it("should handle refresh token errors", async () => {
      const mockError = { error: "invalid_grant", error_description: "Invalid refresh token" }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

      await expect(api.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
        /Failed to refresh TikTok access token/
      )
    })
  })
}) 