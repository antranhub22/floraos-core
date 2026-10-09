import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function BoMayLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/bo-may">{children}</FeatureLockedGuard>
}
