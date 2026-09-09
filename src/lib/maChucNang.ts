/* Bộ mã chức năng — từ vựng chung của cả hệ thống.
 *
 * Mỗi việc người dùng làm được có một mã. Tài liệu phân quyền, bảng công tắc
 * trên màn hình và phép kiểm ở máy chủ đều gọi cùng một mã, nên đọc tài liệu
 * và đọc màn hình là cùng một việc.
 *
 * Tệp này không gọi cơ sở dữ liệu và không đọc cấu hình — nó chỉ khai bảng rồi
 * trả lời. Bộ kiểm chạy thẳng trên chính nó.
 */

export type Vai = 'ADMIN' | 'COORDINATOR' | 'SALES'

export const BA_VAI: Vai[] = ['ADMIN', 'COORDINATOR', 'SALES']

const A: Vai[] = ['ADMIN']
const AC: Vai[] = ['ADMIN', 'COORDINATOR']
const ACS: Vai[] = ['ADMIN', 'COORDINATOR', 'SALES']

export interface KhaiChucNang {
  ten: string
  nhom: string
  /** Vai được phép khi chưa ai đụng vào bảng công tắc. */
  macDinh: Vai[]
  /** Trần cứng: dù cấu hình ghi khác, quyền cũng không vượt ra ngoài tập này.
   *  Bỏ trống nghĩa là không có trần. */
  tranCung?: Vai[]
  /** Công tắc không hiện trên bảng và không bật tắt được. */
  khongDoi?: boolean
}

