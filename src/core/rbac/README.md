# Năng lực và quyền

Nội dung thuộc **P2**, sau khi P1 đạt nghiệm thu.

Thu hoạch R2: 76 mã năng lực và 26 trần cứng từ `FloraOS/src/lib/maChucNang.ts`, chép kèm `tests/maChucNang.test.ts`. Test xanh trên repo này thì mới coi là chuyển xong.

Ba lớp cắt, giữ nguyên thứ tự:

```
mặc định theo vai  →  bảng công tắc trong cấu hình  →  TRẦN CỨNG (cắt sau cùng)
```

Trần cứng cắt sau bảng công tắc, nên không đường nào từ giao diện hay cơ sở dữ liệu mở được nó.

Ba mở rộng bắt buộc so với bản của FloraOS:

- Quyền là bộ ba `(vai, mã, phạm vi)` với phạm vi thuộc {organization, branch}.
- Vai là bản ghi, không phải enum. Bỏ giá trị di sản `MANAGER`.
- Năng lực duyệt tách khỏi năng lực sinh kết quả: `vision.analyze` ↔ `product.approve`, `media.optimize` ↔ `media.approve`.
