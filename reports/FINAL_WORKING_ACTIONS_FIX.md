# Final working actions fix

- Invalid reset password now returns a normal validation response, so the modal stays open and displays the error.
- Reset submit handler is attached synchronously and shows a deleting state.
- Bulk Upload Excel directly opens the operating-system file picker. The separate Choose Excel control was removed.
- Excel import uploads the selected workbook to MongoDB and reports imported Products, Orders, Coupons and row errors.
- Excel backup and upload show button loading states.
- COD checkout deducts inventory immediately and records inventoryCommittedAt with idempotent inventory logs.
- Online Razorpay checkout retains its transactional, idempotent stock deduction during payment finalization.
- Order confirmation resolves both MongoDB productId and legacyProductId.

Checks: npm run check passed; npm test passed with 113 tests and zero failures.