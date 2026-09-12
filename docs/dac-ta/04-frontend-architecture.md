# 04 — Kiến trúc phía giao diện

## 1. Nền công nghệ

Theo `LocalBudd`, để hai repo dùng chung được component và người làm không phải học hai bộ.

| Lớp | Chọn | Vì sao |
|---|---|---|
| Khung | Next.js 16, App Router | Cả `LocalBudd` và `FloraOS` đang dùng |
| Giao diện | React 19 | |
| Kiểu dáng | Tailwind CSS 4 | |
| Component | shadcn trên `@base-ui/react` | Mã nằm trong repo, sửa được, không bị khoá vào một thư viện |
| Biểu tượng | `lucide-react` | |
| Kiểm dữ liệu | `zod` | Dùng chung một lược đồ cho cả client và máy chủ |
| ORM | **Prisma 7** | `LocalBudd` đang ở Prisma 5, `FloraOS` ở Prisma 7. Core theo bản mới |
| Test đầu cuối | Playwright | Theo `LocalBudd` |

Prisma là điểm duy nhất core cố tình lệch khỏi `LocalBudd`. Ghi lại ở đây để khi P7 nối hai repo thì biết chỗ nào cần nâng.

Không thêm thư viện quản lý trạng thái toàn cục. Lý do ở mục 4.

## 2. Bố cục

```
src/
├── app/
│   ├── (auth)/                  đăng nhập, đăng ký
│   ├── (app)/                   mọi màn hình sau đăng nhập
│   │   ├── layout.tsx           giải phiên, nạp năng lực, dựng khung điều hướng
│   │   ├── page.tsx             dashboard theo vai
│   │   ├── san-pham/
│   │   ├── tai-anh/            M01 phân tích ảnh
│   │   ├── gia/                M02 tính giá
│   │   ├── bo-may/             chọn bộ máy phân tích
│   │   ├── cai-dat-ai/         chính sách AI của tổ chức, sổ chi phí lời gọi
│   │   ├── anh-marketing/      M04b soạn biến thể
│   │   ├── video/              M04c
│   │   ├── noi-dung/           M07 soạn nội dung
│   │   ├── lich-dang/          M07 lịch đăng
│   │   ├── catalog/            M06 catalog và liên kết QR
│   │   ├── khach-hang/         M09
│   │   ├── don-hang/           M10
│   │   ├── so-lieu/            M11
│   │   ├── hoi-thoai/          M08
│   │   ├── duyet/
│   │   └── job/[id]/
│   └── api/v1/                  route handler — xem tài liệu 06
├── components/
│   ├── ui/                      component nền của shadcn
│   ├── job/                     checklist tiến trình, nhật ký, thẻ job
│   ├── product/
│   └── layout/                  thanh điều hướng, khung màn hình
└── lib/
    ├── capabilities.ts          kiểm năng lực phía client
    ├── api-client.ts
    └── use-job-stream.ts        đọc SSE
```

Đường dẫn URL tiếng Việt không dấu, khớp cách người dùng gọi tên màn hình. Mã nguồn bên trong vẫn tiếng Anh.

Bốn tuyến `anh-marketing`, `video`, `noi-dung`, `lich-dang` render trong shell của core nhưng gọi API của `SocialFlow` qua proxy theo đường dẫn — người dùng không rời shell, và ranh giới sở hữu dữ liệu không đổi vì điều đó. Tuyến nào thuộc engine ngoài thì ghi rõ trong chính tệp route, để không ai thêm một lời gọi Prisma vào đó.

## 3. Lấy dữ liệu

**Server Component là mặc định.** Màn hình đọc dữ liệu ngay ở phía máy chủ, qua use-case, cùng đường mã mà API dùng. Không gọi vòng qua HTTP để lấy dữ liệu của chính mình.

Client Component chỉ dùng cho ba việc: nhận thao tác người dùng, giữ trạng thái tạm của một màn hình, và đọc luồng sự kiện job.

Ghi dữ liệu đi qua Server Action hoặc `fetch` tới `/api/v1/`. Chọn cái nào thì nhất quán trong một module, không trộn.

## 4. Trạng thái

Ba loại, ba cách, không gộp:

| Loại | Ví dụ | Cách giữ |
|---|---|---|
| Dữ liệu máy chủ | Danh sách sản phẩm, kết quả phân tích | Server Component, `revalidate` sau khi ghi |
| Trạng thái màn hình | Tab đang mở, ảnh đang chọn, form đang nhập | `useState` trong chính màn hình |
| Trạng thái phiên | Người dùng, tổ chức, danh sách năng lực | Một Context duy nhất, nạp ở `(app)/layout.tsx` |

