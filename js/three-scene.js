/* Optional hero enhancement. Local Three.js asset; CSS photography is the baseline.
   One low-power renderer, 20fps cap, shared geometry, no textures or postprocessing. */
(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || location.protocol === 'file:') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px)');
  const forced = matchMedia('(forced-colors: active)');
  const eligible = () => !reduced.matches && desktop.matches && !forced.matches &&
    !navigator.connection?.saveData && !(navigator.deviceMemory && navigator.deviceMemory < 4) &&
    !(navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
  let active = null, pending = false, failed = false, visible = false;
  const canRun = () => eligible() && visible && !document.hidden && !document.querySelector('dialog[open]');
  async function create() {
    if (pending || active || failed || !eligible()) return;
    pending = true;
    let T;
    try { T = await import('./vendor/three.module.min.js'); }
    catch (_) { pending = false; failed = true; return; }
    pending = false;
    if (!eligible() || active) return;
    let renderer;
    try {
      const context = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' }) || canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
      if (!context) { failed = true; return; }
      renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: false });
    } catch (_) { failed = true; return; }
    canvas.style.display = ''; canvas.dataset.scene = 'ready';
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, 1, .1, 20);
    camera.position.z = 7;
    const group = new T.Group(); scene.add(group);
    const positions = [];
    for (let i = 0; i < 72; i++) {
      const angle = i * 2.399, radius = 1.75 + (i % 11) * .085;
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, (i % 5 - 2) * .13);
    }
    const starsGeometry = new T.BufferGeometry();
    starsGeometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    const starsMaterial = new T.PointsMaterial({ color: 0x83d8d6, size: .018, transparent: true, opacity: .55, depthWrite: false });
    group.add(new T.Points(starsGeometry, starsMaterial));
    const box = new T.BoxGeometry(.22, .17, .22), edges = new T.EdgesGeometry(box);
    box.dispose();
    const lineMaterial = new T.LineBasicMaterial({ color: 0x54e9af, transparent: true, opacity: .4 });
    const boxes = [];
    for (let i = 0; i < 3; i++) {
      const mesh = new T.LineSegments(edges, lineMaterial), angle = i * 2.1 + .5;
      mesh.position.set(Math.cos(angle) * 2.03, Math.sin(angle) * 2.03, 0);
      mesh.rotation.set(.35, .45, angle); group.add(mesh); boxes.push(mesh);
    }
    let frame = 0, last = 0, elapsed = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
    };
    const pause = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
    const tick = time => {
      frame = 0;
      // Also check inside the loop: some browsers defer media-query events.
      if (!eligible()) { sync(); return; }
      if (!canRun()) return;
      if (!last || time - last >= 50) {
        elapsed += last ? Math.min(time - last, 100) : 50; last = time;
        group.rotation.z = elapsed * .000008;
        boxes.forEach((mesh, i) => { mesh.rotation.y = .45 + Math.sin(elapsed * .0002 + i) * .25; });
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(tick);
    };
    const colors = () => {
      const light = document.documentElement.dataset.theme === 'light';
      starsMaterial.color.set(light ? 0x176675 : 0x83d8d6);
      lineMaterial.color.set(light ? 0x096c4d : 0x54e9af);
    };
    const sizing = new ResizeObserver(resize); sizing.observe(canvas);
    active = {
      sync() { colors(); if (canRun()) { if (!frame) frame = requestAnimationFrame(tick); } else pause(); },
      pause,
      dispose() { pause(); sizing.disconnect(); renderer.clear(); starsGeometry.dispose(); edges.dispose(); starsMaterial.dispose(); lineMaterial.dispose(); renderer.dispose(); canvas.style.display = 'none'; canvas.dataset.scene = 'static'; }
    };
    resize(); active.sync();
  }
  function sync() {
    if (!eligible()) { active?.dispose(); active = null; canvas.dataset.scene = 'static'; return; }
    if (active) active.sync(); else if (canRun()) create();
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  observer.observe(canvas.parentElement);
  document.addEventListener('visibilitychange', sync); document.addEventListener('mealbridge:theme', sync);
  reduced.addEventListener('change', sync); desktop.addEventListener('change', sync); forced.addEventListener('change', sync);
  navigator.connection?.addEventListener('change', sync);
  const dialogs = new MutationObserver(sync);
  document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  window.addEventListener('pagehide', event => { if (event.persisted) active?.pause(); else { active?.dispose(); active = null; observer.disconnect(); dialogs.disconnect(); } });
  window.addEventListener('pageshow', sync);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); active?.dispose(); active = null; failed = true; });
  sync();
})();
