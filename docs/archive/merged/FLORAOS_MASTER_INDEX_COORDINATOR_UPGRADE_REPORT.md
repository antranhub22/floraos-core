# FLORAOS CORE — MASTER INDEX UPGRADE REPORT
## Findings from Coordinator Template/Form Reconciliation

**Date:** 2026-09-26

## Executive summary

The Coordinator field set is substantially broader than the two current Master Indexes because Coordinator manages an **order transaction and fulfillment process**, while the current Master Indexes govern reusable **product** and **customer** master data.

Therefore, most Coordinator-only fields should **NOT** be added to Master Index.

However, reconciliation identifies a smaller set of genuine Master Index enhancement candidates and a few existing Master Index omissions already documented by the current audit.

---

## 1. Existing Master Index gaps already identified in the current audit

The current Master Index document itself identifies:

| Area | Current gap | Recommendation |
|---|---|---|
| `customer_consents.revoked_at` | DB column exists but is not exposed in Customer Master Index | Add `consents[].revokedAt` to preserve consent history. fileciteturn4file0L158-L164 |
| Voucher `min_order_vnd`, `max_discount_vnd`, `is_used`, `used_at`, `order_id` | DB columns exist but are not exposed | Expand voucher projection so availability is semantically correct and usage history is visible where appropriate. fileciteturn4file0L166-L175 |
| `product_variants.attributes` | DB JSON exists but is not read | Assess whether it contains reusable product/variant attributes needed by product selection. Do not expose blindly. fileciteturn4file0L181-L187 |

---

## 2. Coordinator-driven candidates for Master Index enhancement

### 2.1 Product Master — reference-image projection

**Current:** `masterImageUrl` and `galleryImages` exist. fileciteturn4file0L42-L50

**Coordinator need:** T07, QC and order intake need multiple design references.

**Recommendation:** no new master field is required if `galleryImages` can reliably carry all approved reference roles. Instead, clarify/standardize image role semantics so a Coordinator can distinguish:
- primary reference;
- approved design reference;
- catalog/social image.

This is a **schema/semantic improvement**, not necessarily a new column.

### 2.2 Product Master — explicit product substitution policy

**Current:** `substitutionPolicy` already exists. fileciteturn4file0L102-L107

**Coordinator need:** substitution must flow into T07/T08/T11/T14/T17/T24.

**Recommendation:** strengthen its contract rather than duplicate it:
- allowed;
- note;
- eventually structured substitution constraints if the business requires them.

Order-level substitution decisions remain order-owned.

### 2.3 Product Master — production readiness metadata

The current Product Master already exposes the BOM structure required by Coordinator, including flower, foliage, wrapping and accessories. fileciteturn4file0L52-L80

**Recommendation:** do not add production status/deadline/QC fields to Product Master. If additional reusable product attributes become necessary, add them only when they describe the product itself rather than a particular order.

Potential future reusable product attributes:
- standard production difficulty;
- standard production duration;
- standard handling requirements;
- standard QC-sensitive attributes.

These are candidates for a later Product Master version, not mandatory additions now.

### 2.4 Customer Master — recipient/contact concepts

Coordinator uses both buyer and recipient.

**Important distinction:** recipient is not automatically the customer.

**Recommendation:** do NOT add `recipientName`, `recipientPhone`, delivery address, or delivery instructions to Customer Master merely because Coordinator needs them. They are order-specific unless the business explicitly creates a reusable recipient/contact entity.

If repeated recipient relationships become a CRM requirement later, introduce a dedicated CRM concept rather than polluting Customer Master.

### 2.5 Customer Master — company / tax identity

Coordinator commercial workflows may need:
- `buyerCompany`
- `buyerTaxCode`

These are not present in the current Customer Master Index.

**Recommendation:** evaluate adding organization/customer business identity fields to Customer Master **only if CRM needs them beyond individual orders**. If they are only invoice/order attributes, keep them transaction-owned.

Suggested future fields:
- `companyName`
- `taxCode`
- `billingAddress`
- `billingContact`

This is a **conditional enhancement**, not an immediate mandatory change.

---

## 3. Fields that should NOT be added to Master Index

The following should remain Coordinator/Order domain:

- `deliveryTargetTime`
- `deliveryWindowStart/end`
- `productionDeadline`
- `pickupTargetTime`
- `partnerETA`
- production progress/status
- production issues
- QC results
- finished-product photos
- POD
- exceptions
- escalation
- partner replacement
- order completion
- partner cost for a specific order
- delay reason
- order-level substitution approval
- order-specific recipient
- order-specific delivery address
- order-specific card message
- order-specific commercial amount

Reason: these are facts/events about a **specific transaction**, not reusable product/customer master attributes.

---

## 4. Important Master Index semantic improvements

### A. Make Product Master projections explicit

Current Product Master already has three field projections according to the source documentation. fileciteturn4file0L216-L223

Recommendation: explicitly document which Product Master fields are allowed in:
- Sales;
- Coordinator/Florist Ticket;
- Delivery;
- Order Line Item.

This avoids every consumer creating its own interpretation.

### B. Make Customer Master projections explicit

Likewise, document the exact allowed Customer Master projection for:
- Sales Card;
- Occasion Reminder;
- Marketing Audience.

This follows the current SSOT principle that downstream modules consume projections rather than duplicate master data. fileciteturn4file0L6-L15

### C. Add source/version metadata where historical reproducibility requires it

For order fulfillment, the important requirement is not necessarily to expand Master Index itself, but to let the Order snapshot record:
- `masterIndexId`
- `masterIndexVersion` or source revision
- `capturedAt`

This preserves which Product/Customer master state was used at order time without turning the Master Index into an order-history database.

---

## 5. Priority of upgrades

### P0 — Quality / correctness
1. Add `CustomerConsent.revokedAt` projection.
2. Correct voucher availability semantics by exposing usage constraints/status where the projection is intended to represent usable vouchers.
3. Document projection contracts for Product and Customer Master.

### P1 — Coordinator integration quality
4. Standardize Product image-role semantics for reference vs catalog/social usage.
5. Make Product substitution policy contract explicit.
6. Define order snapshot/version provenance for Product Master data used in fulfillment.

### P2 — Future CRM/Product maturity
7. Evaluate customer company/tax/billing fields if CRM has a reusable B2B customer requirement.
8. Evaluate reusable Product production metadata only when the business has stable product-level measurements.

---

## 6. Final conclusion

The reconciliation does **not** justify creating a third Master Index for Coordinator.

The correct architecture is:

```text
PRODUCT MASTER INDEX ─────┐
                          ├→ COORDINATOR ORDER / TRANSACTION
CUSTOMER MASTER INDEX ────┘
                                  ↓
                    Planning → Partner → Production
                                  ↓
                             QC → Delivery
                                  ↓
                              Closure
                                  ↓
                         Performance / Learning
```

The Coordinator should consume the two existing Master Indexes and own the transaction-specific data. The Master Index should only be expanded where a field represents a reusable, cross-module master fact or where an existing database field is already clearly part of that master concept.

