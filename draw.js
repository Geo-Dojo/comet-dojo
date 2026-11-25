// Comet Dojo: drawing for every enemy, boss, field hazard and projectile, in neon comic: dark fills, a thick ink
// outline, then a glowing tube. Pictures are made once at the size they're drawn (window.CDraw.pic), so each costs one drawImage.
(function () {
  "use strict";
  const S = window.Sector; let PICF = null;
  const SC = (k) => (S.SCHOOLS[k] || {}).color || "#f4ecff";
  // Pictures made once, at the size they're drawn: a neon tube outline over a dark fill, like the rocket.
  const tube = (x, pts, c, fill, w = 2.6, close = true) => { x.lineJoin = "round"; x.lineCap = "round"; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); if (close) x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = "#05020c"; x.lineWidth = w + 4.5; x.stroke(); x.strokeStyle = c; x.globalAlpha = 0.22; x.lineWidth = w * 3; x.stroke(); x.globalAlpha = 1; x.lineWidth = w; x.stroke(); x.strokeStyle = "#ffffffaa"; x.lineWidth = w * 0.3; x.stroke(); };
  const circ = (n, r, rot = 0, jag = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.283 + rot, q = jag && i % 2 ? r * jag : r; return [Math.cos(a) * q, Math.sin(a) * q]; });
  const SPR = {
    darter: (x) => { tube(x, [[0, 24], [-15, -10], [0, -3], [15, -10]], "#ff5fd8", "#2a0b33"); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 6, 4, 0, 7); x.fill(); },
    turret: (x) => { tube(x, [[-6, 10], [6, 10], [6, 40], [-6, 40]], "#9fb4ff", "#151a3a"); tube(x, circ(8, 28, 0.39), "#9fb4ff", "#151a3a", 3); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill(); },
    weaver: (x) => { tube(x, circ(14, 22), "#5ff0a8", "#0c2a20", 3); x.fillStyle = "#c6ff4f"; for (const s of [-8, 8]) { x.beginPath(); x.arc(s, 8, 4, 0, 7); x.fill(); } tube(x, [[-14, 18], [-6, 30], [0, 22], [6, 30], [14, 18]], "#f4ecff", null, 2, false); },
    seg: (x) => { tube(x, circ(12, 14), "#b48cff", "#1e1035", 2.4); },
    shield: (x) => { tube(x, circ(6, 26, 0.52), "#ffd23f", "#2a2206", 3); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, -4, 6, 0, 7); x.fill(); },
    lancer: (x) => { tube(x, [[0, 30], [-16, 0], [0, -28], [16, 0]], "#ff9a3d", "#3a1606", 3); tube(x, [[-24, -6], [-12, -12], [-14, 6]], "#ff9a3d", "#3a1606", 2); tube(x, [[24, -6], [12, -12], [14, 6]], "#ff9a3d", "#3a1606", 2); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 10, 5, 0, 7); x.fill(); },
    splitter: (x) => { for (const [a, b] of [[0, -12], [-13, 10], [13, 10]]) { x.save(); x.translate(a, b); tube(x, circ(3, 14, 1.57), "#5ff0a8", "#0c2a20", 2.4); x.restore(); } },
    mini: (x) => tube(x, circ(3, 13, 1.57), "#5ff0a8", "#0c2a20", 2.2),
    carrier: (x) => { tube(x, [[-40, -16], [40, -16], [46, 8], [26, 22], [-26, 22], [-46, 8]], "#3fd8f2", "#0b2a38", 3); for (const s of [-1, 1]) tube(x, [[s * 30, 4], [s * 30, 20], [s * 18, 20], [s * 18, 4]], "#ff5fd8", "#2a0b33", 2); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 0, 6, 0, 7); x.fill(); },
    rocket: (x) => { tube(x, [[0, 14], [-6, -4], [-4, -12], [4, -12], [6, -4]], "#ff4f7b", "#ff4f7b88", 2); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 2, 3, 0, 7); x.fill(); },
    phantom: (x) => { tube(x, circ(10, 24, 0, 0.72), "#d9ceff", "#1a1236", 2.6); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 0, 6, 0, 7); x.fill(); },
    pin: (x) => { tube(x, circ(10, 16, -1.57, 0.45), "#ffd23f", "#3a2a06", 2.4); },
    // Vesper's glass seal: a pale aqua glass hexagon with a keyhole (never red: it doesn't hurt, you shoot it).
    seal: (x) => { tube(x, circ(6, 19, -1.57), "#9ffcff", "#0b2c36", 3); tube(x, circ(6, 12, -1.05), "#9ffcff", null, 1.4); x.fillStyle = "#9ffcff"; x.beginPath(); x.arc(0, -3, 3.6, 0, 7); x.fill(); x.fillRect(-1.6, -1, 3.2, 8); },
    maker: (x) => { tube(x, circ(12, 66, 0, 0.88), "#3fd8f2", "#08202c", 4); tube(x, circ(48, 50), "#3fd8f2", null, 1.4); for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; x.strokeStyle = "#3fd8f2"; x.lineWidth = i % 4 ? 1.5 : 3; x.beginPath(); x.moveTo(Math.cos(a) * 42, Math.sin(a) * 42); x.lineTo(Math.cos(a) * (i % 4 ? 48 : 54), Math.sin(a) * (i % 4 ? 48 : 54)); x.stroke(); } for (const s of [-1, 1]) tube(x, [[s * 60, -20], [s * 92, -36], [s * 98, -6], [s * 66, 10]], "#3fd8f2", "#08202c", 3); },
    needle: (x) => { tube(x, [[0, -40], [7, 0], [0, 10], [-7, 0]], "#ff5fd8", "#2a0b33", 3); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 0, 9, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 4, 0, 7); x.fill(); },
    // The Last Bell: a great cracked bronze bell with a yoke, bands, a slit eye and its clapper glowing under the rim.
    lastbell: (x) => { tube(x, [[-22, -96], [22, -96], [22, -82], [-22, -82]], "#ffd23f", "#3a2a06", 3); tube(x, [[-24, -82], [24, -82], [60, -60], [74, 0], [80, 44], [102, 70], [-102, 70], [-80, 44], [-74, 0], [-60, -60]], "#ff9a3d", "#3a1606", 4.5); tube(x, [[-80, 44], [80, 44]], "#ff9a3d", null, 2, false); tube(x, [[-74, 4], [74, 4]], "#ff9a3d", null, 2, false); tube(x, [[-66, -36], [66, -36]], "#ff9a3d", null, 1.6, false);
      tube(x, [[28, -80], [18, -54], [34, -38], [16, -8]], "#ffd23f", null, 2, false); x.fillStyle = "#fff2b0"; x.beginPath(); x.ellipse(0, -14, 26, 10, 0, 0, 7); x.fill(); x.strokeStyle = "#05020c"; x.lineWidth = 3; x.stroke(); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, -14, 7, 0, 7); x.fill(); x.fillStyle = "#05020c"; x.beginPath(); x.arc(0, -14, 3, 0, 7); x.fill();
      x.fillStyle = "#c6ff4f44"; x.beginPath(); x.arc(0, 86, 24, 0, 7); x.fill(); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 86, 14, 0, 7); x.fill(); x.strokeStyle = "#05020c"; x.lineWidth = 3; x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(-4, 82, 4, 0, 7); x.fill(); },
    // Series three: the chimer (a little bronze bell drone) and the clapper (a heavy teardrop that swings on a chain).
    chimer: (x) => { tube(x, [[-6, -22], [6, -22], [16, -12], [20, 8], [26, 16], [-26, 16], [-20, 8], [-16, -12]], "#ffd23f", "#3a2a06", 2.8); tube(x, [[-18, 6], [18, 6]], "#ffd23f", null, 1.4, false); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 21, 5, 0, 7); x.fill(); for (const sd of [-1, 1]) tube(x, [[sd * 20, -4], [sd * 32, -14], [sd * 30, 2]], "#ffd23f", "#3a2a06", 1.8); },
    clapper: (x) => { tube(x, [[0, -26], [12, -10], [18, 10], [10, 24], [0, 28], [-10, 24], [-18, 10], [-12, -10]], "#ff9a3d", "#3a1606", 3); tube(x, circ(8, 6, 0), "#ffd23f", "#3a2a06", 1.6); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 12, 5.5, 0, 7); x.fill(); },
    // Series two: the skimmer (a flat manta that crosses the sky) and the prism (a glass crystal whose shot cracks into five).
    skimmer: (x) => { tube(x, [[-34, -2], [-12, -12], [0, -20], [12, -12], [34, -2], [18, 6], [6, 16], [-6, 16], [-18, 6]], "#7dfcff", "#08262e", 2.8); tube(x, [[-20, 0], [0, -8], [20, 0]], "#7dfcff", null, 1.6, false); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 4, 4.5, 0, 7); x.fill(); },
    prism: (x) => { tube(x, [[0, -30], [24, 12], [0, 30], [-24, 12]], "#e9d8ff", "#1c1438", 3); tube(x, [[0, -30], [0, 30]], "#b48cff", null, 1.4, false); tube(x, [[-24, 12], [24, 12]], "#b48cff", null, 1.4, false); x.fillStyle = "#c6ff4f"; x.beginPath(); x.arc(0, 4, 5, 0, 7); x.fill(); x.fillStyle = "#ffffffcc"; x.beginPath(); x.moveTo(-6, -18); x.lineTo(-2, -22); x.lineTo(-12, 2); x.fill(); },
    // the prism's glass shot: a big red danger orb with a white core and cracks, about to split into five
    splitShot: (x) => { const d = (r, c, a = 1) => { x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.globalAlpha = 1; }; d(21, "#ff4f7b", 0.2); d(16, "#05020c"); d(14, "#ff4f7b"); d(8.5, "#fff"); x.strokeStyle = "#ff4f7b"; x.lineWidth = 1.8; x.lineCap = "round"; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; x.beginPath(); x.moveTo(Math.cos(a) * 2, Math.sin(a) * 2); x.lineTo(Math.cos(a + 0.25) * 6, Math.sin(a + 0.25) * 6); x.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); x.stroke(); } },
    flame: (x) => { x.beginPath(); x.moveTo(0, -11); x.quadraticCurveTo(8, 0, 5, 6); x.quadraticCurveTo(0, 10, -5, 6); x.quadraticCurveTo(-8, 0, 0, -11); x.fillStyle = "#ff9a3d"; x.fill(); x.strokeStyle = "#05020c"; x.lineWidth = 2; x.stroke(); x.beginPath(); x.moveTo(0, -4); x.quadraticCurveTo(4, 2, 2, 5); x.quadraticCurveTo(0, 7, -2, 5); x.quadraticCurveTo(-4, 2, 0, -4); x.fillStyle = "#ffd23f"; x.fill(); },
    // a repair kit: a mint box with a white cross, glowing (never red: red means danger)
    // A stamp dropped by a wreck: a gold coin with an inked edge and a star (never red: it doesn't hurt).
    coin: (x) => { x.fillStyle = "#ffd23f33"; x.beginPath(); x.arc(0, 0, 12, 0, 7); x.fill(); x.fillStyle = "#05020c"; x.beginPath(); x.arc(0, 0, 9, 0, 7); x.fill(); x.fillStyle = "#ffd23f"; x.beginPath(); x.arc(0, 0, 7, 0, 7); x.fill(); x.fillStyle = "#fff6c8"; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.628, r = i % 2 ? 1.6 : 4.2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); },
    pack: (x) => { x.fillStyle = "#5ff0a833"; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); tube(x, [[-13, -13], [13, -13], [13, 13], [-13, 13]], "#5ff0a8", "#0c2a20", 2.6); x.fillStyle = "#fff"; x.fillRect(-3, -9, 6, 18); x.fillRect(-9, -3, 18, 6); },
    // a gun dropped by a wreck: a white crate with a gun on it
    crate: (x) => { x.fillStyle = "#f4ecff22"; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.fill(); tube(x, [[-15, -11], [15, -11], [15, 11], [-15, 11]], "#f4ecff", "#221036", 2.6); x.fillStyle = "#ffd23f"; x.fillRect(-9, -3, 14, 5); x.fillRect(-9, -3, 4, 9); x.fillStyle = "#fff"; x.fillRect(5, -2, 4, 3); },
    // the four newer guns
    bounceShot: (x) => { x.fillStyle = "#5ff0a844"; x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill(); tube(x, [[0, -9], [5, 0], [0, 9], [-5, 0]], "#5ff0a8", "#5ff0a8", 1.6); x.fillStyle = "#fff"; x.fillRect(-1.2, -5, 2.4, 10); },
    blade: (x) => { x.fillStyle = "#3fd8f233"; x.beginPath(); x.arc(0, 0, 17, 0, 7); x.fill(); tube(x, circ(12, 14, 0, 0.55), "#3fd8f2", "#0b2a38", 2.2); tube(x, circ(4, 5, 0.78), "#f4ecff", "#3fd8f2", 1.4); },
    chargeShot: (x) => { const d = (r, c, a = 1) => { x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.globalAlpha = 1; }; d(30, "#7dfcff", 0.16); d(22, "#7dfcff", 0.3); d(15, "#7dfcff"); d(9, "#fff"); x.strokeStyle = "#fff"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 19, 0.4, 2.2); x.stroke(); x.beginPath(); x.arc(0, 0, 19, 3.6, 5.4); x.stroke(); },
    mineShot: (x) => { tube(x, circ(8, 9, 0, 0.7), "#ffd23f", "#3a2a06", 2); x.fillStyle = "#ffd23f"; x.beginPath(); x.arc(0, 0, 3.5, 0, 7); x.fill(); },
    // Drone Wing darts (mint), Ram Prow spikes (hot orange wedges) and the Lodestone (an inked violet stone with a mint core).
    wingDart: (x) => { x.fillStyle = "#5ff0a844"; x.beginPath(); x.ellipse(0, 1, 5, 10, 0, 0, 7); x.fill(); tube(x, [[0, -8], [3.5, 4], [0, 2], [-3.5, 4]], "#5ff0a8", "#0e3a28", 1.8); },
    wingDrone: (x) => { tube(x, [[0, -11], [9, 4], [4, 9], [-4, 9], [-9, 4]], "#5ff0a8", "#0e3a28", 2.4); x.fillStyle = "#e9fff4"; x.beginPath(); x.arc(0, 0, 2.6, 0, 7); x.fill(); },
    ramSpike: (x) => { tube(x, [[0, -10], [5, 6], [-5, 6]], "#ff9a3d", "#3a1606", 2); x.fillStyle = "#fff3d8"; x.fillRect(-1, -5, 2, 6); },
    lodeStone: (x) => { x.fillStyle = "#b48cff33"; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); tube(x, circ(7, 14, 0.3, 0.82), "#b48cff", "#1e1035", 2.4); x.fillStyle = "#5ff0a8"; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(-1.5, -1.5, 2, 0, 7); x.fill(); },
    // the three newest guns (24 Nov 2026): a weaving violet bead, a spiked gold shell, and its shards
    waveShot: (x) => { x.fillStyle = "#b48cff44"; x.beginPath(); x.ellipse(0, 2, 8, 13, 0, 0, 7); x.fill(); x.fillStyle = "#b48cff"; x.beginPath(); x.ellipse(0, 0, 5, 8, 0, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.ellipse(0, -1, 2.2, 4, 0, 0, 7); x.fill(); },
    novaShell: (x) => { x.fillStyle = "#ffd23f33"; x.beginPath(); x.arc(0, 0, 15, 0, 7); x.fill(); tube(x, circ(16, 11, 0, 0.62), "#ffd23f", "#3a2a06", 2); x.fillStyle = "#fff6c8"; x.beginPath(); x.arc(0, 0, 4.5, 0, 7); x.fill(); },
    arcSpark: (x) => { x.fillStyle = "#b48cff55"; x.beginPath(); x.arc(0, 0, 8, 0, 7); x.fill(); tube(x, [[0, -8], [3, -1], [-2, 1], [0, 8]], "#e9d8ff", null, 2, false); },
    shard: (x) => { tube(x, [[0, -7], [3, 0], [0, 7], [-3, 0]], "#ffd23f", "#fff6c8", 1.4); },
    // player projectiles
    needleShot: (x) => { x.fillStyle = "#ff9ff0"; x.fillRect(-1.5, -9, 3, 18); }, flakShot: (x) => { x.fillStyle = "#ffd23f44"; x.beginPath(); x.arc(0, 0, 11, 0, 7); x.fill(); x.fillStyle = "#ffd23f"; x.beginPath(); x.arc(0, 0, 6, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 2.5, 0, 7); x.fill(); },
    pellet: (x) => { x.fillStyle = "#ffd23f"; x.beginPath(); x.arc(0, 0, 3.5, 0, 7); x.fill(); }, rail: (x) => { x.fillStyle = "#7dfcff44"; x.fillRect(-8, -60, 16, 120); x.fillStyle = "#7dfcff"; x.fillRect(-3, -60, 6, 120); x.fillStyle = "#fff"; x.fillRect(-1, -60, 2, 120); },
    saw: (x) => { tube(x, circ(16, 14, 0, 0.7), "#ff9a3d", "#3a1606", 2); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 3, 0, 7); x.fill(); }, hail: (x) => { tube(x, [[0, -10], [4, 2], [3, 8], [-3, 8], [-4, 2]], "#ffd23f", "#3a2a06", 1.8); x.fillStyle = "#ff9a3d"; x.fillRect(-2, 8, 4, 5); },
    allyShot: (x) => { x.fillStyle = "#ff9a3d55"; x.fillRect(-5, -12, 10, 24); x.fillStyle = "#ffd23f"; x.fillRect(-2, -10, 4, 20); },
    drone: (x) => { tube(x, circ(6, 9, 0.52), "#b48cff", "#1e1035", 2); }, droneShot: (x) => { x.fillStyle = "#d9ceff"; x.fillRect(-1.5, -7, 3, 14); }, shell: (x) => { x.fillStyle = "#ff9a3d44"; x.beginPath(); x.arc(0, 0, 12, 0, 7); x.fill(); x.fillStyle = "#ff9a3d"; x.beginPath(); x.arc(0, 0, 7, 0, 7); x.fill(); x.fillStyle = "#fff"; x.beginPath(); x.arc(-2, -2, 2.5, 0, 7); x.fill(); },
    disc: (x) => { x.fillStyle = "#ff4f7b33"; x.beginPath(); x.arc(0, 0, 18, 0, 7); x.fill(); x.strokeStyle = "#ff4f7b"; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 12, 0.3, 2.6); x.stroke(); x.beginPath(); x.arc(0, 0, 12, 3.4, 5.7); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); }
  };
  const SIZE = { wingDart: 22, ramSpike: 22, lodeStone: 64, wingDrone: 36, arcSpark: 20, waveShot: 22, novaShell: 34, shard: 16, coin: 26, chimer: 76, clapper: 64, crate: 52, pack: 48, bounceShot: 22, blade: 38, chargeShot: 64, mineShot: 26, flame: 26, skimmer: 78, prism: 64, splitShot: 46, darter: 56, turret: 96, weaver: 64, seg: 40, shield: 84, lancer: 70, splitter: 64, mini: 34, carrier: 110, rocket: 34, phantom: 64, pin: 44, seal: 52, maker: 210, needle: 60, lastbell: 230, needleShot: 22, allyShot: 14, flakShot: 26, pellet: 10, rail: 20, saw: 34, hail: 18, drone: 24, droneShot: 6, shell: 28, disc: 40 };
  // 3D shading (owner, 24 Nov 2026: "make the enemies feel a little more 3D, extra shading"): light from the top left, a
  // soft highlight and a darker lower right, painted onto the picture once (source-atop: only where the enemy is drawn),
  // plus a dark drop shadow drawn under it. Costs one extra drawImage an enemy; nothing is redrawn live.
  const ENEMYK = new Set(["darter", "turret", "weaver", "seg", "shield", "lancer", "splitter", "mini", "carrier", "phantom", "pin", "seal", "chimer", "clapper", "skimmer", "prism", "needle", "maker", "lastbell"]);
  function shade(x, w, h) {
    x.save(); x.globalCompositeOperation = "source-atop";
    const hi = x.createRadialGradient(-w * 0.2, -h * 0.26, 0, -w * 0.2, -h * 0.26, Math.max(w, h) * 0.55); hi.addColorStop(0, "rgba(255,255,255,0.55)"); hi.addColorStop(0.18, "rgba(255,255,255,0.32)"); hi.addColorStop(0.5, "rgba(255,255,255,0.1)"); hi.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = hi; x.fillRect(-w / 2, -h / 2, w, h);
    const lo = x.createLinearGradient(-w * 0.3, -h * 0.3, w * 0.4, h * 0.45); lo.addColorStop(0, "rgba(5,2,12,0)"); lo.addColorStop(0.5, "rgba(5,2,12,0.18)"); lo.addColorStop(1, "rgba(5,2,12,0.72)");
    x.fillStyle = lo; x.fillRect(-w / 2, -h / 2, w, h); x.restore();
  }
  // The same, on a finished canvas (SVG art: skiffs, mines, bosses).
  function shadeCanvas(c) { const x = c.getContext("2d"), w = c.width, h = c.height; x.save(); x.setTransform(1, 0, 0, 1, w / 2, h / 2); shade(x, w, h); x.restore(); return c; }
  // A drop shadow: the picture's shape filled near-black, made once.
  function shadowOf(c) { if (c.shadow) return c.shadow; const d = document.createElement("canvas"); d.width = c.width; d.height = c.height; const x = d.getContext("2d"); x.drawImage(c, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#05020c"; x.fillRect(0, 0, d.width, d.height); d.w = c.w; d.h = c.h; c.shadow = d; return d; }
  const SHX = 8, SHY = 15, SHA = 0.62;
  const pics = {}; const pic = (k) => pics[k] || (pics[k] = PICF(SIZE[k], SIZE[k] * (k === "rail" ? 6 : 1), ENEMYK.has(k) ? (x) => { SPR[k](x); shade(x, SIZE[k], SIZE[k]); } : SPR[k]));
  const drop = (g, c, x, y, w, h, rot = 0, a = 1) => { const d = shadowOf(c); g.globalAlpha = SHA * a; if (rot) { g.save(); g.translate(x + SHX, y + SHY); g.rotate(rot); g.drawImage(d, -w / 2, -h / 2, w, h); g.restore(); } else g.drawImage(d, x + SHX - w / 2, y + SHY - h / 2, w, h); g.globalAlpha = 1; };
  // SVG art for the three big bosses, from the mock-ups: the Toll-Keeper at four kinds of damage, the First Student as a rival rocket.
  const svgArt = (inner, w, h, vb) => new Promise((ok) => { const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); shadeCanvas(c); ok(c); }; i.onerror = () => ok(null); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="${vb}">${inner}</svg>`); });
  const BIG = {}; let bigReady = null;
  const loadBig = () => (bigReady = bigReady || (async () => { const P = PALS.n; for (let d = 0; d < 4; d++) BIG["keeper" + d] = await svgArt(keeper(P, d), 400, 290, "-440 -330 880 640"); BIG.bast = await svgArt(magpieTop({ ...P, hull: "#ffd23f", hullS: "#3a2a06", trim: "#ff9a3d", trimS: "#3a1606" }), 76, 98, "-130 -125 260 330"); BIG.student = await svgArt(magpieTop({ ...P, hull: "#ff5fd8", hullS: "#3d0a36", trim: "#ffd23f", trimS: "#3a2a06", glass: "#c6ff4f", glassS: "#3a5208" }), 92, 118, "-130 -125 260 330"); BIG.echo = await svgArt(magpieTop({ ...P, hull: "#dfeaff", hullS: "#24324a", trim: "#7dfcff", trimS: "#0b2a38", glass: "#ffffff", glassS: "#5a6a86" }), 92, 118, "-130 -125 260 330"); })());
  const draw1 = (g, k, x, y, rot = 0, a = 1) => { const c = pic(k); g.globalAlpha = a; if (rot) { g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(c, -c.w / 2, -c.h / 2, c.w, c.h); g.restore(); } else g.drawImage(c, x - c.w / 2, y - c.h / 2, c.w, c.h); g.globalAlpha = 1; };
  function drawEnemy(g, s, e, white, low) {
    if (e.kind === "boss") return drawBoss(g, s, e, white, low);
    if (e.kind === "seal") { const b = s.en.find((o) => o.id === e.owner), a = e.set > 0 ? 0.4 : 1; if (b) { g.strokeStyle = "#9ffcff"; g.globalAlpha = 0.35 * a; g.lineWidth = 2; g.setLineDash([4, 7]); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(e.x, e.y); g.stroke(); g.setLineDash([]); } const c = pic("seal"); if (a === 1) drop(g, c, e.x, e.y, c.w, c.h, 0); draw1(g, "seal", e.x, e.y, low ? 0 : Math.sin(e.t * 1.3) * 0.25, a); if (a === 1 && e.hp < e.max) { g.strokeStyle = "#9ffcff"; g.lineWidth = 3; g.beginPath(); g.arc(e.x, e.y, 26, -1.57, -1.57 + 6.283 * (e.hp / e.max)); g.stroke(); } if (white && !low) { g.globalAlpha = 0.3; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; } return; }
    if (e.kind === "arm") { if (white && !low) { g.globalAlpha = 0.35; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; } const b = s.en.find((o) => o.id === e.owner); g.fillStyle = "#ffffff22"; g.fillRect(e.x - 30, e.y + 46, 60, 5); g.fillStyle = "#c6ff4f"; g.fillRect(e.x - 30, e.y + 46, 60 * Math.max(0, e.hp / e.max), 5); return b; }
    if (e.kind === "fake" && e.echo != null) { const b = s.en.find((o) => o.id === e.echo); echoBody(g, s, e, b && b.shuf > 0 ? 0.5 : 0.34, low); g.strokeStyle = "#bfe9ff"; g.globalAlpha = 0.55; g.lineWidth = 2; g.setLineDash([5, 7]); g.beginPath(); g.arc(e.x, e.y, 44, low ? 0 : s.t, (low ? 0 : s.t) + 6.283); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; return; }
    if (e.kind === "fake") { if (BIG.student) { g.save(); g.globalAlpha = 0.45 + 0.2 * Math.sin(s.t * 8); g.translate(e.x, e.y); g.rotate(Math.PI); g.drawImage(BIG.student, -46, -50, 92, 118); g.restore(); g.globalAlpha = 1; } return; }
    if (e.kind === "phantom") { const c = pic("phantom"); if (!(e.fade > 0)) drop(g, c, e.x, e.y, c.w, c.h, e.t); draw1(g, "phantom", e.x, e.y, e.t, e.fade > 0 ? 0.18 : 1); return; }
    if (e.kind === "rocket") { draw1(g, "rocket", e.x, e.y, Math.atan2(e.vy, e.vx) - 1.57); return; }
    if (e.kind === "lancer" && (e.tele > 0 || e.beam > 0)) { g.fillStyle = e.beam > 0 ? "#ff4f7b" : "#ff4f7b55"; g.fillRect(e.x - (e.beam > 0 ? 12 : 1.5), e.y, e.beam > 0 ? 24 : 3, 900); if (e.beam > 0) { g.fillStyle = "#fff"; g.fillRect(e.x - 4, e.y, 8, 900); } }
    if (e.kind === "chimer" && e.glow > 0) { const k = 1 - e.glow / 0.55; g.strokeStyle = "#ff4f7b"; g.lineWidth = 3; g.globalAlpha = 0.4 + 0.5 * k; g.beginPath(); g.arc(e.x, e.y, 46 - 22 * k, 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (e.kind === "clapper") { const px = e.x0, py = e.py ?? -30; g.strokeStyle = "#05020c"; g.lineWidth = 6; g.beginPath(); g.moveTo(px, py); g.lineTo(e.x, e.y - 20); g.stroke(); g.strokeStyle = "#ffd23f"; g.lineWidth = 2.5; g.setLineDash([7, 5]); g.stroke(); g.setLineDash([]); g.fillStyle = "#ffd23f"; g.fillRect(px - 6, py - 6, 12, 12); draw1(g, "clapper", e.x, e.y, -(e.ang || 0)); if (white && !low) { g.globalAlpha = 0.35; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; } if (e.burn > 0) flames(g, s, e); return true; }
    if (e.kind === "darter" && !e.dive && e.y >= e.hover) { g.strokeStyle = "#ff4f7b88"; g.setLineDash([6, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(s.ship.x, s.ship.y); g.stroke(); g.setLineDash([]); }
    if (SPR[e.kind]) { const rot = e.kind === "pin" ? e.t : e.kind === "darter" && e.dive ? Math.atan2(e.dive[1], e.dive[0]) - 1.57 : 0, c = pic(e.kind); drop(g, c, e.x, e.y, c.w, c.h, rot); draw1(g, e.kind, e.x, e.y, rot); } else return false;
    if (e.kind === "shield") shieldBar(g, e, low);
    if (white && !low) { g.globalAlpha = 0.35; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; }
    if (e.burn > 0) flames(g, s, e);
    if (s.p.finish && e.hp < e.max * 0.4 && e.kind !== "seg") { g.strokeStyle = "#ff9a3d"; g.lineWidth = 3; g.setLineDash([5, 7]); g.beginPath(); g.arc(e.x, e.y, e.r + 8, s.t * 3, s.t * 3 + 6.28); g.stroke(); g.setLineDash([]); }
    return true;
  }
  // The shield-bearer's blue line is its shield's health bar: a faint track for the full arc, the bright line shrinking from both
  // ends toward the middle as it's hit, gone when broken; it flickers back from the middle as it regrows.
  function shieldBar(g, e, low) {
    const k = e.sh == null ? 1 : Math.max(0, e.sh / (e.shMax || 1)), half = 1.22, mid = 1.5708;
    g.lineCap = "round"; g.strokeStyle = "#3fd8f2"; g.globalAlpha = 0.3; g.lineWidth = 4; g.beginPath(); g.arc(e.x, e.y, 33, mid - half, mid + half); g.stroke();
    if (k > 0) { const h = half * k; g.globalAlpha = 0.25; g.lineWidth = 14; g.beginPath(); g.arc(e.x, e.y, 33, mid - h, mid + h); g.stroke(); g.globalAlpha = e.shT > 0 || k >= 1 || low ? 1 : 0.7; g.lineWidth = 5; g.stroke(); }
    g.globalAlpha = 1; g.lineCap = "butt";
  }
  function echoBody(g, s, e, a, low) { if (!BIG.echo) return; g.save(); g.globalAlpha = a; g.translate(e.x, e.y); g.rotate(Math.PI); g.drawImage(BIG.echo, -46, -50, 92, 118); g.restore(); g.globalAlpha = 1; }
  function drawBoss(g, s, e, white, low) {
    if (e.key === "keeper") {
      if (e.lit != null) { const a = e.light; g.fillStyle = e.lit ? "#fff2b055" : "#fff2b022"; g.beginPath(); g.moveTo(e.x, e.y + 20); g.arc(e.x, e.y + 20, 900, a - 0.23, a + 0.23); g.closePath(); g.fill(); }
      const arms = s.en.filter((o) => o.kind === "arm" && !o.gone).length, d = arms === 2 ? (e.stage ? 1 : 0) : arms === 1 ? 2 : 3, c = BIG["keeper" + d];
      // Chains from the body to each arm that's still up: while they hold, its plating is up.
      if (c) g.drawImage(c, e.x - 176, e.y - 120, 352, 256);
      for (const o of s.en) if (o.kind === "arm" && !o.gone && o.owner === e.id) { const x0 = e.x + Math.sign(o.x - e.x) * 44, y0 = e.y + 62, x1 = o.x, y1 = o.y + 40; g.strokeStyle = "#05020c"; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 34, x1, y1); g.stroke(); g.strokeStyle = "#ffd23f"; g.lineWidth = 3.5; g.setLineDash([9, 6]); g.lineDashOffset = low ? 0 : -s.t * 20; g.stroke(); g.setLineDash([]); g.lineDashOffset = 0; for (const [x, y] of [[x0, y0], [x1, y1]]) { g.fillStyle = "#ffd23f"; g.fillRect(x - 5, y - 5, 10, 10); } }
    } else if (e.key === "student") { if (BIG.student) { g.save(); g.translate(e.x, e.y); g.rotate(Math.PI); g.drawImage(BIG.student, -46, -50, 92, 118); g.restore(); } if (e.parry > 0) { g.strokeStyle = "#ffffff"; g.globalAlpha = low ? 0.75 : 0.6 + 0.25 * Math.sin(s.t * 9); g.lineWidth = 5; g.beginPath(); g.arc(e.x, e.y, 58, 0, 7); g.stroke(); g.globalAlpha = 1; } }
    else if (e.key === "echo") {
      // The real Echo is solid, with ripple rings; while it shuffles places with its copies it goes as pale as they are (follow it).
      if (e.shuf > 0) { echoBody(g, s, e, 0.5, low); return; }
      const c = BIG.echo; if (c) drop(g, c, e.x, e.y, 92, 118, Math.PI); echoBody(g, s, e, low ? 1 : 0.88 + 0.12 * Math.sin(s.t * 6), low); g.strokeStyle = "#bfe9ff"; g.lineWidth = 2.5; for (let i = 0; i < 2; i++) { const k = low ? 0.4 + i * 0.3 : (s.t * 0.8 + i * 0.5) % 1; g.globalAlpha = 0.6 * (1 - k); g.beginPath(); g.arc(e.x, e.y, 40 + 60 * k, 0, 7); g.stroke(); } g.globalAlpha = 1;
    }
    else if (e.key === "lastbell") {
      // Winding up: it swings back and an amber ring closes in on it (the tell). Open after a toll: a lime ring and a lit clapper.
      const w = e.wind > 0 ? 1 - e.wind / 1.15 : 0; draw1(g, "lastbell", e.x, e.y, Math.sin(e.t * 0.7) * 0.12 - (low ? 0 : 0.22 * Math.sin(w * 3.14)));
      if (w > 0) { g.strokeStyle = "#ffd23f"; g.lineWidth = 4; g.globalAlpha = 0.45 + 0.5 * w; g.beginPath(); g.arc(e.x, e.y + 10, 190 - 110 * w, 0, 7); g.stroke(); g.globalAlpha = 1; }
      if (e.open > 0) { g.fillStyle = "#c6ff4f"; g.beginPath(); g.arc(e.x, e.y + 58, 15, 0, 7); g.fill(); g.strokeStyle = "#05020c"; g.lineWidth = 3; g.stroke(); g.strokeStyle = "#c6ff4f"; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.arc(e.x, e.y + 8, 104, low ? 0 : s.t * 2, (low ? 0 : s.t * 2) + 6.283 * Math.min(1, e.open / 2.4)); g.stroke(); g.setLineDash([]); }
    }
    else draw1(g, "maker", e.x, e.y, e.t * 0.3);
    if (e.key === "student" && e.guard > 0) {
      // Guarded: a pale aqua glass dome with an ink edge and a clock arc that runs down. Nothing gets through.
      const R = 64, k = Math.max(0, e.guard / (e.guardMax || 1)), rot = low ? 0 : s.t * 0.4; g.fillStyle = "#9ffcff26"; g.beginPath(); g.arc(e.x, e.y, R, 0, 7); g.fill();
      g.save(); g.translate(e.x, e.y); g.rotate(rot); tube(g, circ(6, R, 0), "#9ffcff", null, 3); g.restore();
      g.strokeStyle = "#05020c"; g.lineWidth = 8; g.beginPath(); g.arc(e.x, e.y, R + 12, -1.57, -1.57 + 6.283 * k); g.stroke(); g.strokeStyle = "#9ffcff"; g.lineWidth = 4; g.stroke();
    } else if (e.key === "student" && e.stun > 0) {
      // Guard broken: a lime dashed ring means "open, hit her now".
      g.strokeStyle = "#c6ff4f"; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.arc(e.x, e.y, 60, low ? 0 : s.t * 2, (low ? 0 : s.t * 2) + 6.283); g.stroke(); g.setLineDash([]);
    }
    if (e.key === "maker") draw1(g, "needle", e.x, e.y, (e.spin || 0) + 1.57);
    if (e.key === "maker" && e.shell && e.hp > e.max * 0.02) {
      // The compass shell: whole plates bright cyan, cracked ones dim and broken ones gone; the gap is marked with a lime dashed arc.
      const st = 6.2832 / e.shell.length, R = 82, full = e.max * 0.025; g.lineCap = "butt";
      for (let i = 0; i < e.shell.length; i++) { const a = e.rot + i * st, hp = e.shell[i]; if (hp > 0) { g.strokeStyle = "#05020c"; g.lineWidth = 13; g.beginPath(); g.arc(e.x, e.y, R, a - st * 0.44, a + st * 0.44); g.stroke(); g.strokeStyle = hp > full * 0.5 ? "#3fd8f2" : "#1f7f93"; g.lineWidth = 7; g.stroke(); if (e.plateHit === i && e.hurt > 0 && !low) { g.strokeStyle = "#e6fdff"; g.lineWidth = 2; g.stroke(); } } else { g.strokeStyle = "#c6ff4f"; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.arc(e.x, e.y, R, a - st * 0.5, a + st * 0.5); g.stroke(); g.setLineDash([]); } }
    }
    if (white) { g.globalAlpha = 0.18; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; }
    if (e.burn > 0) flames(g, s, e);
  }
  // Things that belong to the sky rather than to one enemy: warnings, walls, the shots of new guns.
  function drawField(g, s) {
    // The Last Bell's toll wave: a bronze band across the sky; where it's about to reach you it turns cyan (dash now).
    for (const w of s.waves) { g.strokeStyle = "#05020c"; g.lineWidth = 14; g.beginPath(); g.arc(w.x, w.y, w.r, 0, 7); g.stroke(); g.strokeStyle = "#ff9a3d"; g.lineWidth = 8; g.stroke(); g.strokeStyle = "#ffd23f"; g.lineWidth = 2; g.stroke();
      const p = s.ship, off = Math.hypot(p.x - w.x, p.y - w.y) - w.r; if (!w.done && Math.abs(off) < 95) { const a = Math.atan2(p.y - w.y, p.x - w.x), h = 60 / Math.max(60, w.r); g.strokeStyle = "#3fd8f2"; g.lineWidth = 9; g.beginPath(); g.arc(w.x, w.y, w.r, a - h, a + h); g.stroke(); g.strokeStyle = "#e6fdff"; g.lineWidth = 2; g.stroke(); } }
    for (const l of s.lanes) { g.fillStyle = `rgba(255,79,123,${0.08 + 0.25 * (1 - l.tele)})`; g.fillRect(l.x - 46, 0, 92, 900); g.strokeStyle = "#ff4f7b"; g.setLineDash([12, 10]); g.lineWidth = 2; g.strokeRect(l.x - 46, -4, 92, 908); g.setLineDash([]); }
    for (const w of s.walls) { if (w.tele > 0) { g.strokeStyle = "#ff4f7baa"; g.setLineDash([10, 10]); g.lineWidth = 2; } else { g.strokeStyle = "#ff4f7b"; g.lineWidth = 7; g.globalAlpha = 0.3; g.beginPath(); g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2); g.stroke(); g.globalAlpha = 1; g.lineWidth = 3; } g.beginPath(); g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2); g.stroke(); g.setLineDash([]); if (w.tele <= 0) { g.strokeStyle = "#fff"; g.lineWidth = 1; g.beginPath(); g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2); g.stroke(); } }
    // Lightning: a wide glow in its colour, then a white-hot core along the same jagged path.
    for (const a of s.arcs) { const n = 6, pts = [[a.x1, a.y1]]; for (let i = 1; i < n; i++) pts.push([a.x1 + ((a.x2 - a.x1) * i) / n + (Math.random() - 0.5) * 22, a.y1 + ((a.y2 - a.y1) * i) / n + (Math.random() - 0.5) * 22]); pts.push([a.x2, a.y2]);
      g.lineJoin = "round"; g.lineCap = "round"; for (const [w, c, al] of [[10, a.c || "#c6ff4f", 0.3], [4, a.c || "#c6ff4f", 1], [1.6, "#fff", 1]]) { g.globalAlpha = al; g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } g.globalAlpha = 1; if (a.c) { g.fillStyle = "#fff"; g.beginPath(); g.arc(a.x2, a.y2, 5, 0, 7); g.fill(); } }
    for (const b of s.blasts) { const r = b.r * (1.3 - b.left); g.globalAlpha = b.left * 1.2; g.fillStyle = "#ff9a3d"; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.fill(); g.globalAlpha = Math.min(1, b.left * 3); g.strokeStyle = "#ffd23f"; g.lineWidth = 6; g.stroke(); g.globalAlpha = 1; }
    for (const [x, y] of s.drones || []) draw1(g, "drone", x, y, s.t * 3); for (const [x, y] of s.wings || []) draw1(g, "wingDrone", x, y + Math.sin(s.t * 5 + x) * 3);
    const r = s.run, sky = r && r.phase === "room" ? r.sky : null;
    if (sky === "tide") { // streaks that run with the current, and chevrons at the edges showing which way it pulls
      const k = Math.min(1, Math.abs(r.tide || 0) / 70), dir = (r.tide || r.tideDir) >= 0 ? 1 : -1; g.fillStyle = "#7dfcff";
      for (let i = 0; i < 12; i++) { const y = ((i * 79 + s.t * 30) % S.H), len = 50 + (i % 4) * 26, x = (((i * 131 + s.t * 260 * dir) % (S.W + 200)) + S.W + 200) % (S.W + 200) - 100; g.globalAlpha = (0.12 + (i % 3) * 0.06) * (0.5 + k); g.fillRect(x, y, len, 3); }
      g.globalAlpha = 0.25 + 0.45 * k; g.strokeStyle = "#7dfcff"; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round";
      for (let i = 0; i < 4; i++) { const y = 150 + i * 190 + ((s.t * 40) % 40), x = dir > 0 ? S.W - 22 : 22; for (let j = 0; j < 2; j++) { const cx = x - dir * j * 12; g.beginPath(); g.moveTo(cx - dir * 8, y - 10); g.lineTo(cx, y); g.lineTo(cx - dir * 8, y + 10); g.stroke(); } }
      g.globalAlpha = 1;
    } else if (sky === "well" && r.well) { // a slow swirl round a dark middle: red shots bend into it and vanish
      const w = r.well; g.save(); g.translate(w.x, w.y); g.globalAlpha = 0.12; g.fillStyle = "#b48cff"; g.beginPath(); g.arc(0, 0, 280, 0, 7); g.fill(); g.globalAlpha = 1; g.lineCap = "round";
      for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? "#b48cff" : "#ff5fd8"; g.lineWidth = 3; g.globalAlpha = 0.55; g.beginPath(); for (let j = 0; j <= 16; j++) { const f = j / 16, a = i * 1.571 + f * 3 - s.t * 1.4, rr = 26 + 120 * f; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = "#05020c"; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.strokeStyle = "#ff5fd8"; g.lineWidth = 3; g.stroke(); g.restore();
    } else if (sky === "toll") { // the top edge hums bronze; each toll leaves a ring where it rang
      g.fillStyle = "#ff9a3d"; g.globalAlpha = 0.12 + 0.06 * Math.sin(s.t * 4); g.fillRect(0, 0, S.W, 34); g.globalAlpha = 0.5; g.fillRect(0, 0, S.W, 4); g.globalAlpha = 1;
      const k = 1 - Math.max(0, (r.tollT || 0) - 2.4) / 1; if (r.tollX != null && k < 1) { g.strokeStyle = "#ffd23f"; g.lineWidth = 4; g.globalAlpha = 1 - k; g.beginPath(); g.arc(r.tollX, 0, 30 + 160 * k, 0, Math.PI); g.stroke(); g.globalAlpha = 1; }
    } else if (sky === "glass") { // the side walls turn to glowing glass: red shots bounce off them once
      const w = 0.55 + 0.2 * Math.sin(s.t * 3);
      for (const x of [0, S.W - 6]) { g.fillStyle = "#b48cff"; g.globalAlpha = 0.12 * w; g.fillRect(x === 0 ? 0 : S.W - 26, 0, 26, S.H); g.globalAlpha = 0.35 * w; g.fillRect(x === 0 ? 0 : S.W - 12, 0, 12, S.H); g.globalAlpha = 0.9; g.fillStyle = "#e9d8ff"; g.fillRect(x, 0, 6, S.H); }
      g.fillStyle = "#fff"; for (let i = 0; i < 5; i++) { const y = ((i * 211 + s.t * 120) % (S.H + 80)) - 40; g.globalAlpha = 0.7; g.fillRect(i % 2 ? S.W - 5 : 1, y, 4, 34); } g.globalAlpha = 1;
    }
  }
  // Power you can see: shots grow and change colour by how hard they hit (gold, orange, hot magenta, white-violet plasma).
  // Each tier is its own picture, recoloured pixel by pixel once (white centres stay white), so a shot is still one drawImage.
  const TIERS = [{ at: 0, c: null }, { at: 1.15, c: [255, 154, 61], glow: "#ff9a3d" }, { at: 1.4, c: [255, 79, 216], glow: "#ff5fd8" }, { at: 1.75, c: [200, 150, 255], glow: "#a36bff" }];
  const tierOf = (p) => { let t = 0; for (let i = 1; i < TIERS.length; i++) if (p >= TIERS[i].at) t = i; return t; };
  const tierColor = (t) => (t ? TIERS[t].glow : "#ffd23f");
  const tierCache = new Map();
  function tiered(base, t) {
    if (!t || !base) return base; let l = tierCache.get(base); if (!l) tierCache.set(base, (l = [])); if (l[t]) return l[t];
    const T = TIERS[t], k = Math.pow(1.15, t), pad = 6 * t, W = base.width, H = base.height, px = W / base.w;
    const re = document.createElement("canvas"); re.width = W; re.height = H; const rx = re.getContext("2d"); rx.drawImage(base, 0, 0); const d = rx.getImageData(0, 0, W, H), a = d.data;
    for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const hi = Math.max(a[i], a[i + 1], a[i + 2]) / 255, wh = Math.min(a[i], a[i + 1], a[i + 2]) / 255, m = Math.min(1, wh * 1.25); for (let j = 0; j < 3; j++) a[i + j] = Math.round(T.c[j] * hi * (1 - m) + 255 * m); }
    rx.putImageData(d, 0, 0);
    const w = base.w * k + pad * 2, h = base.h * k + pad * 2, c = document.createElement("canvas"); c.width = Math.round(w * px); c.height = Math.round(h * px); const x = c.getContext("2d");
    x.save(); x.translate(c.width / 2, c.height / 2); x.scale(c.width / 2, c.height / 2); const rg = x.createRadialGradient(0, 0, 0, 0, 0, 1); rg.addColorStop(0, T.glow + "aa"); rg.addColorStop(0.45, T.glow + "55"); rg.addColorStop(1, T.glow + "00"); x.fillStyle = rg; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); x.drawImage(re, (c.width - W * k) / 2, (c.height - H * k) / 2, W * k, H * k);
    c.w = w; c.h = h; l[t] = c; return c;
  }
  // The school ring under the rocket: one arc for each school you hold parts from, thicker with more levels. Remade only when it changes.
  let ringKey = "", ringPic = null;
  function ring(s) {
    const lv = {}; for (const k of Object.keys(s.p)) if (s.p[k] > 0 && S.PARTS[k]) { const sc = S.PARTS[k].school; lv[sc] = (lv[sc] || 0) + s.p[k]; }
    const ks = Object.keys(S.SCHOOLS).filter((k) => lv[k]), key = ks.map((k) => k + lv[k]).join(); if (key !== ringKey) { ringKey = key; ringPic = ks.length ? PICF(110, 110, (x) => { const n = ks.length, gap = n > 1 ? 0.22 : 0; x.lineCap = "round"; ks.forEach((k, i) => { const a0 = (i / n) * 6.283 + gap / 2, a1 = ((i + 1) / n) * 6.283 - gap / 2, w = Math.min(9, 3 + lv[k] * 0.9); x.strokeStyle = "#05020c"; x.lineWidth = w + 5; x.beginPath(); x.arc(0, 0, 44, a0, a1); x.stroke(); x.strokeStyle = SC(k); x.globalAlpha = 0.25; x.lineWidth = w * 2.6; x.stroke(); x.globalAlpha = 1; x.lineWidth = w; x.stroke(); x.strokeStyle = "#ffffffaa"; x.lineWidth = 1.2; x.stroke(); }); }) : null; }
    return ringPic;
  }
  // Burning (Cinder Rounds, Steam, Wildfire): flickering flames around the enemy, from one picture.
  function flames(g, s, e) { const n = e.kind === "boss" ? 5 : 3, r = e.r * 0.8; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + s.t * 1.7 + (e.id || 0), f = 0.8 + 0.3 * Math.sin(s.t * 18 + i * 2); draw1(g, "flame", e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.7 - 4, 0, f); } }
  // A portal's two pictures, made once per colour and size: the swirl (turned as it's drawn) and the rim.
  const portals = {};
  function portal(c, h) {
    const k = c + h; if (portals[k]) return portals[k]; const R = h + 22;
    const swirl = PICF(R * 2, R * 2, (x) => { const g2 = x.createRadialGradient(0, 0, 0, 0, 0, h); g2.addColorStop(0, "#05020c"); g2.addColorStop(0.55, "#120626"); g2.addColorStop(1, c + "aa"); x.fillStyle = g2; x.beginPath(); x.arc(0, 0, h, 0, 7); x.fill(); x.lineCap = "round";
      for (let i = 0; i < 5; i++) { x.strokeStyle = c; x.globalAlpha = 0.55; x.lineWidth = 4; x.beginPath(); for (let j = 0; j <= 24; j++) { const f = j / 24, a = (i / 5) * 6.283 + f * 3.4, r = h * (0.12 + 0.86 * f); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.stroke(); x.strokeStyle = "#fff"; x.globalAlpha = 0.25; x.lineWidth = 1.5; x.stroke(); } x.globalAlpha = 1; });
    const rim = PICF(R * 2, R * 2, (x) => { const ring = (w, col, a = 1) => { x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.arc(0, 0, h, 0, 7); x.stroke(); x.globalAlpha = 1; }; ring(30, c, 0.12); ring(18, c, 0.22); ring(13, "#05020c"); ring(7, c); ring(1.6, "#fff");
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; x.save(); x.rotate(a); x.fillStyle = "#05020c"; x.fillRect(h - 6, -4, 12, 8); x.fillStyle = c; x.fillRect(h - 4, -2, 8, 4); x.restore(); } });
    return (portals[k] = { swirl, rim });
  }
  const SHOTPIC = { wave: "waveShot", nova: "novaShell", shard: "shard", arc: "arcSpark", bounce: "bounceShot", orbit: "blade", charge: "chargeShot", mines: "mineShot", ally: "allyShot", needle: "needleShot", flak: "flakShot", pellet: "pellet", rail: "rail", ripper: "saw", hail: "hail", drone: "droneShot", mortar: "shell", wing: "wingDart", ram: "ramSpike", lode: "lodeStone" };
  let shotTier = 0, shotBig = 1, shotLong = 1; const setTier = (n, big = 1, long = 1) => { shotTier = n; shotBig = big; shotLong = long; };
  function drawShot(g, s, b) { const k = SHOTPIC[b.gun]; if (!k) return false; const c = b.gun === "ally" ? pic(k) : tiered(pic(k), shotTier), rot = b.gun === "ripper" || b.gun === "orbit" ? s.t * 14 : b.gun === "mines" ? s.t * 2 : b.gun === "hail" || b.gun === "wing" || b.gun === "ram" || b.gun === "needle" || b.gun === "bounce" || b.gun === "shard" || b.gun === "wave" ? Math.atan2(b.vx, -b.vy) : b.gun === "nova" || b.gun === "lode" ? s.t * 6 : 0; const grow = (b.sz || 1) * (b.gun === "charge" ? 0.45 + 0.75 * (b.big || 0) : b.gun === "mines" ? 1 + 0.12 * Math.sin(s.t * 9 + b.x) : 1), w = c.w * shotBig * grow, h = c.h * shotBig * grow * (["ripper", "mortar", "flak", "orbit", "mines", "charge", "lode"].includes(b.gun) ? 1 : shotLong); if (rot) { g.save(); g.translate(b.x, b.y); g.rotate(rot); g.drawImage(c, -w / 2, -h / 2, w, h); g.restore(); } else g.drawImage(c, b.x - w / 2, b.y - h / 2, w, h); return true; }
  const drawBad = (g, b) => { if (b.disc) { draw1(g, "disc", b.x, b.y, b.left * 9); return true; } if (b.split != null) { const k = Math.max(0, b.split / 0.45); g.strokeStyle = "#ff4f7b"; g.lineWidth = 2; g.globalAlpha = 0.8; g.beginPath(); g.arc(b.x, b.y, 14 + 16 * k, 0, 7); g.stroke(); g.globalAlpha = 1; draw1(g, "splitShot", b.x, b.y); return true; } return false; };
  function init(picMaker) { PICF = picMaker; }
  const BIGART = () => BIG;
  window.CDraw = { shadeCanvas, shadowOf, drop, portal, setTier, tierOf, tiered, tierColor, ring, init, drawEnemy, drawField, drawShot, drawBad, loadBig, pic, draw1, BIG: BIGART, SC };
})();
