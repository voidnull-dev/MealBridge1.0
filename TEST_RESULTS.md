# MealBridge verification — 4 October 2026

## Current verification / real-data update

[VERIFICATION_GATE.md](VERIFICATION_GATE.md) supersedes older phase instructions: 49 unit tests, 172 Firestore/Storage emulator assertions, 72 responsive/theme states and zero console/map requests/axe violations. Maps are disabled; new partners are pending until Admin approval. Deploy the updated Firestore rules/indexes and Storage rules with the frontend. No production deployment or real-account OAuth acceptance was performed. Earlier sections below are historical; do not follow their map activation or demo/access descriptions for this release.


## Current Agra update

See [AGRA_UPDATE.md](AGRA_UPDATE.md) for the current coverage/registration contract, public organization collection, index/rules activation and dry-run-first migration instructions. Current acceptance: 47 unit tests, 107 emulator assertions and 48 responsive/theme cases; four directory axe scans have zero violations. The earlier phase results below are historical. Updated rules/indexes and migration have not been deployed or run on production.


## Phase 10 final verification

**42 Node tests, 391 isolated real-SDK emulator assertions, 180 responsive/theme cases and 12 role-route combinations pass. Thirty axe scans report zero findings; successful paths show zero app console errors.** Auth/provider/NGO/admin/engagement regressions pass, as do additional validation, duplicate submission, cleanup and forced-colour keyboard checks. Local Hosting tests verify CSP/security headers, the actual CLI-selected 61-file static payload and 404 exclusions. Real Firebase CDN singleton initialization passes under Hosting CSP. See [PHASE10.md](PHASE10.md) for the test matrix, environment and exact limits.

No live Google account completion, production writes, rule/index deployment or Hosting release was performed. Automated Chromium/fixture/emulator acceptance does not replace production, Safari/Firefox, live tiles, real touch devices or human assistive-technology acceptance. Earlier results below are historical; Phase 10 supersedes the totals and notification admin exception.


## Phase 9 maps and location privacy

- **41/41 Node tests and 388 real-SDK emulator assertions pass**: 44 new coordinate/privacy assertions plus all 344 previous provider/Storage/claims/admin/ratings/inbox assertions. Repository creates/edits real isolated schema-3 public/private documents; no production data is touched.
- Browser SDK fixtures pass real Leaflet grouped public pins/attribution, explicit cached/deduplicated ≥1-second search, keyboard popups, geolocation denial/success and origin non-persistence, Haversine/radius/nearest filtering, cards and pins together, active claim→OSRM route/ETA/polyline/navigation, service errors/retry and cancellation revocation, provider draggable/manual pin saves, CDN failure/retry/singleton, logout cleanup and live System/reduced-motion changes.
- **36 new viewport/theme combinations** pass (map/route/wizard × 320/390/768/1440px × Dark/Light/System). No overflow; batched visual inspection and one confirmation. Existing provider (15), NGO (21), Admin (21) and auth browser regressions pass. Normal paths have no app console errors; intentional failed-CDN/503 tests produce handled browser network diagnostics.
- Local Python server port 8080 serves the static project. Live Leaflet 1.9.4 and Firebase CDN singleton initialization pass. One live Nominatim Pune search returned two results; one live OSRM public-coordinate route returned 2.9565 km / 4 min / 163 line points. Repeat UI testing substitutes tiles/APIs to avoid load on shared services. Live OSM tile rendering remains manual acceptance.
- No actual Google account sign-in, production listing/profile/claim writes, rule/index deployment, hosting activation, Functions, push or heatmaps were performed. See [PHASE9.md](PHASE9.md) for exact changed files and production acceptance, including the aggregate Nominatim limiter limitation.

Earlier sections are historical phase boundaries superseded by Phase 9 where stated.

## Phase 8 ratings and in-app notifications

