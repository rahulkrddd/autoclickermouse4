BANNER RATIO, BORDER AND CAROUSEL UPDATE
Baseline: mg1p5.txt. Only banner-related code changed.

FEATURES
- Screenshot-inspired approximate 2.06:1 image ratio (35:17).
- Desktop crop/output: 1400 x 680. Mobile crop/output: 1050 x 510.
- Desktop (>700px): up to 2 complete banners. Mobile (<=700px): 1 complete banner.
- Full image uses contain, never cover, on the storefront. Older differently sized images remain visible without clipping, with possible letterboxing. Re-upload/re-crop old images to fill the new ratio exactly.
- Rounded, dotted decorative CSS border; default olive #808000. Per-banner admin color picker with live preview, server validation, database persistence and public API output. Border is not baked into the uploaded image.
- Auto slide every 4 seconds, dots, drag/touch support, pause on hover/focus and respect reduced-motion preference.
- Site-scoped existing publicDataCache reused for stale-while-revalidate. Background metadata refresh every 30 seconds and on return to the tab. Existing long-lived unique-image URL caching retained.
- Admin banner list uses existing session SWR cache and background refresh while the banner tab is open and the editor is closed. Mutations invalidate admin cache and refresh public banner cache.
- Banner images preload before display. Failed images do not leave empty banner slots. Admin displays an image-unavailable message instead of a blank image area.
- Storefront content requests run in parallel, but the initial content reveal waits for banner readiness. A short loading message replaces the blank wait. API failure/no banners releases the page; a 6.5-second fail-safe prevents indefinite blocking if the carousel script fails.

DEPLOYMENT
1. Back up the existing deployment.
2. Prefer the changes-only ZIP. Merge/replace the 7 changed files and add public/js/banner-boot.js, preserving all other files.
3. Redeploy/restart the Node application because the banner model and service changed. No new dependency or manual database reset is needed.
4. Hard refresh (Ctrl+Shift+R).
5. Admin > Banners > Edit/Add: choose border color, crop and save. Existing records default to olive. Re-upload old images if the new ratio should be completely filled.

SOURCE ARCHIVE LIMITATION
The full-source ZIP reconstructs the 259 text files supplied in Repomix, plus the new banner boot script and this report. Repomix excludes binary/ignored files. Keep existing images, uploads, .env, deployment secrets and other excluded assets. Do not delete/reset the existing deployment or database.

TEST SCOPE
Chromium component tests used the actual banner JS, admin banner HTML and CSS with mocked API responses. Additional tests used actual index.html and all its linked styles, with unrelated application scripts disabled. The supplied screenshot was used only as a local test image, not added to the website. Service tests used actual Sharp image optimization with database/storage dependencies stubbed. Live MongoDB, Supabase upload/delete, login, checkout and payment end-to-end were not exercised.

CHANGED FILES
models/Banner.js
public/css/banners.css
public/js/admin-banners.js
public/js/home-banners.js
public/admin.html
public/index.html
services/bannerService.js

ADDED FILES
public/js/banner-boot.js

BROWSER RESULTS
Viewport 1280px: 2 full banner(s), 35:17 image, contain, selected border, no page overflow
Automatic slide advances after 4 seconds
Dots and existing banner search action work
Viewport 701px: 2 full banner(s), 35:17 image, contain, selected border, no page overflow
Viewport 700px: 1 full banner(s), 35:17 image, contain, selected border, no page overflow
Viewport 390px: 1 full banner(s), 35:17 image, contain, selected border, no page overflow
Viewport 320px: 1 full banner(s), 35:17 image, contain, selected border, no page overflow
No banners: no empty slider slot; storefront revealed
Broken images: hidden rather than blank; storefront revealed
API failure: storefront unblocked
Cached banners remain visible when refresh API fails
Background refresh updates color/list; single banner hides dots
Admin edit restores color; live color preview; desktop crop 1400x680; save includes color and cropped image
Admin mobile crop 1050x510 matches desktop 35:17 ratio

PAGE INTEGRATION RESULTS
Actual index.html with all existing linked CSS at 1280px: 2 complete banners, image fits frame, no JavaScript errors
Actual index.html with all existing linked CSS at 390px: 1 complete banners, image fits frame, no JavaScript errors
Banner boot releases after 6.5 seconds if carousel script fails

SERVICE RESULTS
Color validation/default/normalization, site override rejection, public color output, expiry filtering and actual WebP optimization dimensions passed.

SYNTAX
All 113 JavaScript files passed node --check.
