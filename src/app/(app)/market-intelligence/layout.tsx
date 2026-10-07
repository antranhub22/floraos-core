import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function MarketIntelligenceLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/market-intelligence">{children}</FeatureLockedGuard>
}
