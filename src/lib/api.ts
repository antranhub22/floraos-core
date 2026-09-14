export type ApiErrorBody = {
  error?: {
    message?: string
    code?: string
  }
}

export async function apiError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null
  return body?.error?.message ?? `${fallback} (${response.status})`
}

export async function apiJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(await apiError(response, "Không kết nối được máy chủ"))
  return (await response.json()) as T
}

export function isUnauthorized(response: Response): boolean {
  return response.status === 401
}

export function isForbidden(response: Response): boolean {
  return response.status === 403
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleString("vi-VN")
}

export function shortId(value: string): string {
  return value.length > 10 ? `${value.slice(0, 8)}…` : value
}

export function formatMoney(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCredit(value: number | null | undefined): string {
  return formatMoney(value, 0)
}
