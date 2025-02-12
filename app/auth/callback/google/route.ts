import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Redirect to the generic callback handler with the same parameters
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const callbackUrl = new URL("/auth/callback", baseUrl)

  // Copy all search params to the new URL
  requestUrl.searchParams.forEach((value, key) => {
    callbackUrl.searchParams.append(key, value)
  })

  return NextResponse.redirect(callbackUrl.toString())
}
