# MealBridge Firebase setup

## Current verification / real-data update

[VERIFICATION_GATE.md](VERIFICATION_GATE.md) supersedes older phase instructions: 49 unit tests, 172 Firestore/Storage emulator assertions, 72 responsive/theme states and zero console/map requests/axe violations. Maps are disabled; new partners are pending until Admin approval. Deploy the updated Firestore rules/indexes and Storage rules with the frontend. No production deployment or real-account OAuth acceptance was performed. Earlier sections below are historical; do not follow their map activation or demo/access descriptions for this release.


## Current Agra update

See [AGRA_UPDATE.md](AGRA_UPDATE.md) for the current coverage/registration contract, public organization collection, index/rules activation and dry-run-first migration instructions. Current acceptance: 47 unit tests, 107 emulator assertions and 48 responsive/theme cases; four directory axe scans have zero violations. The earlier phase results below are historical. Updated rules/indexes and migration have not been deployed or run on production.


## Phase 10 activation

Current deployment steps and exact project/target commands are in [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md). Deploy updated recipient-only notification rules and indexes/Storage alongside the reviewed frontend. Hosting remains unbound and undeployed until the existing site is explicitly confirmed. Review public web API-key restrictions in Google Cloud; no private credentials belong in this project. Full audit and limits: [SECURITY_AUDIT.md](SECURITY_AUDIT.md), [PHASE10.md](PHASE10.md).


Phase 2 provides Google-only authentication and private partner profiles. Phase 4 connects Hostel listings and image uploads. Phase 6 connects NGO real-time discovery, exact-quantity claims, protected pickup details, and collection progress. See [PHASE6.md](PHASE6.md) for schemas, owner migration, rules, indexes, and production acceptance. Phase 7 adds Admin Panel verification/moderation with token-based verified Google email rules; see [PHASE7.md](PHASE7.md). Phase 8 adds immutable two-way ratings and recipient-scoped Firestore notifications; see [PHASE8.md](PHASE8.md). Phase 9 adds Leaflet/OpenStreetMap, explicit Nominatim search and OSRM routes. No FCM/browser push or Cloud Functions are added, and no deployment was performed.

## Run the static site

From this folder, run `python -m http.server 8080 --bind 127.0.0.1` and open **http://127.0.0.1:8080**. No packages, build command, or bundler are needed. Authentication uses browser ES modules, so direct-file use shows a local-server message instead of attempting Firebase. Production hosting needs HTTPS.

## Firebase integration completed in code

- Supplied configuration in `js/firebase-config.js`, pinned Firebase modular SDK 12.4.0 CDN imports for App, Auth, and Firestore.
- Storage is imported lazily through the same pinned CDN and uses the shared App instance.
- Shared lazy initialization with local authentication persistence and memory-only fallback when browser storage is unavailable.
- Google account selection with `signInWithPopup`, actionable blocked-popup guidance, cancellation/error/loading/success notifications, and sign-out.
- `users/{uid}` profile reads from the server and transaction-based creation. Transactions prevent another tab from overwriting an existing profile or changing the partner role. Timestamps use `serverTimestamp()`.
- New partners choose `hostel` or `ngo`; required fields are full name, organization, phone, and city. `uid`, `email`, and `photoURL` come from the signed-in Google account; `isVerified` is always false on creation.
- Returning users skip onboarding. Pending profiles can be resumed through My profile or the landing CTAs.
- The intended verified Google account `suryanshdevniranjan@gmail.com` bootstraps its own `admin` profile, skips partner onboarding, and receives an Admin badge. Organization, phone, and city remain empty for this bootstrap profile. Phase 7 grants narrowly scoped server-validated administrative reads, verification and listing moderation to that exact verified Google identity.
- No Analytics initialization, credential collection, or OAuth tokens stored in profile documents.

## Firebase Console work still required

