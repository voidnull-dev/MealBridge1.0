# MealBridge

A cinematic food-rescue application connecting food providers and NGOs. Plain HTML, CSS and Vanilla JavaScript; no framework, bundler, package manifest or build step. The current update provides a real-data-only Agra network, permanent partner roles, and an Admin verification gate. Maps are temporarily suspended.

See [VERIFICATION_GATE.md](VERIFICATION_GATE.md) for the current behavior, changed files, test results and activation requirements. The frontend stays static; the optional privileged migration tool is operator-only and excluded from Hosting.

## Features

- Responsive landing page with Dark, Light and live System themes, optional Anime.js and desktop-only Three.js effects.
- Google-only authentication, role onboarding and protected Hostel, NGO and Admin workspaces.
- Provider listing wizard, owner-scoped images, live listing management and private pickup details.
- NGO discovery, transactional quantity claims, protected collection details and pickup progress.
- Admin verification/moderation, collected-claim ratings and recipient-only notifications.
- Pending/rejected organization review screens, live verification unlock/revocation, editable profiles and owner-scoped profile photos.
- Preserved map implementation, with all current map UI and external map requests disabled.

Displayed records and statistics use Firestore or truthful loading/empty states. Monthly charts count actual completed boxes; carbon is not measured. Fictional testimonials and sample records are removed.

## Stack and structure

Firebase modular SDK 12.4.0 through CDN; Bootstrap CSS, Anime.js, Three.js and Leaflet through existing CDN integrations. Local assets are preserved.

```text
mealbridge/
  index.html, hostel.html, ngo.html, admin.html
  css/                 themes, page styles, accessibility refinements
  js/                  shared auth, repositories, page controllers, maps
  assets/              images, icons, vendor assets
  tests/               optional Node and Firebase emulator acceptance
  firestore.rules, storage.rules, firestore.indexes.json
  firebase.json, .firebaserc, map-services.json
  DEPLOYMENT_CHECKLIST.md, SECURITY_AUDIT.md, PHASE10.md
```

## Run locally

From this folder:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/. Firebase requires internet and HTTP(S). Map services are disabled. Opening `index.html` directly displays the landing page with a server-required auth message. This local Python server does not apply Hosting security headers or deployment exclusions: keep it bound to loopback.

## Firebase setup and deployment

The public web configuration targets **meal-f9e82**. It is client configuration, not an authorization secret; access is enforced by rules and verified Google tokens. Never add service-account keys or OAuth secrets. Review its actual Google Cloud API restrictions before release; they cannot be certified from source code. See [Firebase's API-key guidance](https://firebase.google.com/docs/projects/api-keys).

Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Google provider, authorized domains, Firestore, Storage and indexes. The intended admin is exactly `suryanshdevniranjan@gmail.com`; server rules check verified Google identity, not a browser role badge. Source rules are not automatically deployed.

Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for the exact login, target binding, rules and Hosting commands. Firebase CLI is separate deployment tooling, not a frontend dependency. `.firebaserc` identifies the supplied project; the `mealbridge` Hosting alias intentionally has **no site binding** until the existing site is confirmed. No cloud deployment was performed.

Hosting serves the four real HTML routes without a catch-all rewrite. It excludes tests, documentation, rules, hidden files and credentials; applies CSP/security headers; and revalidates unversioned code. Update CSP allowlists when changing CDN/map endpoints.

## Maps and privacy

Leaflet attribution remains visible: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Follow [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/): no tile scraping/prefetch, no search autocomplete, explicit cached requests only. Nominatim has a module-level interval and a rate-limit cooldown, but a browser cannot enforce the service's application-wide request limit across users. Use a compliant provider/proxy with an aggregate limiter before broad release.

Public pins are coarse grid centres; exact pins/contact details are in `listingPrivate`. Only the owner, an NGO with an active claim, and the authorized admin can read them. OSRM directions are requested explicitly after claim authorization; routing/navigation sends coordinates to the selected service. Public demo services have no application SLA. Replace endpoints in `map-services.json` and update CSP together. See [PHASE9.md](PHASE9.md) for schema migration and service details.

## Verification and remaining work

```sh
node --test tests/*.test.mjs
```

No package installation is needed for these 47 tests. Optional real-SDK rules suites use isolated Firebase emulators; tooling instructions are in [PHASE4.md](PHASE4.md). The previous Phase 10 audit is historical. Current Agra acceptance passes 107 real-SDK emulator assertions, 48 responsive/theme cases, 12 role-route combinations and four clean directory axe scans. Use `tests/region-emulator.mjs` with the isolated emulators for the current coverage contract. See [PHASE10.md](PHASE10.md), [TEST_RESULTS.md](TEST_RESULTS.md) and [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for scope and limits.

Real Google account acceptance, deployed rules/indexes, live Storage, actual Hosting site approval, manual assistive-technology testing and service capacity checks remain release gates. No production records were created for verification.
