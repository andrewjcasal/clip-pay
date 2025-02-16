import { BrandRepository, AuthService } from "@/app/auth/brand"
import { SupabaseClient } from "@supabase/supabase-js"

describe("BrandRepository", () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let brandRepo: BrandRepository

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      auth: {
        signUp: jest.fn(),
      },
    } as any

    brandRepo = new BrandRepository(mockSupabase)
  })

  describe("createProfile", () => {
    it("creates a brand profile", async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any)

      await brandRepo.createProfile("user-1")

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-1",
        user_type: "brand",
        onboarding_completed: false,
      })
    })
  })

  describe("updateProfile", () => {
    it("updates a brand profile", async () => {
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any)

      await brandRepo.updateProfile("user-1", { organization_name: "Test Brand" })

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({ organization_name: "Test Brand" })
    })
  })

  describe("completeOnboarding", () => {
    it("marks onboarding as complete", async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null })
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any)

      await brandRepo.completeOnboarding("user-1")

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true })
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1")
    })
  })

  describe("setupPayment", () => {
    it("sets up brand payment", async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any)

      await brandRepo.setupPayment("user-1", "tok_visa")

      expect(mockSupabase.from).toHaveBeenCalledWith("brands")
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-1",
        stripe_customer_id: "cus_tok_visa",
        payment_verified: true,
      })
    })
  })

  describe("getBrandPaymentStatus", () => {
    it("gets brand payment status", async () => {
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: { stripe_customer_id: "cus_123", payment_verified: true },
        error: null 
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await brandRepo.getBrandPaymentStatus("user-1")

      expect(mockSupabase.from).toHaveBeenCalledWith("brands")
      expect(mockSelect).toHaveBeenCalledWith("stripe_customer_id, payment_verified")
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1")
      expect(result.data).toEqual({
        stripe_customer_id: "cus_123",
        payment_verified: true,
      })
    })
  })
})

describe("AuthService", () => {
  let mockSupabase: jest.Mocked<SupabaseClient>
  let authService: AuthService

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
      },
    } as any

    authService = new AuthService(mockSupabase)
  })

  describe("signUp", () => {
    it("signs up a new user", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await authService.signUp("test@example.com", "password123")

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.data.user).toEqual(mockUser)
    })
  })
}) 