- **37/37 Node tests pass; 344 real-SDK emulator assertions pass**: 105 Phase 8 end-to-end rating/event/privacy/read-status tests plus 77 claim, 64 provider Firestore/Storage and 98 admin regressions. All run against demo-mealbridge, never production.
- Actual browser DOM/repository fixtures pass a completed collection and automatic NGO rating, real Hostel history/rating, submitted/duplicate states, public score average/count/New Partner, private text feedback, received/admin reviews, current-recipient updates, individual/all read, permission failures/recovery and zero subscriptions after logout.
- **24 new rating/inbox viewport-theme combinations pass**, 320/390/768/1440px × Dark/Light/System, without overflow or app console errors. Keyboard radio arrows, Escape/focus, live System changes and reduced-motion changes pass. Batched desktop/mobile visual inspection and one confirmation completed.
- Existing provider (15 combinations), NGO (21), admin (21) and authentication browser regressions pass, adapted for the persistent Phase 8 inbox/rating/history streams. Real Firebase CDN initialization/singleton/Google provider and signed-out gate pass on the local server.
- **No production Google sign-in, writes, rule publication, deployment, Cloud Functions, maps or push were performed.** Production acceptance remains manual. Client events are source-paired but can be omitted by modified/old clients; trusted generation is the Phase 9 recommendation. See [PHASE8.md](PHASE8.md) for details.

Earlier phase entries describe historical boundaries superseded by this phase where noted.

## Phase 7 Admin verification

- **35/35 Node tests pass**. **239 emulator assertions pass**: 98 admin authorization, verification/private notes/projection, moderation immutability, claims read-only and append-only activity; 77 claim/privacy/concurrency regressions; 64 provider Firestore/Storage regressions.
- Actual admin DOM/repositories tested with isolated browser Firebase fixtures: gates/redirect, pending snapshots, approve/reject and directory updates, notes privacy, listing pause/resume/cancel and failure retry, read-only claims, real distributions/activity, mobile drawer, dialog focus and logout/listener disposal.
- **21 Admin viewport/theme combinations pass**, 320–1920px × Dark/Light/System, no horizontal overflow or app console errors. Additional table/chart panels checked at 320/768/1440px; live System preference and collection retry pass. Visual review corrected mobile dialog heading clearance.
- Existing provider, NGO and authentication browser regression suites pass. Real Firebase CDN initialization/singleton/Google provider and signed-out admin gate pass through the local static server. No frontend build exists.
- Production Google sign-in as the actual administrator, deployed rules and live Firestore writes were **not performed**. Browser auth scenarios use fixtures; data/security tests use demo-mealbridge emulators. Complete the manual acceptance steps in [PHASE7.md](PHASE7.md).

Earlier entries below describe their historical phase boundaries. Phase 7 adds the narrowly authorized admin capabilities described above.

## Phase 6 live discovery and claim verification

- **32/32 dependency-free Node tests pass** (`node --test tests/*.test.mjs`): existing authentication/provider tests, real discovery and filters/sorts, exact integer/ETA/note validation, identity/role gates, and public/private listing separation.
- **77 Phase 6 emulator assertions pass** using the shipped repositories and real Firebase SDK: public schema-v2 reads, private denial before claim, exact allocation/counter/status updates, own claims listeners, private access after valid claim, foreign denial, duplicate/invalid/overclaim prevention, concurrent competing claims, progress/collection counters, private revocation on completion/cancellation, forged status/counter/field writes, role/query/expiry/pause/full-listing boundaries, legacy isolation/migration, and provider editing/regression.
- **64 provider Firestore/Storage emulator assertions pass again**, adapted for the private schema: real creation with/without image, image URL/path and replacement, listener updates, edit, pause/resume, cancellation, Storage ownership/type/size/overwrite restrictions, and negative listing/schema/access checks. Tests use only `demo-mealbridge`; no production services are used. Test SDK is 12.19.0; runtime CDN remains 12.4.0 and was checked separately. Expected denied-write/runtime diagnostics and Java deprecation warnings occurred in emulator logs; positive operations and both test scripts exit successfully.
- Browser Firebase fixtures exercise the actual NGO DOM/repositories: role denial for Hostel/Admin/signed-out, real-style snapshots/filtering, absence of exact/private details before claim, quantity selection/transaction payload, matching private details after claim, En Route/Collected updates, private DOM clearing after collection, disabled duplicate claims, live pause/full allocation removal, error/retry preserving input, focus return, and zero listeners in settings/after logout.
- **21 NGO theme/viewport combinations pass**: 320/390/600/768/1024/1440/1920px in Dark/Light/System with no horizontal overflow. Inspected desktop/tablet/mobile discovery, claim modals, and active claims. Native dialogs scroll on mobile. Keyboard/reduced-motion/theme behavior is retained; NGO loads no Three.js. Browser fixture checks report zero app console errors.
- Existing provider browser regression suite passes again (15 theme/viewport combinations, uploads, edit/image removal, pause/resume/cancel, publishing, failures, logout). Existing authentication/onboarding browser suite passes again. Landing structure, auth configuration/controllers, theme/animation files, and Storage rules are unchanged.
- The site runs through the simple local server on port 8080. Real Firebase CDN initialization/singleton App/Google provider and the signed-out NGO gate pass without console errors or Storage requests. No frontend compilation/build exists.

