# Banner feature verification

Baseline: supplied mg1n5.txt. No live tenant/database/storage mutation was performed.

## Executed
- JavaScript syntax checks on the complete supplied source plus new feature files.
- Node test runner: 26 tests passed, 0 failed (25 subtests plus their parent test).
- Browser checks in headless Chromium using the actual Admin/home HTML, scripts, CSS and banner API routes: 19 user-flow checks passed, no page JavaScript exceptions.
- Browser fixture persistence and Supabase storage were in-memory doubles. Catalog/images were synthetic test fixtures, not real customer data.

## Coverage
- Auth, CSRF, viewer restrictions and foreign-site session rejection.
- Schema/query site scoping and foreign site override rejection.
- Exact desktop/mobile image output dimensions, WebP conversion and raster input formats.
- Missing/invalid image, invalid schedule, foreign product target rejection.
- Six-banner cap including inactive/scheduled banners; concurrent sixth-banner requests and rollback cleanup.
- Create, edit, replace, delete, active/inactive, scheduling, reorder, failed cleanup retry.
- Admin Banners tab actual click, desktop crop/zoom/save, mobile crop, dropdown actions.
- Homepage category/search clicks against the actual storefront filter; direct product route navigation.
- Auto-slide after 4 seconds, dots, mouse drag without accidental click, native mobile touch swipe.
- Single banner behavior, empty slider hidden, stale cached banners replaced by a fresh empty response.
- Cached render with network failure, 320px mobile layout without horizontal page overflow.

## Not verified
Live MongoDB transactions/index permissions, live Supabase bucket policy/network failures, live production deployment, physical iPhone/Safari, real payments. Existing payment/checkout/inventory/order-ID implementation was not changed by this feature.
