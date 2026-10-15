# Changed and new files
Core additions: config/site.js, plugins/siteScopedPlugin.js, services/siteScopeService.js, services/siteInvariantService.js.
Migration/audit additions: scripts/migrate-site-id.js, scripts/migrate-site-indexes.js, scripts/migrate-site-images.js, scripts/validate-site-isolation.js, scripts/audit-unscoped-queries.js.
Tests: tests/multi-site-isolation.test.js, tests/multi-site-payment-isolation.test.js, tests/multi-site-storage-isolation.test.js, tests/multi-site-backup-reset.test.js, tests/multi-site-cache.test.js and updated Supabase path regression test.
Modified: app.js, config/env.js, all model files, Supabase/image lifecycle services, browser storage/SWR scripts, public HTML pages, package.json and package-lock.json.