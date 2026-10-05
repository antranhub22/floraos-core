import { conflict } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { loadPublicSession } from "./brochure-session-access"

/**
 * Khách muốn đặt thêm đơn trên cùng link (tặng nhiều người, đặt lại dịp khác).
 * Chuẩn: MỖI ĐƠN MỘT PHIÊN — tạo phiên mới (mã link mới → mã đơn mới) nối với
 * phiên cũ qua sự kiện REORDER, giữ nguyên sale phụ trách và khách. Đơn cũ,
 * QR và trang theo dõi của đơn cũ không bị ảnh hưởng. Bấm đúp vẫn an toàn vì
 * từng phiên chỉ nhận một đơn (chống trùng đã có sẵn).
 */
export async function startAnotherOrder(
  sendCode: string,
  repo = new GreetingCardRepository(),
): Promise<{ sendCode: string }> {
  const session = await loadPublicSession(sendCode, repo)
  if (!session.order_id) throw conflict("Link này chưa có đơn — hãy đặt đơn trên chính link này")

  const next = await repo.createFollowUpSession(session)
  await repo.recordJourneyEvent(session.organization_id, next.id, "REORDER", { fromSendCode: session.send_code })
  return { sendCode: next.send_code }
}
