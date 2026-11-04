# Current known limitations

This file supersedes the pre-hardening limitations report. See START_HERE.md for detailed behavior and deployment instructions.

- Mobile OTP/customer authentication, public review-order privacy, and invoice access ownership remain unchanged by request.
- Feedback tokens are scoped capabilities, not proof of mobile possession, because the existing mobile order lookup remains accessible.
- Legacy numeric admin password remains supported until the owner configures a hash or configured accounts. MFA is not implemented.
- CSP is compatibility-enforced, not a strict nonce-based policy; existing inline scripts and event handlers remain allowed.
- Recovery archives are signed, not encrypted; they contain sensitive site records. They are capped at 100 MB and cover declared site collections plus managed site-namespace images, not remote external image binaries, source, credentials or sessions.
- Recovery requires the same site ID, bucket, and signing secret. Missing or out-of-namespace managed images block backup. Copy original .ico files from the source repository before deployment.
- MongoDB transactions require a replica set. External database scripts are not coordinated by the application's maintenance lock.
- Legacy pre-upgrade payments may require manual reconciliation. Late captured payments after hold expiry may require stock or refund review.
- Refund review/recording is an admin workflow only; it does not execute a gateway refund. Only record a full refund after it has actually completed externally.
- Catalog requests are paginated, but existing client-side search/filter consumers still eventually load the full catalog. Large catalogs need a later server-side search/filter redesign.
- Excel is a transactional edit workbook, not a full disaster-recovery archive. Orders are exported for reference but are not restored by Excel import.
- Actual seller/contact values must be supplied by the owner in Store Settings; they were not invented.
- Dependency installation and full application boot were not completed in this environment. No verified lockfile is included.
- Live database, storage, payment, deployment and new AST-audit acceptance remain outstanding. See RELEASE_STATUS.md and the current HARDENING reports.