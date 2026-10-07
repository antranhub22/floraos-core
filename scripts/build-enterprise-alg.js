const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

async function buildEnterpriseALGFile() {
  const dir = "/Users/tuan/Projects/floraos-core/docs/Dongbo_excel";
  const csvPath = path.join(dir, "[ALG - Sale - 2026]Danh sách khách hàng - 2.2. Sản phẩm.csv");
  const outPath = path.join(dir, "FloraOS_Master_Kho_San_Pham_ALG_Template_Chuan.xlsx");

  console.log("Reading CSV raw data...");
  const XLSX = require("xlsx");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const wbIn = XLSX.read(csvContent, { type: "string" });
  const wsIn = wbIn.Sheets[wbIn.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(wsIn, { header: 1 });

  function cleanBullets(val) {
    if (!val) return "";
    return String(val)
      .split("\n")
      .map((l) => l.replace(/^[•\s\-\*]+/, "").trim())
      .filter(Boolean)
      .join(", ");
  }

  function parseCleanPrice(val) {
    if (!val) return null;
    let str = String(val).trim().replace(/[₫\s]/g, "");
    if (!str) return null;
    if (/,\d{2}$/.test(str)) {
      str = str.replace(/,/, "") + "0";
      return parseInt(str, 10);
    }
    if (str === "500") return 500000;
    str = str.replace(/[,.]/g, "");
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  }

  function mapCategory(catRaw) {
    const c = String(catRaw || "").trim().toLowerCase();
    if (c.includes("bó")) return "Bó hoa";
    if (c.includes("giỏ") || c.includes("lẵng")) return "Giỏ hoa";
    if (c.includes("kệ")) return "Kệ hoa khai trương";
    if (c.includes("chậu")) return "Chậu hoa / Lan hồ điệp";
    if (c.includes("hộp")) return "Hộp hoa";
    if (c.includes("ụ") || c.includes("bát")) return "Bình hoa / Ụ hoa để bàn";
    return catRaw || "Khác";
  }

  console.log("Initializing ExcelJS Workbook...");
  const wb = new ExcelJS.Workbook();
  wb.creator = "FloraOS SaaS Core";
  wb.lastModifiedBy = "FloraOS Master Data";
  wb.created = new Date();
  wb.modified = new Date();

  // ==========================================
  // SHEET 1: KHO_SAN_PHAM_ALG_LOVI_SIIN
  // ==========================================
  const ws1 = wb.addWorksheet("Kho_San_Pham_ALG_Lovi_Siin", {
    views: [{ state: "frozen", ySplit: 2, activeCell: "A3" }],
    properties: { tabColor: { argb: "BE123C" } },
  });

  // Group Ranges (Row 1)
  const groupRanges = [
    { from: 1, to: 4, title: "1. ĐỊNH DANH ĐA THƯƠNG HIỆU (FLORAOS · LOVI · SIIN)", bg: "0F172A" },
    { from: 5, to: 10, title: "2. PHÂN LOẠI & THẨM MỸ THIẾT KẾ", bg: "1E3A8A" },
    { from: 11, to: 12, title: "3. THÔNG SỐ TAY NGHỀ & SẢN XUẤT", bg: "374151" },
    { from: 13, to: 14, title: "4. GIÁ BÁN & BIÊN LỢI NHUẬN", bg: "065F46" },
    { from: 15, to: 17, title: "5. NGUYÊN LIỆU (BOM) & ĐÓNG GÓI", bg: "92400E" },
    { from: 18, to: 25, title: "6. CHÂN DUNG KHÁCH HÀNG & CRM", bg: "6B21A8" },
    { from: 26, to: 30, title: "7. MEDIA DRIVE, ẢNH & QUẢN TRỊ", bg: "1E293B" },
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

  // Column Definitions (Row 2)
  const columnsDef = [
    { key: "sku", header: "Mã SKU Chuẩn (FloraOS) *", width: 22, mandatory: true, numFmt: "@" },
    { key: "loviSku", header: "Mã Lovi (Loviinet)", width: 18, mandatory: false, numFmt: "@" },
    { key: "siinSku", header: "Mã Siin (Siin Store)", width: 18, mandatory: false, numFmt: "@" },
    { key: "name", header: "Tên sản phẩm *", width: 34, mandatory: true, numFmt: "@" },
    { key: "category", header: "Danh mục chuẩn *", width: 24, mandatory: true, numFmt: "@" },
    { key: "shape", header: "Kiểu dáng / Dáng cắm", width: 20, mandatory: false, numFmt: "@" },
    { key: "style", header: "Phong cách thiết kế", width: 26, mandatory: false, numFmt: "@" },
    { key: "tone", header: "Tone màu chủ đạo", width: 18, mandatory: false, numFmt: "@" },
    { key: "season", header: "Mùa vụ / Tần suất", width: 16, mandatory: false, numFmt: "@" },
    { key: "size", header: "Size", width: 10, mandatory: false, numFmt: "@" },
    { key: "difficulty", header: "Độ khó kỹ thuật (Level)", width: 22, mandatory: false, numFmt: "@" },
    { key: "time", header: "Thời gian cắm (phút)", width: 18, mandatory: false, numFmt: "#,##0" },
    { key: "price", header: "Giá niêm yết B2C (VNĐ) *", width: 22, mandatory: true, numFmt: "#,##0" },
    { key: "cost", header: "Giá sản xuất gốc / Giá vốn (VNĐ)", width: 24, mandatory: false, numFmt: "#,##0" },
    { key: "bom", header: "Hoa chính (BOM)", width: 32, mandatory: false, numFmt: "@" },
    { key: "accessories", header: "Phụ liệu nổi bật", width: 28, mandatory: false, numFmt: "@" },
    { key: "packaging", header: "Quy cách đóng gói & Bảo quản", width: 36, mandatory: false, numFmt: "@" },
    { key: "occasions", header: "Dịp phù hợp", width: 34, mandatory: false, numFmt: "@" },
    { key: "purposes", header: "Mục đích tặng", width: 26, mandatory: false, numFmt: "@" },
    { key: "recipients", header: "Đối tượng người nhận", width: 28, mandatory: false, numFmt: "@" },
    { key: "relations", header: "Mối quan hệ", width: 26, mandatory: false, numFmt: "@" },
    { key: "genders", header: "Giới tính phù hợp", width: 16, mandatory: false, numFmt: "@" },
    { key: "ages", header: "Độ tuổi phù hợp", width: 18, mandatory: false, numFmt: "@" },
    { key: "wishes", header: "Lời chúc / Thông điệp gợi ý", width: 34, mandatory: false, numFmt: "@" },
    { key: "story", header: "Câu chuyện hoa (Copywriting bán hàng)", width: 45, mandatory: false, numFmt: "@" },
    { key: "driveLink", header: "Link ảnh thành phẩm chuẩn (Drive)", width: 42, mandatory: false, numFmt: "@" },
    { key: "filename", header: "Tên file ảnh chuẩn hóa ( FloraOS Media )", width: 26, mandatory: false, numFmt: "@" },
    { key: "status", header: "Trạng thái kinh doanh", width: 18, mandatory: false, numFmt: "@" },
    { key: "version", header: "Phiên bản dữ liệu", width: 14, mandatory: false, numFmt: "@" },
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

  console.log("Populating 1,311 ALG product rows...");
  let rowCount = 0;
  for (let r = 4; r < data.length; r++) {
    const row = data[r];
    if (!row || !row[2]) continue;

    rowCount++;
    const loviSku = String(row[0] || "").trim();
    const siinSku = String(row[1] || "").trim();
    const sku = loviSku || siinSku;
    const name = String(row[2] || "").trim();
    const cat = mapCategory(row[6]);
    const shape = row[6] ? String(row[6]).trim() : "";
    const style = cleanBullets(row[7]);
    const tone = row[8] ? String(row[8]).trim() : "";
    const season = row[9] ? String(row[9]).trim() : "";
    const size = row[10] ? String(row[10]).trim() : "";
    const difficulty = row[13] ? String(row[13]).trim() : "";
    const makeTime = row[15] !== undefined && row[15] !== "" ? Number(row[15]) : null;
    const price = parseCleanPrice(row[17]);
    const cost = null;
    const mainFlowers = cleanBullets(row[20]);
    const accessories = cleanBullets(row[21]);
    const packaging = row[22] ? String(row[22]).trim() : "";
    const occasions = cleanBullets(row[4] || row[3]);
    const purposes = cleanBullets(row[5]);
    const recipients = cleanBullets(row[25]);
    const relationships = cleanBullets(row[26]);
    const genders = cleanBullets(row[27]);
    const ageRanges = cleanBullets(row[28]);
    const wishes = cleanBullets(row[29]);
    const story = row[30] ? String(row[30]).trim() : "";
    const driveLink = row[19] ? String(row[19]).trim() : "";
    const filename = sku ? `${sku}.jpg` : "";
    const status = "Đang bán";
    const version = "v1.0";
    const notes = "";

    const rowVals = [
      sku,
      loviSku,
      siinSku,
      name,
      cat,
      shape,
      style,
      tone,
      season,
      size,
      difficulty,
      makeTime,
      price,
      cost,
      mainFlowers,
      accessories,
      packaging,
      occasions,
      purposes,
      recipients,
      relationships,
      genders,
      ageRanges,
      wishes,
      story,
      driveLink,
      filename,
      status,
      version,
      notes,
    ];

    const newRow = ws1.addRow(rowVals);
    newRow.height = 22;
    const isEven = rowCount % 2 === 0;

    columnsDef.forEach((col, cIdx) => {
      const cell = newRow.getCell(cIdx + 1);
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
        horizontal: ["sku", "loviSku", "siinSku", "size", "time", "price", "cost", "status", "version"].includes(col.key)
          ? "center"
          : "left",
      };
      if (col.numFmt) {
        cell.numFmt = col.numFmt;
      }
    });
  }

  // ==========================================
  // SHEET 2: TU_DIEN_QUY_UOC_HE_THONG
  // ==========================================
  const ws2 = wb.addWorksheet("Tu_Dien_Quy_Uoc_He_Thong", {
    properties: { tabColor: { argb: "16A34A" } },
  });

  ws2.columns = [
    { header: "Nhóm thông tin chuẩn", key: "group", width: 25 },
    { header: "Giá trị chuẩn đề xuất (Standard Values)", key: "val", width: 45 },
    { header: "Mã viết tắt", key: "code", width: 14 },
    { header: "Mục đích & Hướng dẫn áp dụng trong thực tế", key: "note", width: 55 },
  ];

  const dictHRow = ws2.getRow(1);
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
    const row = ws2.addRow(d);
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

  console.log("Saving Master ALG Enterprise File...");
  await wb.xlsx.writeFile(outPath);
  console.log("Master ALG Enterprise File successfully generated at:", outPath);
}

buildEnterpriseALGFile().catch(console.error);
