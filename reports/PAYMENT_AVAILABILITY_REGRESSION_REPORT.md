# Payment Availability Regression Report

## Implemented behavior

- Online payment is shown only when at least one configured gateway is actually available through `/api/payments/config`.
- COD is shown only when COD is enabled in settings and every checkout product allows COD.
- When online payment and COD are both unavailable, checkout shows: `No payment method is currently available. Please try again later.`
- In the no-payment state, the payment action remains disabled and no order/payment request is initiated.
- Existing single-gateway selection, dual-gateway choice, COD flow, delivery selection, coupon flow, validation, abandonment tracking, and payment verification paths remain unchanged.

## Verification

- `npm run check`: passed.
- `npm test`: 7 tests passed, 0 failed.
- New availability matrix coverage:
  - all online gateways disabled + COD disabled
  - all online gateways disabled + COD enabled
  - Cashfree enabled
  - Razorpay enabled
  - COD enabled but product disallows COD
  - no unconditional Online payment option in checkout markup
