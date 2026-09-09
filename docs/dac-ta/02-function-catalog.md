# 02 — Danh mục năng lực

Từ vựng quyền của toàn hệ thống. Tài liệu phân quyền, bảng công tắc trên màn hình và phép kiểm ở máy chủ gọi cùng một mã, nên đọc tài liệu và đọc màn hình là cùng một việc.

Bảng ở mục 3 **sinh từ `FloraOS/floraos-web/src/lib/maChucNang.ts`** (246 dòng). Không tệp nào khác trong bộ tài liệu được chép lại bảng này; chúng dẫn chiếu tới đây.

## 1. Ba lớp cắt

```
mặc định theo vai  →  bảng công tắc của tổ chức  →  TRẦN CỨNG (cắt sau cùng)
```

Trần cứng cắt **sau** bảng công tắc. Không đường nào từ giao diện hay cơ sở dữ liệu mở được một năng lực đã bị trần cứng chặn. 18 trong 76 mã có trần cứng.

Thứ tự này là thứ tự thi hành, không phải thứ tự trình bày. Đảo lại là mở toang hệ thống.

## 2. Ba mở rộng so với bản của FloraOS

**Phạm vi.** Quyền không còn là cặp `(vai, mã)` mà là bộ ba `(vai, mã, phạm vi)`, phạm vi thuộc `{organization, branch}`. Sale thấy chi nhánh mình; Điều hành thấy toàn tổ chức.

**Vai là bản ghi.** Bỏ `enum Role`. Vai tối thiểu: Experience User · Điều hành · Sale · Điều phối. Tổ chức thêm vai riêng được.

**Điều hành là tập cha.** Điều hành có mọi năng lực của Sale và Điều phối, để kiểm soát, giám sát và tự xử lý được bất kỳ việc nào. Hệ quả: Điều hành duyệt được chính việc mình vừa làm. Hai điều bắt buộc đi kèm:

- Mọi hành động duyệt ghi `audit_logs` với người thực hiện, thời điểm, và bản ghi được duyệt.
- Công tắc cấp tổ chức `cho_phep_tu_duyet`. Bật thì Điều hành duyệt việc của chính mình; tắt thì bản ghi do chính người đó tạo không hiện trong hàng đợi duyệt của người đó.

**Mã và tên gọi.** Mỗi năng lực có hai định danh: mã chữ cái (`B5`) và tên đọc được (`vision.analyze`). Mã chữ cái là định danh chính, giữ nguyên để `maChucNang.test.ts` chuyển sang không phải sửa một dòng. Tên đọc được là trường thêm, dùng trong mã nguồn và tài liệu. Năng lực mới có cả hai.

## 3. Bảng 76 mã thu hoạch

76 mã, 18 mã có trần cứng, năm nhóm. Sinh từ mã nguồn.

### Truy cập và tài khoản

| Mã | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|
| `A1` | Đăng nhập bằng tài khoản nội bộ | Điều hành · Điều phối · Sale | — |
| `A2` | Đổi mật khẩu đăng nhập của chính mình | Điều hành · Điều phối · Sale | — |
| `A3` | Tạo tài khoản nội bộ | Điều hành | Điều hành |
| `A4` | Đổi vai của một tài khoản | Điều hành | Điều hành |
| `A5` | Bật tắt trạng thái hoạt động của tài khoản | Điều hành | Điều hành |
| `A6` | Đặt và đổi mật khẩu quản trị của kho | Điều hành | Điều hành |
| `A7` | Đặt lại mật khẩu đăng nhập của người khác | Điều hành | Điều hành |

### Phân tích ảnh

