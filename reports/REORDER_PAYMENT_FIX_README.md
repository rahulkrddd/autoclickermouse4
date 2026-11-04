# Reorder payment fix

## Root cause
The Orders page loaded orders.js and checkout.js but not common.js. Reorder checkout uses acmKey to generate the payment attempt storage key; the missing helper causes the initial failure. Its catch handler then calls missing track, masking the first error and preventing toast and button recovery. toast was also absent on this page.

## Changes
- public/orders.html loads common.js before orders.js and checkout.js.
- public/js/orders.js reuses the shared $ helper instead of redeclaring it. No order/reorder business rules changed.
- public/js/checkout.js makes analytics best-effort, catches synchronous and rejected tracking failures, restores the checkout form after payment-start errors and Razorpay dismissal, and handles asynchronous Razorpay verification errors visibly.
- Checkout script URLs use reorder-fix2; Orders script URL also changed to avoid stale browser cache.
- Previous online-delivery inventory fix retained: unpaid delivery checkout is unreserved, pickup still holds stock, COD route unchanged. Startup releases tracked legacy unpaid delivery holds. The previous output ZIP was not available in the current filesystem, so its documented inventory implementation was reapplied to the original supplied Repomix source.

## Validation executed for this release
- 17 Node tests passed. Actual checkout functions executed in a VM with mocked DOM/storage/gateway APIs.
- 4 headless Chromium scenarios passed on the actual Orders HTML and scripts, using mocked API responses and gateway SDKs: Cashfree only, Razorpay only, both/select Cashfree, both/select Razorpay. Each started the selected gateway without uncaught errors and restored the payment button after mocked cancellation/dismissal.
- npm run check passed for all JavaScript files.
- Browser tests invoke openDirectCheckout on the Orders page, the same checkout entrypoint used by reorder; they do not click a historical order card.
- No live gateway transaction, live webhook, live MongoDB, or production server boot test performed. Historical reports supplied in the original repository are not new validation results.

## Deployment
Back up source and database. Deploy all archive contents, preserve current environment variables and separately maintained binary assets. Run npm install, npm test, npm run check, npm start. Avoid simultaneously running old and new server versions during the inventory schema transition. Hard refresh once after deployment if an old tab remains open.

## Scope and packaging
Includes all 239 source files supplied in mg1m2.txt, plus current tests/reports. Repomix does not include node_modules, secrets, database contents, or omitted binary assets. No stock reset or guessed historical stock correction is performed.

## Inventory behavior
Online delivery: checkout/cancel/failure does not reserve or reduce stock; verified paid order commits stock once through the existing transaction. Pickup/COD behavior preserved. Without unpaid reservations, last-unit contention may result in captured payment needing the existing attention_required/admin review/refund workflow.