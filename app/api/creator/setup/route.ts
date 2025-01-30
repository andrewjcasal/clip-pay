import { getAuthenticatedRoute } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedRoute()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const { session, supabase } = authResult

    // Get the request body
    const { organizationName } = await request.json()

    if (!organizationName) {
      return new NextResponse("Organization name is required", { status: 400 })
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        organization_name: organizationName,
        onboarding_completed: true,
      })
      .eq("id", session.user.id)

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
