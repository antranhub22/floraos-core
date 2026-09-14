"use client"

import React, { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Loader2 } from "lucide-react"

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  badge?: string | number
  badgeTone?: "neutral" | "success" | "warning" | "danger" | "accent"
  disabled?: boolean
}

export interface TabAction {
  id: string
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  variant?: "primary" | "secondary" | "outline" | "danger" | "success"
  onClick: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  tooltip?: string
}

export interface TabOverflowAction {
  id: string
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  onClick: () => void | Promise<void>
  disabled?: boolean
  destructive?: boolean
  dividerAbove?: boolean
}

export interface TabActionHeaderProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  primaryActions?: TabAction[]
  overflowActions?: TabOverflowAction[]
  className?: string
}

export function TabActionHeader({
  tabs,
  activeTab,
  onTabChange,
  primaryActions = [],
  overflowActions = [],
  className = "",
}: TabActionHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMenuOpen])

  const getVariantStyles = (variant: TabAction["variant"] = "primary") => {
    switch (variant) {
      case "primary":
        return "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
      case "success":
        return "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
      case "secondary":
        return "bg-surface-alt text-text hover:bg-border"
      case "danger":
        return "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20"
      case "outline":
      default:
        return "border border-border bg-surface text-text hover:bg-surface-alt hover:text-primary"
    }
  }

  const getBadgeStyles = (tone: TabItem["badgeTone"] = "neutral") => {
    switch (tone) {
      case "success":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
      case "warning":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
      case "danger":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
      case "accent":
        return "bg-accent/15 text-accent border-accent/30"
      case "neutral":
      default:
        return "bg-surface-alt text-text-muted border-border"
    }
  }

  return (
    <div
      className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-1.5 bg-surface-alt/90 rounded-2xl border border-border ${className}`}
    >
      {/* Left: Standard Tab List */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-surface text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text hover:bg-surface/60"
              } ${tab.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {Icon && <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-primary" : "text-text-muted"} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border ${getBadgeStyles(
                    tab.badgeTone
                  )}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Right: Top-Right Standard Action Header */}
      {(primaryActions.length > 0 || overflowActions.length > 0) && (
        <div className="flex items-center gap-2 justify-end flex-shrink-0 ml-auto pr-1">
          {/* Primary 1-Click Action Buttons */}
          {primaryActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                title={action.tooltip || action.label}
                className={`flex items-center gap-1.5 px-3.5 h-8 sm:h-8.5 rounded-xl text-xs font-bold transition-all ${getVariantStyles(
                  action.variant
                )} ${action.disabled || action.loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {action.loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  Icon && <Icon size={14} strokeWidth={2.2} />
                )}
                <span>{action.label}</span>
              </button>
            )
          })}

          {/* Contextual Overflow Menu (...) */}
          {overflowActions.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Thao tác khác"
                aria-label="Thao tác khác"
                className={`flex items-center justify-center h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl border border-border bg-surface text-text hover:bg-surface-alt hover:text-primary transition-all shadow-xs ${
                  isMenuOpen ? "border-primary text-primary ring-2 ring-primary/10" : ""
                }`}
              >
                <MoreHorizontal size={16} strokeWidth={2.2} />
              </button>

              {/* Overflow Dropdown Popup */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px] overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                    Thao tác tab
                  </div>
                  <div className="h-px bg-border my-1" />

                  {overflowActions.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <React.Fragment key={item.id}>
                        {item.dividerAbove && <div className="h-px bg-border my-1" />}
                        <button
                          type="button"
                          disabled={item.disabled}
                          onClick={() => {
                            setIsMenuOpen(false)
                            item.onClick()
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors text-left ${
                            item.destructive
                              ? "text-red-600 hover:bg-red-500/10 dark:hover:bg-red-950/20"
                              : "text-text hover:bg-surface-alt hover:text-primary"
                          } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {ItemIcon && (
                            <ItemIcon
                              size={14}
                              className={item.destructive ? "text-red-500" : "text-text-muted"}
                            />
                          )}
                          <span>{item.label}</span>
                        </button>
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
