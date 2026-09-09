# Quy ước đếm

Đáp án của người, dùng để chấm kết quả của máy. Mọi nhãn trong bộ ảnh vàng theo đúng trang này. Con số mà `count_engine` chốt ra cũng theo đúng trang này.

## Sáu quy ước

| # | Trường hợp | Quy ước |
|---|---|---|
| 1 | Nụ chưa nở | Đếm riêng thành mục `bud`. Không cộng vào số hoa |
| 2 | Số lượng chuẩn | Lấy **số nhìn thấy trong ảnh**. Số trên đơn hàng ghi song song ở trường riêng, và giao diện hiển thị cả hai |
| 3 | Cành nhiều bông — baby, cẩm chướng chùm, cúc chùm | Đếm theo **cành**. Một cành là một đơn vị, bất kể trên cành có mấy bông |
| 4 | Lá và cành trang trí — bạch đàn, dương xỉ, lá kim | Ghi tên, **không đếm số**. `count` để trống |
| 5 | Giấy gói, ruy băng, giỏ, hộp | Là cấu phần, đếm như hoa |
| 6 | Hoa gãy cổ, héo, dập | Vẫn tính vào tổng, đồng thời ghi số hỏng ở trường riêng |

## Đơn vị

**Cành.** Mọi con số đếm được đều là số cành, không phải số bông. Quy ước 3 là hệ quả trực tiếp của điều này.

## Hệ quả lên nhãn

Bốn trường số, tách rời, không gộp:

| Trường | Nội dung | Quy ước |
|---|---|---|
| `flower_count` | Số cành hoa nhìn thấy trong ảnh | 2, 3 |
| `bud_count` | Số nụ chưa nở | 1 |
| `damaged_count` | Số cành hỏng, **đã nằm trong** `flower_count` | 6 |
| `order_count` | Số ghi trên đơn hàng, để trống nếu không tra được | 2 |

`order_count` **không dùng để chấm điểm máy** — máy chỉ nhìn ảnh, chấm nó bằng con số không nhìn thấy được là chấm sai. Trường này tồn tại để giao diện hiển thị cả hai số cho người dùng, và để phát hiện chênh lệch giữa ảnh và đơn.

Cấu phần loại `foliage` có `count` để trống. Cấu phần loại `packaging` có `count` như hoa.

## Ví dụ

Bó hồng đỏ, đơn ghi 20 bông. Ảnh thấy 17 cành hồng nở, trong đó 1 cành gãy cổ; thêm 3 nụ chưa nở; lá bạch đàn điểm xuyết; gói giấy kraft, buộc một ruy băng.

```json
{
  "flower_count": 17,
  "bud_count": 3,
  "damaged_count": 1,
  "order_count": 20,
  "components": [
    { "canonical_component": "hoa-hong-do",    "category": "flower",    "count": 17,   "color": "do" },
    { "canonical_component": "hoa-hong-do",    "category": "bud",       "count": 3,    "color": "do" },
    { "canonical_component": "la-bach-dan",    "category": "foliage",   "count": null, "color": "xanh-bac" },
    { "canonical_component": "giay-goi-kraft", "category": "packaging", "count": 1,    "color": "nau" },
    { "canonical_component": "ruy-bang-lua",   "category": "packaging", "count": 1,    "color": "do" }
  ]
}
```

Bốn danh mục cấu phần: `flower` · `bud` · `foliage` · `packaging`.

## Trường hợp chưa có quy ước

Gặp tình huống trang này chưa nói tới thì **dừng, không tự quyết**. Ghi lại tình huống, hỏi người chốt quy ước, bổ sung một dòng vào bảng trên, rồi rà lại những ảnh đã gán nhãn chịu ảnh hưởng của dòng vừa thêm.

Tự quyết một lần là bộ ảnh có hai chuẩn, và không ai biết ảnh nào theo chuẩn nào.

## Điều cần theo dõi

Quy ước 4 để lá và cành trang trí không có số lượng. M02 tính giá theo cấu phần, nên chi phí lá phải tính theo đơn vị khác — bó lá, hoặc mức khoán theo dạng sản phẩm — chứ không theo số cành. Chốt cách tính đó khi làm P6.
