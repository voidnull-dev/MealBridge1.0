# Agra coverage, permanent roles and Discover Partners

Implemented in the existing static project, 4 October 2026. No framework, bundler, redesign, production deployment or production data deletion.

## Changed files

New: `js/service-region.js`, `js/organizations.js`, `js/directory.js`, `css/directory.css`, `scripts/migrate-agra.mjs`, `tests/region.test.mjs`, `tests/region-emulator.mjs`, this report.

Updated: `index.html`, `hostel.html`, `ngo.html`; `js/profiles.js`, `js/onboarding.js`, `js/listing-model.js`, `js/listings.js`, `js/claims.js`, `js/pickup-location.js`, `js/location-search.js`, `js/ngo-maps.js`, `js/dashboard.js`, `js/dashboard-template.js`, `js/ngo.js`, `js/ngo-template.js`, `js/admin-data.js`; `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`; four existing unit-test fixtures; `README.md`, `FIREBASE_SETUP.md`, `TEST_RESULTS.md`, `DEPLOYMENT_CHECKLIST.md`.

## Coverage and role behaviour

- First registration defaults to read-only **Agra** and requires an explicit Nominatim locality selection matching Agra / Uttar Pradesh / India and the configured coverage envelope. An outside result clears the previous selection; invalid registration writes nothing.
- Active profiles and listings store `serviceRegion: "agra"`, `city: "Agra"`, `state: "Uttar Pradesh"`, `country: "India"`, `isServiceable: true`. Listing creation requires an in-region private pickup pin; public coordinates remain coarse grid centres.
- Discovery queries and maps include only serviceable Agra listings. Exact pickup information still requires ownership, a valid active claim, or the exact authorized administrator.
- One UID owns one private profile and one public projection. Normal profiles can begin only as Hostel or NGO. A completed partner role cannot be changed, including through direct Firestore writes. Settings show the locked registered role and the permanent-role explanation. Opposite-role routes remain blocked.
- Existing outside partners retain their role, records and history, but cannot create new listings/claims or use partner discovery as active Agra partners. They can still review existing records; owners may pause/cancel old surplus safely.
- The admin remains exactly `suryanshdevniranjan@gmail.com`, with verified Google token checks. Admin verification does not provide a role-switching UI. Custom Claims remain a recommended future strengthening.

## Directory and public data

**Discover Partners** is in both partner sidebars. Hostel sees Agra NGOs; NGO sees Agra providers. Cards and the keyboard-accessible profile dialog include public organization image/initials, role, verified/pending state, locality, description, joined date, published rating summary and contribution totals. Search covers organization/locality/description; locality chips, verified filter, recent/alphabetical sorting, skeletons, empty state, retry and real-time updates are implemented. Rejected organizations are hidden. The landing has an Agra availability indicator and Explore Agra Partners CTA.

The UI queries `organizations`, never another partner's private `users` document. Its strict allowlist excludes personal email, phone, exact address, registration coordinates and pickup/contact details. New profile/projection creation is atomic. Owner-created projections cannot forge verification, ratings, statistics or role. Admin verification updates the private profile, existing public projection, status/audit and notification together.

Contribution/rating fields are **trusted published snapshots**, not invented demo metrics. New projections start with empty totals / zero published ratings; unknown totals display “Not yet published”. The operator migration tool derives actual totals and score summaries from existing listings/collected claims/ratings. Rerun it to refresh snapshots; continuous aggregate maintenance needs a trusted backend in a later phase. Directory documents and verification badges update live whenever those documents change.

## Geography limits

