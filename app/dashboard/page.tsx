import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"
import { CreatorDashboardClient } from "./creator-client"
import { cookies } from "next/headers"
import { DashboardHeader } from "./header"

export const dynamic = "force-dynamic"
export const revalidate = 0

export interface Campaign {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  status: string
  video_outline: string | null
  brands?: {
    name: string
    logo_url: string | null
  }
  submissions?: Array<{
    id: string
    status: string
    video_url: string
    created_at: string
  }>
}

export default async function Dashboard() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.error("Session error:", sessionError)
    redirect("/signin")
  }

  const userType = session.user.user_metadata.user_type

  // Check if brand user has completed onboarding
  if (userType === "brand") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .single()

    if (!profile?.onboarding_completed) {
      redirect("/onboarding/brand/profile")
    }
  }

  console.log("userType 12", userType)

  if (userType === "creator") {
    // Get all available campaigns with brand data and existing submissions
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        brand:brands (
          id,
          user_id,
          profiles (
            organization_name
          )
        ),
        submissions (
          id,
          status,
          video_url,
          created_at,
          creator_id
        )
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError)
      return <div>Error loading campaigns</div>
    }

    // Transform the data to match the expected format
    const transformedCampaigns =
      campaigns?.map((campaign) => ({
        ...campaign,
        brand: {
          name: campaign.brand?.profiles?.organization_name || "Unnamed Brand",
          logo_url: null, // We don't have logo URLs in the current schema
        },
        submission:
          campaign.submissions?.find(
            (sub: { creator_id: string }) => sub.creator_id === session.user.id
          ) || null,
      })) || []

    console.log("transformedCampaigns 12", transformedCampaigns)
    return (
      <div className="min-h-screen bg-[#313338]">
        <div className="border-b border-zinc-800 bg-[#2B2D31]">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">Creator Platform</h1>
            <DashboardHeader userType={userType} />
          </div>
        </div>
        <CreatorDashboardClient transformedCampaigns={transformedCampaigns} />
      </div>
    )
  }

  // If we get here, user is a brand
  const { data: brandData } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  if (!brandData) {
    return <div>Brand not found</div>
  }

  // Get campaigns for brand with submissions
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      submissions!left (
        id,
        video_url,
        transcription,
        creator_id,
        status,
        created_at,
        views
      ),
      brand!left (
        id,
        user_id,
        profiles (
          organization_name
        )
      )
    `
    )
    .eq("brand_id", brandData.id)
    .order("created_at", { ascending: false })

  console.log("campaigns 13", campaigns)

  // Transform the data to include the count of active submissions
  const transformedCampaigns =
    campaigns?.map((campaign) => ({
      ...campaign,
      activeSubmissionsCount:
        campaign.submissions?.filter(
          (sub: { status: string }) => sub.status === "active"
        ).length || 0,
    })) || []

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">Brand Platform</h1>
          <DashboardHeader userType={userType} />
        </div>
      </div>
      <DashboardClient
        initialCampaigns={transformedCampaigns}
        brandId={brandData.id}
      />
    </div>
  )
}