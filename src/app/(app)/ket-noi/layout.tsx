import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function KetNoiLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/ket-noi">{children}</FeatureLockedGuard>
}
