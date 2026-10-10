# Known limitations

- Live MongoDB Atlas transaction/concurrency, Razorpay webhook, Supabase bucket and Render deployment tests were not executable without production credentials and networked services. They are not reported as passed.
- Browser screenshot comparison was not executed. Existing HTML/CSS structure was preserved and only scoped My Orders styles were appended.
- The existing feedback UI still submits one aggregate rating. The current backend legacy compatibility path still creates the review for the first item; a product-item review selector is not included in this delivery.
- Advanced coupon per-customer redemption enforcement and category/product restriction administration remain schema/service groundwork, not a complete admin UI workflow.
- The admin interface retains its current visual structure. Backend APIs exist for settings, pickup locations, stock adjustment, gallery, manual orders and safe edits, but full visual forms for every new API are not included.
- CSRF tokens were reviewed but not introduced because doing so would require coordinated changes to every existing admin mutation; same-site cookies, admin session protection and rate limits remain in place.