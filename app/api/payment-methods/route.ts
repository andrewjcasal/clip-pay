import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()

  try {
    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to continue" },
        { status: 401 }
      )
    }

    // Get the brand's Stripe customer ID
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "Brand account not found" },
        { status: 404 }
      )
    }

    if (!brand.stripe_customer_id) {
      return NextResponse.json(
        { error: "No payment method set up" },
        { status: 400 }
      )
    }

    // Retrieve the customer from Stripe
    const customer = await stripe.customers.retrieve(brand.stripe_customer_id)

    if ("deleted" in customer) {
      return NextResponse.json(
        { error: "Customer account not found" },
        { status: 404 }
      )
    }

    // If there's no default payment method, return null
    if (!customer.invoice_settings.default_payment_method) {
      return NextResponse.json({ paymentMethod: null })
    }

    // Retrieve the default payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      customer.invoice_settings.default_payment_method as string
    )

    return NextResponse.json({
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
      },
    })
  } catch (error) {
    console.error("Error retrieving payment method:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve payment method",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
