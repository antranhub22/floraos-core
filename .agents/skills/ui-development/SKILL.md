---
name: ui-development
description: >-
  Quy tắc phát triển giao diện UI/UX cho FloraOS. Kích hoạt khi agent tạo/sửa
  React component, page layout, form, modal, hoặc bất kỳ file nào trong
  src/components/, src/app/(app)/, hoặc liên quan đến giao diện người dùng.
---

# UI Development — FloraOS

## Quick Reference (copy-paste)

### Page layout chuẩn
```tsx
// src/app/(app)/<route>/page.tsx
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { MyPageClient } from "@/components/<feature>/my-page-client"

export default async function MyPage() {
  const { ctx } = await requireTenantContext()
  const data = await myUseCase(ctx)
  return <MyPageClient initialData={data} />
}
```

### Client component chuẩn (kèm Tab Action Header & FeatureGuidanceCard)
```tsx
// src/components/<feature>/my-component.tsx
"use client"
import { Sparkles, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"

export function MyComponent({ data }: { data: MyType }) {
  return (
    <div className="space-y-6">
      {/* 1. Standardized Tab Action Header: Top-right aligned */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tiêu đề màn hình</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Lưu nháp</Button>
          <Button variant="primary" size="sm">Chốt duyệt</Button>
          <Button variant="ghost" size="icon" aria-label="Thao tác khác">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Feature Guidance Card: Max 1 per view/tab */}
      <FeatureGuidanceCard
        badgeLabel="HƯỚNG DẪN THAO TÁC"
        badgeIcon={Sparkles}
        title="Hướng dẫn sử dụng tính năng"
        description="Mô tả ngắn gọn nghiệp vụ trong 2-3 dòng cô đọng."
        tips={[
          "Mẹo 1: Chọn sản phẩm từ danh sách trước khi chỉnh sửa.",
          "Mẹo 2: Dữ liệu được tự động sao lưu định kỳ."
        ]}
      />

      {/* 3. Nội dung chính */}
      <div className="rounded-lg border bg-card p-4">
        {/* ... */}
      </div>
    </div>
  )
}
```

### Loading States: Skeleton vs Spinner
- **Dùng Skeleton** (`<Skeleton className="..." />`): Cho toàn bộ layout ban đầu, danh sách card, bảng dữ liệu khi đang fetch để tránh giật giao diện (CLS - Cumulative Layout Shift).
- **Dùng Spinner** (`<Loader2 className="animate-spin" />`): CHỈ dùng bên trong nút bấm (button inline state) khi người dùng bấm Lưu/Gửi hoặc các tác vụ background cục bộ.
---

## Rules (bắt buộc)

### 1. Ngôn ngữ: 100% Tiếng Việt

**Mọi nội dung user-facing PHẢI bằng tiếng Việt.** Không ngoại lệ.

Áp dụng cho: navigation, menu, button, label, placeholder, tooltip, helper text, form, validation/error message, empty/loading/success state, dialog, modal, notification, toast, dashboard, settings.

**Giữ nguyên**: brand name, tên riêng, URL, email, mã sản phẩm, API identifier.

**Thuật ngữ kỹ thuật**: `Tiếng Việt dễ hiểu (thuật ngữ gốc nếu cần)`.

**Self-check**: quét lại toàn bộ string user-facing trước khi bàn giao.

### 2. Design System Consistency

Trước khi tạo UI mới → kiểm tra: component có sẵn? pattern đã tồn tại? → Có → tái sử dụng. Chưa có lý do hợp lệ → tạo reusable pattern → cập nhật SSOT. Không rõ → STOP, hỏi PO.

**Cấm tự ý tạo mới**: button style, card style, modal pattern, spacing, typography, color semantic, terminology.

### 3. Thứ bậc thông tin

Mỗi màn: Đây là gì? → Quan trọng gì? → Cần làm gì? → Bổ sung?

### 4. Progressive Disclosure

