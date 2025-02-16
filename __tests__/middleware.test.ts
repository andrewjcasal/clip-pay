import { NextRequest, NextResponse } from "next/server"
import { middleware } from "@/middleware"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Mock Next.js components
jest.mock("next/server", () => {
  class MockNextURL extends URL {
    analyze = jest.fn()
    formatPathname = jest.fn()
    formatSearch = jest.fn()
    buildId = "test-build-id"
    defaultLocale = "en"
    domainLocale = null
    locale = "en"
    url = "http://localhost"
    basePath = ""
    headers = {}
    cookies = {}
    geo = {}
    ip = ""
  }

  return {
    NextResponse: {
      next: jest.fn(() => ({ type: "next" })),
      redirect: jest.fn((url) => ({ type: "redirect", url })),
    },
    NextURL: MockNextURL,
  }
})

// Mock Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe("Middleware", () => {
  let mockRequest: Partial<NextRequest>
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  // Create reusable mock functions
  const mockSelect = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockSingle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(NextResponse.next as jest.Mock).mockReturnValue({ type: "next" })
    ;(NextResponse.redirect as jest.Mock).mockImplementation((url) => ({
      type: "redirect",
      url,
    }))

    // Reset mock functions
    mockSelect.mockClear()
    mockEq.mockClear()
    mockSingle.mockClear()

    // Setup the default mock chain
    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    }))
  })

  // Helper function to setup request with proper NextURL mock
  const setupRequest = (pathname: string): Partial<NextRequest> => {
    const { NextURL } = require("next/server")
    const url = new NextURL(`http://localhost${pathname}`)
    return {
      nextUrl: url,
      url: url.href,
    }
  }

  describe("Authentication", () => {
    it("redirects to signin when no user is found", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/signin")
    })

    it("redirects to signin when no profile exists", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      })
      mockSupabase.from().single.mockResolvedValue({ data: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/signin")
    })
  })

  describe("Creator Onboarding Flow", () => {
    const mockUser = { id: "user-1" }
    const mockCreatorProfile = {
      user_type: "creator",
      organization_name: null,
      onboarding_completed: false,
    }

    it("redirects to TikTok auth when TikTok is not connected", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockCreatorProfile }) // Profile query
        .mockResolvedValueOnce({ data: { tiktok_connected: false } }) // Creator query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/creator/tiktok")
    })

    it("redirects to profile setup when TikTok connected but no organization name", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockCreatorProfile }) // Profile query
        .mockResolvedValueOnce({ data: { tiktok_connected: true } }) // Creator query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/creator/profile")
    })

    it("allows access when on correct onboarding step", async () => {
      mockRequest = setupRequest("/onboarding/creator/tiktok")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockCreatorProfile }) // Profile query
        .mockResolvedValueOnce({ data: { tiktok_connected: false } }) // Creator query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })
  })

  describe("Brand Onboarding Flow", () => {
    const mockUser = { id: "user-1" }
    const mockBrandProfile = {
      user_type: "brand",
      organization_name: null,
      onboarding_completed: false,
    }

    it("redirects to profile setup when no organization name", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockBrandProfile }) // Profile query
        .mockResolvedValueOnce({ data: { stripe_customer_id: null } }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })

    it("redirects to payments when profile complete but payment not verified", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { ...mockBrandProfile, organization_name: "Test Brand" },
        }) // Profile query
        .mockResolvedValueOnce({
          data: { stripe_customer_id: "cus_123", payment_verified: false },
        }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")
    })

    it("allows access to dashboard when onboarding is completed", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single.mockResolvedValueOnce({
        data: {
          user_type: "brand",
          organization_name: "Test Brand",
          onboarding_completed: true,
        },
      })

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })

    it("allows access when on correct onboarding step", async () => {
      mockRequest = setupRequest("/onboarding/brand/profile")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockBrandProfile }) // Profile query
        .mockResolvedValueOnce({ data: { stripe_customer_id: null } }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })
  })

  describe("Protected Routes", () => {
    const mockUser = { id: "user-1" }
    const mockCompletedProfile = {
      user_type: "brand",
      organization_name: "Test Brand",
      onboarding_completed: true,
    }

    it("allows access to protected routes when onboarding is completed", async () => {
      const protectedRoutes = [
        "/dashboard",
        "/payouts",
        "/campaigns",
        "/api/payouts/process",
      ]

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockCompletedProfile })

      for (const route of protectedRoutes) {
        mockRequest = setupRequest(route)
        const response = await middleware(mockRequest as NextRequest)
        expect(response.type).toBe("next")
      }
    })

    it("redirects to appropriate onboarding step when accessing protected routes with incomplete onboarding", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock the profile query to return an incomplete brand profile
      const mockIncompleteProfile = {
        user_type: "brand",
        organization_name: null,
        onboarding_completed: false,
      }

      // Mock the brand query to return no stripe setup
      const mockBrandData = {
        stripe_customer_id: null,
        payment_verified: false,
      }

      // Setup the sequential responses
      mockSelect
        .mockImplementationOnce(() => ({
          eq: mockEq,
          single: mockSingle.mockResolvedValueOnce({ data: mockIncompleteProfile }),
        }))
        .mockImplementationOnce(() => ({
          eq: mockEq,
          single: mockSingle.mockResolvedValueOnce({ data: mockBrandData }),
        }))

      const response = await middleware(mockRequest as NextRequest)

      // Verify the profile query
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockSelect).toHaveBeenCalledWith("user_type, organization_name, onboarding_completed")
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id)

      // Verify the brand query
      expect(mockSupabase.from).toHaveBeenCalledWith("brands")
      expect(mockSelect).toHaveBeenCalledWith("stripe_customer_id, payment_verified")
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id)

      expect(response.type).toBe("redirect")
      // Create a URL object to check the pathname
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })
  })
}) 