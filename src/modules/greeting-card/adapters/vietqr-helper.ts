/**
 * VietQR helper for instant QR bank transfer generation.
 * Generates Napas-compatible Quick Link and payload.
 */

export interface VietQrConfig {
  bankId: string // e.g. "MB", "VCB", "ICB", "TCB", "ACB"
  accountNo: string // e.g. "0381000523456"
  accountName: string // e.g. "NGUYEN VAN A"
  amount: number
  description: string // e.g. "DH-1037"
}

export function generateVietQrUrl(config: VietQrConfig): string {
  const bank = encodeURIComponent(config.bankId.trim())
  const account = encodeURIComponent(config.accountNo.trim())
  const amount = Math.max(0, Math.round(config.amount))
  const memo = encodeURIComponent(config.description.trim())
  const accountName = encodeURIComponent(config.accountName.trim())

  // Standard img.vietqr.io format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<MEMO>&accountName=<NAME>
  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accountName}`
}

export const DEFAULT_SHOP_PAYMENT_INFO = {
  bankId: "MB",
  bankName: "Ngân hàng Quân Đội (MB Bank)",
  accountNo: "0988776655",
  accountName: "TIEM HOA FLORAOS",
}
