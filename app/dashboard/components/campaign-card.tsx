import { CampaignWithSubmissions } from "@/types/campaigns"
import { cn } from "@/lib/utils"

export function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: CampaignWithSubmissions
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-zinc-50 rounded-lg group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-zinc-900 truncate">
            {campaign.title}
          </h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              campaign.status === "active"
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            )}
          >
            {(campaign.status || "Draft").charAt(0).toUpperCase() +
              (campaign.status || "Draft").slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {campaign.submissions.length > 0 && (
            <span className="text-sm text-zinc-600">
              {campaign.submissions.length}{" "}
              {campaign.submissions.length === 1 ? "submission" : "submissions"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            ${Number(campaign.budget_pool).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">Budget Pool</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">
            ${Number(campaign.rpm).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">RPM</p>
        </div>
      </div>
    </div>
  )
}
