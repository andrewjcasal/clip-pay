export type SubmissionCreator = {
  full_name: string | null
  email: string | null
  organization_name: string | null
}

export type Submission = {
  id: string
  status: string
  video_url: string | null
  file_path: string | null
  campaign_id: string
  created_at: string
  transcription: string | null
  views: number
  user_id: string
  creator: SubmissionCreator
  payout_status?: string
  auto_moderation_result?: {
    approved: boolean
    reason: string
    confidence: number
  }
}

export interface CampaignWithSubmissions {
    id: string
    title: string
    budget_pool: string
    rpm: string
    guidelines: string | null
    video_outline: string | null
    status: string | null
    brand: {
      name: string
      payment_verified: boolean
    }
    submission: Submission | null
    submissions: Submission[]
    activeSubmissionsCount: number
    remaining_budget?: number
    has_insufficient_budget?: boolean
}

export interface NewCampaign {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  video_outline: string
  referral_bonus_rate: string
}

export interface FormErrors {
  title?: boolean
  budget_pool?: boolean
  rpm?: boolean
  guidelines?: boolean
} 