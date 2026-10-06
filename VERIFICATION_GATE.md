# MealBridge — real data and organization verification

This update preserves the plain static application and its visual identity. It replaces displayed samples with actual Firestore records or explicit loading/empty states, suspends maps, and requires current Admin approval before either partner workspace mounts.

## Completed behavior

- New Google Hostel/NGO profiles are atomically created with their permanent role, Agra coverage, `isVerified: false`, `verificationStatus: "pending"`, and `verificationRequestedAt: serverTimestamp()`. Onboarding opens the review screen, rather than an operational dashboard.
- A shared route gate reads the server profile and subscribes to its own document. Approval unlocks automatically; pending/rejected transitions tear down dashboards, dialogs, listeners and private pickup context. Cached approval never opens a new workspace. Own profile reads remain available.
- Pending/rejected screens provide organization, contact, phone, Agra locality, description and profile-image editing, refresh, sign-out and themes. Rejected users may request another review. Role, region and approval fields remain locked in the UI and rules.
- Profile photos support owner-scoped JPG/PNG/WebP uploads under 5 MB, plus restoring the Google photo. Pending users can upload only profile images; listing-food images still require verification. Profile image download URLs are public bearer URLs intended for directory display; never use them for private documents.
- Admin review has Pending Verification / Verified Organizations / Rejected Organizations tabs, actual contact/locality/photo/submission fields, Verify/Reject/Reopen, private internal notes and a separate optional safe rejection note. Private/public profiles, review metadata, audit and verified/rejected notifications update atomically.
- Exact verified Google administrator: `suryanshdevniranjan@gmail.com`. The email allowlist is enforced in rules; a client role badge cannot grant privileges. Custom Claims remain a future trusted-server migration.
- Verified NGOs discover actual food through verified public organizations, with one scoped listing query per provider. Rules also check the provider's current private approval, so a stale listing badge cannot grant discovery or a new claim. This avoids a broad mixed-owner query exceeding Firestore's document-access budget. A future large network should use a trusted paginated feed.
- Monthly box charts and totals use completed Firestore claims and their completion dates. Collection history, ratings and notifications remain real. Carbon is explicitly not measured. Admin meal estimates remain clearly labelled and calculated only from real collected boxes and provider-declared meals per box.

## Fake content removed

Landing availability samples, meal counters, illustrative impact counters, fictional testimonials/personas and the numeric rescue story; Hostel/NGO sample pickup schedules, fabricated impact cards, preset chart points, earned-looking achievements and sample settings identities. Empty states now use the requested copy. The legacy fictional NGO dataset was moved into an excluded test fixture, not application content. No fabricated organizations, claims, ratings or notifications are added to Firebase.

## Maps suspended safely

`maps.js`, `ngo-maps.js`, `pickup-location.js`, `location-search.js`, `routing.js`, map styles and configuration remain preserved. Active pages do not import/initialize map modules or load Leaflet, OSM tiles, Nominatim or OSRM. Discovery controls, radius/nearest options and route buttons are absent. Registration uses an Agra locality reviewed by Admin, with no geocoder. Posting uses manual actual Agra pickup coordinates and the existing private/coarse schema; geographic bounds and private pickup protection remain enforced. The specified preparation message replaces maps.

## Security rules

Deploy both rule files with the frontend. Current verified private profile status is required for operational listing, claim, collection, rating, directory and inbox reads/writes; only verified Hostels can upload listing-food photos. Users cannot change their own role, service region, approval, reviewer metadata, or Admin notes. Narrow own-profile edits and rejected-to-pending review requests require paired safe public updates. New profiles cannot inject a user-facing Admin note. Internal notes remain in `organizationModeration`, Admin only. The listing/private atomic pairing, inventory allocation, deterministic claims, immutable ratings and recipient inbox privacy are preserved. Redundant field checks were removed only where direct required-field checks and strict field allowlists enforce the same contract, keeping transactions within Firestore's 1,000-expression budget.

## Verification performed

