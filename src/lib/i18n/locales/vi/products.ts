/**
 * products.ts — Từ điển màn hình Sản phẩm, Tạo mẫu, Nhập Excel & Quét ảnh hoa (04–07 SSOT)
 */

export const productsVi = {
  header: {
    category: "Kho mẫu hoa",
    title: "Mẫu hoa",
    refresh: "Làm mới",
    importExcel: "Nhập từ Excel",
    scanPhoto: "Quét ảnh hoa",
    createFlower: "Thêm mẫu hoa",
  },
  filters: {
    searchPlaceholder: "Tìm theo tên hoặc mã mẫu hoa…",
    allCategories: "Tất cả danh mục",
    categories: {
      bouquet: "Bó hoa",
      basket: "Giỏ hoa",
      stand: "Kệ hoa khai trương",
      vase: "Bình hoa",
      box: "Hộp hoa",
      condolence: "Hoa chia buồn",
    },
    occasions: {
      opening: "Khai trương",
      birthday: "Sinh nhật",
      love: "Tình yêu và Valentine",
      condolence: "Chia buồn",
      womenDay: "Ngày 8/3 và 20/10",
      teacherDay: "Ngày 20/11",
      graduation: "Tốt nghiệp",
    },
    priceRanges: {
      under500k: "Dưới 500.000 ₫",
      from500kTo1m: "500.000–1.000.000 ₫",
      from1mTo2m: "1.000.000–2.000.000 ₫",
      above2m: "Trên 2.000.000 ₫",
    },
  },
  status: {
    active: "Đang bán",
    draft: "Bản nháp",
    archived: "Đã lưu trữ",
    moveToTrash: "Chuyển vào thùng rác",
    loadMore: "Xem thêm mẫu hoa",
  },
  createForm: {
    title: "Tạo mẫu hoa mới",
    generalInfo: "Thông tin chung về mẫu hoa",
    nameLabel: "Tên mẫu hoa",
    namePlaceholder: "Ví dụ: Bó hoa hồng đỏ rực rỡ",
    codeLabel: "Mã mẫu hoa",
    codePlaceholder: "Tự động tạo hoặc nhập mã riêng",
    categoryLabel: "Phân loại",
    priceLabel: "Giá bán niêm yết (₫)",
    costLabel: "Giá vốn dự kiến (₫)",
    recipeTitle: "Công thức cành hoa chi tiết",
    addFlowerButton: "Thêm cành hoa",
    flowerNameLabel: "Tên loại hoa",
    quantityLabel: "Số lượng cành",
    colorLabel: "Màu sắc / Tông",
    wrappingTitle: "Quy cách đóng gói & Giấy gói",
    dimensionTitle: "Kích thước ước tính (Cao x Rộng)",
  },
  importExcel: {
    title: "Nhập danh mục từ Excel",
    instruction: "Tải lên file Excel mẫu (.xlsx) chứa danh sách sản phẩm và link ảnh hoa.",
    downloadTemplate: "Tải file mẫu Excel",
    uploadArea: "Kéo thả file Excel vào đây hoặc bấm để chọn file",
    previewTitle: "Xem trước danh sách sản phẩm",
    confirmImport: "Xác nhận nhập danh mục",
  },
  scanPhoto: {
    title: "Quét ảnh hoa & Nhận diện tự động",
    instruction: "Chụp ảnh bó hoa tại tiệm để AI phân tích loại hoa, đếm số cành và ước tính giá bán.",
    uploadArea: "Tải ảnh mẫu hoa lên (JPG, PNG)",
    analyzing: "Đang phân tích thành phần hoa bằng AI…",
    resultTitle: "Kết quả nhận diện",
    createProductButton: "Tạo mẫu hoa từ kết quả",
  },
} as const

export type ProductsDictionary = typeof productsVi
