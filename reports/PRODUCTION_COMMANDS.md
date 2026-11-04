# Production command order
1. `npm ci`
2. `npm run check`
3. `npm test`
4. `node scripts/migrate-site-id.js --dry-run`
5. Atlas/provider backup and maintenance window
6. `node scripts/migrate-site-id.js --apply`
7. `node scripts/migrate-site-id.js --verify`
8. `node scripts/migrate-site-indexes.js --dry-run`
9. Review duplicate and legacy-index report, then run `--apply`
10. `node scripts/migrate-site-images.js --dry-run`
11. Run image `--apply`, verify, then separately approve cleanup
12. `node scripts/validate-site-isolation.js`
13. `node scripts/audit-unscoped-queries.js`
14. Deploy one site at a time with its own secrets and SITE_ID