"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FormData {
  title: string
  budget_pool: string
  rpm: string
  guidelines: string
  referral_bonus_rate: string
}

export function NewCampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
}) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    budget_pool: "",
    rpm: "",
    guidelines: "",
    referral_bonus_rate: "10", // Default to 10%
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: "",
      budget_pool: "",
      rpm: "",
      guidelines: "",
      referral_bonus_rate: "10",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2B2D31] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">
                Campaign Title
              </Label>
              <Input
                id="title"
                placeholder="Enter campaign title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-0 bg-[#1E1F22] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_pool" className="text-zinc-300">
                  Budget Pool
                </Label>
                <Input
                  id="budget_pool"
                  type="number"
                  placeholder="Enter budget pool"
                  value={formData.budget_pool}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget_pool: e.target.value,
                    })
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpm" className="text-zinc-300">
                  RPM
                </Label>
                <Input
                  id="rpm"
                  type="number"
                  placeholder="Enter RPM"
                  value={formData.rpm}
                  onChange={(e) =>
                    setFormData({ ...formData, rpm: e.target.value })
                  }
                  className="border-0 bg-[#1E1F22] text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral_bonus_rate" className="text-zinc-300">
                Referral Bonus Rate (%)
              </Label>
              <div className="relative">
                <Input
                  id="referral_bonus_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter referral bonus rate"
                  value={formData.referral_bonus_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referral_bonus_rate: e.target.value,
                    })
                  }
                  className="border-0 bg-[#1E1F22] text-white pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  %
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Percentage of RPM that referrers earn as bonus when their
                referred creators submit content
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guidelines" className="text-zinc-300">
                Guidelines
              </Label>
              <Textarea
                id="guidelines"
                placeholder="Enter campaign guidelines"
                value={formData.guidelines}
                onChange={(e) =>
                  setFormData({ ...formData, guidelines: e.target.value })
                }
                className="border-0 bg-[#1E1F22] text-white min-h-[150px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#5865F2] hover:bg-[#4752C4]">
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
