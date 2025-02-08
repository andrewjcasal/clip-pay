"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "../actions/auth"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type State = {
  success?: boolean
  message?: string
} | null

const signUpAction = async (_: State, formData: FormData) => {
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

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState("creator")
  const [isLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [state, action] = useActionState(signUpAction, null)

  useEffect(() => {
    if (state?.success) {
      setIsSubmitted(true)
    }
  }, [state])

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-[400px] text-center space-y-4">
          <div className="flex justify-center mb-8">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} priority />
          </div>
          <h2 className="text-2xl font-semibold text-[#101828]">
            Check your email
          </h2>
          <p className="text-[#667085]">
            We've sent you an email to {email} with a link to confirm your
            account.
          </p>
          <Link
            href="/signin"
            className="text-[#101828] hover:underline font-medium block mt-4"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">
            Create an account
          </h1>
          <p className="text-base text-[#475467]">
            Join the creator marketplace and start earning
          </p>
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

            <div className="space-y-2.5">
              <Label
                htmlFor="userType"
                className="text-sm font-medium text-[#1D2939]"
              >
                Sign up as
              </Label>
              <Select
                name="userType"
                value={userType}
                onValueChange={(value) => setUserType(value)}
              >
                <SelectTrigger className="h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#CBD5E1] shadow-lg">
                  <SelectItem
                    value="creator"
                    className="text-[#1D2939] hover:bg-zinc-50 focus:bg-zinc-50 cursor-pointer"
                  >
                    Creator
                  </SelectItem>
                  <SelectItem
                    value="brand"
                    className="text-[#1D2939] hover:bg-zinc-50 focus:bg-zinc-50 cursor-pointer"
                  >
                    Brand
                  </SelectItem>
                  <SelectItem
                    value="admin"
                    className="text-[#1D2939] hover:bg-zinc-50 focus:bg-zinc-50 cursor-pointer"
                  >
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {state?.message && (
            <p className="text-red-500 text-sm">{state.message}</p>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-black hover:bg-black/90 text-white"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
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
              Sign up with Google
            </Button>
          </div>

          <p className="text-sm text-[#475467] text-center">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-black hover:underline font-medium"
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
