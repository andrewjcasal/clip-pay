"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // Get the creator's Stripe account ID
    const { data: creator } = await supabase
      .from("creators")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    if (!creator?.stripe_account_id) {
      return new Response("No Stripe account found", { status: 400 })
    }

    // Retrieve the account from Stripe to check its status
    const account = await stripe.accounts.retrieve(creator.stripe_account_id)

    // Update the creator record with the account status
    await supabase
      .from("creators")
      .update({
        stripe_account_status: account.details_submitted ? "active" : "pending",
      })
      .eq("user_id", user.id)

    // Create a notification for the user
    if (account.details_submitted) {
      await supabase.from("notifications").insert({
        recipient_id: user.id,
        type: "stripe_connected",
        title: "Bank Account Connected",
        message:
          "Your bank account has been successfully connected. You can now receive payouts for your content.",
      })
    }

    // Redirect back to settings page
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/settings${
        account.details_submitted ? "?success=connect" : "?error=incomplete"
      }`
    )
  } catch (error) {
    console.error("Error verifying Stripe account:", error)
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/settings?error=verification`
    )
  }
}
