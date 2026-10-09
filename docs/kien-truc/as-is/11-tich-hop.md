# 11. Integrations — As-Is

Trạng thái "Implemented" = có mã gọi thật tới dịch vụ; việc dịch vụ có được cấu hình khoá và chạy thành công trên môi trường thật: **NOT VERIFIED** cho mọi dòng.

## 11.1 Nhà cung cấp AI và xử lý media

| Dịch vụ | Mục đích | Chiều | API | Dữ liệu trao đổi | Xác thực | Nơi dùng | Status |
|---|---|---|---|---|---|---|---|
| OpenAI | Phân tích ảnh (structured/direct), LLM nội dung, enhancer ảnh, TTS, chat dự phòng | Ra | SDK `openai` (Python), REST `chat/completions` (TS) | Ảnh sản phẩm, prompt, văn bản | `OPENAI_API_KEY` | `workers/vision/providers/openai_*.py`, `src/core/ai/adapters/openai-llm-provider.ts`, `workers/media_ai/providers/enhancement/openai_enhancer.py`, `workers/media_ai/audio/tts_engine.py`, `src/modules/chat-assistant/adapters/dify-chat-provider.ts` | Implemented |
| Anthropic | LLM nội dung (trong chuỗi lùi đa nhà cung cấp) | Ra | `@anthropic-ai/sdk` | Prompt/văn bản | `ANTHROPIC_API_KEY` (thiếu → bỏ qua) | `src/core/ai/adapters/anthropic-llm-provider.ts`, `multi-llm-provider.ts` | Implemented |
| Google Gemini / Imagen / Veo | LLM nội dung; enhancer & dựng cảnh ảnh; video AI | Ra | `generativelanguage.googleapis.com/v1beta` | Prompt, ảnh, video | `GEMINI_API_KEY`, `GOOGLE_VEO_API_KEY` | `src/core/ai/adapters/gemini-llm-provider.ts`, `workers/media_ai/providers/{google,enhancement,scene}/…`, `workers/media_ai/video/providers/veo_provider.py` | Implemented |
| Stability AI | Dựng nền / cảnh biến thể | Ra | `api.stability.ai/v2beta` | Ảnh, prompt | `STABILITY_API_KEY` | `workers/media_ai/providers/{background,scene}/stability_*.py` | Implemented |
| fal.ai | Enhancer, outpaint, dựng cảnh | Ra | `queue.fal.run` | Ảnh | `FAL_KEY` | `workers/media_ai/providers/{enhancement,expansion,scene}/fal_*.py` | Implemented |
| Replicate | Enhancer, mở rộng ảnh (bria/expand-image) | Ra | `api.replicate.com/v1` | Ảnh | `REPLICATE_API_TOKEN` | `workers/media_ai/providers/{enhancement,expansion}/replicate_*.py` | Implemented |
| Photoroom | Tách nền / tối ưu ảnh | Ra | `image-api.photoroom.com/v2/edit` | Ảnh | `PHOTOROOM_API_KEY` | `workers/media_ai/providers/enhancement/photoroom_enhancer.py` | Implemented |
| RunwayML | Clip video AI | Ra | `api.dev.runwayml.com/v1/image_to_video` | Ảnh, prompt | `RUNWAYML_API_SECRET` | `workers/media_ai/video/providers/ai_clip_provider.py` | Implemented |
| HeyGen | Video AI | Ra | `api.heygen.com/v2` | Kịch bản, media | `HEYGEN_API_KEY` | `workers/media_ai/video/providers/heygen_provider.py` (chọn qua `AI_VIDEO_PROVIDER`, mặc định `LOCAL_CINEMATIC`) | Implemented |
| ElevenLabs | TTS, nhạc, nhân bản giọng | Ra | `api.elevenlabs.io/v1` (`text-to-speech`, `music`, `voices/add`) | Văn bản, mẫu giọng | `ELEVENLABS_API_KEY` | `workers/media_ai/audio/*.py`, `src/modules/audio-studio/adapters/tts-router-adapter.ts` (tệp này không được import) | Implemented (worker) |
| MiniMax | TTS | Ra | `api.minimax.chat/v1/t2a_v2` | Văn bản | `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID` | `workers/media_ai/audio/tts_engine.py` | Implemented |
| Edge TTS | TTS miễn phí | Ra | thư viện Microsoft Edge TTS | Văn bản | — | `workers/media_ai/audio/tts_engine.py` | Implemented (phụ thuộc thư viện không có trong `requirements.txt`: NOT VERIFIED) |
| Dify | Chat tư vấn | Ra | `${DIFY_API_URL}/chat-messages` (mặc định `api.dify.ai/v1`) | Câu hỏi, ngữ cảnh sản phẩm/khách | `DIFY_API_KEY` | `src/modules/chat-assistant/adapters/dify-chat-provider.ts` | Implemented |
| Ollama (cục bộ) | Chat dự phòng (Qwen) | Ra | `${OLLAMA_URL}` (mặc định `127.0.0.1:11434`) | Câu hỏi | — | như trên | Implemented |
| IOPaint (tự dựng) | Outpaint ảnh | Ra | `${IOPAINT_URL}` | Ảnh | — | `workers/media_ai/providers/expansion/iopaint_outpainter.py`, `docker/iopaint/` | Implemented |
| rembg / onnxruntime / OpenCV / Real-ESRGAN | Tách nền, xử lý ảnh cục bộ | Cục bộ | thư viện | Ảnh | — | `workers/media_ai/providers/segmentation/`, `upscale/` | Implemented |
| Florence-2 + SAM2 (bộ máy `local_cv`) | Phân tích ảnh cục bộ | Cục bộ | `torch`, `transformers` | Ảnh | — | `workers/vision/providers/local_cv*.py`, `workers/requirements-local-cv.txt` (cài riêng) | Implemented (cài đặt máy GPU: NOT VERIFIED) |

