"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"

export function ConfirmationForm() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={200} height={200} priority />
        </div>

        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-black">
              Payment method verified
            </h1>
            <p className="text-base text-[#475467]">
              Your brand is now verified and ready to start working with
              creators
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-sm font-medium text-zinc-900">
                Verified Payment Status
              </p>
            </div>
            <p className="text-sm text-zinc-600 pl-4">
              Your brand will be shown as verified to creators, increasing trust
              and engagement
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-sm font-medium text-zinc-900">
                Ready for Campaigns
              </p>
            </div>
            <p className="text-sm text-zinc-600 pl-4">
              You can now create campaigns and process payments for approved
              submissions
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
