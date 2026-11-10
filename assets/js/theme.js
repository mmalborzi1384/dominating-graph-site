/* Small shell-only preference. No learning records are created in phase 1. */
(() => {
  const base = new URL('../../', document.currentScript.src).pathname;
  const key = `graph-learning:shell:v1:${base}`;
  let writable = true;
  let warning = '';
  let theme = 'day';
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (saved?.version !== 1 || !['day', 'night'].includes(saved.theme)) {
        throw new Error('Invalid theme preference');
      }
      theme = saved.theme;
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
      if (!writable) return;
      try {
        localStorage.setItem(key, JSON.stringify({ version: 1, theme: next }));
        warning = '';
      } catch {
        warning = 'تم تغییر کرد، اما ذخیره نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.';
      }
    },
  };
})();
