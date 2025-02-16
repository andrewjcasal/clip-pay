import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { Deepgram } from "@deepgram/sdk"
import { evaluateSubmission } from "@/lib/openai"
import { POST } from "@/app/api/submissions/route"
import { spawn } from "child_process"
import { unlink, readFile, writeFile } from "fs/promises"

// Mock dependencies
jest.mock("@/lib/supabase-server")
jest.mock("@deepgram/sdk")
jest.mock("@/lib/openai")
jest.mock("fs/promises")
jest.mock("child_process")

// Mock environment variables
process.env.DEEPGRAM_API_KEY = "test-deepgram-key"

describe("Submission Processing", () => {
  const mockUser = { id: "test-user-id" }
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
      download: jest.fn(),
    },
  }
  const mockDeepgramTranscription = {
    results: {
      channels: [
        {
          alternatives: [
            {
              transcript: "This is a test transcription",
            },
          ],
        },
      ],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
    ;(writeFile as jest.Mock).mockResolvedValue(undefined)
    ;(readFile as jest.Mock).mockResolvedValue(Buffer.from("test"))
    ;(unlink as jest.Mock).mockResolvedValue(undefined)
    ;(spawn as jest.Mock).mockReturnValue({
      on: (event: string, callback: (code: number) => void) => callback(0),
    })
  })

  describe("POST /api/submissions", () => {
    it("creates a new submission record", async () => {
      // Mock request data
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock Supabase insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "test-submission-id" },
            error: null,
          }),
        }),
      })
      mockSupabase.from.mockReturnValue({ insert: mockInsert })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ id: "test-submission-id" })
      expect(mockSupabase.from).toHaveBeenCalledWith("submissions")
      expect(mockInsert).toHaveBeenCalledWith({
        campaign_id: "test-campaign",
        user_id: mockUser.id,
        file_path: null,
        status: "pending",
      })
    })

    it("processes video and creates transcription", async () => {
      // Mock request with video URL
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock Supabase responses
      const mockSubmission = {
        id: "test-submission-id",
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: {
            auto_approval_enabled: true,
          },
        },
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      // Mock Deepgram transcription
      ;((Deepgram.prototype.transcription as unknown) as jest.Mock).mockReturnValue({
        preRecorded: jest.fn().mockResolvedValue(mockDeepgramTranscription),
      })

      // Mock OpenAI evaluation
      ;(evaluateSubmission as jest.Mock).mockResolvedValue({
        approved: true,
        reason: "Content meets guidelines",
        confidence: 0.9,
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ id: "test-submission-id" })

      // Verify video processing flow
      expect(writeFile).toHaveBeenCalled()
      expect(spawn).toHaveBeenCalledWith("ffmpeg", expect.any(Array))
      expect(readFile).toHaveBeenCalled()
      expect(Deepgram.prototype.transcription).toBeDefined()
      expect(evaluateSubmission).toHaveBeenCalledWith(
        "Test Campaign",
        "Test guidelines",
        "Test outline",
        "This is a test transcription"
      )
    })

    it("handles auto-approval when enabled", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: {
            auto_approval_enabled: true,
          },
        },
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      // Mock OpenAI evaluation with high confidence approval
      ;(evaluateSubmission as jest.Mock).mockResolvedValue({
        approved: true,
        reason: "Content meets guidelines",
        confidence: 0.9,
      })

      const response = await POST(req)
      await response.json()

      // Verify auto-approval flow
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          status: "approved",
          transcription: "This is a test transcription",
          processed_at: expect.any(String),
          auto_moderation_result: {
            approved: true,
            reason: "Content meets guidelines",
            confidence: 0.9,
          },
        },
      ])
    })

    it("handles auto-rejection when content doesn't meet guidelines", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: {
            auto_approval_enabled: true,
          },
        },
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      // Mock OpenAI evaluation with high confidence rejection
      ;(evaluateSubmission as jest.Mock).mockResolvedValue({
        approved: false,
        reason: "Content does not follow guidelines",
        confidence: 0.95,
      })

      const response = await POST(req)
      await response.json()

      // Verify auto-rejection flow
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          status: "rejected",
          transcription: "This is a test transcription",
          processed_at: expect.any(String),
          auto_moderation_result: {
            approved: false,
            reason: "Content does not follow guidelines",
            confidence: 0.95,
          },
        },
      ])
    })

    it("skips auto-moderation when confidence is low", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: {
            auto_approval_enabled: true,
          },
        },
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      // Mock OpenAI evaluation with low confidence
      ;(evaluateSubmission as jest.Mock).mockResolvedValue({
        approved: true,
        reason: "Content seems to meet guidelines",
        confidence: 0.6,
      })

      const response = await POST(req)
      await response.json()

      // Verify that only transcription is updated without status change
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          transcription: "This is a test transcription",
          processed_at: expect.any(String),
        },
      ])
    })

    it("handles missing campaign data gracefully", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data with missing campaign
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign: null
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      const response = await POST(req)
      await response.json()

      // Verify that only transcription is updated without auto-moderation
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          transcription: "This is a test transcription",
          processed_at: expect.any(String),
        },
      ])
    })

    it("handles incomplete campaign data gracefully", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data with incomplete campaign data
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: null // Missing brand data
        }
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      const response = await POST(req)
      await response.json()

      // Verify that only transcription is updated without auto-moderation
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          transcription: "This is a test transcription",
          processed_at: expect.any(String),
        },
      ])
    })

    it("handles submission fetch error gracefully", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Setup Supabase mocks with error
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Failed to fetch submission"),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      const response = await POST(req)
      await response.json()

      // Verify error is recorded
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          processing_error: "Failed to get submission details",
        },
      ])
    })

    it("handles missing campaign join data", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data with campaign join that failed to load
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign_id: "test-campaign",
        // campaign data is missing due to join failure
      }

      // Setup Supabase mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      const response = await POST(req)
      await response.json()

      // Verify error is recorded
      const updateCalls = mockSupabase.from.mock.results
        .filter((result) => result.value.update)
        .map((result) => result.value.update.mock.calls)
        .flat()

      expect(updateCalls).toContainEqual([
        {
          processing_error: "Failed to get submission details: Campaign data not found",
        },
      ])
    })

    it("verifies campaign data is properly joined", async () => {
      // Mock request
      const req = new Request("http://localhost/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: "test-campaign",
          video_url: "https://example.com/video.mp4",
        }),
      })

      // Mock submission data with complete campaign data
      const mockSubmission = {
        id: "test-submission-id",
        user_id: mockUser.id,
        campaign_id: "test-campaign",
        campaign: {
          title: "Test Campaign",
          guidelines: "Test guidelines",
          video_outline: "Test outline",
          brand: {
            auto_approval_enabled: true,
          },
        },
      }

      // Setup Supabase mocks with proper join
      mockSupabase.from.mockImplementation((table) => {
        if (table === "submissions") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "test-submission-id" },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSubmission,
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) }
      })

      const response = await POST(req)
      await response.json()

      // Verify that the campaign data was properly used
      expect(evaluateSubmission).toHaveBeenCalledWith(
        "Test Campaign",
        "Test guidelines",
        "Test outline",
        "This is a test transcription"
      )
    })
  })
}) 