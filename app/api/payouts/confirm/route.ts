import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  try {
    const { paymentIntentId } = await request.json()

    // Get the authenticated user first
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No user found")
      return NextResponse.json(
        { error: "Please sign in to continue" },
        { status: 401 }
      )
    }

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(
      paymentIntent.customer as string
    )
    if ("deleted" in customer) {
      return NextResponse.json(
        { error: "Customer account not found" },
        { status: 404 }
      )
    }

    if (!customer.invoice_settings.default_payment_method) {
      return NextResponse.json(
        { error: "No default payment method found" },
        { status: 400 }
      )
    }

    // Confirm the payment with the default payment method
    const confirmedPayment = await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: customer.invoice_settings
          .default_payment_method as string,
      }
    )

    if (confirmedPayment.status === "succeeded") {
      // Update transaction status
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("stripe_payment_intent_id", paymentIntentId)

      if (transactionError) {
        console.error("Transaction update error:", transactionError)
        throw new Error("Failed to update transaction status")
      }

      // Update submission status
      const { error: submissionError } = await supabase
        .from("submissions")
        .update({ status: "fulfilled" })
        .eq("id", paymentIntent.metadata.submissionId)

      if (submissionError) {
        console.error("Submission update error:", submissionError)
        throw new Error("Failed to update submission status")
      }

      return NextResponse.json({ status: "succeeded" })
    }

    return NextResponse.json({ status: confirmedPayment.status })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to confirm payment",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
