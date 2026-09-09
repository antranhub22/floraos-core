/**
 * Cổng hàng đợi — quyết định D6-1 (kiến trúc V2 mục 3.1).
 *
 * Adapter mặc định dùng chính bảng `generation_jobs` trên Postgres:
 * worker lấy việc bằng SELECT … FOR UPDATE SKIP LOCKED, đánh thức bằng
 * LISTEN/NOTIFY. Đổi sang Redis về sau là thay adapter sau cổng này,
 * không sửa module.
 *
 * Cấm chạy job qua HTTP. Cấm subprocess + parse stdout.
 */
export interface EnqueueInput {
  /** Cột bắt buộc của generation_jobs, truyền suốt tới worker. */
  organizationId: string;
  feature: string;
  payload: unknown;
}

export interface QueueProvider {
  readonly name: string;

  /**
   * Hạn mức được kiểm TRƯỚC lời gọi này, ở phía core. Usage cũng ghi ở đây,
   * tại điểm tạo job — không ghi ở worker.
   */
  enqueue(input: EnqueueInput): Promise<{ jobId: string }>;

  cancel(jobId: string, organizationId: string): Promise<void>;
}
