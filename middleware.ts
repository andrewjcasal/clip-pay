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
  console.log("Middleware called")
  const res = NextResponse.next()
  const supabase = await createServerSupabaseClient();

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("No user found")
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  const profile = await getProfile(supabase, user)
  
  // If no profile exists, redirect to sign in
  if (!profile) {
    console.log("No profile found")
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  const currentPath = req.nextUrl.pathname
  console.log("=== Middleware Check ===", {
    currentPath,
    profile_type: profile.user_type,
    has_org_name: !!profile.organization_name,
    onboarding_completed: profile.onboarding_completed,
    organization_name: profile.organization_name
  })

  // Skip middleware for non-onboarding paths if onboarding is completed
  if (profile.onboarding_completed && !currentPath.includes('/onboarding')) {
    console.log("Onboarding completed and not on onboarding path - proceeding")
    return res
  }

  if (!profile.onboarding_completed) {
    if (profile.user_type === 'creator') {
      const creator = await getCreator(supabase, user)
      
      // If TikTok not connected and not already on TikTok auth page, redirect to TikTok auth
      if (!creator?.tiktok_connected && !req.nextUrl.pathname.includes('/onboarding/creator/tiktok')) {
        return NextResponse.redirect(new URL('/onboarding/creator/tiktok', req.url))
      }
      
      // If TikTok is connected but no organization name, go to profile setup
      if (creator?.tiktok_connected && !profile.organization_name) {
        return NextResponse.redirect(new URL('/onboarding/creator/profile', req.url))
      }
    } 
    else if (profile.user_type === 'brand') {
      // Get brand data first
      const { data: brand } = await supabase
        .from("brands")
        .select("stripe_customer_id, payment_verified")
        .eq("user_id", user.id)
        .single()

      console.log("=== Brand Check ===", {
        currentPath,
        has_stripe: !!brand?.stripe_customer_id,
        payment_verified: brand?.payment_verified,
        stripe_customer_id: brand?.stripe_customer_id
      })

      // Allow access to current step
      if (
        (currentPath === '/onboarding/brand/profile' && !profile.organization_name) ||
        (currentPath === '/onboarding/brand/payments' && profile.organization_name && (!brand?.stripe_customer_id || !brand?.payment_verified))
      ) {
        console.log("Allowing access to current step:", currentPath)
        return res
      }

      // Determine the correct step
      if (!profile.organization_name) {
        console.log("No org name - redirecting to profile")
        return NextResponse.redirect(new URL('/onboarding/brand/profile', req.url))
      }

      if (!brand?.stripe_customer_id || !brand?.payment_verified) {
        console.log("No payment verification - redirecting to payments")
        return NextResponse.redirect(new URL('/onboarding/brand/payments', req.url))
      }

      // If all steps completed, mark onboarding as complete
      if (profile.organization_name && brand?.stripe_customer_id && brand?.payment_verified) {
        console.log("All steps completed - marking onboarding as complete")
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  console.log("Proceeding with request")
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/payouts/:path*',
    '/campaigns/:path*',
    '/api/payouts/:path*',
    '/onboarding/brand/profile',
    '/onboarding/brand/payments',
    '/onboarding/creator/:path*'
  ]
} 