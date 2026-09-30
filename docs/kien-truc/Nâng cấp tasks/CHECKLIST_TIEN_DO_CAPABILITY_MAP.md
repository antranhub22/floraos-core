# CHECKLIST TIẾN ĐỘ TRIỂN KHAI CAPABILITY MAP FLORAOS
> **Nhánh Git:** `feat/capability-map-expansion`  
> **Cập nhật lúc:** 30/09/2026 (Sau khi hoàn tất GÓI A, GÓI B và các hạng mục cốt lõi GÓI C)  
> **Bảo đảm:** 1.432/1.432 Unit Tests XANH (178 tệp) · 283/283 Tenant Tests XANH (36 tệp) · 0 lỗi Typecheck · 0 lỗi UX Lint

---

## 📊 BẢNG TỔNG HỢP TIẾN ĐỘ THEO CÁC GÓI

| Gói | Tên Gói | Trọng tâm | Trạng thái | Số hạng mục đã xong |
|---|---|---|:---:|:---:|
| **GÓI A** | Core Revenue Flow & Quick Wins | Dòng tiền bán hàng & Nền tảng điều phối | **HOÀN THÀNH 100%** | 5 / 5 |
| **GÓI B** | Network Operation & Smart CRM | SLA cảnh báo trễ, Chăm sóc Zalo, Xuất đa tỉ lệ & Báo cáo | **HOÀN THÀNH 100%** | 4 / 4 |
| **GÓI C** | Financial Ledger & Advanced Automation | Sổ cái đối soát tài chính, Studio 5 Tone giọng & Tự động hóa | **ĐANG TRIỂN KHAI** | 2 / 5 |

---

## 🚀 CHI TIẾT GÓI A: CORE REVENUE FLOW & QUICK WINS (100% HOÀN TẤT)

- [x] **1. [Shop] Nối Báo giá → Đơn hàng (`BH-15`, `BH-03`, `DH-02`)**
  - **Mã nguồn:** `src/components/sales/pricing-calculator-card.tsx`
  - **Mô tả:** 1-click chuyển toàn bộ công thức cành hoa Atomic BOM (tên hoa, số cành, màu sắc, phụ kiện gói) từ Báo giá thành Đơn hàng thực tế trong modal tạo đơn.
- [x] **2. [Platform] Bảng cảnh báo Quota AI & Bật tắt tính năng Tenant (`TN-08`, `AI-05`)**
  - **Mã nguồn:** `src/components/dashboard/platform-admin-command-center.tsx`
  - **Mô tả:** 3 KPI thời gian thực (Credit AI, số lượt gọi, tổ chức hoạt động), hộp cảnh báo tổ chức vượt ngưỡng 80% quota & bộ lọc tính năng AI.
- [x] **3. [Shop] Thư viện kịch bản chốt đơn nhanh (`KB-01` → `KB-14`)**
  - **Mã nguồn:** `src/modules/sales/domain/sales-scripts-catalog.ts`, `src/components/sales/sales-script-library-modal.tsx`
  - **Mô tả:** 14 kịch bản thực chiến ngành hoa (chào hỏi, dịp tặng, tư vấn ngân sách, xử lý chê đắt, chốt cọc, xin lỗi giao chậm, xin review). Tích hợp vào Thẻ chào khách A6 với nút copy 1-chạm.
- [x] **4. [Shop] Tiếp nhận đơn cắm hoa & In phiếu (`DH-01`, `DH-05`)**
  - **Mã nguồn:** `src/app/(app)/don-hang/page.tsx`
  - **Mô tả:** Khép kín giao diện điều hành đơn, khắc phục anti-pattern A1 (`console.error`), xác nhận 3 lát cắt vai trò (Điều hành, Thợ cắm hoa ẩn giá, Shipper & Thiệp A6).
