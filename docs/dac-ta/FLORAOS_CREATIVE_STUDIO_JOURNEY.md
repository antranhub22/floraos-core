# User Journey — Creative Studio (Chặng 01–14)

> **Mục đích:** Mô tả đúng những gì người dùng làm và thấy trong `/creative-studio`, từ lúc tải ảnh bó hoa đến lúc xem hiệu quả bán hàng.
> **Phiên bản:** 3.0 — 23/09/2026. Đồng bộ lại theo mã (bản 2.0 mô tả Khu vực F và Chặng 10–14 như đã chạy thật trong khi mã là giao diện dựng sẵn với số liệu gõ cứng).
> **Tài liệu liên quan:** kiến trúc `docs/kien-truc/FLORAOS_CREATIVE_STUDIO_ARCHITECTURE.md` · dữ liệu vào/ra `docs/dac-ta/FLORAOS_CREATIVE_STUDIO_IO_SPEC.md` · hành trình 14 chặng gốc `docs/dac-ta/FLORAOS_PRODUCT_TO_MARKET_USER_JOURNEY.md`.

---

## Người dùng

Chủ tiệm / quản lý / thợ hoa. Bắt đầu bằng một việc: tải ảnh thật của bó/lẵng hoa lên Khu vực A. Không phải lúc nào cũng đi hết 14 chặng — B, C, D, E làm theo thứ tự tuỳ ý; F cần ít nhất ảnh biến thể và bài đăng để QA đạt.

## Bản đồ

```
A  Quét theo ảnh sản phẩm   01 BRING · 02 UNDERSTAND · 03 DISCOVER · 04 IDEATE · 05 CHOOSE
B  Viết contents            06a  4 bài Facebook / Instagram / TikTok / Zalo
C  Tạo audio                06b  lồng tiếng + nhạc nền, nghe lại bản phối
D  Tạo biến thể ảnh         06c  4 phân cảnh Narrative Arc, số toàn vẹn ĐO thật
E  Tạo video                06d  video nháp theo 6 khuôn, Ken Burns theo cảnh
F  Gói chiến dịch           07 PACKAGE · 08 QA · 09 APPROVE → 10 LAUNCH · 11 SELL · 12 MEASURE · 13 LEARN · 14 NEXT
```

---

## Khu vực A — Chặng 01 → 05

1. **01 BRING** — kéo thả ảnh hoặc chọn ảnh có sẵn. Ảnh được lưu vào kho ngay; lỗi tải lên thì hiện lỗi và dừng.
2. **02 UNDERSTAND** — Vision AI (`gpt-4o-mini`) bóc tách hoa chính/phụ/lá đệm (tên, số lượng, đơn vị, màu, vai trò), giấy gói, ruy băng, thiệp (đọc chữ in trên thiệp). Mọi trường sửa được. Vision lỗi thì hiện lỗi; người dùng vẫn có thể tự nhập.
3. **03 DISCOVER** — điểm Trend / Audience / Content Fit, ma trận đối soát (MATCH/PARTIAL/MISMATCH theo tín hiệu thật trong `trend_signals`, thiếu tín hiệu thì ghi rõ "chưa có dữ liệu thật"), gợi ý GIỮ / CẢI TIẾN / THỬ. Chủ tiệm xác nhận để mở Chặng 04.
4. **04 IDEATE** — 10 chủ đề nội dung (tiêu đề, hook, CTA, định dạng) kèm **video tham khảo** YouTube + TikTok. Khi đó là danh mục tuyển chọn, giao diện ghi "Danh mục tham khảo — lượt xem/tương tác là ước tính" và thẻ TikTok là "Mở kết quả tìm kiếm TikTok".
5. **05 CHOOSE** — chọn 1 chủ đề, Mode `CREATIVE` (mặc định) hoặc `AUTHENTIC`, khu vực sẽ mở. Nút "Bắt đầu sáng tạo" bị khoá nếu ảnh chưa vào kho.

> Khu vực A không bao giờ bị chặn. B–F hiện màn kiểm tra nếu thiếu dữ liệu thật của Chặng 01–05 (tên sản phẩm, passport, ảnh…); người dùng có thể xem thiếu gì rồi quay lại A hoặc bỏ qua cảnh báo.

---

## Khu vực B — Chặng 06a

- Chọn một hoặc vài chủ đề, Mode, giọng/mood gợi ý → **"Tạo nội dung"** (`POST /creative-production/produce`).
- Kết quả: cung truyện 3–5 nhịp và 4 bài đăng theo kênh, sửa trực tiếp được. Thiếu giá thật thì bài ghi "Liên hệ tiệm để nhận báo giá".
- ⚠ Bài mẫu có vài câu cam kết dịch vụ chung (giao nhanh, tặng thiệp…) — chủ tiệm cần sửa cho đúng dịch vụ của tiệm trước khi đăng.
- **"Lưu bài vào gói chiến dịch"** — lưu 4 bài (kể cả phần đã sửa) vào gói của Master Image hiện tại. Cần Master đã duyệt (xem Khu vực F).

## Khu vực C — Chặng 06b

- Lời thoại từng cảnh (điền sẵn từ hook/tiêu đề/CTA của chủ đề), giọng đọc, nhà cung cấp TTS, chất lượng, mood nhạc.
- **"Tạo audio job"** → trừ credit một lần (bấm đúp không trừ hai lần) → màn hình chờ worker phối → **nghe lại bản phối ngay trên trang**. Lỗi phối thì hiện lý do.
- Xong thì mã audio job được mang sang Khu vực F để đưa vào gói.

## Khu vực D — Chặng 06c

