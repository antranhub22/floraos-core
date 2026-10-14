# Bản Đồ Tính Năng Production — FloraOS

> **Ngày tạo**: 10/10/2026
> **Mục đích**: Mô tả chi tiết 100% nội dung của 10 mục sidebar đang hoạt động trên môi trường production, giúp Chủ sản phẩm nắm tường tận cấu trúc, tính năng, luồng nghiệp vụ, quyền truy cập và trạng thái hoàn thiện.
> **Phạm vi**: Chỉ các tính năng **đã mở khóa** trên production (`NEXT_PUBLIC_APP_ENV=production`). Các tính năng bị khóa "Sắp ra mắt" không nằm trong tài liệu này.

---

## 1. Danh sách 10 mục sidebar hoạt động

| # | Nhóm | Tên mục | Đường dẫn | Tài liệu chi tiết |
|---|---|---|---|---|
| 1 | — | Trang chủ | `/` | [01-trang-chu.md](./01-trang-chu.md) |
| 2 | Bán hàng & Khách | Đơn hàng | `/don-hang` | [02-don-hang.md](./02-don-hang.md) |
| 3 | Bán hàng & Khách | Thẻ chào mẫu hoa | `/the-chao` | [03-the-chao.md](./03-the-chao.md) |
| 4 | Sản phẩm | Sản phẩm & Giá | `/san-pham` | [04-san-pham-va-gia.md](./04-san-pham-va-gia.md) |
| 5 | Sản phẩm | Tạo mẫu hoa mới | `/san-pham/tao-moi` | [05-tao-mau-hoa-moi.md](./05-tao-mau-hoa-moi.md) |
| 6 | Sản phẩm | Nhập từ Excel & Ảnh | `/san-pham/nhap-hang-loat` | [06-nhap-tu-excel.md](./06-nhap-tu-excel.md) |
| 7 | Sản phẩm | Quét ảnh hoa | `/tai-anh` | [07-quet-anh-hoa.md](./07-quet-anh-hoa.md) |
| 8 | Sản phẩm | Kho dữ liệu | `/kho-du-lieu` | [08-kho-du-lieu.md](./08-kho-du-lieu.md) |
| 9 | Thiết lập | Hồ sơ cửa hàng | `/ho-so` | [09-ho-so-cua-hang.md](./09-ho-so-cua-hang.md) |
| 10 | Thiết lập | Cài đặt | `/cai-dat` | [10-cai-dat.md](./10-cai-dat.md) |

---

## 2. Ma trận liên kết chéo giữa các mục

```
┌──────────────┐     tạo đơn từ     ┌──────────────┐    gửi link chào    ┌──────────────┐
│  Trang chủ   │────────────────────▶│   Đơn hàng   │◀───────────────────│  Thẻ chào    │
│     (/)      │  Journey Card       │  (/don-hang) │   đơn từ brochure  │  (/the-chao) │
└──────┬───────┘                     └──────┬───────┘                     └──────┬───────┘
       │                                    │                                    │
       │ journey: "Tạo thẻ sản phẩm"       │ chọn sản phẩm                     │ lấy mẫu hoa
       ▼                                    ▼                                    ▼
┌──────────────┐     liên kết sang   ┌──────────────┐                     ┌──────────────┐
│ Quét ảnh hoa │◀───────────────────│ Sản phẩm &   │                     │  Kho dữ liệu │
│  (/tai-anh)  │  nút "Phân tích AI"│   Giá        │                     │ (/kho-du-lieu)│
└──────┬───────┘                     │  (/san-pham) │                     └──────┬───────┘
       │                             └──────┬───────┘                            │
       │ lưu kết quả                        │                                   │ xem ảnh đã
       │ phân tích                          │ tạo mới                           │ phân tích
       ▼                                    ▼                                    │
┌──────────────┐                     ┌──────────────┐                            │
│  Kho dữ liệu │                     │ Tạo mẫu hoa │                            │
│ (/kho-du-lieu)│                     │   mới        │◀───────────────────────────┘
└──────────────┘                     │(/san-pham/   │
                                     │  tao-moi)    │
                                     └──────┬───────┘
                                            │ nhập đồng loạt
                                            ▼
                                     ┌──────────────┐
                                     │ Nhập Excel & │
                                     │   Ảnh        │
                                     │(/san-pham/   │
                                     │nhap-hang-loat│
                                     └──────────────┘

┌──────────────┐     cấu hình       ┌──────────────┐
│   Cài đặt    │────────────────────▶│  Hồ sơ cửa   │
│  (/cai-dat)  │  liên kết sâu      │   hàng       │
└──────────────┘                     │  (/ho-so)    │
                                     └──────────────┘
```

