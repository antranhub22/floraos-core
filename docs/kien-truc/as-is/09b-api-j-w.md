# 9b. API Inventory — As-Is (nhóm `jobs` → `workspaces`)

Phần trước và chú giải cột: [09a-api-a-i.md](09a-api-a-i.md).

> Sinh từ mã bằng script dò tĩnh, đã kiểm tay các trường hợp URL ghép động.
> - **Endpoint** viết không kèm `/api/v1` (trừ `/api/health`). `[id]` = tham số động.
> - **Use-case xử lý** = hàm `src/modules/*/use-cases/*` mà route gọi (đóng vai trò mô tả mục đích; tên hàm tự mô tả).
> - **Xác thực**: `Phiên` = `requireTenantContext` (cookie `floraos_session`, 401/409); `Phiên + platform` = `requirePlatformContext`; `Token/SSO tích hợp` = `requireIntegrationContext`; `Công khai (rate limit)` = không phiên, có `enforceRateLimit`; `Không` = không phiên, không rate limit (có thể tự xác thực bằng chữ ký/khoá).
> - **Mã quyền**: mã gọi ở route; nếu route không tự gác thì ghi mã thấy trong use-case. Nhiều method trên cùng route có thể dùng mã khác nhau (vd GET `L1`, POST `L2`).
> - **Input**: khoá body từ schema `zod` ở route và tham số `searchParams` (rút gọn). **Output**: JSON `{ data | ... }` hoặc `{ error: { code, message, details? } }` khi lỗi (`src/core/http/response.ts`); chi tiết hình dạng từng đáp ứng không liệt kê.
> - **Consumer trong repo**: số tệp giao diện gọi tới (dò tĩnh). `—` = không tìm thấy nơi gọi trong repo này.
> - ¹ `P1`, `O1` không tồn tại trong `capability-catalog.ts` → nhánh luôn bị từ chối.

#### `jobs`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/jobs` | listJobs | Phiên | G4 | query: limit, cursor | 3 tệp: `job/page.tsx`, `dashboard/store-growth-center.tsx` … |
| GET | `/jobs/[id]` | getJob | Phiên | G4 | — | 5 tệp: `[id]/page.tsx`, `tai-anh/page.tsx` … |
| POST | `/jobs/[id]/cancel` | cancelJob | Phiên | G6 | — | 2 tệp: `[id]/page.tsx`, `upload/upload-wizard.tsx` |
| GET | `/jobs/[id]/events` | getJobEvents | Phiên | G4 | query: after | — |
| POST | `/jobs/[id]/retry` | retryJob | Phiên | G7 | — | 2 tệp: `[id]/page.tsx`, `dashboard/store-manager-dashboard.tsx` |
| POST | `/jobs/batch` | enqueueJob | Phiên | theo `module`: M01→H1, M01b→H5, M04a→I1, M04b→P1¹, M04c→P3, M07→O1¹, M09→Q3, M06→J1, M05→L1 | — | 1 tệp: `dashboard/FeaturePicker.tsx` |

#### `market-intelligence`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/market-intelligence/health` | — | Phiên | V1 | — | — |
| GET | `/market-intelligence/opportunities` | listTenantOpportunities | Phiên | V2 | query: limit, cursor, min_score, timeframe | 2 tệp: `dashboard/marketing-workspace.tsx`, `market-intelligence/use-market-intelligence-data.ts` |
| POST | `/market-intelligence/product-intelligence` | analyzeProductIntelligence | Phiên | V1 | — | 1 tệp: `market-intelligence/product-intelligence-workspace.tsx` |
| GET · POST | `/market-intelligence/research-runs` | triggerResearchRun | Phiên | V1 | run_type, keyword, geo, timeframe, channel | 1 tệp: `market-intelligence/use-market-intelligence-data.ts` |
| POST | `/market-intelligence/vision-extract` | analyzeProductVision | Phiên | V1 | — | 2 tệp: `catalog/quick-product-upload-modal.tsx`, `market-intelligence/product-intelligence-workspace.tsx` |

