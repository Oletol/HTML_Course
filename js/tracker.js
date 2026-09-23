/* ==================================================================
   tracker.js – учёт активного времени на шаге.

   Время идёт, только если вкладка видна и студент что-то делал
   (клавиатура, мышь, прокрутка, касание) за последние 2 минуты.
   Накопленные секунды передаются в onFlush(stepId, seconds)
   раз в 30 секунд, при смене шага и при уходе со страницы.
   ================================================================== */

export function createTracker({ onFlush, idleMs = 120000, flushMs = 30000 } = {}) {
  let stepId = null;
  let acc = 0;
  let last = Date.now();
  let lastActivity = Date.now();

  function tick() {
    const now = Date.now();
    if (stepId && document.visibilityState === 'visible' && now - lastActivity < idleMs) {
      acc += now - last;
    }
    last = now;
  }

  function flush() {
    tick();
    const seconds = Math.floor(acc / 1000);
    if (stepId && seconds > 0) {
      acc -= seconds * 1000;
      onFlush?.(stepId, seconds);
    }
  }

  let moveThrottle = 0;
  const activity = e => {
    if (e.type === 'pointermove') {
      const now = Date.now();
      if (now - moveThrottle < 2000) return;
      moveThrottle = now;
    }
    tick();
    lastActivity = Date.now();
  };
  ['keydown', 'pointerdown', 'pointermove', 'wheel', 'scroll', 'touchstart']
    .forEach(t => document.addEventListener(t, activity, { capture: true, passive: true }));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else { last = Date.now(); lastActivity = Date.now(); }
  });
  window.addEventListener('pagehide', flush);
  setInterval(tick, 5000);
  setInterval(flush, flushMs);

  return {
    start(id) {
      flush();
      stepId = id; acc = 0;
      last = Date.now(); lastActivity = Date.now();
    },
    flush
  };
}