| Mã | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|
| `B1` | Tải ảnh sản phẩm lên kho | Điều hành · Điều phối | — |
| `B2` | Xem danh sách ảnh, bỏ từng ảnh trước khi chạy | Điều hành · Điều phối | — |
| `B3` | Soát điều kiện trước khi chạy | Điều hành · Điều phối | — |
| `B4` | Xem ước phí lượt chạy | Điều hành · Điều phối | — |
| `B5` | Phân tích một ảnh mỗi lượt | Điều hành · Điều phối | — |
| `B6` | Phân tích nhiều ảnh trong một lượt | Điều hành | — |
| `B7` | Phân tích cả một thư mục ảnh | Điều hành | — |
| `B8` | Phân tích cả kho ảnh | Điều hành | — |
| `B9` | Dừng lượt chạy của chính mình | Điều hành · Điều phối | — |
| `B10` | Dừng lượt chạy của người khác | Điều hành · Điều phối | — |
| `B11` | Xem nhật ký lượt chạy của chính mình | Điều hành · Điều phối | — |
| `B12` | Xem nhật ký mọi lượt chạy | Điều hành · Điều phối | — |
| `B13` | Mở khoá lượt chạy treo | Điều hành | — |
| `B14` | Quét lại chỉ mục ảnh | Điều hành · Điều phối | — |
| `B15` | Nạp 02_KET-QUA.xlsx vào giao diện | Điều hành · Điều phối | — |
| `B16` | Tải tệp Excel kết quả về máy | Điều hành · Điều phối | — |

### Tạo thẻ và chào giá

| Mã | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|
| `C1` | Xem bảng giá chào của sản phẩm đang chọn | Điều hành · Điều phối · Sale | — |
| `C2` | Chuyển một mã sang Điều phối dựng thẻ | Điều hành · Điều phối · Sale | — |
| `C3` | Mở tab Tạo thẻ | Điều hành · Điều phối | — |
| `C4` | Chọn sản phẩm, nạp dữ liệu vào biểu mẫu | Điều hành · Điều phối | — |
| `C5` | Điền biểu mẫu, địa chỉ ba cấp, khung giờ giao | Điều hành · Điều phối | — |
| `C6` | Xem bảng kiểm giá thời gian thực | Điều hành · Điều phối | — |
| `C7` | Nhập tay đè trường tự động, trừ Giá vốn | Điều hành · Điều phối | — |
| `C8` | Nhập tay đè Giá vốn | Điều hành · Điều phối | — |
| `C9` | Đặt giá chào chốt vượt Trần | Điều hành · Điều phối | — |
| `C10` | Đặt giá chào chốt dưới Sàn | Điều hành | Điều hành |
| `C11` | Xem trước thẻ | Điều hành · Điều phối | — |
| `C12` | Xuất PNG và PDF A6 | Điều hành · Điều phối | — |
| `C13` | Copy kịch bản Zalo | Điều hành · Điều phối | — |
| `C14` | Xem sổ xuất thẻ của chính mình | Điều hành · Điều phối | — |
| `C15` | Xem sổ xuất thẻ toàn công ty | Điều hành · Điều phối | — |
| `C16` | Tải exports_log.csv về máy | Điều hành · Điều phối | — |
| `C17` | Xem ảnh sản phẩm để tư vấn khách | Điều hành · Điều phối · Sale | — |
| `C18` | Xem danh bạ đối tác và lịch sử bắn đơn | Điều hành · Điều phối | — |
| `C19` | Bắn đơn cho đối tác | Điều hành · Điều phối | — |
| `C20` | Chốt đối tác nhận hoặc từ chối | Điều hành · Điều phối | — |
| `C21` | Đóng một việc chờ dựng thẻ | Điều hành · Điều phối | — |
| `C22` | Trả một việc chờ về cho Sales | Điều hành · Điều phối | — |
| `C23` | Xem bảng điều phối trong ngày | Điều hành · Điều phối | — |
| `C24` | Xem danh sách mã toàn kho | Điều hành · Điều phối · Sale | — |
| `C25` | Xem bảng thành phần nguyên liệu của một mã | Điều hành · Điều phối · Sale | — |
| `C26` | Xem dữ liệu máy đọc được từ ảnh | Điều hành · Điều phối · Sale | — |
| `C27` | Xem giá dành cho Đối tác Shop | Điều hành · Điều phối | Điều hành · Điều phối |
| `C28` | Xoá vĩnh viễn một việc chờ | Điều hành | Điều hành |

### Cấu hình nghiệp vụ

