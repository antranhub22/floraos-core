export interface CatalogOption {
  id: string
  name: string
  code: string
  itemCount: number
}

/** Đường dẫn công khai của bộ sưu tập: `bst/<slug>/<code>`, chưa có slug → `g/<id>` (không bao giờ đoán slug tiệm khác). */
export function catalogDisplayPath(cat: CatalogOption | undefined, orgSlug: string): string {
  if (!cat) return ""
  return orgSlug && cat.code ? `bst/${orgSlug}/${cat.code}` : `g/${cat.id}`
}

export function absoluteUrl(path: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`
}

export type WizardStep = 1 | 2 | 3
