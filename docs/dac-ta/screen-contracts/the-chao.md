# Screen Contract — Thẻ chào mẫu hoa (5 tab + Hộp việc)

**Tuyến:** `/the-chao` · **Tệp chính:** `src/app/(app)/the-chao/page.tsx` · **Cập nhật:** 08/10/2026 (chuẩn bị 20/10: chỉ Điều hành xác nhận tiền, ưu đãi tính tiền, trần đơn mỗi khung giờ) · 06/10/2026 (đợt commercial-ready) · **Thẻ:** Thẻ chào

## 1. Vai và mục đích
- Vai chính: Điều hành (`dieu_hanh`), Sale (`sale`), Điều phối (`dieu_phoi`) · mỗi vai một tab chính, chung một quy trình 9 bước
- Phạm vi: organization
- Việc chính: gửi khách bộ sưu tập, theo dõi từng đơn tới khi giao, xử lý việc đúng phần mình
- Câu hỏi chính: "Hôm nay có việc gì đang chờ tôi?" — trả lời ở **Hộp việc** (nút 🔔, thấy từ mọi tab)
- Báo việc mới trong app: Hộp việc tự làm mới mỗi 20 giây; có việc mới thì huy hiệu 🔔 nhấp nháy, trình đọc màn hình đọc "Có n việc mới", tiêu đề tab trình duyệt hiện "(n)" — chưa gửi Zalo/Web Push (cần PO duyệt nhà cung cấp)
- Mật độ: MEDIUM (nhân viên cửa hàng, dùng điện thoại là chính)

## 2. Hiện trạng (audit)
- API: `/greeting-card/inbox` (R1) · `/greeting-card/messages` (R1, gửi R2) · `/greeting-card/messages/read` (R1) · `/greeting-card/messages/recipients` (R1) · `/greeting-card/tracking-pipeline` (R1) · `/greeting-card/tracking` (R1) · `/greeting-card/tracking/timeline` (R1) · `/greeting-card/sale-visibility` (F2)
- Tab: Bộ sưu tập · Theo dõi tiến độ · Bán hàng (Sale) · Điều hành · Điều phối — giữ đúng 5 tab (PO 06/10/2026)
- Trạng thái có sẵn: tải ☑ (skeleton) rỗng ☑ lỗi ☑ (kèm Thử lại) không quyền ☑ (tab chỉ hiện khi có năng lực: Bộ sưu tập `L1`, Theo dõi `R1`, Bán hàng `R2`, Điều hành `R11` (chỉ Điều hành — PO 08/10/2026, thay `R9`/`F2`), Điều phối `R3`/`R4`/`R5` — từ 06/10/2026; máy chủ vẫn kiểm ở mọi endpoint, thiếu quyền → 403) một phần ☑ thành công ☑

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Số việc + tin chưa đọc (🔔) · bước hiện tại của từng đơn · cảnh báo kẹt "Cần bạn: …" | đầu trang, đầu thẻ đơn |
| L1 Hành động | Xử lý · Nhắn tin · Trả lời · Gọi/Zalo khách | Hộp việc, thẻ đơn |
| L2 Ngữ cảnh | Thanh quy trình 9 bước (ghi rõ phần Sale/Điều hành/Điều phối) · khách · mẫu · giờ giao | thẻ đơn |
| L3 Chi tiết | Trao đổi theo đơn · đối chiếu giá khi thu tiền · chi tiết người nhận | bảng trượt / hộp thoại |
| L4 Nâng cao | Báo cáo phễu theo sale/kênh · cài đặt thời gian chuẩn, quyền xem | mục thu gọn, ngăn Cài đặt |

## 4. Hành động
- Chính (1): **Xử lý** (từ Hộp việc → mở đúng tab, cuộn tới đúng thẻ đơn và nhấn viền)
- Phụ (≤ 2): Nhắn tin (chọn "Gửi cho": Điều hành / Điều phối / Sale phụ trách / một người) · Trả lời (về đúng người đã nhắn)
- Xin giảm giá (ô soạn tin → "Xin giảm giá", chỉ đơn đã đặt): % hoặc số tiền + lý do → Điều hành duyệt ngay trong Hộp việc hoặc trong trao đổi: Duyệt như xin / Duyệt mức khác / Không duyệt (bắt buộc ghi chú); trần do Điều hành đặt trong Cài đặt, mặc định 25%

