/**
 * Calculate order pricing with discount rules.
 * Business logic: promo codes apply BEFORE tax,
 * free shipping threshold is $50 post-discount.
 */

export interface OrderInput {
  items: { price: number; quantity: number }[];
  promoCode?: string;
  taxRate: number;
}

export interface OrderTotal {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

const PROMO_CODES: Record<string, number> = {
  WELCOME10: 0.10,
  SAVE20: 0.20,
};

const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING = 5.99;

export function calculateOrderTotal(input: OrderInput): OrderTotal {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountRate = input.promoCode
    ? (PROMO_CODES[input.promoCode] ?? 0)
    : 0;
  const discount = subtotal * discountRate;

  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * input.taxRate;

  const shipping =
    afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total: afterDiscount + tax + shipping,
  };
}
// direct commit test 1776951514
// ADR-005 fix validation 1776963882
// ADR-005 fix: confirm normal operation resumed 1776964192
// ADR-005 active-path retry post neon upgrade 1776966121
