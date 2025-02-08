import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get creator's Stripe account ID
    const { data: creator } = await supabase
      .from("creators")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    if (!creator?.stripe_account_id) {
      return NextResponse.json({ transactions: [] })
    }

    // Fetch transfers (payouts to creator's bank account)
    const transfers = await stripe.transfers.list({
      destination: creator.stripe_account_id,
      limit: 100,
      expand: ["data.destination_payment"],
    })

    const transactions = transfers.data.map((transfer) => ({
      id: transfer.id,
      amount: transfer.amount / 100,
      status: transfer.status,
      created: transfer.created,
      arrival_date: transfer.arrival_date,
      description: transfer.description,
      type: "transfer",
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
