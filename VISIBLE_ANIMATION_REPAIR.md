# Visible landing animation repair

## Browser-confirmed causes
- Hero pointer listeners were attached behind the foreground container. Normal mouse movement hit `.film-hero-inner`, leaving the background listener's displacement at 0px.
- The previous hardwareConcurrency < 4 check disabled all Anime.js effects even with reduced motion off. A two-core fixture reproduced this while Anime.js was loaded.
- Sections started fully visible, with small text-only movement. The hero image had brightness/saturation filters, but no entrance blur.
- Anime.js was available and scripts were deferred; those were not the observed failures.

## Exact files
Changed: `index.html` (animation loading only), `js/particle-text.js` (remove the overbroad hardware gate, lower the particle budget on constrained devices).

Added: `js/landing-animations.js`, `css/landing-animations.css`, `VISIBLE_ANIMATION_REPAIR.md`.

The landing loads one animation controller instead of story-motion.js and cinematic-transitions.js. The previous files remain on disk but are not loaded. Copy, order, buttons, Firebase/authentication, verification, dashboards and data files are unchanged, confirmed against pre-edit SHA-256 hashes.

## Executable effects
1. Anime.js hero scale 1.16 to 1 and blur 9px to 0; headline lines rise from Y55 with 180ms stagger; CTAs start at 1450ms, after the headline timing.
2. Anime.js initializes all six sections at opacity 0/Y40 only after confirming the library exists. IntersectionObserver triggers 900ms reveals. Missing-JS/library fallback remains readable.
3. Image-plane wrappers receive perspective(1200px), rotateX, rotateY and translateZ through interpolated RAF transforms. Events attach to the visible hero/scene or editorial figure. Mobile and reduced motion disable pointer depth.
4. Scroll parallax uses cached geometry and interpolated targets: up to 65px desktop or 18px mobile. Image-plane, intro-image and section transforms have separate owners.
5. Journey SVG stroke-dashoffset changes with scroll progress; chapter reveals follow the line.
6. Canvas particles visibly form readable typography. Constrained desktop devices use 1,000 particles instead of disabling formation. Mobile/reduced motion uses semantic static text.
7. Final heading reveals line by line, buttons rise, then the footer fades.

RAF stops after settling, skips offscreen images and pauses for hidden documents/dialogs. Listeners and observers are cleaned up on navigation. Reduced-motion changes restore readable final states immediately. No new animation library, scroll hijacking or layout redesign.

## Browser evidence
Served at http://127.0.0.1:8080/ and tested in Edge/Chromium.

- Hero blur sampled about 8.4px, 0.4px, then 0; CTA opacity sampled 0, 0, then 1.
- Actual hero mouse movement produced about X2.3°/Y3.9° rotation with Z18px. Editorial pointer test produced X−1.2°/Y3.5°, then stopped changing at rest.
- Every section was independently tested from a fresh page: opacity 0 initially, intermediate opacity .13–.49/Y21–35px, then opacity 1/Y0.
- Three editorial images each moved about 29px during 180px scrolls.
- Journey progress advanced .2342 to .9952.
- Canvas pixels changed during particle formation and then settled into readable text.
- Final CTA/footer sequencing passed, including a sampled intermediate footer fade.
- Desktop, mobile, reduced-motion on/off, runtime preference switching, two-core simulation and missing-Anime fallback passed.
- Normal desktop run: zero browser console/page errors.
- Existing 72-state fixture regression passed role routes, registrations, verification workflows, logout, Admin tabs and map-free wizard, with zero axe violations in scanned fixture states. No production account sign-in or writes were performed.

Screenshots: `../animation-proof/hero-start.png`, `hero-settled.png`, `section-settled.png`.

Evidence in workspace `work/`: animation-diagnosis.cjs; visible-animation-test.cjs and visible-animation-results.json; visible-section-test.cjs and visible-section-results.json; visible-depth-test.cjs. Tests inspect computed intermediate states and changing canvas pixels, not only initialization flags.
