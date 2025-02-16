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
  let mockSupabase: {
    auth: { getUser: jest.Mock }
    from: jest.Mock
  }
  let mocks: ReturnType<typeof setupSupabaseMock>

  // Helper function to setup Supabase mock chain
  const setupSupabaseMock = () => {
    const mockSingle = jest.fn()
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null })
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq })
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = jest.fn().mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
      insert: mockInsert,
    }))

    const mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: mockFrom,
    }

    return {
      mockSupabase,
      mockSingle,
      mockEq,
      mockSelect,
      mockUpdate,
      mockUpdateEq,
      mockInsert,
      mockFrom,
    }
  }

  // Helper function to mock profile and brand data
  const mockSupabaseData = (profileData: any, brandData?: any) => {
    mocks.mockSingle
      .mockResolvedValueOnce({ data: profileData, error: null })
    
    if (brandData !== undefined) {
      mocks.mockSingle.mockResolvedValueOnce({ data: brandData, error: null })
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mocks = setupSupabaseMock()
    mockSupabase = mocks.mockSupabase
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(NextResponse.next as jest.Mock).mockReturnValue({ type: "next" })
    ;(NextResponse.redirect as jest.Mock).mockImplementation((url) => ({
      type: "redirect",
      url,
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
      mockSupabaseData(null)

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
      
      // Use our helper to mock both profile and creator data
      mockSupabaseData(
        mockCreatorProfile,
        { tiktok_connected: false }
      )

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/creator/tiktok")
    })

    it("creates creator record if it doesn't exist", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile data but no creator record
      mockSupabaseData(mockCreatorProfile, null)

      // Setup insert mock
      mocks.mockInsert.mockResolvedValueOnce({ error: null })

      const response = await middleware(mockRequest as NextRequest)

      // Verify creator record creation
      expect(mocks.mockFrom).toHaveBeenCalledWith("creators")
      expect(mocks.mockInsert).toHaveBeenCalledWith({
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
      
      mockSupabaseData(
        mockCreatorProfile,
        { tiktok_connected: true }
      )

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("next")
    })

    it("redirects to profile setup when TikTok connected but no organization name", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      mockSupabaseData(
        mockCreatorProfile,
        { tiktok_connected: true }
      )

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/creator/profile")
    })

    it("marks onboarding as complete when all steps are done", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with organization name and creator with TikTok connected
      mockSupabaseData(
        { 
          ...mockCreatorProfile, 
          organization_name: "Test Creator" 
        },
        { tiktok_connected: true }
      )

      // Mock the update operation with proper chaining
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null })
      mocks.mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq })

      const response = await middleware(mockRequest as NextRequest)

      // Verify onboarding completion update
      expect(mocks.mockFrom).toHaveBeenCalledWith("profiles")
      expect(mocks.mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(mockUpdateEq).toHaveBeenCalledWith("user_id", mockUser.id)

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
        
        mockSupabaseData(
          { 
            ...mockBrandProfile, 
            organization_name: "Test Brand",
            onboarding_completed: true 
          },
          { payment_verified: false }
        )

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
        mocks.mockSingle
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
      mocks.mockSingle
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
      mocks.mockSingle
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
        mocks.mockFrom.mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              single: mocks.mockSingle
            })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          }),
          insert: () => Promise.resolve({ error: null })
        }))

        mocks.mockSingle
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
      
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with organization name and completed onboarding
      const mockProfile = { 
        user_id: mockUser.id,
        user_type: "brand", 
        organization_name: "Test Brand",
        onboarding_completed: true 
      }
      

      const mockBrand = { 
        user_id: mockUser.id,
        stripe_customer_id: null, 
        payment_verified: false
      }
      

      // Setup mock chain
      mocks.mockFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: mocks.mockSingle.mockResolvedValueOnce({ data: mockProfile })
              .mockResolvedValueOnce({ data: mockBrand })
          })
        })
      }))

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
        mocks.mockSingle
          .mockResolvedValueOnce({ data: mockCompletedProfile }) // Profile query
          .mockResolvedValueOnce({ data: mockBrandData }) // Brand query

        const response = await middleware(mockRequest as NextRequest)
        expect(response.type).toBe("next")
      }
    })

    it("redirects to appropriate onboarding step when accessing protected routes with incomplete onboarding", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with incomplete onboarding
      const mockIncompleteProfile = {
        user_type: "brand",
        organization_name: null,
        onboarding_completed: false,
      }

      mocks.mockSingle
        .mockResolvedValueOnce({ data: mockIncompleteProfile, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")
    })
  })

  describe("Brand Onboarding Flow", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }
    const mockBrandProfile = {
      user_type: "brand",
      organization_name: null,
      onboarding_completed: false,
    }

    it("redirects to onboarding after successful email signup", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      mocks.mockSingle
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
      
      // Mock a failed profile query with an error
      mocks.mockFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValueOnce({ 
              data: null, 
              error: { code: "PGRST116", message: "No profile found" }
            })
          })
        })
      }))

      const response = await middleware(mockRequest as NextRequest)

      expect(response.type).toBe("redirect")
      const redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/signin")
    })
  })

  describe("Brand Onboarding Flow - Complete Path", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("follows the complete onboarding path with payment setup", async () => {
      // Mock auth user for all requests
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })

      // Step 1: Initial state - No profile data
      mocks.mockSingle
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            user_type: "brand",
            organization_name: null,
            onboarding_completed: false
          },
          error: null
        }) // Profile check
        .mockResolvedValueOnce({
          data: null,
          error: null
        }) // Brand check (no record yet)

      let mockRequest = setupRequest("/dashboard")
      let response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("redirect")
      let redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/profile")

      // Step 2: After profile setup but before payment setup
      mocks.mockSingle
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            user_type: "brand",
            organization_name: "Test Brand",
            onboarding_completed: false
          },
          error: null
        }) // Profile check
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            stripe_customer_id: null,
            payment_verified: false
          },
          error: null
        }) // Brand check

      mockRequest = setupRequest("/dashboard")
      response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("redirect")
      redirectUrl = new URL(response.url)
      expect(redirectUrl.pathname).toBe("/onboarding/brand/payments")

      // Step 3: After payment setup but before onboarding completion
      mocks.mockSingle
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            user_type: "brand",
            organization_name: "Test Brand",
            onboarding_completed: false
          },
          error: null
        }) // Profile check
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            stripe_customer_id: "cus_123",
            payment_verified: true
          },
          error: null
        }) // Brand check

      // Mock the update function for completing onboarding
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
      mocks.mockFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: mocks.mockSingle
          })
        }),
        update: mockUpdate
      }))

      mockRequest = setupRequest("/dashboard")
      response = await middleware(mockRequest as NextRequest)
      expect(response.type).toBe("next")

      // Verify onboarding was marked as complete
      expect(mocks.mockFrom).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true })
    })
  })

  describe("Brand Onboarding Flow - Skip Payment Path", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("allows dashboard and other non-payment routes without payment setup", async () => {
      mockRequest = setupRequest("/dashboard")
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
      
      // Mock profile with organization name and completed onboarding
      mocks.mockSingle
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
        mocks.mockFrom.mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              single: mocks.mockSingle
            })
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          }),
          insert: () => Promise.resolve({ error: null })
        }))

        mocks.mockSingle
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