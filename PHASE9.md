# Phase 9 — maps, pickup pins and protected directions

Plain HTML/CSS/JavaScript, modular Firebase CDN SDK, Leaflet 1.9.4 CDN, OpenStreetMap raster tiles, Nominatim and OSRM. No framework, bundler, paid service, API key, Functions, push or heatmap. Existing landing/auth/themes/Storage/claims/admin/ratings/inbox behavior is retained. No production deployment or Firebase writes were performed.

## Changed files

- `hostel.html`, `ngo.html`: load the isolated map stylesheet; landing HTML remains unchanged.
- `js/dashboard.js`: integrates the pickup search/pin component in the existing third wizard step and passes validated coordinates into the existing transaction.
- `js/listing-model.js`, `js/listings.js`: derive the safe public pin and atomically save schema 3 public/private documents; reject coordinate removal from schema 3 edits.
- `js/claims.js`: discovers schema 2/3 records, combines existing filters with radius and nearest sorting using public Haversine distances.
- `js/ngo-template.js`, `js/ngo.js`: replaces the map placeholder, adds origin controls, distance filters/cards and protected active-claim route controls.
- `firestore.rules`: validates the coarse/public and exact/private pair, preserves ownership/role restrictions, and allows safe schema 2→3 upgrades without downgrade.
- `README.md`, `FIREBASE_SETUP.md`, `TEST_RESULTS.md`: current setup and acceptance notes.

New: `map-services.json`, `css/maps.css`, `js/maps.js`, `js/location-model.js`, `js/location-search.js`, `js/pickup-location.js`, `js/ngo-maps.js`, `js/routing.js`, `tests/location.test.mjs`, `tests/location-emulator.mjs`, this document.

## Use

Serve the folder on HTTP(S), e.g. `python -m http.server 8080 --bind 127.0.0.1`. Sign in to the existing role-gated workspace. Leaflet loads lazily once; the NGO workspace moves one map between discovery and its route dialog. Provider wizard maps also use a single lazily created instance. Exact private layers, routes and route cache clear on claim closure, view change or logout.

Provider: Post/Edit → step 3 → enter a public business address/locality → explicitly click Search Address → select a result → confirm city/locality, private address and pin. Drag the pin or use labeled numeric coordinate inputs as a keyboard alternative. Publishing uses the existing real listing/Storage transaction; no demo-only location write is substituted. New listings and edits through the UI require a pin. City/locality are public: do not place street addresses, gate details, names, phones or other private data in those fields or public food descriptions.

Collector: explicit Use My Location requests browser permission, or search/select a city/locality. The origin remains in memory and is never written to Firestore, localStorage or a user profile. Permission denial leaves manual area search available. Radius choices are 2/5/10/25 km or any distance; nearest/newest/expiry and existing type/quantity/urgency/verification filters combine. Select an origin first for distance filters. Missing provider pins show Distance unavailable and remain usable under Any distance; a finite radius excludes them. Cards and grouped map pins receive the same filtered records. Distances are approximate straight-line estimates, not travel distance.

After a valid active claim, View Route rechecks the claim and reads private pickup data from the server. An origin is required; choosing one inside the dialog does not send a road request until Calculate route. OSRM returns a line, kilometers and driving ETA without live traffic. Navigate to Pickup opens OpenStreetMap directions in a new tab after another fresh access check. Closed/collected/cancelled/expired/cache-only claims have no route button. Legacy records without a private pin do not offer routes. The existing exact address/contact pickup experience remains available for legitimate legacy claims.

## Data and security

`listings/{id}` schema 3 adds only:

```js
publicLocation: { city, locality, latitude, longitude }
```

Coordinates are centers of a 0.02-degree grid cell (~2.2 km north/south; longitude distance varies). A coincident exact cell-center pin shifts to an adjacent coarse latitude cell so the published pair never equals the exact pair. Approximation is a visibility reduction, not a guarantee of anonymity; dense/sparse geography and public organization names can identify an area. Do not store sensitive addresses in public labels.

`listingPrivate/{id}` adds:

```js
exactLocation: { address, latitude, longitude }
```

The existing `exactAddress` is retained as the same private address for earlier consumers; contactPerson, contactPhone and additionalPickupInstructions stay private. Runtime recomputes public coordinates rather than trusting submitted `publicLocation`. Rules validate coordinate bounds, strict field allowlists, exactAddress equality and the same coarse-cell formula with `getAfter` pairing. Normal NGOs cannot write location fields; other providers cannot read/write private owner details. Private reads require owner Hostel, authorized Admin, or the claiming NGO with a currently active, uncancelled, unexpired claim. Public discovery still requires authenticated NGO predicates and never returns legacy schema 1 documents. Existing atomic stock/progress rules are unchanged in capability; update dispatch avoids duplicate checks that exceed Firestore's expression budget.

Schema 2 remains supported during migration. It has city-only public information and no coordinates; it cannot acquire coordinates without upgrading to schema 3. Older injectable repository clients can still create schema 2 during this compatibility window. The shipped UI always creates schema 3. Providers upgrade existing active records by editing and selecting a pin; no production backfill or bulk geocoding is performed. After a measured provider migration, a later security phase can require schema 3 on every new write. No schema 3→2 downgrade is authorized. Existing schema 1 Secure pickup details migration remains intact.

