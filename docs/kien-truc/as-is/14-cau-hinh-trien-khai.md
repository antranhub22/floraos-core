# 14. Configuration & Deployment — As-Is

## 14.1 Môi trường

| Môi trường | Cách nhận diện trong mã | Bằng chứng |
|---|---|---|
| Dev local | `npm run dev` (cổng 3100); `docker compose up -d` dựng Postgres (`floraos/floraos`, cổng 5432, có `pg_cron`); `dev:core` chạy web + worker vision/media/video + MI worker; `dev:all` thêm SocialFlow (cổng 8000) và LocalBudd nếu có thư mục anh em | `package.json`, `docker-compose.yml` |
| Test | DB tên kết thúc `_test` (`npm run db:test:setup`); `test:tenant`/`test:platform` dùng `DATABASE_URL_TEST` mặc định `floraos_test` | `package.json`, `scripts/dung-db-test.sh` |
| CI | GitHub Actions, Postgres 16 service, khoá giả | `.github/workflows/ci.yml` |
| Production (Render) | `NODE_ENV=production`; khoá tính năng giao diện khi `NEXT_PUBLIC_APP_ENV=production` (biến này không khai trong `render.yaml`) | `render.yaml`, `src/lib/feature-lock.ts` |

## 14.2 Biến môi trường

| Nhóm | Biến | Bắt buộc? | Nơi đọc |
|---|---|---|---|
| Cốt lõi | `DATABASE_URL`, `SESSION_SECRET`, `INTEGRATION_TOKEN_SECRET`, `SSO_SESSION_SECRET` | Có (zod) | `src/lib/env.ts` |
| AI (core) | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` | Không | `env.ts` |
| Kho tệp | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_REGION` | Không (thiếu → đĩa cục bộ) | `storage-provider-factory.ts`, `workers/shared/` |
| Hạ tầng web | `REDIS_URL`, `RATE_LIMIT_TRUSTED_PROXY_HOPS`, `PUBLIC_APP_URL` | Không | `env.ts` |
| App anh em | `SOCIALFLOW_URL`, `LOCALBUDD_URL`, `NEXT_PUBLIC_SOCIALFLOW_URL`, `NEXT_PUBLIC_LOCALBUDD_URL`, `SOCIALFLOW_DIR` | Không | `env.ts`, `package.json` |
| Cờ tính năng | `GREETING_CARD_ENABLED` (mặc định bật), `GREETING_CARD_SWEEP`, `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_PRIVACY_NOTICE_ENABLED`, `SEED_DEV_DATA` | Không | `env.ts`, `feature-lock.ts`, `privacy-notice.ts`, `prisma/seed.ts` |
| Chat | `DIFY_API_KEY`, `DIFY_API_URL`, `OLLAMA_URL`, `FB_WEBHOOK_VERIFY_TOKEN` | Không (đọc `process.env`, không có trong `.env.example`) | `dify-chat-provider.ts`, webhook Facebook |
| Worker media | `PHOTOROOM_API_KEY`, `PHOTOROOM_TIMEOUT_SECONDS`, `FAL_KEY`, `FAL_TIMEOUT_SECONDS`, `REPLICATE_API_TOKEN`, `STABILITY_API_KEY`, `GOOGLE_VERTEX_API_KEY`, `IOPAINT_URL`, `IOPAINT_MODEL`, `IOPAINT_DEVICE`, `IOPAINT_TIMEOUT_SECONDS`, `VARIANT_PROVIDER_ORDER`, `VARIANT_SEGMENTATION_MODEL`, `VARIANT_SEGMENTATION_TIMEOUT_SECONDS`, `VARIANT_INTEGRITY_THRESHOLD`, `DEFAULT_ENHANCER_PROVIDER`, `REALESRGAN_MODEL_PATH` | Không | `workers/media_ai/**` |
| Worker video/âm thanh | `RUNWAYML_API_SECRET`, `AI_VIDEO_PROVIDER`, `GOOGLE_VEO_API_KEY`, `HEYGEN_API_KEY`, `ELEVENLABS_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID` | Không | `workers/media_ai/{video,audio}/**`, `src/modules/audio-studio/**` |
| Thị trường | `SERPAPI_API_KEY` | Không | `src/modules/market-intelligence/adapters/*` |
| Khác | `LOG_LEVEL`, `FLORAOS_DEBUG_MAU` (worker); `JOB_RATE_LIMIT_WINDOW_SECONDS`, `JOB_RATE_LIMIT_PER_WINDOW` | Không | worker; `src/modules/jobs/` |

Giá trị thật trên mọi môi trường: NOT VERIFIED (không đọc `.env`).

## 14.3 Build & chạy

