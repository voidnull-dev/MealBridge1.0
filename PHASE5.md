# Phase 5 — NGO dashboard preview

Historical phase documentation. Phase 6 now provides live NGO discovery/claims, private pickup storage, updated rules, and a legacy-owner upgrade control. See [PHASE6.md](PHASE6.md) for current deployment and Phase 7 scope.

Serve this folder with `python -m http.server 8080 --bind 127.0.0.1`. Sign in through the existing Google flow, complete NGO onboarding, and follow **NGO Dashboard** to `ngo.html`. The static site has no framework, bundler, package installation, or build step.

## Completed UI

- Collector workspace with organization welcome, four demo metrics, subtle Anime.js entrances/countups, desktop sidebar, mobile drawer, and the existing Dark/Light/System themes.
- Lightweight SVG map placeholder with four area markers. Markers filter fictional cards; there is no map service, geolocation, or coordinate data.
- Four fictional food listings with illustrative photos, provider names/verification/ratings, food type, boxes/meals, distances, readiness, and expiry countdowns. A shared timer updates countdowns without replacing focused controls and pauses work in hidden tabs.
- Functional demo filters for city/area, radius, food type, minimum boxes, pickup timing, urgency, verification, and nearest/expiry/rating ordering. Loading and empty states are included.
- Native listing detail modal with allergen/packing notes, pickup window, general area, and food information. Exact addresses and provider contact details are absent from the demo data and UI.
- Claim buttons show “Food claiming will be activated in the next phase.” Active claims remain empty; the future journey and ETA/contact placeholders are visible. Journey actions show “Coming in next phase.”
- Demo collection history, meals-distributed chart, provider rating summaries, and First Collection, Fast Collector, Community Hero, and 1,000 Meals Distributed achievements.
- Settings display the actual current NGO profile's organization, contact person, phone, city, and verification status. Notification switches are session-only previews. Theme preferences use the existing persistence; sign-out uses existing Firebase Auth.

## Access and data boundary

`ngo-gate.js` listens to Firebase Auth, reads only the signed-in user's existing `users/{uid}` document from the server, validates identity, and requires role `ngo`. Dashboard content is dynamically mounted only after authorization. Hostel/Admin, signed-out, missing-profile, and denied-read states keep the dashboard DOM empty. Logout and session changes remove content and dispose timers/listeners.

This is a UI access gate, not production authorization for future claim operations. Existing own-profile Firestore rules remain necessary. Phase 5 does not modify those rules or add any Firebase listing reads, writes, claim transactions, uploads, rating updates, notification delivery, or administrative capabilities. The provider dashboard retains its existing Phase 4 Firestore/Storage behavior.

## Files created/changed

Created: `ngo.html`, `css/ngo.css`, `js/ngo-bootstrap.js`, `js/ngo-gate.js`, `js/ngo-data.js`, `js/ngo-template.js`, `js/ngo.js`, `tests/ngo.test.mjs`, and this document.

Changed: `index.html`, `css/auth.css`, `js/onboarding.js` (NGO account/success links), `js/dashboard-access.js` (explicit reusable NGO role boundary with the Hostel default preserved), `README.md`, `FIREBASE_SETUP.md`, `PHASE4.md`, and `TEST_RESULTS.md`.

## Verification

29 dependency-free Node tests pass. Isolated browser fixtures verify NGO access, Hostel/Admin denial, own-profile read errors, landing entry, all filters, detail modals, toast-only actions, profile settings, logout, keyboard navigation, and zero NGO writes/Storage requests. Checked 320/390/600/768/1024/1440/1920px across Dark/Light/System: 21 combinations without horizontal overflow. Native dialogs contain focus and restore it on close; mobile navigation traps focus and supports Escape; reduced-motion changes stop animations. No Three.js is loaded by this workspace.

Actual Firebase CDN App/Auth/Firestore initialization and the signed-out NGO gate pass with zero console errors. Existing Google/authentication and provider workflow browser regression suites pass using fixtures. No real Google credentials were entered; live authenticated NGO access still needs acceptance with a real NGO account and deployed own-profile rules. Existing Phase 4 rules/emulator results are documented separately and were not rerun for this UI-only phase.

## Exact recommended Phase 6 scope

Connect **NGO discovery and exact-quantity claims** as one secure workflow:

1. Create a deliberately limited discovery projection containing food, quantities, general area, and timing; exclude exact pickup address and provider contact. Replace demo cards/filters with read-only real-time discovery.
2. Add authenticated server-side claim allocation that verifies the NGO profile, listing availability/readiness/expiry, and requested boxes; use atomic transactions and idempotency to prevent duplicate claims and over-allocation.
3. Add NGO-owned active claim/history reads and real-time provider remaining/claimed counts. Reveal pickup details only to the owner and an authorized claimant through a separate protected record.
4. Deploy narrowly scoped rules and test ownership, foreign-role denial, expired/paused/cancelled listings, duplicate requests, and concurrent claims in emulators and with real accounts.

Defer live maps, en-route/collection completion, ratings, complaints, notification delivery, and Admin Panel to subsequent phases. The map caption remains the requested next-phase placeholder; this recommendation prioritizes the secure claim workflow before map integration.