- Nguồn ảnh: Master Image đã duyệt. Nếu mới chỉ có ảnh gốc từ A: **"Skip — Dùng ảnh gốc"** (nâng thành Master, không chỉnh ảnh).
- Bốn phân cảnh: **1 SETUP** studio trắng · **2 RISING** lifestyle (tiệc cưới / sảnh khách sạn / phòng khách theo góc tiếp cận của chủ đề) · **3 CLIMAX** bàn gỗ Bắc Âu · **4 CTA** tách nền PNG.
- Không cần chọn bối cảnh bằng tay: bối cảnh từng cảnh đi theo kịch bản của chủ đề đã chọn ở Chặng 05. Màn cấu hình cho xem trước 4 cảnh, chọn tỉ lệ khung và bật watermark (Cảnh 1–3).
- Chọn nguồn hậu cảnh cho Cảnh 2–3: **"Hậu cảnh Stability"** (2 credit/cảnh — AI vẽ không gian, bó hoa thật dán nguyên khối) hoặc **"Studio cục bộ"** (1 credit/cảnh). Cảnh 1 và 4 luôn cục bộ.
- **"Sinh trọn bộ 4 phân cảnh"** (6 credit với Stability, 4 credit nếu toàn cục bộ) hoặc **"Sinh từng cảnh →"** mở bảng 4 cảnh để sinh riêng. Mỗi nút sinh cảnh tạo một job thật và chờ kết quả. Thẻ cảnh hiện: ảnh thật, nguồn ("Hậu cảnh Stability" / "Studio cục bộ" / "Studio cục bộ (Stability lỗi)"), **% lõi bó hoa trùng khít đo được**. Cảnh chưa sinh ghi "Chưa sinh — chưa đo".
- Lõi bó hoa lệch dưới 99% → cổng từ chối, không ảnh nào được lưu, hiện lý do.
- **"Duyệt ảnh này"** cho từng cảnh (chỉ chủ tiệm — năng lực I5).

## Khu vực E — Chặng 06d

- Chọn 1 trong 6 khuôn (Reel 15s, TikTok 30s, Story 15s, Slideshow, Trang sản phẩm, Ad Motion); storyboard hiện ngay, điền sẵn ảnh biến thể của Khu vực D; mỗi cảnh chọn Ken Burns (zoom in/out, pan lên/phải, tĩnh), phụ đề, watermark.
- **"Tạo video"** tạo **bản nháp**. Duyệt kịch bản (P3), render và duyệt video thành phẩm (P4, chỉ chủ tiệm) ở màn **Video**. Khu vực F chỉ coi video là đạt khi đã duyệt P4.

## Khu vực F — Chặng 07 → 09

- Nếu chưa có Master đã duyệt → nút "Skip — Dùng ảnh gốc làm Master".
- **07 PACKAGE** — tạo gói (tên = sản phẩm + chủ đề), rồi chọn: ảnh biến thể của Master này (thấy % toàn vẹn và trạng thái duyệt từng ảnh), video, âm thanh, bài đăng theo kênh (sửa được). **"Lưu gói"**. Mọi thay đổi đưa gói về Nháp.
- **08 QA** — **"Chạy QA"** chạy trên máy chủ, năm trục: toàn vẹn sản phẩm · đã duyệt từng tài sản · đúng tỷ lệ theo kênh · nội dung (độ dài, biến chưa điền, hashtag Instagram, từ cấm ngành hoa / của thương hiệu) · thương hiệu (logo, ảnh đóng dấu). Kết luận: Đạt / Cần xem lại / Từ chối, kèm lý do cụ thể.
- **09 APPROVE** — chỉ duyệt được khi QA Đạt, hoặc Cần xem lại và đã tick "Tôi đã xem các cảnh báo". QA Từ chối thì phải sửa rồi chạy lại. Duyệt được ghi nhật ký kiểm toán. Gói đã duyệt không sửa được.

## Chặng 10 → 14 (sau khi duyệt)

- **10 LAUNCH** — chọn kênh, giờ đăng dự kiến; đăng/lên lịch ở **Lịch đăng**; dán **mã bài đã đăng** vào gói để đo.
- **11–12 SELL & MEASURE** — hội thoại mới, số đơn và doanh thu của sản phẩm kể từ ngày duyệt, reach/hiển thị/tương tác/click/chuyển đổi của các bài đã gắn. Chưa có số thì ghi "chưa có số liệu", kèm giới hạn của phép đo (chưa quy đơn về từng bài).
- **13 LEARN** — mẫu thắng (góc tiếp cận, bối cảnh Cảnh 2, có video) chỉ hiện khi tiệm có ≥ 3 gói đã duyệt gắn sản phẩm; chưa đủ thì nói rõ đang có bao nhiêu/cần bao nhiêu.
- **14 NEXT BEST ACTION** — việc nên làm tiếp, mỗi việc có lý do từ dữ liệu thật và nút "Làm ngay" dẫn tới đúng khu vực/màn hình.

---

## Quyền duyệt theo khu vực

| Khu vực | Người dùng chọn | Ai được duyệt |
|---|---|---|
| A | ảnh, sửa thông số, chủ đề, Mode | — |
| B | chủ đề, nội dung từng kênh | — |
| C | lời thoại, giọng, nhạc | — |
| D | nguồn hậu cảnh, cảnh cần sinh | Duyệt ảnh: `I5` (chủ tiệm) · Skip ảnh gốc: `I2` (chủ tiệm) |
| E | khuôn, storyboard, Ken Burns | Kịch bản `P3` · Video `P4` (chủ tiệm) |
| F | tài sản, bài đăng | Duyệt gói + kế hoạch đăng: `J5` |

> Không bước nào tự đăng bài hay tự trừ credit ngoài lượt người dùng bấm. Mọi lượt chạy AI trừ credit đúng một lần và có sổ `usage`.
