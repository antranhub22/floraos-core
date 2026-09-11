/**
 * Khi nào một lượt chạy được hoàn credit.
 *
 * Credit trừ tại điểm tạo job (`enqueueJob`, `YC-U3`) — trước khi worker
 * chạm vào ảnh. Ba trạng thái kết thúc dẫn tới chỗ khách không nhận được
 * thứ đã trả tiền, và mỗi trạng thái có một lý lẽ riêng:
 *
 *   Guard từ chối   GPU đã tiêu thụ nên chi phí nền tảng là thật và phải vào
 *                   sổ để đối soát; nhưng ảnh làm sai lệch sản phẩm nên
 *                   khách không dùng được — trừ tiền là bán một thứ không
 *                   giao (quyết định D3, 09/09).
 *   Bị huỷ          Job còn `PENDING` thì chưa tiến trình nào nhận, chưa một
 *                   lời gọi nhà cung cấp nào phát sinh. Không có chi phí nào
 *                   để đối soát, và khách chủ động dừng trước khi dùng.
 *   Lỗi kỹ thuật    Timeout, sập tiến trình, nhà cung cấp lỗi, quét job treo.
 *                   Đây là nền tảng hỏng, không phải khách dùng sai. Chạy
 *                   lại một job `FAILED` sinh một lượt tính phí mới, nên
 *                   không hoàn là thu tiền hai lần cho một lần giao.
 *
 * Tệp thuần — không import hạ tầng, test không cần cơ sở dữ liệu.
 */
export type JobKetThuc = {
  status: string
  result: string | null
}

export type LyDoHoan = "guard-tu-choi" | "bi-huy" | "loi-ky-thuat"

export function lyDoHoanCredit(job: JobKetThuc): LyDoHoan | null {
  if (job.status === "CANCELLED") return "bi-huy"
  if (job.status === "FAILED") return "loi-ky-thuat"
  if (job.status === "COMPLETED" && job.result === "REJECTED") return "guard-tu-choi"
  return null
}

/**
 * `COMPLETED` với bất kỳ phán quyết nào khác `REJECTED` là lượt chạy đã giao
 * đúng thứ khách mua — kể cả `LOW_CONFIDENCE`, vốn là một kết quả thật kèm
 * cảnh báo, không phải một lượt hỏng.
 */
export function duocHoanCredit(job: JobKetThuc): boolean {
  return lyDoHoanCredit(job) !== null
}
