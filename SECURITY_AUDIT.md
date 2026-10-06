# MealBridge security audit — Phase 10

Source and isolated emulator audit, 4 October 2026. Rules remain undeployed. UI gating is a convenience; server rules enforce data access. No fully open production rule exists. Security acceptance: **391 real-SDK emulator assertions pass**, including three new notification privacy checks.

| Collection/path | Enforced boundary |
| --- | --- |
| users | Own verified Google identity; safe profile fields; partner roles immutable; exact allowlisted admin can review/verify. No self promotion. |
| listings | Provider owns creation/management. NGO discovery restricted to eligible public records. NGO stock mutation only in the atomic, validated claim allocation; no standalone or arbitrary provider-field update. |
| listingPrivate | Owner, authorized admin, or NGO with a currently valid active claim; no public address/contact/exact coordinate reads. |
| claims | NGO identity derives from token; exact quantities/counters are coupled transactionally; participants see their records; valid progress states only. |
| ratings | Participants of collected claims only; deterministic identity and immutable records prevent repeats. |
| ratingScoreLinks / ratingScores | Validated collected-claim rating links and numeric score contributions; private review prose is not exposed as discovery data. |
| notifications | Recipient only for reads and mark-read, including admin; supported atomic events and field restrictions govern creation. |
| organizationStatus | Minimal partner verification projection; exact admin controls updates. |
| organizationModeration / adminActivity | Exact admin only; activity append-only, narrowly validated writes. |
| Storage listing-images/{uid}/... | Verified Google provider owner; new unique object only, role/path/metadata checks, JPEG/PNG/WebP MIME/extension, size strictly below 5 MiB; owner cleanup only. |
| unmatched paths | Deny all. |

## Corrections

- Removed the admin exception from notification reads: administrators cannot inspect another user's inbox. New tests cover foreign get/list denial and own recipient reads.
- Kept all existing ownership, claim pairing, valid progress, private location and rating constraints; no testing bypass was added.
- Documented the distinction between metadata validation and trusted image-byte validation in Storage rules.
- Added Hosting CSP, framing denial, MIME sniffing protection, popup-compatible COOP, privacy-aware referrer policy and restricted device permissions. Deployment payload excludes rules, tests, docs, hidden files and credentials.

## Limits and release gates

Current admin authorization checks `google.com`, a verified token email and exactly `suryanshdevniranjan@gmail.com`. A stored `admin` badge alone confers no privileges. Migrate to privileged-server-issued Custom Claims before expanding administrators; never issue claims from a browser. Review administrator account protection separately.

Rules cannot examine image bytes. The regular UI checks signatures and image decoding, but a modified authenticated client can forge MIME metadata. Use a trusted scanning/quarantine pipeline before accepting arbitrary public uploads. Storage download tokens are bearer URLs; do not upload confidential documents or describe listing photos as access-controlled private content.

Supported operations pair events/counters/ratings with validated writes. A modified client can still omit optional client-generated audit/notification operations. Trusted Functions and server-maintained aggregates are stronger; no server backend was added. Client time controls visual expiry while rules validate server-side operation timing.

Public discovery intentionally exposes coarse location cells and food/provider details, not exact pickup coordinates. Explicit routes/navigation disclose exact coordinates to the routing service only after authorization. Nominatim throttling is per browser module, not a global application limiter; public demo infrastructure is appropriate for controlled demonstrations only. Partner/admin queries can grow with data; pagination and resource budgets need a later scale review.

The supplied Firebase API key is public client configuration, not a secret. Source scanning found no service-account keys, private-key blocks or OAuth client secrets in the application. Its deployed Google Cloud restrictions cannot be verified here: inspect them before release. See [Firebase API-key guidance](https://firebase.google.com/docs/projects/api-keys) and [security checklist](https://firebase.google.com/support/guides/security-checklist). Enable appropriate App Check, abuse monitoring, retention and backups later. A source audit and local emulators are not a production penetration test.
