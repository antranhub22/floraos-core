"use client"

// Tính giá sản phẩm (M02) — trước đây "Chưa sẵn sàng": API `pricing-rules`
// (đọc/ghi cấu hình giá) đã có đầy đủ từ P6, nhưng chưa có màn nào dùng
// tới. Màn này nối hai việc:
//   1. Đọc/sửa cấu hình giá của tổ chức qua GET/PUT /api/v1/pricing-rules
//      thật (`L5` đọc, `L6` sửa).
//   2. Máy tính giá dùng chính hàm `quotePrice`/`checkPriceInvariants`/
//      `checkPriceGuard` của backend (`src/modules/products/domain/`) —
//      các hàm này thuần, không đụng Prisma, nên chạy được thẳng ở client,
//      không cần dựng thêm API tính giá riêng (REUSE, không BUILD).
//
// Cố tình CHƯA cho sửa `surcharge_groups` (thêm/xoá nhóm phụ phí) ở đợt
// này — chỉnh sửa mảng lồng nhau xứng một màn quản trị riêng; máy tính vẫn
// dùng được các nhóm phụ phí mặc định/đã cấu hình sẵn để chọn.
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSession } from "@/lib/session"
import {
  quotePrice,
  checkPriceInvariants,
  type PricingConfig,
  type PriceQuoteResult,
  type SurchargeGroup,
} from "@/modules/products/domain/pricing"
import { checkPriceGuard } from "@/modules/products/domain/price-guard"

type FloorCeilingRatio = { floorRatio: number; ceilingRatio: number }

type PricingRulesResponse = {
  branch_id: string | null
  partner_tier_bonus: Record<string, number>
  surcharge_groups: SurchargeGroup[]
  optimal_price_ratio: number
  floor_ceiling_ratio: FloorCeilingRatio
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value || 0)) + " đ"
}

