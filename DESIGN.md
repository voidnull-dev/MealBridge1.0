# MealBridge visual system

## Landing: one meal, a second purpose
The landing page is an editorial scroll story for Agra's food providers and NGOs. Preserve the full-screen Indian-food photo hero and “Turn Leftover Meals into Impact.” headline. Follow it with six open scenes: the human problem, a three-chapter journey, verification, Agra-first coordination, a single particle-text moment, and registration.

Use oversized Manrope headings, DM Sans prose, asymmetric photographic crops, full-width scenes and clear reading rhythm. Do not restore bento grids, repeated feature cards, fake metrics, or testimonials. The sequence numbers 01–03 identify actual journey stages; they are not ornamental section labels.

The palette remains midnight navy, warm offwhite, emerald, forest, and restrained mint/amber. Light mode uses ivory and dark forest ink; photographic hero, trust, and closing scenes retain dark overlays for legibility. System follows the OS.

## Landing motion
`js/story-motion.js` stages the photo mask and headline lines, then supporting copy and actions with slow easing rather than bounce. Section headings move from a modest blur to focus, images receive bounded desktop parallax, and a continuous line draws in proportion to journey scroll progress. It does not hijack scrolling or conceal content pending JavaScript.

`js/particle-text.js` is preserved: one irregular particle field resolves into crisp readable glyphs, reacts locally to the pointer, and dissolves with scrolling. Semantic non-canvas text remains the accessible source. Rendering stops at rest/offscreen, pauses for hidden documents/dialogs, and disables itself for mobile, reduced-motion, data-saving, forced-colors, and detected low-power devices. Maximum 2,600 particles, 30fps and 1.25 DPR.

## Operate surfaces
Hostel, NGO and Admin keep their existing structure, behavior and cinema.css styling. The new `css/story.css` is loaded only by index.html. Dashboard HTML, CSS, JS, authentication, verification, Agra coverage and backend logic are outside this landing redesign.

## Files and affordances
`css/cinema.css` retains shared tokens and the existing hero. `css/story.css` owns only the editorial landing composition. The landing uses story-motion.js instead of the earlier animations.js; operational files are unchanged. Navbar, theme menu, footer disclosures, native auth dialog and role-specific CTAs retain their existing handlers. main.js no longer maintains the removed closing role-picker UI; role-specific links still use onboarding.js's existing data-role handling.

Use visible keyboard focus, semantic headings, readable image overlays, native dialogs and static fallbacks. Keep actual product facts separate from illustrative photography; see assets/images/PHOTO_CREDITS.md.
