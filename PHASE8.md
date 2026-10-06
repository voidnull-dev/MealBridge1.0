# MealBridge — Phase 8 ratings and in-app notifications

Phase 8 adds real two-way collection feedback and Firestore in-app updates. The frontend remains static HTML/CSS/Vanilla JavaScript, with the same Firebase modular CDN singleton, themes, restrained Anime.js motion and dashboard layouts. No maps, FCM/browser push, Cloud Functions, deployment or major redesign was added.

## Files created and changed

Created:
- `js/ratings.js`: role/category validation, immutable transactional ratings, own sent/received listeners, provider score aggregation and real collected-history reads.
- `js/notifications.js`: canonical event messages, atomic event helpers, recipient-only real-time inbox and chunked mark-read transactions.
- `js/engagement.js`: shared bell/count, notification panel, rating and received-feedback dialogs, collected history, focus/retry/loading/empty states and complete listener disposal.
- `css/engagement.css`: isolated theme-aware responsive panels, native star radios, focus styling and reduced motion.
- `tests/ratings.test.mjs`, `tests/engagement-emulator.mjs`, `PHASE8.md`.

Changed:
- `hostel.html`, `ngo.html`, `admin.html`: shared new stylesheet.
- `js/dashboard-gate.js`, `js/ngo-gate.js`, `js/admin-gate.js`: pass the existing shared SDK to the new component after the existing access gate succeeds.
- `js/dashboard.js`, `js/ngo.js`, `js/admin.js`: mount/dispose the shared component; add context navigation, provider scores and collected-claim rating actions.
- `js/dashboard-template.js`, `js/ngo-template.js`: live collection-history labels and accurate inbox/preview copy. Their illustrative impact charts remain clearly marked.
- `js/listings.js`, `js/claims.js`, `js/admin-data.js`: event notifications inside the existing source transactions.
- `firestore.rules`: ratings, safe score projections, event validation, own inbox/read-only content and owner-scoped Hostel claim reads.
- `README.md`, `FIREBASE_SETUP.md`, `TEST_RESULTS.md`; historical Phase 7 notice; refreshed `mealbridge.zip`.

Landing `index.html`, landing CSS, auth/onboarding/controllers, profile validation, theme/landing animation/Three.js modules, shared Firebase configuration and Storage rules are unchanged.

## Rating workflow and data

NGO collection confirmation opens the rating dialog after the claim becomes `collected`. It asks for Overall experience, Food condition and Pickup experience, each 1–5 stars, plus optional feedback (maximum 1,000 characters). It may be dismissed and resumed from completed claims or real collection history.

Hostel Impact & history now lists actual collected claims with Rate NGO, Overall experience, Pickup punctuality and Communication. No active or incomplete claim gets a rating action. Demo impact charts/achievements are unchanged; sample handoff rows and fictional historical scores were replaced with actual collections.

`ratings/{fromUserId}_{claimId}` stores the requested fields: claimId, listingId, fromUserId, fromRole, toUserId, toRole, overallRating, categoryRatings, feedback and createdAt. The deterministic ID and create-only rules enforce one rating per author per claim, independently in both directions. Server rules require the authenticated verified Google partner, saved role, matching membership and collected claim; no self-rating, arbitrary recipient, extra category, invalid stars, modification or deletion is allowed. Sender and receiving organization may read the protected rating; admin may read all. Browser text rendering never treats feedback as HTML.

NGO-to-Hostel ratings additionally contain `publicScoreId`, a random document ID. The same transaction creates:
- `ratingScores/{publicScoreId}`: only toUserId, overallRating, createdAt; authenticated NGO discovery can read these numeric projections, and Hostels can read their own received scores.
- `ratingScoreLinks/{publicScoreId}`: a private ratingId link, admin-readable only. Rules pair rating, numeric score and private link with getAfter.

The private link prevents public score document names from exposing claimant/claim IDs. Only one projection can match each protected rating. Listing cards/details show the actual average and total reviews; no scores show New Partner. Scores unavailable/loading states are distinct from zero reviews. Shared provider listeners update card text in place. No client writes mutable aggregate totals. Future trusted aggregation can replace this repository boundary without opening written feedback.

Received ratings are available from the notification panel. Admin can open All partner ratings there, with read-only sender/recipient/category/feedback context.

## Notification events and schema

`notifications/{notificationId}` has recipientId, title, message, type, relatedListingId, relatedClaimId, isRead and createdAt. All content is canonical and contains no exact pickup address, phone, private feedback or internal review note.

| Event | Recipients | Identifier |
| --- | --- | --- |
| Listing published | Publishing Hostel (receipt) | listing_LISTINGID_published |
| Food claimed | Related Hostel and claiming NGO | claim_CLAIMID_claimed_ROLE |
| Listing fully claimed | Related Hostel | claim_CLAIMID_fullyClaimed_hostel |
| NGO en route | Related Hostel and NGO (receipt) | claim_CLAIMID_enRoute_ROLE |
| Food collected | Related Hostel and NGO | claim_CLAIMID_collected_ROLE |
| Verified/rejected | Reviewed organization | Random ID paired in organizationModeration.notificationId |
| Rating received | Rated organization | rating_RATINGID |

Publishing sends an owner receipt, not an unbounded broadcast to all NGOs. A full-claim event is tied to the particular claim that exhausts stock, so it can occur again if the owner legitimately adds stock and another NGO claims it. Pending decisions and repeated identical verification decisions send no extra verification notification; a changed verified/rejected decision does.

