# 17. Final As-Is Capability Map

"Vai" = vai hệ thống có mã cần thiết theo mặc định (lớp 1); tổ chức có thể bật/tắt qua `capability_overrides` trong giới hạn trần cứng. ĐH = `dieu_hanh`, ĐP = `dieu_phoi`, PM = `product_manager`, CSKH = `customer_service`, Mkt = `marketing`.

| ID | Capability | Functions | Roles | Main Objects | Status | Evidence |
|---|---|---|---|---|---|---|
| CAP-01 | Đăng ký, đăng nhập, phiên | Đăng ký dùng thử, đăng nhập 1 phiên/tài khoản, đăng xuất, cảnh báo phiên bị thay, JWT SSO | Mọi người dùng | `users`, `sessions`, `organizations`, `workspaces`, `memberships` | Implemented (đổi tổ chức, làm mới SSO: chỉ API) | `src/modules/organization/use-cases/{sign-up,log-in,resolve-session}.ts` |
| CAP-02 | Quản trị tổ chức & quyền | Hồ sơ tổ chức, thành viên, vai, chi nhánh, dịp | ĐH (F2–F9 trần cứng); xem: ĐH/ĐP/Sale | `organizations`, `memberships`, `roles`, `capability_overrides`, `branches`, `occasions` | Partially Implemented | `src/modules/organization/`, `/cai-dat/**` |
| CAP-03 | Hồ sơ cửa hàng & thương hiệu | Hồ sơ kinh doanh, thương hiệu, tài sản, ghi đè mẫu | Xem: ĐH/ĐP/Sale; sửa: ĐH | `business_profiles`, `brand_profiles`, `template_overrides` | Implemented | `src/modules/{profiles,templates}/`, `/ho-so` |
| CAP-04 | Product Master & giá | CRUD sản phẩm, lưu trữ, nhập hàng loạt, quy tắc giá | Xem: ĐH/ĐP/Sale/PM/Mkt/CRM; tạo/sửa: ĐH/ĐP/PM; ngừng KD & sửa giá: ĐH | `products`, `pricing_rules` | Implemented | `src/modules/products/`, `/san-pham/**`, `/gia` |
| CAP-05 | Phân tích ảnh sản phẩm (M01) | Job vision, sửa, duyệt → Product Master, xuất CSV, chọn bộ máy | Chạy: ĐH/ĐP/Sale/Mkt; duyệt & chọn bộ máy: ĐH | `assets`, `generation_jobs`, `product_analyses`, `products` | Implemented | `workers/vision/`, `/tai-anh`, `/duyet`, `/bo-may` |
| CAP-06 | Dữ liệu bán hàng (M01b) | Sinh qua cổng AI, sửa, duyệt | Sinh: ĐH/ĐP/Mkt; duyệt: ĐH | `product_copies`, `products` | Implemented | `src/modules/product-copies/` |
| CAP-07 | Asset & kho tệp | Tải lên ký sẵn, URL xem ký, xoá, thùng rác 30 ngày | Xem/tải: ĐH/ĐP/Sale/Mkt; xoá: ĐH | `assets`, kho S3/đĩa | Implemented | `src/modules/{assets,storage}/`, `/kho-du-lieu` |
| CAP-08 | Job, credit, mức dùng | Hàng đợi job, idempotency, trần tần suất, credit/trial, hoàn credit, xem mức dùng | Job: hầu hết vai; mức dùng: ĐH | `generation_jobs`, `job_events`, `usage`, `organizations.credit_balance` | Implemented (`/jobs/batch` Partial) | `src/modules/{jobs,usage}/`, `/job`, `/muc-dung` |
| CAP-09 | Ảnh marketing (M04a/M04b) | Tối ưu ảnh, MASTER, biến thể, duyệt từng tấm, tải về | Chạy: ĐH/ĐP/Sale/Mkt; duyệt: ĐH | `assets`, `generation_jobs` | Implemented | `src/modules/media/`, `workers/media_ai/jobs/` |
| CAP-10 | Video (M04c) | Storyboard, duyệt kịch bản, render, duyệt video | Chạy: ĐH/ĐP/Sale/Mkt; duyệt kịch bản: ĐH/ĐP/Mkt; duyệt video: ĐH | `video_jobs`, `video_scenes`, `assets` | Implemented (tuyến khoá trên production) | `src/modules/video-studio/`, `workers/media_ai/video/` |
| CAP-11 | Âm thanh | TTS, nhạc nền có giấy phép, nhân bản giọng | ĐH/ĐP/Sale/Mkt (`I1`) | `generation_jobs`, `music_tracks`, `voice_clones` | Implemented | `src/modules/audio-studio/`, `workers/media_ai/audio/` |
| CAP-12 | Creative Studio | Kế hoạch cảnh, sửa cảnh, gói chiến dịch (QA/duyệt/launch/hiệu quả), ráp video | Tạo: `I1`; duyệt: ĐH/Mkt (`J5`) | `campaign_packages`, `content_drafts`, `generation_jobs` | Partially Implemented | `src/modules/creative-production/`, `/creative-studio` |
| CAP-13 | Nội dung đăng bài (M07) | Chuỗi agent sinh bài đa kênh, duyệt; nội dung catalog/landing; viết lại; kiểm từ cấm | Sinh: `I1`; duyệt: ĐH/Mkt | `content_generations` | Implemented (không chuyển sang Lịch đăng) | `src/modules/content-engine/`, `/noi-dung` |
| CAP-14 | Lịch đăng & kết nối MXH | Đọc/xếp lịch/đăng bài, tài khoản MXH qua SocialFlow | Không gác mã | (dữ liệu ở SocialFlow) | Partially Implemented | `/lich-dang`, `/ket-noi`, `src/modules/proxy/` |
| CAP-15 | Catalog & QR (M06) | Link catalog, storefront `/c/[slug]`, form lead | Tạo: ĐH/ĐP/Mkt; thu hồi: ĐH | `catalog_links` | Partially Implemented | `src/modules/catalog-links/`, `/catalog` |
| CAP-16 | Đơn hàng (M10) | Tạo, 3 trục trạng thái, in, huỷ | Xem: ĐH/ĐP/Sale/CRM/CSKH; tạo: ĐH/ĐP/Sale; cập nhật: ĐH/ĐP; huỷ: ĐH | `orders`, `order_items`, `order_events` | Implemented | `src/modules/orders/`, `/don-hang` |
| CAP-17 | Điều phối (Control Tower) | 11 bước có bằng chứng, đối tác, QC, POD, sự cố, sổ thu, trường tùy chỉnh, SLA | ĐH/ĐP (R1–R5, R9), huỷ & hoàn: ĐH | `order_coordinations`, `partners`, `order_qc_records`, `order_exceptions`, `order_payments` | Implemented (đối soát đối tác: dữ liệu mẫu) | `src/modules/coordinator/`, `/dieu-phoi` |
| CAP-18 | Thẻ chào | Bộ sưu tập, link gửi/chia sẻ, trang khách, đặt hàng, VietQR, SePay, xác nhận/hoàn/huỷ, giảm giá, tác vụ xưởng, theo dõi, tin nội bộ, ZNS/SMS, bộ quét nền | Xem: R1; bán: R2; thu: R9; xưởng: R3–R5; cấu hình: F2; huỷ/hoàn: ĐH | `greeting_*`, `orders`, `order_payments`, `customers`, `vouchers` | Implemented | `src/modules/greeting-card/`, `/the-chao`, `/b`, `/g`, `/bst`, `/s` |
| CAP-19 | CRM (M09) | Khách hàng, phân tầng, dịp, nhắc 14 ngày, đồng ý nhận tin | ĐH/ĐP/Sale/CRM/CSKH; xoá: ĐH | `customers`, `customer_occasions`, `customer_consents` | Implemented (voucher/xuất: chưa có) | `src/modules/crm/`, `/khach-hang` |
| CAP-20 | Hội thoại AI (M08) | Hội thoại, AI tư vấn + trợ lý dùng phần mềm, tạo đơn, kênh FB/Zalo/widget, Copilot | Xem: ĐH/ĐP/Sale/CRM/CSKH; gửi: ĐH/ĐP/Sale/CSKH; cấu hình: ĐH | `chat_*`, `orders` | Implemented (tuyến khoá trên production) | `src/modules/chat-assistant/`, `/hoi-thoai` |
| CAP-21 | Nghiên cứu thị trường | Lượt nghiên cứu, tín hiệu xu hướng, chủ đề, cơ hội cá nhân hoá, phân tích sản phẩm | Chạy: ĐH/ĐP/Mkt; xem cơ hội: + Sale | `research_runs`, `topics`, `content_opportunities`, `product_analysis_runs` | Partially Implemented (worker không có trong `render.yaml`) | `src/modules/market-intelligence/` |
| CAP-22 | Quản trị AI | Sổ năng lực/mô hình, chính sách theo tổ chức, sổ lời gọi, thứ tự nhà cung cấp | Xem: ĐH/ĐP; đặt & đọc sổ: ĐH | `ai_*` | Implemented (tổng hợp/soát: chỉ API) | `src/core/ai/`, `src/modules/ai-governance/`, `/cai-dat-ai`, `/so-lieu` |
| CAP-23 | Kiểm toán & số liệu | Nhật ký kiểm toán, báo cáo kinh doanh (client), chi phí AI | ĐH | `audit_logs`, `orders`, `ai_requests`, `usage` | Implemented | `/audit`, `/so-lieu` |
| CAP-24 | Integration API & proxy | Token máy-máy, API cho LocalBudd/SocialFlow, proxy danh sách trắng, SSO | ĐH (`F9`); app ngoài | `integration_tokens`, `content_metrics`, `assets`, `generation_jobs` | Implemented phía core | `src/modules/{integration,proxy,sso}/` |
| CAP-25 | Console vận hành nền tảng | Tổ chức, mức dùng, sức khoẻ, nhật ký, trường dữ liệu | Operator (`N1`,`N4`,`N5`,`N6`,`N12`) | `platform_*`, `field_*` | Implemented | `src/modules/{platform,field-platform}/`, `/van-hanh/**` |
| CAP-26 | Thẻ báo giá | Báo giá khách/đối tác, sao chép nội dung | Không gác mã | `products` (đọc) | Partially Implemented (giả lập) | `/bao-gia` |
| CAP-27 | Nội dung hướng dẫn & thư viện mẫu | Tri thức, kho mẫu, danh mục vai | Không gác mã | (tĩnh) | Implemented (tĩnh) | `/tri-thuc`, `/kho-templates`, `/vai-tro` |
| CAP-28 | Nạp dữ liệu AVI GIFT | Dựng tổ chức, nạp danh mục, nạp phân tích, đối chiếu | Script | `organizations`, `products`, `product_analyses` | Implemented (CLI) | `src/modules/avi-gift-import/`, `scripts/` |
| CAP-29 | Gói thương mại / entitlement | `requireFeatureAccess` theo gói | — | `organizations.credit_plan` | Dead/unused code | `src/core/entitlements/` |
| CAP-30 | Thẻ báo giá v1, cấu hình v1, hệ thống v1 (mã `B`, `C`, `D`, `E`) | — | — | — | Referenced but not implemented | `src/core/rbac/capability-catalog.ts` |