export default function GiaPage() {
  const router = useRouter()
  const { can } = useSession()
  const coQuyenSua = can("L6")

  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [rules, setRules] = useState<PricingRulesResponse | null>(null)

  // Cấu hình giá — bản nháp chỉnh sửa, tách khỏi `rules` (dữ liệu đã lưu)
  // để Huỷ không mất bản đã lưu.
  const [tierRows, setTierRows] = useState<{ name: string; percent: number }[]>([])
  const [optimalPercent, setOptimalPercent] = useState(50)
  const [floorRatio, setFloorRatio] = useState(0)
  const [ceilingRatio, setCeilingRatio] = useState(0)
  const [dangLuu, setDangLuu] = useState(false)
  const [loiLuu, setLoiLuu] = useState<string | null>(null)
  const [luuThanhCong, setLuuThanhCong] = useState(false)

  // Máy tính giá
  const [costVnd, setCostVnd] = useState<number | "">("")
  const [partnerTier, setPartnerTier] = useState("")
  const [listPriceVnd, setListPriceVnd] = useState<number | "">("")
  const [closedPriceVnd, setClosedPriceVnd] = useState<number | "">("")
  const [depositPercent, setDepositPercent] = useState<number>(100)
  const [selectedSurcharges, setSelectedSurcharges] = useState<Record<string, number>>({})
  const [otherSurchargeVnd, setOtherSurchargeVnd] = useState<number | "">("")
  const [ketQua, setKetQua] = useState<PriceQuoteResult | null>(null)
  const [canhBaoSanTran, setCanhBaoSanTran] = useState("")
  const [viPhamBatBien, setViPhamBatBien] = useState<string[]>([])

  useEffect(() => {
    let huy = false
    async function napLai() {
      try {
        const res = await fetch("/api/v1/pricing-rules")
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error(`Không tải được cấu hình giá (${res.status})`)
        const data = (await res.json()) as PricingRulesResponse
        if (huy) return
        setRules(data)
        setTierRows(
          Object.entries(data.partner_tier_bonus).map(([name, ratio]) => ({
            name,
            percent: Math.round(ratio * 1000) / 10,
          }))
        )
        setOptimalPercent(Math.round(data.optimal_price_ratio * 1000) / 10)
        setFloorRatio(data.floor_ceiling_ratio.floorRatio)
        setCeilingRatio(data.floor_ceiling_ratio.ceilingRatio)
        setPartnerTier((cur) => cur || Object.keys(data.partner_tier_bonus)[0] || "")
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tải được cấu hình giá")
      } finally {
        if (!huy) setDangTai(false)
      }
    }
    napLai()
    return () => {
      huy = true
    }
  }, [router])

  async function luuCauHinh() {
    setDangLuu(true)
    setLoiLuu(null)
    setLuuThanhCong(false)
    try {
      const partnerTierBonus = Object.fromEntries(
        tierRows.filter((r) => r.name.trim() !== "").map((r) => [r.name.trim(), r.percent / 100])
      )
      const puts = [
        { key: "partner_tier_bonus", value: partnerTierBonus },
        { key: "optimal_price_ratio", value: optimalPercent / 100 },
        { key: "floor_ceiling_ratio", value: { floorRatio, ceilingRatio } },
      ]
      for (const body of puts) {
        const res = await fetch("/api/v1/pricing-rules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
          throw new Error(data?.error?.message ?? `Không lưu được "${body.key}" (${res.status})`)
        }
      }
      setRules((cur) => (cur ? { ...cur, partner_tier_bonus: partnerTierBonus, optimal_price_ratio: optimalPercent / 100, floor_ceiling_ratio: { floorRatio, ceilingRatio } } : cur))
      setLuuThanhCong(true)
    } catch (e) {
      setLoiLuu(e instanceof Error ? e.message : "Không lưu được cấu hình")
    } finally {
      setDangLuu(false)
    }
  }

  function tinhGia() {
    if (!rules) return
    const config: PricingConfig = {
      partnerTierBonus: rules.partner_tier_bonus,
      surchargeGroups: rules.surcharge_groups,
      optimalPriceRatio: rules.optimal_price_ratio,
    }
    const result = quotePrice(
      {
        effectiveCostVnd: Number(costVnd) || 0,
        partnerTier,
        selectedSurcharges,
        otherSurchargeVnd: Number(otherSurchargeVnd) || 0,
        listPriceVnd: Number(listPriceVnd) || 0,
        closedPriceVnd: closedPriceVnd === "" ? null : Number(closedPriceVnd),
        depositPercent,
      },
      config
    )
    setKetQua(result)
    setViPhamBatBien(checkPriceInvariants(result))

    const { floorRatio: fr, ceilingRatio: cr } = rules.floor_ceiling_ratio
    const guard = checkPriceGuard({
      code: "TAM_TINH",
      priceVnd: result.listPriceVnd,
      limits: { has: fr > 0 || cr > 0, floorVnd: result.costVnd * fr, ceilingVnd: result.costVnd * cr },
    })
    setCanhBaoSanTran(guard.warning)
  }

  if (dangTai) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
        <Loader2 size={20} className="animate-spin" />
        <div className="text-[13px]">Đang tải cấu hình giá…</div>
      </div>
    )
  }

  if (loi || !rules) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-[13px] font-medium text-danger">{loi ?? "Không tải được cấu hình giá"}</div>
        <Button size="sm" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-primary">Tính giá sản phẩm</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <Card className="flex flex-col gap-3 p-4">
          <div className="text-[13.5px] font-bold">Máy tính giá</div>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Giá vốn (đ)
            <input
              type="number"
              min={0}
              value={costVnd}
              onChange={(e) => setCostVnd(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Hạng đối tác
            <select
              value={partnerTier}
              onChange={(e) => setPartnerTier(e.target.value)}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            >
              {Object.keys(rules.partner_tier_bonus).map((tier) => (
                <option key={tier} value={tier}>
                  {tier} (+{Math.round((rules.partner_tier_bonus[tier] ?? 0) * 100)}%)
                </option>
              ))}
            </select>
          </label>

          {rules.surcharge_groups.map((group) => (
            <label key={group.id} className="flex flex-col gap-1 text-[12.5px]">
              {group.name}
              <select
                value={selectedSurcharges[group.id] ?? 0}
                onChange={(e) =>
                  setSelectedSurcharges((cur) => ({ ...cur, [group.id]: Number(e.target.value) }))
                }
                className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
              >
                {group.options.map((opt) => (
                  <option key={opt.label} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="flex flex-col gap-1 text-[12.5px]">
            Phụ phí khác (đ, không bắt buộc)
            <input
              type="number"
              min={0}
              value={otherSurchargeVnd}
              onChange={(e) => setOtherSurchargeVnd(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Giá niêm yết (đ)
            <input
              type="number"
              min={0}
              value={listPriceVnd}
              onChange={(e) => setListPriceVnd(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Giá chốt tay (đ, không bắt buộc — thay giá niêm yết khi có)
            <input
              type="number"
              min={0}
              value={closedPriceVnd}
              onChange={(e) => setClosedPriceVnd(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Tỷ lệ cọc (%)
            <input
              type="number"
              min={0}
              max={100}
              value={depositPercent}
              onChange={(e) => setDepositPercent(Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <Button onClick={tinhGia} className="w-full">
            Tính giá
          </Button>

          {ketQua && (
            <div className="mt-1 flex flex-col gap-1.5 rounded-xl bg-surface-alt p-3 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Giá vốn (đã tròn)</span>
                <span className="font-semibold">{formatVnd(ketQua.costVnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Thưởng theo hạng ({ketQua.tierBonusRatioPercent}%)</span>
                <span className="font-semibold">{formatVnd(ketQua.tierBonusVnd)}</span>
              </div>
              {ketQua.surcharges.map((s) => (
                <div key={s.label} className="flex justify-between">
                  <span className="text-text-muted">{s.label}</span>
                  <span className="font-semibold">{formatVnd(s.amountVnd)}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-border pt-1.5 text-[13.5px]">
                <span className="font-bold">Tổng shop nhận</span>
                <span className="font-bold text-primary">{formatVnd(ketQua.totalVnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Giá tối ưu ({ketQua.optimalPriceRatioPercent}% giá bán)</span>
                <span className="font-semibold">{formatVnd(ketQua.optimalPriceVnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Cọc ({ketQua.depositPercent}%) / Còn lại</span>
                <span className="font-semibold">
                  {formatVnd(ketQua.depositVnd)} / {formatVnd(ketQua.remainingVnd)}
                </span>
              </div>

              {canhBaoSanTran && (
                <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-warning-bg px-2.5 py-2">
                  <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-warning" />
                  <div className="flex-1 text-[11.5px] leading-snug text-warning">{canhBaoSanTran}</div>
                </div>
              )}
              {viPhamBatBien.length > 0 && (
                <div className="mt-1 flex flex-col gap-1 rounded-lg bg-danger-bg px-2.5 py-2 text-[11.5px] text-danger">
                  {viPhamBatBien.map((v) => (
                    <div key={v}>{v}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <div>
            <div className="text-[13.5px] font-bold">Cấu hình giá của tổ chức</div>
            <div className="mt-0.5 text-xs text-text-muted">
              Áp dụng cho mọi lượt tính giá.{" "}
              {rules.branch_id ? "Đang xem theo chi nhánh của bạn." : "Áp dụng toàn tổ chức."}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[12.5px] font-semibold text-text-muted">Thưởng theo hạng đối tác</div>
            {tierRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={row.name}
                  disabled={!coQuyenSua}
                  onChange={(e) =>
                    setTierRows((cur) => cur.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
                  }
                  placeholder="Tên hạng"
                  className="h-10 flex-1 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                />
                <input
                  type="number"
                  disabled={!coQuyenSua}
                  value={row.percent}
                  onChange={(e) =>
                    setTierRows((cur) =>
                      cur.map((r, i) => (i === idx ? { ...r, percent: Number(e.target.value) } : r))
                    )
                  }
                  className="h-10 w-20 rounded-xl border-[1.5px] border-border bg-surface px-2 text-right text-sm outline-none focus:border-primary disabled:opacity-60"
                />
                <span className="text-[12.5px] text-text-muted">%</span>
                {coQuyenSua && (
                  <button
                    type="button"
                    onClick={() => setTierRows((cur) => cur.filter((_, i) => i !== idx))}
                    className="text-[11.5px] font-bold text-danger"
                  >
                    Xoá
                  </button>
                )}
              </div>
            ))}
            {coQuyenSua && (
              <button
                type="button"
                onClick={() => setTierRows((cur) => [...cur, { name: "", percent: 0 }])}
                className="w-fit text-[12.5px] font-bold text-accent"
              >
                + Thêm hạng
              </button>
            )}
          </div>

          <label className="flex flex-col gap-1 text-[12.5px]">
            Tỷ lệ giá tối ưu / giá bán (%)
            <input
              type="number"
              min={0}
              max={100}
              disabled={!coQuyenSua}
              value={optimalPercent}
              onChange={(e) => setOptimalPercent(Number(e.target.value))}
              className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[12.5px]">
              Hệ số Sàn (× giá vốn, 0 = không đặt)
              <input
                type="number"
                min={0}
                step={0.1}
                disabled={!coQuyenSua}
                value={floorRatio}
                onChange={(e) => setFloorRatio(Number(e.target.value))}
                className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12.5px]">
              Hệ số Trần (× giá vốn, 0 = không đặt)
              <input
                type="number"
                min={0}
                step={0.1}
                disabled={!coQuyenSua}
                value={ceilingRatio}
                onChange={(e) => setCeilingRatio(Number(e.target.value))}
                className="h-10 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
          </div>

          <div className="text-[11px] leading-snug text-text-muted">
            Danh mục phụ phí (Hỗ trợ ship, Phụ phí làm gấp…) chưa sửa được ở đây — máy tính vẫn dùng được các
            nhóm đã cấu hình sẵn để chọn.
          </div>

          {coQuyenSua ? (
            <>
              {loiLuu && (
                <div className="rounded-lg bg-danger-bg px-2.5 py-2 text-[11.5px] font-medium text-danger">
                  {loiLuu}
                </div>
              )}
              {luuThanhCong && (
                <div className="rounded-lg bg-success-bg px-2.5 py-2 text-[11.5px] font-medium text-secondary-text">
                  Đã lưu cấu hình giá.
                </div>
              )}
              <Button onClick={luuCauHinh} disabled={dangLuu} className="w-full">
                {dangLuu ? "Đang lưu…" : "Lưu cấu hình"}
              </Button>
            </>
          ) : (
            <div className="text-[11.5px] text-text-muted">Chỉ Điều hành mới sửa được cấu hình giá.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