Source data and notifications commit together. Errors leave the original form/action retryable; nothing announces success before a confirmed transaction. Rules validate canonical content, expected recipient, deterministic IDs and the actual before/after source transition, blocking fabricated standalone events and replay. Admin verification stores its one notification ID in the private moderation record to constrain its event pairing. Existing events/ratings are not backfilled automatically.

The shared bell has an unread count and accessible dialog panel. It queries only the current recipient, offers individual and all-read actions, keyboard/focus handling, retry states and “You’re all caught up.” for an empty inbox. All-read uses chunks of 100 documents. Rules allow only isRead→true for the recipient; content/recipient/timestamp edits, reset-to-unread and deletes are denied, including admin edits to another recipient's inbox. Admin may read all notifications in rules, but its bell remains scoped to its own recipient ID. Context actions open the relevant workspace panel/listing/collection or received feedback where available. New events after the initial snapshot show the existing themed toast; old messages do not flood the screen on login. Offline/cache writes are disabled, and errors preserve context. Logout removes all new dialogs/private data, subscriptions and animation instances.

## Security and scaling limits

Rules are a deployable source file, **not deployed in this phase**. Normal partners still cannot read other organizations' private profiles or pickup details. Hostel claims reads now require hostelId ownership to support history/ratings; Hostel claim writes remain denied. Existing allocation/progress pairing, listing ownership, safe verification fields and verified Google email admin allowlist remain intact.

Client-generated events are constrained to legitimate source transitions, but a modified client can omit notification side effects entirely. Rules do not guarantee delivery when a source operation is performed by old clients, Console or Admin SDK. This is explicitly not a fully trusted event delivery service. No push permissions, FCM tokens, background reminders or email are used. Future trusted Functions should generate idempotent events and securely maintain rating summaries, with a defined backfill/migration policy.

Initial queries load the current recipient's notifications and own sent/received ratings, plus own claim history. Client sorting requires only normal single-field indexes. Provider score listeners are shared per discovered provider. Large inboxes/history/review sets require bounded queries/pagination; admin All ratings currently loads the whole ratings collection only while that dialog is open. Provider aggregation transfers individual numeric review documents and is not suitable for an unlimited review history. Mark-all chunking prevents write-limit failures but does not reduce snapshot read cost. Preserve the existing NGO discovery composite index; no additional composite index or new Firebase initialization is required by Phase 8.

## Verification results

- **37 Node tests pass**: prior 35 plus real empty/average/count behavior, all role-specific category validation, integer score bounds and feedback limits.
- **344 isolated real-SDK emulator assertions pass**: 105 Phase 8, 77 claims, 64 provider Firestore/Storage and 98 admin checks. A real repository Hostel listing→NGO claim→En Route→Collected sequence creates both ratings and all eight notification types. Tests cover duplicate/member/status/self/score/category/timestamp rejection, immutable feedback/projections, private linking, own live inbox/read updates, mark-all, foreign/unfiltered/anonymous/wrong-provider denial, spoof/replay/content tampering and retained partner boundaries. Emulators use only demo-mealbridge; test SDK 12.19.0, browser CDN 12.4.0. Expected negative-test permission diagnostics and Java deprecation warnings occur; all positive workflows and test scripts exit successfully.
- Browser Firebase fixtures test the actual DOM/repositories: automatic NGO rating after collection, Hostel collected-history/category rating, retry preserving feedback, submitted/duplicate state, safe feedback text, New Partner and actual provider average, received/admin review dialogs, own recipient filtering, individual/all read, new-event count/toast, read/write failures and recovery, keyboard star arrows, Escape/focus return, live System changes, reduced-motion changes and zero subscriptions after logout.
- **24 new modal/panel viewport-theme combinations pass**: 320/390/768/1440px × Dark/Light/System for rating and notification panels, no horizontal overflow or app console errors. Desktop/mobile screenshots inspected in one batch and one confirmation. Existing provider browser regression (15 combinations), NGO (21), admin (21) and auth/onboarding suites pass with the new persistent inbox/history listeners included.
- Served through the simple local server at 127.0.0.1:8080. Real Firebase CDN initialization, singleton App/Google provider and signed-out gate pass without console errors or unnecessary Storage loading. No build/package setup exists.

## Manual acceptance outside this phase

No deployment, production sign-in or production Firestore writes were performed. Google popup/auth UI tests use controlled browser fixtures; security/data tests use actual isolated emulators. To activate this code later, the project owner must publish the updated Firestore rules and use the complete updated static folder. Keep existing Auth authorized domains, Google provider, Storage rules and discovery index.

With separate real Hostel/NGO sessions, publish a disposable listing, claim all boxes, mark En Route and Collected, submit both ratings, confirm provider score/count and recipient updates, mark individual/all read and retry duplicates/early ratings. Verify/reject a partner as the intended admin and inspect its private moderation notificationId and recipient inbox; ensure internal notes never appear there. Repeat foreign-role/privacy checks and all themes. No backfill, Functions, FCM or new billing configuration is needed by the code; collections are created by validated writes when later activated.

## Exact Phase 9 recommendation

Trusted event delivery and rating aggregation: use authenticated, idempotent server-side event handlers for these eight notification events; migrate/backfill with deterministic keys to prevent duplicate delivery; securely maintain provider rating average/count from immutable ratings; replace unbounded inbox/review queries with pagination and aggregate reads; add trusted admin Custom Claims with token refresh/revocation and App Check/abuse controls; verify retries, concurrency, replay, privacy and migrations in emulators before a separate deployment approval. Keep maps, complaints and FCM push outside that scope.
