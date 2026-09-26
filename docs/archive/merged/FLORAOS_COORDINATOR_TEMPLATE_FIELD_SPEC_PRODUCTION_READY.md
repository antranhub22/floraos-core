# FLORAOS COORDINATOR — TEMPLATE & FORM FIELD SPEC
## Production & Commercial Ready

**Version:** 1.0 | **Date:** 2026-09-26  
**Scope:** T01–T27 + operational forms required by the Coordinator User Journey.

> This is a target production specification. It must be reconciled with the existing FloraOS repository before implementation. It does not authorize creation of a parallel order, customer, partner, auth, or database system.

## 1. Design Principles

Every field must have:
- business purpose;
- owner (`SYSTEM`, `AI`, `HUMAN`, `PARTNER`, `CUSTOMER`, `DERIVED`);
- validation;
- downstream consumer;
- storage;
- permission;
- evidence requirement when applicable.

The canonical chain is:

`Business Event → Form → Structured Data → Validation → Decision → Status → Event → Next Workflow → Evidence → Learning`

Florist research confirms that a production-ready order normally needs product/specification, buyer and recipient contacts, complete delivery location, delivery date/time, card message, special instructions, payment/commercial state, substitutions, preparation, handoff and proof of delivery. citeturn0search0turn1search0turn1search3

---

# 2. Canonical Order Object

All templates must reuse the same Order Object.

### Identity
`orderId, orderCode, organizationId, source, sourceReference, channel, orderType, priority, serviceLevel, status, createdAt, receivedAt, salesOwnerId, coordinatorId`

### Buyer
`buyerCustomerId, buyerName, buyerPhone, buyerEmail, buyerCompany, buyerTaxCode, buyerAddress, isAnonymousGift`

### Recipient
`recipientName, recipientPhone, recipientEmail, recipientRelationship`

### Occasion
`occasionType, occasionSubType, occasionDate, occasionNote`

### Delivery
`deliveryType, deliveryDate, deliveryWindowStart, deliveryWindowEnd, deliveryTargetTime, addressFullText, addressDetail, buildingName, buildingBlock, floor, room, gateEntrance, landmark, ward, district, city, latitude, longitude, deliveryZone, recipientAvailability, deliveryContactInstruction, securityInstruction, noOneHomeInstruction, handoffInstruction`

### Product
`productId, productName, productType, quantity, size, style, colorTone, designReferenceUrls, designReferenceNotes, budget`

### Flower BOM
`flowerName, variety, quantity, unit, color, shade, stemLength, budCount, role, substitutionAllowed, substitutionPriority`

### Foliage BOM
`name, quantity, unit, color, role, substitutionAllowed`

### Wrapping
`layer, material, color, pattern, quantity, substitutionAllowed`

### Accessories
`name, material, color, quantity, unit, printedText, substitutionAllowed`

### Card
`cardRequired, cardMessage, cardSignature, cardLanguage, cardStyle, cardPlacement`

### Commercial
`sellingPrice, discount, deliveryFee, tax, totalAmount, currency, paymentMethod, paymentStatus, paymentReference, depositAmount, balanceAmount, commercialNote`

### Substitution
`substitutionPolicy, allowFlowerSubstitution, allowColorSubstitution, allowWrappingSubstitution, allowAccessorySubstitution, minimumValuePolicy, requiresCustomerApproval, approvedSubstitutions, rejectedSubstitutions`

---

# 3. P1 — NHẬN ĐÚNG

## T01 — Sales Order Intake

**Purpose:** canonical entry point.

### Required P0
`source, orderType, priority, salesOwnerId, buyerName, buyerPhone, recipientName, recipientPhone, occasionType, deliveryDate, deliveryWindowStart, deliveryWindowEnd, productName, productType, quantity, designReferenceUrls, addressFullText, ward, district, city, cardRequired, cardMessage, paymentStatus`

### Operational P1
`buyerEmail, buyerCompany, recipientEmail, occasionDate, size, style, colorTone, budget, addressDetail, buildingName, floor, room, landmark, deliveryContactInstruction, securityInstruction, recipientAvailability, handoffInstruction`