| Bước | Lệnh |
|---|---|
| Cài | `npm ci` (Node 22.x trong CI); worker: `pip install -r workers/requirements.txt` (Python 3.11 trong CI; `ffmpeg` cài thêm cho test âm thanh/video) |
| Sinh Prisma client | `npx prisma generate` |
| Lược đồ | `npx prisma db push` (CI, Render) |
| Seed | `npm run db:seed` |
| Build | `next build` (`experimental.cpus: 2`, `typedRoutes: true`); Render đặt `NODE_OPTIONS=--max-old-space-size=2048` |
| Chạy web | `next start -p 3100` |
| Worker | `python -m vision.jobs.worker` · `python -m media_ai.jobs.worker` · `python -m media_ai.video.video_worker` · `tsx src/modules/market-intelligence/jobs/worker.ts` |
| Script vận hành tay | `nap:danh-muc`, `nap:phan-tich`, `nap:credit`, `hoan-credit`, `mat-khau`, `them-thanh-vien`, `quet-job-treo`, `gan-van-hanh-nen-tang`, `doi-chieu`, `nap:loai`, `seed:field-registry`, `check:field-registry` |

## 14.4 CI/CD

`.github/workflows/ci.yml` chạy khi push/PR vào `main`:

| Job | Bước |
|---|---|
| `web` | `npm ci` → `prisma generate` → `db push` (DB chính + `floraos_test`) → `db:seed` → `typecheck` → `lint:ratchet` → `check:docs` → `lint:ux --check` → `npm test` → `check:template-ssot` → `test:tenant` → `test:platform` → `build` |
| `worker` | Python 3.11 → cài `ffmpeg` → `pip install` → `pytest tests -q` |
| `e2e-ux` | build → `playwright test tests/e2e/ux` (Chromium) → lưu `test-results/` khi đỏ |

CD: `render.yaml` đặt `autoDeploy: true`, `branch: main` cho cả 4 dịch vụ. Trạng thái các lần chạy CI/CD: NOT VERIFIED.

## 14.5 Hosting (theo `render.yaml`)

| Dịch vụ | Loại | Runtime | Lệnh build / start | Gói | Vùng |
|---|---|---|---|---|---|
| `floraos-web` | web | node | `npm ci --include=dev && npx prisma generate && npx prisma db push --accept-data-loss && npm run db:seed && npm run build` / `npm run start`; health `/api/health` | starter | singapore |
| `floraos-worker-media` | worker | python (`rootDir: workers`) | `pip install -r requirements.txt` / `python -m media_ai.jobs.worker` | starter | singapore |
| `floraos-worker-video` | worker | python | / `python -m media_ai.video.video_worker` | starter | singapore |
| `floraos-worker-vision` | worker | python | / `python -m vision.jobs.worker` | starter | singapore |
| `floraos-redis` | keyvalue | — | `allkeys-lru`, chỉ truy cập nội bộ | free | singapore |
| `floraos-postgres` | database | Postgres | `databaseName: floraos` | basic-256mb | singapore |

Ghi nhận từ `render.yaml` (mô tả):
- Web service đặt `SEED_DEV_DATA="true"` → `prisma/seed.ts` nạp tổ chức mẫu "Tiệm Hoa Mộc Lan" (kèm tài khoản mẫu) ở mỗi lần build.
- Không có dịch vụ cho worker nghiên cứu thị trường (`worker:market-intelligence`) và không có cron cho `scan-stuck-jobs`.
- `SOCIALFLOW_URL`/`LOCALBUDD_URL` để trống (chú thích trong tệp).
- `floraos-worker-media` LISTEN cả `video.render`; `floraos-worker-video` cũng xử lý `video.render` — hai tiến trình cùng tiêu thụ một feature (khoá `SKIP LOCKED`).
- `requirements.txt` không có `torch`/`transformers` → bộ máy `local_cv` không có sẵn trên worker Render (gói riêng `requirements-local-cv.txt`).

## 14.6 Domain, storage, database, external services

- Domain/tên miền production: NOT VERIFIED (chú thích `src/core/http/cookies.ts` nhắc `app.floraos.vn` như dự định; `PUBLIC_APP_URL` rơi về `RENDER_EXTERNAL_URL`).
- Storage: S3-compatible theo 5 biến `STORAGE_*` (vùng mặc định `auto`); nhà cung cấp cụ thể: NOT VERIFIED.
- Database: Postgres do Render quản lý (`fromDatabase`).
- External services: xem [11-tich-hop.md](11-tich-hop.md).
- Repo có thêm: `docker/iopaint/` (Dockerfile + script chạy native MPS cho IOPaint), `golden/` (bộ ảnh vàng và báo cáo độ chính xác AI), `scripts/*.py` (đánh giá bộ ảnh vàng, ma trận chọn công nghệ).