**Production acceptance remains pending:** deploy updated Firestore rules and the discovery index, publish refreshed static files, upgrade legacy owner listings, then test actual separate Hostel/NGO Google accounts. No credentials, production listing/claim writes, uploads, rules/index deployments, billing changes, or automated Cloud Functions were performed. Browser fixtures do not prove production Google authentication or configuration; emulators separately verify the real transaction/rule behavior. Console and acceptance steps are in [PHASE6.md](PHASE6.md).

Reproduce emulator tests with external test tooling as described in [PHASE4.md](PHASE4.md), running `node tests/claims-emulator.mjs && node tests/security-emulator.mjs` inside `emulators:exec --project demo-mealbridge --config firebase.emulators.json --only firestore,storage`. The shipped test files require `MEALBRIDGE_TEST_TOOLS`; packages stay outside the static site.

Earlier results below are historical phase boundaries.

## Phase 5 NGO UI verification

- Served the existing static project through the simple local server at `http://127.0.0.1:8080/`. Real Firebase 12.4.0 CDN App/Auth/Firestore initialization, singleton App, Google provider, and the signed-out NGO gate pass with zero console errors and no Storage request. No credentials, production writes, uploads, or deployments were performed.
- **29/29 dependency-free Node tests pass** (`node --test tests/*.test.mjs`). NGO tests cover identity/role boundaries, every demo filter/sort, immutable demo input, and absence of exact addresses/provider contacts/coordinates. Existing auth/provider tests remain passing.
- Browser fixtures pass NGO landing entry and dashboard rendering from the matching server profile. Hostel/Admin, signed-out, missing-profile, and denied-read states retain an empty NGO dashboard DOM. Logout removes content. These role flows use isolated Firebase SDK fixtures, not completed real Google sign-ins.
- **21 theme/viewport combinations pass**: 320/390/600/768/1024/1440/1920px in Dark/Light/System, with no horizontal overflow. Inspected desktop/tablet/mobile, filter drawer, listing details, and settings. Corrected the mobile metric grid, full-width filter drawer, and close-button heading spacing; the confirmation batch passes.
- Passed location/urgency filtering, all filter/sort unit cases, reset/empty states, map marker demo filtering, general-area-only listing details, exact claim/coming-phase toast messages, history/achievements, real-profile settings rendering, mobile navigation, Escape/focus return, and native dialog scrolling. System OS theme changes and mid-session reduced-motion changes pass.
- NGO browser checks issue **zero Firebase writes and zero Storage requests**, with zero app console errors. No map SDK, geolocation, real claim allocation, ratings writes, notifications, or Admin Panel is present. Dashboard does not load Three.js.
- Existing Google authentication/onboarding browser regression suite and Phase 4 provider workflow browser suite pass again with their isolated fixtures. Phase 4's prior emulator results remain valid historical results; rules and provider repositories are unchanged, so emulator tests were not rerun for Phase 5.

