/* Early paint only. The module repository owns all writes after content validation. */
(() => {
  const base = new URL('../../', document.currentScript.src).pathname;
  const key = `graph-learning:v1:${base}`;
  const legacyKey = `graph-learning:shell:v1:${base}`;
  let writable = true;
  let warning = '';
  let theme = 'day';
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (saved?.schemaVersion !== 1 || saved.curriculumVersion !== 1
          || !['day', 'night'].includes(saved.settings?.theme)) throw new Error('Unsupported preference');
      theme = saved.settings.theme;
    } else {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw !== null) {
        const saved = JSON.parse(legacyRaw);
        if (saved?.version !== 1 || !['day', 'night'].includes(saved.theme)) throw new Error('Invalid preference');
        theme = saved.theme;
      }
    }
  } catch {
    writable = false;
    warning = 'تنظیم نمایش ذخیره‌شده خوانده نشد. تغییر تم فعلاً فقط در همین صفحه اعمال می‌شود.';
  }
  document.documentElement.dataset.theme = theme;
  window.graphShellTheme = {
    get warning() { return warning; },
    set(next) {
      if (!['day', 'night'].includes(next)) return;
      document.documentElement.dataset.theme = next;
      if (window.graphRepository) {
        window.graphRepository.setTheme(next);
        warning = window.graphRepository.snapshot().warning;
      } else if (writable) {
        warning = 'تم فعلاً موقت است؛ پس از آماده‌شدن آموزش دوباره انتخاب کنید.';
      }
    },
  };
})();
