import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function VideoLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/video">{children}</FeatureLockedGuard>
}
