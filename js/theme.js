/* Runs before paint. Classic scripts support direct file:// use. */
(() => {
  const media = matchMedia('(prefers-color-scheme: light)');
  let preference = 'dark';
  try { preference = localStorage.getItem('mealbridge-theme') || 'dark'; } catch (_) {}
  if (!['dark', 'light', 'system'].includes(preference)) preference = 'dark';
  function apply(choice) {
    preference = choice;
    const resolved = choice === 'system' ? (media.matches ? 'light' : 'dark') : choice;
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#050505' : '#f5f6f1');
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice)));
    document.dispatchEvent(new CustomEvent('mealbridge:theme', { detail: resolved }));
  }
  apply(preference);
  media.addEventListener('change', () => { if (preference === 'system') apply('system'); });
  window.MealBridgeTheme = { get preference() { return preference; }, set(choice) { if (!['dark','light','system'].includes(choice)) return; apply(choice); try { localStorage.setItem('mealbridge-theme', choice); } catch (_) {} } };
})();
