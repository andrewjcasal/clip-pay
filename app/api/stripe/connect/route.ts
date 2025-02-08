"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
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

  // Get user profile to ensure they're a creator
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.user_type !== "creator") {
    return new Response("Unauthorized", { status: 401 })
  }

  // Create Stripe Connect account link
  const accountLink = await stripe.accountLinks.create({
    account: await createStripeConnectAccount(
      user.id,
      profile.organization_name || ""
    ),
    type: "account_onboarding",
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?error=connect_refresh`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/connect/callback`,
  })

  // Redirect to Stripe Connect onboarding
  return Response.redirect(accountLink.url)
}

async function createStripeConnectAccount(
  userId: string,
  businessName: string
) {
  const supabase = await createServerSupabaseClient()

  // Check if creator already has a Stripe account
  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .single()

  let accountId = creator?.stripe_account_id

  if (!accountId) {
    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      business_type: "individual",
      business_profile: {
        name: businessName,
      },
      capabilities: {
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
          statement_descriptor: "ClipPay",
        },
      },
    })

    accountId = account.id

    // Update creator record with Stripe account ID
    await supabase
      .from("creators")
      .update({
        stripe_account_id: accountId,
        stripe_account_status: "pending",
      })
      .eq("user_id", userId)
  }

  return accountId
}
