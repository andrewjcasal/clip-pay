import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface StripeConnectBannerProps {
  totalEarnings: number
}

export function StripeConnectBanner({
  totalEarnings,
}: StripeConnectBannerProps) {
  return (
    <div className="bg-[#5865F2] text-white p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">Connect Stripe to Get Paid</h3>
          <p className="text-sm text-white/90">
            You have earned ${totalEarnings.toFixed(2)} from your videos.
            Connect your Stripe account to receive payments.
          </p>
        </div>
        <Link href="/settings" className="shrink-0">
          <Button
            variant="secondary"
            className="bg-white text-[#5865F2] hover:bg-white/90"
          >
            Connect Stripe <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
