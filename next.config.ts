import type { NextConfig } from "next"

/** Header bảo mật nền cho mọi trang và API (trang khách công khai nhận tiền + dữ liệu cá nhân). */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // SAMEORIGIN: khung "Xem trước" trong trang quản lý vẫn nhúng được trang khách
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // CHỈ GHI NHẬN, KHÔNG CHẶN: trình duyệt báo về /api/v1/public/csp-report khi trang
  // tải nguồn ngoài danh sách. Khách không bị ảnh hưởng. Đủ dữ liệu thì đổi sang
  // "Content-Security-Policy" để chặn thật (nợ kỹ thuật CSP trong TECHNICAL_DEBT).
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "report-uri /api/v1/public/csp-report",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },
  // Next 16.3 đã chuyển khoá này ra khỏi `experimental` — giữ ở chỗ cũ chỉ
  // sinh cảnh báo lúc build hôm nay, và sẽ là lỗi ở bản sau.
  typedRoutes: true,
  experimental: {
    // Render builder VM has many CPUs (48 cores), causing Next.js to spawn
    // 47 static generation workers in parallel, exhausting container RAM (OOM kill).
    // Restricting to 2 workers keeps memory footprint well within limits.
    cpus: 2,
    memoryBasedWorkersCount: true,
  },
}

export default nextConfig
