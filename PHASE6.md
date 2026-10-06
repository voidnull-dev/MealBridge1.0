> Historical Phase 6 record. Phase 7 now adds the Admin Panel and authorized admin reads/moderation; see [PHASE7.md](PHASE7.md) for current scope and rules.

# Phase 6 — live NGO discovery and claims

Run the same static site with `python -m http.server 8080 --bind 127.0.0.1`. No framework, bundler, package manifest, installation, or frontend build is required. Firebase modular CDN imports reuse the existing App/Auth/Firestore initialization.

## Completed

- NGO-only real-time discovery uses `onSnapshot` with schema-version, status, unpaused, and positive-quantity predicates. Client filtering excludes expired/own listings and supports food/provider/city search, type, minimum boxes, readiness, urgency, verified organizations, and newest/expiry/available-box ordering. Distance filtering is removed; the existing map remains an explicitly illustrative placeholder.
- Cards and details show real food photos, organization, verification, available/total boxes, meal estimates, general city, readiness/expiry, packing, allergens, and status. Ratings remain a coming-soon placeholder. Loading, empty, cached/offline, error, and retry states are included. Snapshot changes immediately remove paused/closed/fully allocated listings; a shared timer removes newly expired food.
- Claim modal includes plus/minus and typed integer quantity, pickup ETA, optional note, current availability, and expiry. It preserves input on failure and blocks duplicate submission/closing during confirmation. A short pickup window receives a valid default ETA within that window.
- Every claim runs a Firestore transaction that rereads the current server profile, listing, and deterministic claim ID. It creates the claim and atomically decrements available boxes/increments claimed boxes, sets `partiallyClaimed` or `claimed`, and writes server timestamps. Stock, role, identity, status, pause, expiry, ownership, integer quantity, ETA, and duplicate checks are enforced by both the repository and rules.
- Real-time own claims include food/provider, reserved boxes, ETA, note, journey, and protected pickup details. “I'm On The Way” permits `claimed → enRoute`; “Food Collected” permits `enRoute → collected`. Collection adds the exact claim quantity to `collectedBoxes` in the same transaction. A fully allocated listing becomes `collected` only when all its allocated boxes are collected; otherwise its existing status remains. Expired/cancelled food cannot progress to collection.
- Public/private and claim listeners are unsubscribed on dashboard view changes, logout, and page disposal. Async callbacks use generation checks. Private details are cleared on leaving the claim panel, completion, cancellation, expiry, or read failure. Retry controls recover failed reads. Cached data cannot initiate claims/progress.
- Existing themes, reduced motion, native modal keyboard containment, focus return, and mobile navigation are preserved. No Three.js is loaded by the NGO workspace. Existing impact metrics/charts/achievements and historical rating examples remain explicitly illustrative; Active Claims is real. No new maps, ratings, complaints, notifications, Admin Panel, or automated functions are implemented.

## Public/private schema

`listings/{listingId}` now uses `schemaVersion: 2`, `hostelVerified`, and `collectedBoxes`, with `location: {city}`. It **does not contain** the exact address, contact person/phone, or pickup instructions. Other existing food/owner/quantity/timing fields remain.

`listingPrivate/{listingId}` contains exactly:

```text
hostelId
exactAddress
contactPerson
contactPhone
additionalPickupInstructions
```

Provider creation/edit writes both documents atomically. Contact phone comes from the provider's current saved profile; the existing wizard's address/contact/notes fields become private pickup fields. The provider reads its own private document to populate editing. Keep private information out of public food names, allergens, and photos as well.

Claims use the requested ten fields: `listingId`, `ngoId`, `ngoName`, `hostelId`, `requestedBoxes`, `pickupETA`, `ngoNote`, `claimStatus`, `createdAt`, `updatedAt`. IDs are `${ngoUid}_${listingId}`. One immutable claim per NGO/listing prevents duplicate active claims and replay; a collected claim also cannot be recreated. Claim cancellation/reallocation is not exposed in this phase, even though `cancelled` is reserved for a future workflow.

## Rules and integrity

Deploy the updated `firestore.rules`. Own-profile protections and admin badge bootstrap remain; no badge grants admin powers. A verified Google NGO can query only safe schema-v2 discovery records, read its own claims, and read its claimant-related public listing. Other users' claims/private records remain denied. A valid active claim means `claimed` or `enRoute`, matching identity/listing, with uncancelled and unexpired food. Collected/expired/cancelled claims do not grant pickup access.

