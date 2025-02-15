import { getCreatorCampaigns } from "@/app/dashboard/creator-campaigns"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Mock the Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe("getCreatorCampaigns", () => {
  const mockUser = { id: "test-user-id" }
  const mockSupabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
    },
    from: jest.fn(),
  }

  // Setup the from() mock to handle different table queries
  const mockFrom = jest.fn()
  const defaultQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    mockSupabase.from.mockImplementation(() => defaultQueryBuilder)
  })

  it("should fetch and transform campaigns correctly", async () => {
    // Mock campaign data
    const mockCampaigns = [
      {
        id: "campaign-1",
        title: "Test Campaign",
        budget_pool: "1000",
        rpm: "5",
        guidelines: "Test guidelines",
        status: "active",
        video_outline: "Test outline",
        brand: {
          id: "brand-1",
          payment_verified: true,
          user_id: "brand-user-1",
        },
        submission: null,
        submissions: [
          {
            payout_amount: "100",
            status: "fulfilled",
          },
        ],
      },
    ]

    const mockBrandProfiles = [
      {
        user_id: "brand-user-1",
        organization_name: "Test Brand",
      },
    ]

    // Setup specific responses for different queries
    mockSupabase.from.mockImplementation((table) => {
      if (table === "campaigns") {
        return {
          ...defaultQueryBuilder,
          order: jest.fn().mockResolvedValue({ data: mockCampaigns, error: null }),
        }
      }
      if (table === "profiles") {
        return {
          ...defaultQueryBuilder,
          in: jest.fn().mockResolvedValue({ data: mockBrandProfiles, error: null }),
        }
      }
      return defaultQueryBuilder
    })

    const result = await getCreatorCampaigns()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: "campaign-1",
      title: "Test Campaign",
      budget_pool: "1000",
      remaining_budget: 900,
      rpm: "5",
      guidelines: "Test guidelines",
      status: "active",
      video_outline: "Test outline",
      brand: {
        name: "Test Brand",
        payment_verified: true,
      },
    })
  })

  it("should handle errors when fetching campaigns", async () => {
    mockSupabase.from.mockImplementation((table) => ({
      ...defaultQueryBuilder,
      order: jest.fn().mockResolvedValue({ data: null, error: new Error("Database error") }),
    }))

    await expect(getCreatorCampaigns()).rejects.toThrow("Database error")
  })

  it("should calculate remaining budget correctly", async () => {
    const mockCampaigns = [
      {
        id: "campaign-1",
        title: "Test Campaign",
        budget_pool: "1000",
        rpm: "5",
        status: "active",
        brand: {
          id: "brand-1",
          payment_verified: true,
          user_id: "brand-user-1",
        },
        submissions: [
          { payout_amount: "200", status: "fulfilled" },
          { payout_amount: "300", status: "fulfilled" },
          { payout_amount: "100", status: "pending" },
        ],
      },
    ]

    const mockBrandProfiles = [
      {
        user_id: "brand-user-1",
        organization_name: "Test Brand",
      },
    ]

    mockSupabase.from.mockImplementation((table) => {
      if (table === "campaigns") {
        return {
          ...defaultQueryBuilder,
          order: jest.fn().mockResolvedValue({ data: mockCampaigns, error: null }),
        }
      }
      if (table === "profiles") {
        return {
          ...defaultQueryBuilder,
          in: jest.fn().mockResolvedValue({ data: mockBrandProfiles, error: null }),
        }
      }
      return defaultQueryBuilder
    })

    const result = await getCreatorCampaigns()
    expect(result[0].remaining_budget).toBe(500)
  })

  it("should handle missing brand profiles gracefully", async () => {
    const mockCampaigns = [
      {
        id: "campaign-1",
        title: "Test Campaign",
        budget_pool: "1000",
        rpm: "5",
        status: "active",
        brand: {
          id: "brand-1",
          payment_verified: true,
          user_id: "brand-user-1",
        },
      },
    ]

    mockSupabase.from.mockImplementation((table) => {
      if (table === "campaigns") {
        return {
          ...defaultQueryBuilder,
          order: jest.fn().mockResolvedValue({ data: mockCampaigns, error: null }),
        }
      }
      if (table === "profiles") {
        return {
          ...defaultQueryBuilder,
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        }
      }
      return defaultQueryBuilder
    })

    const result = await getCreatorCampaigns()
    expect(result[0].brand.name).toBe("Unknown Brand")
  })

  it("should handle authentication errors", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(getCreatorCampaigns()).rejects.toThrow("User not authenticated")
  })
}) 