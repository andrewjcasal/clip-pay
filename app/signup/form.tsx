"use client"

import { useState, useEffect, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signUp, signInWithGoogle } from "../actions/auth"
import Image from "next/image"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"

type UserType = "creator" | "brand"

type State = {
  success?: boolean
  message?: string
} | null

const signUpAction = async (prevState: State, formData: FormData) => {
  try {
    await signUp(formData)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

// Client-side only wrapper for input fields
function InputWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return <div style={{ height: "44px" }} /> // Placeholder with same height as input
  }

  return <div className="relative">{children}</div>
}

interface SignUpFormProps {
  userType: UserType
}

export function SignUpForm({ userType }: SignUpFormProps) {
  const formId = useId()
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isGoogleSigningUp, setIsGoogleSigningUp] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningUp(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)
    formData.append("userType", userType)

    try {
      const result = await signUpAction(null, formData)
      if (result.success) {
        setEmail(formData.get("email") as string)
        setShowConfirmation(true)
      } else if (result.message) {
        setError(result.message)
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      )
    } finally {
      setIsSigningUp(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-[400px] mx-auto space-y-8">
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={200}
              height={200}
              priority
            />
          </div>

          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[#1D2939]">
                Check your email
              </h1>
              <p className="text-[#475467]">
                We've sent a confirmation link to{" "}
                <span className="font-medium">{email}</span>
              </p>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-sm font-medium text-zinc-900">Next steps</p>
            </div>
            <p className="text-sm text-zinc-600 pl-4">
              Click the link in your email to confirm your account and complete
              your profile setup
            </p>
          </div>

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] mx-auto space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[#1D2939]">
            {userType === "creator" ? "Creator Sign Up" : "Brand Sign Up"}
          </h1>
          <p className="text-[#475467]">
            {userType === "creator"
              ? "Create an account to start earning from your content"
              : "Create an account to start working with creators"}
          </p>
        </div>

        <form
          key={formId}
          onSubmit={handleSubmit}
          className="space-y-4"
          suppressHydrationWarning
        >
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-[#1D2939]"
            >
              Email
            </Label>
            <InputWrapper>
              <Input
                id="email"
                name="email"
                type="email"
                className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 text-[#1D2939]"
                placeholder="anna@gmail.com"
                required
              />
            </InputWrapper>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#1D2939]"
            >
              Password
            </Label>
            <InputWrapper>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 pr-10 text-[#1D2939]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </InputWrapper>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] dark:bg-[#5865F2] dark:hover:bg-[#4752C4] text-white dark:text-white"
            disabled={isSigningUp}
          >
            {isSigningUp ? "Creating account..." : "Create Account"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 dark:text-white border-[#CBD5E1] hover:border-[#5865F2] text-[#1D2939] hover:text-[#5865F2] hover:bg-transparent"
            onClick={async () => {
              try {
                setIsGoogleSigningUp(true)
                setError(null)
                const url = await signInWithGoogle(userType)
                if (url) {
                  window.location.assign(url)
                } else {
                  throw new Error("No authentication URL returned")
                }
              } catch (error) {
                console.error("Google sign in error:", error)
                setError(
                  error instanceof Error
                    ? error.message
                    : "Failed to sign in with Google"
                )
                setIsGoogleSigningUp(false)
              }
            }}
            disabled={isGoogleSigningUp}
          >
            <Image
              src="/google.png"
              alt="Google"
              width={20}
              height={20}
              className="mr-2"
            />
            {isGoogleSigningUp ? "Connecting..." : "Sign up with Google"}
          </Button>

          <p className="text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-[#5865F2] hover:text-[#4752C4]"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-sm text-zinc-600">
            {userType === "brand" ? "Are you a creator?" : "Are you a brand?"}{" "}
            <Link
              href={userType === "brand" ? "/signup/creator" : "/signup/brand"}
              className="text-[#5865F2] hover:text-[#4752C4]"
            >
              {userType === "brand"
                ? "Sign up as a creator"
                : "Sign up as a brand"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
