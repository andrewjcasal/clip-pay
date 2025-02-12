"use client"

import Image from "next/image"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { ResetPasswordForm } from "./form"
import { redirect } from "next/navigation"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; error_description?: string }
}) {
  const supabase = await createServerSupabaseClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to sign in
  if (!session) {
    redirect("/signin?error=Invalid or expired reset link")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={200}
              height={200}
              priority
            />
          </Link>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[#1D2939]">
            Reset Password
          </h1>
          <p className="text-[#475467]">Enter your new password below.</p>
        </div>

        {searchParams.error ? (
          <div className="text-center">
            <p className="text-sm text-red-500">
              {searchParams.error_description ||
                "An error occurred during password reset"}
            </p>
            <Link
              href="/forgot-password"
              className="text-sm text-[#5865F2] hover:text-[#4752C4] mt-2 block"
            >
              Try resetting your password again
            </Link>
          </div>
        ) : (
          <ResetPasswordForm />
        )}

        <div className="text-center">
          <Link
            href="/signin"
            className="text-sm text-[#1D2939] hover:text-black"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
