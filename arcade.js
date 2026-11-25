// The kit's arcade layer: what a real-time game needs and a quiz doesn't. No page code in the top half, so
// rules can be tested and simulated in Node; the bottom half is the thin part that talks to a page.
(function (root) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v)), lerp = (a, b, t) => a + (b - a) * t;
  // A repeatable random: the same seed gives the same game (daily seeds, tests, bots).
  function rng(seed) { let a = 2166136261; for (const c of String(seed)) { a ^= c.charCodeAt(0); a = Math.imul(a, 16777619); } return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Circles: everything in the world is one. Moving fast can't skip through: the path of this step is checked.
  const touching = (a, b, pad = 0) => { const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r + pad; return dx * dx + dy * dy <= r * r; };
  function swept(a, b, dt) { // a and b with vx, vy: did they touch at any moment in the last dt seconds?
    const px = a.x - b.x, py = a.y - b.y, vx = (a.vx || 0) - (b.vx || 0), vy = (a.vy || 0) - (b.vy || 0), r = a.r + b.r, vv = vx * vx + vy * vy;
    const t = vv ? clamp((px * vx + py * vy) / vv, 0, dt) : 0, x = px - vx * t, y = py - vy * t;
    return x * x + y * y <= r * r;
  }
  // Waves: a list of { secs, every, make } ; next(dt) calls make for each thing due and says which wave it is.
  function waves(list) {
    let i = 0, left = list.length ? list[0].secs : 0, due = list.length ? list[0].every : 0;
    return { get n() { return Math.min(i + 1, list.length); }, get done() { return i >= list.length; }, get left() { return left; },
      step(dt, make) {
        if (i >= list.length) return false;
        left -= dt; due -= dt;
        while (due <= 0 && i < list.length) { make(list[i]); due += list[i].every; }
        if (left > 0) return false;
        i++; if (i < list.length) { left = list[i].secs; due = list[i].every; }
        return true; // a new wave begins (or they're over)
      } };
  }
  // A fixed pool of sparks and dust, so a busy moment never makes garbage.
  function particles(max = 160) {
    const p = Array.from({ length: max }, () => ({ life: 0, x: 0, y: 0, vx: 0, vy: 0, c: 0 })); let at = 0;
    return { all: p, add(x, y, n, speed, c, rand) { for (let k = 0; k < n; k++) { const q = p[at++ % max], a = rand() * Math.PI * 2, s = speed * (0.3 + rand()); q.x = x; q.y = y; q.vx = Math.cos(a) * s; q.vy = Math.sin(a) * s; q.life = 0.35 + rand() * 0.4; q.c = c; } },
      step(dt) { for (const q of p) if (q.life > 0) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 1 - 2 * dt; q.vy *= 1 - 2 * dt; } } };
  }
  // The clock: steps of exactly 1/hz however fast the screen is, never more than a few at once (a slow phone
  // slows the game instead of making it jump). Feed it real milliseconds; it calls step, then says how far between steps we are.
  function clock(step, hz = 120, most = 8) {
    const dt = 1 / hz; let acc = 0, last = null;
    return { dt, reset() { last = null; acc = 0; }, frame(ms) { if (last == null) last = ms; acc += Math.min(0.25, (ms - last) / 1000); last = ms; let n = 0; while (acc >= dt && n < most) { step(dt); acc -= dt; n++; } if (n === most) acc = 0; return acc / dt; } };
  }
  const Arcade = { clamp, lerp, rng, touching, swept, waves, particles, clock };

  /* ---------- The part that needs a page ---------- */
  // Steering, whatever the player has: a thumb or mouse (drag anywhere), arrow keys or WASD, or a controller.
  // read() gives { x, y } as how far to move this step (drag) or a direction (keys, stick), and presses.
  Arcade.input = (el, { scale = () => 1 } = {}) => {
    const keys = new Set(), st = { dx: 0, dy: 0, act: false, pause: false, kind: "touch" }; let id = null, lx = 0, ly = 0, tapAt = 0, padAct = false, padPause = false;
    const K = { ArrowLeft: "l", a: "l", ArrowRight: "r", d: "r", ArrowUp: "u", w: "u", ArrowDown: "d", s: "d" };
    const down = (e) => { if (id != null) { st.act = true; return; } id = e.pointerId; lx = e.clientX; ly = e.clientY; const now = performance.now(); if (now - tapAt < 280) st.act = true; tapAt = now; st.kind = e.pointerType || "touch"; try { el.setPointerCapture(id); } catch {} e.preventDefault(); };
    const move = (e) => { if (e.pointerId !== id) return; const s = scale(); st.dx += (e.clientX - lx) / s; st.dy += (e.clientY - ly) / s; lx = e.clientX; ly = e.clientY; };
    const up = (e) => { if (e.pointerId === id) id = null; };
    const key = (e) => { const k = K[e.key] || K[e.key.toLowerCase && e.key.toLowerCase()]; if (k) { if (e.type === "keydown") keys.add(k); else keys.delete(k); st.kind = "keys"; e.preventDefault(); return; } if (e.type !== "keydown" || e.repeat) return; const field = e.target.closest && e.target.closest("input,textarea"); if (field) return; const on = e.target.closest && e.target.closest("button"); if (e.key === " " && !(on && on.getClientRects().length)) { st.act = true; st.kind = "keys"; e.preventDefault(); } if (e.key === "Escape" || e.key === "p" || e.key === "P") st.pause = true; };
    const drop = () => { keys.clear(); id = null; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    root.addEventListener("keydown", key); root.addEventListener("keyup", key); root.addEventListener("blur", drop);
    return {
      read() {
        let sx = (keys.has("r") ? 1 : 0) - (keys.has("l") ? 1 : 0), sy = (keys.has("d") ? 1 : 0) - (keys.has("u") ? 1 : 0);
        const pad = root.navigator && navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g && g.connected) : null;
        if (pad) { const ax = Math.abs(pad.axes[0]) > 0.18 ? pad.axes[0] : 0, ay = Math.abs(pad.axes[1]) > 0.18 ? pad.axes[1] : 0; if (ax || ay) { sx = ax; sy = ay; st.kind = "pad"; } const b = !!(pad.buttons[0] && pad.buttons[0].pressed), p = !!(pad.buttons[9] && pad.buttons[9].pressed); if (b && !padAct) st.act = true; if (p && !padPause) st.pause = true; padAct = b; padPause = p; }
        const out = { dx: st.dx, dy: st.dy, sx, sy, act: st.act, pause: st.pause, kind: st.kind }; st.dx = st.dy = 0; st.act = st.pause = false; return out;
      },
      stop() { root.removeEventListener("keydown", key); root.removeEventListener("keyup", key); root.removeEventListener("blur", drop); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); }
    };
  };
  // Runs a game: step at a fixed rate, draw each frame, pause by itself when the page is hidden.
  Arcade.run = ({ step, draw, onPause = () => {} }) => {
    const c = clock(step); let on = false, raf = 0, times = [];
    const frame = (ms) => { if (!on) return; if (times.length) { const d = ms - times[times.length - 1]; if (d > 0) Arcade.run.fps = lerp(Arcade.run.fps || 60, 1000 / d, 0.05); } times = [ms]; const a = c.frame(ms); draw(a); raf = requestAnimationFrame(frame); };
    const api = { get running() { return on; }, start() { if (on) return; on = true; c.reset(); times = []; raf = requestAnimationFrame(frame); }, stop() { on = false; cancelAnimationFrame(raf); } };
    document.addEventListener("visibilitychange", () => { if (document.hidden && on) { api.stop(); onPause(); } });
    return api;
  };
  // A canvas that keeps a world of w × h in view at any size, sharp on good screens (but never more than 2×: it costs frames).
  Arcade.screen = (canvas, w, h) => {
    const g = canvas.getContext("2d"), v = { g, scale: 1, w, h, fit() { const r = canvas.getBoundingClientRect(), d = Math.min(2, root.devicePixelRatio || 1); canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); v.scale = r.width / w; g.setTransform((canvas.width / w), 0, 0, (canvas.height / h), 0, 0); } };
    new ResizeObserver(() => v.fit()).observe(canvas); v.fit(); return v;
  };
  // A knock to the screen, off for people who ask for less motion.
  Arcade.shake = () => { const calm = root.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; let s = 0; return { hit(n) { if (!calm) s = Math.min(10, s + n); }, step(dt) { s = Math.max(0, s - s * 9 * dt); }, at: () => (s < 0.1 ? [0, 0] : [(Math.random() - 0.5) * s, (Math.random() - 0.5) * s]) }; };
  if (typeof module !== "undefined" && module.exports) module.exports = Arcade; else root.KitArcade = Arcade;
})(typeof window !== "undefined" ? window : globalThis);
