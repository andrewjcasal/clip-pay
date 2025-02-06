import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return new NextResponse("Missing submission ID", { status: 400 })
    }

    // Get the submission details
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      console.error("Error fetching submission:", submissionError)
      return new NextResponse("Submission not found", { status: 404 })
    }

    // Update the submission status
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        payout_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return new NextResponse("Failed to update submission", { status: 500 })
    }

    // Create a notification for the creator
    await supabase.from("notifications").insert({
      recipient_id: submission.user_id,
      type: "payout_processed",
      title: "Payment Processed",
      message:
        "Your payment has been processed and will be sent to your account.",
      metadata: {
        submission_id: submissionId,
      },
    })

    return new NextResponse(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error processing payment:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