Live authenticated NGO acceptance remains pending: use a real Google NGO account and deployed own-profile rules to confirm access, profile details, and logout, then check Hostel/Admin denial. No production configuration or actual account sign-in was verified by the fixture flows. Phase 5 requires no additional Firebase deployment beyond the existing profile access rules.

## Phase 4 listing verification

- Served the static project on `http://127.0.0.1:8080/`. Real CDN Firebase SDK initialization passes with no browser console errors; App/Auth and lazy Storage each reuse the shared App. No live Google credentials were entered and no production writes, uploads, billing changes, or rules deployments were performed.
- **26/26 dependency-free Node tests pass** (`node --test tests/*.test.mjs`): prior authentication/profile/gate tests plus listing/image validation, derived owner fields and quantities, server timestamps, upload progress, failure cleanup, edit/pause/resume/cancel, stale-edit conflict, role/session/ownership checks, owner-scoped newest-first listener, and image URL/status protection.
- **64 Firestore/Storage emulator assertions pass** using the real Firebase SDK and shipped listing repository. Confirmed actual emulator documents/images, creation with and without a photo, matching owner-scoped URL/path, listener updates, edit/image replacement, pause/resume, cancellation, and negative access/schema/expiry tests. Rules compile and reject foreign Hostel, NGO, Admin, signed-out access, ownership/counter changes, unsupported/oversized uploads, and overwrites. The harness uses only `demo-mealbridge`. Emulator SDK was 12.19.0; runtime CDN remains pinned to 12.4.0 and was checked separately.
- Browser fixtures pass the actual wizard/card DOM: empty state, photo preview, publishing with/without an image, URL/schema, real-time callback rendering, edit/remove image, pause/resume, cancellation, expired status, load/upload/write error recovery preserving form details, mobile publishing, and logout. These browser Firebase modules are isolated fixtures; emulator tests separately exercise real service operations.
- Checked 320/390/768/1024/1440px in Dark/Light/System (15 combinations) without horizontal overflow. Inspected desktop/tablet/mobile listing screens and mobile wizard. Existing System theme/reduced-motion support remains intact; dashboard loads no Three.js. No app console errors occurred in these browser checks.
- Existing authentication browser regression suite passes again: onboarding, returning profile, admin badge, logout, popup-block/cancellation feedback, validation/retry, themes, and mobile layouts. Landing structure, CSS, animation/theme files, Google flow, and profile repository are preserved.

Production acceptance remains pending: deploy Firestore/Storage rules, configure bucket/billing/cross-service permission, then sign in and publish with a real Hostel account. Emulator/fixture writes do not verify production configuration. Scheduled server expiry materialization and orphan cleanup remain future work; request-time rules already prevent expired edits and cancellation revival.

The reproducible harness is `tests/security-emulator.mjs` with `firebase.emulators.json`; external test-tool instructions are in [PHASE4.md](PHASE4.md). Java runtime deprecation diagnostics and expected permission-denied logs occurred in the emulator process; these were not app console errors.

## Phase 3 dashboard verification

