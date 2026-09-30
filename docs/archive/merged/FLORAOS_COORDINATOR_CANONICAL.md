# FLORAOS COORDINATOR — CANONICAL FIELD DATA CONTRACT
## Master-Index-Aligned / Production & Commercial Ready

**Version:** 1.0 | **Date:** 2026-09-26

This is the canonical field-level contract for Coordinator. It reconciles the Coordinator field specification with the current FloraOS Core Master Index. The current core has exactly two official Master Indexes: Product Master Index and Customer Master Index. fileciteturn4file0L6-L15

## 1. Source-of-truth hierarchy

```text
PRODUCT MASTER INDEX
        ↓
Product identity / style / images / BOM / substitution baseline
        ↓
COORDINATOR ORDER SNAPSHOT
        ↓
Planning → Partner → Production → QC → Delivery → Closure

CUSTOMER MASTER INDEX
        ↓
Customer identity / tier / preferences / consent context
        ↓
COORDINATOR ORDER
        ↓
Order-specific recipient / delivery / operational events
```

## 2. Canonical ownership rule

Every Coordinator field must be classified as one of:

- **MASTER** — read from Product/Customer Master Index.
- **ORDER-SNAPSHOT** — copied from a Master Index at order creation when historical fidelity requires a snapshot.
- **ORDER-OWNED** — belongs only to the transaction/order.
- **DERIVED** — calculated from source data.
- **EVIDENCE** — proof generated during fulfillment.
- **ANALYTICS** — derived after fulfillment; never overwrites source facts.

## 3. Master-aligned field rules

### Customer
`buyerCustomerId` → `CustomerMasterIndex.id`

Use current Customer Master Index fields:
- `name`
- `phone`
- `email`
- `address`
- `metrics.tier`
- `preferences.preferredFlowers`
- `preferences.preferredColors`

Do not create a second customer master inside Coordinator. Current customer `address` is free text, so it must not be treated as the structured delivery address. fileciteturn4file0L115-L124

### Product
`productId` → `ProductMasterIndex.id`

Reuse:
- `code`
- `name`
- `status`
- `category`
- `shape`
- `facing`
- `container`
- `style`
- `occasions`
- `masterImageUrl`
- `galleryImages`
- `colorPalette.primaryColor`
- `colorPalette.secondaryColor`
- `bom.flowers[]`
- `bom.foliage[]`
- `bom.wrapping[]`
- `bom.wrapStyle`
- `bom.ribbon`
- `bom.accessories[]`
- `bom.tierCount`
- `pricing.quotePriceVnd`
- `variants[]`
- `stock`
- `freshnessGuaranteeDays`
- `warningTags`
- `dimensions`
- `substitutionPolicy`

The BOM atomic structures are canonical and must not be redefined differently inside Coordinator. fileciteturn4file0L52-L80

### Order-owned
The following remain Coordinator/Order domain:
- order identity/source/priority/service level
- recipient
- occasion-specific order data
- structured delivery address
- delivery window/target
- customer promise
- planning milestones
- partner assignment
- partner acceptance/questions
- production updates/issues/completion
- QC request/checklist/result
- rework/replacement
- delivery/pickup/POD
- exceptions/escalations
- closure
- order-level learning

## 4. Snapshot rule

When an order uses a Product Master Index item, the Coordinator may store an **order snapshot** of the product specification used for fulfillment.

Reason: Product Master can change later; historical orders must retain what was actually promised and produced.

Recommended snapshot:
`productId + productCode + productName + category/style + reference images + BOM + substitution policy + quoted commercial context`

The snapshot is not a second Product Master. It is immutable order evidence.

## 5. Override rule

An order may override:
- quantity
- size/variant
- color/tone
- card message
- delivery requirements
- substitution decision
- selected reference image
- selected BOM quantities

Any override must:
1. identify the source master value;
2. record the new order value;
3. record who changed it;
4. record when;
5. record reason where material;
6. preserve the original master value.

## 6. Commercial rule

`pricing.quotePriceVnd` is not a static catalog price; the current system intentionally allows it to be null because real selling price is determined by `quotePrice()` for a consultation/order context. fileciteturn4file0L82-L89

Therefore:
- Coordinator must not require a non-null Product Master selling price.
- Actual order selling price belongs to the transaction/commercial order context.
- Partner-facing views must not expose commercial-sensitive fields by default.

## 7. Operational rule

Do not move production, QC, delivery, POD or exception fields into Product/Customer Master merely because Coordinator needs them.

Those fields describe **what happened to an order**, not a permanent property of a customer or product.

## 8. Canonical field chain

```text
Customer Master
        ↓
buyerCustomerId
        ↓
Order
        ↓
Product Master
        ↓
productId + order snapshot
        ↓
Planning
        ↓
Partner
        ↓
Production
        ↓
QC
        ↓
Delivery / POD
        ↓
Closure
        ↓
Analytics / Learning
```

## 9. Canonical acceptance gate

A Coordinator field is implementation-ready only when:
- owner is defined;
- source is defined;
- Master vs Order ownership is explicit;
- type is defined;
- required/conditional rule is defined;
- validation is defined;
- permission is defined;
- evidence requirement is defined;
- downstream consumer is defined;
- UI mapping is defined;
- DB persistence strategy is defined;
- AI/automation behavior is defined;
- exception behavior is defined.

No orphan field. No duplicate Master Index. No free-text substitute for structured operational facts.