Firestore rules cannot infer whether a text label contains confidential street information. The field restrictions/coarse coordinate validation protect the defined schema; provider content guidance remains necessary. Prior downloaded data cannot be retroactively erased by revocation. Rule updates must be deployed alongside activation of the refreshed frontend.

## Public-service safeguards

- Nominatim: explicit Search Address/Enter, 1-second input debounce without automatic fetches; normalized memory cache (50 queries), concurrent identical-request deduplication, serial queue and ≥1.1-second request spacing. Web Locks and a timestamp coordinate cooperating same-origin tabs. No bulk/reverse geocoding, no listing auto-geocoding, no names/contact details in queries. Browser supplies a valid origin Referer. Errors/timeouts preserve manual pin adjustment and retry. Search results are rendered as text.
- **The static client cannot enforce Nominatim's aggregate one-request-per-second limit across unrelated users.** This configuration is suitable for a modest pilot only. Before broader public traffic, use a shared rate-limited gateway or self-hosted geocoder. The public endpoint must be replaceable; `map-services.json` can change geocoder/router/tile/CDN URLs without a JavaScript release. Do not disable Referer with a deployment header.
- OSRM: explicit route actions only, memory route cache, serial requests, timeout/abort and no polling. Normal map/card/countdown updates never request directions. Active-claim destinations are shared with public OSRM only for road directions; navigation shares origin/destination with OpenStreetMap. Both services may log requests and have no uptime/traffic guarantees. HTTPS third-party tiles reveal the viewed map area to the tile host; search queries reveal the searched public address to Nominatim.
- OSM: HTTPS standard raster URL, visible attribution under every map and in Leaflet, normal browser caching, no prefetch/offline/bulk tile download. Scroll-wheel zoom is disabled; mobile page scrolling stays usable. Dark styling affects the tile pane only. Marker grouping is by identical public coarse cells, not a heatmap. Semantic search controls, keyboard markers/zoom, native dialogs, numeric pin inputs and reduced-motion map behavior are provided.

Policies and documentation: [Nominatim](https://operations.osmfoundation.org/policies/nominatim/), [OSM tiles](https://operations.osmfoundation.org/policies/tiles/), [OSRM API](https://project-osrm.org/docs/v5.24.0/api/), [Leaflet](https://leafletjs.com/reference.html). Repeat automated UI tests substitute tile/API responses to avoid public-service load.

## Verification and activation

41 Node tests and 388 real-SDK Firestore/Storage emulator assertions pass. Phase 9 adds 44 emulator assertions for real repository coordinate creation/editing, constrained public queries, owner/admin/claimant reads, preclaim/foreign/NGO-write denial, public/exact tamper rejection, bounds/coincident centers and access revocation. The existing 344 assertions pass again.

Actual DOM/repository browser tests use isolated Firebase fixtures, real Leaflet and controlled tiles/geocoder/router responses. Passed explicit/cached/deduplicated/throttled search, keyboard popup/privacy, geolocation denial/success, combined radius/card/pin updates, claim→route→ETA/polyline/navigation, route cancellation/access revocation, real provider transaction payload/private pin drag/manual adjustment, service errors, CDN failure/retry/singleton, logout cleanup and live System/reduced-motion behavior. 36 new 320/390/768/1440px × Dark/Light/System map/route/wizard combinations pass without overflow. One batched visual inspection and one confirmation completed. Existing provider (15), NGO (21), admin (21) and auth browser regressions pass; normal paths have no app console errors. Intentional blocked-CDN/503 tests show handled browser network diagnostics.

A bounded live browser check from the local server loaded Leaflet 1.9.4, fetched two Pune Nominatim results, and requested an OSRM public-coordinate route (2.9565 km, 4 min, 163 line points). No credentials or production Firebase writes were used. Repeat responsive/visual QA used fixture tiles, not automated live OSM tile downloads. Live public OSM tile rendering and fully signed-in production flow remain manual acceptance items.

Activate manually: publish `firestore.rules` in Firebase Console; confirm the existing discovery composite index is built (schemaVersion/status/isPaused/availableBoxes, same fields support the new `in` query); serve updated files on an authorized HTTPS domain; validate public service policies/volume; then test separate real provider/NGO/Admin sessions. Create/edit a pin, inspect both documents, test denial before claim, claim and route/navigation, expiry/cancellation/collection revocation, all themes and denied location permissions. No new Storage rules, keys, billing, collections setup or Firebase initialization is required.

Reproduce local security tests using external emulator tooling as described in earlier phase documents: run `node tests/location-emulator.mjs && node tests/engagement-emulator.mjs && node tests/claims-emulator.mjs && node tests/security-emulator.mjs && node tests/admin-emulator.mjs` inside `emulators:exec --project demo-mealbridge --config firebase.emulators.json --only firestore,storage`, with `MEALBRIDGE_TEST_TOOLS` pointing to external test dependencies. No dependencies enter the static deliverable.

## Exact recommended Phase 10

Production security and operational reliability only: trusted Admin Custom Claims, App Check, a shared policy-compliant geocoder gateway/self-hosted service with global rate limiting and cache, bounded/paginated listing discovery with validated coarse location migration, and trusted idempotent notification/rating projection generation. Add real-account staging acceptance, abuse/timeout observability and keyless service fallback configuration. Preserve this UI and existing workflows; exclude heatmaps, FCM push and unrelated new features until separately scoped.
