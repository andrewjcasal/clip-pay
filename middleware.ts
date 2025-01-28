import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Session error:', sessionError)
    return res
  }

  // Auth condition - change "dashboard" to whatever path you want to protect
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      // Redirect to login if there is no session
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  }

  // Auth condition - if we have a session but we're on a public route
  if (session && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
    // Redirect to dashboard if we're logged in
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/signin',
    '/signup',
    '/onboarding/:path*'
  ],
} 