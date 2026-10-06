# Landing editorial redesign

Completed October 6, 2026. Served and verified at http://127.0.0.1:8080/.

## Visual/content changes
- Preserved the full-screen food hero, headline, dark overlay, emerald emphasis and Hostel/NGO actions; slightly integrated the desktop photo exposure with the copy.
- Removed the promise strip, six-feature bento, separate listings promotion and closing role-picker panel.
- Added the supplied human-problem copy directly after the hero, with an open photo/detail composition.
- Added Share / Match / Carry chapters, different image crops, alternating desktop compositions and one continuous scroll-drawn line. Mobile follows a vertical reading path.
- Added the calm verification scene and Agra-first section with abstract local contour/architectural line work, without interactive maps or location pins.
- Retained one particle-text moment after the Agra section and added the supplied supporting sentence.
- Added the photographic closing invitation with direct Register as a Hostel / Register as an NGO actions and the verification note.
- Replaced bouncy/tilting landing animation with slower line reveals, blur-to-focus, bounded image parallax and short CTA entrances. Content remains available without animation.

## Files
Changed: index.html, js/main.js, DESIGN.md.
Added: css/story.css, js/story-motion.js, LANDING_STORY_REDESIGN.md.

main.js only loses the obsolete closing role-picker UI synchronization. Both new registration links use the existing data-auth-open/data-role onboarding interface. Authentication and profile code is unchanged.

All existing files were compared with pre-edit SHA-256 hashes. No dashboard HTML, shared CSS, Firebase configuration, authentication code, verification gate, rules, listing/claim repositories, or other backend behavior changed. The existing photograph and particle implementation were reused. No fake statistics, reviews, partners or demo data were introduced.

## Verification
- Nine viewport/theme combinations: desktop 1440, tablet 768, mobile 375 × Dark, Light and System. All six story sections checked for horizontal overflow; additional 320px and reduced-motion checks passed.
- System preference followed OS color-scheme changes.
- Normal-load browser console/page errors: zero. Desktop Dark/Light axe scans: zero WCAG A/AA violations detected.
- Hero reveal, scroll-driven journey progress, particle gathering → settling → pointer reaction and reduced-motion static fallback passed automated browser probes.
- Mobile/reduced-motion particle canvas disabled; reduced-motion check found zero running CSS animations.
- Registration dialog open/Escape close and footer disclosure controls passed.
- Existing regression fixture suite passed 72 dashboard/theme states, role routing, both new-user registrations, verification/profile workflows, live approval/rejection/revocation, logout, Admin tabs and map-free wizard. Zero axe violations in scanned fixture states.
- Existing production Firebase modules loaded normally. Account/transaction workflows used isolated test adapters; no real Google account sign-in, production writes or deployment was performed.

An initial test attempt encountered environment network restrictions; network access was then granted and the successful verification above reran. A test's immediate System-theme assertion was corrected to wait for the asynchronous OS media-change event; no theme code change was needed.

## Screenshots
Final captures are in ../story-review/:
- desktop-dark.png, desktop-light.png
- tablet-dark.png, tablet-light.png
- mobile-dark.png, mobile-light.png
- desktop/tablet/mobile variants of problem, how-it-works, features (verification scene), agra, impact, and join.

Browser scripts and results are in the workspace work directory: story-review.cjs/json, story-motion.cjs and verification-browser.cjs/results. Photography attribution remains in assets/images/PHOTO_CREDITS.md.
