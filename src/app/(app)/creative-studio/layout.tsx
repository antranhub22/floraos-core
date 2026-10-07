import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function CreativeStudioLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/creative-studio">{children}</FeatureLockedGuard>
}
