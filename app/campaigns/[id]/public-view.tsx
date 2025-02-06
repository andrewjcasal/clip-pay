"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Campaign } from "@/types/database"

interface PublicCampaignViewProps {
  campaign: Campaign
}

export function PublicCampaignView({ campaign }: PublicCampaignViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
          <div className="space-y-6">
            {/* Campaign details */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                    {campaign.title}
                  </h1>
                  <p className="text-zinc-600">
                    by{" "}
                    {campaign.brand?.profiles?.organization_name ||
                      "Unknown Brand"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">Budget Pool</p>
                    <p className="text-lg font-semibold text-zinc-900">
                      ${campaign.budget_pool}
                    </p>
                  </div>
                  <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">RPM</p>
                    <p className="text-lg font-semibold text-zinc-900">
                      ${campaign.rpm}
                    </p>
                  </div>
                  <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 p-3 rounded-lg">
                    <p className="text-sm text-[#5865F2]">Referral Bonus</p>
                    <p className="text-lg font-semibold text-zinc-900">
                      {campaign.referral_bonus_rate}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-zinc-900">
                  Guidelines
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                    {campaign.guidelines || "No guidelines provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="border-t border-zinc-200 pt-6 mt-8">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Ready to participate in this campaign?
                </h2>
                <p className="text-zinc-600">
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
                      className="bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 px-8 py-6 text-lg font-medium"
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
