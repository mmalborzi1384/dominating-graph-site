/** Decorative graph world. No graph answers or persistent learner state live here. */
export function initGraphWorld() {
  const canvas = document.createElement('canvas');
  canvas.className = 'graph-world';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, points = [], colors, pointer = null;
  let frame = 0, last = 0, time = 0, progress = 0;
  const running = () => !reduced.matches && root.dataset.motion !== 'off' && !document.hidden;
  function palette() {
    const style = getComputedStyle(root);
    colors = ['--world-line', '--world-accent'].map(name => style.getPropertyValue(name).trim());
  }
  function resize() {
    width = document.documentElement.clientWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Staggered, deterministic positions: resizing never introduces random flashes.
    const cols = width < 640 ? 4 : 8, rows = 7;
    points = Array.from({length: cols * rows}, (_, i) => ({
      x: ((i % cols) + .15 + (Math.sin(i * 12.7) + 1) * .32) / cols,
      y: (Math.floor(i / cols) + .15 + (Math.cos(i * 7.3) + 1) * .32) / rows,
      dx: 0, dy: 0,
    }));
    draw();
  }
  function draw() {
    const moving = running();
    const target = scrollY / Math.max(1, root.scrollHeight - innerHeight);
    progress = moving ? progress + (target - progress) * .09 : progress;
    const coords = points.map((p, i) => {
      const x = p.x * width + Math.sin(time / 2400 + i) * 10;
      const y = p.y * height + Math.cos(time / 2900 + i) * 10 + progress * (i % 2 ? 52 : -44);
      let dx = 0, dy = 0;
      if (moving && pointer) {
        const vx = x - pointer.x, vy = y - pointer.y, distance = Math.hypot(vx, vy);
        if (distance > 0 && distance < 140) { dx = vx / distance * (140 - distance) * .3; dy = vy / distance * (140 - distance) * .3; }
      }
      p.dx += (dx - p.dx) * .12; p.dy += (dy - p.dy) * .12;
      return {x: x + p.dx, y: y + p.dy};
    });
    ctx.clearRect(0, 0, width, height);
    const reach = Math.min(260, Math.max(145, width / 6));
    ctx.strokeStyle = colors[0]; ctx.lineWidth = 1.6;
    for (let i = 0; i < coords.length; i++) for (let j = i + 1; j < coords.length; j++) {
      const a = coords[i], b = coords[j], distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > reach) continue;
      ctx.globalAlpha = .65 * Math.min(1, (reach - distance) / 65);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    coords.forEach((p, i) => {
      const accent = i % 13 === 3;
      ctx.fillStyle = colors[accent ? 1 : 0];
      ctx.beginPath(); ctx.arc(p.x, p.y, accent ? 6.5 : 3.8, 0, Math.PI * 2); ctx.fill();
      if (accent) { ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    });
  }
  function tick(now) {
    frame = 0;
    if (!running()) return;
    const interval = root.dataset.motion === 'low' || width < 640 ? 66 : 33;
    if (now - last >= interval) { time += Math.min(now - last, 100); last = now; draw(); }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    if (!running()) { pointer = null; points.forEach(p => { p.dx = 0; p.dy = 0; }); }
    palette(); draw();
    canvas.dataset.running = String(running());
    if (running()) frame = requestAnimationFrame(tick);
  }
  window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && running()) pointer = {x:e.clientX, y:e.clientY}; }, {passive:true});
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; });
  window.addEventListener('blur', () => { pointer = null; });
  window.addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', sync);
  reduced.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['data-theme','data-motion']});
  palette(); resize(); sync();
}