- **Sao chép link** (mọi nơi có nút Sao chép): link luôn mang tên người bấm — link riêng ghi mốc gửi; link bộ sưu tập tạo `/s/<mã>` riêng. Không hiện đường link gốc để chép tay (xem trước chỉ trong khung xem trước)
- Theo dõi tiến độ có 6 cách xem trên cùng một tập đơn/link (06/10/2026): **Kanban** (9 cột theo bước, mỗi cột có số lượng, thời gian ở bước TB/lâu nhất, số quá hạn/sắp hạn; 20 thẻ gấp nhất mỗi cột) · **Danh sách** (sắp xếp theo cột, chọn cột, tải thêm) · **Lịch** (theo ngày giao + khung giờ, tuần trước/sau) · **Timeline** (chọn một đơn → các bước đã qua so với thời gian chuẩn + sự kiện) · **Công việc** (chỉ đơn quá hạn/sắp quá hạn, gấp nhất lên đầu) · **Dashboard** (tổng hợp theo bước, thời gian ở bước, người phụ trách, còn phải thu; kèm link bộ sưu tập đã sao chép). Bộ lọc (tìm, nhóm bước, sale, thời gian chuẩn, loại, ngày giao) dùng chung và giữ nguyên khi đổi cách xem. View mẫu: Đơn của tôi, Đơn giao hôm nay, Đơn đang kẹt, Đơn quá thời gian chuẩn, Đơn cần xử lý; người dùng lưu thêm view riêng (lưu trên máy). Bấm một đơn ở view bất kỳ → Timeline của đơn đó

## 5. Content budget
nút nổi đầu trang: 3/3 (Hộp việc · Chế độ · Làm mới) · nhóm trong Hộp việc: 3 (Cần làm · Tin nhắn · Cập nhật)

## 6. Trạng thái
tải: khung xám theo dòng · rỗng: "Không có việc nào đang chờ bạn. Mọi đơn đều đúng tiến độ." / "Chưa có tin nhắn nào gửi cho bạn." · lỗi: thông báo + "Thử lại" · thành công: tin vừa gửi hiện ngay cuối trao đổi

## 7. Responsive (mobile-first)
390px: Hộp việc và trao đổi mở **toàn màn hình**, nút ≥ 44px, ô soạn tin cố định dưới cùng (tôn trọng vùng an toàn), nút thao tác thẻ đơn xuống dòng riêng · 768px+: bảng bên phải rộng tối đa 28rem, nền mờ chạm để đóng · 1280px: như 768px

## 8. Trợ năng
bàn phím: Esc đóng, Ctrl/⌘+Enter gửi tin · focus: vào nút Đóng khi mở, trả về nút đã mở khi đóng · nhãn: `role="dialog"` + `aria-labelledby`, nhóm là `tablist`, số chưa đọc có `aria-label` · vùng thông báo: số việc `aria-live="polite"`, trao đổi `aria-live="polite"`

## 9. AI
không dùng

## 10. Dữ liệu và quyền
nguồn sự thật: `greeting_messages`, `greeting_message_reads` (đã đọc lưu máy chủ — đồng bộ điện thoại/máy tính), quy trình theo dõi (`stepStartedAt`, `stuck`) · vai người gửi suy từ năng lực (F2 → Điều hành, R4/R5 → Điều phối, còn lại Sale), không do người dùng chọn · sale "chỉ khách của mình" không mở được trao đổi đơn người khác (404)

## 11. Component
dùng lại: `FlowerImage`, `TrackingStepperView` · tạo mới: `inbox/sheet.tsx` (khung bảng trượt mobile-first dùng chung cho Hộp việc và trao đổi), `inbox/inbox-panel.tsx`, `inbox/message-thread.tsx`, `inbox/message-composer.tsx`, `work/work-status.tsx` — chưa có mẫu bảng trượt toàn màn hình trên điện thoại trong hệ thống

