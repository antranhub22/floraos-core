import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", {
  variants: {
    tone: {
      success: "bg-success-bg text-primary",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
      accent: "bg-[#FBEAEC] text-[#B45566]",
      neutral: "bg-surface-alt text-text",
    },
  },
  defaultVariants: { tone: "neutral" },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
