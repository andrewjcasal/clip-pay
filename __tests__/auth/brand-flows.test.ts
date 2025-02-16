import { createServerSupabaseClient } from "@/lib/supabase-server"
import {
  signUpBrand,
  updateBrandProfile,
  setupBrandPayment,
  completeBrandOnboarding,
  canCreateCampaign,
} from "@/app/auth/brand"

// Mock Supabase client
jest.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}))

describe("Brand Authentication and Onboarding Flows", () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signIn: jest.fn(),
    },
    from: jest.fn(),
  }

  // Create reusable mock functions
  const mockSelect = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockSingle = jest.fn()
  const mockInsert = jest.fn().mockReturnThis()
  const mockUpdate = jest.fn().mockReturnThis()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

    // Reset mock functions
    mockSelect.mockClear()
    mockEq.mockClear()
    mockSingle.mockClear()
    mockInsert.mockClear()
    mockUpdate.mockClear()

    // Setup the default mock chain
    mockSupabase.from.mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      insert: mockInsert,
      update: mockUpdate,
    }))
  })

  describe("Email Signup Flow", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }
    const mockPassword = "testPassword123"

    it("successfully creates a brand account with email", async () => {
      // Mock successful signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      // Mock profile creation
      mockInsert.mockResolvedValueOnce({
        data: {
          user_id: mockUser.id,
          user_type: "brand",
          onboarding_completed: false,
        },
        error: null,
      })

      const result = await signUpBrand(mockUser.email, mockPassword)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: mockUser.email,
        password: mockPassword,
      })
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        user_type: "brand",
        onboarding_completed: false,
      })
    })

    it("handles signup failure", async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: new Error("Email already registered"),
      })

      const result = await signUpBrand(mockUser.email, mockPassword)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Email already registered")
    })
  })

  describe("Brand Onboarding - Complete Flow", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("completes full onboarding with profile and payment setup", async () => {
      // Step 1: Update profile with organization name
      mockUpdate
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            organization_name: "Test Brand",
            onboarding_completed: false,
          },
          error: null,
        })

      const profileResult = await updateBrandProfile(mockUser.id, {
        organization_name: "Test Brand",
      })

      expect(profileResult.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({
        organization_name: "Test Brand",
      })

      // Step 2: Setup payment with Stripe
      mockInsert.mockResolvedValueOnce({
        data: {
          user_id: mockUser.id,
          stripe_customer_id: "cus_123",
          payment_verified: true,
        },
        error: null,
      })

      const paymentResult = await setupBrandPayment(mockUser.id, "tok_visa")

      expect(paymentResult.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("brands")
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        stripe_customer_id: "cus_123",
        payment_verified: true,
      })

      // Step 3: Complete onboarding
      mockUpdate.mockResolvedValueOnce({
        data: {
          user_id: mockUser.id,
          onboarding_completed: true,
        },
        error: null,
      })

      const completionResult = await completeBrandOnboarding(mockUser.id)

      expect(completionResult.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({
        onboarding_completed: true,
      })
    })
  })

  describe("Brand Onboarding - Skip Payment Flow", () => {
    const mockUser = { id: "user-1", email: "test@example.com" }

    it("allows completing onboarding without payment setup", async () => {
      // Step 1: Update profile with organization name
      mockUpdate
        .mockResolvedValueOnce({
          data: {
            user_id: mockUser.id,
            organization_name: "Test Brand",
            onboarding_completed: false,
          },
          error: null,
        })

      const profileResult = await updateBrandProfile(mockUser.id, {
        organization_name: "Test Brand",
      })

      expect(profileResult.success).toBe(true)

      // Step 2: Skip payment and complete onboarding
      mockUpdate.mockResolvedValueOnce({
        data: {
          user_id: mockUser.id,
          onboarding_completed: true,
        },
        error: null,
      })

      const completionResult = await completeBrandOnboarding(mockUser.id)

      expect(completionResult.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({
        onboarding_completed: true,
      })
    })

    it("requires payment setup when attempting to create campaign", async () => {
      mockSelect
        .mockImplementationOnce(() => ({
          eq: mockEq,
          single: mockSingle.mockResolvedValueOnce({
            data: {
              stripe_customer_id: null,
              payment_verified: false,
            },
          }),
        }))

      const result = await canCreateCampaign(mockUser.id)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("payment_required")
    })
  })
}) 