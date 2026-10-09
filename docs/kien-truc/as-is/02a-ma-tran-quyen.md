# 2a. Ma trận quyền — 151 mã năng lực × 8 vai hệ thống

> Sinh tự động từ `src/core/rbac/capability-catalog.ts` (lớp 1 — mặc định theo vai, chưa tính `capability_overrides` của từng tổ chức). Cột "Được kiểm ở mã" dò tĩnh trên `src/` (trừ catalog và test): `server` = có `requireCapability`/`capabilities.has` ở route hoặc use-case; `chỉ UI` = chỉ có `can()`/mục điều hướng; **không** = không thấy nơi kiểm.
>
> Viết tắt vai: ĐH = `dieu_hanh` · ĐP = `dieu_phoi` · Sale = `sale` · PM = `product_manager` · Mkt = `marketing` · CRM = `crm` · CSKH = `customer_service` · Exp = `experience_user`. ● = có mặc định. Trần cứng = tập vai tối đa được phép (lớp 3), cắt sau mọi ghi đè.

### A — Truy cập (thu hoạch FloraOS v1)

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | `access.login` | ● | ● | ● | · | · | · | · | · | — | **không** |
| A2 | `access.password.change_own` | ● | ● | ● | · | · | · | · | · | — | **không** |
| A3 | `access.user.create` | ● | · | · | · | · | · | · | · | ĐH | server |
| A4 | `access.user.change_role` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| A5 | `access.user.toggle_active` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| A6 | `access.vault.admin_password` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| A7 | `access.user.reset_password` | ● | · | · | · | · | · | · | · | ĐH | **không** |

### B — Lượt chạy phân tích ảnh (thu hoạch)

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 | `vision_run.image.upload` | ● | ● | · | · | · | · | · | · | — | **không** |
| B2 | `vision_run.image.list` | ● | ● | · | · | · | · | · | · | — | **không** |
| B3 | `vision_run.precheck` | ● | ● | · | · | · | · | · | · | — | **không** |
| B4 | `vision_run.cost_estimate.view` | ● | ● | · | · | · | · | · | · | — | **không** |
| B5 | `vision_run.analyze.single` | ● | ● | · | · | · | · | · | · | — | **không** |
| B6 | `vision_run.analyze.batch` | ● | · | · | · | · | · | · | · | — | server |
| B7 | `vision_run.analyze.folder` | ● | · | · | · | · | · | · | · | — | **không** |
| B8 | `vision_run.analyze.all` | ● | · | · | · | · | · | · | · | — | **không** |
| B9 | `vision_run.stop.own` | ● | ● | · | · | · | · | · | · | — | **không** |
| B10 | `vision_run.stop.others` | ● | ● | · | · | · | · | · | · | — | **không** |
| B11 | `vision_run.log.own` | ● | ● | · | · | · | · | · | · | — | **không** |
| B12 | `vision_run.log.all` | ● | ● | · | · | · | · | · | · | — | **không** |
| B13 | `vision_run.unlock_stuck` | ● | · | · | · | · | · | · | · | — | **không** |
| B14 | `vision_run.reindex` | ● | ● | · | · | · | · | · | · | — | **không** |
| B15 | `vision_run.result_file.import` | ● | ● | · | · | · | · | · | · | — | **không** |
| B16 | `vision_run.result_file.download` | ● | ● | · | · | · | · | · | · | — | **không** |

### C — Thẻ báo giá (thu hoạch)

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | `pricing_card.quote.view` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C2 | `pricing_card.handoff_to_coordinator` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C3 | `pricing_card.tab.open` | ● | ● | · | · | · | · | · | · | — | **không** |
| C4 | `pricing_card.form.load_product` | ● | ● | · | · | · | · | · | · | — | **không** |
| C5 | `pricing_card.form.fill` | ● | ● | · | · | · | · | · | · | — | **không** |
| C6 | `pricing_card.price_check.view` | ● | ● | · | · | · | · | · | · | — | **không** |
| C7 | `pricing_card.field.override` | ● | ● | · | · | · | · | · | · | — | **không** |
| C8 | `pricing_card.cost_price.override` | ● | ● | · | · | · | · | · | · | — | **không** |
| C9 | `pricing_card.price.exceed_ceiling` | ● | ● | · | · | · | · | · | · | — | **không** |
| C10 | `pricing_card.price.below_floor` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| C11 | `pricing_card.preview` | ● | ● | · | · | · | · | · | · | — | **không** |
| C12 | `pricing_card.export` | ● | ● | · | · | · | · | · | · | — | **không** |
| C13 | `pricing_card.zalo_script.copy` | ● | ● | · | · | · | · | · | · | — | **không** |
| C14 | `pricing_card.export_log.own` | ● | ● | · | · | · | · | · | · | — | **không** |
| C15 | `pricing_card.export_log.all` | ● | ● | · | · | · | · | · | · | — | **không** |
| C16 | `pricing_card.export_log.download` | ● | ● | · | · | · | · | · | · | — | **không** |
| C17 | `pricing_card.product_image.view_for_sales` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C18 | `pricing_card.partner.directory_view` | ● | ● | · | · | · | · | · | · | — | **không** |
| C19 | `pricing_card.partner.dispatch` | ● | ● | · | · | · | · | · | · | — | **không** |
| C20 | `pricing_card.partner.confirm` | ● | ● | · | · | · | · | · | · | — | **không** |
| C21 | `pricing_card.task.close` | ● | ● | · | · | · | · | · | · | — | **không** |
| C22 | `pricing_card.task.return_to_sales` | ● | ● | · | · | · | · | · | · | — | **không** |
| C23 | `pricing_card.dispatch_board.view` | ● | ● | · | · | · | · | · | · | — | chỉ UI |
| C24 | `pricing_card.catalog.list` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C25 | `pricing_card.bom.view` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C26 | `pricing_card.vision_data.view` | ● | ● | ● | · | · | · | · | · | — | **không** |
| C27 | `pricing_card.partner_price.view` | ● | ● | · | · | · | · | · | · | ĐH,ĐP | **không** |
| C28 | `pricing_card.task.delete_permanent` | ● | · | · | · | · | · | · | · | ĐH | **không** |

