# Codl Layer 1 Specification: Order Pricing Engine

| Property | Value |
|----------|-------|
| Version | 2 |
| Created | 2026-04-22T19:10:24.057Z |
| Spec ID | 8df9ebdf-ab95-4769-b43c-1b3574765283 |
| Interview Method | Codl Spec Interview (7-stage) |
| Constraints | 15 |
| Edge Cases | 14 |
| Assumptions | 0 (0 confirmed, 0 assumed) |
| Acceptance Criteria | 19 |

## Abstract

The `calculateOrderTotal` function in `src/pricing.ts` of the `codl-governance-test` repository computes order totals by applying promo code discounts to the subtotal before tax, calculating tax on the post-discount amount, and determining shipping cost based on a $50 post-discount subtotal threshold. This specification governs that pricing logic so that Codl can detect any drift between the spec and the implementation on future pull requests.

## Summary

This block governs the order pricing logic exported by `src/pricing.ts` in the `codl-governance-test` repository. The core function, `calculateOrderTotal`, enforces a specific calculation order: (1) promo codes are applied to the raw subtotal, (2) tax is computed on the discounted subtotal, and (3) shipping is either free (when the post-discount subtotal is ≥ $50) or $5.99 (when it is below $50). Codl will use this specification as the source of truth to flag any pull request that introduces logic deviating from these rules — whether in discount application order, tax base, or shipping threshold behavior.

## Detailed Specification

The calculateOrderTotal function in src/pricing.ts must satisfy 19 acceptance criteria governing calculation order, shipping threshold behavior, promo code handling, input validation, rounding, and output completeness. Discount is always applied to the raw subtotal before tax is computed. Tax is always computed on the post-discount subtotal. Shipping is $0.00 when the post-discount subtotal is ≥ $50.00 (inclusive) and $5.99 otherwise. All five output fields (subtotal, discount, tax, shipping, total) must always be present and rounded to 2 decimal places using half-away-from-zero rounding. Unrecognized or omitted promo codes silently apply 0% discount without throwing. Validation errors are thrown immediately on the first violation encountered; errors are never batched. Invalid inputs include: empty items array, negative item price, zero or fractional quantity, negative taxRate, and NaN or Infinity in any numeric field. The subtotal is always computed internally and may never be caller-supplied.

## Constraints

### MUST

- **M1**: The function MUST apply the promo code discount to the subtotal before computing tax.
- **M2**: The function MUST compute tax on the post-discount subtotal, never on the raw subtotal.
- **M3**: The function MUST return shipping as $0.00 when the post-discount subtotal is ≥ $50.00.
- **M4**: The function MUST return shipping as $5.99 when the post-discount subtotal is < $50.00.
- **M5**: The function MUST round all five return fields (subtotal, discount, tax, shipping, total) to 2 decimal places using half-away-from-zero rounding.
- **M6**: The function MUST throw a validation error if input.items is empty.
- **M7**: The function MUST throw a validation error if any item has a negative price.
- **M8**: The function MUST throw a validation error if any item has a quantity that is not a strictly positive integer (i.e., zero, negative values, and fractional values such as 2.5 are all invalid).
- **M9**: The function MUST throw a validation error if input.taxRate is negative.
- **M10**: The function MUST throw a validation error if any numeric input field contains NaN or Infinity.
- **M11**: The function MUST throw on the first validation violation encountered. It MUST NOT collect or batch multiple errors before throwing.

### MUST NOT

- **MN1**: The function MUST NOT throw an error for an unrecognized or omitted promo code — it MUST silently apply a 0% discount.
- **MN2**: The function MUST NOT accept a caller-supplied subtotal — the subtotal MUST always be computed internally from input.items.
- **MN3**: The function MUST NOT produce return values with more than 2 decimal places.
- **MN4**: The function MUST NOT deduplicate or aggregate items with identical price and quantity — each entry contributes independently.

## Edge Cases

### EC1

Empty items array — caller passes input.items = []; function throws before computing anything

### EC2

Zero-price item — price: 0 is valid and contributes $0 to the subtotal

### EC3

Zero-quantity item — quantity: 0 is invalid; function throws

### EC4

Promo code with 0% rate — code exists in map but has 0% rate; discount field is 0, not omitted

### EC5

Post-discount subtotal exactly $50.00 — shipping must be $0.00 (inclusive boundary)

### EC6

Post-discount subtotal $49.99 — shipping must be $5.99 (one cent below threshold)

### EC7

100% promo code — post-discount subtotal is $0.00; tax is $0.00; shipping is $5.99 (since $0.00 < $50)

### EC8

taxRate of 0 — valid input; tax line item is $0.00, not omitted

### EC9

Unrecognized promo code — silently applies 0% discount; total is identical to no-promo-code case

### EC10

Large order with floating-point arithmetic — all five return fields rounded to 2 decimal places using half-away-from-zero rounding to prevent sub-penny artifacts

