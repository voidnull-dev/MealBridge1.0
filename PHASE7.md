> Historical Phase 7 record. Phase 8 now adds real collection ratings and in-app notifications; see [PHASE8.md](PHASE8.md) for current event/feedback rules and tests.

# MealBridge — Phase 7 Admin Panel

Phase 7 adds the administrator workspace to the existing static frontend. No framework, build setup, maps, ratings, complaints, push delivery, or Cloud Functions were added. Existing landing, authentication, provider listing/Storage and NGO claim workflows are preserved.

## Files

Created: `admin.html`, `css/admin.css`, `js/admin-bootstrap.js`, `js/admin-gate.js`, `js/admin-data.js`, `js/admin-template.js`, `js/admin.js`, `tests/admin.test.mjs`, `tests/admin-emulator.mjs`, and this document.

Changed: `index.html`, `css/auth.css`, `js/onboarding.js` (admin navigation/success entry); `js/claims.js` (live safe provider verification projection); `firestore.rules`; prior `tests/claims-emulator.mjs` and `tests/security-emulator.mjs` (authorized admin read expectations); `README.md`, `FIREBASE_SETUP.md`, `TEST_RESULTS.md`, and historical Phase 6 notice. Storage rules and shared Firebase initialization are unchanged.

## Workspace and real data

The verified Google administrator gets Admin Panel access in navigation and the onboarding success dialog. Unauthorized visitors see Access Restricted with an empty admin root, then return to the landing page after five seconds. Logout disposes all listeners and removes private DOM content.

Overview uses actual users, listings and claims. Active listings are unpaused, unexpired Available/Partially Claimed records with boxes remaining. Active claims are Claimed/En Route. Urgent listings expire within 30 minutes. Claimed-box totals exclude cancelled claims. Meals rescued is explicitly an estimate from collected boxes × meals per box, not a historical impact ledger.

Verification queue shows pending Hostel/NGO profiles with `isVerified === false`; reviewed rejected profiles remain available in the Rejected directory tab. Legacy profiles without verificationStatus are pending. Directory supports search, role/state tabs and filters, 25-row display pagination, mobile cards and restricted detail dialogs. Verify/reject/keep-pending actions use confirmation and optional internal notes. Listing pause/resume/cancel preserve ownership, food data and quantities. Claims have status filters and no admin editing controls. Charts show actual distributions; empty collections show empty states. Recent activity merges record creation with the latest 40 admin audit records.

All new UI uses existing Dark/Light/System tokens, responsive sidebar drawer, keyboard focus handling and native dialogs. Reduced motion disables optional count/entry animation. Admin loads no Three.js or chart framework.

## Security and schemas

Backend authority requires the exact `request.auth.token.email == "suryanshdevniranjan@gmail.com"`, a verified email and Google sign-in provider. A profile role alone cannot grant admin privileges. Frontend additionally requires the matching saved admin profile. Comments identify the future trusted Custom Claims upgrade; never issue claims from the browser.

Admin verification transactions update only verification fields on partner profiles: isVerified, verificationStatus, verifiedAt/verifiedBy when verified, verificationReviewedAt/verificationReviewedBy and updatedAt. Nonverified decisions remove verifiedAt/verifiedBy. Role and identity fields remain immutable. Normal users may edit their existing safe contact fields but cannot grant verification or roles.

`organizationModeration/{uid}` holds organizationId, verificationStatus, internalNote, reviewedBy and reviewedAt, readable/writable only by admin. Notes are never placed in partner-readable user documents.

`organizationStatus/{uid}` contains only isVerified, verificationStatus and updatedAt. Authenticated partners may get this safe projection; it contains no profile/contact/note data. Rules pair it with the reviewed user via getAfter. NGO discovery shares one listener per provider and reflects verification/revocation live; unreviewed legacy records fall back to the existing listing verification snapshot.

`adminActivity/{autoId}` contains adminUid, targetKind, targetId, action and createdAt. App verification/moderation transactions append audit records atomically. Rules validate the matching post-write target state. Activity is admin-readable and append-only. This is an app activity feed, not a comprehensive tamper-proof audit of privileged Console/Admin SDK operations.

Admin may read all users, public/private listings and claims. Admin listing writes change only isPaused/status/updatedAt for allowed moderation transitions. No deletes or counter/ownership changes are allowed. Admin cannot change claim status. Existing paired NGO claim rules and provider/Storage boundaries remain intact. Cancellation removes discovery/private pickup eligibility but does not cancel existing claim records, refund boxes, or automate reconciliation; that policy is deferred.

## Query and scaling limitation

Four shared listeners load users, listings, claims and the latest 40 adminActivity records. The first three are full collection snapshots reused across all views; display pagination does not reduce reads. Metrics/distributions are accurate for the loaded collections, but read cost, memory and rendering increase with project size. Queue and merged activity also rely on loaded records. This is suitable for an initial small deployment; Phase 8 should use bounded server queries, aggregate counters and a trusted impact/activity ledger. No new composite index is required by admin queries; retain the Phase 6 NGO discovery index and default single-field createdAt index.

## Deployment and acceptance

1. Publish the updated `firestore.rules` in the Firebase Console for meal-f9e82. No deployment was performed in this session. Retain existing Storage rules and NGO discovery index.
2. Serve/deploy the complete static folder over HTTP(S); enable Google and authorize the hostname. No build or new Firebase initialization is needed.
3. Sign in with the intended administrator; existing auth bootstraps/reads its own admin profile. Confirm navigation access and actual collection snapshots. With a new partner, verify/reject/pending, inspect server timestamps and private notes, confirm immediate directory updates and live NGO verification badges.
4. Test pause/resume/cancel against a disposable real listing. Confirm immutable owner/counters and admin read-only claims. Sign out, then repeat denial checks with Hostel/NGO and a nonadmin account.
5. Check both desktop/mobile and all themes with real accounts. Production Google popup sign-in and production database writes remain manual acceptance steps; automated fixtures/emulators do not substitute for them.

## Verification

35 dependency-free Node tests pass. 239 real SDK emulator assertions pass: 98 admin, 77 NGO claims and 64 provider Firestore/Storage checks, using isolated demo-mealbridge. Runtime uses CDN SDK 12.4.0; test SDK is 12.19.0. Negative tests produce expected permission-denied diagnostics (some invalid writes hit the rules expression limit); all positive workflows and scripts pass.

Browser fixtures exercise actual app DOM/repositories for authorization/redirect, live queue, verification/rejection/private notes, directory filters/details, moderation/error retry, read-only claims, actual charts/activity, focus, mobile drawer, listener cleanup and logout. Admin passes 21 viewport/theme combinations (320–1920px) without overflow or app console errors, plus directory/listing/claim/analytics layouts at 320/768/1440px, live System changes and collection retry. Existing provider, NGO and auth browser regression suites pass. Real CDN initialization, singleton app/provider and signed-out admin gate pass on the local server without console errors.

## Exact Phase 8 recommendation

Production authorization and lifecycle hardening: issue/revoke admin Custom Claims from a trusted environment and test token refresh/revocation; move claim allocation/progress and cancellation/reallocation policy into authenticated, idempotent backend transactions; add scheduled expiry/reconciliation and orphan-image cleanup; add an authoritative collection/impact ledger and bounded aggregate admin queries; add App Check/abuse limits, migration and emulator/concurrency/privacy tests. Keep maps, ratings, complaints and notification delivery outside that scope.
