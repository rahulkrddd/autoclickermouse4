# Product Safety, Pagination, Featured, and Query Audit

## Confirmed root causes
1. Product create and edit used the same `POST /admin/products` handler and `findOneAndUpdate({legacyId:id}, ..., {upsert:true})`. Reusing or colliding with an editable legacy ID silently updated an existing document instead of creating a new document. The route had no count invariant or duplicate conflict response.
2. Admin product code had multiple later overrides of `load`, `renderProducts`, search handlers, and pagination handlers. It mixed the authoritative full array, `productView`, client slicing, and temporary reassignment of the global `products` variable. There was no separate server pager contract or stale response protection.
3. `featured` existed in the schema, admin checkbox, migration, and compatibility mapper, but the storefront `Featured` select option performed no featured sort or filter. Public reads only filtered `active` and did not provide a focused featured query.

## Modified files
- app.js
- models/Product.js
- routes/upgradeRoutes.js
- services/compatibilityService.js
- services/productAdminService.js (new)
- public/js/admin.js
- public/js/store.js
- scripts/audit-products.js (new)
- scripts/indexes.js
- scripts/validate-products.js (new)
- scripts/validate-queries.js (new)
- tests/product-production-fixes.test.js (new)
- package.json
- package-lock.json

## Product indexes
- `uq_products_legacyId`: unique `{legacyId:1}`
- `uq_products_slug`: unique `{slug:1}`
- `uq_products_sku_nonempty`: partial unique `{sku:1}` for non-empty strings
- `products_active_created_id`: `{active:1,createdAt:-1,_id:-1}`
- `products_active_featured_created_id`: `{active:1,featured:1,createdAt:-1,_id:-1}`
- `products_active_category_created_id`: `{active:1,category:1,createdAt:-1,_id:-1}`

`productCode` is conflict-checked by the admin service but is not made a database unique index because the repository uses it as order/invoice snapshot metadata and does not establish that every historical product must have a globally unique non-empty value.

## Query to index mapping
- Public active products: `active + createdAt + _id`
- Public featured products: `active + featured + createdAt + _id`
- Public category listing: `active + category + createdAt + _id`
- Admin stable pagination: stable `createdAt + _id`; broad prefix search remains bounded to 100 characters
- Order status pagination: existing `orderStatus + createdAt + _id`
- Inventory history: existing `productId + createdAt`
- Wishlist membership: existing unique `customerId + productId`
- Activity retention: existing TTL `expiresAt`

## Tests actually executed
- `npm install --ignore-scripts --no-audit --no-fund`: passed, 138 packages added
- `npm run check`: passed
- `npm test`: passed, 65 tests, 0 failed

## Not executed
Atlas-dependent duplicate counts, index creation, live explain statistics, before/after database product counts, Supabase, Razorpay, Render, and browser/device tests were not executed because the supplied packed repository did not include credentials or network deployment access.

## Production command order
```bash
npm install
npm run check
npm test
npm run audit:products
npm run validate:products
npm run indexes
npm run validate:db
npm run validate:queries
npm start
```

If `audit:products` exits with code 2, do not run the index command until duplicates are reconciled manually. No script deletes or merges duplicate products.

## Manual browser checklist
- Create a unique product and confirm count increases by one.
- Confirm all prior product IDs remain and active states are unchanged.
- Try duplicate Product ID, slug, and non-empty SKU and confirm HTTP 409 messages remain in the open form.
- Double-click Save and confirm only one request is accepted.
- Edit a product without an image and confirm primary/gallery images remain.
- Navigate Product Next/Previous, search quickly, clear search, and verify labels.
- Mark active product Featured and verify featured-first storefront ordering after refresh.
- Remove Featured and verify ordering updates; deactivate a Featured product and confirm it is absent publicly.
- Regression-check product details, cart, wishlist, checkout, COD, pickup, invoices, orders, reviews, coupons, Supabase images, and mobile layouts.

## Rollback
1. Export MongoDB Atlas before index work.
2. Keep the prior deployment artifact/tag.
3. Redeploy the prior application files if rollback is required.
4. Do not drop product indexes automatically. Review index differences manually.
5. New additive indexes may remain if compatible; otherwise remove them only after a reviewed rollback plan.
6. No data cleanup, duplicate deletion, or collection replacement is performed by this delivery.