import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function LichDangLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/lich-dang">{children}</FeatureLockedGuard>
}
