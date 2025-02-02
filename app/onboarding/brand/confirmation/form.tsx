"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export function ConfirmationForm() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4 relative overflow-hidden">
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#313338]/30" />

      <Card className="w-full max-w-md border-none bg-[#2B2D31]/95 text-white backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Payment Method Verified
          </CardTitle>
          <CardDescription className="text-zinc-400 text-center">
            Your brand is now verified and ready to work with creators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-sm text-zinc-400 space-y-4">
              <p>
                Creators will now see your brand as verified, which helps build
                trust and attract quality submissions. You can:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Create campaigns and receive submissions</li>
                <li>Automatically pay creators when you approve their work</li>
                <li>Build long-term relationships with creators</li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              className="inline-block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-2 px-4 rounded transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
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
