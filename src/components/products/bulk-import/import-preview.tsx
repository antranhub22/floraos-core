"use client"

import { AlertTriangle, Check, FileSpreadsheet, Image as ImageIcon, RefreshCw } from "lucide-react"
import { driveFolderId, type ParsedProductRow } from "./types"

export type ImportStats = { total: number; matched: number; driveSynced: number; noImage: number; errors: number }

export function importStats(rows: ParsedProductRow[]): ImportStats {
  const count = (s: ParsedProductRow["status"]) => rows.filter((r) => r.status === s).length
  return { total: rows.length, matched: count("MATCHED"), driveSynced: count("DRIVE_SYNC"), noImage: count("NO_IMAGE"), errors: count("ERROR") }
}

type Props = {
  rows: ParsedProductRow[]
  stats: ImportStats
  isImporting: boolean
  progressPhase: string
  driveThumbs: Map<string, string>
}

/** Thanh tổng hợp đối chiếu + bảng xem trước từng dòng (hoặc trạng thái trống). */
export function ImportPreview({ rows, stats, isImporting, progressPhase, driveThumbs }: Props) {
  return (
    <>
      {/* Thanh trạng thái đối chiếu (Overview Status Bar) */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-4 text-body-sm font-semibold">
            <span className="text-text">Tổng cộng: <b>{stats.total}</b></span>
            {stats.matched > 0 && (
              <span className="text-success">🟢 Khớp ảnh máy tính: <b>{stats.matched}</b></span>
            )}
            {stats.driveSynced > 0 && (
              <span className="text-primary font-bold">☁️ Đã gắn Google Drive: <b>{stats.driveSynced}</b></span>
            )}
            {stats.noImage > 0 && (
              <span className="text-warning">🟡 Chưa có ảnh: <b>{stats.noImage}</b></span>
            )}
            {stats.errors > 0 && (
              <span className="text-danger">🔴 Lỗi dữ liệu: <b>{stats.errors}</b></span>
            )}
          </div>
          {isImporting && (
            <div className="flex items-center gap-2 text-caption text-primary font-medium">
              <RefreshCw size={13} className="animate-spin" />
              <span>{progressPhase}</span>
            </div>
          )}
        </div>
      )}

      {/* Bảng xem trước dữ liệu (Preview Table) */}
      {rows.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-border bg-surface-alt/60 text-caption font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  <th className="px-3 py-2.5 w-20">Ảnh</th>
                  <th className="px-3 py-2.5 w-28">Mã SKU</th>
                  <th className="px-3 py-2.5">Tên sản phẩm</th>
                  <th className="px-3 py-2.5 w-28">Danh mục</th>
                  <th className="px-3 py-2.5 w-28 text-right">Giá bán</th>
                  <th className="px-3 py-2.5">Công thức (BOM)</th>
                  <th className="px-3 py-2.5 w-32 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.index} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-3 py-2.5 text-center text-caption text-text-muted">
                      {row.index}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.previewUrl ? (
                        <div className="relative h-12 w-12 rounded-lg border border-border overflow-hidden bg-surface-alt">
                          <img
                            src={row.previewUrl}
                            alt={row.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : row.driveLink ? (() => {
                        const folderId = driveFolderId(row.driveLink)
                        const thumbUrl = folderId ? driveThumbs.get(folderId) : undefined

                        if (thumbUrl) {
                          return (
                            <a
                              href={row.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block h-12 w-12 rounded-lg border border-border overflow-hidden bg-surface-alt shadow-xs hover:border-primary transition-all"
                              title="Ảnh từ Google Drive (Nhấp để mở thư mục gốc)"
                            >
                              <img
                                src={thumbUrl}
                                alt={row.name}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                                loading="lazy"
                              />
                              <span className="absolute bottom-0 right-0 bg-black/60 px-1 py-0.2 text-caption font-bold text-white backdrop-blur-xs rounded-tl">
                                Drive
                              </span>
                            </a>
                          )
                        }

                        return (
                          <a
                            href={row.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                            title="Đang tải ảnh Google Drive (Nhấp để mở thư mục gốc)"
                          >
                            <ImageIcon size={16} className="animate-pulse" />
                            <span className="text-caption font-semibold">Drive ↗</span>
                          </a>
                        )
                      })() : (
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/40 text-text-muted">
                          <ImageIcon size={16} />
                          <span className="text-caption">Chưa ảnh</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-primary">
                      <div>{row.code || "—"}</div>
                      {(row.loviCode || row.siinCode) && (
                        <div className="text-caption text-text-muted font-normal">
                          {row.loviCode && <span>LV: {row.loviCode} </span>}
                          {row.siinCode && <span>SIIN: {row.siinCode}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-text">
                      <div>{row.name || "—"}</div>
                      {row.color && (
                        <span className="text-caption text-text-muted font-normal">Màu: {row.color}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-text-muted">
                      {row.category}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-primary">
                      {row.price ? `${row.price.toLocaleString("vi-VN")}đ` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-caption text-text-muted max-w-[220px] truncate" title={row.flowersText}>
                      {row.flowersText || "Chưa có"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.status === "MATCHED" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-caption font-bold text-success">
                          <Check size={12} /> Đã khớp ảnh
                        </span>
                      )}
                      {row.status === "DRIVE_SYNC" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-caption font-bold text-primary" title={row.driveLink}>
                          ☁️ Đã gắn Drive
                        </span>
                      )}
                      {row.status === "NO_IMAGE" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-caption font-bold text-warning">
                          Chưa có ảnh
                        </span>
                      )}
                      {row.status === "ERROR" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-caption font-bold text-danger" title={row.errorMsg}>
                          <AlertTriangle size={12} /> Lỗi
                        </span>
                      )}
                      {row.status === "ERROR" && row.errorMsg && (
                        <div className="mt-0.5 text-caption text-danger">{row.errorMsg}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-muted">
          <FileSpreadsheet size={36} className="mx-auto text-text-muted/60 mb-3" />
          <div className="text-body-sm font-semibold text-text">Chưa nạp file Excel sản phẩm</div>
          <div className="text-caption mt-1">
            Hãy tải file Excel mẫu và kéo thả vào ô phía trên để bắt đầu đối chiếu dữ liệu.
          </div>
        </div>
      )}
    </>
  )
}
