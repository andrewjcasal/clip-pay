import { createServerSupabaseClient } from "@/lib/supabase-server"
import {
  signUpBrand,
  updateBrandProfile,
  setupBrandPayment,
  completeBrandOnboarding,
  canCreateCampaign,
  BrandRepository,
  AuthService,
} from "@/app/auth/brand"
import { SupabaseClient, AuthError, AuthResponse, User } from "@supabase/supabase-js"
import { PostgrestQueryBuilder } from "@supabase/postgrest-js"

// Mock Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe("Brand Authentication and Onboarding Flows", () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let brandRepo: BrandRepository
  let authService: AuthService

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Initialize mock Supabase client
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
      },
      from: jest.fn(),
    } as any

    // Initialize repository and service
    brandRepo = new BrandRepository(mockSupabase)
    authService = new AuthService(mockSupabase)
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe("signUpBrand", () => {
    it("successfully creates a brand account", async () => {
      // Mock auth signup response
      const mockSignUpResponse: AuthResponse = {
        data: { user: mockUser, session: null },
        error: null,
      }
      jest.spyOn(mockSupabase.auth, "signUp").mockResolvedValueOnce(mockSignUpResponse)

      // Mock profile creation
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      })
      mockSupabase.from = mockFrom

      const result = await signUpBrand(mockUser.email!, "password123")

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: mockUser.email,
        password: "password123",
      })
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })

    it("handles signup failure", async () => {
      const mockErrorResponse: AuthResponse = {
        data: { user: null, session: null },
        error: new AuthError("Email already registered"),
      }
      jest.spyOn(mockSupabase.auth, "signUp").mockResolvedValueOnce(mockErrorResponse)

      const result = await signUpBrand(mockUser.email!, "password123")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Email already registered")
    })
  })

  describe("updateBrandProfile", () => {
    it("successfully updates brand profile", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
        }),
      })
      mockSupabase.from = mockFrom

      const result = await updateBrandProfile(mockUser.id, {
        organization_name: "Test Brand",
      })

      expect(result.success).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })
  })

  describe("setupBrandPayment", () => {
    it("successfully sets up brand payment", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
      })
      mockSupabase.from = mockFrom

      const result = await setupBrandPayment(mockUser.id, "tok_visa")

      expect(result.success).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith("brands")
    })
  })

  describe("canCreateCampaign", () => {
    it("allows campaign creation when payment is verified", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: { stripe_customer_id: "cus_123", payment_verified: true },
              error: null,
            }),
          }),
        }),
      })
      mockSupabase.from = mockFrom

      const result = await canCreateCampaign(mockUser.id)

      expect(result.allowed).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith("brands")
    })

    it("prevents campaign creation when payment is not verified", async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: { stripe_customer_id: null, payment_verified: false },
              error: null,
            }),
          }),
        }),
      })
      mockSupabase.from = mockFrom

      const result = await canCreateCampaign(mockUser.id)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("payment_required")
    })
  })
}) 