- [x] **5. [Điện hoa] Hoàn thiện Danh bạ đối tác xưởng & Phân bổ đơn (`DT-01` → `DT-06`)**
  - **Mã nguồn:** `src/components/coordinator/partner-management-modal.tsx`, `partner-card.tsx`, `partner-create-form.tsx`
  - **Mô tả:** Modal quản lý đối tác chuẩn Clean Architecture, tìm kiếm quận/huyện, lọc cấp bậc (`STANDARD`, `PREFERRED`, `VIP`), hạn mức đơn/ngày, bật/tắt nhận đơn.

---

## 🛠️ CHI TIẾT GÓI B: NETWORK OPERATION & SMART CRM (100% HOÀN TẤT)

- [x] **1. [Điện hoa] Hệ thống SLA & Cảnh báo trễ đơn thông minh (`P5` → `P8`, `SC-01` → `SC-06`)**
  - **Mã nguồn:** `src/modules/coordinator/domain/sla-monitor.ts`, `src/components/coordinator/sla-monitor-panel.tsx`, `sla-monitor-modal.tsx`
  - **Mô tả:**
    - Phân loại 3 mức SLA: `ON_TRACK` (Đúng hạn), `NEAR_BREACH` (Sắp trễ < 30 phút), `BREACHED` (Đã quá hạn).
    - Bộ luật AI đề xuất hành động tái điều phối tự động: Chuyển xưởng dự phòng gần nhất (<3km), cảnh báo xưởng cắm hoa, duyệt QC hoả tốc, liên hệ shipper.
    - Báo cáo tổng hợp tuân thủ SLA toàn mạng lưới và phân tích hiệu suất theo từng đối tác xưởng ngoài (`SC-06`).
    - Thẻ KPI thời gian thực và modal chi tiết tích hợp vào `FlowerNetworkCommandCenter` (tuân thủ SRP 349 dòng / ≤ 350 dòng).
- [x] **2. [Shop] CRM Chăm sóc tự động ngày kỷ niệm/sinh nhật (`CRM-08` → `CRM-12`)**
  - **Mã nguồn:** `src/modules/crm/domain/crm-care-scripts.ts`, `src/components/crm/occasion-care-panel.tsx`
  - **Mô tả:**
    - Phân loại mức độ khẩn cấp tự động theo ngày: `TODAY` (Hôm nay), `URGENT` (≤ 3 ngày), `SOON` (4–7 ngày), `UPCOMING`.
    - Sinh kịch bản Zalo chăm sóc cá nhân hóa theo từng khách hàng, ngày kỷ niệm, người nhận và đặc quyền khách thân thiết (`VIP`/`GOLD`).
    - Gợi ý mẫu hoa theo dịp (sinh nhật, ngày cưới, khai trương, 8/3, 20/10...) kết hợp gu sở thích đã lưu của khách hàng.
    - Tích hợp vào màn hình Khách hàng CRM với nút Copy Zalo 1-chạm và gọi điện nhanh.
- [x] **3. [Shop] Tối ưu hóa bộ xuất Video/Ảnh chuẩn tỉ lệ mạng xã hội (`HA-05..10`, `VD-05..07`)**
  - **Mã nguồn:** `src/modules/media/domain/media-export-presets.ts`, `src/components/media/media-export-modal.tsx`
  - **Mô tả:**
    - Bộ 6 preset xuất chuẩn mạng xã hội: TikTok/Reels/Shorts (`9:16`), Story (`9:16`), Feed Vuông (`1:1`), Feed Dọc (`4:5`), YouTube/Banner (`16:9`), Zalo Shop (`1:1`).
    - Chuẩn hóa tên file tự động theo slug tiếng Việt không dấu kèm nền tảng và tỉ lệ.
    - Kiểm định thời lượng video theo khuyến nghị từng kênh.
    - Modal tải xuống 1-chạm (`PNG`, `JPEG`, `MP4`) và sao chép link gốc.
