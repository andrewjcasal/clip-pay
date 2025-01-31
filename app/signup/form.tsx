"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "../actions/auth"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card"
import Link from "next/link"
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
  const [userType, setUserType] = useState("creator")
  const [isLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [state, action] = useActionState(signUpAction, null)

  useEffect(() => {
    if (state?.success) {
      setIsSubmitted(true)
    }
  }, [state])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#313338] p-4 relative overflow-hidden">
      {/* Animated Background Image */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1603481546579-65d935ba9cdd?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2000")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "rotate(30deg) scale(1.5)",
          transformOrigin: "center",
          animation: "slideBackground 60s linear infinite",
        }}
      />

      {/* Dark overlay - reduced opacity */}
      <div className="absolute inset-0 bg-[#313338]/30" />

      <Card className="w-full max-w-[480px] border-none bg-[#2B2D31]/95 text-white backdrop-blur-sm relative z-10">
        {isSubmitted ? (
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-zinc-400">
                We&apos;ve sent you an email to {email} with a link to confirm
                your account.
              </p>
            </div>
            <Link
              href="/signin"
              className="text-[#5865F2] hover:underline text-sm"
            >
              Return to sign in
            </Link>
          </CardContent>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create an account
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Join the creator marketplace and start earning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={action} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-0 bg-[#1E1F22] text-white focus:ring-2 focus:ring-[#5865F2]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 bg-[#1E1F22] text-white focus:ring-2 focus:ring-[#5865F2]"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userType" className="text-zinc-300">
                    Sign up as
                  </Label>
                  <Select
                    name="userType"
                    value={userType}
                    onValueChange={(value) => setUserType(value)}
                  >
                    <SelectTrigger className="bg-[#1E1F22] border-0">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2B2D31] border-zinc-800">
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {state?.message && (
                  <p className="text-red-500 text-sm">{state.message}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
                <p className="text-sm text-zinc-400 text-center">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="text-[#5865F2] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </>
        )}
      </Card>

      <style jsx global>{`
        @keyframes slideBackground {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 -200%;
          }
        }
      `}</style>
    </div>
  )
}
