"use client"

import { useState, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn, signInWithGoogle } from "../actions/auth"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

type State = {
  message: string
} | null

const signInAction = async (prevState: State, formData: FormData) => {
  try {
    await signIn(formData)
    return null
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export default function SignInForm() {
  const formId = useId()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)

    try {
      const result = await signInAction(null, formData)
      if (result?.message) {
        setError(result.message)
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-[#1D2939]">
            Welcome back
          </h1>
          <p className="text-[#475467]">Sign in to your account to continue</p>
        </div>

        <form
          key={formId}
          onSubmit={handleSubmit}
          className="space-y-4"
          suppressHydrationWarning
        >
          <div className="space-y-2">
            <Label
              htmlFor={`email-${formId}`}
              className="text-sm font-medium text-[#1D2939]"
            >
              Email
            </Label>
            <Input
              id={`email-${formId}`}
              name="email"
              type="email"
              autoComplete="email"
              className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 text-[#1D2939]"
              placeholder="anna@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor={`password-${formId}`}
                className="text-sm font-medium text-[#1D2939]"
              >
                Password
              </Label>
            </div>
            <div className="relative">
              <Input
                id={`password-${formId}`}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#5865F2] hover:text-[#4752C4]"
            >
              Forgot password?
            </Link>
          </div>

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
                setIsLoading(true)
                setError(null)
                const url = await signInWithGoogle("creator")
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
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
          >
            <Image
              src="/google.png"
              alt="Google"
              width={20}
              height={20}
              className="mr-2"
            />
            {isLoading ? "Connecting..." : "Sign in with Google"}
          </Button>

          <p className="text-center text-sm text-zinc-600">
            Don't have an account?{" "}
            <Link
              href="/signup/creator"
              className="text-[#5865F2] hover:text-[#4752C4]"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
