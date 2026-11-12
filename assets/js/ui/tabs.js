import { animateFinite, motionLevel } from './motion.js';
export function initTabs() {
  let current = null, entrance = null;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activateFromHash() {
    const selected = tabs.find(tab => tab.hash === window.location.hash.split('/')[0]) ?? tabs[0];
    if (window.location.hash.split('/')[0] !== selected.hash) {
      history.replaceState(null, '', selected.hash);
    }
    const changed = selected !== current;
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
    if (changed) {
      entrance?.cancel();
      const panel = document.getElementById(selected.getAttribute('aria-controls'));
      const distance = motionLevel() === 'low' ? 0 : 8;
      entrance = animateFinite(panel,[{opacity:0,transform:`translateX(${-distance}px)`},{opacity:1,transform:'translateX(0)'}],'--motion-tab');
      for (const glass of panel.querySelectorAll('.question-card, .records-card, .teaching-progress')) {
        if (motionLevel() !== 'low') animateFinite(glass,[{backdropFilter:'blur(0px)'},{backdropFilter:'blur(var(--glass-blur))'}],'--motion-tab');
      }
      current = selected;
      document.dispatchEvent(new CustomEvent('tabchange',{detail:{id:selected.hash.slice(1)}}));
    }
    document.title = `${selected.dataset.title} | گراف‌نامه`;
  }
  for (const tab of tabs) {
    tab.addEventListener('keydown', event => {
      const current = tabs.indexOf(tab);
      // In RTL the next visual tab is to the left.
      const targets = { ArrowLeft: (current + 1) % tabs.length,
        ArrowRight: (current - 1 + tabs.length) % tabs.length,
        Home: 0, End: tabs.length - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      const next = tabs[targets[event.key]];
      next.focus();
      if (location.hash !== next.hash) location.hash = next.hash;
    });
  }
  window.addEventListener('hashchange', activateFromHash);
  activateFromHash();
}
