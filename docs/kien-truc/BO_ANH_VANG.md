# Bộ ảnh vàng — quy cách xây dựng

Bộ ảnh vàng là **50–100 ảnh sản phẩm thật, có nhãn số lượng đúng**, dùng làm thước đo cố định cho mọi thay đổi ở M01.

## 1. Nó phục vụ ba việc

| Việc | Không có bộ ảnh vàng thì |
|---|---|
| Nghiệm thu P5 | Không có căn cứ nói M01 chạy đúng trên nền mới |
| Đổi provider Vision (D5-c) | Không đổi được. Adapter Florence-2 + SAM2 chỉ thay được adapter GPT-4o khi **bằng hoặc hơn trên chính bộ này**. Đổi bằng lập luận là không hợp lệ |
| Hồi quy phần thu hoạch | `count_engine.py` và `color_engine.py` bị gỡ `openpyxl` ra khỏi từng hàm. Không có thước đo thì không biết việc gỡ có làm sai kết quả không |

Xây song song với mọi pha khác, không chặn ai và không bị ai chặn. Bắt đầu được ngay hôm nay.

## 2. Quy ước đếm

Đáp án của người phải theo một chuẩn duy nhất, nếu không thì hai người gán nhãn cùng một bó hoa sẽ ra hai con số khác nhau và thước đo mất giá trị.

Quy ước đã chốt ở `QUY_UOC_DEM.md`. Đọc trang đó trước khi gán nhãn ảnh đầu tiên. Tóm tắt:

- Đơn vị là **cành**, không phải bông. Cành nhiều bông tính một.
- Nụ chưa nở đếm riêng, không cộng vào số hoa.
- Số chuẩn là số **nhìn thấy trong ảnh**; số trên đơn hàng ghi song song ở trường riêng.
- Lá và cành trang trí ghi tên, không đếm số.
- Giấy gói, ruy băng, giỏ, hộp đếm như hoa.
- Hoa hỏng vẫn tính vào tổng, ghi thêm số hỏng ở trường riêng.

Gặp trường hợp `QUY_UOC_DEM.md` chưa nói tới thì dừng và bổ sung vào trang đó, không tự quyết.

## 3. Quy mô và phân bổ

Tối thiểu 50 ảnh để có ý nghĩa thống kê thô; 100 ảnh là mức đủ để phân biệt hai provider gần nhau. Phân bổ theo bốn trục, cắt chéo nhau:

| Trục | Phân bổ mục tiêu |
|---|---|
| Số lượng cấu phần | Dưới 5 đơn vị: 30% · 5–15: 40% · trên 15: 30% |
| Dạng sản phẩm | Bó · giỏ · hộp · bình · lẵng — theo đúng tỉ trọng danh mục thật đang bán |
| Chất lượng ảnh | Tốt: 40% · trung bình (hơi tối, hơi nghiêng, nền lộn xộn): 40% · kém (mờ, ngược sáng, nhiễu): 20% |
| Độ khó nhận dạng | Ít nhất 15 ảnh có hoa cùng màu chồng lấp nhau, và ít nhất 10 ảnh có cấu phần bị che một phần |

Phần 20% ảnh kém là bắt buộc, không phải tuỳ chọn. Bộ ảnh toàn ảnh đẹp sẽ cho điểm cao giả và không phát hiện được provider nào yếu ở đúng loại ảnh mà người dùng thật gửi lên.

## 4. Quy cách chụp

- **Chụp bằng điện thoại**, đúng thiết bị và thói quen của người dùng thật. Không dùng ảnh studio, không dùng ảnh đã chỉnh sửa.
- Ảnh gốc, không cắt, không lọc, không nén lại. Giữ nguyên EXIF.
- Một ảnh một sản phẩm. Không ghép nhiều sản phẩm vào một khung.
- Ưu tiên ảnh có sẵn trong kho vận hành của AVI GIFT hơn là chụp mới — ảnh cũ phản ánh đúng điều kiện thật và có sẵn thông tin đơn hàng để đối chiếu số lượng.
- Không lấy ảnh từ nhà cung cấp hay từ internet. Thước đo phải đo trên đúng thứ hệ thống sẽ gặp.

## 5. Cấu trúc thư mục

```
golden/
├── images/           ảnh gốc, KHÔNG đưa vào git
│   ├── g001.jpg
│   ├── g002.jpg
│   └── …
├── labels/           nhãn, ĐƯA vào git
│   ├── g001.json
│   └── …
├── manifest.csv      một dòng một ảnh, tra cứu nhanh
└── QUY_UOC_DEM.md    quy ước đếm đã chốt
```

Ảnh nằm ngoài git (`.gitignore` đã loại `golden/images/`) vì đó là dữ liệu sản phẩm của khách và vì kích thước. Nhãn nằm trong git vì đó mới là phần có giá trị và cần lịch sử thay đổi.

Đặt tên `g001`–`g100`, không đặt theo tên sản phẩm. Tên sản phẩm nằm trong nhãn.

## 6. Lược đồ nhãn

Một tệp JSON cho một ảnh:

```json
{
  "image_id": "g001",
  "file": "g001.jpg",
  "source": "kho-van-hanh-2026-03",
  "product_name": "Bó hồng đỏ 20 bông",
  "product_form": "bo",
  "difficulty": "trung-binh",

  "flower_count": 17,
  "bud_count": 3,
  "damaged_count": 1,
  "order_count": 20,

  "components": [
    { "canonical_component": "hoa-hong-do",    "category": "flower",    "count": 17,   "color": "do" },
    { "canonical_component": "hoa-hong-do",    "category": "bud",       "count": 3,    "color": "do" },
    { "canonical_component": "la-bach-dan",    "category": "foliage",   "count": null, "color": "xanh-bac" },
    { "canonical_component": "giay-goi-kraft", "category": "packaging", "count": 2,    "color": "nau" },
    { "canonical_component": "ruy-bang-lua",   "category": "packaging", "count": 1,    "color": "do" }
  ],

  "occluded": true,
  "notes": "3 cành phía sau bị che một phần; 1 cành gãy cổ",
  "labeled_by": "…",
  "labeled_at": "2026-09-10",
  "verified_by": "…",
  "verified_at": "2026-09-11"
}
```

`canonical_component` lấy từ đúng từ điển nguyên liệu của M01, không đặt tên tự do. Nhãn dùng tên ngoài từ điển là nhãn hỏng — nó không đối chiếu được với đầu ra của hệ thống.

`flower_count` là trường được chấm điểm chính. `order_count` **không tham gia chấm điểm** — máy chỉ nhìn ảnh.

Bốn danh mục cấu phần: `flower` · `bud` · `foliage` · `packaging`. Ý nghĩa và cách đếm ở `QUY_UOC_DEM.md`.

## 7. Quy trình gán nhãn

1. **Vòng một** — người A gán nhãn toàn bộ, theo `QUY_UOC_DEM.md`.
2. **Vòng hai** — người B gán nhãn độc lập ít nhất 30% số ảnh, **không nhìn nhãn của người A**.
3. **Đối chiếu** — mọi ảnh lệch nhau đưa ra xử lý.
4. **Xử lý bất đồng** — nếu lệch vì đọc ảnh khác nhau thì chốt lại số đúng. Nếu lệch vì quy ước chưa rõ thì **sửa `QUY_UOC_DEM.md` trước**, rồi rà lại toàn bộ những ảnh chịu ảnh hưởng của điều vừa sửa.
5. **Điền `verified_by`** chỉ sau khi bước 4 xong.

Tỉ lệ lệch ở vòng hai là chỉ số về chất lượng quy ước. Lệch trên 10% nghĩa là quy ước đếm chưa đủ rõ, không phải người gán nhãn cẩu thả.

Ảnh nào không chốt được số chính xác vẫn **giữ lại**, ghi chú rõ là ước tính. Số lượng ảnh đủ theo mục 8 mới là điều kiện đạt nghiệm thu, không phải từng ảnh phải đếm chính xác tuyệt đối. Một nhãn sai làm hỏng thước đo nhiều hơn là thiếu một ảnh.

## 8. Nghiệm thu bộ ảnh

Bộ ảnh coi là dùng được khi:

- Từ 50 ảnh trở lên, đủ phân bổ ở mục 3 với sai số mỗi ô không quá 5 điểm phần trăm.
- 100% ảnh có nhãn đủ trường, `canonical_component` đều nằm trong từ điển.
- 100% ảnh có `verified_by`.
- `QUY_UOC_DEM.md` đã chốt và không còn câu hỏi mở.
- Không ảnh nào trùng sản phẩm với ảnh khác trong bộ.

## 9. Cách chấm điểm provider

Cùng một bộ ảnh, chạy qua từng adapter, so nhãn máy với nhãn người:

| Chỉ số | Định nghĩa |
|---|---|
| Tỉ lệ đếm đúng tuyệt đối | Phần trăm ảnh có `flower_count` khớp chính xác |
| Sai số tuyệt đối trung bình | Trung bình `abs(máy − người)` trên `flower_count` |
| Tỉ lệ sai nặng | Phần trăm ảnh lệch từ 2 đơn vị trở lên |
| Độ khớp cấu phần | Phần trăm `canonical_component` máy nhận đúng, tính cả thiếu và thừa |
| Độ khớp màu | Phần trăm cấu phần đúng màu |
| Chi phí và thời gian | Mỗi ảnh, để điền vào ma trận chọn công nghệ |

Cắt kết quả theo ô phân bổ ở mục 3. Một provider thắng ở ảnh tốt nhưng thua ở ảnh kém là thông tin quan trọng, và điểm trung bình gộp sẽ giấu mất điều đó.

**Cổng đổi provider:** adapter mới thay được adapter đang chạy khi bằng hoặc hơn trên bộ này, đo theo ma trận ở kiến trúc mục 13.1. Không đổi bằng lập luận.

## 10. Bảo mật và quyền riêng tư

Ảnh là dữ liệu sản phẩm của khách hàng. Không đưa vào git, không tải lên dịch vụ ngoài ngoài chính lời gọi provider đang được đánh giá, và mỗi provider thương mại phải được soát điều khoản lưu trữ và huấn luyện trước khi bộ ảnh được gửi qua. Đây chính là cột soát cách ly tenant trong ma trận chọn công nghệ.
