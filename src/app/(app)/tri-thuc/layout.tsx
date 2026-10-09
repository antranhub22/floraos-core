import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function TriThucLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/tri-thuc">{children}</FeatureLockedGuard>
}
