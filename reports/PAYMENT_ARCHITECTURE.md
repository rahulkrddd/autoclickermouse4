# Payment architecture
`gatewayFactory` allow-lists `cashfree` and `razorpay`. Adapters own gateway API calls and signatures. `paymentService` normalizes successful Cashfree attempts and sanitizes audit data. `app.js` owns authoritative pricing and invokes one finalizer for both gateways. Payment has site-scoped provider-neutral references. Browser callbacks are never treated as payment truth.
