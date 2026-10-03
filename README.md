# AutoClickerMouse Production Upgrade

Controlled upgrade of the existing Express, MongoDB Atlas and Razorpay store. Existing URLs, HTML/CSS design, localStorage cart/wishlist and compatibility response fields are retained.

## Setup
```bash
cp .env.example .env
npm ci
npm run check
npm test
npm run indexes
npm run defaults:dry
npm run validate:db
npm start
```

## Safe backfills
```bash
npm run defaults:dry
npm run defaults:backfill
npm run invoices:dry
npm run invoices:backfill
npm run reconcile:customers
npm run storage:check
```
No backfill runs during application startup. Product defaults use missing-field-only updates. Invoice backfill only processes confirmed orders and is idempotent.

## Inventory and orders
All stock changes must use `services/inventoryService.js`. Normal product updates do not write stock. Paid Razorpay orders deduct once during the transactional finalizer. COD, pickup and manual pending orders deduct at `Order Confirmed`. Inventory logs use unique idempotency keys.

## Product controls
`active`, Buy Now, Add to Cart, quantity limits, delivery, pickup, COD, backorder, reserved stock and effective stock are validated server-side. Existing products receive backward-compatible defaults via the explicit default backfill.

## Payments
Browser verification and the raw-body Razorpay webhook call the same transaction finalizer. Do not store or log webhook secrets, signatures or raw gateway payloads. COD creates no Razorpay record.

## Invoices
Final invoices are created only at `Order Confirmed`. Format: `INV-YYYY-000001`, using an atomic yearly counter. PDFs are generated from immutable invoice snapshots and are not stored in MongoDB.

Customer: `GET /my-orders/:orderId/invoice?mobileNumber=...`
Admin: `GET /admin/orders/:orderId/invoice`
Backfill: `POST /admin/orders/:orderId/invoice/backfill`

## Order editing
Admin updates are allowlisted. Customer and notes can be corrected. Item/financial edits are limited to unpaid `Order Placed` orders and prices are reloaded from MongoDB. Paid history and issued invoices are not rewritten.

## Supabase Storage
Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. The service-role key stays server-side. JPEG, PNG and WebP up to 5 MB are accepted, with collision-safe names and upload rollback.

## Render
Use Node.js 20+, MongoDB Atlas replica set, persistent environment variables and the start command `npm start`. Configure Razorpay webhook `/webhooks/razorpay` for `payment.captured` and `payment.failed`.

## Rollback
Stop the upgraded service and redeploy the untouched original project. Data backfills are additive. Export MongoDB before rollback. Do not drop the database. Disable new routes at the deployment level if needed; do not switch operational writes back to JSON.
## Admin UI
The existing admin dashboard now contains Orders, Products, Coupons, Pickup, Settings, Inventory and Activity tabs. Manual orders are created inside the Orders tab rather than by browsing to the POST API URL. Order rows include View, Edit, Status and conditional Invoice controls.

## Operational notes
`npm run reconcile:customers` now removes the aggregation `_id` before updating customers. `npm run validate:db` gracefully reports a skip when the Atlas user cannot execute `collMod`. Supabase image controls remain visible but require configured Supabase environment variables.