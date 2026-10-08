# Thẻ chào mẫu hoa — Báo cáo kiểm tra sẵn sàng cho ngày 20/10/2026

**Ngày kiểm:** 08/10/2026 · **Mã nguồn:** `main` @ `ec78f64` (đã gồm PR #36, #37, #38) · **Loại tài liệu:** báo cáo kiểm tra để PO duyệt, chưa sửa gì.
**Bối cảnh vận hành (PO, 08/10):** 1 tiệm, khoảng 200 đơn trong ngày 20/10, 1 Điều hành, 5–10 Sale, 2–3 Điều phối. Chưa nối API ngân hàng: Điều hành tự xem tài khoản rồi bấm xác nhận tiền.

---

## 0. Kết luận ngắn

Luồng chính chạy trọn 9 bước. Giả lập 200 đơn (30 khách đặt cùng lúc) đi hết từ đặt hoa tới ảnh người nhận, **không có lỗi nào**. Tốc độ đủ dùng. Mọi bộ kiểm thử tự động đều đạt.

**Tuy vậy, chưa nên dùng thật ngày 20/10 khi chưa xử lý 4 điểm chặn (mục 3.1):**

1. Nhân viên được mời vào tiệm **không đăng nhập được**.
2. Trang đặt hoa **tự hứa "Miễn phí giao hoa"** (và hiện cả ưu đãi "Giảm 10%") nhưng **vẫn tính đủ tiền**.
3. Mỗi lần đưa mã mới lên máy chủ thật, hệ thống **nạp lại tài khoản mẫu** có mật khẩu ghi sẵn trong mã nguồn.
4. Có thể **mất ảnh** thành phẩm và ảnh người nhận sau mỗi lần máy chủ khởi động lại, nếu kho ảnh chưa cấu hình.

---

## 1. Giải thích hai câu hỏi trước

### Câu 3 — "việc cần PO duyệt trước" là gì?

Quy định của dự án (`CLAUDE.md`) không cho tôi tự làm một số loại thay đổi. Chúng dễ gây mất dữ liệu, tốn tiền hoặc ảnh hưởng máy chủ thật. Với Thẻ chào, các việc sau phải hỏi anh/chị trước:

| Loại thay đổi | Ví dụ cụ thể trong báo cáo này | Vì sao phải hỏi |
|---|---|---|
| Sửa cấu hình máy chủ Render (`render.yaml`) | Bỏ nạp tài khoản mẫu mỗi lần triển khai (B3); chỉnh bộ nhớ máy chủ (C6) | Đụng thẳng tới máy chủ khách đang dùng |
| Sửa cấu trúc cơ sở dữ liệu | Chưa cần cho các mục dưới đây | Lúc triển khai, máy chủ tự ép cấu trúc mới; sai một bước là mất dữ liệu |
| Thêm dịch vụ trả phí hoặc thư viện mới | Gửi Zalo ZNS / SMS cho khách (C4); ô "tôi không phải người máy" | Phát sinh chi phí, cần tài khoản bên thứ ba |
| Đổi quyền hạn (ai được làm gì) | Chỉ Điều hành được xác nhận tiền (C2) | Ảnh hưởng an toàn tiền |

Các việc sửa lỗi bình thường trong mã thì tôi làm được sau khi anh/chị duyệt danh sách.

### Câu 4 — "khách đặt cọc thì đơn nhảy thẳng tới bước 5" thuộc quy trình nào?

Đây là màn **"Theo dõi tiến độ"**, gồm 9 bước. Trong đó bước 4 là *khách báo đã chuyển khoản*, bước 5 là *Điều hành xác nhận tiền về*.

Tiệm có thể bật **đặt cọc** (ví dụ khách chỉ chuyển trước 30%). Khi Điều hành xác nhận khoản cọc, đơn hiện ở bước 5 **giống hệt đơn đã trả đủ**. Nhìn vào bước, không biết đơn còn nợ (số tiền còn nợ thì vẫn hiện ở cột tiền).

→ Anh/chị cho biết quy trình là *khách chuyển đủ 100%, Điều hành kiểm tài khoản rồi xác nhận*. Nếu không bật đặt cọc thì **điểm này không ảnh hưởng ngày 20/10**, giữ nguyên.

Tôi đã kiểm đúng quy trình đó. Khách bấm "Tôi đã chuyển khoản" → Hộp việc của Điều hành báo *"Đối chiếu và xác nhận tiền"* → Điều hành bấm *Thu tiền → Ghi nhận đã nhận tiền* → trang của khách đổi sang *"Đã thanh toán"*. Luồng chạy đúng.

### Câu 5 (ảnh) — tôi tự kiểm

Ảnh Điều phối chụp (thành phẩm, người nhận) **chỉ được lưu và hiện cho khách**. Ảnh không đi qua AI hay chặng xử lý ảnh nào. Bằng chứng: `POST /api/v1/assets` chỉ ghi bản ghi, không tạo việc nền.

---

## 2. Đã kiểm tra những gì

Môi trường staging dựng riêng: Postgres 16, bản build production, dữ liệu giả. Không đụng máy chủ thật.

| Hạng mục | Kết quả |
|---|---|
| Kiểu dữ liệu, ESLint (so với nợ cũ), quy chuẩn giao diện | Đạt, không có lỗi mới (45 lỗi ESLint cũ, nợ #172) |
| Kiểm thử đơn vị `npm test` | 244/244 tệp · 1.771/1.771 ca đạt |
| Kiểm thử "tiệm này không nhìn được tiệm kia" `test:tenant` · `test:platform` | 386/386 · 13/13 đạt |
| Đối chiếu tài liệu với mã (`check:docs`) · build production | Đạt |
| Kiểm thử trình duyệt có sẵn `brochure-swipe` (E2E) | **1/11 — đỏ ngay trên `main`.** Đây là lỗi của bài kiểm thử, không phải của sản phẩm: bài này viết trước khi có cơ chế "chủ phiên" nên gọi API mà không nhận phiên. Tôi đã thay bằng kiểm thử bấm tay ở dòng dưới. |
| **Giả lập ngày lễ 200 đơn** (8 Sale, 3 Điều phối, 1 Điều hành; 30 khách đặt cùng lúc; nhân viên làm mới Hộp việc liên tục) | 200/200 đơn hoàn tất. 0 lỗi. Bấm "Đặt hoa" 2 lần vẫn ra 1 đơn. Điều hành bấm xác nhận 2 lần chỉ thu 1 lần (lần sau báo 409). Đặt lại ở link chung không tạo đơn trùng. 400 ảnh tải lên đều thành công. Phễu doanh thu đúng 25/25 đơn mỗi Sale. |
| Thời gian phản hồi khi đông (p95) | Đặt hoa 1,5 giây · mở trang khách 1,6 giây · Hộp việc / Theo dõi 1,7 giây · thao tác Điều phối dưới 0,35 giây |
| Bộ nhớ máy chủ | Để như cấu hình Render hiện tại: lên khoảng **800 MB**. Giới hạn heap 320 MB: đỉnh **416 MB**, vẫn chạy đủ 200 đơn (xem C6). |
| Bấm thử bằng trình duyệt ở khổ điện thoại | **Khách:** mở link → lướt mẫu → điền đơn → xem lại → QR → báo chuyển khoản → theo dõi → xem và xác nhận ảnh → ảnh người nhận. **Điều hành** (máy tính): Hộp việc → Thu tiền. **Điều phối** (điện thoại): giao thợ → ảnh thành phẩm → giao ship → ảnh người nhận. Tất cả chạy được. |

---

## 3. Danh sách vấn đề

Ký hiệu: **B** = chặn, phải xử lý trước 20/10 · **C** = cao, ảnh hưởng rõ trong ngày lễ · **T** = trung bình · **N** = nhỏ.
Cột "PO quyết" = cần anh/chị chọn hướng trước khi làm.

### 3.1 Mức B — chặn

**B1. Nhân viên được mời không đăng nhập được.**
- *Hiện tượng:* "Mời nhân viên" tạo tài khoản **không có mật khẩu**, trạng thái "đã mời" mãi mãi. Không có bước nhận lời mời. "Quên mật khẩu?" chỉ hiện dòng *"chưa hỗ trợ… liên hệ quản trị"*. Điều hành cũng không có nút đặt lại mật khẩu cho nhân viên.
- *Ảnh hưởng:* 5–10 Sale và 2–3 Điều phối không vào được. Dùng chung một tài khoản cũng không được, vì mỗi tài khoản chỉ giữ một phiên đăng nhập: người sau đăng nhập thì người trước bị đẩy ra.
- *Bằng chứng:* giả lập, nhân viên vừa mời đăng nhập → HTTP 401. Mã: `src/modules/organization/use-cases/invite-member.ts:20,46`; `log-in.ts:50` (thu hồi phiên cũ).
- *Hướng xử lý:* Điều hành đặt mật khẩu tạm cho nhân viên ngay ở màn Thành viên (dùng năng lực `A7` đã khai, chưa có màn), và thành viên chuyển sang "đang hoạt động". Không cần sửa cấu trúc dữ liệu. *Nếu trên máy chủ thật nhân viên đã có tài khoản dùng được (tạo bằng cách khác) thì cho tôi biết, mục này hạ xuống mức C.*

**B2. Trang đặt hoa tự hứa "Miễn phí giao hoa" nhưng vẫn tính tiền ship. Ưu đãi "Giảm 10%" cũng không trừ tiền.** — PO quyết
- *Hiện tượng:* Tiệm chưa cài ưu đãi nào thì form vẫn hiện **9 ưu đãi mẫu** và **tự chọn sẵn "Miễn phí giao hoa"**. Màn "Xem lại đơn" ghi *Ưu đãi: Miễn phí giao hoa* nhưng ngay trên đó vẫn có *Phí giao 30.000 đ*. Tổng tiền và mã QR đều tính cả ship. Chọn "Giảm 10%" hay "voucher 50.000đ" cũng chỉ được ghi chú cho xưởng, không trừ tiền. Hộp "Thu tiền" của Điều hành không hiện ưu đãi khách đã chọn.
- *Ảnh hưởng:* khách chuyển khoản theo QR rồi thấy bị tính ship dù trang ghi miễn phí → khiếu nại, phải hoàn tiền tay. Trong giả lập: **200/200 đơn** ghi "Miễn phí giao hoa" nhưng đều bị tính ship 30–50 nghìn.
- *Bằng chứng:* `src/modules/greeting-card/domain/store-policy.ts:38,80,138`; `order-policies.ts:33`; ảnh chụp màn hình xem lại đơn và hộp Thu tiền.
- *Hướng xử lý (chọn một):*
  - (a) Chỉ hiện ưu đãi tiệm **chủ động bật**, bỏ danh sách mẫu tự hiện. Ưu đãi chỉ được là "tặng kèm" (thiệp, phụ kiện…), không đụng tới tiền.
  - (b) Ưu đãi có số tiền ("Miễn phí ship", "Giảm 10%") **trừ thật** vào tổng và QR, giá do máy chủ tính lại. Đồng thời hiện ưu đãi trong hộp Thu tiền.
  - Đề xuất: (a) cho ngày 20/10 vì nhanh và an toàn; (b) làm sau.

**B3. Mỗi lần đưa mã mới lên Render, máy chủ thật nạp lại tài khoản mẫu có mật khẩu ghi sẵn trong mã nguồn.** — PO quyết (sửa `render.yaml`)
- *Hiện tượng:*
  - `render.yaml` để `SEED_DEV_DATA="true"` và lệnh build có `npm run db:seed`.
  - Mỗi lần triển khai đều tạo lại hoặc **đặt lại mật khẩu** cho 2 tài khoản Điều hành của tổ chức "Tiệm Hoa Mộc Lan (Dev)". Mật khẩu này nằm công khai trong `prisma/seed/dev-shop-moclan.ts`.
  - Mỗi lần triển khai cũng ghi đè hồ sơ, sản phẩm và giá của tổ chức đó.
  - Ngoài ra Render đang bật `autoDeploy`: mọi lần gộp vào `main` đều triển khai lại, máy chủ khởi động lại và chạy `db push --accept-data-loss`.
- *Ảnh hưởng:* ai đọc được mã nguồn đều vào được tổ chức đó với quyền Điều hành. Nếu tiệm thật chính là tổ chức "Mộc Lan (Dev)" thì giá và sản phẩm bị ghi đè sau mỗi lần triển khai. Triển khai giữa ngày lễ thì đang thao tác sẽ bị gián đoạn.
- *Bằng chứng:* `render.yaml:13,16,25`; `prisma/seed.ts:31`; `prisma/seed/dev-shop-moclan.ts:84-96`.
- *Hướng xử lý:* tắt nạp dữ liệu mẫu trên máy chủ thật, đổi mật khẩu hai tài khoản đó, **ngừng gộp vào `main` từ 18/10 đến 21/10**.

**B4. Ảnh thành phẩm và ảnh người nhận có thể mất sau mỗi lần máy chủ khởi động lại.** — anh/chị tự kiểm trên Render
- *Hiện tượng:* thiếu 4 biến `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` thì ảnh lưu vào ổ đĩa tạm của máy chủ. Máy chủ báo rõ: *"ảnh mất sau mỗi lần triển khai lại"*. Từ đây tôi không xem được Render đã khai 4 biến này chưa.
- *Bằng chứng:* `src/modules/assets/adapters/storage-provider-factory.ts:45`; nhật ký staging.
- *Hướng xử lý:* vào Render → floraos-web → Environment, kiểm tra đủ 4 biến (Cloudflare R2 hoặc S3). Nếu thiếu thì phải khai trước 20/10.

### 3.2 Mức C — cao

**C1. Khách mở lại link riêng bằng trình duyệt hay máy khác thì bị chặn, không xem được đơn của mình.**
- *Hiện tượng:* link riêng `/b/…` chỉ dùng được trên trình duyệt mở đầu tiên. Ví dụ: mở trong Zalo rồi chuyển sang Safari/Chrome, mở trên Zalo máy tính rồi sang điện thoại, hay chuyển link cho người nhà chuyển khoản hộ. Các trường hợp đó đều thấy *"Link này đã được mở trên thiết bị khác… liên hệ để nhận link mới"*. Khách không xem được QR, tiến độ hay ảnh. Ô tra cứu bằng mã đơn và 4 số cuối điện thoại chỉ nằm **bên trong** trang của chủ phiên, không có trang tra cứu riêng. Link theo dõi gửi qua Zalo/SMS (nếu bật) cũng là `/b/…` nên cũng bị chặn.
- *Bằng chứng:* `src/app/b/[sendCode]/page.tsx:55-63`; `use-cases/notify-customer.ts:64`; ảnh chụp màn hình.
- *Hướng xử lý:* trình duyệt khác mở link của phiên **đã có đơn** thì hiện **ô xác minh 4 số cuối điện thoại**. Đúng thì xem được đơn và QR, sai thì giữ chặn như cũ. Dùng lại luật xác minh đã có (giới hạn 5 lần mỗi 15 phút).

**C2. Sale và Điều phối đang được quyền xác nhận tiền — khác quy trình anh/chị nêu (chỉ Điều hành).** — PO quyết
- *Hiện tượng:* quyền `R9` "ghi nhận thu tiền" mặc định cấp cho cả Điều hành, Điều phối và Sale. Vì vậy tab "Điều hành" (có nút Thu tiền) hiện cho cả Sale lẫn Điều phối. Có API chỉnh quyền từng vai nhưng **không có màn hình**.
- *Bằng chứng:* `src/core/rbac/capability-catalog.ts:226`; `src/app/api/v1/roles/[id]/capabilities/route.ts`.
- *Hướng xử lý:* với tiệm này, gỡ `R9` khỏi vai Sale và Điều phối (đổi cấu hình tổ chức, không đổi mã), hoặc thêm màn bật/tắt quyền. Lưu ý PO đã chốt ngày 06/10 là *"giữ R9 cho Sale/Điều phối"*, nên cần anh/chị xác nhận lại.

**C3. Tab Điều phối chỉ tải 20 đơn mới nhất. Số "Cần tôi làm / Đang làm / Xong" chỉ đếm trong 20 đơn đó.**
- *Hiện tượng:* với hơn 200 đơn, đơn đặt sớm (vài ngày trước 20/10) nằm khuất, phải bấm "Tải thêm đơn" nhiều lần mới thấy. Danh sách cũng không xếp theo ngày và khung giờ giao. Trong giả lập, tab hiện *"Xong (9)"* trong khi thực tế có 200 đơn đã xong.
- *Bằng chứng:* `src/components/greeting-card/coordinator/coordinator-brochure-tab.tsx:19,37`.
- *Hướng xử lý:* đếm và lọc ở máy chủ (như tab Theo dõi đang làm), mặc định xếp theo giờ giao gần nhất, mỗi lần tải tối đa 100 đơn.

**C4. Khách không nhận được tin "đã xác nhận chuyển khoản" nếu tiệm chưa bật Zalo ZNS hoặc SMS.** — PO quyết
- *Hiện tượng:* sau khi Điều hành xác nhận, khách chỉ thấy *"Đã thanh toán"* khi đang mở trang hoặc mở lại link (trang tự hỏi lại máy chủ định kỳ). Muốn có tin nhắn thì phải có tài khoản Zalo OA + mẫu ZNS đã duyệt (Zalo thường duyệt mất vài ngày làm việc) hoặc tài khoản eSMS.
- *Hướng xử lý:* nếu cần tin nhắn cho 20/10 thì phải đăng ký **ngay**. Nếu không, tôi đề xuất trang khách hiện rõ dòng *"Cửa hàng đã nhận tiền"* kèm giờ, và Sale nhắn Zalo tay.

**C5. Bất kỳ Sale nào cũng xoá được mẫu khỏi bộ sưu tập chung chỉ với một chạm, không có hỏi lại.**
- *Hiện tượng:* ở "Gửi nhanh" bước 1, mỗi ảnh mẫu có nút xoá **ẩn** (chỉ hiện khi rê chuột). Trên điện thoại, chạm vào góc phải ảnh là xoá ngay, không hỏi lại. Mẫu biến mất khỏi **mọi link đã gửi**. Sale cũng đổi được giao diện của cả bộ sưu tập.
- *Bằng chứng:* `src/components/greeting-card/catalog/catalog-product-picker.tsx:34,94-99`. Màn Quản lý thì có hỏi lại (`catalog-detail-panel.tsx:53`).
- *Hướng xử lý:* hỏi lại trước khi xoá. Ở "Gửi nhanh", Sale chỉ chọn bộ sưu tập, không sửa được nội dung.

**C6. Máy chủ Render có thể hết bộ nhớ và tự khởi động lại giữa ngày lễ.** — PO quyết (`render.yaml` hoặc gói Render)
- *Hiện tượng:* `render.yaml` ghi gói `starter`. Theo bảng giá Render, gói này có 512 MB RAM; tôi không xem được gói thật trên tài khoản. Biến `NODE_OPTIONS=--max-old-space-size=2048` cho phép tiến trình phình quá 512 MB trước khi dọn bộ nhớ. Đo trên staging: để như cấu hình hiện tại thì lên khoảng 800 MB. Giới hạn heap 320 MB thì đỉnh 416 MB và vẫn chạy đủ 200 đơn.
- *Hướng xử lý:* nâng gói Render cho dịp lễ, hoặc hạ giới hạn heap về khoảng 384 MB cho đúng gói 512 MB.

**C7. Tiệm mới có sẵn hồ sơ mẫu "Tiệm Hoa Mộc Lan", số điện thoại 0900123456 và địa chỉ mẫu — khách thấy ngay trên trang đặt hoa.**
- *Hiện tượng:* tên, nút Zalo/Gọi và địa chỉ ở đầu trang khách lấy từ Hồ sơ tiệm. Hồ sơ chưa sửa thì khách thấy thông tin mẫu và gọi nhầm số.
- *Hướng xử lý:* anh/chị kiểm Hồ sơ tiệm trên máy chủ thật (mục 4). Về sau sẽ chặn gửi link khi hồ sơ còn là dữ liệu mẫu.

**C8. Không giới hạn số đơn theo khung giờ, không trừ tồn kho khi khách đặt.** — PO quyết
- *Hiện tượng:* 200 đơn có thể dồn vào cùng 1–2 khung giờ, vượt sức 2–3 Điều phối và thợ. Mẫu chỉ ẩn khi tiệm **tự** đánh dấu hết hàng.
- *Hướng xử lý:* tối thiểu cho 20/10 là Điều hành tắt khung giờ đã đủ đơn (cài đặt giao hàng đã có sẵn). Về sau: đặt trần số đơn cho mỗi khung giờ.

### 3.3 Mức T — trung bình

| # | Vấn đề | Bằng chứng | Hướng xử lý |
|---|---|---|---|
| T1 | Duyệt "đề xuất huỷ/hoàn" (mới thêm ở PR #36) có các lỗ: huỷ được cả đơn **đã giao xong**; huỷ xong không trả lại mã giảm giá và không báo khách; hai lần hoàn cùng lúc có thể ghi đè số đã thu (thiếu khoá); Sale "chỉ khách của mình" vẫn đề xuất huỷ được đơn của Sale khác | `infra/cancellation-repository.ts:41,95,151,163` | Dùng chung luật huỷ/hoàn đã có ở `brochure-payment-repository.ts` (khoá theo số đã thu, chặn đơn đã giao, trả mã giảm giá); kiểm phạm vi Sale |
| T2 | Tab Điều hành không có ô tìm theo mã đơn hoặc số điện thoại để đối chiếu sao kê; cột trạng thái không phân biệt "khách đã báo chuyển" với "chưa báo" (chỉ Hộp việc có) | `admin/admin-brochure-payment-tab.tsx` | Thêm ô tìm; thêm nhãn "Khách báo đã chuyển" |
| T3 | Điều phối vào Thẻ chào thì rơi vào chế độ "Gửi nhanh" (của Sale), phải bấm thêm 2 lần mới tới việc của mình | Bấm thử trên điện thoại | Mở thẳng tab theo vai |
| T4 | Kiểm thử E2E `brochure-swipe` đỏ trên `main` vì chưa cập nhật theo cơ chế chủ phiên; màn Thẻ chào chưa có kiểm thử giao diện tự động | Chạy `playwright` ngày 08/10 | Sửa bài kiểm thử và thêm bước nhận phiên |

### 3.4 Mức N — nhỏ

- **N1.** Danh sách Phường/Xã dùng **tên cũ trước sáp nhập 7/2025** (63 tỉnh, ví dụ "Phường Bến Nghé (Quận 1)"). Có ô "Khác (tự nhập tay)" nên khách vẫn đặt được.
- **N2.** Mã đơn lấy ngày theo giờ quốc tế (UTC): đơn đặt từ 0h đến 7h sáng mang ngày hôm trước. Trang khách có lỗi lệch giờ khi dựng trang (React #418, chỉ hiện trong console, không hỏng chức năng).
- **N3.** Thiếu biểu tượng trang (favicon trả 404).
- **N4.** Trang khách dùng tên vai nội bộ ("Đang chờ **Điều hành** cửa hàng đối soát"). Thẻ mẫu hiện mã sản phẩm nội bộ (tắt được ở "Thông tin hiển thị").
- **N5.** Với ảnh thành phẩm, khách chỉ có nút "Tôi đồng ý", không có nút "Cần chỉnh" (phải nhắn Zalo).
- **N6.** `customer/brochure-tracking-view.tsx` dài 353 dòng (quy định tối đa 350).

---

## 4. Anh/chị cần tự kiểm trên máy chủ thật (tôi không vào được)

1. Render → floraos-web → **Environment**: đủ 4 biến `STORAGE_*` (B4); giá trị `NODE_OPTIONS`; gói máy chủ đang dùng (C6).
2. Đăng nhập tài khoản Điều hành của tiệm, vào **Hồ sơ tiệm**: tên, số điện thoại, Zalo, địa chỉ là của tiệm thật (C7).
3. Thẻ chào → Điều hành → **Cài đặt**: tài khoản ngân hàng nhận tiền đúng (số TK, tên chủ TK); khu vực và phí ship; giờ chốt đơn; khung giờ giao.
4. Thử chuyển khoản thật 10.000 đ bằng QR từ 2–3 ngân hàng khác nhau (QR do dịch vụ ngoài `img.vietqr.io` vẽ).
5. Trên điện thoại thật: mở link trong **Zalo**, đặt thử, thoát Zalo rồi mở lại link từ Zalo, kiểm vẫn thấy đơn.

## 5. Câu hỏi cần anh/chị trả lời để lập kế hoạch

1. Trên máy chủ thật, 1 Điều hành + Sale + Điều phối **đã có tài khoản đăng nhập được chưa**? Nếu có, tạo bằng cách nào (B1)?
2. Tiệm thật là tổ chức nào trên máy chủ? Có phải "Tiệm Hoa Mộc Lan (Dev)" không (B3)?
3. Ưu đãi cho 20/10: chọn hướng (a) chỉ tặng kèm, hay (b) trừ tiền thật? Tiệm muốn giữ những ưu đãi nào (B2)?
4. Tiệm thu **đủ 100%** hay có **đặt cọc**? (Nếu 100% thì câu 4 ở trên không cần sửa.)
5. Có muốn chỉ Điều hành mới xác nhận tiền không? Tức là bỏ quyết định ngày 06/10 (C2).
6. Có tài khoản Zalo OA / eSMS không, hay chấp nhận chỉ báo trên trang và Sale nhắn tay (C4)?
7. Có cần trần số đơn cho mỗi khung giờ không? Nếu cần thì bao nhiêu đơn mỗi khung (C8)?
8. Đồng ý ngừng gộp mã vào `main` từ 18/10 đến 21/10 không (B3)?

## 6. Chưa kiểm được

- Máy chủ Render thật, tài khoản ngân hàng thật, quét QR thật (môi trường staging chặn mạng ra `img.vietqr.io`, nên trang chỉ hiện số tài khoản thay ảnh QR).
- Gửi Zalo ZNS / SMS thật (tiệm chưa cấu hình).
- Trình duyệt trong app Zalo trên iPhone/Android thật (tôi dùng Chromium giả lập iPhone 13).
- Tải lớn hơn một máy chủ (Render chạy một tiến trình web; giới hạn tần suất dùng Redis).
