import { useState } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"
import { CreatorDashboardClient } from "./creator-client"
import { cookies } from "next/headers"
import { DashboardHeader } from "./header"

export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/signin")
  }

  const userType = session.user.user_metadata.user_type

  if (userType === "creator") {
    // Get all available campaigns with brand data and existing submissions
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select(`*`)
      .order("created_at", { ascending: false })

    // Transform the data to match the expected format
    const transformedCampaigns =
      campaigns?.map((campaign) => ({
        ...campaign,
        brand: campaign.brands,
        submission: campaign.submissions?.[0] || null,
      })) || []

    console.log(campaigns)

    return (
      <div className="min-h-screen bg-[#313338]">
        <div className="border-b border-zinc-800 bg-[#2B2D31]">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-white">
              {userType === "brand" ? "Brand Platform" : "Creator Platform"}
            </h1>
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
      )
    `
    )
    .eq("brand_id", brandData.id)
    .order("created_at", { ascending: false })

  // Transform the data to include the count of active submissions
  const transformedCampaigns =
    campaigns?.map((campaign) => ({
      ...campaign,
      activeSubmissionsCount:
        campaign.submissions?.filter((sub) => sub.status === "active").length ||
        0,
    })) || []

  console.log("brandData", brandData)

  console.log(
    "campaigns",
    campaigns?.map((campaign) => campaign.submissions)
  )

  return (
    <div className="min-h-screen bg-[#313338]">
      <div className="border-b border-zinc-800 bg-[#2B2D31]">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white">
            {userType === "brand" ? "Brand Platform" : "Creator Platform"}
          </h1>
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
