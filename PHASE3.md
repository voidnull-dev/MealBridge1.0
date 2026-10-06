# Hostel dashboard UI

Historical Phase 3 scope. Phase 4 replaces demo food cards and wizard actions with Firestore/Storage operations; see [PHASE4.md](PHASE4.md) for current behavior.

Serve this directory through the existing simple local server. Sign in and onboard as Hostel / Food Provider on `index.html`, then use **Hostel Dashboard** in the account navigation or **Open Hostel Dashboard** in the success dialog. `hostel.html` also supports direct navigation, with an access screen until authentication and a server-read Hostel profile are confirmed.

## Scope completed

- Five overview metrics, subtle Anime.js entries/count-up, quick surplus action, and illustrative pickup schedule.
- Six demo listings cover Available, Partially Claimed, Claimed, Collected, and Expired. Cards show type, available/total and claimed boxes, urgency/countdown, and a four-stage pickup tracker. Search, filters, edit preview, pause/resume, cancellation confirmation, and reset operate in memory only.
- Three-step modal collects food, packing, allergens, hygiene confirmation, quantity, readiness/expiry, location, contact, and notes. Required fields and chronological times are validated; quantity and expiry previews update live. The image control is only a placeholder. Publish shows the requested next-phase message without changing any listing or Firestore document.
- Monthly demo impact chart with Meals/CO₂ switch and accessible textual values, impact totals, collection history, and three achievement badges.
- Profile/settings panel distinguishes real account identity/verification from demo organization/contact/location/preferences. Demo changes last only in the current page. Theme preference uses the existing persistent Dark/Light/System API; sign-out uses existing Firebase Auth.

## Files

Created: `hostel.html`, `css/dashboard.css`, `js/dashboard-bootstrap.js`, `js/dashboard-access.js`, `js/dashboard-gate.js`, `js/dashboard-data.js`, `js/dashboard-template.js`, `js/dashboard.js`, `tests/dashboard.test.mjs`, and this guide.

Changed: `index.html`, `css/auth.css`, and `js/onboarding.js` for Hostel-only entry links and success copy; `README.md` and `TEST_RESULTS.md` for scope/verification documentation. Landing layout, theme engine, Firebase initialization, authentication controller, profile repository, and Firestore rules are preserved.

## Accessibility and performance

Responsive sidebar becomes a mobile drawer with inert background, focus containment, Escape close, and focus return. Stats wrap and listing rows become labeled cards. Native dialogs provide modal focus containment and scroll on small screens; inputs retain readable 16px text. Sections, headings, labels, keyboard focus, status announcements, empty states, loading/retry gates, and tooltip descriptions are provided. Reduced motion skips animations and finishes in-flight effects. A single one-minute countdown timer avoids hidden-tab work and updates listing text in place to preserve focus. No dashboard WebGL, uploads, or continuous animation loops are used.

## Access and Firebase deployment

The dashboard uses the existing singleton Firebase SDK and server-only own-profile read. It renders content only for a verified Google identity whose matching stored profile has role `hostel`. Logout clears the dashboard DOM and invalidates pending reads; browser history restoration rechecks access. It never creates a profile. Missing-profile users return to onboarding; NGO/Admin users see the access message.

This client-side UI gate cannot protect future backend food data by itself. Deploy and validate the existing own-profile `firestore.rules` to permit the Phase 2 profile read. No new Firebase collections or rules are required for this demo UI. Future provider listing data needs explicit server-enforced ownership/role rules; admin privileges still require trusted Custom Claims. No rules were deployed in this session.

## Exact recommended Phase 4 scope

Connect **only the Food Provider listing workflow**: create validated food listing documents, upload validated images to owner-scoped Firebase Storage paths, read the provider's own listings, and persist edits/pause/resume/cancel with server timestamps and clear loading/error/retry states. Define the listing schema and permitted state transitions, validate quantities and chronological pickup/expiry fields, and protect immutable owner identity. Add Firestore/Storage rules that require authenticated Hostel ownership, deny role escalation, and test access and invalid input in emulators before deployment. Define expiry enforcement and cleanup so an expired listing cannot remain actionable merely because the client clock is wrong.

Defer NGO browsing/claims, allocation transactions, maps, Admin Panel, ratings, and notifications. Preserve the existing landing, onboarding, themes, and dashboard design.
