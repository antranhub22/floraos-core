"use client"

import type { ComponentType } from "react"
import { Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { COMING_SOON_LABEL, isRouteLocked } from "@/lib/feature-lock"
import type { NavEntry } from "./nav-model"

interface DesktopNavItemProps {
  item: NavEntry
  active: boolean
  isSubItem?: boolean
  iconComponent?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | undefined
  onClick: () => void
}

export function DesktopNavItem({
  item,
  active,
  isSubItem = false,
  iconComponent,
  onClick,
}: DesktopNavItemProps) {
  const Icon = iconComponent || Tag

  if (item.status === "COMING_SOON" || isRouteLocked(item.href)) {
    return (
      <div
        aria-disabled="true"
        title={COMING_SOON_LABEL}
        className={cn(
          "flex w-full cursor-not-allowed items-center justify-between rounded-lg px-2.5 font-medium text-text-muted opacity-60",
          isSubItem ? "h-8 text-body-sm" : "h-9 text-meta"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon size={isSubItem ? 15 : 16} strokeWidth={1.9} />
          <span className="truncate">{item.label}</span>
        </div>
        <span className="shrink-0 rounded-full bg-surface-alt px-1.5 py-0.5 text-caption font-extrabold uppercase tracking-wide">
          {COMING_SOON_LABEL}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-lg px-2.5 font-medium transition-colors text-left",
        isSubItem ? "h-8 text-body-sm" : "h-9 text-meta",
        active
          ? "bg-surface-alt font-bold text-primary"
          : "text-text-muted hover:bg-surface-alt hover:text-text"
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="flex items-center gap-2.5 truncate">
        <Icon
          size={isSubItem ? 15 : 16}
          strokeWidth={active ? 2.2 : 1.9}
          className={active ? "text-primary" : "text-text-muted group-hover:text-text"}
        />
        <span className="truncate">{item.label}</span>
      </div>
    </button>
  )
}
