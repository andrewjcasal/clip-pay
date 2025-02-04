import { Database } from './supabase'

// Extract the campaigns table type
type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type BrandRow = Database['public']['Tables']['brands']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Define the Campaign type with its relations
export type Campaign = CampaignRow & {
  brand: {
    profiles: Pick<ProfileRow, 'organization_name'>
  }
}

// Define other common types
export type CampaignWithSubmissions = Campaign & {
  submissions: Array<{
    id: string
    status: string
    creator_id: string
    video_url: string | null
    file_path: string | null
    transcription: string | null
    created_at: string
    views: number
    creator: {
      full_name: string | null
      email: string | null
    }
  }>
  activeSubmissionsCount: number
}

// Add other types as needed... 