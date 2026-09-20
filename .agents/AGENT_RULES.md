# AGENT RULES & STANDARDS — FLORAOS CORE

Tệp này đồng bộ cùng `AGENTS.md` tại thư mục gốc của dự án. Mọi Agent và AI tương tác với codebase FloraOS bắt buộc tuân thủ 100% các nguyên tắc sau:

## 1. MODE SELECTION
- Mặc định là `[PROD]` mode: Tuyệt đối tuân thủ, không thay đổi phạm vi (zero scope creep), không tự ý refactor code không liên quan.
- Chỉ phân tích / tái cấu trúc khi user ghi rõ `[EXPLORE]`.

## 2. SRP (Single Responsibility Principle)
- 1 Đơn vị code = 1 Lý do duy nhất để thay đổi.
- Kích thước file tối đa: 350 dòng. Vượt giới hạn yêu cầu tách file theo module/hook.

## 3. AEGIS PROTECTION
- CẤM vòng lặp vô hạn (Spam/DDOS/OpenAI Quota).
- Mọi truy vấn update DB Server-Side cần thông qua `updateIfChanged()` để tránh ghi vòng lặp vô nghĩa.
- Các API gọi AI bắt buộc bọc qua `AICircuitBreaker`.

## 4. TENANT ISOLATION
- Xác minh `organization_id` / `tenant_id` phải dựa vào Database/Session chuẩn phía server, **KHÔNG BAO GIỜ** lấy trực tiếp từ `req.body` hoặc query.

## 5. NAMING CONVENTIONS
- Thư mục / File thường: `kebab-case`.
- React Components / Types / Interfaces: `PascalCase`.
- Biến / Functions / Hooks: `camelCase`.
- Hằng số: `UPPER_SNAKE_CASE`.

---

## 6. QUY TẮC HÀNH TRÌNH SẢN PHẨM RA THỊ TRƯỜNG TỪ ẢNH TẢI LÊN (FLORAOS PRODUCT-TO-MARKET USER JOURNEY)

### Tài liệu SSOT
- `docs/dac-ta/FLORAOS_PRODUCT_TO_MARKET_USER_JOURNEY.md` (14 chặng khép kín: từ `01. BRING` 📸 Tải ảnh đến `14. NEXT BEST ACTION` 🎯 Đề xuất hành động).

### Nguyên tắc thực thi
1. **Không tự động chạy mù quáng toàn bộ 14 bước**: Không phải bất kỳ lúc nào người dùng tải ảnh lên cũng chạy hết cả 14 bước trong Journey. Tùy thuộc vào từng chức năng cụ thể mà quyết định tiến hành những bước nào (ví dụ: tạo sản phẩm catalog chỉ cần 01–02; tạo ảnh studio chỉ cần 01–02–06; chiến dịch tiếp thị tổng lực mới kích hoạt chuỗi dài).
2. **BẮT BUỘC HỎI VÀ CHỐT VỚI CHỦ SẢN PHẨM TRƯỚC KHI LÀM (Mandatory Consultation Rule)**:
   - Mỗi khi thực hiện, thiết kế hoặc sửa đổi bất kỳ chức năng nào có liên quan đến việc **user upload ảnh**, Agent **BẮT BUỘC PHẢI DỪNG LẠI HỎI TRỰC TIẾP CHỦ SẢN PHẨM (USER)** để chốt xem chức năng này sẽ thực hiện những tác nghiệp gì trong journey 14 bước này.
   - **TUYỆT ĐỐI KHÔNG TỰ Ý SUY ĐOÁN**, không âm thầm nối toàn bộ hoặc tự ý cắt bớt các bước khi chưa được người dùng phê duyệt và chốt phạm vi.
