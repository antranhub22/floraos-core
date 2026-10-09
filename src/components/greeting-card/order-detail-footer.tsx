"use client"

import React, { useState } from "react"
import { AlertTriangle, ExternalLink, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CancellationProposalModal } from "@/components/greeting-card/inbox/cancellation-proposal-modal"
import { canProposeCancellation } from "@/modules/greeting-card/domain/cancellation-request"
import type { OrderDetailModalTarget, BrochureOrderDetailModalProps } from "./brochure-order-detail-modal"

/** Footer action bar + cancellation proposal modal — tách riêng khỏi BrochureOrderDetailModal để tuân thủ giới hạn SRP 350 dòng. */
export function OrderDetailFooter({
  target,
  onClose,
  onOpenNotes,
  onCancellationProposed,
}: Omit<BrochureOrderDetailModalProps, "target"> & { target: OrderDetailModalTarget }) {
  const [showCancelModal, setShowCancelModal] = useState(false)

  const cancellationCheck = target.orderId
    ? canProposeCancellation({
        status: target.status ?? "DRAFT",
        productionStatus: target.productionStatus,
        deliveryStatus: target.deliveryStatus,
      })
    : { allowed: false, reason: "Chưa có đơn hàng để hủy" }

  return (
    <>
      <footer className="flex flex-col gap-2 border-t border-border bg-surface-alt p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {target.sendCode && (
              <a
                href={`/b/${target.sendCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-caption font-bold text-foreground hover:bg-surface"
              >
                <ExternalLink size={14} /> Mở link khách
              </a>
            )}
            {onOpenNotes && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { onClose(); onOpenNotes(target) }}
                className="h-9 gap-1 text-caption font-bold"
              >
                <MessageSquare size={14} /> Nhắn tin / Ghi chú
              </Button>
            )}
          </div>
          <Button type="button" onClick={onClose} className="h-9 px-4 text-caption font-bold">
            Đóng
          </Button>
        </div>

        {target.orderId ? (
          <div className="border-t border-border/60 pt-2">
            <button
              type="button"
              disabled={!cancellationCheck.allowed}
              title={
                cancellationCheck.allowed
                  ? "Gửi đề xuất hủy hoặc hoàn tiền cho Điều hành xét duyệt"
                  : cancellationCheck.reason
              }
              onClick={() => setShowCancelModal(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-danger/30 px-3 py-1.5 text-caption font-bold text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AlertTriangle size={13} />
              {cancellationCheck.allowed
                ? "Đề xuất Hủy / Hoàn tiền đơn này"
                : `Không thể đề xuất — ${cancellationCheck.reason}`}
            </button>
          </div>
        ) : (
          <div className="border-t border-border/60 pt-2">
            <div className="rounded-xl border border-border/60 bg-surface-muted/50 px-3 py-1.5 text-center text-caption text-text-muted">
              Link đang xem mẫu (chưa đặt đơn) · Đề xuất hủy/hoàn áp dụng khi khách đã gửi đơn hàng
            </div>
          </div>
        )}
      </footer>

      {showCancelModal && target.orderId && (
        <CancellationProposalModal
          orderId={target.orderId}
          orderCode={target.orderCode ?? "---"}
          totalVnd={target.totalVnd ?? 0}
          paidVnd={target.paidVnd ?? 0}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false)
            onCancellationProposed?.()
            onClose()
          }}
        />
      )}
    </>
  )
}
