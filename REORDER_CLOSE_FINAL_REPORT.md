# Reorder Checkout Close Final Fix

## Exact root cause
`public/orders.html` does not load `public/js/common.js`, while `track()` is defined in `common.js`. On the My Orders reorder checkout, clicking X called `recordAbandonment()` first. That called missing `track()` and threw before the modal removal statement. Homepage checkout works because homepage loads `common.js`.

## Targeted correction
- Kept only the existing X button.
- X now removes `#directCheckoutModal` first.
- Abandonment analytics runs only when `window.track` exists.
- Bound the handler directly to the final rendered checkout X.
- No order, checkout submission, payment, pricing, product, pickup, invoice, admin, database, CSS, or route behavior was modified.

## Verification
- JavaScript syntax check passed.
- Full automated test suite: 156 passed, 0 failed.
- Added regression checks for My Orders not loading common.js, optional analytics, modal removal order, final X binding, and absence of textual Close button.