### EC11

NaN or Infinity in any input field (price, quantity, taxRate) — must throw a validation error; these bypass simple comparison checks in JavaScript

### EC12

Non-integer quantity (e.g., 2.5) — must throw a validation error; quantities must be positive integers for discrete-unit orders

### EC13

Multiple items with identical price and quantity — each entry contributes independently to the subtotal; no deduplication or aggregation

### EC14

Monetary rounding — all five return fields rounded to 2 decimal places using half-away-from-zero rounding (standard financial rounding mode)

## Glossary

| Term | System A | System B | Binding |
|------|----------|----------|---------|
| promo code | A code string mapped to a decimal discount rate representing a percentage off the subtotal (e.g., WELCOME10 = 0.10). Unrecognized codes apply no discount. Fixed dollar discounts are not supported. |  | A promo code always represents a percentage-based discount applied to the subtotal as a decimal multiplier. Unrecognized codes silently result in a 0% discount. |
| subtotal | Computed internally by calculateOrderTotal by summing (item.price × item.quantity) for each entry in the input.items array. Not supplied by the caller. |  | The subtotal is always the internally derived sum of line item totals (price × quantity), never a caller-supplied value. |
| tax rate | A decimal value passed in by the caller at runtime via OrderInput.taxRate (e.g., 0.0875 for 8.875%). The function applies it directly to the post-discount subtotal without any contextual lookup. |  | The tax rate is always caller-supplied as a decimal via OrderInput.taxRate and is applied directly to the post-discount subtotal. |

## Inputs

| # | Input | Source |
|---|-------|--------|
| 1 | {"items":["input.items: non-empty array of { price: number (≥ 0), quantity: number (> 0) }","input.taxRate: number ≥ 0, caller-supplied decimal","input.promoCode: optional string; absent or unrecognized → 0% discount"],"category":"User Inputs"} | -- |
| 2 | {"items":[],"category":"System Context Inputs"} | -- |
| 3 | {"items":["Promo code discount map: hardcoded at module level (e.g., WELCOME10 → 0.10)"],"category":"External Data Inputs"} | -- |
| 4 | {"items":["FREE_SHIPPING_THRESHOLD: 50 (hardcoded constant)","SHIPPING_COST: 5.99 (hardcoded constant)"],"category":"Configuration Inputs"} | -- |

## Outputs

| # | Output | Consumer |
|---|--------|----------|
| 1 | {"items":["subtotal: number — sum of (price × quantity) before discount","discount: number — dollar amount deducted from subtotal","tax: number — taxRate × (subtotal − discount)","shipping: number — 0.00 if (subtotal − discount) ≥ 50, else 5.99","total: number — (subtotal − discount) + tax + shipping"],"category":"Primary Artifacts"} | -- |
| 2 | {"items":[],"category":"Companion Artifacts"} | -- |
| 3 | {"items":["This specification is the artifact Codl uses to detect drift on future PRs against src/pricing.ts"],"category":"Governance Handoffs"} | -- |
| 4 | {"items":[],"category":"Audit Artifacts"} | -- |

## Error Policy

1. Fail fast: throw on first violated input constraint
2. Empty items array throws immediately
3. Negative item price throws immediately
4. Non-positive item quantity throws immediately
5. Negative taxRate throws immediately
6. Unrecognized promoCode: silent fallback to 0% discount, no error thrown
7. Omitted promoCode: treated identically to unrecognized, 0% discount applied

## Invariants

- Discount is applied before tax in all cases
- Shipping threshold comparison uses post-discount subtotal
- Shipping threshold is inclusive (≥ 50 = free)
- All monetary output values are rounded to 2 decimal places
- Subtotal is always derived internally, never caller-supplied

## Acceptance Criteria

