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

    // Setup the default mock chain with all necessary methods
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: mockSingle
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null })
      }),
      insert: () => Promise.resolve({ error: null })
    }))
  })

  // Helper function to setup request with proper NextURL mock
  const setupRequest = (pathname: string): Partial<NextRequest> => {
    const { NextURL } = require("next/server")
    const url = new NextURL(`http://localhost${pathname}`)

    // Create a proper Headers object
    const headers = new Headers({
      'host': 'localhost',
      'user-agent': 'test-agent'
    })

    return {
      nextUrl: url,
      url: url.href,
      headers,
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

    it("creates creator record if it doesn't exist", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock the insert function
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockImplementation(() => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        insert: mockInsert,
      }))

      // Return profile but no creator record
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockCreatorProfile }) // Profile query
        .mockResolvedValueOnce({ data: null }) // Creator query (not found)

      const response = await middleware(mockRequest as NextRequest)

      // Verify creator record creation
      expect(mockSupabase.from).toHaveBeenCalledWith("creators")
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        tiktok_connected: false,
      })

      // Verify redirect to TikTok auth
      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/creator/tiktok")
    })

    it("allows access when already on profile setup page", async () => {
      mockRequest = setupRequest("/onboarding/creator/profile")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockCreatorProfile }) // Profile query
        .mockResolvedValueOnce({ data: { tiktok_connected: true } }) // Creator query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
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

    it("marks onboarding as complete when all steps are done", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock the update function with proper chain
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockEq.mockResolvedValue({ error: null }) // Mock the final promise resolution

      mockSupabase.from.mockImplementation(() => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        update: mockUpdate,
      }))

      // Return completed profile and creator
      mockSupabase.from().single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockCreatorProfile, 
            organization_name: "Test Creator" 
          }
        }) // Profile query
        .mockResolvedValueOnce({ data: { tiktok_connected: true } }) // Creator query

      const response = await middleware(mockRequest as NextRequest)

      // Verify onboarding completion update
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(mockEq).toHaveBeenCalledWith("user_id", mockUser.id)

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

    it("redirects to payment setup when payment not verified for payment-required routes", async () => {
      const paymentRequiredRoutes = [
        "/payouts",
        "/campaigns/new",
        "/api/payouts",
      ]

      for (const route of paymentRequiredRoutes) {
        mockRequest = setupRequest(route)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
        mockSupabase.from().single
          .mockResolvedValueOnce({ 
            data: { 
              ...mockBrandProfile, 
              organization_name: "Test Brand",
              onboarding_completed: true 
            } 
          }) // Profile query
          .mockResolvedValueOnce({ data: { payment_verified: false } }) // Brand query

        const response = await middleware(mockRequest as NextRequest)

        expect(response.type).toBe("redirect")
        const redirectUrl = new URL(response.url)
        expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")
      }
    })

    it("allows access to payment-required routes when payment is verified", async () => {
      const paymentRequiredRoutes = [
        "/payouts",
        "/campaigns/new",
        "/api/payouts",
      ]

      for (const route of paymentRequiredRoutes) {
        mockRequest = setupRequest(route)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
        mockSupabase.from().single
          .mockResolvedValueOnce({ 
            data: { 
              ...mockBrandProfile, 
              organization_name: "Test Brand",
              onboarding_completed: true 
            } 
          }) // Profile query
          .mockResolvedValueOnce({ data: { payment_verified: true } }) // Brand query

        const response = await middleware(mockRequest as NextRequest)

        expect(response.type).toBe("next")
      }
    })

    it("allows access to non-payment routes without payment verification", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockBrandProfile, 
            organization_name: "Test Brand",
            onboarding_completed: true 
          } 
        }) // Profile query
        .mockResolvedValueOnce({ data: { payment_verified: false } }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })

    it("redirects to profile setup when organization name is missing", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockBrandProfile }) // Profile query
        .mockResolvedValueOnce({ data: { payment_verified: false } }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })

    it("blocks payment-required routes without payment setup", async () => {
      const paymentRoutes = ['/payouts', '/campaigns/new', '/api/payouts']

      for (const route of paymentRoutes) {
        mockRequest = setupRequest(route)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
        
        // Setup complete mock chain for all Supabase operations
        mockSupabase.from.mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              single: mockSingle
            })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          }),
          insert: () => Promise.resolve({ error: null })
        }))

        mockSingle
          .mockResolvedValueOnce({ 
            data: { 
              user_type: "brand", 
              organization_name: "Test Brand",
              onboarding_completed: true 
            }
          }) // Profile query
          .mockResolvedValueOnce({ 
            data: { 
              stripe_customer_id: null, 
              payment_verified: false 
            }
          }) // Brand query

        const response = await middleware(mockRequest as NextRequest)

        expect(response.type).toBe("redirect")
        const redirectUrl = new URL(response.url)
        expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")
      }
    })

    it("allows dashboard and other non-payment routes without payment setup", async () => {
      console.log("=== Test Start ===")
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with organization name and completed onboarding
      const mockProfile = { 
        user_id: mockUser.id,
        user_type: "brand", 
        organization_name: "Test Brand",
        onboarding_completed: true 
      }
      console.log("Mock Profile:", mockProfile)

      const mockBrand = { 
        user_id: mockUser.id,
        stripe_customer_id: null, 
        payment_verified: false
      }
      console.log("Mock Brand:", mockBrand)

      // Setup mock chain
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: mockSingle.mockResolvedValueOnce({ data: mockProfile })
              .mockResolvedValueOnce({ data: mockBrand })
          })
        })
      }))

      const response = await middleware(mockRequest as NextRequest)
      console.log("Response:", response)

      expect(response.type).toBe("next")
      console.log("=== Test End ===")
    })
  })

  describe("Protected Routes", () => {
    const mockUser = { id: "user-1" }
    const mockCompletedProfile = {
      user_type: "brand",
      organization_name: "Test Brand",
      onboarding_completed: true,
    }
    const mockBrandData = {
      stripe_customer_id: "cus_123",
      payment_verified: true,
    }

    it("allows access to protected routes when onboarding is completed", async () => {
      const protectedRoutes = [
        "/dashboard",
        "/payouts",
        "/campaigns",
        "/api/payouts/process",
      ]

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      for (const route of protectedRoutes) {
        mockRequest = setupRequest(route)
        
        // Reset single mock for each iteration
        mockSupabase.from().single
          .mockResolvedValueOnce({ data: mockCompletedProfile }) // Profile query
          .mockResolvedValueOnce({ data: mockBrandData }) // Brand query

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

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockIncompleteProfile }) // Profile query
        .mockResolvedValueOnce({ data: mockBrandData }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })
  })

  describe("Brand Signup Flow", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }
    const mockBrandProfile = {
      user_type: "brand",
      organization_name: null,
      onboarding_completed: false,
    }

    it("redirects to onboarding after successful email signup", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: mockBrandProfile }) // Profile query
        .mockResolvedValueOnce({ data: null }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })

    it("redirects to signin if profile creation fails", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mockSupabase.from().single.mockResolvedValue({ data: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/signin")
    })
  })

  describe("Brand Onboarding Flow - Complete Path", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("follows the complete onboarding path with payment setup", async () => {
      // Step 1: Initial state - No profile
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock initial profile with no organization name
      mockSingle
        .mockResolvedValueOnce({ 
          data: {
            user_type: "brand",
            organization_name: null,
            onboarding_completed: false
          }
        })
        .mockResolvedValueOnce({ data: null }) // No brand data yet

      let response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("redirect")
      let redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")

      // Step 2: After profile setup, but before payment setup
      mockRequest = setupRequest("/dashboard")
      mockSingle
        .mockResolvedValueOnce({ 
          data: {
            user_type: "brand",
            organization_name: "Test Brand",
            onboarding_completed: false,
          }
        })
        .mockResolvedValueOnce({ 
          data: {
            stripe_customer_id: null,
            payment_verified: false,
          }
        })

      response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("redirect")
      redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")

      // Step 3: After payment setup - should redirect to dashboard
      mockRequest = setupRequest("/dashboard")
      mockSingle
        .mockResolvedValueOnce({ 
          data: {
            user_type: "brand",
            organization_name: "Test Brand",
            onboarding_completed: true,
          }
        })
        .mockResolvedValueOnce({ 
          data: {
            stripe_customer_id: "cus_123",
            payment_verified: true,
          }
        })

      response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("next")
    })
  })

  describe("Brand Onboarding Flow - Skip Payment Path", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("allows dashboard and other non-payment routes without payment setup", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with organization name and completed onboarding
      mockSingle
        .mockResolvedValueOnce({ 
          data: { 
            user_id: mockUser.id,
            user_type: "brand", 
            organization_name: "Test Brand",
            onboarding_completed: true 
          }
        }) // Profile query
        .mockResolvedValueOnce({ 
          data: { 
            user_id: mockUser.id,
            stripe_customer_id: null, 
            payment_verified: false
          }
        }) // Brand query

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })

    it("blocks payment-required routes without payment setup", async () => {
      const paymentRoutes = ['/payouts', '/campaigns/new', '/api/payouts']

      for (const route of paymentRoutes) {
        mockRequest = setupRequest(route)
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
        
        // Setup complete mock chain for all Supabase operations
        mockSupabase.from.mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              single: mockSingle
            })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          }),
          insert: () => Promise.resolve({ error: null })
        }))

        mockSingle
          .mockResolvedValueOnce({ 
            data: { 
              user_type: "brand", 
              organization_name: "Test Brand",
              onboarding_completed: true 
            }
          }) // Profile query
          .mockResolvedValueOnce({ 
            data: { 
              stripe_customer_id: null, 
              payment_verified: false 
            }
          }) // Brand query

        const response = await middleware(mockRequest as NextRequest)

        expect(response.type).toBe("redirect")
        const redirectUrl = new URL(response.url)
        expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")
      }
    })
  })
}) 