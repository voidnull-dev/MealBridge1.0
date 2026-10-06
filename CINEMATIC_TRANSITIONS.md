# Cinematic transition pass

## Implemented scenes
- Hero → problem: gentle image zoom, bounded darkening/blur, amber sweep, and a small upward headline fade while retaining readable text.
- Problem → journey: three image planes, emerald connection tail, continuous scroll-driven journey progress, and chapter reveals triggered as the line reaches each stage.
- Journey → verification: calmer dark transition, a compact rising/scaling verification symbol with soft light, horizontal text mask, and scroll-shifted photographic grain.
- Verification → Agra: scroll-drawn contour paths and a warm moving light along the existing abstract route. No map or pins.
- Impact → closing: the existing particles form readable words and now dissolve slightly downward toward the closing scene; a low emerald glow carries the atmosphere forward.
- Final scene/footer: image focus/depth, existing line-by-line headline and CTA rise, a bounded light sweep and closing-credit footer fade.
- Desktop-only thin page-progress line and understated scene labels.

## Reusable image stages
cinematic-image-stage is added to the seven existing photo containers. It combines CSS perspective, rotation capped at 1.2 degrees, small pointer translation, independent cropped planes, light reflection, moving edge shadow and vignette. The problem image has two supplemental planes; other stages have one. Existing image sources are reused, with decorative copies hidden from assistive technology. No new library or WebGL context was added.

## Performance and accessibility
- Native scrolling remains untouched: no wheel/touch interception, scroll snapping, or scroll hijacking.
- Passive scroll events schedule a single requestAnimationFrame update. Geometry is cached on setup/resize/observed size changes; the new scroll renderer does not call layout measurement methods.
- Pointer settling runs for bounded 450–500ms windows rather than a perpetual loop. Offscreen image stages skip visual updates. Hidden documents and open dialogs pause rendering; page teardown cancels frames and disconnects listeners/observers.
- Mobile and detected low-power/data-saving devices do not create duplicate image planes. Pointer depth is desktop-only. Reduced-motion restores static images/readable text and removes progress/decorative motion.
- Existing particle budgets, visibility pausing, static fallbacks and cleanup remain intact. No extra particle system.
- Text remains visible before JavaScript enhancement; scene veils are subtle and pointer-transparent. Buttons and keyboard navigation are preserved.

## Files
Added: css/cinematic-transitions.css, js/cinematic-transitions.js, CINEMATIC_TRANSITIONS.md.
Changed: index.html (loads new presentation files only), js/story-motion.js (delegates geometry/scroll work and coordinates chapter reveals), js/particle-text.js (downward exit bias only).

Pre-edit SHA-256 comparisons confirm all other existing files are unchanged. No copy, section order, button, role, Firebase, verification, rules, dashboard or backend/data changes.

## Verification
Served locally at http://127.0.0.1:8080/ and checked with Edge/Chromium browser automation.
- Seven image stages/eight decorative desktop copies; pointer changes produced measurable CSS 3D rotation and translation; hero scroll zoom verified.
- Agra moving route light, journey progression, particle gathering/settling/pointer response, and reduced-motion fallback verified.
- Mobile removes all copies and the progress rail; no horizontal overflow at 375px. Reduced-motion removes copies, disables particle canvas, and reports zero running CSS animations.
- Desktop/tablet/mobile × Dark/Light/System checked across all six story sections, plus 320px layout, registration-dialog open/Escape close and footer disclosure.
- Screenshots in ../transition-review/: desktop-depth.png, desktop-agra.png, desktop-closing.png, mobile.png. Theme/section captures remain in ../story-review/.

Automation: work/transition-review.cjs, work/story-motion.cjs, work/story-review.cjs and its JSON results. Automated browser emulation is not a physical-device frame-rate guarantee. No real account sign-in or production writes were performed during this presentation-only pass.

Final confirmation: all nine viewport/theme combinations passed with zero browser console/page errors and zero detected axe WCAG A/AA violations in scanned desktop themes. The progress label now uses a small opaque theme surface so its contrast remains readable over both photography and plain sections. Footer text contrast remains strong during its fade. Existing registration dialog open/Escape-close passed after the changes. Results: work/transition-confirm.json. Initial network-denied checks were rerun after network permission was granted.

