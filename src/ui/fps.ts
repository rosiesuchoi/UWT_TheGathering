// A frame-rate readout for checking performance on real devices. It only
// loads when ?fps is added to the address.
//
// It shows frames per second over the last second, and the longest single
// frame in that second (a smooth 60fps frame is about 16.7 ms).
export function initFps(): void {
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText =
    'position:fixed;left:8px;top:70px;z-index:300;font:500 12px/1.4 ui-monospace,Consolas,monospace;' +
    'background:#1b1033;color:#f1edf9;padding:6px 9px;border-radius:6px;pointer-events:none;white-space:pre';
  box.textContent = 'fps ...';
  document.body.append(box);

  let last = performance.now();
  let windowStart = last;
  let frames = 0;
  let worst = 0;
  const tick = (now: number): void => {
    const dt = now - last;
    last = now;
    frames++;
    if (dt > worst) worst = dt;
    if (now - windowStart >= 1000) {
      const fps = (frames * 1000) / (now - windowStart);
      box.textContent = `fps ${fps.toFixed(0)}\nworst ${worst.toFixed(1)} ms`;
      windowStart = now;
      frames = 0;
      worst = 0;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