## 11.2 Dữ liệu thị trường

| Dịch vụ | Mục đích | API | Xác thực | Nơi dùng | Status |
|---|---|---|---|---|---|
| Google Trends | Chỉ số xu hướng | `trends.google.com/trends/api` | — | `src/modules/market-intelligence/adapters/google-trends-adapter.ts` | Implemented (luồng related queries/topics chưa nối — chú thích dòng 221) |
| SerpApi | Xu hướng dự phòng; tìm video YouTube (`engine=youtube`) và TikTok (`engine=google_videos`) | `serpapi.com/search.json` | `SERPAPI_API_KEY` | `serpapi-trend-adapter.ts`, `youtube-trend-adapter.ts`, `tiktok-trend-adapter.ts` | Implemented |

## 11.3 Kênh khách hàng, thanh toán, thông báo

| Dịch vụ | Mục đích | Chiều | API / webhook | Xác thực | Nơi dùng | Status |
|---|---|---|---|---|---|---|
| Facebook Messenger | Nhận tin, trả lời AI | Vào + Ra | Vào: `GET/POST /api/v1/chat/webhooks/facebook`; Ra: `graph.facebook.com/v19.0/me/messages` | Vào: `hub.verify_token` (env `FB_WEBHOOK_VERIFY_TOKEN`, có giá trị mặc định cứng khi thiếu); POST không kiểm chữ ký. Ra: page access token lưu trong `chat_channel_integrations.config` | `src/app/api/v1/chat/webhooks/facebook/route.ts` | Implemented |
| Zalo OA | Nhận tin, trả lời AI | Vào + Ra | Vào: `POST /api/v1/chat/webhooks/zalo`; Ra: `openapi.zalo.me/v3.0/oa/message/cs` | Vào: không kiểm; Ra: access token trong `config` | `src/app/api/v1/chat/webhooks/zalo/route.ts` | Implemented |
| Zalo ZNS | Tin báo đơn Thẻ chào | Ra | `business.openapi.zalo.me/message/template`, token `oauth.zaloapp.com/v4/oa/access_token` | Cấu hình mã hoá (`notify_config_encrypted`, `src/core/security/secret-box.ts`) | `src/modules/greeting-card/adapters/zalo-zns-adapter.ts` | Implemented |
| eSMS | SMS báo đơn | Ra | `rest.esms.vn/.../SendMultipleMessage_V4_post_json/` | Như trên | `src/modules/greeting-card/adapters/esms-adapter.ts` | Implemented |
| SePay | Báo giao dịch ngân hàng để đối soát | Vào | `POST /api/v1/public/payments/sepay` | `Authorization: Apikey <khoá>`; CSDL giữ SHA-256 (`payment_webhook_key_hash`), khoá hiện một lần khi bật | `src/modules/greeting-card/use-cases/payment-webhook.ts` | Implemented |
| VietQR (ảnh) | Ảnh QR chuyển khoản | Ra (URL ảnh) | `img.vietqr.io/image/<bank>-<account>-compact2.png?amount&addInfo&accountName` | — | `src/modules/greeting-card/adapters/vietqr-helper.ts` | Implemented |
| Google Drive | Ảnh thu nhỏ từ thư mục Drive công khai | Ra | `drive.google.com/embeddedfolderview`, `lh3.googleusercontent.com` | — | `src/modules/greeting-card/adapters/google-drive-thumbnail.ts`, `/api/v1/public/drive-thumb*` | Implemented |

