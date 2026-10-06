# MealBridge — cinematic visual refinement

The landing page now uses a midnight navy and emerald atmosphere with restrained teal, violet and blue light, a tiny warm-gold detail, and a static grain texture. Light and System themes retain their own readable surfaces. Shared dashboard controls inherit the new material tokens without changes to workspace layout or behavior.

## Files changed

- `index.html`: scoped landing class, decorative atmosphere, semantic editorial scenes, particle canvas, loader wordmark, heading hooks, and “Enter the impact” scroll cue. Existing CTA attributes and destinations are preserved. Removed decorative partner initials and replaced the leftover “24 meals” label with “Surplus to support.” No metrics, testimonials, listings, or other fake data were added.
- `hostel.html`, `ngo.html`, `admin.html`: added the shared `css/dream.css` stylesheet only; application scripts and markup are otherwise preserved.
- `js/animations.js`: reusable Anime.js character, word and line reveals; blur/fade/mask entrances; one-time loader; limited magnetic CTA response, click light ripple, card reflection/tilt, and scroll depth.
- `js/three-scene.js`: a single low-power hero renderer with sparse stars and three floating wireframe food-box forms; local Three.js asset reuse and lifecycle safeguards.
- `css/dream.css` (new): theme/material/motion tokens, hero and editorial refinement, quiet shared controls/dialogs/toasts, responsive and accessibility safeguards.
- `js/particle-text.js` (new): the “Waste less. Nourish more.” Canvas phrase, gathering and re-forming on hover or scroll.
- `assets/images/dream-grain.png` (new): small deterministic static texture; no runtime noise generation.
- `CINEMATIC_REFINEMENT.md` (new): this report.

## Animation and performance

- Original semantic headings are preserved; animated visual copies are `aria-hidden`. The accessibility snapshot reports one complete H1: “Turn Leftover Meals into Impact.”
- The decorative particle phrase retains its complete, unsplit HTML text. Static text is shown on mobile, reduced-motion, forced-colors, low-memory and low-core devices, and if Canvas is unavailable.
- Three.js is disabled below 1024px, with reduced motion, forced colors, Save-Data, less than 4 GB reported device memory, or fewer than 4 reported CPU cores. The renderer uses a maximum 1.25 pixel ratio, shared geometry and no textures/postprocessing; renders are capped at 20 fps.
- Particle text is capped at 2,200 particles and 24 fps; the checked desktop view used 1,354 particles. Rendering stops completely when the phrase settles. Hover/scroll starts a bounded re-forming animation.
- Canvas/WebGL motion pauses offscreen, with hidden documents, or while a dialog is open. WebGL resources are disposed when eligibility is lost. Reduced-motion changes also finish active text entrances.
- The aurora, floating light and mist use lightweight gradient layers. Ambient motion is limited to capable desktops and stops while forms are open. Grain is static.
- Pointer updates are scheduled once per animation frame. Card movement and magnetic hover are restricted to landing-page content and fine pointers.
- Navigation is never intercepted or delayed. A brief entry-only fade/focus replaces cross-document view transitions, which produced a browser warning in the route regression test.
- Loader is pointer-transparent, dismisses on keyboard/pointer input, has a CSS fallback, and is skipped after the first visit in a session or for reduced motion/low-power devices.

## Verification

Served with Python’s standard local HTTP server at `http://127.0.0.1:8080/` and tested in Chromium/Edge.

- Landing page: mobile 375px, tablet 768px, laptop 1366px, desktop 1920px; Dark, Light and System themes. System followed both light and dark OS settings. Additional 320px overflow check passed.
- No horizontal overflow in the final viewport matrix.
- Live Firebase CDN initialization: no failed requests, JavaScript exceptions or console errors in the final run. No live Google account sign-in or production database mutation was performed.
- Keyboard navigation menu, Escape dismissal, auth modal opening and focus return passed.
- Automated accessibility scans: zero reported WCAG A/AA violations in the tested landing themes and the existing dashboard/verification fixture suite. Automated scans do not replace a full assistive-technology audit.
- Existing unit suite: **49 passed**.
- Existing browser regression suite: **72 responsive/theme states passed**, including role restrictions, pending/rejected/verified profiles, onboarding, logout, approval/revocation, admin tabs and the map-free wizard. These flows use isolated Firebase fixtures, never production writes.
- Reduced-motion, low-power and JavaScript-disabled fallbacks passed. No Three.js module request on these fallback paths; static text remained visible.
- Hero performance probe: 72 WebGL draw calls in one second (four calls per rendered scene, within the 20 fps cap). Zero draw calls while offscreen or a dialog was open. Live reduced-motion toggling disposed and hid the scene; restoring motion recreated it.
- Settled particle text issued zero Canvas draw calls during the idle probe; hovering resumed the bounded animation.
- SHA-256 comparison confirms every pre-existing file outside the four HTML entry points and the two presentation scripts is unchanged. Firebase configuration, authentication, Firestore/Storage rules, verification, dashboard logic, listings, claims, ratings, notifications, service-region restrictions, data structures, and theme persistence logic are unchanged.

## Screenshots

Saved beside the project in `../visual-review/`: mobile/tablet/laptop/desktop dark and light captures, `mobile-hero.png`, `editorial-desktop.png`, `particle-desktop.png`, `features-desktop.png`, and `auth-dark.png`.

## Recommended next visual phase

Validate on physical low-end Android and iOS Safari devices, then tune the motion budget from those measurements. If authentic, consented Agra partner photography becomes available, use it to replace generic editorial imagery without inventing impact claims or changing platform behavior.
