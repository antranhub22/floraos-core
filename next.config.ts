import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Next 16.3 đã chuyển khoá này ra khỏi `experimental` — giữ ở chỗ cũ chỉ
  // sinh cảnh báo lúc build hôm nay, và sẽ là lỗi ở bản sau.
  typedRoutes: true,
}

export default nextConfig
