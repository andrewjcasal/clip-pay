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
  
  
  
  
  const currentPath = req.nextUrl.pathname

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    
    const response = NextResponse.redirect(new URL('/signin', req.url))
    
    return response
  }
  

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, organization_name, onboarding_completed")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    const response = NextResponse.redirect(new URL('/signin', req.url))
    return response
  }

  // Get brand data if user is a brand
  let brand
  if (profile.user_type === 'brand') {
    const { data: brandData } = await supabase
      .from("brands")
      .select("stripe_customer_id, payment_verified")
      .eq("user_id", user.id)
      .single()
    brand = brandData
    
  }

  // Check if this is a payment-related route that requires payment verification
  const paymentRoutes = ['/payouts', '/campaigns/new', '/api/payouts']
  if (profile.user_type === 'brand' && paymentRoutes.some(route => currentPath.startsWith(route))) {
    if (!brand?.payment_verified) {
      
      const response = NextResponse.redirect(new URL('/onboarding/brand/payments', req.url))
      
      return response
    }
  }

  // If onboarding is completed, allow access to all routes
  if (profile.onboarding_completed) {
    
    const response = NextResponse.next()
    
    return response
  }

  
  if (profile.user_type === 'creator') {
    

    // Special case: Always allow access to TikTok auth page and its API routes
    if (currentPath.startsWith('/onboarding/creator/tiktok')) {
      
      const response = NextResponse.next()
      
      return response
    }

    const creator = await getCreator(supabase, user)
    
    // If no creator record or TikTok not connected, redirect to TikTok auth
    if (!creator || !creator.tiktok_connected) {
      // Create creator record if it doesn't exist
      if (!creator) {
        
        const { error } = await supabase
          .from("creators")
          .insert({ user_id: user.id, tiktok_connected: false })
        if (error) {
          console.error("Error creating creator record:", error)
        }
      }
      
      const response = NextResponse.redirect(new URL('/onboarding/creator/tiktok', req.url))
      
      return response
    }
    
    // If TikTok is connected but no organization name, handle profile setup
    if (!profile.organization_name) {
      // Allow access if already on profile setup page
      if (currentPath === '/onboarding/creator/profile') {
        
        const response = NextResponse.next()
        
        return response
      }
      
      
      const response = NextResponse.redirect(new URL('/onboarding/creator/profile', req.url))
      
      return response
    }

    // If we get here, all onboarding steps are complete
    
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id)
    const response = NextResponse.next()
    
    return response
  } 
  else if (profile.user_type === 'brand') {
    
    // Allow access to current step
    if (
      (currentPath === '/onboarding/brand/profile' && !profile.organization_name) ||
      (currentPath === '/onboarding/brand/payments' && profile.organization_name && (!brand?.stripe_customer_id || !brand?.payment_verified))
    ) {
      
      return NextResponse.next()
    }

    // Determine the correct step
    if (!profile.organization_name) {
      
      return NextResponse.redirect(new URL('/onboarding/brand/profile', req.url))
    }

    if (!brand?.stripe_customer_id || !brand?.payment_verified) {
      
      return NextResponse.redirect(new URL('/onboarding/brand/payments', req.url))
    }

    // If all steps completed, mark onboarding as complete
    
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id)
    return NextResponse.next()
  }

  
  const finalResponse = NextResponse.next()
  
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