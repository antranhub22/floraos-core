"use client"

import { useState } from "react"
import { KeyRound, Lock, Unlock } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TemporaryPasswordNotice } from "./temporary-password-notice"

async function send(url: string, method: string, body: unknown, fallback: string) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error?.message || fallback)
  return json?.data
}

/** Đặt lại mật khẩu (`A7`) và tạm khoá/mở lại (`A5`) một nhân viên — có hỏi lại trước khi làm. */
export function MemberAccountActions({
  member,
  canResetPassword,
  canToggleActive,
  onChanged,
}: {
  member: { id: string; name: string | null; email: string; status: string }
  canResetPassword: boolean
  canToggleActive: boolean
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [reset, setReset] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const who = member.name || member.email
  const suspended = member.status === "SUSPENDED"

  const doReset = async () => {
    if (!window.confirm(`Đặt lại mật khẩu cho ${who}? Người này sẽ bị đăng xuất ở mọi máy.`)) return
    setBusy(true)
    setError(null)
    try {
      setReset(await send(`/api/v1/members/${member.id}/reset-password`, "POST", {}, "Không đặt lại được mật khẩu"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đặt lại được mật khẩu")
    } finally {
      setBusy(false)
    }
  }

  const doToggle = async () => {
    const question = suspended ? `Mở khoá tài khoản ${who}?` : `Tạm khoá tài khoản ${who}? Người này bị đăng xuất ngay, dữ liệu và đơn vẫn giữ nguyên.`
    if (!window.confirm(question)) return
    setBusy(true)
    setError(null)
    try {
      await send(`/api/v1/members/${member.id}/status`, "PATCH", { active: suspended }, "Không cập nhật được trạng thái")
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {canResetPassword && (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void doReset()} aria-label={`Đặt lại mật khẩu cho ${who}`}>
          <KeyRound size={15} />
          <span>Đặt lại mật khẩu</span>
        </Button>
      )}
      {canToggleActive && (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void doToggle()} aria-label={`${suspended ? "Mở khoá" : "Tạm khoá"} ${who}`}>
          {suspended ? <Unlock size={15} /> : <Lock size={15} />}
          <span>{suspended ? "Mở khoá" : "Tạm khoá"}</span>
        </Button>
      )}
      {error && <span role="alert" className="block text-caption text-danger">{error}</span>}
      <Dialog open={reset !== null} onOpenChange={(open) => !open && setReset(null)} title="Mật khẩu tạm mới" size="md">
        {reset && <TemporaryPasswordNotice email={reset.email} password={reset.temporaryPassword} />}
      </Dialog>
    </>
  )
}
