"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Campaign } from "@/types/database"

interface PublicCampaignViewProps {
  campaign: Campaign
}

export function PublicCampaignView({ campaign }: PublicCampaignViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1e] via-[#2B2D31] to-[#1a1b1e]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-8">
          <div className="space-y-6">
            {/* Campaign details */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {campaign.title}
                  </h1>
                  <p className="text-zinc-400">
                    by{" "}
                    {campaign.brand?.profiles?.organization_name ||
                      "Unknown Brand"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-[#5865F2]/10 backdrop-blur-sm border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">Budget Pool</p>
                    <p className="text-lg font-semibold text-white">
                      ${campaign.budget_pool}
                    </p>
                  </div>
                  <div className="bg-[#5865F2]/10 backdrop-blur-sm border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">RPM</p>
                    <p className="text-lg font-semibold text-white">
                      ${campaign.rpm}
                    </p>
                  </div>
                  <div className="bg-[#5865F2]/10 backdrop-blur-sm border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">Referral Bonus</p>
                    <p className="text-lg font-semibold text-white">
                      {campaign.referral_bonus_rate}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Guidelines</h3>
                <div className="bg-black/20 backdrop-blur-sm border border-zinc-800/50 p-4 rounded-lg">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {campaign.guidelines || "No guidelines provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="border-t border-zinc-800 pt-6 mt-8">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-white">
                  Ready to participate in this campaign?
                </h2>
                <p className="text-zinc-400">
                  Sign up as a creator to submit your content and start earning.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href={`/signup?campaign=${campaign.id}`}>
                    <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg">
                      Sign up to participate
                    </Button>
                  </Link>
                  <Link href="/signin">
                    <Button
                      variant="outline"
                      className="bg-white/5 text-white border-white/10 px-8 py-6 text-lg font-medium"
                    >
                      Already have an account? Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
