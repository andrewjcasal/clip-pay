"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import Stripe from "stripe"
import { Database } from "@/types/supabase"

type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"]

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Get creator's Stripe account ID
  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single()

  if (!creator?.stripe_account_id) {
    return new Response("No Stripe account connected", { status: 400 })
  }

  // Get all approved submissions that haven't been paid out
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, earned")
    .eq("creator_id", user.id)
    .eq("status", "approved")
    .eq("payout_status", "pending")
    .returns<Pick<SubmissionRow, "id" | "earned">[]>()

  if (!submissions || submissions.length === 0) {
    return new Response("No pending payouts", { status: 400 })
  }

  // Calculate total payout amount
  const totalAmount = submissions.reduce(
    (sum, sub) => sum + (sub.earned || 0),
    0
  )

  try {
    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "usd",
      destination: creator.stripe_account_id,
    })

    // Update all submissions as paid out
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        payout_status: "completed",
        payout_transfer_id: transfer.id,
      })
      .in(
        "id",
        submissions.map((s) => s.id)
      )

    if (updateError) {
      throw updateError
    }

    // Create a notification for the creator
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      type: "payout_completed",
      title: "Payout Completed",
      message: `Your payout of $${totalAmount.toFixed(2)} has been initiated.`,
      metadata: {
        amount: totalAmount,
        transfer_id: transfer.id,
      },
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error processing payout:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to process payout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
