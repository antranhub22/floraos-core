// Sinh file mẫu nhập kho sản phẩm: `node scripts/build-product-import-template.mjs`
// Đầu ra: public/templates/ (nút "Tải file mẫu" ở /san-pham/nhap-hang-loat).
import ExcelJS from "exceljs";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function buildEnterpriseTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FloraOS SaaS Core";
  wb.lastModifiedBy = "FloraOS System Architecture";
  wb.created = new Date();
  wb.modified = new Date();

  // ==========================================
  // SHEET 1: MAU_NHAP_LIEU_SAN_PHAM
  // ==========================================
  const ws1 = wb.addWorksheet("Mau_Nhap_Lieu_San_Pham", {
    views: [{ state: "frozen", ySplit: 3, activeCell: "A4" }],
    properties: { tabColor: { argb: "BE123C" } },
  });

  // Group Ranges
  const groupRanges = [
    { from: 1, to: 2, title: "1. ĐỊNH DANH SẢN PHẨM", bg: "0F172A" },
    { from: 3, to: 8, title: "2. PHÂN LOẠI & THẨM MỸ THIẾT KẾ", bg: "1E3A8A" },
    { from: 9, to: 12, title: "3. THÔNG SỐ SẢN XUẤT & TAY NGHỀ", bg: "374151" },
    { from: 13, to: 14, title: "4. GIÁ BÁN & BIÊN LỢI NHUẬN", bg: "065F46" },
    { from: 15, to: 17, title: "5. CÔNG THỨC HOA (BOM) & ĐÓNG GÓI", bg: "92400E" },
    { from: 18, to: 23, title: "6. CHÂN DUNG KHÁCH HÀNG & CRM", bg: "6B21A8" },
    { from: 24, to: 26, title: "7. MEDIA & VẬN HÀNH KHO", bg: "1E293B" },
  ];

  ws1.addRow([]); // Row 1
  ws1.getRow(1).height = 25;

  groupRanges.forEach((g) => {
    ws1.mergeCells(1, g.from, 1, g.to);
    const cell = ws1.getCell(1, g.from);
    cell.value = g.title;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: g.bg } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Column Headers (Row 2)
  const columnsDef = [
    { key: "sku", header: "Mã SKU Chuẩn (FloraOS) *", width: 22, mandatory: true, numFmt: "@" },
    { key: "name", header: "Tên mẫu hoa *", width: 32, mandatory: true, numFmt: "@" },
    { key: "category", header: "Danh mục chuẩn *", width: 24, mandatory: true, numFmt: "@" },
    { key: "shape", header: "Kiểu dáng / Dáng cắm", width: 20, mandatory: false, numFmt: "@" },
    { key: "style", header: "Phong cách thiết kế", width: 24, mandatory: false, numFmt: "@" },
    { key: "tone", header: "Tone màu chủ đạo", width: 18, mandatory: false, numFmt: "@" },
    { key: "season", header: "Mùa vụ / Tần suất", width: 16, mandatory: false, numFmt: "@" },
    { key: "size", header: "Size", width: 10, mandatory: false, numFmt: "@" },
    { key: "difficulty", header: "Độ khó kỹ thuật (Level)", width: 22, mandatory: false, numFmt: "@" },
    { key: "time", header: "Thời gian cắm (phút)", width: 18, mandatory: false, numFmt: "#,##0" },
    { key: "price", header: "Giá niêm yết B2C (VNĐ) *", width: 22, mandatory: true, numFmt: "#,##0" },
    { key: "cost", header: "Giá vốn / Giá gốc (VNĐ)", width: 22, mandatory: false, numFmt: "#,##0" },
    { key: "bom", header: "Hoa chính (BOM)", width: 34, mandatory: false, numFmt: "@" },
    { key: "accessories", header: "Phụ liệu nổi bật", width: 28, mandatory: false, numFmt: "@" },
    { key: "packaging", header: "Quy cách đóng gói & Bảo quản", width: 36, mandatory: false, numFmt: "@" },
    { key: "occasions", header: "Dịp phù hợp", width: 32, mandatory: false, numFmt: "@" },
    { key: "purposes", header: "Mục đích tặng", width: 26, mandatory: false, numFmt: "@" },
    { key: "recipients", header: "Đối tượng người nhận", width: 28, mandatory: false, numFmt: "@" },
    { key: "relations", header: "Mối quan hệ", width: 24, mandatory: false, numFmt: "@" },
    { key: "genders", header: "Giới tính phù hợp", width: 16, mandatory: false, numFmt: "@" },
    { key: "ages", header: "Độ tuổi phù hợp", width: 18, mandatory: false, numFmt: "@" },
    { key: "wishes", header: "Lời chúc / Thông điệp gợi ý", width: 34, mandatory: false, numFmt: "@" },
    { key: "story", header: "Câu chuyện hoa (Copywriting bán hàng)", width: 45, mandatory: false, numFmt: "@" },
    { key: "image", header: "Tên file ảnh (hoặc URL ảnh) *", width: 26, mandatory: true, numFmt: "@" },
    { key: "status", header: "Trạng thái kinh doanh", width: 18, mandatory: false, numFmt: "@" },
    { key: "notes", header: "Ghi chú nội bộ", width: 24, mandatory: false, numFmt: "@" },
  ];

  const headerRow = ws1.addRow(columnsDef.map((c) => c.header));
  headerRow.height = 30;

  columnsDef.forEach((col, idx) => {
    const colNum = idx + 1;
    ws1.getColumn(colNum).width = col.width;
    const cell = headerRow.getCell(colNum);
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: col.mandatory ? "991B1B" : "1E293B" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col.mandatory ? "FEE2E2" : "F1F5F9" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: "94A3B8" } },
      bottom: { style: "medium", color: { argb: "64748B" } },
      left: { style: "thin", color: { argb: "CBD5E1" } },
      right: { style: "thin", color: { argb: "CBD5E1" } },
    };
  });

  // Helper Description Row (Row 3)
  const helperTexts = [
    "VD: FL-1001 (Không trùng)",
    "Tên hiển thị trên web/catalog",
    "Chọn theo Sheet Từ điển",
    "Dáng tròn, Hàn Quốc, Tam giác...",
    "Hiện đại, Sang trọng, Tự nhiên...",
    "Đỏ, Hồng, Vàng, Trắng, Tím...",
    "Quanh năm, Mùa hè, Tết...",
    "S, M, L, XL",
    "Mức Dễ (Lv.1), Mức TB (Lv.2), Mức Khó (Lv.3)",
    "Phút thợ cắm hoàn thành",
    "Số nguyên (VD: 450000)",
    "Chi phí tính biên lợi nhuận",
    "Tên hoa: Số lượng (VD: Hồng đỏ: 10 cành)",
    "Lá phụ, nơ lụa, banner...",
    "Giấy kraft 3 lớp, giỏ mây, chậu sứ...",
    "Sinh nhật, Khai trương, 8/3, 20/10...",
    "Chúc mừng, Tình yêu, Tri ân...",
    "Cá nhân, Bạn bè, Doanh nghiệp...",
    "Người yêu, Vợ/Chồng, Bố mẹ, Đối tác...",
    "Nữ, Nam, Tất cả",
    "18-24, 25-34, 35-44, 45-55...",
    "Gợi ý in thiệp chúc",
    "Ý nghĩa hoa phục vụ tư vấn bán",
    "Tên file (FL-1001.jpg) hoặc link ảnh",
    "Đang bán, Tạm dừng, Hết hàng",
    "Lưu ý riêng cho nhân viên shop",
  ];

  const helperRow = ws1.addRow(helperTexts);
  helperRow.height = 22;
  helperTexts.forEach((_, idx) => {
    const cell = helperRow.getCell(idx + 1);
    cell.font = { name: "Segoe UI", size: 8.5, italic: true, color: { argb: "64748B" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "94A3B8" } },
      left: { style: "thin", color: { argb: "E2E8F0" } },
      right: { style: "thin", color: { argb: "E2E8F0" } },
    };
  });

  // Mock data rows
  const mockData = [
    [
      "FL-1001", "Bó hoa Nắng Hạ Rạng Rỡ", "Bó hoa", "Dáng tròn", "Hiện đại, Tự nhiên", "Vàng ấm", "Quanh năm", "M",
      "Mức Dễ (Lv.1)", 45, 450000, 220000, "Hồng vàng: 10 cành, Baby trắng: 5 cành", "Lá bạc: 3 cành, Nơ lụa kem sang trọng",
      "Giấy gói kraft nâu Hàn Quốc 3 lớp, kèm túi kiếng xách hoa", "Sinh nhật, Chúc mừng, Kỷ niệm", "Chúc mừng, Tình yêu, Kết nối",
      "Cá nhân, Bạn bè, Đồng nghiệp", "Bạn bè, Người yêu, Vợ", "Nữ, Nam", "18-24, 25-34", "Chúc mừng sinh nhật, Vạn sự như ý",
      "Mang sắc vàng rực rỡ tựa ánh nắng ban mai, lan tỏa nguồn năng lượng tích cực và may mắn đến người nhận.",
      "FL-1001.jpg", "Đang bán", "Mẫu bán chạy mùa hè",
    ],
    [
      "FL-1002", "Giỏ hoa Tình Yêu Ngọt Ngào", "Giỏ hoa", "Hàn Quốc tự nhiên", "Hiện đại, Sang trọng", "Hồng pastel", "Quanh năm", "L",
      "Mức Trung bình (Lv.2)", 60, 680000, 310000, "Hồng Ohara: 12 cành, Cát tường hồng: 6 cành", "Lá chanh: 4 cành, Nơ voan hồng pastel",
      "Giỏ mây mộc đan tay lót xốp Oasis ngậm no nước, bọc màng bảo vệ ẩm", "Kỷ niệm, Tình yêu, Lễ tình nhân 14/2, 20/10", "Tỏ tình, Tình yêu, Lãng mạn",
      "Người yêu, Vợ, Bạn gái", "Người yêu, Vợ", "Nữ", "18-24, 25-34", "Mãi mãi yêu em, Happy Anniversary",
      "Sắc hồng ngọt ngào dịu êm của hoa hồng Ohara nhập khẩu thay lời thì thầm yêu thương chân thành nhất.",
      "FL-1002.jpg", "Đang bán", "Đơn đặt trước 1 ngày",
    ],
    [
      "FL-1003", "Kệ hoa Khai Trương Hồng Phát", "Kệ hoa khai trương", "Dáng tam giác", "Sang trọng, Nổi bật", "Đỏ rực rỡ", "Quanh năm", "L",
      "Mức Trung bình (Lv.2)", 90, 1500000, 750000, "Đồng tiền đỏ: 20 bông, Lan mokara đỏ: 10 cành, Hồng môn đỏ: 8 búp", "Lá cau kiểng, Băng rôn in chữ kim nhũ + Nơ đỏ đại",
      "Kệ sắt mỹ thuật 1.6m sơn tĩnh điện, cố định xốp chuyên dụng", "Khai trương, Khánh thành, Kỷ niệm thành lập", "Chúc mừng, Hồng phát, Đối tác",
      "Doanh nghiệp, Đối tác, Khách hàng VIP", "Đối tác, Bạn bè, Khách hàng", "Nam, Nữ, Doanh nghiệp", "25-34, 35-44, 45-55", "Khai trương hồng phát, Tấn tài tấn lộc",
      "Sắc đỏ rực rỡ đại diện cho cung tài lộc thăng hoa, khởi đầu hanh thông và thịnh vượng bền lâu.",
      "FL-1003.jpg", "Đang bán", "Có xe giao riêng",
    ],
    [
      "FL-1004", "Chậu Lan Hồ Điệp Phú Quý 5 Cành", "Chậu hoa / Lan hồ điệp", "Dáng quạt tự nhiên", "Quý phái, Phong thủy", "Vàng hoàng gia", "Tết, Quanh năm", "XL",
      "Mức Khó (Lv.3)", 75, 1450000, 850000, "Lan hồ điệp vàng loại A: 5 cành bông to đều", "Cây tuyết tùng mini, rêu xanh phủ gốc, nơ đồng cao cấp",
      "Chậu sứ men trắng Bát Tràng cao cấp, khung định hình cuống hoa nan sắt", "Tân gia, Khai trương, Chúc Tết, Mừng thọ", "Chúc mừng, Tài lộc, Tri ân",
      "Doanh nghiệp, Đối tác, Người lớn tuổi, Gia đình", "Khách hàng VIP, Bố mẹ, Sếp", "Nam, Nữ", "35-44, 45-55, >55", "Vạn sự như ý, An khang thịnh vượng",
      "Lan hồ điệp đại diện cho sự vương giả, sung túc và trường tồn, mang năng lượng phong thủy thịnh vượng đến gia chủ.",
      "FL-1004.jpg", "Đang bán", "Chăm sóc nhiệt độ mát",
    ],
  ];

  mockData.forEach((rowVals, rIdx) => {
    const row = ws1.addRow(rowVals);
    row.height = 24;
    const isEven = rIdx % 2 === 0;
    columnsDef.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFFFFF" : "F8FAFC" } };
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: ["sku", "size", "time", "price", "cost", "status"].includes(col.key) ? "center" : "left",
        wrapText: ["bom", "accessories", "packaging", "story"].includes(col.key),
      };
      if (col.numFmt) {
        cell.numFmt = col.numFmt;
      }
    });
  });

  // Enable Excel Data Validations on 500 rows
  const DATA_ROWS_COUNT = 500;
  for (let r = 4; r <= DATA_ROWS_COUNT; r++) {
    ws1.getCell(`C${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"Bó hoa,Giỏ hoa,Hộp hoa,Kệ hoa khai trương,Hoa chia buồn,Chậu hoa / Lan hồ điệp,Bình hoa / Ụ hoa để bàn,Cây cảnh & Quà tặng"`],
    };
    ws1.getCell(`D${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"Dáng tròn,Dáng tam giác,Dáng dài,Hàn Quốc tự nhiên,Dáng thác nước,Dáng quạt,Dáng tự do"`],
    };
    ws1.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"Đỏ rực rỡ,Hồng pastel,Vàng ấm,Trắng kem,Cam tươi,Tím mộng mơ,Xanh Blue,Xanh lá,Đa sắc"`],
    };
    ws1.getCell(`H${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"S,M,L,XL"`],
    };
    ws1.getCell(`I${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"Mức Dễ (Lv.1),Mức Trung bình (Lv.2),Mức Khó (Lv.3)"`],
    };
    ws1.getCell(`Y${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"Đang bán,Tạm dừng,Hết hàng"`],
    };
  }

  // ==========================================
  // SHEET 2: HUONG_DAN_DIEN_THONG_TIN
  // ==========================================
  const ws2 = wb.addWorksheet("Huong_Dan_Dien_Thong_Tin", {
    properties: { tabColor: { argb: "0284C7" } },
  });

  ws2.columns = [
    { header: "STT", key: "stt", width: 8 },
    { header: "Tên trường thông tin", key: "name", width: 30 },
    { header: "Cấp độ bắt buộc", key: "level", width: 20 },
    { header: "Định dạng kỹ thuật", key: "fmt", width: 22 },
    { header: "Quy tắc nhập liệu & Ý nghĩa nghiệp vụ trong FloraOS", key: "desc", width: 80 },
  ];

  const guideHRow = ws2.getRow(1);
  guideHRow.height = 28;
  [1, 2, 3, 4, 5].forEach((c) => {
    const cell = guideHRow.getCell(c);
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideEntries = [
    [1, "Mã SKU Chuẩn (FloraOS)", "BẮT BUỘC (*)", "Chuỗi ký tự (@)", "Mã định danh duy nhất của sản phẩm. Không trùng lặp (VD: FL-1001, BO-001). Cấm khoảng trắng hai đầu."],
    [2, "Tên mẫu hoa", "BẮT BUỘC (*)", "Chuỗi ký tự (@)", "Tên thương mại hoa tươi hiển thị cho khách xem trên Website, Catalog điện tử và Bill bán lẻ."],
    [3, "Danh mục chuẩn", "BẮT BUỘC (*)", "Dropdown danh sách", "Chọn đúng nhóm để kích hoạt bộ lọc và template tương ứng: Bó hoa, Giỏ hoa, Hộp hoa, Kệ hoa khai trương, Hoa chia buồn..."],
    [4, "Kiểu dáng / Dáng cắm", "Khuyến nghị", "Dropdown danh sách", "Dáng tròn, Dáng tam giác, Dáng dài, Hàn Quốc tự nhiên, Dáng thác nước, Dáng quạt... Giúp thợ định hình khung cắm."],
    [5, "Phong cách thiết kế", "Khuyến nghị", "Chuỗi ký tự (@)", "Hiện đại, Sang trọng, Cổ điển, Vintage, Tối giản, Mộc mạc... Phục vụ AI phân tích và gợi ý theo gu khách hàng."],
    [6, "Tone màu chủ đạo", "Khuyến nghị", "Dropdown danh sách", "Đỏ rực rỡ, Hồng pastel, Vàng ấm, Trắng kem, Cam tươi, Tím mộng mơ, Xanh Blue, Đa sắc... Hỗ trợ khách lọc màu phong thủy."],
    [7, "Mùa vụ / Tần suất", "Tùy chọn", "Chuỗi ký tự (@)", "Quanh năm, Mùa hè, Mùa xuân, Dịp Tết, Mùa hoa nhập khẩu."],
    [8, "Size", "Tùy chọn", "Dropdown danh sách", "S (Nhỏ gọn), M (Tiêu chuẩn), L (Lớn sang trọng), XL (Đại nổi bật)."],
    [9, "Độ khó kỹ thuật (Level)", "Khuyến nghị", "Dropdown danh sách", "Mức Dễ (Lv.1) - Thợ phụ / Học việc; Mức Trung bình (Lv.2) - Thợ chính; Mức Khó (Lv.3) - Nghệ nhân tay nghề cao."],
    [10, "Thời gian cắm (phút)", "Tùy chọn", "Số nguyên (#,##0)", "Số phút tiêu chuẩn để cắm hoàn thiện 1 sản phẩm. Giúp hệ thống tính toán tiến độ điều phối đơn."],
    [11, "Giá niêm yết B2C (VNĐ)", "BẮT BUỘC (*)", "Số tiền (#,##0)", "Giá bán lẻ đến tay khách hàng. Điền số nguyên (vd: 450000). Cấm gõ chữ đ hoặc dấu chấm phẩy thập phân."],
    [12, "Giá vốn / Giá gốc (VNĐ)", "Tùy chọn", "Số tiền (#,##0)", "Tổng chi phí hoa nguyên liệu + phụ liệu + công thợ để hệ thống tự động đo lường biên lợi nhuận (nội bộ)."],
    [13, "Hoa chính (BOM)", "Khuyến nghị", "Chuỗi cấu trúc (@)", "Thành phần loài hoa & số lượng, phân tách bằng dấu phẩy. VD: 'Hồng vàng: 10 cành, Baby trắng: 5 cành'."],
    [14, "Phụ liệu nổi bật", "Tùy chọn", "Chuỗi ký tự (@)", "Lá bạc, nơ lụa, giấy gói, hoa baby đệm, ruy băng in thương hiệu, xốp Oasis..."],
    [15, "Quy cách đóng gói & Bảo quản", "Khuyến nghị", "Chuỗi ký tự (@)", "Quy chuẩn đóng gói khi vận chuyển: Giấy bọc 3 lớp, giỏ mây ngậm nước, túi kiếng xách hoa, xe máy hay ô tô."],
    [16, "Dịp phù hợp", "Khuyến nghị", "Chuỗi ký tự (@)", "Sinh nhật, Khai trương, Kỷ niệm ngày cưới, Tình yêu 14/2, 8/3, 20/10, 20/11, Tốt nghiệp, Tang lễ..."],
    [17, "Mục đích tặng", "Tùy chọn", "Chuỗi ký tự (@)", "Chúc mừng, Tình yêu, Tri ân, Xin lỗi, Động viên, Thăm bệnh, Viếng tang... Giúp AI gợi ý thông minh."],
    [18, "Đối tượng người nhận", "Tùy chọn", "Chuỗi ký tự (@)", "Cá nhân, Bạn bè, Người yêu, Vợ/Chồng, Bố mẹ, Ông bà, Sếp, Đối tác VIP, Doanh nghiệp..."],
    [19, "Mối quan hệ", "Tùy chọn", "Chuỗi ký tự (@)", "Vợ/Chồng, Người yêu, Đồng nghiệp, Đối tác kinh doanh, Thầy cô, Bằng hữu."],
    [20, "Giới tính phù hợp", "Tùy chọn", "Dropdown danh sách", "Nữ, Nam, Tất cả."],
    [21, "Độ tuổi phù hợp", "Tùy chọn", "Chuỗi ký tự (@)", "<18, 18-24, 25-34, 35-44, 45-55, >55."],
    [22, "Lời chúc / Thông điệp gợi ý", "Tùy chọn", "Chuỗi ký tự (@)", "Gợi ý câu chúc hay in thiệp hoặc banner đi kèm phù hợp nhất với phong thái bó hoa."],
    [23, "Câu chuyện hoa (Copywriting)", "Tùy chọn", "Chuỗi văn bản (@)", "Ý nghĩa biểu tượng sâu sắc của hoa, câu chuyện nguồn cảm hứng dùng làm caption bán hàng mạng xã hội."],
    [24, "Tên file ảnh (hoặc URL ảnh)", "BẮT BUỘC (*)", "Tên file / URL", "Tên file ảnh đặt trong folder nén tải lên (vd: FL-1001.jpg) HOẶC đường dẫn link ảnh trực tiếp."],
    [25, "Trạng thái kinh doanh", "Khuyến nghị", "Dropdown danh sách", "Đang bán (hiển thị cho khách chọn), Tạm dừng (ẩn tạm thời), Hết hàng (tạm hết nguyên liệu)."],
    [26, "Ghi chú nội bộ", "Tùy chọn", "Chuỗi ký tự (@)", "Ghi chú bí mật nội bộ tiệm: Mẫu cần đặt trước 1 ngày, chỉ làm theo mùa hoa Đà Lạt..."],
  ];

  guideEntries.forEach((g, idx) => {
    const row = ws2.addRow(g);
    row.height = 24;
    const isEven = idx % 2 === 0;
    [1, 2, 3, 4, 5].forEach((colIdx) => {
      const cell = row.getCell(colIdx);
      cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFFFFF" : "F8FAFC" } };
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
      if (colIdx === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
      if (colIdx === 3) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (g[2].includes("BẮT BUỘC")) {
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "DC2626" } };
        }
      }
      if (colIdx === 4) cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // ==========================================
  // SHEET 3: TU_DIEN_QUY_UOC_HE_THONG
  // ==========================================
  const ws3 = wb.addWorksheet("Tu_Dien_Quy_Uoc_He_Thong", {
    properties: { tabColor: { argb: "16A34A" } },
  });

  ws3.columns = [
    { header: "Nhóm thông tin chuẩn", key: "group", width: 25 },
    { header: "Giá trị chuẩn đề xuất (Standard Values)", key: "val", width: 45 },
    { header: "Mã viết tắt", key: "code", width: 14 },
    { header: "Mục đích & Hướng dẫn áp dụng trong thực tế", key: "note", width: 55 },
  ];

  const dictHRow = ws3.getRow(1);
  dictHRow.height = 28;
  [1, 2, 3, 4].forEach((c) => {
    const cell = dictHRow.getCell(c);
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const dictEntries = [
    ["Danh mục chuẩn", "Bó hoa", "BO", "Áp dụng cho mọi mẫu hoa gói giấy/vải cầm tay."],
    ["Danh mục chuẩn", "Giỏ hoa", "GIO", "Hoa cắm giỏ mây, giỏ tre, giỏ gỗ để bàn."],
    ["Danh mục chuẩn", "Hộp hoa", "HOP", "Hoa cắm hộp mica, hộp tròn, hộp tim, hộp mở."],
    ["Danh mục chuẩn", "Kệ hoa khai trương", "KE", "Kệ hoa đứng 1-2 tầng chúc mừng sự kiện, khai trương."],
    ["Danh mục chuẩn", "Hoa chia buồn", "CB", "Kệ hoa, vòng hoa, giỏ hoa tang lễ viếng chia buồn."],
    ["Danh mục chuẩn", "Chậu hoa / Lan hồ điệp", "CHAU", "Chậu lan hồ điệp ghép chậu từ 1 đến 20+ cành."],
    ["Danh mục chuẩn", "Bình hoa / Ụ hoa để bàn", "BINH", "Bình gốm, bình thủy tinh cắm sẵn hoặc ụ hoa bàn tiệc, bàn họp."],
    ["Danh mục chuẩn", "Cây cảnh & Quà tặng", "QUA", "Cây để bàn, gấu bông, thiệp cao cấp, phụ kiện quà tặng."],
    ["Kiểu dáng thiết kế", "Dáng tròn, Dáng tam giác, Dáng dài, Hàn Quốc tự nhiên, Dáng thác nước, Dáng quạt, Dáng tự do", "", "Định hình form dáng kỹ thuật phục vụ thợ cắm hoa và phân loại hình ảnh."],
    ["Phong cách thiết kế", "Hiện đại, Sang trọng, Hàn Quốc tự nhiên, Cổ điển, Vintage, Tối giản, Mộc mạc", "", "Phong cách thẩm mỹ phục vụ AI gợi ý và bộ lọc khách hàng."],
    ["Tone màu chủ đạo", "Đỏ rực rỡ, Hồng pastel, Vàng ấm, Trắng kem, Cam tươi, Tím mộng mơ, Xanh Blue, Xanh lá, Đa sắc", "", "Tone màu nhận diện chính của mẫu hoa (giúp khách lọc theo màu phong thủy / sở thích)."],
    ["Dịp phù hợp", "Sinh nhật, Khai trương, Kỷ niệm ngày cưới, Tình yêu 14/2, Ngày Phụ nữ 8/3 - 20/10, Ngày Nhà giáo 20/11, Tốt nghiệp, Chúc sức khỏe, Chia buồn, Tết Nguyên Đán", "", "Dịp tặng chính để AI gợi ý nội dung thiệp, kịch bản bán hàng và bộ sưu tập."],
    ["Mục đích tặng", "Chúc mừng, Tình yêu, Tri ân / Cảm ơn, Xin lỗi / Làm hòa, Động viên, Tỏ tình, Thăm bệnh, Viếng tang", "", "Nhu cầu cảm xúc cốt lõi của người mua."],
    ["Đối tượng người nhận", "Cá nhân, Bạn bè, Người yêu, Vợ/Chồng, Bố mẹ, Ông bà, Thầy cô, Đồng nghiệp, Đối tác, Khách hàng VIP, Doanh nghiệp", "", "Chân dung người nhận để nhân viên tư vấn chuẩn gu."],
    ["Độ khó kỹ thuật", "Mức Dễ (Lv.1), Mức Trung bình (Lv.2), Mức Khó (Lv.3)", "", "Phân bổ việc cho thợ phụ, thợ chính hoặc nghệ nhân."],
    ["Quy ước mã SKU", "Tiền tố thương hiệu + Chữ cái loại hoa + 4 số thứ tự (VD: FL-1001, LVB0001, SSB0001)", "", "Thống nhất nhận diện hàng hóa trên toàn hệ sinh thái FloraOS."],
  ];

  dictEntries.forEach((d, idx) => {
    const row = ws3.addRow(d);
    row.height = 24;
    const isEven = idx % 2 === 0;
    [1, 2, 3, 4].forEach((colIdx) => {
      const cell = row.getCell(colIdx);
      cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFFFFF" : "F8FAFC" } };
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
      if (colIdx === 3) cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  const fileName = "FloraOS_Template_Master_Kho_San_Pham.xlsx";
  const outPathPublic = path.join(ROOT, "public/templates", fileName);
  fs.mkdirSync(path.dirname(outPathPublic), { recursive: true });

  await wb.xlsx.writeFile(outPathPublic);

  console.log("Enterprise Grade Template 1 successfully created at:");
  console.log("  -", outPathPublic);
}

buildEnterpriseTemplate().catch((err) => {
  console.error(err);
  process.exit(1);
});
