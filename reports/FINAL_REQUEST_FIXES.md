# Final requested admin and invoice fixes

- Invoice PDF layout rewritten with wrapped seller/customer addresses, two-line product names, safer numeric columns, page overflow handling, totals alignment and terms wrapping.
- Admin invoice download now uses a fetched PDF blob and temporary download link, so the page does not navigate or remain in the global loading state.
- Product, coupon and pickup Show inactive switches filter rendered cards immediately using explicit card state.
- Activity view now exposes only checkout abandonment and payment failure, stores abandonment only after valid name/mobile are available, carries product IDs/names, and includes a Details action.
- Dashboard Orders, Revenue, Pending, Delivered and Products cards are keyboard-accessible navigation/filter controls.

## Verification
- `npm run check`: passed.
- `npm test`: 92 passed, 0 failed.
- ZIP integrity verified.

## External limitations
MongoDB Atlas, Razorpay, Supabase and production browser sessions were not available, so those external integrations were not claimed as live-tested.