# Invoice derived-scope fix
- Rewrote invoice generation with explicit source, derived breakup, item snapshots and tax variables.
- Removed all pre-declaration references to `derived` and `itemSnapshots`.
- Legacy COD orders derive missing inclusive-GST values safely.
- New orders preserve already-stored tax and coupon values.
- PDF generation regression tested with coupon and 5% GST.
- npm run check passed; npm test: 87 passed, 0 failed.