The shared operational envelope is latitude **27.05–27.35**, longitude **77.85–78.20**, centred on Agra. This is an application coverage envelope, **not an official municipal/district polygon**. Nominatim selection also checks city, state and country. Manual pickup adjustments must remain inside the envelope. Server rules enforce canonical fields and coordinate bounds, including private-only pin edits, but cannot independently prove that client-provided address text belongs to a municipal boundary. A trusted geocoder and authoritative boundary polygon would strengthen production coverage. Search remains explicit/cached/throttled; no automatic bulk geocoding. [Nominatim search reference](https://nominatim.org/release-docs/5.0/api/Search/).

## Existing-data migration

No production database inspection using privileged credentials, migration execution, deletion or deployment occurred. Existing schema was inspected through application repositories/rules and isolated fixtures.

On the owner's next sign-in, a legacy partner profile without coverage fields is classified from its stored city. Case/whitespace-normalized Agra is canonicalized and receives a safe public projection; other cities get `serviceRegion: "outside"`, `isServiceable: false`, retaining their existing city/role. Unknown outside localities are not guessed. Provider listing listeners similarly classify missing coverage metadata; schema-3 Agra records must also have an in-envelope private pin. No coordinates are copied into the public organization collection. Records without metadata stay out of public queries until safely classified. Existing inline-address records remain hidden until the owner uses Secure pickup details to migrate them to the existing public/private schema.

For dormant accounts, use the privileged operator tool below in a maintenance window after taking a backup. It never changes roles, deletes records, geocodes addresses, or modifies claims/ratings/notifications/admin history. It reads them to derive public summaries. Agra profile/projection updates re-read the profile transactionally to preserve concurrent verification changes. Logs contain counts only. Firebase Admin SDK bypasses rules: credentials must stay outside the frontend and be controlled by the project owner.

```powershell
# Install firebase-admin in a separate tools directory, not this frontend.
$env:MEALBRIDGE_ADMIN_TOOLS = 'C:\path\to\external-admin-tools'
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\secure\mealbridge-service-account.json'
# Dry run is the default: inspect the counts and backup first.
node scripts/migrate-agra.mjs --project meal-f9e82
# Explicit operator action, after reviewing the dry run:
node scripts/migrate-agra.mjs --project meal-f9e82 --apply
```

The operator tool is syntax-checked; its real credentialed dry run/apply remain manual. Hosting excludes `scripts/`, tests, rules, docs and hidden files. A stale nested project copy was preserved under `work/agra-prior-nested-copy`, outside the served project; no Firebase records were affected.

## Verification actually performed

- **47/47 Node tests pass**, including coverage normalization, both permanent roles, malformed/outside places, directory search/filter/sort and public-field privacy.
- **107 real-SDK Firestore/Storage emulator assertions pass**: new Hostel/NGO registration, normal/admin role forgery denial, private-field injection rejection, opposite-role directory permissions, atomic verification sync, safe legacy classification, direct outside-profile/listing/pin denial, owner controls, concurrent NGO claims, private access/revocation, collected-only immutable ratings, recipient notifications, Storage owner/MIME/size/overwrite restrictions and legacy inline pickup migration. Expected denied-operation SDK diagnostics are intentional.
- Browser fixtures pass both new-role onboarding flows, exclusive role selection, outside-result rejection, returning profile handling, 12 cross-role route combinations, directory search/chips/filters/sort/empty state, live badge changes, profile dialog Escape, locked settings and logout cleanup.
- **48 viewport/theme cases pass** for directory + onboarding at 375/768/1366/1920 widths in Dark/Light/System; no horizontal overflow. Four directory axe scans in Dark/Light report **zero violations**. Bounded desktop/mobile visual review and one confirmation completed. Successful browser paths have **zero console errors**.
- Real Firebase CDN initialization/singleton and signed-out Admin gate pass with zero console errors. Firebase CLI selects **65 static deployment files**, excluding the migration tool and source-only/private files. Module syntax and local HTML links checked.

Tests use a loopback static server, Chromium/Edge, Firebase SDK fixtures for browser behaviour and isolated real-SDK emulators for server enforcement. No actual Google account completion or production writes were used. Earlier emulator totals in phase reports are historical. Pre-Agra emulator fixture suites retain their old geography/registration contract; use the current Agra acceptance suite for this release. Manual production, Safari/Firefox, real touch devices and human screen-reader acceptance remain required.

## Activate the update

Review the code and backup existing data, then deploy the updated rules and both composite indexes together:

```sh
firebase deploy --only firestore:rules,firestore:indexes,storage --project meal-f9e82
```

Wait for indexes to become enabled; review/apply the migration in the controlled operator environment, or allow owner sign-in migration for a small demonstration. Verify real separate Agra accounts, outside accounts and the exact admin on the approved Hosting preview. Then follow DEPLOYMENT_CHECKLIST.md for the existing confirmed Hosting target. No cloud rules/index/Hosting deployment was performed here.
