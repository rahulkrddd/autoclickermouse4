# Excel Backup and Row Actions

## Implemented
- Complete Products, Orders and Coupons field export, including nested values.
- `fullDocumentJson` on every row for lossless field preservation.
- Per-row action dropdown: `ADD`, `UPDATE`, `DELETE`, `SKIP`.
- Safe default is `SKIP`.
- Primary key matching: Products=`legacyId`, Orders=`orderId`, Coupons=`code`.
- ADD rejects existing keys. UPDATE and DELETE reject missing keys.
- Excel upload and destructive reset controls restored in Admin Settings.
- Import result reports added, updated, deleted, skipped and row errors.

## Validation
- `npm run check`: passed.
- New Excel action regression tests: 4/4 passed.
- Existing suite: 76/81 passed. Five pre-existing repository tests fail on unrelated legacy expectations; this change does not modify the asserted invoice/product/upgrade areas.