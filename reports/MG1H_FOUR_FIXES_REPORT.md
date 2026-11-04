# MG1H: Four requested fixes

## Source and scope
Reconstructed all 206 text files supplied in mg1H.txt. No live deployment or live database mutation was performed. Existing environment variables, database, storage objects, and secrets must remain in your deployment environment. Repomix does not contain node_modules, excluded files, or binary assets; retain any such assets from your original repository. Historical reports from the source are retained and are not new test results.

## Changes
1. Buy Now: shared checkout preparation animation now exists in loading.css for all checkout entry pages, including product detail. The modal gets a browser paint before cached asynchronous work. Closing a pending checkout prevents that attempt reopening the modal. Asset versions were updated on the five relevant HTML entry pages.
2. Coupon limits: the validation API, Razorpay order creation, Cashfree order creation, COD placement and online finalization receive the customer mobile. Global usage uses the greater of the stored counter and historical order count, so older COD orders are included. Per-customer usage is counted by normalized customerSnapshot.mobile. Blank limits are unlimited; zero means no uses allowed. Clearing a previously configured limit now persists null rather than leaving the old limit in MongoDB. COD order creation, stock changes and usage updates share a transaction. Online finalization retains its transaction and idempotency check and closes the session on errors. Cart asks for a mobile only when required for coupon eligibility, and changing that mobile clears the old discount.
3. Activation: the server rejects future-start and past-expiry activation, with specific messages and an editCoupon flag. The admin opens the existing coupon editor, displays the reason, and focuses the relevant date. After correcting dates, select Active and Save. Success state is rendered only after a successful API response. Existing UTC start-of-day/end-of-day date semantics are preserved.
4. Immediate admin updates: coupon and pickup saves merge the actual saved response into local state and rerender their list. Product saves render the returned product before the existing paginated refresh. These operations no longer depend on the startup-only load() function, which skips already loaded tabs. Popup save buttons guard duplicate submissions. Admin API reads bypass browser caching.

## Verification performed
- npm run check: PASS, JavaScript syntax validation across the supplied source and new tests.
- npm test: 41/41 PASS. Unit, extracted-route behavioral tests with mocked persistence, and structural transaction wiring checks.
- Python Playwright + Chromium: 18/18 PASS. Real admin/cart HTML and JavaScript with mocked APIs, plus an isolated checkout loader harness using the actual checkout script and shared CSS.
- Browser checks include coupon save without refresh, future and expired activation popup/focus, corrected-date save, pickup save without refresh, product save without refresh, cart mobile eligibility and stale-discount reset, mobile loader visibility/animation/width and cancellation.
- Exact logs are included beside this report.

## Not verified / release prerequisites
This is NOT a claim of complete production or end-to-end verification. Full Express startup with installed production dependencies, live MongoDB writes, real transaction retries/rollback/concurrency, actual payment gateway sessions/webhooks, Supabase, invoice generation, and every unrelated website workflow were not exercised. No credentials or running production database were provided. The existing historical release warnings are not cleared by these targeted tests.
MongoDB must support transactions (Atlas/replica set or sharded deployment). COD now requires that support, as the existing online finalizer already did. Test COD against your staging database before production.
Per-customer identity follows the existing mobile-based checkout model, not verified account/OTP identity. Changing a mobile can represent another customer; no new authentication system was introduced.
Coupon capacity is checked at online session creation and again at finalization, not reserved while a gateway session is pending. A limit/date can change before a captured payment finalizes. Gateway contention, recovery and refund handling require staging verification; no new reservation/refund architecture was added.
Historical usage is inferred from retained orders and the stored global counter. Deleted historical orders cannot reconstruct a customer's past usage. Existing cancellation/refund behavior was not changed; placed orders consume lifetime coupon usage.

## Deploy and verify
1. Back up your repository and database. Merge the changed/new application files below, or use the reconstructed source while retaining excluded assets and your existing environment configuration.
2. From the project root run:
   npm install
   npm run check
   npm test
   npm start
3. Keep the existing SITE_ID, MongoDB, session, gateway and Supabase environment variables unchanged. Deploy normally. Asset version strings request the new scripts/CSS.
4. On staging: throttle the network and click Buy Now from home/product/cart; verify the loader until checkout appears.
5. Set a test coupon global limit to 2 and per-customer limit to 1. Place one COD order with mobile A; reject A's second use; allow B's first use; reject C after the global limit. Verify online success/retry/webhook behavior separately in gateway sandbox.
6. Try activating future and expired coupons. Confirm message and edit popup; correct dates, select Active, save, and confirm the list immediately.
7. Edit coupon, pickup and product fields and save. Confirm the updated list without refresh, then refresh once to verify persistence.

## Changed existing files
- app.js
- public/admin.html
- public/cart.html
- public/css/loading.css
- public/index.html
- public/js/admin.js
- public/js/cart.js
- public/js/checkout.js
- public/orders.html
- public/product.html

## Added code and tests
- services/couponUsageService.js
- tests/browser-four-issues.py
- tests/four-issues.test.js