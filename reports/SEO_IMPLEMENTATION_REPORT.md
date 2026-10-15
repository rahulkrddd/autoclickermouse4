# Multi-site SEO implementation

## Scope
Only additive SEO and branding support was introduced. Existing checkout, cart, Razorpay, MongoDB, reviews, orders, products, admin, inventory, coupons, settings, uploads, APIs, models, services, middleware, authentication, caching, pagination, activity and analytics logic was not refactored or removed.

## Added
- `seo/site-a.js`, `seo/site-b.js`, and `seo/site-c.js`: SITE_ID-owned isolated branding/SEO configuration and favicon fallback resolution.
- `public/js/seo.js`: lightweight metadata, canonical, Open Graph, Twitter, Organization, Product, AggregateRating, Breadcrumb and image SEO layer.
- `logo/default.ico`, `site-a.ico`, `site-b.ico`, `site-c.ico`: supported favicon assets.
- `tests/seo-multisite.test.js`: SEO scope and isolation regression coverage.

## Modified
- `app.js`: additive read-only SEO config, favicon, robots.txt and dynamic sitemap.xml routes.
- Public HTML pages: one deferred `/js/seo.js` include per page.

## Configuration
Use `SITE_CANONICAL_DOMAIN` per deployment for an explicit canonical origin. If omitted, request origin is used. Each deployment still uses the already validated `SITE_ID`.