#### `media`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| POST | `/media/background-removal` | — (luôn ném 409, đã đóng ở P24) | Phiên | — | — | — |
| GET · POST | `/media/optimizations` | listPendingOptimizations, requestOptimization | Phiên | I1 I2 | asset_id, config; query: limit | 3 tệp: `duyet/page.tsx`, `creative-studio/use-creative-studio-data.ts` … |
| GET | `/media/optimizations/[id]` | getOptimization | Phiên | I1 | — | 1 tệp: `creative-studio/use-creative-studio-data.ts` |
| POST | `/media/optimizations/[id]/approve` | approveOptimization | Phiên | I2 | — | 2 tệp: `duyet/page.tsx`, `creative-studio/use-creative-studio-data.ts` |
| GET | `/media/optimizations/[id]/download` | downloadOptimization | Phiên | I3 | query: ratio | 1 tệp: `creative-studio/use-creative-studio-data.ts` |
| POST | `/media/promote-to-master` | promoteOriginalToMaster | Phiên | I2 | asset_id | 2 tệp: `creative-studio/package-client.ts`, `creative-studio/use-creative-studio-data.ts` |
| GET · POST | `/media/variants` | listPendingVariants, requestCloudVariant, requestVariants | Phiên | I4 I5 | query: limit | 3 tệp: `creative-studio/package-revise-panels.tsx`, `creative-studio/use-creative-studio-data.ts` … |
| GET | `/media/variants/[id]` | getVariantJob | Phiên | I4 | — | 3 tệp: `creative-studio/package-revise-panels.tsx`, `creative-studio/use-creative-studio-data.ts` … |
| POST | `/media/variants/[id]/approve` | approveVariant | Phiên | I5 | — | 3 tệp: `creative-studio/package-review-section.tsx`, `creative-studio/use-creative-studio-data.ts` … |
| GET | `/media/variants/[id]/download` | downloadVariant | Phiên | I3 | query: asset_id | 1 tệp: `creative-studio/use-creative-studio-data.ts` |
| POST | `/media/variants/batch` | requestVariantBatch | Phiên | I4 | master_asset_id, presets, ratios, watermark, auto_enhance, scene_plan_id, scene_ | — |

#### `members`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/members` | listMembers | Phiên | F1 | — | 1 tệp: `thanh-vien/page.tsx` |
| DELETE | `/members/[id]` | removeMember | Phiên | F4 | — | 2 tệp: `_components/change-role-dialog.tsx`, `_components/invite-member-dialog.tsx` |
| PATCH | `/members/[id]/role` | changeMemberRole | Phiên | F5 | — | 1 tệp: `_components/change-role-dialog.tsx` |
| POST | `/members/invite` | inviteMember | Phiên | F3 | email, role_id, branch_id | 1 tệp: `_components/invite-member-dialog.tsx` |

#### `occasions`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/occasions` | createOccasion, listOccasions | Phiên | F1 F2 | code, name, register, sortOrder | 2 tệp: `tai-anh/page.tsx`, `organization/occasions-settings-form.tsx` |
| PATCH | `/occasions/[id]` | updateOccasion | Phiên | F2 | name, register, sortOrder, isActive | 1 tệp: `organization/occasions-settings-form.tsx` |

#### `orders`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/orders` | createOrder, listOrders | Phiên | R1 R2 | branchId, customerId, items, pricingRuleRef, voucherId, cardMessage, internalNot; query: status, production_status, delivery_status, branch_id, custo | 7 tệp: `don-hang/page.tsx`, `so-lieu/page.tsx` … |
| GET · PATCH | `/orders/[id]` | getOrder, updateOrderProgress | Phiên | R1 R3 | status, productionStatus, deliveryStatus, cardMessage, internalNote, deliveryWin | 1 tệp: `orders/order-detail-modal.tsx` |
| POST | `/orders/[id]/assign` | assignFlorist | Phiên | R4 | assigneeId, difficulty | — |
| POST | `/orders/[id]/cancel` | cancelOrder | Phiên | R6 (gác trong use-case) | reason | 1 tệp: `orders/order-detail-modal.tsx` |
| GET | `/orders/[id]/events` | getOrder | Phiên | R1 | — | — |
| GET | `/orders/[id]/print` | getOrderPrintout | Phiên | R7 | — | 1 tệp: `orders/order-detail-modal.tsx` |

#### `organizations`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/organizations` | listOrganizations, resolveSession | Phiên (không cần tổ chức) | — | — | — |
| GET · PATCH | `/organizations/current` | getCurrentOrganization, updateCurrentOrganization | Phiên | F1 F2 | name, settings | 11 tệp: `admin/admin-brochure-payment-tab.tsx`, `admin/brochure-default-owner-settings.tsx` … |
| POST | `/organizations/current/upgrade-request` | requestOrganizationUpgrade | Phiên | F2 | requested_type, note | — |

