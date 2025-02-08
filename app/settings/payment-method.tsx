"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
}

export function PaymentMethodDisplay() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        const response = await fetch("/api/payment-methods", {
          credentials: "include",
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch payment method")
        }

        setPaymentMethod(data.paymentMethod)
      } catch (err) {
        console.error("Error fetching payment method:", err)
        setError(
          err instanceof Error ? err.message : "Failed to fetch payment method"
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentMethod()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-sm text-red-500">{error}</div>
      </Card>
    )
  }

  if (!paymentMethod) {
    return (
      <Card className="p-4">
        <div className="text-sm text-gray-500">No payment method set up</div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium capitalize">
              {paymentMethod.brand}
            </span>
            <span className="text-sm text-gray-500">
              •••• {paymentMethod.last4}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
          </div>
        </div>
      </div>
    </Card>
  )
}
