# Năng lực và quyền — P2

Từ vựng và ba lớp cắt ở `capability-catalog.ts` và `permission-resolver.ts`.
Bảng cơ sở dữ liệu (`role_capabilities`, `capability_overrides`) và việc gộp
theo `TenantContext` nằm ở `src/modules/organization/infra/capability-repository.ts`.

**Thu hoạch R2**: `src/lib/maChucNang.ts` + `tests/maChucNang.test.ts` chép
nguyên vẹn từ `FloraOS/floraos-web/src/lib/maChucNang.ts`, xanh không sửa một
dòng (`npm run test:harvest`, `YC-Q1`). 76 mã đầu của `capability-catalog.ts`
(`A1`…`E8`) SINH từ chính bản harvest đó — xem
`capability-catalog.test.ts`, phần "khớp nguyên vẹn với bản harvest" — không
gõ tay, để không lặp lại điểm lệch 3 ở `docs/kien-truc/RA_SOAT_THU_HOACH.md`.

Ba lớp cắt, giữ nguyên thứ tự:

```
mặc định theo vai  →  bảng công tắc của tổ chức  →  TRẦN CỨNG (cắt sau cùng)
```

- **Lớp một** — `role_capabilities` của bốn vai hệ thống, seed từ
  `defaultCodesForSystemRole()` lúc `ensureSystemRoles`. Vai riêng của tổ chức
  không có mặc định: bắt đầu rỗng.
- **Lớp hai** — `capability_overrides`, theo `(organization_id, role_id, capability_code)`.
  Nguồn của `PATCH /roles/:id/capabilities` (đặc tả 06 mục 4), dùng thống nhất
  cho cả vai hệ thống lẫn vai riêng.
- **Lớp ba** — trần cứng, hằng trong `capability-catalog.ts` (`hardCap`), cắt
  sau cùng ở `permission-resolver.applyHardCap`. 31 mã có trần cứng: 18 thu
  hoạch (`docs/dac-ta/02-function-catalog.md` mục 3) cộng 12 mã mới (mục 4)
  cộng `F9` (`integration.token.manage`, thêm ở P7 — đặc tả 08 mục 3).

Trần cứng cắt sau bảng công tắc, nên không đường nào từ giao diện hay cơ sở
dữ liệu mở được nó — kể cả một ngoại lệ `allowed: true` ghi thẳng vào
`capability_overrides` (xem test "bật ngoại lệ cho một mã có trần cứng vẫn
không mở được năng lực" ở `permission-resolver.test.ts`).

Ba mở rộng so với bản của FloraOS:

- Quyền là bộ ba `(vai, mã, phạm vi)` — `role_capabilities.scope` ∈
  `{ORGANIZATION, BRANCH}`.
- Vai là bản ghi, không phải enum. Vai riêng của tổ chức mang khoá tự đặt,
  không khớp bất kỳ trần cứng nào — một năng lực có trần cứng không bao giờ
  mở được cho vai riêng, kể cả khi tổ chức bật nó ở bảng công tắc.
- Năng lực duyệt tách khỏi năng lực sinh kết quả — sáu cặp ở
  `SPLIT_CAPABILITY_PAIRS`: `vision.analyze`↔`product.approve`,
  `media.optimize`↔`media.approve`, `media.variant.run`↔`media.variant.approve`
  (`I4`↔`I5`, M04b, thêm ở P16/P24 khi module chuyển vào `floraos-core`),
  `catalog.create`↔`catalog.publish`, `landing.create`↔`landing.publish`,
  `product_copy.generate`↔`product_copy.approve` (`H5`↔`H6`).

Công tắc `cho_phep_tu_duyet` (đặc tả 02 mục 2, `YC-Q9`) nằm ở
`src/modules/organization/domain/self-approval-policy.ts` — không đổi năng
lực, chỉ đổi việc một bản ghi tự tạo có hiện trong hàng đợi duyệt của chính
người tạo hay không.
