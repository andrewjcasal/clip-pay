import { useState } from "react"
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
import { NewCampaign, FormErrors } from "@/types/campaigns"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  brandId: string
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onSuccess,
  brandId,
}: CreateCampaignModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [formData, setFormData] = useState<NewCampaign>({
    title: "",
    budget_pool: "",
    rpm: "",
    guidelines: "",
    video_outline: "",
    referral_bonus_rate: "0",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = () => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!formData.title.trim()) {
      newErrors.title = true
      isValid = false
    }
    if (!formData.budget_pool.trim() || isNaN(Number(formData.budget_pool))) {
      newErrors.budget_pool = true
      isValid = false
    }
    if (!formData.rpm.trim() || isNaN(Number(formData.rpm))) {
      newErrors.rpm = true
      isValid = false
    }
    if (!formData.guidelines.trim()) {
      newErrors.guidelines = true
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleCreateCampaign = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      const result = await createCampaign({
        ...formData,
        brandId,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Reset form
      setFormData({
        title: "",
        budget_pool: "",
        rpm: "",
        guidelines: "",
        video_outline: "",
        referral_bonus_rate: "0",
      })
      setErrors({})

      // Show success dialog
      onOpenChange(false)
      setShowSuccessDialog(true)
      onSuccess()
    } catch (error) {
      console.error("Error creating campaign:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Create Campaign Dialog */}
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
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
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
                    value={formData.budget_pool}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setFormData({
                        ...formData,
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
                    value={formData.rpm}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed)) {
                        setFormData({
                          ...formData,
                          rpm: parsed.toFixed(2),
                        })
                      } else {
                        setFormData({
                          ...formData,
                          rpm: "",
                        })
                      }
                      setErrors({ ...errors, rpm: false })
                    }}
                    className="pl-7 bg-white border-zinc-200 text-zinc-900 h-10 focus:ring-[#5865F2]/20 focus:border-[#5865F2]"
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
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
                    value={formData.referral_bonus_rate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "")
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed)) {
                        const capped = Math.min(parsed, 1)
                        setFormData({
                          ...formData,
                          referral_bonus_rate: capped.toFixed(2),
                        })
                      } else {
                        setFormData({
                          ...formData,
                          referral_bonus_rate: "",
                        })
                      }
                    }}
                    className="pl-7 h-11 border-[#CBD5E1] focus:border-[#5865F2] focus:shadow-[0_0_0_1px_rgba(88,101,242,0.2)] focus:ring-0 bg-white text-black"
                    placeholder="0.00"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
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
                value={formData.guidelines}
                onChange={(e) => {
                  setFormData({
                    ...formData,
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
                value={formData.video_outline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
                className="bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 dark:text-white text-white border-zinc-200 hover:bg-zinc-50 dark:border-zinc-200"
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