| Mã | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|
| `D1` | Mở màn Cài đặt và đọc toàn bộ tham số | Điều hành · Điều phối | — |
| `D2` | Sửa hạng đối tác và tỷ lệ thưởng | Điều hành · Điều phối | — |
| `D3` | Sửa nhóm phụ phí và mức phụ phí | Điều hành · Điều phối | — |
| `D4` | Sửa nhãn ưu tiên và ma trận ưu tiên | Điều hành · Điều phối | — |
| `D5` | Sửa danh mục lựa chọn | Điều hành · Điều phối | — |
| `D6` | Sửa danh sách linh động | Điều hành · Điều phối | — |
| `D7` | Sửa kỳ thanh toán | Điều hành · Điều phối | — |
| `D8` | Sửa thư mục ảnh | Điều hành · Điều phối | — |
| `D9` | Sửa chú giải trường | Điều hành · Điều phối | — |
| `D10` | Sửa tham số chi phí theo vai | Điều hành | Điều hành |
| `D11` | Xuất cấu hình ra tệp | Điều hành · Điều phối | — |
| `D12` | Nhập cấu hình từ tệp | Điều hành | — |
| `D13` | Khôi phục cấu hình mặc định | Điều hành | — |
| `D14` | Cập nhật giá toàn bộ | Điều hành · Điều phối | — |
| `D15` | Soát kỹ hệ thống | Điều hành · Điều phối | — |
| `D16` | Sửa định mức tiền công theo độ khó | Điều hành | Điều hành |
| `D17` | Đặt tham số giá của chiều tính từ giá sản xuất | Điều hành | Điều hành |

### Hệ thống

| Mã | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|
| `E1` | Mở màn Điều hành | Điều hành | Điều hành |
| `E2` | Xem trạng thái kho và mã API dạng ✓/✕ | Điều hành · Điều phối · Sale | — |
| `E3` | Xem bản che mã API | Điều hành | Điều hành |
| `E4` | Dán mã API mới hoặc xoá mã API | Điều hành | Điều hành |
| `E5` | Đổi mô hình AI | Điều hành | Điều hành |
| `E6` | Khai đường dẫn kho dùng chung | Điều hành | Điều hành |
| `E7` | Dò kho tự động | Điều hành | Điều hành |
| `E8` | Xem và dọn ảnh mồ côi trong kho (F8) | Điều hành | Điều hành |

## 4. Năng lực mới của core

Sáu nhóm dưới đây không tồn tại ở FloraOS v1. Chúng nhận nhóm chữ cái mới, tiếp nối quy ước sẵn có.

### Tổ chức và thành viên — nhóm F

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `F1` | `org.read` | Xem hồ sơ tổ chức | Điều hành · Điều phối · Sale | — |
| `F2` | `org.update` | Sửa hồ sơ tổ chức | Điều hành | Điều hành |
| `F3` | `member.invite` | Mời thành viên vào tổ chức | Điều hành | Điều hành |
| `F4` | `member.remove` | Gỡ thành viên khỏi tổ chức | Điều hành | Điều hành |
| `F5` | `role.manage` | Tạo và sửa vai, gán năng lực cho vai | Điều hành | Điều hành |
| `F6` | `branch.read` | Xem danh sách chi nhánh | Điều hành · Điều phối · Sale | — |
| `F7` | `branch.manage` | Tạo, sửa, đóng chi nhánh | Điều hành | Điều hành |
| `F8` | `workspace.manage` | Tạo và cấu hình workspace | Điều hành | Điều hành |

### Asset và job — nhóm G

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `G1` | `asset.read` | Xem asset của tổ chức | Điều hành · Điều phối · Sale | — |
| `G2` | `asset.upload` | Tải asset lên | Điều hành · Điều phối · Sale | — |
| `G3` | `asset.delete` | Xoá asset | Điều hành | Điều hành |
| `G4` | `job.read` | Xem job của chính mình | Điều hành · Điều phối · Sale | — |
| `G5` | `job.read.all` | Xem job của toàn tổ chức | Điều hành | — |
| `G6` | `job.cancel` | Huỷ job đang chờ | Điều hành · Điều phối · Sale | — |
| `G7` | `job.retry` | Chạy lại job thất bại | Điều hành · Điều phối | — |
| `G8` | `usage.read` | Xem mức dùng và hạn mức | Điều hành | — |
| `G9` | `audit.read` | Đọc nhật ký kiểm toán | Điều hành | Điều hành |

### Vision — nhóm H

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `H1` | `vision.analyze` | Chạy phân tích ảnh sản phẩm | Điều hành · Điều phối · Sale | — |
| `H2` | `vision.result.edit` | Sửa kết quả phân tích trước khi duyệt | Điều hành · Điều phối | — |
| `H3` | `product.approve` | Duyệt kết quả, ghi vào Product Master | Điều hành | Điều hành |