- Ran the site using the existing Python static server at `http://127.0.0.1:8080/`. Real Firebase modular CDN initialization, shared App/Auth instances, Google provider, and the signed-out dashboard gate passed with zero console errors. No Google credentials were entered and no real authenticated Hostel session was tested.
- **16/16 Node tests pass**: existing 14 authentication/profile tests plus dashboard identity/role boundaries and expiry urgency boundaries. Run `node --test tests/*.test.mjs` on Node 22+.
- Browser tests with isolated Firebase SDK fixtures passed: matching Hostel profile access and landing account link; NGO, Admin, signed-out, and incomplete profile denial with an empty dashboard DOM; logout clearing content; zero dashboard Firestore writes. These are fixture role flows, not completed live Google account sign-ins or deployed-rule tests.
- Checked 320, 390, 768, 1024, 1440, and 1920px widths in Dark, Light, and System themes (18 combinations): no horizontal page overflow. Inspected desktop/tablet/mobile screenshots and mobile listing/wizard screens. Live System theme changes between OS light/dark passed. New styles inherit existing theme tokens.
- Passed listing search/empty state, pause/resume, cancel/reset, chart measure switch, mobile drawer navigation/Escape/focus return, and all three wizard steps on desktop and mobile. Publish displayed the exact next-phase message and issued no listing writes. Image selection/upload remains a placeholder.
- Reduced-motion handling and switching off an in-flight section animation passed without errors. Dashboard uses no Three.js. One shared minute timer updates expiry text without replacing focused action controls and skips hidden pages/dialogs.
- Existing Phase 2 browser regression suite passed again: new NGO onboarding, returning-user skip, admin bootstrap/badge, validation, read/write error recovery, popup cancellation/blocked feedback, logout, keyboard focus, and responsive themes. These Firebase operations were isolated fixtures. Landing styles and animation/theme files were not rewritten.

Live acceptance still requires an existing signed-in Hostel Google account and deployed own-profile Firestore rules: complete Google login, follow the dashboard link, confirm server profile access, sign out, and repeat with NGO/Admin accounts. No production documents, uploads, rules deployments, or Phase 4 backend changes were performed.

## Earlier Phase 2 verification

## Live checks

- Served the existing site on http://127.0.0.1:8080 with a plain Python static server.
- Real Firebase SDK 12.4.0 initializes App, Auth, Google provider, and Firestore without initialization console errors. Repeated calls return the same app/auth instance.
- Real `signInWithPopup` reaches `accounts.google.com` with the supplied project's OAuth client and Firebase callback domain. No credentials were entered and no Google sign-in was completed.
- The public project configuration reports authorized hosts `127.0.0.1` and `mealbridge-community-surya.codexloner.chatgpt.site`.
- JavaScript syntax checks passed. Normal initial landing load had no console warnings/errors.
- During the real Google popup, Chrome logged two Cross-Origin-Opener-Policy diagnostics from popup polling. These are distinct from Firebase initialization. They were not suppressed; complete sign-in must be checked in the actual browser.

## Automated application tests

**14/14 tests pass** with the built-in Node test runner: `node --test tests/auth.test.mjs` (Node 22+; no npm dependencies). The tests use injected SDK/repository fixtures and never write to the production project.

Covered new partner onboarding, returning users, verified admin bootstrap, unverified identity handling, read retry, save errors, logout during pending reads and saves, duplicate popup prevention, input/admin-role validation, immutable identity and false verification on creation, preservation of an existing partner role, rejection of an inconsistent normal admin profile, and limited admin-role migration.

Browser fixtures exercise the actual DOM, controller, and profile repository with routed Firebase SDK modules. Passed: new NGO role selection and exact 11-field profile payload, required-field and phone validation, denied-write retry preserving fields, returning-user skip without rewriting, admin creation and badge, navbar updates and logout, cancellation and blocked-popup messages, denied-read recovery, focus return, three themes, dialog scrolling, and desktop/tablet/mobile layouts. Fixture profile writes are in-memory tests, not live Firestore writes.

The landing remains free of horizontal overflow at 320, 360, 390, 600, 601, 768, 800, 801, 1024, 1280, 1440, and 1920 CSS pixels. Sample meal filtering, live system theme changes, login Tab/Escape/focus behavior, and direct-file local-server guidance passed. The signed-in header also passed 320/390/768/1024/1440 checks.

## Not verified against the production backend

Completed Google authentication, a real profile write/read, returning-user persistence with real Google credentials, and the actual admin account bootstrap remain pending human acceptance. The Firestore rules file is supplied but was not deployed or run in a Firebase emulator (no Java runtime was available). Rule behavior must be checked in Rules Playground or an emulator before production deployment. No production users or documents were created during this session.
