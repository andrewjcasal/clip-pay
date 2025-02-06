import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the request body
    const { organizationName } = await request.json()

    if (!organizationName) {
      return new NextResponse("Organization name is required", { status: 400 })
    }

    // Update the profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return new NextResponse("Failed to retrieve profile", { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_name: organizationName,
        onboarding_completed: true,
      })
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return new NextResponse("Failed to update profile", { status: 500 })
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error in creator setup:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
