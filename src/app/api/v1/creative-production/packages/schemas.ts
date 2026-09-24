/**
 * Tái xuất hợp đồng dùng chung của gói chiến dịch. Nguồn chuẩn (24/09/2026):
 * `src/modules/creative-production/contracts/` — sửa zod ở đó, rồi chạy
 * `npm run gen:schemas:creative`.
 */

export { packagePostsSchema, topicSnapshotSchema } from "@/modules/creative-production/contracts/common"
export { launchPlanBodySchema as launchPlanSchema } from "@/modules/creative-production/contracts/campaign-package"
