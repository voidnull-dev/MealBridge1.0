# Phase 4 — provider listing workflow

Historical phase documentation. Phase 6 now provides live NGO discovery/claims, private pickup storage, updated rules, and a legacy-owner upgrade control. See [PHASE6.md](PHASE6.md) for current deployment and Phase 7 scope.

Run the same plain static site through `python -m http.server 8080 --bind 127.0.0.1`. Google sign-in and completed Hostel onboarding remain required to open `hostel.html`. The landing design, theme system, mobile navigation, and dashboard layout are preserved.

## Implemented

- Validated three-step listing creation in `listings/{listingId}` with owner identity derived from the authenticated user and current server profile. Firestore server timestamps populate `createdAt` and `updatedAt`; ready/expiry values use `Timestamp`. An owner query uses `onSnapshot`, with newest-first client sorting; it requires only the default single-field `hostelId` index, not a composite index.
- Live owner listings replace all static food cards. Active listing/available-box metrics use real data. Cards include food photo, name/type, packing, available/total and claimed boxes, approximate meals, creation/readiness times, urgency/countdown, status, and notes. Loading skeletons, empty/filter states, cached-data notice, denied-load error, and retry controls are included.
- Optional food photos accept JPG/PNG/WebP, positive size strictly below 5 MiB (5 × 1024 × 1024 bytes), client-side MIME/header checks and browser decoding. Selection shows a local preview, and the native progress element announces resumable upload progress. No-photo listings use the existing polished meal photograph, `assets/images/hero-meal.jpg`, with default-photo alternative text.
- Photos upload to `listing-images/{hostelUid}/{listingId}_{uuid}.{jpg|png|webp}` with owner/listing metadata. Firestore stores `foodImage` and the additional `foodImagePath` cleanup field. Firebase Storage is imported lazily through CDN and shares the existing App instance.
- Edit prepopulates the wizard, supports image replacement/removal, and preserves immutable owner/creation data. A transaction checks the latest owner/profile and detects stale edits. New image paths prevent overwrites. Old images are deleted only after a successful replacement document commit; failed new uploads are cleaned only after a server read confirms that no document references them. Ambiguous network failures retain the image for later cleanup.
- Pause/resume persists `isPaused`; cancel persists `status: "cancelled"` without document deletion. Owner checks exist in the repository and rules. Cancelled/expired/claimed records cannot be edited or revived by the client. No claim creation or allocation logic exists.
- Derived status precedence is Cancelled → Expired → Paused → Claimed → Available. Countdown uses a shared 15-second timer with accessible urgency text and skips hidden pages/open dialogs. Rules use `request.time` to reject changes to expired documents. Stored status does not automatically change to expired; a scheduled Cloud Function can materialize that status and clean orphan images later.
- Busy state blocks duplicate publish/close, form data remains after failure, and errors appear within dialogs/toasts. Image object URLs and listeners are disposed on close/sign-out. Cached cards cannot be managed until the listener confirms server data.

Impact charts, collection history, pickups, settings, and achievements stay explicitly illustrative as in Phase 3. No NGO dashboard, maps, claims, Admin Panel, ratings, complaints, or notification delivery was added.

## Files created/changed

Created: `js/listing-model.js`, `js/listings.js`, `storage.rules`, `tests/listings.test.mjs`, `tests/security-emulator.mjs`, `firebase.emulators.json`, `PHASE4.md`.

Changed: `js/firebase-config.js` (lazy Storage adapter), `js/dashboard-gate.js` (repository injection), `js/dashboard.js`, `js/dashboard-template.js`, `js/dashboard-data.js` (removed unused demo listings), `css/dashboard.css`, `js/onboarding.js` (Hostel success copy), `firestore.rules`, `README.md`, `FIREBASE_SETUP.md`, `PHASE3.md` (historical note), and `TEST_RESULTS.md`.

The project still has no framework, bundler, package manifest, or build step. Emulator/browser verification dependencies were isolated in the task's `work/` folder. The optional emulator test source/config are shipped for reproducibility and never loaded by the site.

## Optional local emulator verification

The normal website needs only a static server. To reproduce the security tests, use Node 22+ and a Java runtime supported by Firebase Emulator Suite (Java 21+), and install `firebase-tools`, `firebase`, and `@firebase/rules-unit-testing` into a separate temporary tooling directory with `npm install --prefix <tools-directory> firebase-tools firebase @firebase/rules-unit-testing`. Set `MEALBRIDGE_TEST_TOOLS` to its absolute path. From the MealBridge folder run:

```text
node <tools-directory>/node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-mealbridge --config firebase.emulators.json --only firestore,storage "node tests/security-emulator.mjs"
```

The `demo-mealbridge` ID ensures this harness cannot use the production project. The configured ports are 8085 and 9199, leaving the existing static server on 8080. The harness checks real rule enforcement and the shipped listing repository against both emulators. No packages or build commands are required inside MealBridge.

## Manual Firebase Console steps

1. Open the **meal-f9e82** project. Confirm Google authentication and the intended local/hosting domain are enabled. Create the **default** Firestore database if needed.
2. Publish the supplied **firestore.rules** in Firestore → Rules. They retain own-profile onboarding permissions and add strict Hostel-owned listing read/create/update rules. Do not use open test rules. Keep the default single-field `hostelId` index enabled.
3. Enable/confirm the exact bucket **meal-f9e82.firebasestorage.app** in Storage. Cloud Storage requires the Blaze plan; review billing and budgets before enabling it. This session did not change a billing plan. See [Firebase's billing/bucket requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
4. Publish **storage.rules** for that bucket. Accept the prompted permission enabling Storage rules to read the default Firestore database for Hostel role checks. See [cross-service rule conditions](https://firebase.google.com/docs/storage/security/rules-conditions). Uploads are owner-only, JPEG/PNG/WebP only, strictly below 5 MiB, metadata-bound, and create-only. No public open-write access exists.
5. With a real Hostel Google account, publish once without a photo and once with a photo. Confirm the listing document and server timestamps in Firestore; inspect the owner-scoped object in Storage and matching URL/path in Firestore. In a second tab, confirm live card updates, then edit, pause/resume, cancel, and sign out. Repeat negative access checks with another Hostel, NGO, Admin, and signed-out accounts.

Firebase download URLs contain bearer tokens: the saved URL lets anyone holding it view that food image even though SDK reads are owner-scoped. Do not use this upload for private documents. Storage rules validate metadata, MIME, size, and path; trusted server-side image inspection/quota enforcement remains a future hardening option.

These rules do not grant admin privileges through an editable profile field. Trusted Custom Claims are required before introducing privileged administrative capabilities. No rules were deployed or production account/documents created in this session.

## Recommended exact Phase 5 scope

Build the **NGO-only dashboard and food discovery/claim workflow**: authenticated NGO routing, a privacy-reviewed listing browse view restricted to unpaused/unexpired available food, quantity selection, and server-authorized atomic box claims that cannot overclaim or claim after expiry. Store NGO-owned claim records; show claim history and update provider box counts/status through real-time listeners. Add explicit NGO read/claim permissions, immutable owner/claim fields, and emulator concurrency/expiry/access tests. Keep provider editing from reducing capacity below allocated boxes.

Defer maps, Admin Panel, ratings, complaints, and notification delivery. Do not expose whole user profiles or unrestricted listing contact data to every signed-in user.
