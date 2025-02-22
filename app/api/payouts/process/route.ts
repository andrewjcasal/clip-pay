import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  try {
    // Get the authenticated user first
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No session found")
      return NextResponse.json(
        { error: "Please sign in to continue" },
        { status: 401 }
      )
    }

    const { submissionId, verifiedViews } = await request.json()

    // Get the brand's details including payment setup
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select(
        `
        *,
        profiles!inner (
          user_type
        )
      `
      )
      .eq("user_id", user.id)
      .single()

    if (brandError) {
      console.error("Brand fetch error:", brandError)
      return NextResponse.json(
        { error: "Failed to fetch brand details" },
        { status: 500 }
      )
    }

    if (!brand) {
      console.error("No brand found for user:", user.id)
      return NextResponse.json(
        { error: "Brand account not found" },
        { status: 404 }
      )
    }

    if (brand.profiles.user_type !== "brand") {
      console.error("User is not a brand:", brand.profiles.user_type)
      return NextResponse.json(
        { error: "Only brand accounts can process payments" },
        { status: 403 }
      )
    }

    if (!brand.payment_verified) {
      console.error("Brand payment not verified:", brand.id)
      return NextResponse.json(
        { error: "Please complete payment setup first" },
        { status: 400 }
      )
    }

    if (!brand.stripe_customer_id) {
      console.error("No Stripe customer ID for brand:", brand.id)
      return NextResponse.json(
        { error: "Payment method not set up" },
        { status: 400 }
      )
    }

    // Get submission and campaign details
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(
        `
        *,
        campaign:campaigns (
          id,
          title,
          rpm,
          budget_pool,
          referral_bonus_rate
        ),
        creator:creators (
          user_id,
          stripe_account_id,
          profile:profiles (
            referred_by
          )
        )
      `
      )
      .eq("id", submissionId)
      .single()

    if (submissionError || !submission) {
      console.error("Submission error:", submissionError)
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Calculate payment amount
    const paymentAmount =
      (submission.views * Number(submission.campaign.rpm)) / 1000
    const serviceFee = paymentAmount * 0.2 // 20% service fee
    const totalAmount = paymentAmount + serviceFee

    // Calculate referrer payment if applicable
    let referrerPayment = 0
    let referrerStripeAccountId = null
    if (submission.creator.profile.referred_by) {
      // Get referrer's Stripe account
      const { data: referrer } = await supabase
        .from("creators")
        .select("stripe_account_id")
        .eq("user_id", submission.creator.profile.referred_by)
        .single()

      if (referrer?.stripe_account_id) {
        referrerPayment =
          (submission.views * Number(submission.campaign.referral_bonus_rate)) /
          1000
        referrerStripeAccountId = referrer.stripe_account_id
      }
    }

    // Validate payment amount
    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      )
    }

    if (!submission.creator.stripe_account_id) {
      return NextResponse.json(
        { error: "Creator has not connected their Stripe account" },
        { status: 400 }
      )
    }

    // Create Stripe PaymentIntent with automatic transfer to creator and referrer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "usd",
      customer: brand.stripe_customer_id,
      payment_method_types: ["card"],
      confirm: false, // Don't confirm automatically
      transfer_data: {
        destination: submission.creator.stripe_account_id,
        amount: Math.round(paymentAmount * 100), // Creator gets the base payment amount
      },
      metadata: {
        submissionId,
        brandId: brand.id,
        creatorId: submission.creator.user_id,
        paymentAmount: paymentAmount.toString(),
        serviceFee: serviceFee.toString(),
        referrerPayment: referrerPayment.toString(),
        referrerId: submission.creator.profile.referred_by || "",
      },
    })

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        brand_id: brand.id,
        submission_id: submissionId,
        amount: totalAmount,
        service_fee: serviceFee,
        referrer_amount: referrerPayment,
        referrer_id: submission.creator.profile.referred_by || null,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
        creator_payout_status: "pending",
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      throw new Error("Failed to create transaction record")
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        status: "payment_pending",
        views: submission.views,
        payout_amount: totalAmount,
      })
      .eq("id", submissionId)

    if (updateError) {
      console.error("Update error:", updateError)
      throw new Error("Failed to update submission status")
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process payment",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