- [x] **4. [Platform & Shop] Báo cáo hiệu năng kinh doanh & Doanh số (`BC-01` → `BC-06`)**
  - **Mã nguồn:** `src/modules/orders/domain/business-reporting.ts`, `src/components/dashboard/business-performance-card.tsx`
  - **Mô tả:**
    - 4 thẻ KPI thời gian thực: Tổng doanh thu (GMV), Tỷ lệ hoàn tất đơn (%), Đơn đang xử lý, Credit AI tiêu thụ.
    - Xếp hạng Top 5 mẫu hoa & sản phẩm doanh số cao nhất.
    - Nút in nhanh và nút Xuất CSV có hỗ trợ tiếng Việt UTF-8 BOM.
    - Tích hợp trực tiếp vào màn hình Số liệu Analytics (`/so-lieu`).

---

## 💎 CHI TIẾT GÓI C: FINANCIAL LEDGER & ADVANCED AUTOMATION (ĐANG TRIỂN KHAI)

- [x] **1. [Điện hoa] Sổ cái đối soát tài chính, công nợ 2 chiều, phân tích chi phí gia công (`TC-01` → `TC-06`)**
  - **Mã nguồn:** `src/modules/coordinator/domain/partner-settlement.ts`, `src/components/coordinator/partner-settlement-modal.tsx`, `partner-card.tsx`, `partner-management-modal.tsx`
  - **Mô tả:**
    - Tính toán tiền công gia công theo kiểu cắm hoa (`BO_HOA`, `GIO_HOA`, `LANG_HOA`, `KE_KHAI_TRUONG`, `HOA_CUOI`, `HOA_VIENG`), tự động áp dụng phụ cấp giao gấp (<2h) và dịp lễ tết (8/3, 20/10).
    - Tổng hợp kỳ đối soát theo xưởng ngoài (`2026-W39`), đối soát 4 trạng thái (`CHO_DOI_SOAT`, `DA_DOI_SOAT`, `DA_THANH_TOAN`, `TRANH_CHAP`), tính tiền thưởng và phạt vi phạm SLA.
    - Phân tích tỷ suất lợi nhuận gộp mạng lưới điều phối (`calculateNetworkMargin`) với ngưỡng an toàn ≥ 25%.
    - Xuất bảng kê đối soát định dạng CSV có ký tự UTF-8 BOM chuẩn tiếng Việt cho Excel.
    - Nút "Sổ đối soát" tích hợp trực tiếp trên từng thẻ xưởng đối tác trong Modal Danh bạ Đối tác.
- [x] **2. [Shop] Bộ sinh nội dung bán hoa theo 5 tone giọng chuyên nghiệp (`ND-01` → `ND-10`)**
  - **Mã nguồn:** `src/modules/content-engine/domain/flower-content-presets.ts`, `src/components/content/flower-content-studio-modal.tsx`, `src/app/(app)/noi-dung/page.tsx`
  - **Mô tả:**
    - 5 Sắc thái giọng văn chuyên nghiệp: Sang trọng & Tinh tế, Ấm áp & Chân thành, Trẻ trung & Bắt trend, Trang nghiêm & Lịch sự, Thuyết phục & Chốt sale.
    - Sinh nội dung đa nền tảng: Bài viết Facebook (`ND-01`), Caption Instagram thẩm mỹ (`ND-02`), Mô tả sản phẩm website (`ND-04`), Quảng cáo Facebook Ads (`ND-05`), Trạng thái ngắn Story/Zalo (`ND-08`), Kịch bản quay video TikTok 30s với 3 phân cảnh chi tiết (`ND-10`).
    - Gợi ý hashtag thông minh theo slug không dấu, bộ đếm ký tự thời gian thực, nút Copy 1-chạm và Live Social Preview.
    - Nút "Studio 5 Tone giọng" tích hợp trực tiếp trên thanh công cụ của Xưởng nội dung AI (`/noi-dung`).
- [ ] **3. [Platform] Cổng thanh toán gói cước tự động (PayOS / VietQR PRO)**
- [ ] **4. [Shop] AI Vector search sản phẩm tương đồng & Tìm theo ngân sách (`SP-18, 19`, `BH-04`)**
- [ ] **5. [Shop] Đăng bài tự động đa kênh trực tiếp qua API mạng xã hội**
