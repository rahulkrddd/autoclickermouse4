# Multiwebsite configuration

Change only this folder when adding or configuring website-specific branding.

- `seo/site-a.js`, `seo/site-b.js`, and `seo/site-c.js`: site-specific SEO, site name, keywords, logo and social image paths.
- `logo/`: place `site-a.ico`, `site-b.ico`, `site-c.ico`, and `default.ico` here.
- `redesign/site-a.js`: Site A design.
- `redesign/site-b.js`: Site B design.
- `redesign/site-c.js`: Site C design.
- `public/redesign.js`: fallback design for an unknown or missing site design.
- `public/js/seo.js`: common browser SEO runtime.

Public browser URLs remain unchanged: `/redesign.js`, `/js/seo.js`, and `/logo/...`.
