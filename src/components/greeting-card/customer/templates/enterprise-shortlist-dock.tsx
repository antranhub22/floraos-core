"use client"

import React, { useState } from "react"
import { Heart, X, Check, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { formatPriceVnd } from "@/components/greeting-card/api-error"

interface EnterpriseShortlistDockProps {
  shortlistIds: string[]
  products: GreetingCatalogProduct[]
  onToggleShortlist: (product: GreetingCatalogProduct) => void
  onJumpToProduct: (product: GreetingCatalogProduct) => void
  onSelectProduct: (product: GreetingCatalogProduct) => void
}

export function EnterpriseShortlistDock({
  shortlistIds,
  products,
  onToggleShortlist,
  onJumpToProduct,
  onSelectProduct,
}: EnterpriseShortlistDockProps) {
  const [isOpenModal, setIsOpenModal] = useState(false)

  if (shortlistIds.length === 0) return null

  const shortlistedProducts = products.filter((p) => shortlistIds.includes(p.id))

  return (
    <>
      {/* Floating Bottom Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 pointer-events-none">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl p-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <Heart size={16} className="fill-current text-danger" />
            </div>
            <div className="min-w-0">
              <p className="text-caption font-extrabold text-foreground truncate">
                Đã lưu {shortlistedProducts.length} mẫu ưng ý
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {shortlistedProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-5 h-5 rounded-md overflow-hidden border border-border shrink-0 bg-surface-muted"
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20" />
                    )}
                  </div>
                ))}
                {shortlistedProducts.length > 3 && (
                  <span className="text-caption text-text-muted font-bold">
                    +{shortlistedProducts.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-caption font-bold hover:bg-primary-dark transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            So sánh ({shortlistedProducts.length})
          </button>
        </div>
      </div>

      {/* Comparison Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-2xl p-5 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-danger fill-current" />
                <h3 className="text-body font-extrabold text-foreground">
                  Danh Sách Mẫu Cân Nhắc ({shortlistedProducts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                aria-label="Đóng"
                className="p-1.5 rounded-full hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of shortlisted items */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {shortlistedProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl border border-border bg-surface-alt/40 flex items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-muted shrink-0 border border-border">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-caption text-text-muted">
                        Hoa
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-caption font-bold text-foreground truncate">{p.name}</h4>
                    <p className="text-body-sm font-extrabold text-primary mt-0.5">
                      {formatPriceVnd(p.price)}
                    </p>
                    <span className="text-caption text-text-muted">Mã: {p.code}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsOpenModal(false)
                        onSelectProduct(p)
                      }}
                      className="text-caption font-extrabold h-8 px-3 rounded-xl bg-primary text-white hover:bg-primary-dark cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Chọn</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpenModal(false)
                          onJumpToProduct(p)
                        }}
                        title="Xem lại trên thẻ lướt"
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleShortlist(p)}
                        title="Bỏ lưu mẫu này"
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-danger-bg text-text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-between shrink-0">
              <span className="text-caption text-text-muted">
                Chạm &quot;Chọn&quot; để điền đơn đặt hoa ngay
              </span>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="text-caption font-bold text-primary hover:underline cursor-pointer"
              >
                Tiếp tục lướt xem
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
