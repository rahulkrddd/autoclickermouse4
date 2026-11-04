# Rollback
1. Export the current MongoDB database.
2. Stop the upgraded Render service.
3. Redeploy the untouched original project.
4. Do not run JSON migration again and do not drop collections.
5. Additive collections (`invoices`, `counters`, `coupon_redemptions`) may remain; the original app ignores them.