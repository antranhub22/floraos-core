# FLORAOS COORDINATOR — TEMPLATE/FORM DATA FIELDS SYNCHRONIZED WITH CURRENT MASTER INDEX
## FloraOS Core — Current-System Compatible Specification

**Version:** 1.0 | **Date:** 2026-09-26

> This file is the Coordinator-facing field contract after reconciliation with the current FloraOS Core Master Index. The system currently declares two official Master Indexes: Product Master Index and Customer Master Index. Coordinator must consume projections from these SSOTs rather than duplicate them. fileciteturn4file0L6-L15

## 1. Synchronization rule

- **REUSE:** field already represented by Product/Customer Master Index.
- **DERIVE:** Coordinator may derive an operational view from Master Index data without creating a second master record.
- **ORDER-OWNED:** field belongs to the order/coordination domain and is not expected in Product/Customer Master Index.
- **GAP:** Coordinator needs a concept that current Master Index does not expose; see the separate Master Index upgrade report.

Important: not every Coordinator field should be forced into Master Index. Delivery, production, QC, assignment, exception, POD and closure data are transaction/operational data, not attributes of a product or customer.

## 2. Current Master Index anchors

| Coordinator domain | Current SSOT | Use in Coordinator |
|---|---|---|
| Customer identity/profile | Customer Master Index | Select/reference customer; do not duplicate name/phone/email as customer master data. fileciteturn4file0L111-L124 |
| Customer tier/preferences | Customer Master Index | Read-only projection for operational context. fileciteturn4file0L127-L142 |
| Product identity/style/images/BOM | Product Master Index | Select product and inherit canonical product specification. fileciteturn4file0L19-L62 |
| Flower BOM atomic fields | Product Master Index | Reuse exact structure for production specification. fileciteturn4file0L64-L80 |
| Product substitution policy | Product Master Index | Use as baseline; order may carry an order-specific override/decision. fileciteturn4file0L102-L107 |
| Product commercial quote | Product Master Index | `quotePriceVnd` is reference/quote context, not a static catalog price. fileciteturn4file0L82-L89 |

## 3. Canonical synchronization matrix

| Coordinator field / concept | Current Master Index mapping | Ownership | Rule |
|---|---|---|---|
| `SYSTEM` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |
| `AI` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |
| `HUMAN` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |
| `PARTNER` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |
| `CUSTOMER` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |
| `DERIVED` | No current Product/Customer Master Index field | ORDER-OWNED | Persist in Coordinator/Order transaction model; only promote to Master Index if it is truly a reusable product/customer master attribute. |

## 4. Template/Form field contract by journey

### P1 — T01 Sales Order Intake
- Customer selector must use `buyerCustomerId` → Customer Master Index.
- Product selector must use `productId` → Product Master Index.
- Product specification/BOM/image fields should default from Product Master Index and become order-specific snapshots only when the business explicitly allows an order-level override.
- Buyer/recipient/delivery/payment/occasion/order-source fields remain transaction data.

### P2 — T02/T05 + Order Planning
- T05 is a derived operational view; no duplicate customer/product master fields.
- Planning milestones (`productionDeadline`, `pickupTargetTime`, buffers, ETA) remain order/coordination data.

### P3 — T06/T07/T08/T09
- Partner data remains the `partners` domain, as the current Master Index document explicitly states there is no third official Partner Master Index. fileciteturn4file0L6-L15
- T07 inherits Product Master Index BOM/specification and filters commercial-sensitive data.

### P4 — T10/T11/T12
- Production status, ETA, issues and finished-product evidence are order/production transaction data.

### P5 — T13–T17
- QC observations and decisions are order/QC evidence, not Product Master Index fields.
- AI QC may read Product Master Index reference specification but must write its result to the order/QC record.

### P6 — T18–T21
- Delivery address/instructions, pickup, delivery events and POD are transaction data.

### P7 — T25–T27
- Closure, partner performance and learning are transaction/analytics data. They must not overwrite Product/Customer Master Index source facts.

## 5. Current-system compatibility rules

1. `ProductMasterIndex.pricing.quotePriceVnd` is nullable by design; do not turn it into a required static selling price. fileciteturn4file0L82-L89
2. `ProductMasterIndex.stock` may be undefined because branch configuration is not currently established; Coordinator must handle this state explicitly. fileciteturn4file0L93-L98
3. `ProductMasterIndex.variants[]` is currently an empty framework, not evidence that no variants can ever exist. fileciteturn4file0L93-L98
4. Customer `address` is a free-form string in the current Master Index, so Coordinator delivery address must not pretend that it is equivalent to the Coordinator's structured 5-level delivery location. fileciteturn4file0L115-L124
5. Customer tier is `metrics.tier`, not an independent `customerTier` source field. fileciteturn4file0L127-L135

## 6. What is intentionally NOT synchronized into Master Index

Order lifecycle, delivery milestones, production deadlines, partner assignment, production status, QC result, POD, exceptions, escalation, replacement, closure and order learning remain operational transaction data. Adding these to Product/Customer Master Index would blur SSOT boundaries.

## 7. Implementation acceptance
- [ ] Customer selectors resolve to Customer Master Index IDs.
- [ ] Product selectors resolve to Product Master Index IDs.
- [ ] Product BOM uses exact current atomic structures.
- [ ] Product images reuse current master/gallery roles.
- [ ] Product substitution policy is inherited then optionally overridden at order level with audit trail.
- [ ] No Coordinator form creates a second customer/product master record.
- [ ] Order-owned fields remain in order/coordination storage.
- [ ] Missing Master Index capabilities are tracked in the separate upgrade report.