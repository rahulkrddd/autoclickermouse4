# Status update runtime fix

Release marker: STATUS-UPDATE-FIX-2026-11-01-02

- Removed out-of-scope order variable from post-transaction response.
- Unexpected runtime/programming errors return HTTP 500, not misleading HTTP 409.
- Explicit business conflict errors keep their explicitly assigned HTTP status.
- Backend logs orderId, requested status and stack trace for any remaining failure.
- Node process must be restarted after deployment because app.js is server-side code.