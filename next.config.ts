import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
