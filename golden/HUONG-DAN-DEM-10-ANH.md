# Đếm 10 ảnh — hướng dẫn một trang

## Mở phiếu

Nháy đúp `golden/phieu-dem.html`. Phiếu chạy ngay trong trình duyệt, không cần
mạng, không gửi ảnh đi đâu. Ảnh đọc tại chỗ từ `golden/images/`.

Điền **tên bạn** ở góc trên bên phải trước khi bắt đầu.

## Cách đếm

Bấm lên từng cành hoa trong ảnh — mỗi lần bấm là một dấu tròn có đánh số, và ô
"Số cành hoa" tự cộng lên. Bấm vào một dấu để bỏ dấu đó. Đếm 60 cành bằng mắt
không thì mất chỗ ở cành thứ hai mươi; dấu trên ảnh là để không phải đếm lại
từ đầu.

Ba loại dấu, đổi bằng phím `1` `2` `3`:

| Phím | Dấu | Đếm gì |
|---|---|---|
| `1` | đỏ | Cành hoa |
| `2` | xanh | Nụ chưa nở |
| `3` | vàng | Cành hỏng — gãy cổ, héo, dập |

Phím `Z` bỏ dấu vừa đánh. Mũi tên `←` `→` chuyển ảnh. Nút `+` `−` phóng to thu
nhỏ để nhìn rõ chỗ hoa chồng lấp.

Con số ở ô nhập **sửa tay được**. Đánh dấu chỉ để đỡ mất đếm; số cuối cùng là
số bạn gõ.

## Sáu quy ước

1. Nụ chưa nở đếm riêng, **không** cộng vào số cành hoa.
2. Lấy số **nhìn thấy trong ảnh**, không lấy số trên đơn hàng.
3. Cành nhiều bông — baby, cẩm chướng chùm, cúc chùm — đếm theo **cành**. Một
   cành là một đơn vị dù trên cành có mấy bông.
4. Lá và cành trang trí — bạch đàn, dương xỉ, lá kim — **ghi tên, để trống số**.
5. Giấy gói, ruy băng, giỏ, hộp là cấu phần. Giấy gói đếm theo **số lớp**.
6. Hoa gãy, héo, dập **vẫn tính** vào tổng, đồng thời ghi ở ô cành hỏng.

Gặp tình huống sáu dòng trên chưa nói tới thì **dừng, không tự quyết** — ghi vào
ô Ghi chú. Tự quyết một lần là bộ ảnh có hai chuẩn, và sau đó không ai biết ảnh
nào theo chuẩn nào.

## Vì sao phiếu không hiện kết quả của máy

Nhìn máy khai 17 rồi gật theo thì con số đó mang phán đoán của máy, và lấy nó
chấm điểm chính máy là phép đo vòng tròn. Phiếu cố tình giấu — đây là điều kiện
để bộ ảnh phát hiện được lỗi hệ thống, dạng lỗi mà gọi lại mô hình ba lượt vẫn
ra cùng một câu trả lời sai.

## Xong thì làm gì

Bấm **Tải phiếu về**. Trình duyệt lưu một tệp `phieu-dem-<tên>.json` vào
Downloads. Đưa tệp đó vào:

```
python3 scripts/nap-phieu-dem.py ~/Downloads/phieu-dem-tuan.json --vong 1
```

Lệnh trên chỉ **soát**, chưa ghi. Không báo lỗi thì chạy lại kèm `--that` để ghi
thật vào `golden/labels/`.

## Vòng hai

`BO_ANH_VANG.md` mục 7 đòi **hai người đếm độc lập**, không nhìn nhãn của nhau.
Người thứ hai đếm cùng 10 ảnh trên phiếu trắng, rồi:

```
python3 scripts/nap-phieu-dem.py ~/Downloads/phieu-dem-lan.json --vong 2
```

Script đối chiếu hai vòng và **dừng lại ở mọi chỗ lệch** thay vì ghi đè. Lệch
trên 10% số ảnh nghĩa là quy ước đếm chưa đủ rõ — sửa `QUY_UOC_DEM.md` trước,
rồi cả hai rà lại, chứ không phải người đếm cẩu thả.

## Rồi mới chấm máy

```
python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals              # Cục bộ
python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals-openai       # Đầy đủ
python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals-openai-direct # Gọn
```

Sáu chỉ số, cắt theo dạng sản phẩm và số cấu phần. Một bộ thắng ở ảnh dễ nhưng
thua ở ảnh khó là thông tin quyết định, và điểm gộp giấu đúng điều đó.

## Mười ảnh đã chọn

| Ảnh | Dạng | Bộ máy đã chạy |
|---|---|---|
| g001, g002 | giỏ | cả ba |
| g003–g006 | giỏ | Cục bộ |
| g010, g011 | lẵng | Đầy đủ · Gọn |
| g040, g049 | bó | chưa bộ nào |

Bốn ảnh cuối chưa đủ bộ chạy. Sau khi có nhãn, chạy bù cho đủ ba bộ trên cả 10
ảnh rồi mới so — so hai bộ trên hai tập ảnh khác nhau là so hai thứ không so được.
