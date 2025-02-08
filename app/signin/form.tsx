"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { signIn } from "../actions/auth"
import Image from "next/image"

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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading] = useState(false)

  const [state, action] = useActionState(signInAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Welcome back!</h1>
          <p className="text-base text-[#475467]">Please enter your details</p>
        </div>

        <form action={action} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[#1D2939]"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black placeholder:text-[#475467]"
                placeholder="anna@gmail.com"
                required
              />
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#1D2939]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black pr-10 placeholder:text-[#475467]"
                  placeholder="••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475467] hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#1D2939] hover:text-black"
            >
              Forgot password?
            </Link>
          </div>

          {state?.message && (
            <p className="text-red-500 text-sm">{state.message}</p>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-black hover:bg-black/90 text-white"
            >
              {loading ? "Signing in..." : "Log In"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-[#CBD5E1] hover:border-[#5865F2] text-[#1D2939] hover:text-[#5865F2] hover:bg-transparent"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
                className="mr-2"
              />
              Log in with Google
            </Button>
          </div>

          <p className="text-sm text-[#475467] text-center">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-black hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
