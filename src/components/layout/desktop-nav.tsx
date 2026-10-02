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
import { DesktopNavItem } from "./desktop-nav-item"
import { DesktopNavFooter } from "./desktop-nav-footer"

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
const REPORTS_STORAGE_KEY = "floraos_nav_reports_open_v1"

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [reportsOpen, setReportsOpen] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ trạng thái đóng mở nhóm và mục Báo cáo từ localStorage
  useEffect(() => {
    const stored = loadStoredGroupStates()
    if (Object.keys(stored).length > 0) {
      setOpenGroups(stored)
    }
    try {
      const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY)
      if (storedReports !== null) {
        setReportsOpen(storedReports === "true")
      }
    } catch {
      // bỏ qua
    }
  }, [])

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

  function toggleReports(nextOpen: boolean) {
    setReportsOpen(nextOpen)
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, String(nextOpen))
    } catch {
      // bỏ qua
    }
  }

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

  function navigateTo(href: string) {
    if (searchQuery) setSearchQuery("")
    router.push(href as never)
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
            <div className="text-body-sm font-extrabold text-primary leading-tight">
              FloraOS
            </div>
            <div className="truncate text-caption text-text-muted font-medium">
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
            className="h-8 w-full rounded-lg border border-border bg-surface-alt pl-8 pr-7 text-meta text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
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
            <div className="px-2 pb-1 text-caption font-bold uppercase tracking-wider text-text-muted">
              Kết quả ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-xs text-text-muted">
                Không tìm thấy chức năng phù hợp
              </div>
            ) : (
              searchResults.map((entry) => (
                <DesktopNavItem
                  key={entry.href}
                  item={entry}
                  active={pathname === entry.href || (entry.href !== "/" && pathname.startsWith(`${entry.href}/`))}
                  iconComponent={ICONS[entry.iconKey]}
                  onClick={() => navigateTo(entry.href)}
                />
              ))
            )}
          </div>
        ) : (
          navView.groups.map((group) => {
            const isViecChinh = group.key === "viec-chinh"
            const expanded = isGroupExpanded(group)

            if (isViecChinh) {
              const homeEntry = group.entries.find((e) => e.href === "/")
              const reportEntries = group.entries.filter((e) => e.href !== "/")
              const isReportActive = reportEntries.some(
                (e) => pathname === e.href || pathname.startsWith(`${e.href}/`)
              ) || pathname === "/so-lieu"

              return (
                <div key={group.key} className="space-y-1">
                  <div className="px-2 pb-1 text-caption font-bold uppercase tracking-wider text-text-muted">
                    {group.label}
                  </div>

                  {/* Mục Trang chủ */}
                  {homeEntry && (
                    <DesktopNavItem
                      item={homeEntry}
                      active={pathname === "/"}
                      iconComponent={ICONS[homeEntry.iconKey]}
                      onClick={() => navigateTo("/")}
                    />
                  )}

                  {/* Mục Báo cáo gom các nội dung dưới Trang chủ (Hàng chờ duyệt, Đơn hàng, Sản phẩm & Giá, Khách hàng) */}
                  {reportEntries.length > 0 && (
                    <div className="pt-0.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleReports(!reportsOpen)}
                        aria-expanded={reportsOpen}
                        className={cn(
                          "group flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-meta font-medium transition-colors text-left",
                          isReportActive && !reportsOpen
                            ? "bg-surface-alt font-bold text-primary"
                            : "text-text-muted hover:bg-surface-alt hover:text-text"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <BarChart3
                            size={16}
                            strokeWidth={isReportActive ? 2.2 : 1.9}
                            className={isReportActive ? "text-primary" : "text-text-muted group-hover:text-text"}
                          />
                          <span className="truncate">Báo cáo</span>
                        </div>
                        <ChevronDown
                          size={12}
                          className={cn(
                            "transition-transform duration-150 text-text-muted group-hover:text-text",
                            reportsOpen ? "rotate-0" : "-rotate-90"
                          )}
                        />
                      </button>

                      {reportsOpen && (
                        <div className="ml-3.5 space-y-0.5 border-l border-border pl-2 pt-0.5">
                          {reportEntries.map((item) => (
                            <DesktopNavItem
                              key={item.href}
                              item={item}
                              isSubItem
                              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                              iconComponent={ICONS[item.iconKey]}
                              onClick={() => navigateTo(item.href)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={group.key} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleGroup(group.key, expanded)}
                  className="flex w-full items-center justify-between px-2 pb-1 text-caption font-bold uppercase tracking-wider text-text-muted hover:text-text"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    size={12}
                    className={cn("transition-transform duration-150", expanded ? "rotate-0" : "-rotate-90")}
                  />
                </button>

                {expanded && (
                  <div className="space-y-0.5">
                    {group.entries.map((entry) => (
                      <DesktopNavItem
                        key={entry.href}
                        item={entry}
                        active={pathname === entry.href || (entry.href !== "/" && pathname.startsWith(`${entry.href}/`))}
                        iconComponent={ICONS[entry.iconKey]}
                        onClick={() => navigateTo(entry.href)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Footer Copilot & User Account */}
      <DesktopNavFooter />
    </aside>
  )
}
