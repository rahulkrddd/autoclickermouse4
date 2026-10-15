# Final fixes
- Coupon create/update confirmation toast.
- Product, coupon and pickup Active/Inactive labels are buttons with optimistic UI, database PATCH, rollback and confirmation.
- Checkout validated activity stores valid customer name, mobile and selected product references.
- Activity type/search filters and immediate bulk-delete UI removal.
- Coupon is soft-deactivated.
- GST-inclusive pricing: coupon allocated proportionately, taxable value and included GST extracted after discount.
- Invoice and My Orders show gross, coupon, taxable value, included GST, shipping and grand total.
- Existing orders derive missing tax breakup dynamically; home/admin product prices remain unchanged.

Validation: npm run check passed; npm test 84 passed, 0 failed.