"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card"
import Link from "next/link"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.refresh()
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
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
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to your creator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignin} className="space-y-4">
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
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
            >
              Sign In
            </Button>
            <p className="text-sm text-zinc-400 text-center">
              Need an account?{" "}
              <Link href="/signup" className="text-[#5865F2] hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
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
