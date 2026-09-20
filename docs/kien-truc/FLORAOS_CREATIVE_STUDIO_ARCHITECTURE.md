# Kiến Trúc AI Creative Studio — SSOT Architecture Document

> **Module:** AI Creative Studio (M04a + M04b)
> **Route:** `/creative-studio`
> **Phiên bản:** 2.0 — Tái cấu trúc Tab-based Workspace

---

## 1. Tổng Quan & Vai Trò

AI Creative Studio là chức năng xử lý ảnh sản phẩm hoa tươi từ ảnh chụp xưởng
thành ảnh marketing chuyên nghiệp. Gồm 2 tính năng cốt lõi:

| Tab | Module | Mô tả |
|-----|--------|-------|
| **1. Tối Ưu Ảnh** | M04a | Nâng cấp ảnh chụp xưởng hoa → Master Image HD (tách nền, cân sáng, Identity Guard 4 cổng) |
| **2. Biến Thể Marketing** | M04b | Dựng biến thể bối cảnh marketing từ Master Image (10 preset local + AI Visual Storytelling cloud) |

### Nguyên tắc "Skip — Dùng Ảnh Gốc"

User có thể bỏ qua M04a nếu ảnh gốc đã đẹp sẵn hoặc muốn giữ mộc mạc. Cơ chế
Skip tích hợp trong Tab Biến Thể:
- Chọn "Skip — Chỉ dùng ảnh gốc" → Chọn ảnh ORIGINAL → "Duyệt nhanh → Tạo Master"
- Backend tạo bản sao asset `kind=MASTER` từ ORIGINAL (giữ invariant)

---

## 2. Nguyên Tắc Thiết Kế Bất Biến

### 2.1. Identity Guard (M04a)
- 4 cổng kiểm duyệt: Nhận dạng (dáng khối, vật chứa), Hình học (hướng nhìn, tỉ lệ),
  Màu sắc thành phần, Nhất quán thành phần (BOM)
- Ngưỡng an toàn: 90%. Dưới ngưỡng → REJECTED → khóa nút duyệt Master
- WARNING khi điểm thấp nhất < 95% nhưng ≥ 90%

### 2.2. Subject Integrity (M04b)
- Đo tỷ lệ điểm ảnh lõi chủ thể còn trùng khít với Master Image
- Ngưỡng: 0.999 (SAFE) / 0.99 (WARNING) / < 0.99 (REJECTED)
- REJECTED → không ghi asset nào vào kho

### 2.3. Tenant Isolation
- `organization_id` giải từ session, không từ body/query
- Mọi asset thuộc tenant có `organization_id`
- API `promote-to-master` kiểm tra asset ORIGINAL thuộc đúng organization

### 2.4. Invariant: Biến thể chỉ dựng từ MASTER
- `isEligibleMasterForVariants` yêu cầu `kind === "MASTER" && approval_state === "APPROVED"`
- Cơ chế Skip tạo bản sao MASTER mới (không sửa ORIGINAL), giữ nguyên invariant

---

## 3. Cấu Trúc Thư Mục & Phân Hệ Thành Phần

```
src/
├── app/(app)/creative-studio/
│   └── page.tsx                              # Shell thuần (~200 dòng), tab switcher
│
├── components/creative-studio/               # UI workspace components
│   ├── types.ts                             # Shared types/interfaces
│   ├── use-creative-studio-data.ts          # Custom hook: state + API calls
│   ├── optimize-workspace.tsx               # Tab 1: M04a workspace
│   ├── variant-workspace.tsx                # Tab 2: M04b workspace (có Skip)
│   ├── source-picker.tsx                    # Chọn nguồn ảnh: Master / Skip ảnh gốc
│   └── asset-picker-grid.tsx                # Grid chọn ảnh (tái sử dụng)
│
├── components/templates/creative-studio/     # Template library components
│   ├── before-after-preview-card.tsx
│   ├── creative-guidance-card.tsx
│   ├── enhancer-provider-selector.tsx
│   ├── optimization-mode-selector.tsx
│   ├── studio-scene-selector.tsx
│   ├── studio-variant-card.tsx
│   ├── visual-storytelling-controls.tsx
│   └── applied-changes-breakdown.tsx
│
├── app/api/v1/media/
│   ├── optimizations/                        # M04a API
│   ├── variants/                             # M04b API
│   └── promote-to-master/route.ts           # Skip: ORIGINAL → MASTER 1-chạm
```

---

## 4. User Journey 2 Tab + Skip

### Flow A: Tối ưu ảnh chuẩn (Tab 1 → Tab 2)
```
Tab 1: Upload/Chọn ảnh → Cấu hình engine → Chạy M04a → Identity Guard → Duyệt Master
  → Tab 2: Chọn Master → Cấu hình biến thể → Chạy M04b → Subject Integrity → Duyệt
```

### Flow B: Skip dùng ảnh gốc (Tab 2 trực tiếp)
```
Tab 2: Chọn "Skip — Dùng ảnh gốc" → Chọn ảnh ORIGINAL → "Duyệt nhanh 1-chạm"
  → Hệ thống tạo MASTER mới từ ORIGINAL → Tự chọn master mới
  → Cấu hình biến thể → Chạy M04b → Duyệt
```

---

## 5. API Contracts

### 5.1. POST `/api/v1/media/promote-to-master`
**Mục đích:** Cho phép user "Skip M04a" — duyệt nhanh ảnh ORIGINAL thành MASTER

**Request:**
```json
{ "asset_id": "uuid-of-original-asset" }
```

**Logic:**
1. Xác minh `organization_id` từ session
2. Tìm asset gốc: `kind === "ORIGINAL"`, `organization_id` khớp
3. Tạo bản sao asset mới: `kind = "MASTER"`, `approval_state = "APPROVED"`,
   `parent_asset_id = asset_id` (liên kết về gốc)
4. Copy `storage_key` (cùng file ảnh, không duplicate)

**Response:**
```json
{
  "master_asset_id": "new-uuid",
  "approval_state": "APPROVED",
  "storage_key": "org/xxx/yyy/zzz.jpg"
}
```

**Năng lực:** `I2` (duyệt ảnh)

### 5.2. Các API hiện có (không đổi)
- `POST /api/v1/media/optimizations` — Tạo job M04a (`I1`)
- `POST /api/v1/media/optimizations/:id/approve` — Duyệt Master (`I2`)
- `GET /api/v1/media/optimizations/:id` — Xem trạng thái M04a
- `POST /api/v1/media/variants` — Tạo job M04b (`I4`)
- `POST /api/v1/media/variants/:id/approve` — Duyệt biến thể (`I5`)

---

## 6. Capability Matrix

| Mã | Tên | Mô tả |
|----|-----|-------|
| `I1` | Chạy tối ưu ảnh | Tạo job M04a |
| `I2` | Duyệt ảnh | Duyệt Master Image + Promote-to-Master (Skip) |
| `I3` | Tải ảnh | Download Master/biến thể |
| `I4` | Chạy biến thể | Tạo job M04b |
| `I5` | Duyệt biến thể | Duyệt biến thể marketing (trần cứng) |
