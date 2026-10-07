import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function HoiThoaiLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/hoi-thoai">{children}</FeatureLockedGuard>
}