### BOM
`flowerName, variety, quantity, unit, color, shade, stemLength, budCount, role, substitutionAllowed, substitutionPriority, foliage[], wrapping[], accessories[]`

### Commercial P2
`sellingPrice, discount, deliveryFee, tax, totalAmount, paymentMethod, paymentReference, depositAmount, balanceAmount`

### AI
`aiExtractedFields, aiMissingFields[], aiConflictFields[], aiAmbiguities[], aiConfidence`

### Evidence
`referenceImages[], customerChatEvidence[], documents[]`

**Critical rule:** buyer phone and recipient phone are separate fields. Do not put priority or delivery timing into free-text notes.

---

## T02 — Sales Order Brief

`orderId, orderCode, buyerSummary, recipientSummary, occasion, productSummary, deliverySummary, commercialSummary, specialRequirements, substitutionPolicy, missingFields[], conflictFields[], customerCommitments[], salesNote, salesOwner, handoffAt, handoffConfirmed`

**Customer commitments must be structured:**
`promiseType, promiseValue, promisedBy, promisedAt`

---

## T03 — Missing Information Request

`requestId, orderId, missingField, fieldLabel, reason, businessImpact, requestedFrom, requestedAt, dueAt, channel, messageTemplate, responseRequired, responseValue, responseReceivedAt, status`

Status:
`OPEN, SENT, WAITING, RECEIVED, OVERDUE, CANCELLED`

---

## T04 — Order Change Request

`changeRequestId, orderId, requestedBy, requestedAt, changeType, fieldChanged, oldValue, newValue, reason, customerImpact, productionImpact, deliveryImpact, costImpact, requiresApproval, approvedBy, approvedAt, partnerNotified, customerConfirmed, effectiveAt, status`

Change types:
`PRODUCT, FLOWERS, COLOR, WRAPPING, ACCESSORY, CARD_MESSAGE, ADDRESS, RECIPIENT, DELIVERY_DATE, DELIVERY_TIME, PRICE, QUANTITY, PARTNER, OTHER`

---

# 4. P2 — HIỂU ĐÚNG

## T05 — Coordinator Order Card

This is a derived operational view, not a new source of truth.

Always available:
`orderCode, priority, stage, status, nextAction, nextActionAt, owner, partnerName, riskLevel, riskReason, deliveryTargetTime, timeRemaining`

Operational:
`productThumbnail, productName, quantity, occasion, recipientName, deliveryZone, deliveryWindow, missingFieldCount, conflictCount, partnerConfirmed, productionProgress, productionETA, qcStatus, deliveryStatus, openExceptionCount`

Commercial fields should be permission-controlled:
`sellingPrice, paymentStatus, partnerCost, estimatedMargin`

---

## Order Planning Form (P2 operational form)

`coordinatorId, plannedAt, productionDeadline, productionBufferMinutes, pickupTargetTime, pickupBufferMinutes, deliveryWindowStart, deliveryWindowEnd, deliveryTargetTime, plannedProductionDuration, plannedQCBuffer, plannedPickupDuration, plannedDeliveryDuration, partnerSelectionDeadline, nextAction, nextActionOwner, nextActionAt, technicalInstruction, customerPromise, riskLevel, riskReason`

Derived:
`latestProductionStart, latestQCStart, latestPickupStart, latestDispatchStart`

---

# 5. P3 — CHỌN ĐÚNG

## T06 — Partner Candidate Card

### Identity
`partnerId, partnerCode, partnerName, partnerTier, status`

### Capability
`capabilityMatch, productTypeMatch, occasionCapability, designStyleCapability, specialCapability`

### Territory / capacity
`serviceArea, distanceKm, deliveryZoneMatch, availableAt, capacityTotal, capacityUsed, capacityRemaining, availabilityStatus`

### Performance
`qualityRate, qcPassRate, onTimeRate, responseRate, declineRate, reworkRate, averageProductionTime, averageResponseTime`

