import type { ReactNode } from "react"
import { FeatureLockedGuard } from "@/components/layout/feature-locked-guard"

export default function NoiDungLayout({ children }: { children: ReactNode }) {
  return <FeatureLockedGuard route="/noi-dung">{children}</FeatureLockedGuard>
}