## 11.4 Hạ tầng

| Dịch vụ | Mục đích | Cấu hình | Nơi dùng | Status |
|---|---|---|---|---|
| Kho tệp S3-compatible | Lưu ảnh/video/âm thanh | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_REGION`; thiếu một biến → rơi về đĩa cục bộ (ghi cảnh báo) | `src/modules/assets/adapters/storage-provider-factory.ts`, `workers/shared/` | Implemented (nhà cung cấp cụ thể: NOT VERIFIED) |
| Redis | Bộ đếm rate limit dùng chung | `REDIS_URL`; thiếu/lỗi → đếm trong bộ nhớ tiến trình | `src/core/cache/redis-client.ts`, `src/core/http/rate-limit.ts` | Implemented |
| PostgreSQL `LISTEN/NOTIFY` | Đánh thức worker | kênh `floraos_job_<feature>`, `market_intelligence_research` | `src/modules/jobs/infra/transaction.ts`, workers | Implemented |
| Google Fonts | Phông giao diện (được phép trong CSP) | — | `next.config.ts` | Implemented |

## 11.5 Ứng dụng anh em (repo khác)

| App | Hướng | Cơ chế | Dữ liệu | Status |
|---|---|---|---|---|
| SocialFlow (cổng 8000 khi dev) | Core → SocialFlow | Proxy `/api/v1/proxy/*?client=SOCIALFLOW`, danh sách trắng `api/m04b`, `api/m07/posts`, `api/posts`, `api/accounts`; timeout 120 s; URL `SOCIALFLOW_URL` | Tài khoản MXH, bài đăng | Implemented phía core; `SOCIALFLOW_URL` không được đặt trong `render.yaml` |
| LocalBudd (cổng 3000 khi dev) | Core → LocalBudd | Proxy với danh sách trắng `api/v1/catalog-links`, `projects`, `generate`, `pages`, `worker/cron`; `LOCALBUDD_URL` | Landing/catalog | Implemented phía core; không thấy màn nào gọi proxy với `client=LOCALBUDD` |
| LocalBudd / SocialFlow | App ngoài → Core | `/api/v1/integration/*` với Bearer token hoặc `X-FloraOS-SSO` | Hồ sơ, sản phẩm, ảnh master, asset, job, usage, số liệu nội dung, catalog link | Implemented phía core; phía gọi NOT VERIFIED |
| JWT SSO liên-app | Core cấp | Cookie `floraos_sso` (15 phút) ký bằng `SSO_SESSION_SECRET`; `POST /api/v1/sso/refresh` | `sub`, `org`, `email`, `iat`, `exp` | Implemented |
| FloraOS v1 | Nguồn thu hoạch | Script nạp AVI GIFT từ tệp Excel/JSON trung gian (`scripts/nap-avi-gift/`) | Danh mục, phân tích | Implemented (CLI) |

## 11.6 Đường gọi AI không đi qua `callCapability`

`callCapability` (`src/core/ai/gateway.ts`) được gọi ở: `content-engine` (3 use-case), `product-copies/generate-product-copy.ts`, `creative-production/{generate-scene-plan,revise-assets}.ts`, `market-intelligence/analyze-product-vision.ts`.

Đường gọi nhà cung cấp AI không qua cổng (mô tả, không đánh giá):
- `chat-assistant` gọi thẳng Dify / OpenAI REST / Ollama (`dify-chat-provider.ts`).
- Worker Python (vision, media, video, audio) gọi nhà cung cấp trực tiếp; `ai_requests` được ghi từ phía worker ở một số nhánh (vd `workers/media_ai/jobs/worker.py:301`) — độ phủ ghi sổ của từng nhánh: NOT VERIFIED.
