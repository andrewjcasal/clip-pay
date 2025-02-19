import { Card } from "@/components/ui/card"
import { DollarSign, FileText, RotateCw, Users } from "lucide-react"
import { CampaignWithSubmissions } from "@/types/campaigns"

export function Metrics({
  campaigns,
}: {
  campaigns: CampaignWithSubmissions[]
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-zinc-600" />
            </div>
            <span className="text-sm font-medium text-zinc-600">
              Total Budget
            </span>
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
          $
          {campaigns
            .reduce(
              (total, campaign) => total + Number(campaign.budget_pool || 0),
              0
            )
            .toLocaleString()}
        </p>
      </Card>

      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-zinc-600" />
            </div>
            <span className="text-sm font-medium text-zinc-600">
              Active Campaigns
            </span>
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
          {campaigns.filter((c) => c.status === "active").length}
        </p>
      </Card>

      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-zinc-600" />
            </div>
            <span className="text-sm font-medium text-zinc-600">
              Total Submissions
            </span>
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
          {campaigns.reduce(
            (total, campaign) => total + (campaign.submissions?.length || 0),
            0
          )}
        </p>
      </Card>

      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-zinc-100 p-2 rounded-lg">
              <RotateCw className="w-5 h-5 text-zinc-600" />
            </div>
            <span className="text-sm font-medium text-zinc-600">
              Average CPM
            </span>
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-semibold text-zinc-900">
          $
          {(
            campaigns.reduce(
              (total, campaign) => total + Number(campaign.rpm || 0),
              0
            ) / (campaigns.length || 1)
          ).toFixed(2)}
        </p>
      </Card>
    </div>
  )
}
