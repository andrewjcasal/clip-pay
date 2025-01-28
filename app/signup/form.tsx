"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("creator")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            user_type: userType,
          },
        },
      })

      if (error) {
        throw error
      }

      if (user) {
        if (userType === "brand") {
          await supabase.from("brands").insert({
            user_id: user.id,
          })
        }

        // For admin users, we'll set onboarding_completed to true
        if (userType === "admin") {
          await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id)
        }

        setIsSubmitted(true)
      }
    } catch (error) {
      console.error("Error signing up:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#313338] p-4 relative overflow-hidden">
      {/* Animated Background Image */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1603481546579-65d935ba9cdd?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2000")`,
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
                We've sent you an email to {email} with a link to confirm your
                account.
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
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
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
