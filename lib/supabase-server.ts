import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

export function createRouteSupabaseClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

export async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/signin")
  }

  return { session, supabase }
}

export async function getOptionalUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { session, supabase }
}

export async function getAuthenticatedRoute() {
  const supabase = createRouteSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  return { session, supabase }
} 
