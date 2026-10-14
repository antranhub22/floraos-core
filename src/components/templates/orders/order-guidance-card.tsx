"use client"

import React from "react"
import { Package } from "lucide-react"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import { useI18n } from "@/lib/i18n"

export function OrderGuidanceCard() {
  const { dict } = useI18n()
  return (
    <FeatureGuidanceCard
      tag={dict.orders.guidance.badge}
      icon={Package}
      title={dict.orders.guidance.title}
      description={dict.orders.guidance.description}
      tips={[
        `✂️ ${dict.orders.guidance.tips.recipe}`,
        `📸 ${dict.orders.guidance.tips.qcPhoto}`,
        `🛵 ${dict.orders.guidance.tips.deliverySlip}`,
      ]}
    />
  )
}