### Commercial
`estimatedPartnerCost, estimatedDeliveryCost, estimatedMargin`

### AI
`matchScore, matchReasons[], matchWarnings[], recommended, recommendationConfidence`

**Rule:** AI score without reasons is not production-ready.

---

## Partner Assignment Form

`partnerId, assignmentType, assignedBy, assignedAt, productionDeadline, agreedPrice, agreedETA, capacityOverride, overrideReason, partnerInstruction, specialInstruction, substitutionPolicy, requiresPartnerAcceptance, acceptanceDeadline`

---

## T07 — Partner Production Card

### Header
`orderCode, productionCode, issuedAt, partnerName, coordinatorContact`

### Deadline
`productionDeadline, deliveryTargetTime, pickupTargetTime`

### Product
`productName, productType, quantity, size, style, colorTone, referenceImages[]`

### Recipe/BOM
`flowerName, variety, quantity, unit, color, shade, role, stemLength, budCount, foliage[], wrapping[], accessories[]`

### Card
`cardMessage, cardSignature, cardStyle`

### Substitution
`substitutionPolicy, allowedSubstitutions[], forbiddenSubstitutions[], approvalRequired`

### Delivery context
`recipientName, recipientPhone, deliveryAddress, landmark, building, floor, deliveryInstruction`

### Partner CTA
`ACCEPT, DECLINE, ASK_QUESTION, REPORT_ISSUE, READY`

**Commercial-sensitive fields such as selling price/customer VIP status must not leak to partner unless explicitly authorized.**

---

## T08 — Partner Acceptance

`productionOrderId, partnerId, response, respondedAt, acceptedBy, acceptedAt, confirmedProductionETA, confirmedProductionCost, capacityConfirmed, materialAvailabilityConfirmed, substitutionConcern, partnerQuestion, declineReason, declineAlternativeETA`

Response:
`ACCEPT, DECLINE, CONDITIONAL_ACCEPT`

Conditional:
`condition, impact, requiresCoordinatorDecision`

---

## T09 — Partner Question

`questionId, productionOrderId, partnerId, questionType, question, relatedField, suggestedOptions[], askedAt, requiredBy, coordinatorResponse, respondedAt, respondedBy, affectsDeadline, affectsCost, affectsDesign, status`

Question types:
`PRODUCT, FLOWER, COLOR, WRAPPING, ACCESSORY, CARD, DELIVERY, PRICE, SUBSTITUTION, OTHER`

---

# 6. P4 — LÀM ĐÚNG

## T10 — Production Status Update

`productionOrderId, status, progressPercent, reportedAt, reportedBy, currentETA, previousETA, etaChangeMinutes, productionNote, photoUrls[]`

Derived:
`scheduleVarianceMinutes, delayRisk, delayRiskReason`

---

## T11 — Production Issue Report

`issueId, productionOrderId, issueType, severity, reportedBy, reportedAt, description, affectedComponent, affectedQuantity, evidenceImages[], expectedImpact, productionDelayMinutes, costImpact, customerImpact, deliveryImpact, proposedSolution, requiresCoordinatorDecision`

Types:
`FLOWER_UNAVAILABLE, MATERIAL_SHORTAGE, WRAPPING_SHORTAGE, ACCESSORY_SHORTAGE, CAPACITY, DESIGN, QUALITY, EQUIPMENT, DEADLINE, DELIVERY, OTHER`

---

## T12 — Production Completion

`productionOrderId, completedBy, completedAt, actualProductionDuration, actualReadyAt, finishedImageUrls[], finishedVideoUrl, completionNote, allComponentsAvailable, substitutionUsed, substitutionDetails[], readyForQC`

For premium/high-risk orders support multiple evidence views:
`frontImage, sideImage, detailImage, packagingImage, cardImage`

---

# 7. P5 — KIỂM TRA ĐÚNG

## T13 — QC Request