### D — Cấu hình (thu hoạch)

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 | `config.settings.view` | ● | ● | · | · | · | · | · | · | — | **không** |
| D2 | `config.partner_tier.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D3 | `config.surcharge.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D4 | `config.priority_matrix.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D5 | `config.option_list.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D6 | `config.dynamic_list.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D7 | `config.payment_period.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D8 | `config.image_folder.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D9 | `config.field_hint.edit` | ● | ● | · | · | · | · | · | · | — | **không** |
| D10 | `config.role_cost_param.edit` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| D11 | `config.export` | ● | ● | · | · | · | · | · | · | — | **không** |
| D12 | `config.import` | ● | · | · | · | · | · | · | · | — | **không** |
| D13 | `config.reset_default` | ● | · | · | · | · | · | · | · | — | **không** |
| D14 | `config.price.bulk_update` | ● | ● | · | · | · | · | · | · | — | **không** |
| D15 | `config.system_audit.run` | ● | ● | · | · | · | · | · | · | — | **không** |
| D16 | `config.labor_rate.edit` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| D17 | `config.production_price_param.edit` | ● | · | · | · | · | · | · | · | ĐH | **không** |

### E — Hệ thống (thu hoạch)

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | `system.admin_screen.open` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E2 | `system.status.view` | ● | ● | ● | · | · | · | · | · | — | **không** |
| E3 | `system.api_key.view_masked` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E4 | `system.api_key.manage` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E5 | `system.ai_model.change` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E6 | `system.shared_folder.set` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E7 | `system.folder.auto_scan` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| E8 | `system.orphan_image.manage` | ● | · | · | · | · | · | · | · | ĐH | **không** |

### F — Tổ chức & thành viên

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F1 | `org.read` | ● | ● | ● | · | · | · | · | · | — | server + UI |
| F2 | `org.update` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| F3 | `member.invite` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| F4 | `member.remove` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| F5 | `role.manage` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| F6 | `branch.read` | ● | ● | ● | · | · | · | · | · | — | server |
| F7 | `branch.manage` | ● | · | · | · | · | · | · | · | ĐH | server |
| F8 | `workspace.manage` | ● | · | · | · | · | · | · | · | ĐH | server |
| F9 | `integration.token.manage` | ● | · | · | · | · | · | · | · | ĐH | server |

### G — Asset & job

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G1 | `asset.read` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| G2 | `asset.upload` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| G3 | `asset.delete` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| G4 | `job.read` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| G5 | `job.read.all` | ● | · | · | · | · | · | · | · | — | server |
| G6 | `job.cancel` | ● | ● | ● | · | ● | · | · | · | — | server |
| G7 | `job.retry` | ● | ● | · | · | ● | · | · | · | — | server |
| G8 | `usage.read` | ● | · | · | · | · | · | · | · | — | server + UI |
| G9 | `audit.read` | ● | · | · | · | · | · | · | · | ĐH | server + UI |

### H — Vision & dữ liệu bán hàng

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | `vision.analyze` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| H2 | `vision.result.edit` | ● | ● | · | · | ● | · | · | · | — | server + UI |
| H3 | `product.approve` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| H4 | `vision.engine.manage` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| H5 | `product_copy.generate` | ● | ● | · | · | ● | · | · | · | — | server + UI |
| H6 | `product_copy.approve` | ● | · | · | · | · | · | · | · | ĐH | server + UI |

### I/P — Ảnh & video

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I1 | `media.optimize` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| I2 | `media.approve` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| I3 | `media.download` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| I4 | `media.variant.run` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| I5 | `media.variant.approve` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| P3 | `video.approve_script` | ● | ● | · | · | ● | · | · | · | — | server |
| P4 | `video.approve_final` | ● | · | · | · | · | · | · | · | ĐH | server |

### J — Kênh bán

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| J1 | `catalog.create` | ● | ● | · | · | ● | · | · | · | — | server + UI |
| J2 | `catalog.publish` | ● | · | · | · | · | · | · | · | — | server |
| J3 | `landing.create` | ● | ● | · | · | ● | · | · | · | — | **không** |
| J4 | `landing.publish` | ● | · | · | · | · | · | · | · | — | **không** |
| J5 | `social.publish` | ● | · | · | · | ● | · | · | · | — | server + UI |
| J6 | `chat.manage` | ● | ● | · | · | ● | · | ● | · | — | **không** |

### L — Sản phẩm & giá

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L1 | `product.read` | ● | ● | ● | ● | ● | ● | · | · | — | server + UI |
| L2 | `product.create` | ● | ● | · | ● | · | · | · | · | — | server + UI |
| L3 | `product.update` | ● | ● | · | ● | · | · | · | · | — | server |
| L4 | `product.archive` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| L5 | `pricing.read` | ● | ● | · | ● | · | · | · | · | — | server + UI |
| L6 | `pricing.manage` | ● | · | · | · | · | · | · | · | ĐH | server + UI |

### U — Chính sách AI

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| U1 | `ai.policy.read` | ● | ● | · | · | · | · | · | · | — | server + UI |
| U2 | `ai.policy.manage` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| U3 | `ai.request.read` | ● | · | · | · | · | · | · | · | ĐH | server + UI |
| U4 | `ai.eval.read` | ● | ● | · | · | · | · | · | · | — | **không** |

### K — Trải nghiệm

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| K1 | `experience.use` | · | · | · | · | · | · | · | ● | — | **không** |
| K2 | `experience.convert` | ● | · | · | · | · | · | · | ● | — | **không** |

### R — Đơn hàng & vận hành

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 | `order.read` | ● | ● | ● | · | · | ● | ● | · | — | server + UI |
| R2 | `order.create` | ● | ● | ● | · | · | · | · | · | — | server + UI |
| R3 | `order.update` | ● | ● | · | · | · | · | · | · | — | server + UI |
| R4 | `order.assign` | ● | ● | · | · | · | · | · | · | — | server + UI |
| R5 | `delivery.manage` | ● | ● | · | · | · | · | · | · | — | server + UI |
| R6 | `order.cancel` | ● | · | · | · | · | · | · | · | ĐH | server |
| R7 | `order.print` | ● | ● | · | · | · | · | · | · | — | server |
| R8 | `order.card_message.manage` | ● | ● | ● | · | · | · | ● | · | — | **không** |
| R9 | `order.payment.record` | ● | ● | ● | · | · | · | · | · | — | server + UI |
| R10 | `order.payment.refund` | ● | · | · | · | · | · | · | · | ĐH | server |

### Q — CRM

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Q1 | `crm.customer.read` | ● | ● | ● | · | · | ● | ● | · | — | server + UI |
| Q2 | `crm.customer.create` | ● | ● | ● | · | · | ● | ● | · | — | server + UI |
| Q3 | `crm.customer.update` | ● | ● | ● | · | · | ● | ● | · | — | server |
| Q4 | `crm.customer.delete` | ● | · | · | · | · | · | · | · | ĐH | server |
| Q5 | `crm.customer.export` | ● | · | · | · | · | · | · | · | ĐH | **không** |
| Q6 | `crm.occasion.manage` | ● | ● | ● | · | · | ● | ● | · | — | server |
| Q7 | `crm.campaign.suggest` | ● | ● | ● | · | · | ● | ● | · | — | server + UI |
| Q8 | `crm.voucher.manage` | ● | ● | · | · | · | ● | ● | · | — | **không** |
| Q9 | `crm.consent.manage` | ● | ● | · | · | · | ● | ● | · | — | server |

### T — Hội thoại AI

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T1 | `chat.conversation.read` | ● | ● | ● | · | · | ● | ● | · | — | server + UI |
| T2 | `chat.message.send` | ● | ● | ● | · | · | · | ● | · | — | server |
| T3 | `chat.order.create` | ● | ● | ● | · | · | · | ● | · | — | server |
| T4 | `chat.config.manage` | ● | · | · | · | · | · | · | · | ĐH | server |

### V — Nghiên cứu thị trường

| Mã | Tên | ĐH | ĐP | Sale | PM | Mkt | CRM | CSKH | Exp | Trần cứng | Được kiểm ở mã |
|---|---|---|---|---|---|---|---|---|---|---|---|
| V1 | `market_intel.research.run` | ● | ● | · | · | ● | · | · | · | — | server + UI |
| V2 | `market_intel.opportunity.read` | ● | ● | ● | · | ● | · | · | · | — | server + UI |
| V3 | `market_intel.config.manage` | ● | · | · | · | · | · | · | · | ĐH | **không** |
