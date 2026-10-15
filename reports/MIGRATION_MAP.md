# Migration map

- Product `id` -> `products.legacyId` -> `/api/products*`, admin products -> store, product, cart, checkout.
- Product `image`, `gallery`, `specs` -> `primaryImage`, structured `gallery`, `specifications` -> compatibility serializer preserves `image`, URL array and `specs`.
- Order `order_id`, `payment_id`, top-level customer fields -> `orderId`, `paymentId`, `customerSnapshot` -> admin, My Orders, reviews and profile use legacy response projection.
- Order `current_status`, `tracking_*`, feedback fields -> `orderStatus`, `tracking*`, review fields -> existing screens preserved.
- Coupon fields -> normalized `coupons` model -> `/api/coupon` and admin routes.
- Event `id`, `at`, `session` -> `eventId`, `createdAt`, `sessionId` -> analytics and deletion routes.