`qcRequestId, orderId, productionOrderId, requestedBy, requestedAt, requiredBy, qcPriority, qcType, referenceImages[], finishedImages[], specialQCInstruction, assignedQCId, status`

---

## T14 — QC Checklist

### Product
`flowerTypeCorrect, flowerQuantityCorrect, colorToneCorrect, sizeCorrect, styleCorrect`

### Construction
`compositionCorrect, proportionCorrect, wrappingCorrect, ribbonCorrect, accessoriesCorrect, cardMessageCorrect`

### Quality
`freshnessAcceptable, noVisibleDamage, noWilt, noBrokenStem, noPackagingDamage, cleanPresentation`

### Reference
`referenceImageUsable, referenceSimilarityAcceptable`

Each checklist item should be structured:
`checkId, criterion, expected, actual, result, severity, note, evidenceImageUrls[], checkedBy, checkedAt`

---

## T15 — AI QC Report

### Input
`referenceImages[], finishedImages[], bom, requirements, substitutionPolicy`

### AI result
`overallScore, overallResult, confidence, flowerMatchScore, quantityMatchScore, colorMatchScore, compositionMatchScore, wrappingMatchScore, accessoryMatchScore, cardMatchScore, qualityScore`

### Explanation
`observations[], violations[], riskFlags[], missingEvidence[], recommendations[]`

### Human decision
`humanDecision, humanOverride, overrideReason, decidedBy, decidedAt`

Result:
`PASS, REWORK, REPLACE, REJECT`

AI recommendation is not final commercial/business decision.

---

## T16 — Rework Request

`reworkId, orderId, productionOrderId, qcResultId, reason, failedCriteria[], requiredChanges[], referenceImages[], reworkDeadline, newProductionETA, partnerAcknowledged, acknowledgedAt, reworkInstructions, priority, requestedBy, requestedAt, completedAt, status`

---

## T17 — Replacement Request

`replacementRequestId, orderId, productionOrderId, reason, severity, failedPartnerId, replacementRequiredBy, customerImpact, costImpact, deliveryImpact, approvedBy, approvedAt, candidateSelectionMode, replacementCriteria, replacementPartnerId, replacementAssignmentId, oldPartnerSettlementRequired`

---

# 8. P6 — GIAO ĐÚNG

## T18 — Delivery Card

### Delivery
`deliveryId, orderId, deliveryCode, deliveryType, carrierType`

### Route
`pickupAddress, pickupLocation, pickupContact, deliveryAddress, deliveryLocation, deliveryZone, distanceKm, estimatedTravelMinutes`

### Timing
`pickupTargetTime, deliveryWindowStart, deliveryWindowEnd, deliveryTargetTime, latestArrivalTime`

### Recipient
`recipientName, recipientPhone, alternatePhone, recipientAvailability`

### Instructions
`deliveryContactInstruction, securityInstruction, buildingInstruction, handoffInstruction, noOneHomeInstruction`

### Handling
`productSummary, packageCount, specialHandling, fragile, temperatureSensitive`

---

## T19 — Pickup Request

`pickupRequestId, deliveryId, requestedAt, requestedBy, pickupTargetTime, pickupLocation, pickupContact, packageCount, readyStatus, carrierId, driverId, requestStatus, acceptedAt, acceptedBy, pickupETA, pickupConfirmedAt, exceptionReason`

Status:
`REQUESTED, ACCEPTED, DRIVER_ASSIGNED, ARRIVING, PICKED_UP, FAILED, CANCELLED`

---

## T20 — Delivery Status

`deliveryId, status, reportedAt, reportedBy, currentLocation, latitude, longitude, pickupAt, departedAt, estimatedArrivalAt, arrivedAt, delayMinutes, delayReason, recipientContactAttempted, recipientContactAt, statusNote, evidenceImages[]`

---

## T21 — Proof of Delivery

### Successful
`deliveryId, deliveredAt, recipientName, recipientConfirmation, podImageUrls[], signatureUrl, deliveryNote, handoffMethod, handoffLocation, recipientRelationship`