### Mô tả liên kết:
| Từ | Đến | Quan hệ |
|---|---|---|
| Trang chủ | Thẻ chào | Journey Card duy nhất mở trên production |
| Trang chủ | Đơn hàng | Journey Card "Đơn hàng" (đang bị khóa production) |
| Thẻ chào | Đơn hàng | Đơn hàng từ brochure hiện trong tab Kanban |
| Sản phẩm & Giá | Tạo mẫu hoa mới | Nút "Thêm sản phẩm" |
| Sản phẩm & Giá | Nhập Excel & Ảnh | Nút "Nhập Excel & Ảnh" |
| Sản phẩm & Giá | Quét ảnh hoa | Nút "Phân tích AI" |
| Quét ảnh hoa | Kho dữ liệu | Lưu kết quả phân tích → phân vùng Approved |
| Kho dữ liệu | Quét ảnh hoa | Nút "Tải ảnh mới để phân tích" |
| Cài đặt | Hồ sơ cửa hàng | Liên kết sâu "Hồ sơ & Thương Hiệu" |
| Cài đặt | Đội ngũ & Phân quyền | Sub-page `/cai-dat/thanh-vien` |
| Hồ sơ cửa hàng | Thẻ chào | Thông tin tiệm (tên, hotline, địa chỉ) đồng bộ sang Thẻ chào A6 |

---

## 3. Trang chủ Production: Journey Cards

Trên production, trang chủ cửa hàng hiển thị lưới **ChoiceGrid** với tiêu đề "BẠN MUỐN LÀM GÌ CHO CỬA HÀNG?". Có **14 thẻ Journey** nhưng chỉ **1 thẻ mở khóa**:

| # | Journey ID | Tên hiển thị | Trạng thái Production |
|---|---|---|---|
| 1 | `greeting-card-hub` | Thẻ Chào mẫu hoa | ✅ **MỞ** |
| 2 | `view-store-overview` | Xem báo cáo | 🔒 Sắp ra mắt |
| 3 | `market-intelligence-explore` | Xem mẫu hoa đang được yêu thích | 🔒 Sắp ra mắt |
| 4 | `analyze-product-photo` | Tạo Thẻ sản phẩm từ ảnh | 🔒 Sắp ra mắt |
| 5 | `create-product-quote` | Tạo Thẻ báo giá sản phẩm | 🔒 Sắp ra mắt |
| 6 | `create-marketing-copy` | Viết nội dung bài đăng cho các nền tảng | 🔒 Sắp ra mắt |
| 7 | `create-audio-voiceover` | Tạo giọng đọc cho bài đăng | 🔒 Sắp ra mắt |
| 8 | `create-marketing-image` | Tạo ảnh quảng cáo từ ảnh gốc | 🔒 Sắp ra mắt |
| 9 | `create-product-video` | Tạo video chuyển động từ ảnh hoa | 🔒 Sắp ra mắt |
| 10 | `create-catalog-collection` | Tạo trang giới thiệu và bán hoa | 🔒 Sắp ra mắt |
| 11 | `create-order` | Tiếp nhận & Xử lý đơn hàng (Dành cho Điện Hoa) | 🔒 Sắp ra mắt |
| 12 | `manage-customers` | Quản lý khách hàng | 🔒 Sắp ra mắt |
| 13 | `launch-product-combo` | Tạo bộ nội dung bán hoa tự động | 🔒 Sắp ra mắt |
| 14 | `customer-service-chatbot` | Tư vấn và nhận đơn tự động | 🔒 Sắp ra mắt |

---

## 4. Cơ chế khóa tính năng

- **File nguồn**: `src/lib/feature-lock.ts`
- **Điều kiện kích hoạt**: `NEXT_PUBLIC_APP_ENV === "production"` (biến môi trường gắn lúc build)
- **Hiệu ứng sidebar**: Mục bị khóa → icon làm mờ + nhãn "Sắp ra mắt"
- **Hiệu ứng trang**: Truy cập trực tiếp URL bị khóa → hiện trang "Sắp ra mắt" (Coming Soon)
- **Dev local / Staging**: Không đặt biến → mọi tính năng chạy bình thường

---

## 5. Quy ước đọc tài liệu

Mỗi file chi tiết (01–10) tuân theo template chuẩn 7 phần:

1. **Cấu trúc trang** — Layout, tabs, sections, sub-pages
2. **Tính năng chi tiết** — Từng nút, form, bảng, dialog, action
3. **Luồng nghiệp vụ & Tình huống sử dụng** — Kịch bản thực tế
4. **Lợi ích** — Giá trị kinh doanh cụ thể
5. **Quyền truy cập** — Capability code, vai trò
6. **Mối liên kết với các mục khác** — Dữ liệu chia sẻ, luồng chuyển tiếp
7. **Trạng thái hoàn thiện & Hạn chế** — Nợ kỹ thuật, edge case