export const CHUC_NANG = {
  /* --- Truy cập và tài khoản --- */
  A1: { ten: 'Đăng nhập bằng tài khoản nội bộ', nhom: 'Truy cập và tài khoản', macDinh: ACS, khongDoi: true },
  A2: { ten: 'Đổi mật khẩu đăng nhập của chính mình', nhom: 'Truy cập và tài khoản', macDinh: ACS, khongDoi: true },
  A3: { ten: 'Tạo tài khoản nội bộ', nhom: 'Truy cập và tài khoản', macDinh: A, tranCung: A },
  A4: { ten: 'Đổi vai của một tài khoản', nhom: 'Truy cập và tài khoản', macDinh: A, tranCung: A },
  A5: { ten: 'Bật tắt trạng thái hoạt động của tài khoản', nhom: 'Truy cập và tài khoản', macDinh: A, tranCung: A },
  A6: { ten: 'Đặt và đổi mật khẩu quản trị của kho', nhom: 'Truy cập và tài khoản', macDinh: A, tranCung: A },
  A7: { ten: 'Đặt lại mật khẩu đăng nhập của người khác', nhom: 'Truy cập và tài khoản', macDinh: A, tranCung: A },

  /* --- Phân tích ảnh --- */
  B1: { ten: 'Tải ảnh sản phẩm lên kho', nhom: 'Phân tích ảnh', macDinh: AC },
  B2: { ten: 'Xem danh sách ảnh, bỏ từng ảnh trước khi chạy', nhom: 'Phân tích ảnh', macDinh: AC },
  B3: { ten: 'Soát điều kiện trước khi chạy', nhom: 'Phân tích ảnh', macDinh: AC },
  B4: { ten: 'Xem ước phí lượt chạy', nhom: 'Phân tích ảnh', macDinh: AC },
  B5: { ten: 'Phân tích một ảnh mỗi lượt', nhom: 'Phân tích ảnh', macDinh: AC },
  B6: { ten: 'Phân tích nhiều ảnh trong một lượt', nhom: 'Phân tích ảnh', macDinh: A },
  B7: { ten: 'Phân tích cả một thư mục ảnh', nhom: 'Phân tích ảnh', macDinh: A },
  B8: { ten: 'Phân tích cả kho ảnh', nhom: 'Phân tích ảnh', macDinh: A },
  B9: { ten: 'Dừng lượt chạy của chính mình', nhom: 'Phân tích ảnh', macDinh: AC },
  B10: { ten: 'Dừng lượt chạy của người khác', nhom: 'Phân tích ảnh', macDinh: AC },
  B11: { ten: 'Xem nhật ký lượt chạy của chính mình', nhom: 'Phân tích ảnh', macDinh: AC },
  B12: { ten: 'Xem nhật ký mọi lượt chạy', nhom: 'Phân tích ảnh', macDinh: AC },
  B13: { ten: 'Mở khoá lượt chạy treo', nhom: 'Phân tích ảnh', macDinh: A },
  B14: { ten: 'Quét lại chỉ mục ảnh', nhom: 'Phân tích ảnh', macDinh: AC },
  B15: { ten: 'Nạp 02_KET-QUA.xlsx vào giao diện', nhom: 'Phân tích ảnh', macDinh: AC },
  B16: { ten: 'Tải tệp Excel kết quả về máy', nhom: 'Phân tích ảnh', macDinh: AC },

  /* --- Tạo thẻ và chào giá --- */
  C1: { ten: 'Xem bảng giá chào của sản phẩm đang chọn', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  C2: { ten: 'Chuyển một mã sang Điều phối dựng thẻ', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  C3: { ten: 'Mở tab Tạo thẻ', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C4: { ten: 'Chọn sản phẩm, nạp dữ liệu vào biểu mẫu', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C5: { ten: 'Điền biểu mẫu, địa chỉ ba cấp, khung giờ giao', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C6: { ten: 'Xem bảng kiểm giá thời gian thực', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C7: { ten: 'Nhập tay đè trường tự động, trừ Giá vốn', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C8: { ten: 'Nhập tay đè Giá vốn', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C9: { ten: 'Đặt giá chào chốt vượt Trần', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C10: { ten: 'Đặt giá chào chốt dưới Sàn', nhom: 'Tạo thẻ và chào giá', macDinh: A, tranCung: A },
  C11: { ten: 'Xem trước thẻ', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C12: { ten: 'Xuất PNG và PDF A6', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C13: { ten: 'Copy kịch bản Zalo', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C14: { ten: 'Xem sổ xuất thẻ của chính mình', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C15: { ten: 'Xem sổ xuất thẻ toàn công ty', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C16: { ten: 'Tải exports_log.csv về máy', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C17: { ten: 'Xem ảnh sản phẩm để tư vấn khách', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  C18: { ten: 'Xem danh bạ đối tác và lịch sử bắn đơn', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C19: { ten: 'Bắn đơn cho đối tác', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C20: { ten: 'Chốt đối tác nhận hoặc từ chối', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C21: { ten: 'Đóng một việc chờ dựng thẻ', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C22: { ten: 'Trả một việc chờ về cho Sales', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C23: { ten: 'Xem bảng điều phối trong ngày', nhom: 'Tạo thẻ và chào giá', macDinh: AC },
  C24: { ten: 'Xem danh sách mã toàn kho', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  C25: { ten: 'Xem bảng thành phần nguyên liệu của một mã', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  C26: { ten: 'Xem dữ liệu máy đọc được từ ảnh', nhom: 'Tạo thẻ và chào giá', macDinh: ACS },
  /* Giá dành cho Đối tác Shop. Trần cứng cắt sau bảng công tắc, nên không có
     đường nào từ giao diện hay cơ sở dữ liệu mở nhóm giá này cho người bán. */
  C27: { ten: 'Xem giá dành cho Đối tác Shop', nhom: 'Tạo thẻ và chào giá', macDinh: AC, tranCung: AC },
  /* Xoá vĩnh viễn một việc chờ, kèm toàn bộ lịch sử bắn đơn của nó. Không có
     đường lùi, nên trần cứng giữ nó ở vai Điều hành và mọi lượt xoá đều để lại
     một dòng trong nhật ký việc không hoàn tác được. */
  C28: { ten: 'Xoá vĩnh viễn một việc chờ', nhom: 'Tạo thẻ và chào giá', macDinh: A, tranCung: A },

  /* --- Cấu hình nghiệp vụ --- */
  D1: { ten: 'Mở màn Cài đặt và đọc toàn bộ tham số', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D2: { ten: 'Sửa hạng đối tác và tỷ lệ thưởng', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D3: { ten: 'Sửa nhóm phụ phí và mức phụ phí', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D4: { ten: 'Sửa nhãn ưu tiên và ma trận ưu tiên', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D5: { ten: 'Sửa danh mục lựa chọn', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D6: { ten: 'Sửa danh sách linh động', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D7: { ten: 'Sửa kỳ thanh toán', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D8: { ten: 'Sửa thư mục ảnh', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D9: { ten: 'Sửa chú giải trường', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D10: { ten: 'Sửa tham số chi phí theo vai', nhom: 'Cấu hình nghiệp vụ', macDinh: A, tranCung: A },
  D11: { ten: 'Xuất cấu hình ra tệp', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D12: { ten: 'Nhập cấu hình từ tệp', nhom: 'Cấu hình nghiệp vụ', macDinh: A },
  D13: { ten: 'Khôi phục cấu hình mặc định', nhom: 'Cấu hình nghiệp vụ', macDinh: A },
  D14: { ten: 'Cập nhật giá toàn bộ', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D15: { ten: 'Soát kỹ hệ thống', nhom: 'Cấu hình nghiệp vụ', macDinh: AC },
  D16: { ten: 'Sửa định mức tiền công theo độ khó', nhom: 'Cấu hình nghiệp vụ', macDinh: A, tranCung: A },
  D17: { ten: 'Đặt tham số giá của chiều tính từ giá sản xuất', nhom: 'Cấu hình nghiệp vụ', macDinh: A, tranCung: A },

  /* --- Hệ thống --- */
  E1: { ten: 'Mở màn Điều hành', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E2: { ten: 'Xem trạng thái kho và mã API dạng ✓/✕', nhom: 'Hệ thống', macDinh: ACS },
  E3: { ten: 'Xem bản che mã API', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E4: { ten: 'Dán mã API mới hoặc xoá mã API', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E5: { ten: 'Đổi mô hình AI', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E6: { ten: 'Khai đường dẫn kho dùng chung', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E7: { ten: 'Dò kho tự động', nhom: 'Hệ thống', macDinh: A, tranCung: A },
  E8: { ten: 'Xem và dọn ảnh mồ côi trong kho (F8)', nhom: 'Hệ thống', macDinh: A, tranCung: A },

  /* --- Nhóm sản phẩm khách gửi --- */
  F1: { ten: 'Nhận cảnh báo mã chưa có trong danh mục', nhom: 'Nhóm khách gửi', macDinh: AC },
  F2: { ten: 'Cấp mã khách gửi và tạo thư mục ảnh', nhom: 'Nhóm khách gửi', macDinh: ACS },
  F3: { ten: 'Sửa dòng danh mục khách gửi do mình tạo', nhom: 'Nhóm khách gửi', macDinh: AC },
  F4: { ten: 'Sửa dòng danh mục khách gửi của người khác', nhom: 'Nhóm khách gửi', macDinh: AC },
  F5: { ten: 'Xoá một dòng danh mục khách gửi', nhom: 'Nhóm khách gửi', macDinh: A },
  F6: { ten: 'Chuyển sản phẩm khách gửi vào danh mục công ty', nhom: 'Nhóm khách gửi', macDinh: A },
  F7: { ten: 'Ghi đè danh mục sản phẩm của công ty', nhom: 'Nhóm khách gửi', macDinh: A, tranCung: A },

  /* --- Công tắc chức năng --- */
  G1: { ten: 'Xem bảng công tắc chức năng', nhom: 'Công tắc chức năng', macDinh: AC },
  G2: { ten: 'Bật tắt một công tắc', nhom: 'Công tắc chức năng', macDinh: A, tranCung: A },
  G3: { ten: 'Trả toàn bảng về mặc định', nhom: 'Công tắc chức năng', macDinh: A, tranCung: A },
  G4: { ten: 'Xem nhật ký việc không hoàn tác được', nhom: 'Công tắc chức năng', macDinh: AC },

  /* --- Dữ liệu nguồn và sao lưu --- */
  H1: { ten: 'Tải đè 01_NHAP-LIEU.xlsx', nhom: 'Dữ liệu nguồn', macDinh: A, tranCung: A },
  H2: { ten: 'Tải đè mẫu thẻ card_template.html', nhom: 'Dữ liệu nguồn', macDinh: A, tranCung: A },
  H3: { ten: 'Xem danh sách bản sao lưu', nhom: 'Dữ liệu nguồn', macDinh: A, tranCung: A },
  H4: { ten: 'Khôi phục một bản sao lưu', nhom: 'Dữ liệu nguồn', macDinh: A, tranCung: A },
  H5: { ten: 'Tải cả thư mục ảnh vào kho', nhom: 'Dữ liệu nguồn', macDinh: A },

  /* --- Chi tiêu và duyệt --- */
  I1: { ten: 'Xem bảng thống kê chi phí', nhom: 'Chi tiêu và duyệt', macDinh: AC },
  I2: { ten: 'Đặt ngưỡng chi tiêu mỗi lượt', nhom: 'Chi tiêu và duyệt', macDinh: A, tranCung: A },
  I3: { ten: 'Chạy lượt vượt ngưỡng chi tiêu', nhom: 'Chi tiêu và duyệt', macDinh: A },
  I4: { ten: 'Xem danh sách sản phẩm chờ duyệt', nhom: 'Chi tiêu và duyệt', macDinh: AC },
  I5: { ten: 'Đánh dấu một cảnh báo đã xử lý', nhom: 'Chi tiêu và duyệt', macDinh: A },
} as const satisfies Record<string, KhaiChucNang>

export type MaChucNang = keyof typeof CHUC_NANG

/** Đọc một khai báo dưới dạng chung, không dưới dạng chữ hằng.
 *  `satisfies` giữ được phép kiểm tên khoá lúc biên dịch, nhưng cũng khiến mỗi
 *  mục mang một kiểu riêng — hàm này quy chúng về một kiểu để dùng chung. */
export function khai(ma: MaChucNang): KhaiChucNang {
  return CHUC_NANG[ma] as unknown as KhaiChucNang
}

export const MOI_MA = Object.keys(CHUC_NANG) as MaChucNang[]

/** Thứ tự nhóm khi vẽ bảng công tắc. */
export const THU_TU_NHOM = [
  'Truy cập và tài khoản', 'Phân tích ảnh', 'Tạo thẻ và chào giá',
  'Cấu hình nghiệp vụ', 'Hệ thống', 'Nhóm khách gửi',
  'Công tắc chức năng', 'Dữ liệu nguồn', 'Chi tiêu và duyệt',
]

export function laMaChucNang(v: unknown): v is MaChucNang {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CHUC_NANG, v)
}

/** Bảng công tắc mặc định: mã → danh sách vai. */
export function bangMacDinh(): Record<string, Vai[]> {
  const ra: Record<string, Vai[]> = {}
  MOI_MA.forEach((ma) => { ra[ma] = [...CHUC_NANG[ma].macDinh] })
  return ra
}

/**
 * Vai nào được phép làm việc `ma`.
 *
 * Ba lớp, theo thứ tự: bản mặc định → bảng công tắc trong cấu hình → trần cứng.
 * Trần cứng cắt sau cùng, nên bật `E4` cho vai Sales trong cơ sở dữ liệu cũng
 * không mở được.
 */
export function vaiDuocPhep(ma: MaChucNang, bang?: Record<string, unknown> | null): Vai[] {
  const k = khai(ma)
  let cho: Vai[] = [...k.macDinh]

  if (!k.khongDoi && bang && Array.isArray(bang[ma])) {
    const tuCauHinh = (bang[ma] as unknown[])
      .map((v) => String(v).toUpperCase())
      .filter((v): v is Vai => (BA_VAI as string[]).includes(v))
    cho = Array.from(new Set(tuCauHinh))
  }

  const tran = k.tranCung
  if (tran) cho = cho.filter((v) => tran.includes(v))

  // Cấu hình cắt sạch mọi vai thì rơi về bản mặc định. Một bảng công tắc sửa
  // tay trong cơ sở dữ liệu không được phép khoá cả công ty ra khỏi việc đổi
  // mã API — lúc ấy không còn đường nào mở lại.
  if (!cho.length && k.macDinh.length) {
    cho = tran ? k.macDinh.filter((v) => tran.includes(v)) : [...k.macDinh]
  }

  return BA_VAI.filter((v) => cho.includes(v))
}

export function duocPhep(vai: Vai, ma: MaChucNang, bang?: Record<string, unknown> | null): boolean {
  return vaiDuocPhep(ma, bang).includes(vai)
}

/** Công tắc nào bật tắt được, công tắc nào không. */
export function congTacDoiDuoc(ma: MaChucNang, vai: Vai): boolean {
  const k = khai(ma)
  if (k.khongDoi) return false
  if (k.tranCung && !k.tranCung.includes(vai)) return false
  return true
}

/** Làm sạch bảng gửi lên: bỏ mã lạ, bỏ vai lạ, ép qua trần cứng. */
export function lamSachBang(gui: unknown): Record<string, Vai[]> {
  const vao = (gui && typeof gui === 'object' ? gui : {}) as Record<string, unknown>
  const ra: Record<string, Vai[]> = {}
  MOI_MA.forEach((ma) => {
    if (khai(ma).khongDoi) return
    if (!Array.isArray(vao[ma])) return
    ra[ma] = vaiDuocPhep(ma, { [ma]: vao[ma] })
  })
  return ra
}

/** So hai bảng, trả về danh sách thay đổi để ghi vết. */
export function soBang(cu: Record<string, unknown> | null, moi: Record<string, unknown>) {
  const doi: { ma: MaChucNang; truoc: Vai[]; sau: Vai[] }[] = []
  MOI_MA.forEach((ma) => {
    const truoc = vaiDuocPhep(ma, cu)
    const sau = vaiDuocPhep(ma, moi)
    if (truoc.join(',') !== sau.join(',')) doi.push({ ma, truoc, sau })
  })
  return doi
}
