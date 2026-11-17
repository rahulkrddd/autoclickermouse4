# SEO, Social Sharing and Site Branding Fix

## Changed files
- `app.js`: server-renders site-specific SEO and branding for public HTML routes; removes the shared AutoClickerMouse startup label.
- `services/seoPageService.js`: adds shared server-side HTML metadata, canonical, Open Graph, Twitter, favicon, Organization JSON-LD and site-brand injection while preserving product SEO.
- `multiwebsite/seo/default.js`: adds neutral fallback branding fields.
- `multiwebsite/seo/site-a.js`: keeps Auto Clicker Mouse branding isolated to site-a.
- `multiwebsite/seo/site-b.js`: configures Manna's Gifting, its deployed canonical domain, search/footer branding and homepage title.
- `multiwebsite/seo/site-c.js`: keeps MyEcomm branding isolated to site-c.
- `multiwebsite/redesign/site-b.js`: aligns browser-visible site-b branding with Manna's Gifting.
- `public/index.html`: replaces shared AutoClickerMouse fallback text with neutral placeholders; server output supplies active SITE_ID branding.

## Verification
- SITE_ID mapping confirmed from existing project: site-a = Auto Clicker Mouse, site-b = Manna's Gifting, site-c = MyEcomm.
- Site-b homepage initial HTML contains Manna's Gifting title, description, canonical, Open Graph, Twitter, absolute image URL and favicon before JavaScript runs.
- `?v=2` does not enter the canonical or `og:url`; the canonical remains the clean deployed homepage URL.
- Site-b generated initial HTML contains neither `AutoClickerMouse` nor `AutoClickMouse`.
- AutoClickerMouse references remain only where legitimate for site-a-specific content, product/sample data, historical reports, or unrelated business defaults outside this strictly limited change.
