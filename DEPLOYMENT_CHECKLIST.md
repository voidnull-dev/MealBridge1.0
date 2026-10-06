# MealBridge deployment checklist — Phase 10

## Current verification / real-data update

[VERIFICATION_GATE.md](VERIFICATION_GATE.md) supersedes older phase instructions: 49 unit tests, 172 Firestore/Storage emulator assertions, 72 responsive/theme states and zero console/map requests/axe violations. Maps are disabled; new partners are pending until Admin approval. Deploy the updated Firestore rules/indexes and Storage rules with the frontend. No production deployment or real-account OAuth acceptance was performed. Earlier sections below are historical; do not follow their map activation or demo/access descriptions for this release.


## Current Agra update

See [AGRA_UPDATE.md](AGRA_UPDATE.md) for the current coverage/registration contract, public organization collection, index/rules activation and dry-run-first migration instructions. Current acceptance: 47 unit tests, 107 emulator assertions and 48 responsive/theme cases; four directory axe scans have zero violations. The earlier phase results below are historical. Updated rules/indexes and migration have not been deployed or run on production.


Status: configuration and local Hosting verification complete. **No rules, indexes, Storage changes, preview channel or live site deployed.** The available CLI has no accessible authenticated account in the isolated test configuration. The Hosting site has not been confirmed. Do not guess a site or deploy from an emulator project.

## 1. Console and credentials

- Confirm project **meal-f9e82**, Google provider/support email, default Firestore region/database and bucket `meal-f9e82.firebasestorage.app`.
- Enable/verify Google sign-in. Add the exact Hosting/custom hostname to Authentication → Settings → Authorized domains, plus `127.0.0.1`/`localhost` if used locally. Recheck Console values; historical phase observations are not current approval.
- Confirm Storage billing eligibility and its permission to read default Firestore for role checks. No billing changes were made here.
- Review Google Cloud API restrictions and required Firebase APIs. Do not reuse the public web key for paid/unrelated APIs. Keep privileged keys outside the static folder.
- Review schema-3 public/private location migration in PHASE9.md and retain a backup before changing production rules.

## 2. Log in and confirm the exact existing site

Use a separately installed Firebase CLI (`npm install -g firebase-tools`, if needed). This is developer tooling; do not add a package-based frontend setup.

```sh
cd <path-to-mealbridge>
firebase login
firebase projects:list
firebase hosting:sites:list --project meal-f9e82
```

Confirm with the project owner the exact **meal-f9e82 + existing SITE_ID** pair. Replace `CONFIRMED_SITE_ID` below with that approved value; it is a placeholder, not a deployable site. Do not create a new site or overwrite another application implicitly.

```sh
firebase target:apply hosting mealbridge CONFIRMED_SITE_ID --project meal-f9e82
```

This writes the target mapping to `.firebaserc`. Inspect it before continuing. No target binding is shipped in this release.

## 3. Review and publish server enforcement

```sh
firebase deploy --only firestore:rules,firestore:indexes,storage --project meal-f9e82
```

Alternatively publish the exact source files in the Firestore/Storage Console and create the matching composite index. Wait for indexes to become enabled; accept cross-service Storage permissions if prompted. Never substitute open rules to fix a test. Re-run role/privacy acceptance against the deployed rules.

## 4. Preview and manual acceptance

```sh
firebase hosting:channel:deploy phase10-review --only mealbridge --project meal-f9e82
```

Authorize the resulting preview hostname for Google Auth before sign-in testing. Validate actual response headers and payload exclusions. With real separate accounts test visitor → Google popup/cancellation, new/returning Hostel/NGO onboarding, exact admin identity, wrong-route denial, logout, listing/photo/edit/pause/cancel, competing quantity claims, private pickup access/revocation, collection → immutable ratings, recipient inbox/read, maps/search/routes and all themes. Use isolated test records and clean them up through authorized tools. Confirm third-party map consent/attribution and live tile rendering. Check Chrome/Edge, Firefox/Safari and real touch/screen-reader devices manually. Automated fixture/emulator tests do not prove live OAuth or production service readiness.

## 5. Final approved live deployment

After the preview passes and the exact target/project has been approved:

```sh
firebase deploy --only hosting:mealbridge --project meal-f9e82
```

Check all four HTML routes, wrong-role privacy, CSP, popup sign-in, Storage and indexes on the live origin. Unknown URLs must stay 404. Confirm rollback access in Hosting release history. CSP must be updated if `map-services.json` endpoints change. For unversioned assets, allow up to the configured one-day image cache interval when replacing a filename; JS/CSS/HTML revalidate.

## Broader production gates

Introduce trusted admin claims, App Check/rate controls, upload quarantine/scanning, server-maintained audit/notification/aggregate integrity and a map provider with enforceable application-wide limits/SLA. Establish retention, support contact, monitoring, backups and operational food-safety processes. These are future upgrades, not implemented Phase 10 features.