- Static local server: `http://127.0.0.1:8080/`.
- 49 Node tests passed.
- 172 actual Firebase SDK Firestore/Storage emulator assertions passed using isolated `demo-mealbridge`: pending registrations, paired profiles, denied unverified operations, photo ownership/type/size, immutable role/region/status, Admin review/rejection/public-note privacy/re-request, verified-provider discovery, valid listing transactions, concurrent claims, private pickup boundaries, collected ratings/inbox privacy, legacy Agra migration and denial after revocation. Expected permission-denied logs are assertions, not app failures.
- Browser Firebase adapters: both Google onboarding flows, pending editing/photo upload, all role/route combinations, live approval/rejection/revocation, re-request, refresh, logout, Admin tabs and map-free wizard passed. These isolate UI behavior; they do not prove production OAuth.
- 72 responsive/theme state combinations: Hostel/NGO × pending/rejected/verified × Dark/Light/System × 375/768/1366/1920 px. No horizontal overflow, browser console errors, external map requests or axe violations (12 desktop WCAG/best-practice scans).
- Additional final desktop/tablet/mobile wizard confirmation and live OS theme changes passed. Reduced-motion mode exercised throughout browser acceptance. Existing motion and Three.js modules were preserved.
- Real Firebase CDN smoke check confirmed singleton App, project configuration, Google provider and signed-out restriction with zero console errors. No live Google account sign-in or production data writes were performed.
- Syntax, local references, JSON, static Hosting exclusions and ZIP/source integrity checked. No bundler, framework or package-based build added.

## Manual Firebase activation and acceptance

1. In project **meal-f9e82**, deploy `firestore.rules`, `firestore.indexes.json` and `storage.rules` before activating the new frontend. Console Firestore/Storage Rules editors support pasting the matching files; indexes can be deployed using the existing Firebase CLI configuration. Allow Storage rules to read the default Firestore database when Console prompts. Confirm the existing bucket and required billing/service availability; no billing settings changed here.
2. Confirm Google sign-in and authorized local/Hosting domains. Sign in with the exact Admin Google account. Review existing organizations in the Admin Panel; a legacy `isVerified: true` without explicit `verificationStatus: "verified"` remains locked until reviewed. Do not grant approval by editing a client badge. Preserve backups before any legacy migration; no migration or production deletion was run here.
3. With separate actual Google Hostel/NGO accounts, complete registration, approve/reject/reopen from the real Admin account, and confirm real-time unlock/revocation, profile image upload, listing/claim/collection/rating/inbox flows and composite-index readiness. Fixture/emulator acceptance cannot replace this production-account check.
4. Publish the static folder to the already confirmed Hosting site using the existing target configuration. Hosting site binding, actual Console configuration and production deployment were not performed in this session. Maps remain disabled after deployment; re-enabling requires an explicit future change.

## Files

Created: `js/partner-gate.js`, `js/verification.js`, `js/pickup-manual.js`, `js/impact.js`, `css/verification.css`, `tests/verification.test.mjs`, archived `tests/fixtures/legacy-ngo-demo.js`, and this report.

Changed application/configuration files:
- `css/dashboard.css`
- `css/ngo.css`
- `firestore.indexes.json`
- `firestore.rules`
- `hostel.html`
- `index.html`
- `js/admin-data.js`
- `js/admin-template.js`
- `js/admin.js`
- `js/auth.js`
- `js/claims.js`
- `js/dashboard-access.js`
- `js/dashboard-data.js`
- `js/dashboard-gate.js`
- `js/dashboard-template.js`
- `js/dashboard.js`
- `js/directory.js`
- `js/engagement.js`
- `js/main.js`
- `js/ngo-data.js`
- `js/ngo-gate.js`
- `js/ngo-template.js`
- `js/ngo.js`
- `js/onboarding.js`
- `js/organizations.js`
- `js/profiles.js`
- `js/ratings.js`
- `ngo.html`
- `storage.rules`

Updated tests: auth, dashboard, NGO, listing, claim, location, directory/region, ratings, Admin and the real-SDK region emulator suite. Updated README, Firebase setup, deployment checklist and test-results notes. Historical phase documents describe earlier implementations; this report supersedes their active map/demo/access behavior.
