# Dynamic multi-site redesign

The browser always loads `/redesign.js`. The Express route reads the already validated `SITE_ID` and serves `public/Redesign.<SITE_ID>.js` when that exact file exists. Otherwise it serves `public/redesign.js`.

Examples:
- `SITE_ID=site-a` selects `public/Redesign.site-a.js`
- `SITE_ID=site-b` selects `public/Redesign.site-b.js`

To create a site theme, copy `public/redesign.js` or one of the `.example.js` templates to the exact filename above, then edit only its `TEXT` and `DESIGN` objects. The legacy `/WEBSITE_DESIGN.js` URL remains a compatibility alias.

The design file controls shared wording, colors, typography, layout, grid columns, spacing, radii, shadows, transitions, navigation behavior, card images, focus states, reduced-motion behavior, language, direction and favicon. It does not call business APIs or write browser storage.