## 12. Ma trận quyết định
| Hiện tại | Mục tiêu | Quyết định | Lý do | Bằng chứng |
|---|---|---|---|---|
| Thông báo rải rác 6 nơi | Một Hộp việc | Gom về 🔔 Hộp việc, bỏ "Cập nhật mới" ở tab | PO 06/10/2026: tập trung, không phân tâm | tin nhắn PO |
| Ghi chú không người nhận, vai tự chọn | Tin có người nhận, trả lời đúng người | Bảng `greeting_messages` + đã đọc | Thông báo đúng người, chống giả vai | PO duyệt đổi schema 06/10/2026 |

## 13. QA Matrix
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai · Việc · IA · Thứ bậc · CTA · Trạng thái · Responsive · Trợ năng · Dữ liệu · Quyền | PASS | test cách ly `tests/tenant/greeting-card-messages.test.ts` |

## 13b. Trang khách & theo dõi công khai (06/10/2026)
- Trang `/b/<mã>` chỉ đọc; trình duyệt khách gọi `POST …/open` để ghi "đã mở" (máy quét xem trước link không tính).
- Đơn mới cọc: mở lại link vẫn ở bước thanh toán với QR phần còn lại; màn thanh toán báo "Cửa hàng đã nhận tiền cọc" + nút xem QR phần còn lại.
- Theo dõi theo mã đơn: mặc định rút gọn (tên viết tắt, phường + tỉnh); ô "Nhập 4 số cuối số điện thoại" để xem đầy đủ; mở từ chính link của khách thì đầy đủ sẵn.
- Form đặt hoa có ô bẫy ẩn chống máy tự điền (không hiện, không nhận Tab, trình đọc màn hình bỏ qua).

## 13c. Chuẩn bị 20/10 (PO 08/10/2026)
- Tab "Điều hành" (thu tiền, báo giá, giao dịch ngân hàng) chỉ hiện với `R11` — trần cứng Điều hành; Sale và Điều phối không thấy nút "Thu tiền" (cả ở Sổ đơn hàng).
- Form đặt hoa: 3 ưu đãi mặc định (Giảm 10% trên tổng đơn · Tặng thiệp · Thêm phụ liệu), khách chọn tối đa 01; "Giảm %" hiện dòng "Ưu đãi: −… đ" ở bảng tiền và màn Xem lại; ô mã giảm giá ẩn khi tiệm chưa bật; phí giao "Miễn phí" khi tiệm bật miễn phí giao mọi đơn.
- Chọn khung giờ: khung đủ đơn hiện "(đã kín)" và không chọn được; gửi đơn vào khung vừa kín → lỗi ngay ở ô khung giờ.
- Cài đặt → Khu vực, phí giao & giờ nhận đơn: "Số đơn tối đa mỗi khung giờ" (chung, mặc định 100; riêng từng khung), "Miễn phí giao hoa cho mọi đơn", "Cho khách nhập mã giảm giá".
- Hộp "Thu tiền" và thẻ đơn Điều phối hiện "Ưu đãi khách chọn".
- Đợt 2: mở `/the-chao` vào thẳng chỗ làm theo năng lực — `R11` (Điều hành) → Quản lý · tab Điều hành; `R3`/`R4`/`R5` (Điều phối) → Quản lý · tab Điều phối; còn lại (Sale) → Gửi nhanh.
- Tab Điều phối đọc `/greeting-card/coordinator-board`: mọi đơn đang làm + đơn xong/huỷ 24 giờ qua, xếp theo ngày + giờ giao, chip "Mọi ngày · Hôm nay · Ngày mai" + chọn ngày, tự làm mới 30 giây; quá 1000 đơn hiện ghi chú, không có "Tải thêm".
- Tab Điều hành: ô "Tìm mã đơn, mã link hoặc số điện thoại" (≥ 3 ký tự, bỏ qua bộ lọc), bộ lọc "Khách báo đã chuyển"; xác nhận thu tiền xong hiện tin báo khách soạn sẵn kèm link theo dõi và nút "Sao chép tin".
- Sale (không `L3`) xem bộ sưu tập ở chế độ chỉ đọc trong Gửi nhanh; xoá mẫu khỏi bộ sưu tập luôn hỏi lại.
- Trang khách `/b/<mã>` mở ở trình duyệt khác khi link đã có đơn: ô "4 số cuối số điện thoại người đặt" để vào lại đơn (thay vì báo link không tồn tại).

## 14. Kết quả
lint:ux sau: không tăng vi phạm · nợ mở: thông báo đẩy/Zalo cho tin nhắn chưa làm