### Failed / unavailable
`attemptCount, attemptedAt[], attemptReason[], alternateHandoff, alternateRecipient, alternateRecipientPhone, failureReason, failureCategory, returnToShop, redeliveryRequired, redeliveryTargetTime`

---

# 9. P7 — ĐÓNG ĐÚNG

## T25 — Order Completion

### Automated gate
`deliveryCompleted, podAvailable, qcPassed, partnerAssigned, noOpenException, paymentConfirmed`

### Closure
`completedBy, completedAt, finalStatus, completionNote, customerComplaint, customerFeedback, customerSatisfaction`

### Commercial
`sellingPrice, discount, deliveryFee, partnerCost, deliveryCost, otherCost, grossMargin, settlementStatus`

### Partner evaluation
`partnerOverallRating, qualityRating, onTimeRating, communicationRating, complianceRating`

### SLA
`promisedAt, actualDeliveredAt, varianceMinutes, slaStatus, delayReason`

---

## T26 — Partner Performance Record

Generated from actual orders.

`partnerId, periodStart, periodEnd, ordersAssigned, ordersAccepted, ordersDeclined, ordersCompleted, averageResponseMinutes, averageProductionMinutes, qcPassRate, reworkRate, replacementRate, complaintRate, onTimeRate, lateRate, failedDeliveryRate, acceptanceRate, issueRate, averagePartnerCost, costVariance, qualityScore, reliabilityScore, slaScore, overallOperationalScore`

Raw metrics must remain available; do not store only a subjective composite score.

---

## T27 — Order Learning Record

`orderId, occasionType, productType, partnerId, lateSignal, qualitySignal, substitutionSignal, deliverySignal, customerSignal, commercialSignal, rootCause, contributingFactors[], successfulActions[], learningType, learningStatement, recommendedFutureAction, patternType, patternKey, patternValue, confidence`

Examples:
`PARTNER_DELAY_PATTERN, PRODUCT_COMPLEXITY_PATTERN, DELIVERY_ZONE_RISK, MATERIAL_AVAILABILITY, OCCASION_SURGE`

---

# 10. Exception Layer

## T22 — Exception Card

`exceptionId, orderId, exceptionType, severity, status, detectedAt, detectedBy, ownerId, impact, affectedStage, affectedDeadline, currentETA, newETA, delayMinutes, customerImpact, partnerImpact, commercialImpact, deliveryImpact, description, evidenceImages[], relatedEventIds[], aiRisk, aiSuggestion, aiConfidence, alternativeActions[], resolutionPlan, resolution, resolvedBy, resolvedAt`

CTA:
`RESOLVE, ESCALATE, CHANGE_PARTNER, REWORK, CANCEL`

---

## T23 — Escalation Request

`escalationId, exceptionId, orderId, requestedBy, requestedAt, escalationLevel, escalatedTo, reason, decisionRequired, deadlineForDecision, businessImpact, customerImpact, financialImpact, recommendedAction, alternativeOptions[], attachments[], decision, decidedBy, decidedAt`

---

## T24 — Partner Replacement

`replacementId, orderId, exceptionId, currentPartnerId, replacementReason, replacementDeadline, remainingProductionTime, remainingDeliveryTime, requiredCapabilities[], requiredTerritory, requiredCapacity, requiredQualityThreshold, candidatePartners[], selectedPartnerId, selectionReason, selectionMethod, costDifference, deliveryImpact, customerImpact, oldPartnerNotified, newPartnerNotified, newProductionETA, newPickupETA, newDeliveryETA, approvedBy, approvedAt, status`

---

# 11. Additional Operational Forms

## Partner Profile / Edit

`partnerId, businessName, legalName, contactName, phone, email, address, ward, district, city, latitude, longitude, partnerTier, status, capabilities[], productTypes[], occasionTypes[], styleCapabilities[], serviceAreas[], serviceRadiusKm, dailyCapacity, peakCapacity, operatingHours, sameDayCutoff, productionLeadTime, qcCapability, deliveryCapability, paymentTerms, pricingRules, standardLaborCost, qualityScore, onTimeRate, suspendedAt, suspensionReason`

