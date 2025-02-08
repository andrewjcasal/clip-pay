export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          organization_name: string | null
          user_type: "creator" | "brand" | "admin"
          onboarding_completed: boolean
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name?: string | null
          user_type?: "creator" | "brand" | "admin"
          onboarding_completed?: boolean
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string | null
          user_type?: "creator" | "brand" | "admin"
          onboarding_completed?: boolean
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          profile_id: string
          code: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          code: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          code?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          type: string
          title: string
          message: string
          metadata: Json | null
          seen: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          type: string
          title: string
          message: string
          metadata?: Json | null
          seen?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          type?: string
          title?: string
          message?: string
          metadata?: Json | null
          seen?: boolean
          created_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          payment_verified: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          payment_verified?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          payment_verified?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      creators: {
        Row: {
          id: string
          user_id: string
          stripe_account_id: string | null
          stripe_account_status: string | null
          total_earned: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          total_earned?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          total_earned?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          brand_id: string
          title: string
          budget_pool: string
          rpm: string
          guidelines: string | null
          video_outline: string | null
          status: string | null
          referral_bonus_rate: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          budget_pool: string
          rpm: string
          guidelines?: string | null
          video_outline?: string | null
          status?: string | null
          referral_bonus_rate: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string
          budget_pool?: string
          rpm?: string
          guidelines?: string | null
          video_outline?: string | null
          status?: string | null
          referral_bonus_rate?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      submissions: {
        Row: {
          id: string
          campaign_id: string
          creator_id: string
          status: string
          video_url: string | null
          file_path: string | null
          transcription: string | null
          views: number
          earned: number | null
          paid_out: boolean
          payout_amount: string | null
          payout_due_date: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          creator_id: string
          status?: string
          video_url?: string | null
          file_path?: string | null
          transcription?: string | null
          views?: number
          earned?: number | null
          paid_out?: boolean
          payout_amount?: string | null
          payout_due_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          creator_id?: string
          status?: string
          video_url?: string | null
          file_path?: string | null
          transcription?: string | null
          views?: number
          earned?: number | null
          paid_out?: boolean
          payout_amount?: string | null
          payout_due_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          brand_id: string
          submission_id: string
          amount: number
          stripe_payment_intent_id: string | null
          status: string
          creator_payout_status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          submission_id: string
          amount: number
          stripe_payment_intent_id?: string | null
          status?: string
          creator_payout_status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          submission_id?: string
          amount?: number
          stripe_payment_intent_id?: string | null
          status?: string
          creator_payout_status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 