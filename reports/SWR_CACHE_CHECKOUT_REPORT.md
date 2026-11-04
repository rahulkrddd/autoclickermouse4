# Checkout loader restoration and SWR cache

- Checkout's existing `checkout-loader-pro` markup and animation remain unchanged.
- The global full-page overlay now appears only during initial navigation, not during every fetch, so it no longer covers Buy Now or Proceed to Checkout animation.
- Stale-while-revalidate client cache added for storefront products/settings, product details, cart product availability, reviews, and My Orders.
- Cached content renders immediately when present; a network request still runs and fresh data updates the DOM without reload.
- Public catalog data uses localStorage. Personalized My Orders uses sessionStorage and a mobile-keyed cache.
- Mutations, payment creation, coupon validation, stock changes, admin writes, and checkout operations are never served from cache.

## Verification
- JavaScript syntax checks passed.
- Automated tests: 78 passed, 0 failed.
- Checkout loader-presence and loader-overlap regression tests passed.
- Cache scope and background refresh regression tests passed.