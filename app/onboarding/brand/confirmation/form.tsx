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

export function ConfirmationForm() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <Card className="w-full max-w-md border-none bg-[#2B2D31] text-white">
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

            <Button
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
