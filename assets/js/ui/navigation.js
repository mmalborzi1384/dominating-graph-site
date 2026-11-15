import { animateFinite } from './motion.js';

/** A small nonmodal navigation window; the five existing hash routes stay unchanged. */
export function initGraphNavigation() {
  const trigger = document.getElementById('navigation-toggle');
  const window = document.getElementById('graph-navigation');
  const closeButton = document.getElementById('navigation-close');
  const nativePopover = typeof window.showPopover === 'function';
  if (!nativePopover) window.removeAttribute('popover');
  let open = false;

  function close(restoreFocus = true) {
    if (!open) return;
    open = false;
    if (nativePopover && window.matches(':popover-open')) window.hidePopover();
    window.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  function show() {
    open = true;
    window.hidden = false;
    if (nativePopover) window.showPopover();
    trigger.setAttribute('aria-expanded', 'true');
    animateFinite(window, [
      { opacity: 0, transform: 'translateY(-8px) scale(.96)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ]);
    window.querySelector('[aria-selected="true"]').focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => open ? close() : show());
  closeButton.addEventListener('click', () => close());
  window.addEventListener('toggle', event => {
    if (event.newState === 'closed' && open) close();
  });
  window.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    close(false);
    const focusPanel = () => {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    // Hash navigation is asynchronous: focus only after the tab controller reveals the panel.
    if (location.hash.split('/')[0] !== tab.hash) {
      document.addEventListener('tabchange', focusPanel, { once: true });
      location.hash = tab.hash;
    } else {
      if (location.hash !== tab.hash) location.hash = tab.hash;
      focusPanel();
    }
  });
  document.addEventListener('keydown', event => {
    if (open && event.key === 'Escape') { event.preventDefault(); close(); }
  });
  document.addEventListener('pointerdown', event => {
    if (open && !window.contains(event.target) && !trigger.contains(event.target)) close(false);
  });
  document.addEventListener('focusin', event => {
    if (open && !window.contains(event.target) && event.target !== trigger) close(false);
  });
}
