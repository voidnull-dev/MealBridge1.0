export function icon(name) {

  const paths={overview:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',box:'m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 4 9-4M12 11v10',impact:'M4 20V12h4v8M10 20V8h4v12M16 20V3h4v17',settings:'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',leaf:'M5 19C1 9 9 3 20 3c0 11-6 19-15 16ZM5 19l9-9',check:'m5 12 4 4L19 6',arrow:'M5 12h14M13 6l6 6-6 6',plus:'M12 5v14M5 12h14',menu:'M4 7h16M4 12h16M4 17h16',clock:'M12 6v6l4 2',logout:'M9 3H4v18h5M9 12h12M16 7l5 5-5 5'};

  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${name==='clock'?'<circle cx="12" cy="12" r="9"/>':''}${name==='settings'?'<circle cx="12" cy="12" r="5"/>':''}<path d="${paths[name]||paths.box}"/></svg>`;

}

export function dashboardTemplate(){return `

<aside class="db-sidebar" id="db-sidebar" aria-label="Workspace sidebar">

 <a class="brand" href="index.html"><img src="assets/icons/mark.svg" alt="">MealBridge<span>.</span></a>

 <p class="db-sidebar-purpose">Turning Surplus into Support.</p>

 <nav class="db-nav" aria-label="Hostel workspace"><button data-panel="overview" aria-current="page">${icon('overview')}<span>Overview</span></button><button data-panel="listings">${icon('box')}<span>My listings</span><span class="db-nav-count">—</span></button><button data-panel="impact">${icon('impact')}<span>Impact & history</span></button><button data-panel="settings">${icon('settings')}<span>Profile & settings</span></button></nav>

 <div class="db-sidebar-bottom"><div class="db-sidebar-note">Good food.<br><strong>Greater purpose.</strong>${icon('leaf')}</div><a href="index.html">Back to the landing page ${icon('arrow')}</a><button data-signout>${icon('logout')} Sign out</button></div>

</aside>

<button class="db-menu-scrim" id="db-menu-scrim" aria-label="Close workspace menu" hidden></button>

<div class="db-body">

 <header class="db-topbar d-flex align-items-center"><button class="icon-button db-menu-toggle" id="db-menu-toggle" aria-label="Open workspace navigation" aria-controls="db-sidebar" aria-expanded="false">${icon('menu')}</button><span class="db-workspace-label">Food Provider Workspace</span><div class="db-topbar-actions"><label class="sr-only" for="db-theme">Color theme</label><select id="db-theme" class="db-theme-select"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select><span class="db-avatar" id="db-avatar" aria-hidden="true">RS</span><span class="db-account-name" id="db-account-name"></span></div></header>

 <main id="dashboard-main" tabindex="-1" class="db-main">

  <div class="db-demo-banner">${icon('box')}<p><strong>Your surplus, connected.</strong> Listings sync securely to your account. Only your actual listings and collections appear here.</p><span>LIVE</span></div>

  <section data-section="overview" aria-labelledby="overview-title">

   <div class="db-section-title"><div><h1 id="overview-title">Good food starts here<span>.</span></h1><p id="db-greeting">Welcome back. Let’s give surplus a second purpose.</p></div><button class="button primary" data-post>${icon('plus')} Post Surplus Food</button></div>

   <div class="db-stats"><article class="db-stat"><span>Active Listings</span><strong data-stat="active">—</strong><small>Ready for the next connection</small></article><article class="db-stat"><span>Available Food Boxes</span><strong data-stat="boxes">—</strong><small>Good food, ready to go</small></article><article class="db-stat"><span>Boxes Collected This Month</span><strong data-stat="meals">Not measured</strong><small>Completed claims · calendar month</small></article><article class="db-stat"><span>CO₂ Avoided</span><strong><span data-stat="co2">Not measured</span></strong><small>No carbon methodology configured</small></article><article class="db-stat"><span>Completed Collections <button class="db-info" type="button" aria-label="About collection success" aria-describedby="success-tip">i<span id="success-tip" role="tooltip">Count of actual claims marked collected.</span></button></span><strong><span data-stat="success">Not measured</span></strong><small>From your completed claims</small></article></div>

   <div class="db-overview-grid"><div class="db-panel db-rescue-callout"><div class="db-callout-mark">${icon('leaf')}</div><h2>One box.<br>A better tomorrow.</h2><p>There’s possibility in what’s left over. Start with the details. We’ll preview the rest.</p><button class="db-text-button" data-post>Post your surplus ${icon('arrow')}</button></div><div class="db-panel db-snapshot"><div class="db-panel-heading"><h2>Your next pickups</h2><span class="db-muted">Live collection history</span></div><ul class="db-pickups"><li><p>Actual collection activity appears in Impact & history.</p></li></ul><button class="db-text-button" data-panel="listings">View your listings ${icon('arrow')}</button></div></div>

   <div class="db-panel-heading db-list-heading"><h2>A little surplus. Real possibility.</h2><button class="db-text-button" data-panel="listings">All listings ${icon('arrow')}</button></div><div id="db-featured-listings" class="db-featured-listings"></div>

  </section>

  <section data-section="listings" aria-labelledby="listings-title" hidden>

   <div class="db-section-title"><div><h1 id="listings-title">Your listings<span>.</span></h1><p>Your surplus, from kitchen to community. Synced to your food provider account.</p></div><button class="button primary" data-post>${icon('plus')} Post Surplus Food</button></div>

   <div class="db-list-tools"><div class="db-list-filters" role="group" aria-label="Filter listings"><button data-list-filter="all" aria-pressed="true">All listings</button><button data-list-filter="active" aria-pressed="false">Active</button><button data-list-filter="completed" aria-pressed="false">Closed & paused</button></div><label class="db-search"> <span class="sr-only">Search your food listings</span><input id="db-search" type="search" placeholder="Search food…" maxlength="80"></label></div>

   <p class="db-list-count" id="db-list-count" role="status" aria-live="polite">Connecting your listings…</p><div id="db-list-error" class="db-data-error" role="alert" hidden></div><div id="db-listings" class="db-listings"></div>

   <div id="db-list-empty" class="db-empty" hidden>${icon('box')}<h2>Room for the next good thing.</h2><p id="db-empty-copy">No food listings have been posted yet.</p><button class="button secondary" id="db-clear-filters">Clear filters</button><button class="button primary" data-post>Post Surplus Food</button></div><button class="db-text-button db-reset" id="db-retry-listings" hidden>Retry connection ${icon('arrow')}</button>

  </section>

  <section data-section="impact" aria-labelledby="impact-title" hidden>

   <div class="db-section-title"><div><h1 id="impact-title">Every meal matters<span>.</span></h1><p>Completed collections from your account.</p></div><span class="db-pill">Live records</span></div>

   <figure class="db-panel db-chart"><div class="db-panel-heading"><h2 id="db-chart-title">Monthly boxes collected</h2></div><div id="db-chart"></div><figcaption>No invented carbon, waste, or meal measurements. Collection records below come directly from Firestore.</figcaption><div id="db-chart-data" class="sr-only"></div></figure>
   <div class="db-panel db-history"><div class="db-panel-heading"><h2>Recent collection history</h2><span class="db-muted">Live collections</span></div><div id="db-history"></div></div>

  </section>

  <section data-section="settings" aria-labelledby="settings-title" hidden>

   <div class="db-section-title"><div><h1 id="settings-title">Your place in the bridge<span>.</span></h1><p>Account identity comes from your profile. Settings below are a session-only preview.</p></div></div>

   <div class="db-settings-grid"><div class="db-panel db-identity"><span class="db-avatar" id="settings-avatar" aria-hidden="true"></span><h2 id="settings-name"></h2><p id="settings-email"></p><span class="db-pill" id="settings-verification"></span><p class="db-settings-note">Verification is separate from Google sign-in. Your verification status is reviewed by the administrator.</p><button class="button secondary" data-signout>${icon('logout')} Sign out</button></div>

   <form id="db-settings-form" class="db-panel db-settings-form"><h2>Organization & collection</h2><div class="db-form-grid"><div class="db-field"><label for="setting-org">Organization name</label><input id="setting-org"  required maxlength="160"></div><div class="db-field"><label for="setting-city">City</label><input id="setting-city" value="Agra" readonly required maxlength="120"></div><div class="db-field"><label for="setting-contact">Contact person</label><input id="setting-contact"  required maxlength="100"></div><div class="db-field"><label for="setting-phone">Phone</label><input id="setting-phone" type="tel"  required maxlength="32"></div><div class="db-field db-field-wide"><label for="setting-pickup">Pickup location</label><input id="setting-pickup" value="Choose an Agra pickup location when posting" required maxlength="240"></div></div><h3>Notification preferences</h3><label class="db-switch"><span>Pickup reminders<small>Before a scheduled collection</small></span><input type="checkbox" name="pickups" checked role="switch"></label><label class="db-switch"><span>Expiry alerts<small>When a pickup window is closing</small></span><input type="checkbox" name="expiry" checked role="switch"></label><label class="db-switch"><span>Impact updates<small>A monthly view of rescued meals</small></span><input type="checkbox" name="impact" role="switch"></label><div class="db-field db-theme-setting"><label for="settings-theme">Theme preference</label><select id="settings-theme"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System Default</option></select></div><button class="button primary" type="submit">Save session preferences</button><p class="db-settings-note">These preview preferences do not alter in-app delivery or your profile. Account updates appear in your inbox; your theme choice persists across reloads.</p></form></div>

  </section>

  <footer class="db-footer"><span>Built for a zero-waste future.</span><span>MealBridge · Food Provider</span></footer>

 </main>

</div>

<dialog id="surplus-wizard" class="db-dialog" aria-labelledby="wizard-title"><div class="db-wizard-shell"><button type="button" class="icon-button db-dialog-close" data-wizard-close aria-label="Close surplus wizard">×</button><div class="db-wizard-heading"><h2 id="wizard-title" tabindex="-1">Give good food a second purpose.</h2><p id="wizard-intro">Review the details before publishing to your account.</p></div><nav class="db-wizard-steps" aria-label="Surplus form steps"><button type="button" data-wizard-step="0" aria-current="step"><span>1</span>Food details</button><button type="button" data-wizard-step="1" disabled><span>2</span>Quantity & timing</button><button type="button" data-wizard-step="2" disabled><span>3</span>Pickup & publish</button></nav>

 <form id="surplus-form"><fieldset data-wizard-page="0"><legend class="sr-only">Food details</legend><div class="db-form-grid"><div class="db-field db-field-wide"><label for="food-name">Food name</label><input id="food-name" name="name" required minlength="2" maxlength="120" placeholder="e.g. Rice, dal & seasonal vegetables"></div><div class="db-image-field db-field-wide"><img id="food-image-preview" src="assets/images/hero-meal.jpg" alt="Default food photo" width="600" height="240"><label class="db-image-placeholder" for="food-image">${icon('box')}<strong>Add a food photo</strong><span>JPG, PNG, or WebP · smaller than 5 MB · optional</span><input id="food-image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="food-image-status"></label><div class="db-image-actions"><span id="food-image-status" role="status">Default food photo</span><button type="button" id="food-image-remove" class="db-text-button" hidden>Use default photo</button></div></div><div class="db-field"><label for="food-type">Food type</label><select id="food-type" name="type" required><option value="Veg">Veg</option><option value="Non-Veg">Non-Veg</option><option value="Mixed">Mixed</option></select></div><div class="db-field"><label for="food-packing">Packing condition</label><select id="food-packing" name="packing" required><option value="">Select packing condition</option><option>Sealed food-safe boxes</option><option>Individually wrapped portions</option><option>Covered food-safe containers</option></select></div><div class="db-field db-field-wide"><label for="food-allergens">Allergen information</label><input id="food-allergens" name="allergens" required maxlength="200" placeholder="List known allergens, or enter None declared"></div></div><label class="db-checkbox"><input type="checkbox" name="hygiene" required><span>I confirm the food was prepared, handled, and packed hygienically.</span></label><p class="db-settings-note">Provide accurate packing and allergen details. Publishing does not certify food safety.</p></fieldset>

 <fieldset data-wizard-page="1" hidden><legend class="sr-only">Quantity and timing</legend><div class="db-form-grid"><div class="db-field"><label for="food-boxes">Number of boxes</label><input id="food-boxes" name="boxes" type="number" min="1" max="500" step="1" required value="12"></div><div class="db-field"><label for="food-meals">Approximate meals per box</label><input id="food-meals" name="meals" type="number" min="1" max="50" step="1" required value="4"></div><div class="db-field"><label for="food-ready">Ready-for-pickup time</label><input id="food-ready" name="ready" type="datetime-local" required></div><div class="db-field"><label for="food-expiry">Expiry / collection deadline</label><input id="food-expiry" name="expiry" type="datetime-local" required></div></div><div class="db-expiry-preview"><span>Live window preview</span><strong id="wizard-window"></strong><p id="wizard-expiry-label"></p><small id="wizard-timezone"></small></div><p class="db-settings-note">Times use your device’s local timezone. This window is a visual preview, not a food-safety recommendation.</p></fieldset>

 <fieldset data-wizard-page="2" hidden><legend class="sr-only">Pickup and publish</legend><div class="db-form-grid"><div class="db-field db-field-wide"><label for="food-city">City</label><input id="food-city" name="city" required minlength="2" maxlength="120" placeholder="Pickup city"></div><div class="db-field db-field-wide"><label for="food-pickup">Pickup location</label><input id="food-pickup" name="location" required minlength="5" maxlength="240" placeholder="Address, gate, and pickup instructions"></div><div class="db-field db-field-wide"><label for="food-contact">Contact person</label><input id="food-contact" name="contact" required minlength="2" maxlength="100" placeholder="Person coordinating the handoff"></div><div class="db-field db-field-wide"><label for="food-notes">Notes for NGO <span class="db-muted">(optional)</span></label><textarea id="food-notes" name="notes" rows="3" maxlength="500" placeholder="Anything a collector should know"></textarea></div></div><div class="db-listing-preview"><img id="listing-image-preview" src="assets/images/hero-meal.jpg" alt="Default food photo" width="600" height="240"><span class="db-pill">Listing preview · not published</span><h3 id="preview-name"></h3><p id="preview-details"></p><p id="preview-allergens"></p><p id="preview-pickup"></p></div></fieldset>

 <div id="wizard-upload" class="db-upload-state" hidden><label for="upload-progress" id="upload-label">Uploading food photo…</label><progress id="upload-progress" max="100" value="0"></progress><p id="upload-message" role="status">Preparing upload…</p></div><p id="wizard-error" class="db-form-error" role="alert" hidden></p><div class="db-wizard-actions"><button type="button" class="button secondary" id="wizard-back">Back</button><span id="wizard-step-label">Step 1 of 3</span><button type="button" class="button primary" id="wizard-next">Continue ${icon('arrow')}</button><button type="submit" class="button primary" id="wizard-publish" hidden>Publish Listing ${icon('arrow')}</button></div><div id="wizard-toast" class="db-toast-inline" role="status" aria-live="polite"></div>

 </form></div></dialog>

<dialog id="cancel-listing" class="db-dialog db-confirm" aria-labelledby="cancel-title"><div class="db-wizard-shell"><h2 id="cancel-title">Cancel this listing?</h2><p>The listing will be marked cancelled and cannot be made available again. Its record stays in your account.</p><p id="cancel-error" class="db-form-error" role="alert" hidden></p><div class="db-confirm-actions"><button class="button secondary" id="cancel-keep">Keep listing</button><button class="button primary" id="cancel-confirm">Cancel listing</button></div></div></dialog>

<div id="db-toast" class="db-toast-region" role="status" aria-live="polite" aria-atomic="true"></div>

`;}

