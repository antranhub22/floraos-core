import Link from "next/link"

export default function PlatformNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center max-w-md mx-auto">
      <h2 className="text-xl font-bold text-text mb-2">Không tìm thấy trang Console</h2>
      <p className="text-sm text-text-muted mb-6">
        Tuyến vận hành nền tảng bạn yêu cầu không tồn tại hoặc đã được chuyển vị trí.
      </p>
      <Link
        href="/van-hanh"
        className="inline-flex items-center justify-center h-12 px-5 text-[15px] font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
      >
        Về Console
      </Link>
    </div>
  )
}
