# Priority loading delivery

- Admin initial load requests Orders only.
- Remaining tabs load sequentially after Orders finishes.
- Clicking an unloaded tab starts that tab immediately in foreground and shows its loader.
- Existing in-flight work is deduplicated.
- Full page loading overlay is enabled for Admin, My Orders, Reviews and Cart.
- Cache behavior was not changed.

## Verification
- npm run check: passed.
- npm test: 75 passed, 0 failed.
- ZIP integrity: verified.

## External limitation
Live MongoDB Atlas, Razorpay, Supabase, deployed hosting and real-device browser tests were not executed because credentials and external services were unavailable.