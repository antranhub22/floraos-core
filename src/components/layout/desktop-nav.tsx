"use client"

import { useState, useRef, useEffect, useMemo, type ComponentType } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Users,
  ShoppingBag,
  Bot,
  Globe,
  Tag,
  Camera,
  Folder,
  WalletCards,
  TrendingUp,
  Sparkles,
  Wand2,
  Video,
  FileText,
  Share2,
  LayoutTemplate,
  Radio,
  Clock,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Settings2,
  BookOpen,
  Cpu,
  ChevronDown,
  Search,
  X,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { cn, stripVietnamese } from "@/lib/utils"
import {
  buildNav,
  type NavEntry,
  type NavGroup,
} from "./nav-model"

const ICONS: Record<string, ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Home,
  Users,
  ShoppingBag,
  Bot,
  Globe,
  Tag,
  Camera,
  Folder,
  WalletCards,
  TrendingUp,
  Sparkles,
  Wand2,
  Video,
  FileText,
  Share2,
  LayoutTemplate,
  Radio,
  Clock,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Settings2,
  BookOpen,
  Cpu,
}

const STORAGE_KEY = "floraos_nav_groups_v1"

function loadStoredGroupStates(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistGroupStates(states: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
  } catch {
    // Không ném lỗi nếu localStorage bị khóa
  }
}

export function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { can, roleUx, orgName } = useSession()

  const navView = useMemo(() => buildNav(can, roleUx), [can, roleUx])

  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadStoredGroupStates)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Phím tắt '/' để tìm kiếm nhanh
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("")
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function isGroupExpanded(group: NavGroup): boolean {
    if (group.key === "viec-chinh") return true
    if (openGroups[group.key] !== undefined) return openGroups[group.key]!
    return group.entries.some(
      (entry) =>
        pathname === entry.href ||
        (entry.href !== "/" && pathname.startsWith(`${entry.href}/`))
    )
  }

  function toggleGroup(key: string, currentExpanded: boolean) {
    const nextStates = { ...openGroups, [key]: !currentExpanded }
    setOpenGroups(nextStates)
    persistGroupStates(nextStates)
  }

  // Kết quả tìm kiếm phẳng
  const searchResults = useMemo(() => {
    const query = stripVietnamese(searchQuery.trim())
    if (!query) return []
    const all = navView.groups.flatMap((g) => g.entries)
    const seen = new Set<string>()
    return all.filter((entry) => {
      if (seen.has(entry.href)) return false
      seen.add(entry.href)
      return stripVietnamese(entry.label).includes(query)
    })
  }, [navView, searchQuery])

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchResults.length > 0) {
      const target = searchResults[0]!
      if (target.status !== "COMING_SOON") {
        setSearchQuery("")
        router.push(target.href as never)
      }
    }
  }

  function renderNavItem(item: NavEntry) {
    const Icon = ICONS[item.iconKey] || Tag
    if (item.status === "COMING_SOON") {
      return (
        <div
          key={item.href}
          aria-disabled="true"
          title="Đang phát triển"
          className="flex h-9 w-full cursor-not-allowed items-center justify-between rounded-lg px-2.5 text-[12.5px] font-medium text-text-muted opacity-60"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Icon size={16} strokeWidth={1.9} />
            <span className="truncate">{item.label}</span>
          </div>
          <span className="shrink-0 rounded-full bg-surface-alt px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide">
            Sắp có
          </span>
        </div>
      )
    }

    const active =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`))

    return (
      <button
        key={item.href}
        type="button"
        onClick={() => {
          if (searchQuery) setSearchQuery("")
          router.push(item.href as never)
        }}
        className={cn(
          "group flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-[12.5px] font-medium transition-colors text-left",
          active
            ? "bg-surface-alt font-bold text-primary"
            : "text-text-muted hover:bg-surface-alt hover:text-text"
        )}
        aria-current={active ? "page" : undefined}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon
            size={16}
            strokeWidth={active ? 2.2 : 1.9}
            className={active ? "text-primary" : "text-text-muted group-hover:text-text"}
          />
          <span className="truncate">{item.label}</span>
        </div>
      </button>
    )
  }

  return (
    <aside
      aria-label="Điều hướng chính"
      className="hidden h-dvh w-60 flex-shrink-0 flex-col border-r border-border bg-surface md:flex"
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Sparkles size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-[13px] font-extrabold text-primary leading-tight">
              FloraOS
            </div>
            <div className="truncate text-[10px] text-text-muted font-medium">
              {orgName || "Cửa hàng hoa"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="border-b border-border px-3 py-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm chức năng... (/)"
            className="h-8 w-full rounded-lg border border-border bg-surface-alt pl-8 pr-7 text-[12px] text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-text-muted hover:text-text"
              aria-label="Xóa tìm kiếm"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {searchQuery ? (
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Kết quả ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-xs text-text-muted">
                Không tìm thấy chức năng phù hợp
              </div>
            ) : (
              searchResults.map(renderNavItem)
            )}
          </div>
        ) : (
          navView.groups.map((group) => {
            const isViecChinh = group.key === "viec-chinh"
            const expanded = isGroupExpanded(group)

            return (
              <div key={group.key} className="space-y-1">
                {isViecChinh ? (
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {group.label}
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => toggleGroup(group.key, expanded)}
                    className="flex w-full items-center justify-between px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      size={12}
                      className={cn("transition-transform duration-150", expanded ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                )}

                {expanded && (
                  <div className="space-y-0.5">
                    {group.entries.map(renderNavItem)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Footer Copilot Trigger */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
          }}
          className="w-full flex items-center justify-between rounded-xl bg-surface-alt hover:bg-surface-alt/80 border border-border p-2.5 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
              <Bot size={13} />
            </span>
            <div>
              <div className="text-[11.5px] font-bold text-text">FloraOS Copilot</div>
              <div className="text-[10px] text-text-muted font-medium">Trợ lý hỗ trợ 24/7</div>
            </div>
          </div>
          <kbd className="rounded bg-surface px-1.5 py-0.5 text-[9.5px] font-mono text-text border border-border">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  )
}