NGO counter/status writes are permitted **only as paired atomic claim operations**, not as standalone edits. Rules use [`getAfter`](https://firebase.google.com/docs/firestore/manage-data/transactions) to check the matching deterministic claim and exact quantity deltas. Ownership, totals, immutable claim fields, and unrelated listing fields cannot change through the claim flow. The collected counter likewise requires the matching allowed claim transition. Normal users cannot assign themselves `admin`.

Time-relative discovery authorization has a deliberate limitation: the query-safe rules allow expired schema-v2 public food metadata if its stored status still looks available. The UI removes it using the actual expiry, and rules reject claiming/private pickup reads/progress at `request.time` after expiry. There are no sensitive fields in that metadata. A future server expiry job can materialize expired statuses; no such function is built here.

Rules cannot remove information someone legitimately read earlier. The UI clears private data when access ends, but previously copied pickup information cannot be revoked. Production strengthening should move allocation/progress to a trusted callable service, use App Check/rate limits/idempotency, and grant administrative capabilities only through trusted Custom Claims.

## Legacy listing upgrade

Schema-v1 listings remain owner-only and are excluded from NGO discovery/read access. The Hostel card shows **Secure pickup details**. Its owner transaction moves address/contact/instructions into `listingPrivate`, removes them from the public document, and sets schema version/verification/collected counter. This works for closed legacy records too and does not reopen them. Upgrade before editing a legacy record; new listings are already safe.

No production migration was run in this session. Do not loosen the schema-version discovery guard to expose old records. Publish the new static files and rules together, refresh older provider tabs, then have owners upgrade their records. Test a migrated listing before announcing live NGO discovery.

## Firebase deployment and acceptance

1. Confirm the existing Google provider, authorized domain, Firestore, and Storage setup in [FIREBASE_SETUP.md](FIREBASE_SETUP.md).
2. Publish the exact updated `firestore.rules` in Firestore → Rules. Do not use open test rules. Existing `storage.rules` remain unchanged; deploy/retain their owner-image permissions for provider operations.
3. Create the `listings` collection-scope composite index in `firestore.indexes.json`: ascending `schemaVersion`, `isPaused`, `status`, `availableBoxes`. Wait until it is enabled. Alternatively use an external Firebase CLI with `firebase deploy --project meal-f9e82 --config firebase.emulators.json --only firestore:rules,firestore:indexes`. The CLI is not a frontend dependency.
4. In a real Hostel Google session, create a test listing and inspect both documents: public `location` contains city only, while address/contact/instructions are private. Upgrade any legacy records with the owner control.
5. In separate real NGO browser sessions, confirm public discovery but denied private access before claiming; claim a valid exact quantity, inspect both counters and the claim, then attempt a concurrent overclaim from the other NGO. Confirm own real-time claims, private details only after claiming, and En Route/Collected transitions.
6. Check paused/expired/cancelled/fully claimed records, duplicate and invalid quantities, stale availability, foreign claim/private reads, role denial, themes/mobile layouts, and logout. Delete or retain production test records through a trusted operator as appropriate; no UI delete/reallocation workflow is supplied.

These production deployment and actual-account steps remain pending. This session used the real SDK against isolated emulators and SDK fixtures in browsers; no real Google credentials, production claims/writes/uploads, billing changes, or rules deployments occurred.

## Verification and files

**32 Node tests**, **77 claim/privacy emulator assertions**, and **64 Firestore/Storage provider regression assertions** pass. NGO browser fixtures pass 21 theme/width combinations, claim/progress/privacy/retry/live updates, role denial, and listener cleanup. Provider/auth browser regressions and real Firebase CDN signed-out initialization pass with no app console errors. Details: [TEST_RESULTS.md](TEST_RESULTS.md).

Created: `js/claims.js`, `firestore.indexes.json`, `tests/claims.test.mjs`, `tests/claims-emulator.mjs`, `PHASE6.md`.

Changed: `js/ngo-gate.js`, `js/ngo.js`, `js/ngo-template.js`, `css/ngo.css`, `js/listings.js`, `js/listing-model.js`, `js/dashboard.js`, `firestore.rules`, `firebase.emulators.json`, `tests/listings.test.mjs`, `tests/security-emulator.mjs`, `README.md`, `FIREBASE_SETUP.md`, `TEST_RESULTS.md`, `PHASE4.md`, `PHASE5.md`.

The landing, Firebase configuration, auth/onboarding, theme, animation, and Storage implementation files are unchanged. Optional test tooling stays outside the static project.

## Exact recommended Phase 7 scope

Build a **trusted claim lifecycle and real impact ledger**: move allocation/progress into authenticated, idempotent callable operations; add validated NGO cancellation and provider cancellation policy with atomic release/reallocation; add scheduled expiry/reconciliation and image-orphan cleanup; derive real meals/history/monthly impact from completed claims; test concurrent cancellation/collection/retries and privacy revocation. Add App Check, abuse limits, audit records, and narrowly scoped trusted Custom Claims where needed. Defer live maps, ratings, complaints, notification delivery, and Admin Panel until this lifecycle is complete.
