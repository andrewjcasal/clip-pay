import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from './lib/supabase-server';
import { SupabaseClient, User } from "@supabase/supabase-js"

const getProfile = async (supabase: SupabaseClient, user: User) =>
  (
    await supabase
      .from("profiles")
      .select("user_type, organization_name, onboarding_completed")
      .eq("user_id", user.id)
      .single()
  )?.data

const getCreator = async (supabase: SupabaseClient, user: User) =>
  (
    await supabase
      .from("creators")
      .select("tiktok_connected")
      .eq("user_id", user.id)
      .single()
  )?.data

export async function middleware(req: NextRequest) {
  console.log("\n=== Middleware Start ===")
  console.log("Request URL:", req.url)
  console.log("Current path:", req.nextUrl.pathname)
  console.log("Request headers:", Object.fromEntries(req.headers))
  const currentPath = req.nextUrl.pathname

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("No user found, redirecting to signin")
    const response = NextResponse.redirect(new URL('/signin', req.url))
    console.log("Response:", { type: response.type, status: response.status, url: response.url })
    return response
  }
  console.log("User found:", user.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name, onboarding_completed")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    console.log("No profile found, redirecting to signin")
    const response = NextResponse.redirect(new URL('/signin', req.url))
    console.log("Response:", { type: response.type, status: response.status, url: response.url })
    return response
  }
  console.log("Profile:", {
    user_type: profile.user_type,
    has_org_name: !!profile.organization_name,
    onboarding_completed: profile.onboarding_completed
  })

  // Get brand data if user is a brand
  let brand
  if (profile.user_type === 'brand') {
    const { data: brandData } = await supabase
      .from("brands")
      .select("stripe_customer_id, payment_verified")
      .eq("user_id", user.id)
      .single()
    brand = brandData
    console.log("Brand data:", {
      has_stripe: !!brand?.stripe_customer_id,
      payment_verified: brand?.payment_verified
    })
  }

  // Check if this is a payment-related route that requires payment verification
  const paymentRoutes = ['/payouts', '/campaigns/new', '/api/payouts']
  if (profile.user_type === 'brand' && paymentRoutes.some(route => currentPath.startsWith(route))) {
    if (!brand?.payment_verified) {
      console.log("Brand accessing payment route without verification, redirecting to payments")
      const response = NextResponse.redirect(new URL('/onboarding/brand/payments', req.url))
      console.log("Response:", { type: response.type, status: response.status, url: response.url })
      return response
    }
  }

  // If onboarding is completed, allow access to all routes
  if (profile.onboarding_completed) {
    console.log("Onboarding completed, allowing access")
    const response = NextResponse.next()
    console.log("Response:", { type: response.type, status: response.status })
    return response
  }

  console.log("Onboarding not completed")
  if (profile.user_type === 'creator') {
    console.log("Processing creator onboarding")

    // Special case: Always allow access to TikTok auth page and its API routes
    if (currentPath.startsWith('/onboarding/creator/tiktok')) {
      console.log("On TikTok auth page or API route, allowing access")
      const response = NextResponse.next()
      console.log("Response:", { type: response.type, status: response.status })
      return response
    }

    const creator = await getCreator(supabase, user)
    console.log("Creator data:", {
      exists: !!creator,
      tiktok_connected: creator?.tiktok_connected
    })
    
    // If no creator record or TikTok not connected, redirect to TikTok auth
    if (!creator || !creator.tiktok_connected) {
      // Create creator record if it doesn't exist
      if (!creator) {
        console.log("Creating new creator record")
        const { error } = await supabase
          .from("creators")
          .insert({ user_id: user.id, tiktok_connected: false })
        if (error) {
          console.error("Error creating creator record:", error)
        }
      }
      console.log("Redirecting to TikTok auth")
      const response = NextResponse.redirect(new URL('/onboarding/creator/tiktok', req.url))
      console.log("Response:", { type: response.type, status: response.status, url: response.url })
      return response
    }
    
    // If TikTok is connected but no organization name, handle profile setup
    if (!profile.organization_name) {
      // Allow access if already on profile setup page
      if (currentPath === '/onboarding/creator/profile') {
        console.log("Already on profile setup page, allowing access")
        const response = NextResponse.next()
        console.log("Response:", { type: response.type, status: response.status })
        return response
      }
      
      console.log("TikTok connected but no org name, redirecting to profile setup")
      const response = NextResponse.redirect(new URL('/onboarding/creator/profile', req.url))
      console.log("Response:", { type: response.type, status: response.status, url: response.url })
      return response
    }

    // If we get here, all onboarding steps are complete
    console.log("All creator onboarding steps completed")
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id)
    const response = NextResponse.next()
    console.log("Response:", { type: response.type, status: response.status })
    return response
  } 
  else if (profile.user_type === 'brand') {
    console.log("Processing brand onboarding")
    // Allow access to current step
    if (
      (currentPath === '/onboarding/brand/profile' && !profile.organization_name) ||
      (currentPath === '/onboarding/brand/payments' && profile.organization_name && (!brand?.stripe_customer_id || !brand?.payment_verified))
    ) {
      console.log("Allowing access to current onboarding step")
      return NextResponse.next()
    }

    // Determine the correct step
    if (!profile.organization_name) {
      console.log("No org name, redirecting to profile setup")
      return NextResponse.redirect(new URL('/onboarding/brand/profile', req.url))
    }

    if (!brand?.stripe_customer_id || !brand?.payment_verified) {
      console.log("Payment not set up, redirecting to payments")
      return NextResponse.redirect(new URL('/onboarding/brand/payments', req.url))
    }

    // If all steps completed, mark onboarding as complete
    console.log("All brand onboarding steps completed")
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id)
    return NextResponse.next()
  }

  console.log("=== Middleware End ===")
  const finalResponse = NextResponse.next()
  console.log("Final Response:", { type: finalResponse.type, status: finalResponse.status })
  return finalResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/payouts/:path*',
    '/campaigns/:path*',
    '/api/payouts/:path*',
    '/onboarding/brand/profile',
    '/onboarding/brand/payments',
    '/onboarding/creator/tiktok/:path*',
    '/onboarding/creator/profile/:path*'
  ]
} 