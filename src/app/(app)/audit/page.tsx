"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  Lock,
  Eye,
  Calendar,
  FileCode,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

interface AuditLogRow {
  id: string
  created_at: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  before: unknown
  after: unknown
  ip: string | null
  user_agent: string | null
}

export default function AuditLogsPage() {
  const { can, orgName } = useSession()
  const canView = can("G9")

  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/v1/audit-logs?limit=40")
      if (!res.ok) {
        throw new Error("Không thể tải nhật ký kiểm toán.")
      }
      const data = (await res.json()) as { data: AuditLogRow[] }
      setLogs(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canView) {
      void fetchLogs()
    }
  }, [canView, fetchLogs])

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return logs
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        l.entity_id.toLowerCase().includes(q) ||
        l.user_id.toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  if (!canView) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Lock className="h-12 w-12 text-text-muted mb-3" />
        <h2 className="text-base font-bold text-text">Không có quyền truy cập</h2>
        <p className="text-xs text-text-muted max-w-sm mt-1">
          Tài khoản của bạn chưa được cấp mã năng lực G9 để xem nhật ký kiểm toán hệ thống.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* 1. Hướng dẫn K1 duy nhất */}
      <FeatureGuidanceCard
        badgeLabel="GIÁM SÁT AN TOÀN & TUÂN THỦ"
        badgeIcon={ShieldCheck}
        title="Nhật Ký Kiểm Toán Tổ Chức (Audit Trail)"
        description="Mọi thay đổi cấu hình trọng yếu, duyệt phân tích hoa, thay đổi bộ máy và phân quyền đều được ghi vết bất biến kèm mã định danh người dùng và thời điểm."
        tips={[
          "🔒 Dữ liệu kiểm toán được lưu trữ bất biến (Append-only) trong cùng giao dịch cơ sở dữ liệu",
          "⚡ Tra cứu nhanh theo loại hành động, mã thực thể hoặc định danh người thao tác",
          "🔍 Bấm 'Chi tiết' trên từng dòng để đối chiếu dữ liệu trước (before) và sau (after)",
        ]}
      />

      {/* Thông báo lỗi */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-warning-bg text-warning border border-warning/30 rounded-xl">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Header & Tải lại */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-text">Nhật Ký Kiểm Toán</h1>
          <p className="text-xs text-text-muted">
            Tổ chức: <span className="font-semibold text-text">{orgName || "Mặc định"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Lọc hành động, thực thể..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text focus:outline-hidden focus:ring-1 focus:ring-primary w-48 sm:w-60"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* 2. Danh sách nhật ký kiểm toán */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Calendar size={16} className="text-primary" /> Lịch Sử Ghi Nhận ({filteredLogs.length} bản ghi)
          </h2>
        </div>

        {loading ? (
          <div className="py-6"><SkeletonBlock lines={5} label="Đang tải nhật ký kiểm toán..." /></div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center border border-dashed rounded-xl">
            {searchQuery ? "Không tìm thấy bản ghi phù hợp." : "Chưa có sự kiện kiểm toán nào được ghi nhận."}
          </p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <caption className="sr-only">Bảng danh sách sự kiện kiểm toán hệ thống</caption>
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase font-bold">
                    <th scope="col" className="py-2.5 px-3">Thời điểm</th>
                    <th scope="col" className="py-2.5 px-3">Hành động</th>
                    <th scope="col" className="py-2.5 px-3">Thực thể</th>
                    <th scope="col" className="py-2.5 px-3">Mã thực thể</th>
                    <th scope="col" className="py-2.5 px-3">Người dùng</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="py-2.5 px-3 text-text-muted whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>
                      <th scope="row" className="py-2.5 px-3">
                        <Badge tone="accent" className="font-mono text-xs">
                          {item.action}
                        </Badge>
                      </th>
                      <td className="py-2.5 px-3 text-text font-medium">
                        {item.entity_type}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-muted text-xs">
                        {item.entity_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-muted text-xs">
                        {item.user_id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(item)}
                          className="h-7 px-2 text-xs flex items-center gap-1 text-primary hover:text-primary"
                        >
                          <Eye size={12} /> Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (390px) */}
            <div className="md:hidden flex flex-col gap-2.5">
              {filteredLogs.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-border bg-surface-alt/40 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge tone="accent" className="font-mono text-xs">
                      {item.action}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{item.entity_type}: <span className="font-mono text-text font-medium">{item.entity_id}</span></span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(item)}
                      className="h-6 px-2 text-xs"
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialog Chi Tiết Before / After (03a §22 & Base-UI Dialog) */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null)
        }}
        title={`Chi tiết kiểm toán: ${selectedLog?.action ?? ""}`}
        description={`Mã bản ghi: ${selectedLog?.id ?? ""} · Thời gian: ${selectedLog ? new Date(selectedLog.created_at).toLocaleString("vi-VN") : ""}`}
        size="lg"
        footer={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedLog(null)}
          >
            Đóng
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-alt border border-border">
              <div>
                <span className="text-text-muted block text-xs">Người thao tác (User ID):</span>
                <span className="font-mono font-bold text-text">{selectedLog.user_id}</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">IP & User Agent:</span>
                <span className="text-text font-medium truncate block">{selectedLog.ip || "N/A"} · {selectedLog.user_agent || "N/A"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-text-muted flex items-center gap-1">
                  <FileCode size={13} /> Dữ liệu trước (Before):
                </span>
                <pre className="p-3 rounded-xl bg-background border border-border text-xs font-mono overflow-auto max-h-48 text-text-muted">
                  {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "(Không có)"}
                </pre>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-primary flex items-center gap-1">
                  <FileCode size={13} /> Dữ liệu sau (After):
                </span>
                <pre className="p-3 rounded-xl bg-background border border-border text-xs font-mono overflow-auto max-h-48 text-text">
                  {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "(Không có)"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
