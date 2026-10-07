import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function KhoTemplatesLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/kho-templates">{children}</FeatureLockedGuard>
}
