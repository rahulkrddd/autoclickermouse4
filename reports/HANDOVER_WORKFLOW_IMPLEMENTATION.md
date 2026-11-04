# Pickup, COD, delivery and refund workflow implementation

## Changed files
- `models/Order.js`: fulfillment, collection, adjustment, refund and timestamp fields; `refund_pending` payment state.
- `app.js`: delivery-mode-specific allowed statuses, controlled pickup handover, COD delivery collection confirmation, cancellation/refund state, return/refund handling, audit/history persistence.
- `public/js/admin.js`: mode-specific status dropdowns and controlled dialogs.
- `services/compatibilityService.js`: exposes the audit fields and latest update to admin/customer clients.
- `public/js/orders.js`: pickup progress mapping and latest update timestamp.

## Preserved scope
Cart, checkout, inventory commit on confirmation, invoice generation, Razorpay, Cashfree, product, coupon and site-specific behavior were not intentionally redesigned.

## Verification
- Repository JavaScript syntax check: PASS.
- Targeted implementation assertions: PASS.
- `npm test`: command exits successfully but discovers 0 tests because Repomix did not include the `tests/` directory.
- Live MongoDB, payment gateway, Supabase and Render verification: not executable without credentials and deployed environment.