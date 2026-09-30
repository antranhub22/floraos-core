export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

/** Bỏ dấu tiếng Việt và đưa về chữ thường để tìm kiếm / so sánh không phân biệt dấu */
export function stripVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}