#### `platform`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/platform/audit-logs` | listPlatformAudit | Phiên + platform | N6 (gác trong use-case) | query: limit | 1 tệp: `nhat-ky/page.tsx` |
| GET | `/platform/behaviors` | — | Phiên + platform | N12 | query: kind | 1 tệp: `_lib/api.ts` |
| GET | `/platform/catalogs` | listCatalogs | Phiên + platform | N12 (gác trong use-case) | — | 1 tệp: `_lib/api.ts` |
| POST | `/platform/catalogs/[key]/values` | upsertCatalogValue | Phiên + platform | N12 (gác trong use-case) | — | 1 tệp: `_lib/api.ts` |
| GET · PATCH · POST | `/platform/fields` | listFields, updateFieldConfig, createCustomField | Phiên + platform | N12 (gác trong use-case) | query: entity | 1 tệp: `_lib/api.ts` |
| POST | `/platform/fields/[key]/deactivate` | deactivateField | Phiên + platform | N12 (gác trong use-case) | — | 1 tệp: `_lib/api.ts` |
| GET | `/platform/health` | readSystemHealth | Phiên + platform | N5 (gác trong use-case) | — | 2 tệp: `suc-khoe/page.tsx`, `dashboard/platform-journey-home.tsx` |
| GET | `/platform/organizations` | listOrganizations | Phiên + platform | N1 (gác trong use-case) | — | 3 tệp: `to-chuc/page.tsx`, `_lib/api.ts` … |
| GET | `/platform/organizations/[id]` | getOrganization | Phiên + platform | N1 (gác trong use-case) | — | 1 tệp: `[id]/page.tsx` |
| PUT | `/platform/organizations/[id]/field-overrides` | setFieldOverrideForOrganization, setCatalogValueOverrideForOrganization | Phiên + platform | N12 (gác trong use-case) | — | 1 tệp: `_lib/api.ts` |
| GET | `/platform/organizations/[id]/field-preview` | previewEffectiveConfig | Phiên + platform | N12 (gác trong use-case) | query: entity | 1 tệp: `_lib/api.ts` |
| GET | `/platform/usage` | summarizeUsage | Phiên + platform | N4 (gác trong use-case) | query: since | 1 tệp: `muc-dung/page.tsx` |

#### `pricing-rules`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · PUT | `/pricing-rules` | getPricingRules, putPricingRules | Phiên | L5 L6 | key, value, branch_id; query: branch_id | 2 tệp: `gia/page.tsx`, `gia/pricing-rules-config-card.tsx` |

#### `product-copies`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/product-copies` | listProductCopies | Phiên | H5 (gác trong use-case) | query: product_id, approval_state | 1 tệp: `duyet/page.tsx` |
| GET · PATCH | `/product-copies/[id]` | getProductCopy, updateProductCopy | Phiên | H5 (gác trong use-case) | — | 2 tệp: `[copyId]/page.tsx`, `tai-anh/page.tsx` |
| POST | `/product-copies/[id]/approve` | approveProductCopy, getProductCopy | Phiên | H6 (trong use-case) | — | 3 tệp: `duyet/page.tsx`, `[copyId]/page.tsx` … |
| POST | `/product-copies/[id]/reject` | rejectProductCopy, getProductCopy | Phiên | H6 (trong use-case) | — | 3 tệp: `duyet/page.tsx`, `[copyId]/page.tsx` … |
| POST | `/product-copies/generate` | generateProductCopy | Phiên | H5 (trong use-case) | — | 1 tệp: `tai-anh/page.tsx` |

#### `product-intelligence`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/product-intelligence/[id]` | — | Phiên | V2 | — | 2 tệp: `creative-studio/page.tsx`, `market-intelligence/creative-handoff-modal.tsx` |

#### `products`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/products` | createProduct, listProducts | Phiên | L1 L2 | code, name, branch_id, category, shape, facing, container, status, attributes, i; query: status, limit, price_min, price_max, branch_id, category, oc | 11 tệp: `bao-gia/page.tsx`, `catalog/page.tsx` … |
| GET · PATCH | `/products/[id]` | getProduct, updateProduct | Phiên | L1 L3 L4 | code, name, branch_id, category, shape, facing, container, status, attributes | 6 tệp: `[id]/page.tsx`, `tinh-nang/page.tsx` … |
| GET | `/products/[id]/master-index` | getProductMasterIndex | Phiên | L1 | — | — |
| POST | `/products/batch-import` | — | Phiên | L2 | code, name, category, shape, facing, container, status, attributes, image_asset_ | 1 tệp: `bulk-import/run-bulk-import.ts` |
| GET | `/products/master-index` | listProductMasterIndex | Phiên | L1 | query: limit | 3 tệp: `dashboard/product-manager-workspace.tsx`, `orders/create-order-modal.tsx` … |

