# Controlled upgrade delivery

Changed: app.js, models/Order.js, routes/upgradeRoutes.js, services/settingsService.js, services/storePolicy.js, public/admin.html, public/css/app.css, public/js/admin.js, public/js/store.js, public/js/orders.js, tests/upgrade.test.js, tests/controlled-upgrade.test.js.

Implemented in this artifact: authenticated server-side admin order pagination/search/status filtering; admin product search; pickup active/inactive badges; authenticated audited inventory-log single/bulk deletion; backend store-open enforcement for online/COD creation and reorder eligibility; invoice endpoint/backfill gating; typed settings storage; public home store controls and feature badges; customer invoice visibility and safe current tracking display; form-snapshot dirty protection; additive order indexes.

Commands executed: npm install --ignore-scripts --no-audit --no-fund; npm run check; npm test.

Results: npm run check passed. npm test: 41 passed, 0 failed, 0 skipped.

Not live-tested: MongoDB Atlas, Razorpay, webhook delivery, Supabase Storage, Render, and real browsers because credentials/deployment targets were unavailable.

Rollback: retain a database export and prior deployment, redeploy the prior artifact, do not rerun JSON migration, and retain or manually review additive indexes.