Không có kho trạng thái toàn cục. Phần lớn dữ liệu ở đây là dữ liệu máy chủ, và giữ bản sao thứ hai của nó trên client là tạo ra hai nguồn sự thật sẽ lệch nhau.

## 5. Kiểm năng lực phía client

`GET /auth/me` trả danh sách mã năng lực đã tính sẵn. Context giữ nó dưới dạng `Set`.

```tsx
const { can } = useSession()
{can('I2') && <ApproveButton …/>}
```

**Đây là việc ẩn hiện giao diện, không phải phép kiểm quyền.** Máy chủ kiểm lại ở mọi endpoint. Client không bao giờ tự suy quyền từ vai — nó chỉ đọc danh sách máy chủ gửi xuống.

Không hard-code `role === 'dieu_hanh'` ở bất kỳ đâu trong giao diện.

## 6. Theo dõi job

`use-job-stream.ts` mở `EventSource` tới `/api/v1/jobs/:id/events`, gom hai loại sự kiện:

```ts
type JobStream = {
  status: JobStatus
  stage: string | null
  result: string | null
  logs: { seq: number; text: string; at: string }[]
}
```

- `stage` dẫn checklist tiến trình. Danh sách bước lấy từ hằng theo `feature`, không đoán từ nhật ký.
- `logs` cộng dồn, xếp theo `seq`. Mất kết nối thì mở lại kèm `Last-Event-ID` bằng `seq` cuối cùng và nối tiếp, không tải lại từ đầu.
- `done` đóng luồng và kích hoạt `revalidate` cho màn hình đang mở.

Rời màn hình không huỷ job. Quay lại thì nhật ký hiện đủ từ đầu, vì nó nằm ở cơ sở dữ liệu chứ không ở bộ nhớ trình duyệt.

## 7. Biểu mẫu

Một lược đồ `zod` cho một biểu mẫu, đặt ở nơi cả client và route handler cùng import. Kiểm ở client để báo sớm; kiểm lại ở máy chủ vì client kiểm không phải là kiểm.

Lỗi từ máy chủ trả về theo hình dạng ở tài liệu 06 mục 2, gắn vào đúng trường qua `error.details`.

## 8. Ảnh

- Nén phía client trước khi tải lên: cạnh dài tối đa 2.048 điểm ảnh, JPEG chất lượng 0,85. Bản gốc trên máy người dùng không bị đụng tới.
- Tải thẳng lên kho bằng URL ký sẵn từ `POST /assets/upload-url`. Ảnh không đi qua máy chủ ứng dụng.
- Hiện ảnh thu nhỏ ngay khi chọn, trước khi tải xong, bằng `URL.createObjectURL`.
- Nhiều ảnh thì tải song song tối đa ba luồng — điện thoại ở cửa hàng thường dùng mạng di động.
- Mọi thẻ ảnh khai sẵn `width` và `height` để bố cục không nhảy.

## 9. Điện thoại trước

- Điểm ngắt: mặc định là màn hẹp; `md` trở lên mới thêm cột và bảng.
- Điều hướng chính là thanh dưới trên điện thoại, thanh bên trên máy tính. Cùng một danh sách mục, hai cách bày.
- Bảng dữ liệu trên màn hẹp render thành danh sách thẻ, không cuộn ngang.
- Vùng bấm tối thiểu 44 điểm ảnh.
- Nút hành động chính nằm ở nửa dưới màn hình.

## 10. Hiệu năng

| Mục | Ngưỡng |
|---|---|
| Tải lần đầu trên 4G | Nội dung chính hiện trong 3 giây |
| Chuyển màn hình | Dưới 300 mili giây |
| Gói JavaScript mỗi tuyến | Dưới 200 KB sau nén |

Component nặng — thanh trượt so sánh trước sau, trình xem nhật ký — nạp trễ. Danh sách dài dùng phân trang con trỏ theo `next_cursor`, không tải hết rồi lọc ở client.

## 11. Test

| Loại | Công cụ | Phủ gì |
|---|---|---|
| Component | Vitest | Logic hiển thị theo năng lực, định dạng số và tiền |
| Đầu cuối | Playwright | Bốn luồng ở tài liệu 03: trải nghiệm, phân tích, tối ưu, duyệt |
| Quyền trên giao diện | Playwright | Đăng nhập bằng Sale rồi xác nhận nút duyệt không tồn tại trong DOM, không phải chỉ bị ẩn |

Nút bị ẩn bằng CSS vẫn bấm được bằng công cụ nhà phát triển. Năng lực thiếu thì component không được render.