#### `proxy`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| DELETE · GET · PATCH · POST · PUT | `/proxy/[...path]` | callProxy, toProxyError | Danh tính chuyển tiếp: JWT SSO (cookie/header) hoặc Bearer | — | query: client | 3 tệp: `ket-noi/page.tsx`, `lich-dang/page.tsx` … |

#### `public`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/public/brochure/[sendCode]` | assertBrochureOwner, getGreetingCatalogForCustomer | Công khai (rate limit) | — | — | — |
| POST | `/public/brochure/[sendCode]/claim` | claimBrochureSession, isHttps, serializeOwnerCookie, markBrochureOpened | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-claim-gate.tsx` |
| POST | `/public/brochure/[sendCode]/event` | assertBrochureOwner, recordCustomerJourneyEvent | Công khai (rate limit) | — | event, productId | 1 tệp: `customer/use-journey-tracker.ts` |
| POST | `/public/brochure/[sendCode]/open` | assertBrochureOwner, markBrochureOpened | Công khai (rate limit) | — | — | — |
| POST | `/public/brochure/[sendCode]/order` | assertBrochureOwner, submitBrochureOrder | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-customer-experience.tsx` |
| POST | `/public/brochure/[sendCode]/payment-notify` | assertBrochureOwner, reportCustomerPayment | Công khai (rate limit) | — | — | 2 tệp: `customer/brochure-customer-experience.tsx`, `customer/brochure-public-view.tsx` |
| POST | `/public/brochure/[sendCode]/quote` | assertBrochureOwner, quoteBrochureSession | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-customer-experience.tsx` |
| POST | `/public/brochure/[sendCode]/reorder` | assertBrochureOwner, isHttps, serializeOwnerCookie, startAnotherOrder | Công khai (rate limit) | — | — | 1 tệp: `customer/reorder-button.tsx` |
| POST | `/public/brochure/[sendCode]/select` | assertBrochureOwner, selectBrochureProduct | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-customer-experience.tsx` |
| GET · POST | `/public/brochure/tracking/[code]` | isBrochureOwner, getBrochureTracking | Công khai (rate limit) | — | query: link | 3 tệp: `customer/brochure-payment-view.tsx`, `customer/brochure-tracking-view.tsx` … |
| GET | `/public/catalog/[slug]` | getPublicCatalog | Công khai (không rate limit) | — | — | — |
| POST | `/public/catalog/[slug]/lead` | — | Công khai (không rate limit) | — | phone, message | 1 tệp: `landing-templates/landing-template-lead.tsx` |
| POST | `/public/csp-report` | — | Công khai (rate limit) | — | — | trình duyệt (next.config.ts report-uri) |
| GET | `/public/drive-thumb-proxy` | — | Công khai (rate limit) | — | query: folder_id | 3 tệp: `aux/aux-kit.tsx`, `greeting-card/drive-thumb-image.tsx` … |
| GET | `/public/drive-thumbnail` | — | Công khai (rate limit) | — | query: folder_id | 1 tệp: `bulk-import/use-drive-thumbs.ts` |
| POST | `/public/greeting-catalog/[id]/event` | recordCatalogEvent | Công khai (rate limit) | — | type, channel, visitorId, productId | 1 tệp: `customer/use-catalog-tracking.ts` |
| POST | `/public/greeting-catalog/[id]/order` | submitPublicCatalogOrder, recordCatalogEvent, grantBrochureOwnerByCode, isHttps, serialize | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-public-view.tsx` |
| POST | `/public/greeting-catalog/[id]/quote` | quotePublicCatalog | Công khai (rate limit) | — | — | 1 tệp: `customer/brochure-public-view.tsx` |
| POST | `/public/payments/sepay` | handleSepayWebhook | Header `Authorization: Apikey` (khoá theo tổ chức) + rate limit | — | id, transferType, transferAmount, content, accountNumber, transactionDate, refer | bên ngoài: SePay (webhook) |

#### `roles`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/roles` | createRole, listRoles | Phiên | F1 F5 | — | 1 tệp: `thanh-vien/page.tsx` |
| PATCH | `/roles/[id]/capabilities` | updateRoleCapabilities | Phiên | F5 | changes | — |

#### `session`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| POST | `/session/organization` | resolveSession, switchOrganization | Phiên (không cần tổ chức) | — | — | — |

#### `sso`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| POST | `/sso/refresh` | resolveSession | Phiên (không cần tổ chức) | — | — | bên ngoài: LocalBudd/SocialFlow — NOT VERIFIED; không có nơi gọi trong repo |