### Tối ưu ảnh — nhóm I

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `I1` | `media.optimize` | Chạy job tối ưu ảnh | Điều hành · Điều phối · Sale | — |
| `I2` | `media.approve` | Nâng Master Image thành ảnh chính thức của sản phẩm | Điều hành | Điều hành |
| `I3` | `media.download` | Tải ảnh đã tối ưu về máy | Điều hành · Điều phối · Sale | — |

### Kênh bán — nhóm J

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `J1` | `catalog.create` | Tạo catalog | Điều hành · Điều phối | — |
| `J2` | `catalog.publish` | Xuất bản catalog | Điều hành | — |
| `J3` | `landing.create` | Tạo landing page | Điều hành · Điều phối | — |
| `J4` | `landing.publish` | Xuất bản landing page | Điều hành | — |
| `J5` | `social.publish` | Đăng bài lên mạng xã hội | Điều hành | — |
| `J6` | `chat.manage` | Quản lý hội thoại khách hàng | Điều hành · Điều phối | — |

### Sản phẩm và giá — nhóm L

76 mã thu hoạch bao phủ màn hình của FloraOS v1, nơi sản phẩm và giá gắn chặt vào luồng dựng thẻ chào giá. Core tách chúng thành năng lực riêng.

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `L1` | `product.read` | Xem sản phẩm trong Product Master | Điều hành · Điều phối · Sale | — |
| `L2` | `product.create` | Thêm sản phẩm mới | Điều hành · Điều phối | — |
| `L3` | `product.update` | Sửa thông tin sản phẩm | Điều hành · Điều phối | — |
| `L4` | `product.archive` | Ngừng kinh doanh một sản phẩm | Điều hành | Điều hành |
| `L5` | `pricing.read` | Xem quy tắc giá của tổ chức | Điều hành · Điều phối | — |
| `L6` | `pricing.manage` | Sửa quy tắc giá của tổ chức | Điều hành | Điều hành |

`product.approve` không nằm ở nhóm này — nó là `H3`, vì duyệt sản phẩm chính là duyệt kết quả phân tích ghi vào Product Master.

### Trải nghiệm — nhóm K

| Mã | Tên đọc được | Năng lực | Mặc định | Trần cứng |
|---|---|---|---|---|
| `K1` | `experience.use` | Dùng workspace trải nghiệm trong hạn mức | Experience User | — |
| `K2` | `experience.convert` | Chuyển workspace trải nghiệm thành tổ chức thật | Experience User · Điều hành | — |

## 5. Cặp năng lực tách rời — không bao giờ gói chung

| Chạy | Duyệt | Vì sao tách |
|---|---|---|
| `H1` `vision.analyze` | `H3` `product.approve` | Trong mô hình Chuỗi, Sale chạy phân tích nhưng Điều hành quyết dữ liệu nào vào Product Master |
| `I1` `media.optimize` | `I2` `media.approve` | Tải ảnh về không phải là phê duyệt. Chỉ ảnh đã duyệt mới thành asset chính thức của sản phẩm |
| `J1` `catalog.create` | `J2` `catalog.publish` | Soạn và phát hành ra ngoài là hai mức trách nhiệm |
| `J3` `landing.create` | `J4` `landing.publish` | Như trên |

Gói chung bất kỳ cặp nào ở trên là lỗi chặn ở review.

## 6. Cách kiểm quyền

Kiểm ở **tầng repository**, không ở route. Route quên kiểm là chuyện thường gặp; repository quên kiểm là lỗ hổng.

Endpoint không bao giờ hỏi "người này có phải Điều hành không". Nó hỏi "người này có `I2` không". Hard-code theo vai giao diện là lỗi chặn ở review.

## 7. Nguồn của bảng

Bảng ở mục 3 sinh từ `FloraOS/floraos-web/src/lib/maChucNang.ts`. Ba con số đã đối chiếu với mã nguồn và xác nhận ngày 09/09: **76 mã**, **18 mã có trần cứng**, dải nhóm E là **E1–E8**. Tài liệu kiến trúc V2 đã sửa theo.

Khi bảng năng lực trong mã đổi, sinh lại bảng này chứ không sửa tay.