- [ ] **AC-1**: AC1 — Calculation Order: Given a valid order with a recognized promo code, the function MUST apply the discount to the raw subtotal before computing tax, and MUST compute tax on the post-discount subtotal.
- [ ] **AC-2**: AC2 — Shipping Free Threshold (Inclusive): Given a post-discount subtotal of exactly $50.00, the function MUST return shipping as $0.00.
- [ ] **AC-3**: AC3 — Shipping Charged Below Threshold: Given a post-discount subtotal of $49.99, the function MUST return shipping as $5.99.
- [ ] **AC-4**: AC4 — Unrecognized Promo Code: Given an unrecognized promo code string, the function MUST NOT throw and MUST apply a 0% discount, producing output identical to the no-promo-code case.
- [ ] **AC-5**: AC5 — 100% Discount Shipping: Given a promo code that results in a 100% discount (post-discount subtotal = $0.00), the function MUST return shipping as $5.99, because $0.00 < $50.00.
- [ ] **AC-6**: AC6 — Zero Tax Rate: Given a taxRate of 0, the function MUST return tax as $0.00 (not omitted) and include it in the response object.
- [ ] **AC-7**: AC7 — Zero Price Item: Given an item with price $0.00 and a valid positive integer quantity, the function MUST accept the input and contribute $0.00 to the subtotal.
- [ ] **AC-8**: AC8 — Rounding: Given an order where intermediate calculations produce more than 2 decimal places, the function MUST return all five output fields rounded to exactly 2 decimal places using half-away-from-zero rounding.
- [ ] **AC-9**: AC9 — Multiple Identical Items: Given two or more items with identical price and quantity, the function MUST treat each as an independent line item and sum them without deduplication or aggregation.
- [ ] **AC-10**: AC10 — Empty Items Array: Given input.items as an empty array [], the function MUST throw a validation error immediately, before any computation. This is the first validation check performed.
- [ ] **AC-11**: AC11 — Negative Price: Given any item with a negative price, the function MUST throw a validation error.
- [ ] **AC-12**: AC12 — Zero Quantity: Given any item with quantity 0, the function MUST throw a validation error.
- [ ] **AC-13**: AC13 — Fractional Quantity: Given any item with a non-integer quantity (e.g., 2.5), the function MUST throw a validation error.
- [ ] **AC-14**: AC14 — Negative Tax Rate: Given a negative taxRate, the function MUST throw a validation error.
- [ ] **AC-15**: AC15 — NaN or Infinity in Numeric Fields: Given NaN or Infinity in any of price, quantity, or taxRate, the function MUST throw a validation error.
- [ ] **AC-16**: AC16 — Fail Fast: Given multiple validation violations in the same input, the function MUST throw on the first violation encountered and MUST NOT collect or return multiple errors.
- [ ] **AC-17**: AC17 — Omitted Promo Code: Given input with no promoCode field present, the function MUST apply a 0% discount and MUST NOT throw.
- [ ] **AC-18**: AC18 — Subtotal Always Internal: The function MUST NOT accept a caller-supplied subtotal. The subtotal MUST always be derived internally by summing (price × quantity) across all items.
- [ ] **AC-19**: AC19 — Output Fields Always Present: The function MUST always return all five fields — subtotal, discount, tax, shipping, total — regardless of their computed values, including when discount is $0.00 or tax is $0.00.

## Examples (Proto-Intent Tests)

### Example 1

**Input:** { items: [{ price: 30, quantity: 1 }, { price: 25, quantity: 1 }], taxRate: 0.10, promoCode: 'WELCOME10' }

**Expected Output:** { subtotal: 55.00, discount: 5.50, tax: 4.95, shipping: 0.00, total: 54.45 }

### Example 2

**Input:** { items: [{ price: 20, quantity: 2 }], taxRate: 0.08, promoCode: 'WELCOME10' }

**Expected Output:** { subtotal: 40.00, discount: 4.00, tax: 2.88, shipping: 5.99, total: 44.87 }

### Example 3

**Input:** { items: [{ price: 50, quantity: 1 }], taxRate: 0.00 }

**Expected Output:** { subtotal: 50.00, discount: 0.00, tax: 0.00, shipping: 0.00, total: 50.00 }

### Example 4

**Input:** { items: [{ price: 10, quantity: 1 }], taxRate: 0.10, promoCode: 'FULLOFF' } — where FULLOFF maps to 1.00 (100% discount)

**Expected Output:** { subtotal: 10.00, discount: 10.00, tax: 0.00, shipping: 5.99, total: 5.99 }

### Example 5

**Input:** { items: [], taxRate: 0.10 }

**Expected Output:** throws validation error

### Example 6

**Input:** { items: [{ price: -5, quantity: 1 }], taxRate: 0.10 }

**Expected Output:** throws validation error

### Example 7

**Input:** { items: [{ price: 10, quantity: 0 }], taxRate: 0.10 }

**Expected Output:** throws validation error

### Example 8

**Input:** { items: [{ price: 10, quantity: 2.5 }], taxRate: 0.10 }

**Expected Output:** throws validation error

### Example 9

**Input:** { items: [{ price: 10, quantity: 1 }], taxRate: -0.05 }

**Expected Output:** throws validation error

### Example 10

**Input:** { items: [{ price: NaN, quantity: 1 }], taxRate: 0.10 }

**Expected Output:** throws validation error

## Confidence Scores

| Field | Confidence |
|-------|-----------|
| AC1 | 1 |
| AC2 | 1 |
| AC3 | 1 |
| AC4 | 1 |
| AC5 | 1 |
| AC6 | 1 |
| AC7 | 1 |
| AC8 | 1 |
| AC9 | 1 |
| AC10 | 1 |
| AC11 | 1 |
| AC12 | 1 |
| AC13 | 1 |
| AC14 | 1 |
| AC15 | 1 |
| AC16 | 1 |
| AC17 | 1 |
| AC18 | 1 |
| AC19 | 1 |

## File Manifest

*To be populated during intent anchoring (Phase 2).*