Use the [meal-f9e82 Firebase Console](https://console.firebase.google.com/project/meal-f9e82/overview).

1. **Authentication → Sign-in method**: confirm Google is enabled and a project support email is selected. No email/password provider is used by this UI. [Google authentication instructions](https://firebase.google.com/docs/auth/web/google-signin).
2. **Authentication → Settings → Authorized domains**: verify the current authorized domains in Console. Include `127.0.0.1`/`localhost` as needed locally and the exact preview/live Hosting or custom hostname before sign-in testing. Historical domain observations do not confirm the current deployment target.
3. **Firestore Database**: create the default Firestore database if it does not exist, choosing the appropriate region and production mode. No index is needed for direct `users/{uid}` reads. Keep the default single-field `hostelId` index for provider queries; newest-first sorting occurs in the client. Deploy the `listings` composite index in `firestore.indexes.json` for NGO discovery: ascending schemaVersion, isPaused, status, availableBoxes (collection scope). Wait until enabled.
4. **Firestore → Rules**: replace the rules with the exact contents of `firestore.rules`, review, and publish. **This file has not been deployed by this session.** Do not publish open test rules. The UI's permission-denied state explains how to retry after deployment.
5. **Storage**: enable/confirm `meal-f9e82.firebasestorage.app`, review the required Blaze billing plan, and publish `storage.rules`. Accept the permission prompt enabling Storage rules to read the default Firestore database for Hostel role checks. This session did not change billing or deploy rules. [Firebase Storage requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).
6. Test a real Hostel account: publish with and without a photo, inspect Firestore/Storage, check real-time changes in another tab, edit, pause/resume, and cancel. Repeat negative access checks with another Hostel, NGO, Admin, and signed-out users. Emulator tests do not replace real-account acceptance with deployed rules.

Phase 6 acceptance requires separate real Hostel/NGO sessions: create a listing, confirm public/private separation, claim an exact quantity, test concurrency/duplicate protection and private access, progress through En Route/Collected, and repeat role/expiry/pause/cancellation checks. Use the owner's Secure pickup details control for legacy records before NGO discovery. No production migration or deployment was run here. Detailed steps and a CLI deployment option are in [PHASE6.md](PHASE6.md).

## Phase 8 activation and acceptance

The updated Firestore rules add ratings, safe numeric projections/private score links, source-paired notifications and owner-scoped Hostel claim reads. Publish them only when activating the updated frontend; this request explicitly excludes deployment. There are no additional composite indexes or Storage changes. Collections are created by validated transactions, not open setup rules. Complete the two-session collection/rating/inbox acceptance checklist in [PHASE8.md](PHASE8.md); production credentials and writes were not exercised here. No FCM setup or Functions are used. Existing preview notification switches do not control the new inbox.

## Rules and admin boundary

`firestore.rules` retains authenticated, verified Google own-profile access and validated profile creation. Profile collection listing/deletion and reads of other users stay denied. Normal profile updates remain restricted to name, organization, phone, city, and updatedAt; role/identity fields stay immutable. Hostel listings add strict schema, ownership, quantities, timestamps, image references, and state transitions. Creation transactions may check an unused listing ID, but no existing foreign listing data is readable. Schema-v2 public listings now exclude exact address, contact person/phone, and pickup instructions. NGOs read constrained discovery and their own claims; private reads require an active, uncancelled, unexpired claim. NGO counters/status can change only with the matching exact atomic claim or collection transition; standalone counter edits remain denied. All unrelated collections stay denied.

The transitional admin bootstrap is evaluated on the server against the Firebase Auth token's verified Google email. Only that owner can create its admin badge or migrate its own existing partner badge to admin. Phase 7 additionally authorizes that exact verified Google token identity to read admin data, review partner verification and moderate listings. Profile role does not grant authority. Frontend role checks only select UI; they are never an authorization boundary.

For the recommended Phase 10 security upgrade, issue an `admin: true` Custom Claim from a trusted server or Admin SDK environment after verifying ownership, then implement and test claim-based rules for the exact capabilities. Never issue claims from a browser or trust writable profile fields. See [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims) and [field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields).

## Real-account acceptance checklist

- New partner: sign in, select role, submit valid fields, confirm all 11 schema fields in `users/{uid}` and both timestamps. Confirm role and isVerified are correct.
- Returning partner: sign out and sign in again; onboarding must be skipped and the existing organization/role preserved.
- Admin: sign in with the intended verified account; confirm Admin badge and role, no partner form, Admin Panel access, real-time verification/moderation and read-only claims. Follow [PHASE7.md](PHASE7.md) for production acceptance.
- Sign-out: navbar returns to Sign In; refresh confirms the session remains signed out.
- Rules: unauthenticated/foreign profile reads denied, own get/safe updates allowed, UID/email/photoURL/createdAt/isVerified changes denied, partner role swaps and normal admin-role creation denied, unauthorized extra fields and nonadmin user collection listing denied; admin verification metadata is retained during safe own-profile updates. Provider listing/private edits must belong to the Hostel. NGO discovery must use schema-v2 public predicates, claims must belong to the current NGO, and private reads require an active valid claim. Invalid quantities, changed ownership, claim manipulation, expired edits, and cancellation reversal are denied. Storage rejects foreign folders, non-Hostel roles, unsupported MIME types, oversized images, and overwrites.
- Test dark/light/system, mobile popup behavior, browser popup blocking, cancellation, offline retries, and persistence in the actual production browser.

## Historical Phase 8 recommendation (now Phase 10)

Trusted notification generation/rating aggregation, idempotent migration/backfill, bounded queries, Custom Claims and App Check. See [PHASE8.md](PHASE8.md).

## Phase 9 activation

No production changes were deployed. Publish the updated `firestore.rules` with the refreshed frontend; ensure the existing discovery composite index is ready (its same fields support schemaVersion `in [2,3]`). No Storage rules, Firebase configuration or new initialization changes are needed. Schema 3 atomically pairs `publicLocation` coarse coordinates with private `exactLocation`; schema 2 stays readable during provider-led pin migration.

On an authorized HTTPS domain, test separate real Hostel/NGO/Admin Google sessions: create/edit a pin; inspect public/private documents; verify private denial before claim and authorized pickup/OSRM/navigation after claim; revoke on expiry/cancellation/collection; check actual OSM tiles, all themes, denied geolocation and error recovery. Browser fixtures and isolated emulators passed; production credentials/writes and live OSM tiles were not exercised. See [PHASE9.md](PHASE9.md) for privacy, migration and public-service policies. Public Nominatim needs a shared aggregate limiter or self-hosted replacement before broader traffic; client throttling alone is insufficient.
