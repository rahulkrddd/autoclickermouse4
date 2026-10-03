# Test report

## Executed locally
- JavaScript syntax checks: passed for `app.js` and all files under `config`, `models`, `services`, `scripts`, and `tests`.
- Node unit tests: 12 passed, 0 failed, 0 skipped.

## Not executed locally
Live MongoDB Atlas transaction, Razorpay gateway/webhook, Supabase Storage and browser screenshot regression tests require deployment credentials and network access. They are not reported as passed. Run the documented migration, index and integration checks in the target environment before production cutover.