Overview → Liên quan → Hành động → Tùy chọn → Nâng cao. Không phơi bày tất cả.

### 5. Terminology

1 khái niệm = 1 thuật ngữ tiếng Việt xuyên suốt. Chưa rõ → STOP → hỏi PO.

### 6. Loading & Empty States

- **Loading**: Dùng Skeleton cho content layout đã biết, Spinner cho hành động ngắn.
- **Empty state**: Mỗi danh sách PHẢI có empty state với call-to-action ("Chưa có sản phẩm nào. Tạo sản phẩm đầu tiên →").
- **Error boundary**: Mỗi page-level component nên wrap bằng error boundary.

### 7. Toast / Notification

- **Toast**: Hành động vừa thực hiện thành công/thất bại (tự biến mất).
- **Alert inline**: Cảnh báo quan trọng cần user đọc kỹ trước khi tiếp.
- **Modal**: Xác nhận hành động nguy hiểm (xóa, duyệt, gỡ bỏ).

### 8. Route tiếng Việt

Route group `(app)` dùng slug tiếng Việt: `/san-pham`, `/don-hang`, `/khach-hang`. Tạo route mới → slug tiếng Việt có dấu gạch nối.

---

## DO / DON'T

### ❌ DON'T — Label tiếng Anh
```tsx
<Button>Save Draft</Button>
<p>No items found</p>
<input placeholder="Search products..." />
```

### ✅ DO — Label tiếng Việt
```tsx
<Button>Lưu nháp</Button>
<p>Chưa có mục nào</p>
<input placeholder="Tìm kiếm sản phẩm..." />
```

### ❌ DON'T — useEffect cho data fetching
```tsx
"use client"
export function ProductList() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    fetch("/api/v1/products").then(r => r.json()).then(setProducts)
  }, [])
  return <div>{products.map(...)}</div>
}
```

### ✅ DO — Server Component cho data
```tsx
// page.tsx (Server Component — không cần "use client")
export default async function ProductsPage() {
  const { ctx } = await requireTenantContext()
  const products = await listProducts(ctx)
  return <ProductList products={products} />
}
```

### ❌ DON'T — List không có empty state
```tsx
return <div>{items.map(item => <Card key={item.id} />)}</div>
```

### ✅ DO — List có empty state + loading
```tsx
if (isLoading) return <ProductListSkeleton />
if (items.length === 0) return (
  <EmptyState
    icon={Package}
    title="Chưa có sản phẩm"
    description="Tạo sản phẩm đầu tiên để bắt đầu."
    action={<Button>Tạo sản phẩm</Button>}
  />
)
return <div>{items.map(item => <Card key={item.id} />)}</div>
```

---

## Reference Files

| Pattern | File |
|---|---|
| Base UI components | `src/components/ui/` (button, card, dialog, select...) |
| App layout / sidebar | `src/components/layout/` |
| Feature component mẫu | `src/components/catalog/` |
| Dashboard widgets | `src/components/dashboard/` |
| Design tokens (CSS) | `src/app/globals.css` |
| Template components | `src/components/templates/` |
| FeatureGuidanceCard | `src/components/templates/shared/feature-guidance-card.tsx` |
| Page layout mẫu | `src/app/(app)/san-pham/page.tsx` |

## Gotchas

1. **Font "Be Vietnam Pro"** hỗ trợ dấu tiếng Việt đầy đủ. Không đổi font khác khi chưa kiểm tra dấu.
2. **`"use client"` chỉ khi cần** — mặc định Server Component. Chỉ thêm khi cần `useState`, `useEffect`, event handler.
3. **Chuẩn UX 03a**: Màn hình mới/sửa bố cục phải có Screen Contract + `npm run lint:ux -- --check` không tăng vi phạm.
4. **Tối đa 1 `<FeatureGuidanceCard />`** mỗi màn/tab. Cấm spam nhiều khối hướng dẫn.

> Xem thêm: skill `api-development` §5 cho cách lấy data từ server. Skill `testing` để test component.
