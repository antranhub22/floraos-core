import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  title: string
  reason?: string | undefined
  action?: {
    label: string
    onClick?: () => void
    href?: string
  } | undefined
  icon?: LucideIcon | undefined
  className?: string | undefined
}

export function EmptyState({ title, reason, action, icon: Icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-6 text-center", className)}>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-text-muted">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      <div className="text-body font-semibold text-text">{title}</div>
      {reason && <p className="text-xs text-text-muted max-w-sm">{reason}</p>}
      {action && (
        <div className="mt-1">
          {action.href ? (
            <Link
              href={action.href as never}
              className="inline-flex items-center justify-center h-11 px-4 text-sm font-semibold rounded-xl border border-border bg-transparent text-text hover:bg-surface-alt transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
