import { Dispatch, SetStateAction, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCampaign } from "../actions"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  NewCampaign,
  FormErrors,
  CampaignWithSubmissions,
} from "@/types/campaigns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  setCampaigns: Dispatch<SetStateAction<CampaignWithSubmissions[]>>
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  brandId,
  setCampaigns,
}: CreateCampaignModalProps) {
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    title: "",
    budget_pool: "",
    rpm: "",
    referral_bonus_rate: "",
    guidelines: "",
    video_outline: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!newCampaign.title.trim()) {
      newErrors.title = true
    }
    if (!newCampaign.budget_pool || Number(newCampaign.budget_pool) <= 0) {
      newErrors.budget_pool = true
    }
    if (!newCampaign.rpm || Number(newCampaign.rpm) <= 0) {
      newErrors.rpm = true
    }
    if (!newCampaign.guidelines.trim()) {
      newErrors.guidelines = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateCampaign = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const newCampaignData = await createCampaign({
        ...newCampaign,
        brandId,
      })

      // Update local state with the new campaign
      setCampaigns((prevCampaigns) => [
        {
          id: newCampaignData.campaign.id,
          title: newCampaignData.campaign.title,
          budget_pool: String(newCampaignData.campaign.budget_pool),
          rpm: String(newCampaignData.campaign.rpm),
          guidelines: newCampaignData.campaign.guidelines,
          video_outline: newCampaignData.campaign.video_outline,
          status: newCampaignData.campaign.status,
          brand: {
            name: "Loading...", // This will be updated on the next data fetch
            payment_verified: false,
          },
          submission: null,
          submissions: [],
          activeSubmissionsCount: 0,
        } as CampaignWithSubmissions,
        ...prevCampaigns,
      ])

      onOpenChange(false)
      setNewCampaign({
        title: "",
        budget_pool: "",
        rpm: "",
        guidelines: "",
        video_outline: "",
        referral_bonus_rate: "0.10",
      })
      setShowSuccessDialog(true)

      // Force a server refresh to ensure data consistency
      router.refresh()
    } catch (error) {
      console.error("Failed to create campaign:", error)
      toast.error("Failed to create campaign")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-900 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Create New Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-zinc-900"
                >
                  Campaign Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={newCampaign.title}
                  onChange={(e) => {
                    setNewCampaign({ ...newCampaign, title: e.target.value })
                    setErrors({ ...errors, title: false })
                  }}
                  className={cn(
                    "bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                    errors.title && "ring-2 ring-red-500 border-red-500"
                  )}
                  placeholder="Enter campaign title"
                />
                {errors.title && (
                  <p className="text-xs text-red-500">Title is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="budget_pool"
                  className="text-sm font-medium text-zinc-900"
                >
                  Budget Pool <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="budget_pool"
                    value={newCampaign.budget_pool}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setNewCampaign({
                        ...newCampaign,
                        budget_pool: value || "",
                      })
                      setErrors({ ...errors, budget_pool: false })
                    }}
                    className="pl-7 bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                    placeholder="0"
                    type="text"
                    min="0"
                  />
                </div>
                {errors.budget_pool && (
                  <p className="text-xs text-red-500">
                    Valid budget amount is required
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="rpm"
                  className="text-sm font-medium text-zinc-900"
                >
                  CPM (Cost per 1000 views){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="rpm"
                    value={newCampaign.rpm}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      // Only update if it's empty or a valid decimal number
                      if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                        setNewCampaign({
                          ...newCampaign,
                          rpm: value,
                        })
                      }
                      setErrors({ ...errors, rpm: false })
                    }}
                    className="pl-7 bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
                {errors.rpm && (
                  <p className="text-xs text-red-500">Valid CPM is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="referral_bonus_rate"
                  className="text-sm font-medium text-zinc-900"
                >
                  Referral Bonus Rate ($ per 1000 views)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>
                  <Input
                    id="referral_bonus_rate"
                    value={newCampaign.referral_bonus_rate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      // Only update if it's empty or a valid decimal number with max 2 decimal places
                      // Also ensure the value doesn't exceed 1.00
                      if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                        setNewCampaign({
                          ...newCampaign,
                          referral_bonus_rate: value,
                        })
                      }
                    }}
                    className="pl-7 h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black"
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="guidelines"
                className="text-sm font-medium text-zinc-900"
              >
                Guidelines <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="guidelines"
                value={newCampaign.guidelines}
                onChange={(e) => {
                  setNewCampaign({
                    ...newCampaign,
                    guidelines: e.target.value,
                  })
                  setErrors({ ...errors, guidelines: false })
                }}
                className={cn(
                  "bg-white border-zinc-200 text-zinc-900 min-h-[100px] focus:ring-[#5865F2]/20 focus:border-[#5865F2]",
                  errors.guidelines && "ring-2 ring-red-500 border-red-500"
                )}
                placeholder="Enter campaign guidelines"
              />
              {errors.guidelines && (
                <p className="text-xs text-red-500">Guidelines are required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="video_outline"
                className="text-sm font-medium text-zinc-900"
              >
                Video Outline (Content Brief)
              </Label>
              <Textarea
                id="video_outline"
                value={newCampaign.video_outline}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    video_outline: e.target.value,
                  })
                }
                className="bg-white border-zinc-200 text-zinc-900 min-h-[100px] focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                placeholder="Enter video outline"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="dark:bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={isLoading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white dark:bg-[#5865F2] dark:hover:bg-[#4752C4] dark:text-white"
              >
                {isLoading ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Campaign Created
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#ECFDF3] text-[#027A48] p-4 rounded-lg space-y-2">
              <p className="font-medium">Campaign successfully created!</p>
              <p className="text-sm">
                Your campaign is now live and available for creators to view and
                submit videos.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
