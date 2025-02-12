import Image from "next/image"
import Link from "next/link"
import { ForgotPasswordForm } from "./form"

export default function ForgotPasswordPage() {
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
            Forgot Password
          </h1>
          <p className="text-[#475467]">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <ForgotPasswordForm />

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
