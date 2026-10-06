# MealBridge visual redesign — October 6, 2026

## Delivered
- A full-bleed real-food photographic hero, midnight/ivory theme palettes, stronger editorial typography, and clear Hostel/NGO actions.
- Three story scenes: the food-waste problem, the Hostel → MealBridge → NGO connection, and “Waste less. Nourish more.”
- An asymmetric feature bento, with all six existing product features and no invented activity, metrics, listings, or partners.
- Staged hero exposure, image mask, word/blur reveals, highlight pulse, supporting copy, and spring-settled CTAs; scroll reveals, animated connection line, restrained parallax, magnetic buttons, directional arrows, and subtle card tilt/light.
- Crisp particle typography that gathers, responds locally to pointer movement, and dissolves on scroll, with semantic static text as its accessible source.
- Restrained shared dashboard styling: clearer surfaces, spacing, inputs, focus, skeletons, and short transitions. Existing dashboard structures and business behaviors are preserved.

## Changed files
- `index.html`: new landing composition; preserved navigation/authentication hooks; removed old Three.js scene loading.
- `hostel.html`, `ngo.html`, `admin.html`: replace the loaded dream stylesheet with cinema.css; operational markup and scripts unchanged.
- `css/cinema.css` (new): theme tokens, responsive editorial layout, bento, shared operational polish, focus and reduced-motion fallbacks.
- `js/animations.js`: bounded hero/scroll choreography and pointer interactions.
- `js/particle-text.js`: cached glyph masks, irregular particle field, pointer response, scroll dissolution, adaptive/static modes, and cleanup.
- `js/onboarding.js`: action-owned error feedback and retryable SDK transport warm-up.
- `assets/images/food-rescue.jpg` (new): licensed illustrative food photograph.
- `assets/images/PHOTO_CREDITS.md` (new): source, photographer, license, and usage context.
- `DESIGN.md`: documents the replacement visual system.
- `VISUAL_REDESIGN.md` (new): this delivery/verification report.

The previous dream.css and three-scene.js files remain on disk but are no longer loaded by the landing page. No package manager, framework, build step, or new runtime dependency was introduced.

## Startup connection error: cause and repair
Passive Firebase session initialization previously sent background failures into the same toast path used for a current user action. In addition, browser ES-module maps cache failed imports: reproducing an initial offline SDK load showed retries never requested those modules again, even after connectivity returned.

The landing authentication adapter now checks the three Firebase SDK resources with retryable fetches before importing them. It consumes successful responses for browser caching, has a 12-second abort timeout, and memoizes only a successful check. Offline warm-up can therefore retry before poisoning the module map. Returning online retries passive initialization; explicit retry remains available. A connection recovery does not open a popup automatically, preserving the browser's user-gesture requirement. Background profile errors render the existing retry state without opening a modal or displaying an unsolicited toast. Current user-action errors still receive actionable messages.

Firebase initialization, SDK version/configuration, authentication controller, profile repository, verification guards, database/storage rules, data repositories, and transaction logic were not changed. Existing files were compared against SHA-256 hashes captured before this work; only the eight existing files listed above changed. New files are presentation assets/styles/documentation.

## Performance and accessibility
- Desktop particle budget: at most 2,600 particles, 30 rendered frames/second, device-pixel ratio capped at 1.25.
- No continuous idle particle loop. Rendering stops at rest and offscreen, and pauses when the document is hidden or a dialog is open.
- Mobile, reduced-motion, forced-colors, data-saving, and detected low-power devices receive static text; canvas buffers and listeners are cleaned up.
- Native semantic headings, accessible source text, keyboard focus, existing native-dialog behavior, and minimum-size controls remain.
- A local 1920 × 1280 food image is approximately 500 KB. The legacy WebGL orbit/cube scene is not loaded.
- Light and System modes use the same new system. The photo hero retains a dark exposure for readable warm-white type.

## Verification performed
Served the static project at http://127.0.0.1:8080/ with a simple local server and tested in headless Microsoft Edge/Chromium.

- 49/49 existing automated unit tests passed.
- Landing layout: 375, 768, and 1440px widths in Dark, Light, and System; OS theme changes correctly propagated in System mode. Additional 320px check found no horizontal overflow or clipped hero title.
- Landing browser console/page errors: zero. Live Firebase CDN initialization completed with no failed requests in the normal-load pass.
- Accessibility scan: zero axe WCAG A/AA violations in the tested desktop Dark/Light landing states.
- Reduced motion: zero running CSS animations, zero-width particle canvas, visible HTML source text.
- Motion probes verified the hero mask/word movement, bridge connecting → connected, particles gathering → settling → pointer reaction → scroll dissolution, and zero additional frames while idle/offscreen. A two-core fixture disabled rich hero/particle effects.
- SDK outage fixtures verified quiet initial loading, actionable user-triggered errors, successful button retry without reloading, and automatic online recovery without a toast or popup. Passive profile failure remained quiet; explicit profile retry showed the service error.
- Existing regression browser fixtures passed 72 responsive/theme dashboard states plus role routes, pending/rejected/verified gates, both new-role registrations, profile editing, real-time approval/rejection/revocation, logout, Admin tabs, and the map-free wizard. Zero axe violations in those scanned states.

Authentication and write workflows were tested with isolated Firebase adapters, not a real Google account or production writes. This is not a deployment or a fresh security audit. Existing Firebase rules and live data were untouched.

## Review artifacts
The final screenshots are in `../redesign-review/`: desktop-dark.png, desktop-light.png, mobile-dark.png, mobile-light.png, tablet-dark.png, tablet-light.png, problem.png, how-it-works.png, impact.png, features.png, and join.png.

Automation sources/results are in the workspace `work/` directory: film-review.cjs/json, film-motion.cjs/results.json, film-auth-recovery.cjs/results.json, and verification-browser.cjs/results.json (actual regression result file: verification-browser-results.json).

## Photography
Food photo by [LOLA AZIZADA on Unsplash](https://unsplash.com/photos/a-bowl-of-curry-rice-and-pita-bread-LxkWpGMEwlM), used under the [Unsplash License](https://unsplash.com/license). Illustrative photography is not presented as a MealBridge listing or endorsement.