## System Map

```text
Users
  ├─ Nhân viên tổ chức (cookie floraos_session) ─ Người vận hành nền tảng (cùng cookie + platform_operators)
  ├─ Khách cuối (không đăng nhập: /b /g /bst /s /c, cookie chủ phiên, 4 số cuối SĐT)
  └─ App ngoài LocalBudd/SocialFlow (Bearer token | JWT floraos_sso) · Nhà cung cấp gọi vào (SePay, Facebook, Zalo)
   ↓
Roles / Permissions
  ├─ 8 vai hệ thống + vai riêng của tổ chức → role_capabilities → capability_overrides → trần cứng → TenantContext.capabilities (151 mã, 67 được kiểm ở server)
  ├─ 16 khuôn Role UX (chỉ đổi trang chủ/điều hướng) · khoá tuyến production (8 tuyến)
  └─ PlatformContext (N1–N8, N12) · IntegrationContext (token phạm vi client | SSO trừ L5)
   ↓
Modules / Capabilities (CAP-01 … CAP-30)
  Nền tảng: organization · profiles · templates · assets/storage · jobs/usage · audit · ai-governance · integration/proxy/sso · platform/field-platform
  Sản phẩm & AI: products(M01) · product-copies(M01b) · media(M04a/b) · video-studio(M04c) · audio-studio · creative-production · content-engine(M07) · market-intelligence
  Bán hàng & vận hành: orders(M10) · coordinator · greeting-card (Thẻ chào) · crm(M09) · chat-assistant(M08) · catalog-links(M06)
   ↓
Functions (≈ 240 endpoint + use-case; xem 04/04b, 09a/09b)
   ↓
Business Objects
  Organization · User · Membership · Role · Product · Asset · Job · Usage · Analysis · ProductCopy · Order (3 trục) · Coordination (11 bước)
  · Partner · Payment · Customer · Conversation · GreetingSession · Catalog/CatalogLink · VideoJob · CampaignPackage · ContentGeneration · AiRequest
   ↓
API / Services
  Next.js route handlers /api/v1 (242) → use-cases → repositories (Prisma)
  AI gateway callCapability → OpenAI | Anthropic | Gemini
  Job queue: generation_jobs + pg_notify → workers Python (vision, media_ai, video) + worker TS (market-intelligence)
  In-process: bộ quét nền Thẻ chào (60 s), runInBackground (thông báo)
   ↓
Database / External Systems
  PostgreSQL (90 bảng, 66 bảng có organization_id) · Redis (rate limit) · Kho tệp S3-compatible | đĩa cục bộ
  AI/media: OpenAI, Anthropic, Google (Gemini/Imagen/Veo), Stability, fal.ai, Replicate, Photoroom, RunwayML, HeyGen, ElevenLabs, MiniMax, Dify, Ollama, IOPaint
  Dữ liệu thị trường: Google Trends, SerpApi (YouTube/TikTok)
  Kênh & thanh toán: Facebook Messenger, Zalo OA, Zalo ZNS, eSMS, SePay, VietQR, Google Drive
  App anh em: SocialFlow, LocalBudd (NOT VERIFIED)
  Hosting: Render (web + 3 worker Python + Redis + Postgres, singapore) — trạng thái thật NOT VERIFIED
```
