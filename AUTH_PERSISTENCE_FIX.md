# Authentication and profile persistence repair

## Behavior
- Firebase initialization awaits `setPersistence(auth, browserLocalPersistence)`. Storage failure produces an actionable error instead of silently switching to memory-only sessions.
- `onAuthStateChanged` restores the authenticated UID, then `getDoc(doc(db, 'users', uid))` reads that exact profile. Reads perform no migrations, transactions, organization writes or role resets.
- Cached/pending snapshots are not treated as confirmed profile presence or absence. Failed reads keep the user signed in and show “We could not load your MealBridge profile. Check your connection and try again.” with “Retry Profile Connection”.
- Only a confirmed missing profile opens first-time onboarding. The intended verified administrator bootstraps an Admin profile only when missing and never sees the partner form.
- Registration atomically checks the UID profile and organization before creating them. Concurrent/repeated calls return the existing profile; they never overwrite it or its organization. New profiles include onboardingCompleted:true, server timestamps, Agra coverage, and pending/unverified partner status.
- Completed profiles redirect immediately from the landing page using location.replace. Admin goes to admin.html. Hostel/NGO go to their saved role's page, whose existing gate displays Verification Pending, Verification Needs Attention, or the approved dashboard from the saved status. Refresh re-reads the same profile.
- Existing valid profiles without the new completion flag are recognized as completed in memory, without writes. Explicitly false/invalid completion flags, malformed profiles, and an intended administrator with a conflicting stored partner role fail safely for support; they are not re-registered or silently overwritten.
- Safe contact/organization edits remain atomic partial updates. No login path calls setDoc or performs replacement writes. Roles, identity, timestamps, region and approval remain protected.

## Rules
Own Google-authenticated profile reads remain permitted. Creation requires onboardingCompleted:true and the existing identity, Agra, pending-status and organization-pair checks. Firestore create/update separation prevents repeating initial creation over an existing document.

Owner updates allow only safe contact/organization fields. Removed the client-side region-migration and admin-role-promotion exceptions. A request for another review can update the request timestamp and safe details, but cannot reset rejection to pending or change isVerified. Only the existing server-enforced administrator authorization can change approval. There are no open production rules.

## Files changed
- js/firebase-config.js
- js/profiles.js
- js/auth.js
- js/onboarding.js
- js/partner-gate.js
- js/admin-gate.js
- index.html (retry wording only)
- firestore.rules
- tests/auth.test.mjs
- AUTH_PERSISTENCE_FIX.md (new report)

## Verification
- 54 unit tests passed, including cache-miss safety, failed-read retry, returning-admin no-write behavior, legacy profiles and repeated completion protection. All 19 auth tests also passed after the final completion-flag guard.
- Firestore emulator: 75 repository/rules assertions passed, covering own reads, creation, repeated reads/creates, safe edits, approval states, legacy no-write reads, forbidden identity/role/approval/region changes and duplicate replacement denial.
- Additional emulator transaction test passed: concurrent role selections produce one saved permanent role. Re-review requests preserve rejected status and isVerified:false.
- Browser used the actual Firebase modular Auth/Firestore SDK against isolated demo-mealbridge emulators. Hostel and NGO registered once, and Admin bootstrapped once. Reload, landing-page return, sign-out/sign-in and full Edge browser close/reopen restored the same UID and unchanged saved fields.
- Pending, rejected and verified Hostel/NGO states routed correctly. Admin restored directly to its dashboard.
- A deliberately failed profile read showed retry, kept authentication and never showed onboarding. Retry then restored the Admin dashboard.
- Repeat-login run ended with exactly 3 users and 2 organizations; no duplicate documents. Normal browser console/page errors: zero.

These were emulator-backed Google identities; the Google OAuth consent popup was replaced by an emulator Google credential in the test adapter. No production accounts, production Firestore data or production rules were modified. Emulator verification does not claim a live Google OAuth deployment test.

Evidence: workspace work/persistence-browser.cjs and persistence-browser-results.json; work/rules-tools/auth-persistence-check.mjs and auth-race-check.mjs. Local site served at http://127.0.0.1:8080/.

## Deployment required
Deploy the updated firestore.rules before using updated registration against production; the older rules do not allow onboardingCompleted. Deploy the changed static files together. Existing completed profiles need no re-registration or bulk overwrite. Historical profiles with missing region data or conflicting administrator roles require an explicit trusted maintenance action, not automatic changes during login.

Browser persistence is origin-specific and requires browser storage. Use the same site origin when checking restoration; localhost and 127.0.0.1 are different origins. Private browsing or cleared site data cannot preserve a session across browser closure.

References: [Firebase Auth persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [Firestore offline/cache behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