## Cancellation

`cancellationId, orderId, requestedBy, requestedAt, reason, category, productionStarted, productCompleted, partnerCostIncurred, deliveryIncurred, refundRequired, refundAmount, customerNotified, partnerNotified, approvedBy, approvedAt, status`

---

# 12. Conditional Fields by Order Type

## Funeral / Sympathy
`deceasedName, serviceType, serviceDate, serviceTime, venueName, venueAddress, recipientContact, deliveryTargetTime, ribbonText, cardMessage`

## Wedding / Event
`eventDate, setupTime, venueName, venueAddress, contactPerson, contactPhone, installationRequired, quantity, setupDuration, teardownRequired`

## Corporate
`companyName, billingInfo, purchaseOrder, taxInvoiceRequired, recipientDepartment, multipleRecipients, deliverySchedule`

## Same-Day / Rush
`receivedAt, cutoffTime, deliveryTargetTime, productionDeadline, pickupTargetTime, partnerConfirmedAt`

## Hotel / Hospital / Secure Building
`buildingName, departmentOrRoom, frontDeskContact, securityInstruction, recipientPhone, handoffInstruction`

---

# 13. Commercial-Ready Minimum

The system must be able to answer:

### What was sold?
`product + specification + quantity + add-ons`

### What was promised?
`delivery date + window + target time + substitution policy + special commitments`

### What was charged?
`selling price + discount + delivery fee + tax + total + payment status`

### What did fulfillment cost?
`partner cost + delivery cost + other cost`

### Did we fulfill the promise?
`promisedAt + actualDeliveredAt + variance + SLA status`

### Who performed the work?
`partner + production owner + QC + driver`

### Can we prove it?
`reference image + production image + QC + POD`

### Can we learn from it?
`root cause + partner performance + order learning`

---

# 14. Field Governance

Before adding any new field:

1. Define business purpose.
2. Define owner.
3. Define source.
4. Define validation.
5. Define downstream consumer.
6. Define storage.
7. Define permission.
8. Define evidence if required.
9. Define status/SLA impact.
10. Add it to Workflow Orchestration and Consistency Matrix.

**No orphan field. No orphan template. No free-text replacement for structured operational data.**

---

# 15. Core Data Chains

### Delivery deadline chain

`deliveryTargetTime → productionDeadline → partnerETA → QC deadline → pickupTargetTime → delivery SLA → T25 variance → T26 performance`

### Substitution chain

`substitutionPolicy → T07 → T08 → T11 → T17/T24 → T14/T15 → T27`

### Visual QC chain

`referenceImages → T07 → finishedImages → T14 → T15 → T26`

### Exception chain

`issue → T22 → T23/T24/rework → resolution → event → T25 → T27`

---

# 16. Production Readiness Gate

A template is production-ready only when:

- [ ] Purpose defined.
- [ ] User Journey stage defined.
- [ ] Actor defined.
- [ ] P0/P1/conditional fields defined.
- [ ] SYSTEM/AI/HUMAN/PARTNER/CUSTOMER ownership defined.
- [ ] Validation defined.
- [ ] Database source defined.
- [ ] Downstream consumer defined.
- [ ] Status impact defined.
- [ ] Evidence defined.
- [ ] Exception path defined.
- [ ] Commercial impact defined.
- [ ] Permission visibility defined.
- [ ] Analytics usage defined.
- [ ] Workflow Orchestration mapping updated.
- [ ] Consistency Matrix mapping updated.

## Final operating principle

```text
NHẬN ĐÚNG
→ HIỂU ĐÚNG
→ CHỌN ĐÚNG
→ LÀM ĐÚNG
→ KIỂM TRA ĐÚNG
→ GIAO ĐÚNG
→ ĐÓNG ĐÚNG
→ HỌC ĐỂ LẦN SAU CHỌN ĐÚNG HƠN
```

This specification is intentionally designed around real florist operations rather than generic CRM fields.