#### `storage`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · PUT | `/storage/[...key]` | — | Chữ ký HMAC + hạn trên URL | chữ ký HMAC trên URL | query: exp, sig | URL ký do API trả về + 5 tệp ghép trực tiếp |
| GET · POST | `/storage/trash` | getTrashList, moveToTrash | Phiên | một trong G3/L4/A3/B6 (requireExecutiveRole) | id, type | 3 tệp: `san-pham/page.tsx`, `storage/account-storage-hub.tsx` … |
| DELETE | `/storage/trash/[id]` | permanentDelete | Phiên | một trong G3/L4/A3/B6 (requireExecutiveRole) | query: type | 1 tệp: `storage/storage-trash-tab.tsx` |
| POST | `/storage/trash/[id]/restore` | restoreFromTrash | Phiên | một trong G3/L4/A3/B6 (requireExecutiveRole) | type | 1 tệp: `storage/storage-trash-tab.tsx` |

#### `template-overrides`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · PUT | `/template-overrides` | getTemplateOverrides, setTemplateOverride | Phiên | F1 F2 | templateFamily, templateKey, fieldKey, value; query: templateKey | 2 tệp: `tai-anh/page.tsx`, `profiles/greeting-line-override-form.tsx` |
| DELETE | `/template-overrides/[templateKey]/[fieldKey]` | removeTemplateOverride | Phiên | F2 | — | 1 tệp: `profiles/greeting-line-override-form.tsx` |

#### `usage`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET | `/usage` | listUsage | Phiên | G8 | query: limit, cursor | 1 tệp: `muc-dung/page.tsx` |
| GET | `/usage/summary` | getUsageSummary | Phiên | G8 | — | 5 tệp: `muc-dung/page.tsx`, `tinh-nang/page.tsx` … |

#### `video`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/video/jobs` | — | Phiên | I1 | query: productId, format, stage, limit | 4 tệp: `video/page.tsx`, `creative-studio/package-revise-panels.tsx` … |
| GET | `/video/jobs/[id]` | videoViewUrl | Phiên | I1 | — | 5 tệp: `video/page.tsx`, `creative-studio/package-review-section.tsx` … |
| POST | `/video/jobs/[id]/approve-script` | — | Phiên | P3 (gác trong use-case) | — | 1 tệp: `video/page.tsx` |
| POST | `/video/jobs/[id]/approve-video` | — | Phiên | P4 (gác trong use-case) | — | 2 tệp: `video/page.tsx`, `creative-studio/package-review-section.tsx` |
| POST | `/video/jobs/[id]/render` | — | Phiên | I1 | scene_images, video_provider | 1 tệp: `video/page.tsx` |
| PATCH | `/video/jobs/[id]/storyboard` | — | Phiên | I1 | scenes | 2 tệp: `video/page.tsx`, `creative-studio/package-revise-panels.tsx` |

#### `vision`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/vision/analyses` | listApprovedAnalyses, listPendingAnalyses, requestAnalysis | Phiên | H1 H3 H5 L1 | asset_ids, product_id; query: approval_state, limit, approved, cursor | 9 tệp: `catalog/page.tsx`, `duyet/page.tsx` … |
| GET · PATCH | `/vision/analyses/[id]` | editAnalysis, getAnalysis | Phiên | H1 H2 | edited | 4 tệp: `duyet/analyses-approval-panel.tsx`, `duyet/page.tsx` … |
| POST | `/vision/analyses/[id]/approve` | approveAnalysis | Phiên | H3 | — | 3 tệp: `duyet/page.tsx`, `tai-anh/page.tsx` … |
| POST | `/vision/analyses/[id]/reject` | rejectAnalysis | Phiên | H3 | ly_do | 3 tệp: `duyet/page.tsx`, `tai-anh/page.tsx` … |
| GET | `/vision/analyses/export` | exportAnalyses | Phiên | H3 | query: from, to | 2 tệp: `duyet/analyses-approval-panel.tsx`, `duyet/page.tsx` |
| GET · PUT | `/vision/engine` | getVisionEngine, setVisionEngine | Phiên | H1 H4 | — | 1 tệp: `bo-may/page.tsx` |

#### `workspaces`

| Method | Endpoint | Use-case xử lý | Xác thực | Mã quyền | Input | Consumer trong repo |
|---|---|---|---|---|---|---|
| GET · POST | `/workspaces` | createWorkspace, listWorkspaces | Phiên | F1 F8 | name, kind | — |
