// Comet Dojo, Series one: the game page. Rules are in sector.js (seeded, no page code); drawing for enemies in draw.js;
// the cast and story in cast.js. This file is the loop, the screens, saving, sound and the Flight School.
(function () {
  "use strict";
  const A = KitArcade, S = Sector, D = CDraw, C = CCast, $ = (i) => document.getElementById(i);
  const esc = (t) => String(t).replace(/[<&"]/g, (c) => ({ "<": "&lt;", "&": "&amp;", '"': "&quot;" })[c]), num = (n) => Math.round(n).toLocaleString("en-US");
  // The two series: Series one is the Rust Reef and the Toll-Keeper; Series two (open after a first win) is the Glass Tide,
  // with the First Student's duel at the midterm and the Mapmaker at the end.
  const SER = {
    1: { game: { levels: 10, act: 1, last: 1, roomSecs: 15 }, name: "Series one", place: "Rust Reef", boss: "The Toll-Keeper's gate" },
    2: { game: { levels: 10, act: 2, last: 2, roomSecs: 16 }, name: "Series two", place: "Glass Tide", boss: "The Mapmaker's gate", duel: "The First Student", won: "won2", intro: "intro2" },
    // Series three (open after a Series two win) is the Bellwake: the Echo at the midterm, the Last Bell at the end.
    3: { game: { levels: 10, act: 3, last: 3, roomSecs: 17 }, name: "Series three", place: "Bellwake", boss: "The Last Bell's gate", duel: "The Echo", won: "won3", intro: "intro3" }
  };
  const SAVE = "comet-school", SET = "comet-settings";
  const TEST = /[?&]test\b/.test(location.search);

  /* ---------- Saving: progress (stamps, Flight School, belts, codex) and settings ---------- */
  const fresh = () => ({ v: 1, stamps: 0, own: {}, train: {}, belt: 0, exam: 0, runs: 0, wins: 0, best: 0, seen: {}, codex: { foes: {}, parts: {}, events: {}, cores: {} }, picks: {}, last: null, series: 1, flags: {}, orders: [], bests: {}, keep: {} });
  const load = () => { try { const d = JSON.parse(localStorage.getItem(SAVE) || "null"); return d ? { ...fresh(), ...d, codex: { ...fresh().codex, ...(d.codex || {}) } } : fresh(); } catch { return fresh(); } };
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(prog)); } catch {} };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loadSet = () => { try { return { snd: 1, music: 1, vol: 0.8, low: calm ? 1 : 0, sens: 1.15, words: 1, assist: 0, ...JSON.parse(localStorage.getItem(SET) || "{}") }; } catch { return { snd: 1, music: 1, vol: 0.8, low: calm ? 1 : 0, sens: 1.15, words: 1, assist: 0 }; } };
  let prog = load(), set = loadSet();
  // The series being flown (or picked in the hangar): Series two only once Series one has been won.
  const open2 = () => prog.wins >= 1, open3 = () => (prog.won2 || 0) >= 1, isOpen = (n) => n === 1 || (n === 2 ? open2() : open3()), campOn = () => prog.mode === "campaign", pickSer = () => (campOn() ? (prog.camp && prog.camp.ser) || 1 : prog.series === 3 && open3() ? 3 : prog.series === 2 && open2() ? 2 : 1), ser = () => SER[(s && s.run && s.run.act) || pickSer()];
  const saveSet = () => { try { localStorage.setItem(SET, JSON.stringify(set)); } catch {} };

  /* ---------- Screen, input, pictures ---------- */
  const scr = A.screen($("c"), S.W, S.H), g = scr.g, input = A.input($("stage"), { scale: () => scr.scale }), shake = A.shake(), dust = A.particles(260);
  let dashWas = 0, hullSeen = -1, hullShow = 0, s = null, later = null, pops = [], fx = [], ghostN = 0, playing = false, hitStop = 0, flash = 0, trail = [], words = [], ghosts = [], swapAsk = false, dashAsk = false, lastPhase = "", lastRoom = -1, slowMo = 0, deathAt = 0;
  const PX = Math.max(1, ($("c").width || 450) / S.W);
  const pic = (w, h, f) => { const c = document.createElement("canvas"); c.width = Math.round(w * PX); c.height = Math.round(h * PX); const x = c.getContext("2d"); x.scale(PX, PX); x.translate(w / 2, h / 2); f(x); c.w = w; c.h = h; return c; };
  D.init(pic);
  const disc = (x, r, c, a) => { x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.globalAlpha = 1; };
  // Red with a white centre means danger; player shots are gold, cyan or mint and never red.
  const P = {
    bad: pic(40, 40, (x) => { disc(x, 15, "#ff4f7b", 0.18); disc(x, 11.5, "#05020c", 1); disc(x, 9.5, "#ff4f7b", 1); disc(x, 5, "#fff", 1); }),
    rock: pic(40, 40, (x) => { x.beginPath(); for (let i = 0; i < 9; i++) { const a = i * 0.698, r = i % 2 ? 11 : 15; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fillStyle = "#3a1626"; x.fill(); x.lineWidth = 4; x.strokeStyle = "#05020c"; x.stroke(); x.lineWidth = 2.4; x.strokeStyle = "#ff4f7b"; x.stroke(); disc(x, 4.5, "#fff", 1); }),
    pulse: pic(16, 44, (x) => { x.fillStyle = "#ffd23f"; x.globalAlpha = 0.25; x.fillRect(-6, -20, 12, 40); x.globalAlpha = 1; x.fillRect(-3, -17, 6, 34); x.fillStyle = "#fff"; x.fillRect(-1.3, -14, 2.6, 24); }),
    splinter: pic(16, 26, (x) => { x.fillStyle = "#ffd23f"; x.globalAlpha = 0.25; x.fillRect(-6, -12, 12, 24); x.globalAlpha = 1; x.fillRect(-3, -9, 6, 18); x.fillStyle = "#fff"; x.fillRect(-1.3, -7, 2.6, 12); }),
    swarm: pic(22, 22, (x) => { disc(x, 10, "#5ff0a8", 0.2); disc(x, 5.5, "#5ff0a8", 1); disc(x, 2.6, "#fff", 1); }),
    boomer: pic(52, 52, (x) => { disc(x, 24, "#ffd23f", 0.14); x.strokeStyle = "#ffd23f"; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.arc(0, 0, 15, 0.3, 2.6); x.stroke(); x.beginPath(); x.arc(0, 0, 15, 3.4, 5.7); x.stroke(); disc(x, 5, "#fff", 1); }),
    lance: pic(30, 120, (x) => { x.fillStyle = "#7dfcff"; x.globalAlpha = 0.2; x.fillRect(-13, -58, 26, 116); x.globalAlpha = 1; x.fillRect(-5, -56, 10, 112); x.fillStyle = "#fff"; x.fillRect(-2, -50, 4, 92); })
  };
  const ART = {};
  const svgPic = (name, inner, w, h, vb) => new Promise((ok) => { const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); ART[name] = { c, w, h }; ok(); }; i.onerror = () => ok(); i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="${vb}">${inner}</svg>`); });
  async function loadArt() { const p = PALS.n; await Promise.all([svgPic("ship", magpieTop(p), 96, 122, "-130 -125 260 330"), svgPic("skiff", skiffTop(p), 84, 80, "-115 -125 230 220"), svgPic("mine", mine(p), 60, 60, "-66 -66 132 132"), svgPic("sky", defs(p) + skyDown(p), 450, 900, "0 0 900 1800"), D.loadBig()]); }
  // The sky: three copies of one picture slid by the browser (redrawing it cost 60% of the frame rate).
  // Series two flies under a teal-tinted copy of the same picture (made once, then slid the same way).
  let skyBuilt = 0, skyWant = 1; const skyFor = (n) => { skyWant = n; };
  // Series three's Bellwake sky is the same picture tinted bronze and rose, also made once.
  function skyPic(n) { if (n === 1) return ART.sky.c; const key = `sky${n}`; if (ART[key]) return ART[key]; const c = document.createElement("canvas"); c.width = ART.sky.c.width; c.height = ART.sky.c.height; const x = c.getContext("2d"); x.drawImage(ART.sky.c, 0, 0); x.globalCompositeOperation = "color"; x.globalAlpha = 0.45; x.fillStyle = n === 3 ? "#d8743a" : "#1fb5b8"; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = "destination-in"; x.globalAlpha = 1; x.drawImage(ART.sky.c, 0, 0); ART[key] = c; return c; }
  function skyMove(t) { const el = $("sky"); if (!ART.sky) return; if (skyBuilt !== skyWant) { skyBuilt = skyWant; el.textContent = ""; const src = skyPic(skyWant); for (const [top, flip] of [[0, 0], [33.333, 1], [66.666, 0]]) { const c = document.createElement("canvas"); c.width = src.width; c.height = src.height; c.getContext("2d").drawImage(src, 0, 0); c.style.top = top + "%"; if (flip) c.style.transform = "scaleY(-1)"; el.append(c); } } el.style.transform = `translate3d(0,${(((t * 40) % (S.H * 2)) / S.H) * 33.333}%,0)`; }
  const put = (a, x, y, w = a.w, h = a.h) => g.drawImage(a.c, x - w / 2, y - h / 2, w, h);

  /* ---------- Sound: small synth sounds and a synthwave loop, all made in the browser (no files) ---------- */
  let au = null, master = null, musicBus = null, seq = null;
  function wake() { try { if (!au) { au = new (window.AudioContext || window.webkitAudioContext)(); master = au.createGain(); const comp = au.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15; const lim = au.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08; master.connect(comp); comp.connect(lim); lim.connect(au.destination); loadSounds(); musicBus = au.createGain(); musicBus.connect(master); } master.gain.value = set.vol; musicBus.gain.value = set.music ? 0.5 : 0; au.resume(); } catch {} }
  const tone = (f, d, v, type = "sine", to = 0, bus = null) => { if (!au || !set.snd) return; const t = au.currentTime, o = au.createOscillator(), a = au.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); a.gain.setValueAtTime(v, t); a.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(a); a.connect(bus || master); o.start(t); o.stop(t + d + 0.02); };
  let noiseBuf = null; const noise = (d, v, f = 1200) => { if (!au || !set.snd) return; if (!noiseBuf) { noiseBuf = au.createBuffer(1, au.sampleRate * 0.5, au.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; } const t = au.currentTime, n = au.createBufferSource(), bq = au.createBiquadFilter(), a = au.createGain(); n.buffer = noiseBuf; bq.type = "bandpass"; bq.frequency.value = f; a.gain.setValueAtTime(v, t); a.gain.exponentialRampToValueAtTime(0.0001, t + d); n.connect(bq); bq.connect(a); a.connect(master); n.start(t); n.stop(t + d); };
  // The studio set (second audit, 24 Nov 2026): sounds and music made with Tone.js and packed into two files by
  // scripts/sound/render.mjs, loaded after the first tap. Until they arrive (or if they can't), the beeps above play instead.
  const SND = { buf: null, map: null, mus: null, mmap: null, last: {} };
  function loadSounds() {
    if (SND.tried) return; SND.tried = true;
    const get = (f, j, done) => Promise.all([fetch(`audio/${f}`).then((r) => r.arrayBuffer()), fetch(`audio/${j}`).then((r) => r.json())]).then(([ab, m]) => new Promise((ok, no) => au.decodeAudioData(ab, ok, no)).then((b) => done(b, m))).catch(() => {});
    get("sounds.mp3", "sounds.json", (b, m) => { SND.buf = b; SND.map = m; });
    get("music.mp3", "music.json", (b, m) => { SND.mus = b; SND.mmap = m; if (seq && seq.want) music(true, seq.boss); });
  }
  // Play one sound from the sheet: v = volume, rate = pitch (1 = as made), gap = the shortest time between two of them.
  const sfx = (k, { v = 1, rate = 1, gap = 0.03, pan = 0 } = {}, fallback = null) => {
    if (!au || !set.snd) return; if (!SND.buf || !SND.map[k]) { if (fallback) fallback(); return; }
    const t = au.currentTime; if (t - (SND.last[k] || -9) < gap || SND.on >= 10) return; SND.last[k] = t; SND.on = (SND.on || 0) + 1;
    const [at, len] = SND.map[k], n = au.createBufferSource(), a = au.createGain(); n.buffer = SND.buf; n.playbackRate.value = rate * (0.97 + Math.random() * 0.06); a.gain.value = v / Math.sqrt(SND.on); // quieter each when many play at once, so the mix never clips
    if (pan && au.createStereoPanner) { const p = au.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); n.connect(a); a.connect(p); p.connect(master); } else { n.connect(a); a.connect(master); }
    n.onended = () => { SND.on--; }; n.start(t, at, len);
  };
  const panX = (x) => ((x || S.W / 2) / S.W - 0.5) * 0.7;
  // Which family each gun's shot sound comes from.
  const SHOTSND = { lode: "shot_heavy", ram: "shot_spread", wing: "shot_zap", lance: "shot_heavy", rail: "shot_heavy", charge: "shot_heavy", splinter: "shot_spread", flak: "shot_spread", nova: "shot_spread", mortar: "shot_spread", arc: "shot_zap", chain: "shot_zap", mines: "shot_soft", orbit: "shot_soft", ripper: "shot_soft", swarm: "shot_soft", boomer: "shot_soft" };
  // Music: A minor, F, C, G at 104 beats a minute. Bass and arpeggio; drums join for the boss.
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // Each series has its own loop (Rust Reef, Glass Tide, Bellwake); bosses and duels add its drum layer, in time with it.
  let loopSrc = [];
  function music(on, boss = false) {
    if (!au) return; if (seq) { clearInterval(seq.id); seq = null; } loopSrc.forEach((n) => { try { n.stop(); } catch {} }); loopSrc = [];
    if (!on || !set.music) { if (on) seq = { want: true, boss, id: 0 }; return; }
    if (SND.mus) { const n = (s && s.run && s.run.act) || (typeof pickSer === "function" ? pickSer() : 1), t = au.currentTime + 0.05; for (const k of boss ? [`s${n}`, `s${n}drums`] : [`s${n}`]) { const m = SND.mmap[k]; if (!m) continue; const src = au.createBufferSource(); src.buffer = SND.mus; src.loop = true; src.loopStart = m[0]; src.loopEnd = m[0] + m[1]; src.connect(musicBus); src.start(t, m[0]); loopSrc.push(src); } seq = { want: true, boss, id: 0 }; return; }
    const beat = 60 / 104 / 2; let next = au.currentTime + 0.1, step = 0;
    const note = (f, t, d, v, type, cut) => { const o = au.createOscillator(), a = au.createGain(), lp = au.createBiquadFilter(); o.type = type; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = cut; a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(v, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(lp); lp.connect(a); a.connect(musicBus); o.start(t); o.stop(t + d + 0.05); };
    seq = { want: true, boss, id: setInterval(() => { while (next < au.currentTime + 0.25) { const ch = CH[Math.floor(step / 16) % 4], i = step % 16; if (i % 2 === 0) note(hz(ch[0] - 24), next, beat * 1.8, 0.16, "sawtooth", 420); note(hz(ch[i % 3] + (i % 6 < 3 ? 12 : 0)), next, beat * 0.9, 0.045, "square", 1800); if (boss && i % 4 === 0) { note(60, next, 0.18, 0.4, "sine", 300); } if (boss && i % 8 === 4) { const t = next; setTimeout(() => noise(0.12, 0.05, 2500), Math.max(0, (t - au.currentTime) * 1000)); } next += beat; step++; } }, 60) };
  }

  /* ---------- Drawing the field ---------- */
  const STAR = (() => { const r = A.rng("stars"); return Array.from({ length: 50 }, () => [r() * S.W, r() * S.H, 0.3 + r()]); })();
  const SFX = { kill: ["POW!", "BLAM!", "KRAK!", "ZOK!"], big: ["BOOM!", "KA-BLAM!"], dash: "ZIP!", hit: "OOF!", block: "CLANG!" };
  const word = (t, x, y, c = "#ffd23f", big = 1) => { if (!set.words) return; words.push({ t, x, y, c, big, left: 0.7 }); if (words.length > 6) words.shift(); };
  function draw() {
    const [kx, ky] = set.low ? [0, 0] : shake.at(); g.save(); g.clearRect(0, 0, S.W, S.H); g.translate(kx, ky); const t = s ? s.t : performance.now() / 1000;
    skyMove(t); if (!ART.sky) for (const [x, y0, z] of STAR) { const y = (y0 + t * 260 * z) % S.H; g.globalAlpha = 0.22 + z * 0.3; g.fillStyle = "#cdbcff"; g.fillRect(x, y, z * 1.6, 4 + z * 12); } g.globalAlpha = 1;
    // speed lines, the comic way of saying "fast"
    if (!set.low) { g.strokeStyle = "#f4ecff"; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const x = ((i * 67 + 23) % S.W), y = ((t * 900 + i * 191) % (S.H + 200)) - 100; g.globalAlpha = 0.08 + (i % 3) * 0.04; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 60 + (i % 4) * 30); g.stroke(); } g.globalAlpha = 1; }
    if (!s) { g.restore(); return; }
    for (const q of dust.all) if (q.life > 0) { g.globalAlpha = Math.min(1, q.life * 2) * (set.low ? 0.6 : 1); g.fillStyle = ["#ffd23f", "#5ff0a8", "#b48cff", "#ff5fd8"][q.c]; g.fillRect(q.x - 2.5, q.y - 2.5, 5, 5); } g.globalAlpha = 1;
    if (s.run && s.run.gates) for (const q of s.run.gates) drawGate(q);
    for (const e of s.en) {
      const white = e.hurt > 0 && !set.low;
      if (e.bounty) { g.strokeStyle = "#ffd23f"; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.arc(e.x, e.y, e.r + 14, s.t * 2, s.t * 2 + 6.28); g.stroke(); g.setLineDash([]); g.fillStyle = "#ffd23f"; g.font = "900 italic 13px 'Bricolage Grotesque',system-ui"; g.textAlign = "center"; g.fillText("BOUNTY", e.x, e.y - e.r - 18); }
      if (D.drawEnemy(g, s, e, white, set.low) !== false) { if (e.fuse == null) continue; } else if (ART[e.kind]) { D.drop(g, ART[e.kind].c, e.x, e.y, ART[e.kind].w, ART[e.kind].h); put(ART[e.kind], e.x, e.y); if (white) { g.globalAlpha = 0.35; g.fillStyle = "#fff"; g.beginPath(); g.arc(e.x, e.y, e.r, 0, 7); g.fill(); g.globalAlpha = 1; } }
      if (e.fuse != null) { const on = set.low ? true : Math.floor(e.fuse * 9) % 2 === 0; if (on) { g.strokeStyle = "#ff4f7b"; g.lineWidth = 3; g.globalAlpha = 0.9; g.beginPath(); g.arc(e.x, e.y, 30 + e.fuse * 40, 0, 7); g.stroke(); g.globalAlpha = 1; } g.drawImage(P.bad, e.x - 13, e.y - 13, 26, 26); }
    }
    drawRun();
    for (const c of s.coins || []) D.draw1(g, "coin", c.x, c.y, 0, c.left < 1.5 ? 0.5 + 0.5 * Math.sin(c.left * 12) ** 2 : 1);
    for (const k of s.packs) { const b = Math.sin(s.t * 4 + k.x) * 3, a = k.left < 2 ? (Math.floor(k.left * 6) % 2 ? 0.4 : 1) : 1; D.draw1(g, k.gun ? "crate" : "pack", k.x, k.y + b, k.gun ? Math.sin(s.t * 2) * 0.15 : 0, a); if (k.gun) { g.globalAlpha = a; g.font = "900 italic 13px 'Bricolage Grotesque',system-ui"; g.textAlign = "center"; g.lineJoin = "round"; g.lineWidth = 4; g.strokeStyle = "#05020c"; g.strokeText(S.GUNS[k.gun].label, k.x, k.y + b - 30); g.fillStyle = "#f4ecff"; g.fillText(S.GUNS[k.gun].label, k.x, k.y + b - 30); g.globalAlpha = 1; } }
    const tier = D.tierOf(S.power(s)), big = Math.min(1.75, 1 + 0.18 * S.lv(s, "bore")), long = 1 + 0.22 * S.lv(s, "pierce"); D.setTier(tier, big, long);
    for (const b of s.shots) { if (D.drawShot(g, s, b)) continue; const im0 = D.tiered(P[b.gun] || P.pulse, tier), im = { w: im0.w * big, h: im0.h * big * (b.gun === "swarm" || b.gun === "boomer" ? 1 : long) }, imc = im0; const rot = b.gun === "boomer" ? s.t * 16 : b.gun !== "swarm" && Math.abs(b.vx) > 5 ? Math.atan2(b.vx, -b.vy) : 0; if (rot) { g.save(); g.translate(b.x, b.y); g.rotate(rot); g.drawImage(imc, -im.w / 2, -im.h / 2, im.w, im.h); g.restore(); } else g.drawImage(imc, b.x - im.w / 2, b.y - im.h / 2, im.w, im.h); }
    const ally = D.BIG()[s.run.act >= 2 ? "student" : "bast"]; if (s.allyX != null && ally) g.drawImage(ally, s.allyX - 38, s.allyY - 39, 76, 98);
    const p = s.ship; if (s.over !== "lost") {
      for (const q of ghosts) { g.globalAlpha = q.left * 0.6; if (ART.ship) put(ART.ship, q.x, q.y + 14); } g.globalAlpha = 1;
      trail.forEach(([x, y], i) => { g.fillStyle = i % 2 ? "#ff5fd8" : "#3fd8f2"; g.globalAlpha = (i / trail.length) * 0.4; g.fillRect(x - 5, y + 30 + (trail.length - i) * 2.4, 3, 7); g.fillRect(x + 3, y + 30 + (trail.length - i) * 2.4, 3, 7); });
      partSigns(p);
      const rg = D.ring(s); if (rg) { g.save(); g.translate(p.x, p.y + 8); g.rotate(set.low ? 0 : s.t * 0.7); g.drawImage(rg, -rg.w / 2, -rg.h / 2, rg.w, rg.h); g.restore(); }
      for (const q of pops) { const k = 1 - q.left; g.strokeStyle = q.c; g.lineCap = "round"; g.globalAlpha = q.left; g.lineWidth = set.low ? 3 : 8 * q.left + 2; g.beginPath(); g.arc(p.x, p.y, 30 + (set.low ? 30 : 140 * k), 0, 7); g.stroke(); if (!set.low) { g.lineWidth = 4; for (let i = 0; i < 10; i++) { const a = i * 0.628 + q.x, r0 = 40 + 120 * k; g.beginPath(); g.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0); g.lineTo(p.x + Math.cos(a) * (r0 + 22), p.y + Math.sin(a) * (r0 + 22)); g.stroke(); } } } g.globalAlpha = 1;
      g.globalAlpha = s.safe > 0 && s.dashT <= 0 ? (set.low ? 0.6 : Math.floor(s.t * 5) % 2 ? 0.45 : 1) : 1; if (ART.ship) put(ART.ship, p.x, p.y + 14); g.globalAlpha = 1;
      if (s.rig && s.rig !== "courier") { g.strokeStyle = "#05020c"; g.lineCap = "round"; g.lineWidth = 6; g.beginPath(); g.arc(p.x, p.y + 6, 30, 0.5, 2.64); g.stroke(); g.strokeStyle = S.RIGS[s.rig].color; g.lineWidth = 2.5; g.stroke(); } // the rig's trim: a coloured arc under the rocket
      g.fillStyle = "#ff5fd8"; g.globalAlpha = 0.35; g.beginPath(); g.arc(p.x, p.y, 11, 0, 7); g.fill(); g.globalAlpha = 1; const dot = S.N.dot * (1 - 0.14 * S.lv(s, "slip")); g.fillStyle = "#05020c"; g.beginPath(); g.arc(p.x, p.y, dot + 2, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, p.y, dot, 0, 7); g.fill(); if (S.lv(s, "slip")) { g.strokeStyle = "#5ff0a8"; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, dot + 4, 0, 7); g.stroke(); }
    }
    for (const q of smoke) { g.globalAlpha = 0.32 * q.left; g.fillStyle = "#2a2340"; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); } g.globalAlpha = 1;
    for (const q of flashes) { g.globalAlpha = 0.5 * q.left; g.fillStyle = "#fff6e0"; g.beginPath(); g.arc(q.x, q.y, q.r * (1.4 - 0.4 * q.left), 0, 7); g.fill(); } g.globalAlpha = 1;
    for (const d of debris) { const w = d.c.w * d.s; g.globalAlpha = Math.min(1, d.left * 2.2); g.save(); g.translate(d.x, d.y); g.rotate(d.r); g.drawImage(d.c, -w / 2, -w / 2, w, w); g.restore(); } g.globalAlpha = 1;
    for (const q of fx) { const k = 1 - q.left; g.globalAlpha = q.left; g.strokeStyle = q.c; g.lineWidth = set.low ? 3 : q.w * q.left + 1.5; g.beginPath(); g.arc(q.x, q.y, q.r0 + (q.r1 - q.r0) * (set.low ? 1 : k), 0, 7); g.stroke(); } g.globalAlpha = 1;
    g.imageSmoothingEnabled = false; for (const b of s.bad) { if (D.drawBad(g, b)) continue; const im = b.rock ? P.rock : P.bad; g.drawImage(im, b.x - 20, b.y - 20, 40, 40); } g.imageSmoothingEnabled = true; // danger is drawn on top of everything
    for (const w of words) { const k = set.low ? 1 : 1 + Math.max(0, w.left - 0.55) * 3; g.save(); g.translate(w.x, w.y); g.rotate(-0.12); g.scale(k * w.big, k * w.big); g.globalAlpha = Math.min(1, w.left * 3); g.font = "900 italic 26px 'Bricolage Grotesque',system-ui"; g.textAlign = "center"; g.lineJoin = "round"; g.lineWidth = 7; g.strokeStyle = "#05020c"; g.strokeText(w.t, 0, 0); g.fillStyle = w.c; g.fillText(w.t, 0, 0); g.restore(); } g.globalAlpha = 1;
    if (flash > 0 && !set.low) { g.fillStyle = `rgba(255,79,123,${flash * 0.3})`; g.fillRect(-20, -20, S.W + 40, S.H + 40); } else if (flash > 0) { g.strokeStyle = `rgba(255,79,123,${flash})`; g.lineWidth = 10; g.strokeRect(5, 5, S.W - 10, S.H - 10); }
    g.restore(); hud();
  }
  // Each part shows on the rocket while you hold it: the graze circle (Knife Edge), Tailwind's stacks, Momentum's streaks,
  // Slow Current's ripple, Second Skin regrowing, Undertow's glow at low hull. Cheap strokes, only for parts you hold.
  function partSigns(p) {
    const L = (k) => S.lv(s, k), t = s.t;
    if (!s.core.shot && s.guns[s.gun] === "charge" && s.charge > 0) { const c = s.charge, y = p.y - 44; g.globalAlpha = 0.25 + 0.2 * c; g.fillStyle = "#7dfcff"; g.beginPath(); g.arc(p.x, y, 8 + 20 * c, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, y, 3 + 8 * c, 0, 7); g.fill(); g.strokeStyle = c >= 1 ? "#fff" : "#7dfcff"; g.lineWidth = 3; g.beginPath(); g.arc(p.x, y, 16 + 14 * c, -1.57, -1.57 + 6.28 * c); g.stroke(); }
    if (s.odT > 0) { const k = Math.min(1, s.odT / 0.6); g.lineCap = "round"; g.globalAlpha = 0.25 * k; g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(p.x, p.y + 6, 58, 0, 7); g.fill(); g.globalAlpha = k; g.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = i * 1.047 + (set.low ? 0 : t * 4); g.strokeStyle = i % 2 ? "#ff5fd8" : "#ffd23f"; g.beginPath(); g.arc(p.x, p.y + 6, 62, a, a + 0.6); g.stroke(); } g.globalAlpha = 1; }
    if (L("knife")) { const gr = S.N.graze * (s.core.trigger === "dare" ? 1.9 : 1) * (1 + 0.28 * L("knife")) + 8; g.strokeStyle = "#5ff0a8"; g.globalAlpha = 0.35; g.lineWidth = 1.5; g.setLineDash([4, 6]); g.beginPath(); g.arc(p.x, p.y, gr, 0, 7); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    if (L("current") && !set.low) { const k = (t % 2.2) / 2.2; g.strokeStyle = "#3fd8f2"; g.globalAlpha = 0.3 * (1 - k); g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 40 + 200 * k, 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (L("rush") && s.spd > 260) { const a = Math.min(1, s.spd / 380); g.strokeStyle = "#5ff0a8"; g.lineWidth = 3; g.globalAlpha = 0.5 * a; for (const dx of [-30, -14, 14, 30]) { g.beginPath(); g.moveTo(p.x + dx, p.y + 40); g.lineTo(p.x + dx, p.y + 70 + 40 * a); g.stroke(); } g.globalAlpha = 1; }
    if (L("tail") && s.tailN) { g.fillStyle = "#5ff0a8"; for (let i = 0; i < s.tailN; i++) { const y = p.y + 58 + i * 7; g.globalAlpha = 0.9 - i * 0.07; g.beginPath(); g.moveTo(p.x - 10, y + 5); g.lineTo(p.x, y); g.lineTo(p.x + 10, y + 5); g.lineTo(p.x, y + 2); g.closePath(); g.fill(); } g.globalAlpha = 1; }
    if (L("skin") && s.guard < L("skin")) { const k = Math.min(1, (s.skinT || 0) / S.regrowSecs(s)); g.strokeStyle = "#9fb4ff"; g.globalAlpha = 0.6; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 32, -1.57, -1.57 + 6.28 * k); g.stroke(); g.globalAlpha = 1; }
    if (L("under") && s.hull <= 2) { g.strokeStyle = "#ff9a3d"; g.globalAlpha = 0.45 + (set.low ? 0 : 0.25 * Math.sin(t * 8)); g.lineWidth = 6; g.beginPath(); g.arc(p.x, p.y, 54, 0, 7); g.stroke(); g.globalAlpha = 1; }
  }
  function drawRun() {
    const p = s.ship;
    if (s.core.trigger === "echo" && s.past.length > 60) { const [x, y] = s.past[0]; g.globalAlpha = 0.3; if (ART.ship) put(ART.ship, x, y + 14); g.globalAlpha = 1; }
    if (s.core.trigger === "sling") { g.strokeStyle = s.wind >= 0.3 ? "#ffd23f" : "#9b8bb5"; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y, 46, -1.57, -1.57 + 6.28 * s.wind); g.stroke(); }
    for (const q of s.stars) { const a = Math.min(1, q.left), f = q.eat == null ? 1 : 0.45 + 0.55 * (q.eat / S.STAR.eat), ripe = q.eat > 0 && q.age > S.STAR.ripe; g.globalAlpha = 0.16 * a * f; g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); if (ripe) { g.globalAlpha = 0.5 * a; g.strokeStyle = "#ffd23f"; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.arc(q.x, q.y, q.r, set.low ? 0 : s.t * 2, (set.low ? 0 : s.t * 2) + 6.28); g.stroke(); g.setLineDash([]); } g.globalAlpha = a; g.beginPath(); for (let i = 0; i < 10; i++) { const t = i * 0.628 + (set.low ? 0 : s.t), r = (i % 2 ? 7 : 17) * f; g.lineTo(q.x + Math.cos(t) * r, q.y + Math.sin(t) * r); } g.closePath(); g.fill(); g.globalAlpha = 1; }
    for (const w of s.bells) { g.strokeStyle = w.col || "#ff9a3d"; g.globalAlpha = Math.max(0.15, 1 - w.r / w.max); g.lineWidth = set.low ? 4 : 9; g.beginPath(); g.arc(w.x, w.y, w.r, 0, 7); g.stroke(); g.globalAlpha = 1; }
    for (const m of s.beams) if (m.y0 != null) { const w = m.w; g.globalAlpha = 0.2; g.fillStyle = D.tierOf(S.power(s)) ? D.tierColor(D.tierOf(S.power(s))) : "#7dfcff"; g.fillRect(m.x - w * 1.5, m.y1, w * 3, m.y0 - m.y1); g.globalAlpha = 0.55; g.fillRect(m.x - w * 0.7, m.y1, w * 1.4, m.y0 - m.y1); g.globalAlpha = 1; g.fillStyle = "#fff"; g.fillRect(m.x - w * 0.28, m.y1, w * 0.56, m.y0 - m.y1); }
    if (s.core.rule === "twin" && s.over !== "lost") { const x = S.W - p.x; if (ART.ship) { g.globalAlpha = 0.75; put(ART.ship, x, p.y + 14); g.globalAlpha = 1; } g.fillStyle = "#fff"; g.beginPath(); g.arc(x, p.y, S.N.dot, 0, 7); g.fill(); }
    // The dash's charge: a cyan arc that fills round the rocket, a ping when it's ready; the spot a dash is heading for.
    const dmax = Math.max(0.8, S.N.dash - 0.4 * s.thrust), dc = Math.max(0, s.dashCd) / dmax;
    if (dc > 0) { g.globalAlpha = 0.85; g.strokeStyle = "#05020c"; g.lineWidth = 6; g.beginPath(); g.arc(p.x, p.y + 6, 42, 0.6, 2.54); g.stroke(); g.strokeStyle = "#3fd8f2"; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y + 6, 42, 2.54 - 1.94 * (1 - dc), 2.54); g.stroke(); g.globalAlpha = 1; dashWas = 1; }
    else if (dashWas) { dashWas = 0; ring(p.x, p.y, 20, 58, "#3fd8f2", 4); sfx("dash_ready", {}, () => { tone(1046, 0.06, 0.02, "triangle"); }); }
    if (s.dashTo) { const q = s.dashTo; g.strokeStyle = "#3fd8f2"; g.lineWidth = 3; g.globalAlpha = 0.8; g.beginPath(); g.arc(q.x, q.y, 16, 0, 7); g.stroke(); g.beginPath(); g.moveTo(q.x - 24, q.y); g.lineTo(q.x - 10, q.y); g.moveTo(q.x + 10, q.y); g.lineTo(q.x + 24, q.y); g.moveTo(q.x, q.y - 24); g.lineTo(q.x, q.y - 10); g.moveTo(q.x, q.y + 10); g.lineTo(q.x, q.y + 24); g.stroke(); g.globalAlpha = 1; }
    // A hull ring under the rocket for a moment after a hit or a repair, and all the time while hull is low.
    if (s.hull !== hullSeen) { hullSeen = s.hull; hullShow = 2.2; } hullShow -= 1 / 60; if ((hullShow > 0 || s.hull <= 2) && s.over !== "lost") { const n = s.hullMax, a0 = 0.75, span = 1.64, gap = 0.05, low = s.hull <= 2, col = low ? "#ff9a3d" : "#3fd8f2"; g.globalAlpha = Math.min(1, low ? 0.9 : hullShow * 1.5); g.lineCap = "butt"; for (let i = 0; i < n; i++) { const st = a0 + (span * i) / n + gap / 2, en = a0 + (span * (i + 1)) / n - gap / 2; g.strokeStyle = "#05020c"; g.lineWidth = 10; g.beginPath(); g.arc(p.x, p.y + 4, 60, st - 0.02, en + 0.02); g.stroke(); g.strokeStyle = i < s.hull ? col : "#2a1840"; g.lineWidth = 6; g.beginPath(); g.arc(p.x, p.y + 4, 60, st, en); g.stroke(); } g.globalAlpha = 1; }
    if (s.guard > 0) { g.strokeStyle = "#05020c"; g.lineWidth = 7; g.beginPath(); g.arc(p.x, p.y, 32, 0, 7); g.stroke(); g.strokeStyle = "#9fb4ff"; g.lineWidth = 3; g.stroke(); }
    D.drawField(g, s);
  }
  // Gates: an inked arch coloured by what it gives, an icon, and the reward written under it. "?" gates are events.
  const ICON = { hull: [[-3, -12], [3, -12], [3, -3], [12, -3], [12, 3], [3, 3], [3, 12], [-3, 12], [-3, 3], [-12, 3], [-12, -3], [-3, -3]], power: [[0, -14], [11, 2], [4, 2], [4, 13], [-4, 13], [-4, 2], [-11, 2]], quick: [[2, -14], [-9, 3], [-1, 3], [-3, 14], [9, -4], [1, -4]], reach: [[-14, 0], [-6, -8], [-6, -3], [6, -3], [6, -8], [14, 0], [6, 8], [6, 3], [-6, 3], [-6, 8]], guard: [[0, -13], [11, -8], [9, 5], [0, 14], [-9, 5], [-11, -8]], hush: [[-12, -4], [-4, -4], [4, -11], [4, 11], [-4, 4], [-12, 4]] };
  const gateColor = (q) => (q.duel ? "#ff5fd8" : q.boss ? "#ffd23f" : q.event ? "#ff5fd8" : q.school ? S.SCHOOLS[q.school].color : q.yard ? S.YARDS[q.yard].color : q.armory ? "#f4ecff" : S.PLAIN[q.plain].color);
  const gateName = (q) => (q.duel ? "DUEL" : q.boss ? "BOSS" : q.event ? "?" : q.school ? S.SCHOOLS[q.school].label : q.yard ? S.YARDS[q.yard].label : q.armory ? "Armory" : S.PLAIN[q.plain].label);
  const gateWhat = (q) => (q.boss ? q.name || S.BOSSES[q.tier].label : q.event ? "Something's out there" : q.school ? S.SCHOOLS[q.school].teach : q.yard ? S.YARDS[q.yard].what : q.armory ? "A new gun" : S.PLAIN[q.plain].what);
  // Gates are portals: a glowing rim in the gate's colour round a turning swirl, sparks drawn in, the icon floating in the
  // middle and the reward written underneath. Rim and swirl are pictures made once per colour (D.portal), so a gate is a few drawImages.
  function drawGate(q) {
    const c = gateColor(q), h = q.half, near = Math.abs(s.ship.x - q.x) < h, P2 = D.portal(c, h), sq = 0.8, t = s.t; g.save(); g.translate(q.x, q.y);
    g.save(); g.translate(0, -6); g.scale(1, sq);
    if (near) { g.globalAlpha = 0.3; g.fillStyle = c; g.beginPath(); g.arc(0, 0, h + 16, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.save(); g.rotate(set.low ? 0 : t * (q.boss ? 1.1 : 1.8)); g.drawImage(P2.swirl, -P2.swirl.w / 2, -P2.swirl.h / 2, P2.swirl.w, P2.swirl.h); g.restore();
    if (!set.low) { g.fillStyle = "#fff"; for (let i = 0; i < 7; i++) { const k = (t * 0.7 + i / 7) % 1, a = i * 0.9 + k * 3.5, r = h * (1 - k); g.globalAlpha = k; g.fillRect(Math.cos(a) * r - 2, Math.sin(a) * r - 2, 4, 4); } g.globalAlpha = 1; }
    g.drawImage(P2.rim, -P2.rim.w / 2, -P2.rim.h / 2, P2.rim.w, P2.rim.h);
    if (q.hard) { g.fillStyle = "#ffb35c"; g.strokeStyle = "#05020c"; g.lineWidth = 2.5; g.lineJoin = "round"; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283 + 0.26, r0 = h + 4; g.beginPath(); g.moveTo(Math.cos(a - 0.1) * r0, Math.sin(a - 0.1) * r0); g.lineTo(Math.cos(a) * (r0 + 18), Math.sin(a) * (r0 + 18)); g.lineTo(Math.cos(a + 0.1) * r0, Math.sin(a + 0.1) * r0); g.fill(); g.stroke(); } }
    g.restore();
    const bob = set.low ? 0 : Math.sin(t * 3 + q.x) * 3; g.textAlign = "center"; g.lineJoin = "round";
    if (q.duel && D.BIG()[q.echo ? "echo" : "student"]) { g.save(); g.translate(0, -6 + bob); g.rotate(Math.PI); g.drawImage(D.BIG()[q.echo ? "echo" : "student"], -24, -31, 48, 62); g.restore(); }
    else if (q.event) { g.font = "900 italic 60px 'Bricolage Grotesque',system-ui"; g.lineWidth = 8; g.strokeStyle = "#05020c"; g.strokeText("?", 0, 14 + bob); g.fillStyle = c; g.fillText("?", 0, 14 + bob); }
    else if (q.boss) { g.font = "900 italic 30px 'Bricolage Grotesque',system-ui"; g.lineWidth = 7; g.strokeStyle = "#05020c"; g.strokeText("BOSS", 0, 4 + bob); g.fillStyle = c; g.fillText("BOSS", 0, 4 + bob); }
    else { const ic = ICON[q.school ? { ember: "power", tide: "hull", gale: "quick", bronze: "guard", loom: "reach" }[q.school] : q.yard ? { salvage: "power", cross: "reach", post: "hush" }[q.yard] : q.armory ? "power" : { repair: "hull", plate: "guard", guard: "guard", reroll: "hush" }[q.plain]]; g.beginPath(); for (const [x, y] of ic) g.lineTo(x * 1.7, y * 1.7 - 6 + bob); g.closePath(); g.lineWidth = 5; g.strokeStyle = "#05020c"; g.stroke(); g.fillStyle = c; g.fill(); }
    const name = q.duel || q.boss ? gateWhat(q) : gateName(q) + (q.hard ? " × 2" : ""), y0 = h * sq + 18;
    g.font = "900 italic 19px 'Bricolage Grotesque',system-ui"; g.lineWidth = 6; g.strokeStyle = "#05020c"; if (!q.event || q.boss) { g.strokeText(name, 0, y0); g.fillStyle = "#fff"; g.fillText(name, 0, y0); }
    if (!q.boss) { g.font = "700 13px 'Bricolage Grotesque',system-ui"; g.lineWidth = 4; const w = gateWhat(q), y1 = q.event ? y0 - 2 : y0 + 18; g.strokeText(w, 0, y1); g.fillStyle = "#f1e6ff"; g.fillText(w, 0, y1); if (q.hard) { g.fillStyle = "#ffb35c"; g.strokeText("Thorned level", 0, y1 + 17); g.fillText("Thorned level", 0, y1 + 17); } }
    g.restore();
  }

  /* ---------- Heads-up display and side panels ---------- */
  // Hull and shields at a glance (owner: "hard to know where you are health-wise"): a hull bar with a count, shield pips
  // (how many your Shields upgrade keeps, filled for the ones up now) and a bar while a lost one grows back.
  const regrowK = () => { const L = S.lv(s, "skin"); return L && s.guard < L ? Math.min(1, (s.skinT || 0) / S.regrowSecs(s)) : 0; };
  function vitals() {
    const L = S.lv(s, "skin"), pips = Math.max(L, Math.min(4, s.guard)), low = s.hull <= 2 && s.hullMax > 2;
    $("hull").innerHTML = Array.from({ length: s.hullMax }, (_, i) => `<i class="${i < s.hull ? "" : "off"}"></i>`).join(""); $("hulln").textContent = `${s.hull}/${s.hullMax}`;
    $("vit").classList.toggle("low", low); $("vit").setAttribute("aria-label", `Hull ${s.hull} of ${s.hullMax}${pips ? `, shields ${Math.min(s.guard, 4)} of ${pips}` : ""}`);
    $("shrow").classList.toggle("none", !pips); $("shields").innerHTML = Array.from({ length: pips }, (_, i) => `<i class="${i < s.guard ? "" : "off"}"></i>`).join(""); const k = regrowK(); $("regrow").hidden = !k; $("regrow").firstChild.style.width = `${Math.round(k * 100)}%`;
  }
  let was = "";
  function hud() {
    if (!s) return; const bs = s.en.find((e) => e.kind === "boss"); $("bossbar").hidden = !bs || bs.y < 60; if (bs) { $("bossname").textContent = bs.label || S.BOSSES[bs.tier].label; $("bosshp").style.width = `${Math.max(0, (bs.hp / bs.max) * 100)}%`; $("bossbar").classList.toggle("guarded", bs.guard > 0); }
    
    const r = s.run, k = [s.score, s.stamps, s.hull, s.hullMax, s.guard, Math.floor(regrowK() * 8), s.gun, s.grazes, r.room, r.phase, s.core.trigger, s.core.shot, s.core.rule, Object.values(s.p).join(""), Math.round(S.power(s) * 20), Math.round(S.rate(s) * 20), r.dare ? r.hurtAt : -1, r.duel, s.nerve, s.odT > 0, JSON.stringify(s.gunLv)].join(); if (k === was) return; was = k;
    $("score").textContent = num(s.score); $("cash").innerHTML = `<i></i>${s.stamps}`; vitals();
    $("lvl").textContent = r.phase === "boss" ? (r.duel ? `Midterm duel · ${ser().duel}` : ser().boss) : `Level ${Math.min(r.rooms, r.room + 1)} of ${r.rooms} · ${ser().place}`; $("graze").innerHTML = s.odT > 0 ? `<b class="od">OVERDRIVE</b>${s.grazes} close calls` : `<span class="nerve" aria-label="Nerve ${s.nerve} of ${S.N.nerve}">${"◆".repeat(s.nerve)}<i>${"◇".repeat(S.N.nerve - s.nerve)}</i></span>${s.grazes} close calls`;
    [...$("slots").children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === s.gun))); sides();
  }
  // A power-up you can see: a burst in its school's colour, a floating word, and what it changed ("Damage 112% → 124%").
  const stat = () => ({ p: S.power(s), r: S.rate(s), h: s.hullMax, g: s.guard, b: S.lv(s, "split"), t: S.lv(s, "track") });
  function gained(was, label, col, quiet = false) {
    const now = stat(), bits = [];
    if (Math.abs(now.p - was.p) > 0.004) bits.push(`Damage ${pct(was.p)} → <b>${pct(now.p)}</b>`);
    if (Math.abs(now.r - was.r) > 0.004) bits.push(`Fire rate ${pct(was.r)} → <b>${pct(now.r)}</b>`);
    if (now.h !== was.h) bits.push(`Hull ${was.h} → <b>${now.h}</b>`);
    if (now.g > was.g) bits.push(`Shields ${was.g} → <b>${now.g}</b>`);
    if (now.b > was.b) bits.push(`Bullets <b>+${now.b}</b>`);
    if (now.t > was.t) bits.push(`Tracking <b>${"◆".repeat(now.t)}</b>`);
    if (quiet && !bits.length) return;
    pops.push({ x: s.ship.x, y: s.ship.y, c: col, left: 1 }); if (pops.length > 3) pops.shift();
    const up = now.p - was.p > 0.004 ? "DAMAGE UP!" : now.r - was.r > 0.004 ? "FASTER!" : now.h > was.h ? "TOUGHER!" : now.g > was.g ? "SHIELDS UP!" : now.b > was.b ? "MORE BULLETS!" : now.t > was.t ? "TRACKING!" : label ? "POWER UP!" : "";
    if (up) word(up, s.ship.x, s.ship.y - 84, col, 1.05); tone(988, 0.12, 0.04, "triangle", 1480);
    toast(`${label ? `<b>${esc(label)}</b>` : ""}${label && bits.length ? " · " : ""}${bits.join(" · ")}`, 2800, col);
  }
  // A rising coin sound: quick pickups climb a little, so a stream of stamps sings.
  let coinT = 0, coinN = 0; const coinPing = () => { const now = performance.now(); coinN = now - coinT < 400 ? Math.min(coinN + 1, 8) : 0; coinT = now; sfx("coin", { rate: 2 ** (coinN / 12), gap: 0.04 }, () => tone(1175 * 2 ** (coinN / 12), 0.06, 0.03, "triangle", 1568 * 2 ** (coinN / 12))); };
  // A radio line as a level starts: who's talking and what's at stake, at the top of the field (never over the rocket).
  // Lines wait for the level banner to go, then show one at a time (a queue), each for about 3.6 s.
  let radioQ = [], radioAt = 0, radioBusy = false;
  const radioNext = () => { const el = $("radio"), l = radioQ.shift(); if (!l || !playing) { radioBusy = false; el.classList.remove("on"); if (l) radioQ.unshift(l); return; } radioBusy = true; el.innerHTML = `<b style="color:${C.COLOR[l[0]] || "#7dfcff"}">${esc(S.CAST[l[0]].name)}</b> ${l[2] ? l[1] : esc(l[1])}`; el.classList.add("on"); clearTimeout(radioAt); radioAt = setTimeout(() => { el.classList.remove("on"); radioAt = setTimeout(radioNext, 350); }, 3600); };
  const radio = (l, wait = 1500) => { if (!l) return; radioQ.push(l); if (radioQ.length > 2) radioQ.shift(); if (!radioBusy) { radioBusy = true; clearTimeout(radioAt); radioAt = setTimeout(radioNext, wait); } };
  const radioClear = () => { radioQ = []; radioBusy = false; clearTimeout(radioAt); $("radio").classList.remove("on"); };
  // Wrecks: every enemy breaks its own way (owner, 24 Nov 2026: "add more effects to enemies dying"). Shards in its
  // colour (pictures made once per colour, so each is one drawImage), a shockwave, smoke for big hulls, chain pops on the
  // heaviest, glass splinters for prisms, ringing waves for chimers, sparkles that rise for phantoms. Low flash halves them
  // and drops the white flash and smoke.
  const WRECK = { skiff: { c: "#ff5fd8", n: 7, ring: 40 }, mine: { c: "#ff9a3d", n: 10, ring: 90 }, darter: { c: "#ff5fd8", n: 7, ring: 36 }, turret: { c: "#9fb4ff", n: 14, ring: 110, smoke: 3, pops: 2 },
    weaver: { c: "#5ff0a8", n: 10, ring: 70 }, seg: { c: "#b48cff", n: 4 }, shield: { c: "#ffd23f", n: 14, ring: 110, smoke: 3, pops: 2 }, lancer: { c: "#ff9a3d", n: 10, ring: 80, smoke: 2 },
    splitter: { c: "#5ff0a8", n: 8, ring: 50 }, mini: { c: "#5ff0a8", n: 4 }, carrier: { c: "#3fd8f2", n: 18, ring: 140, smoke: 4, pops: 3 }, phantom: { c: "#d9ceff", n: 12, up: 1 },
    chimer: { c: "#ffd23f", n: 8, chime: 1 }, clapper: { c: "#ff9a3d", n: 14, ring: 110, smoke: 3, pops: 2 }, skimmer: { c: "#7dfcff", n: 10, ring: 80 }, prism: { c: "#e9d8ff", n: 16, glass: 1, ring: 70 },
    rocket: { c: "#ff9a3d", n: 3 }, arm: { c: "#ff9a3d", n: 16, ring: 120, smoke: 4, pops: 2 }, pin: { c: "#ffd23f", n: 6, ring: 40 }, seal: { c: "#9ffcff", n: 10, ring: 50, glass: 1 }, boss: { c: "#ffd23f", n: 34, ring: 240, smoke: 7, pops: 6 } };
  let debris = [], smoke = [], flashes = [], soon = [];
  const shardPics = {}, shardOf = (c, glass) => shardPics[c + glass] || (shardPics[c + glass] = pic(16, 16, (x) => { x.beginPath(); if (glass) { x.moveTo(0, -7); x.lineTo(4, 6); x.lineTo(-4, 4); } else { x.moveTo(-6, -3); x.lineTo(4, -6); x.lineTo(6, 3); x.lineTo(-3, 6); } x.closePath(); x.fillStyle = glass ? "#ffffffcc" : "#05020c"; x.fill(); x.lineJoin = "round"; x.lineWidth = 2.2; x.strokeStyle = c; x.stroke(); }));
  function wreck(kind, x, y) {
    const w = WRECK[kind] || { c: "#ffd23f", n: 6, ring: 40 }, low = set.low, n = Math.max(0, Math.min(low ? Math.ceil(w.n / 2) : w.n, 170 - debris.length)), sh = shardOf(w.c, w.glass ? 1 : 0);
    for (let i = 0; i < n; i++) { const a = w.up ? -1.57 + (Math.random() - 0.5) * 1.8 : Math.random() * 6.283, v = (w.glass ? 280 : 170) + Math.random() * 230; debris.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 16, left: 0.5 + Math.random() * 0.5, c: sh, s: 0.6 + Math.random() * (w.n >= 14 ? 1.1 : 0.7) }); }
    if (w.ring) ring(x, y, 8, w.ring, w.c, w.n >= 14 ? 9 : 5);
    if (w.chime) { ring(x, y, 8, 64, "#ffd23f", 5); soon.push({ at: s.t + 0.14, f: () => ring(x, y, 8, 110, "#ffd23f", 4) }); tone(1568, 0.35, 0.025, "sine"); }
    if (w.smoke && !low) for (let i = 0; i < w.smoke && smoke.length < 30; i++) smoke.push({ x: x + (Math.random() - 0.5) * 34, y: y + (Math.random() - 0.5) * 30, r: 12 + Math.random() * 12, left: 1, vy: -18 - Math.random() * 24 });
    if (w.pops) for (let i = 1; i <= w.pops; i++) soon.push({ at: s.t + i * 0.1, f: () => { const px = x + (Math.random() - 0.5) * (kind === "boss" ? 160 : 56), py = y + (Math.random() - 0.5) * (kind === "boss" ? 110 : 44); ring(px, py, 4, 50, "#ff9a3d", 6); dust.add(px, py, 10, 210, 1, Math.random); noise(0.08, 0.03, 1300); } });
    if (!low && w.n >= 10 && flashes.length < 6) flashes.push({ x, y, r: (w.ring || 60) * 0.55, left: 1 });
  }
  const ring = (x, y, r0, r1, c, w) => { if (fx.length < 24) fx.push({ x, y, r0, r1, c, w, left: 1 }); };
  const MK = ["", "II", "III"];
  const pct = (k) => `${Math.round(k * 100)}%`;
  const dareCost = (label) => { for (const ev of Object.values(S.EVENTS)) for (const o of ev.opts) if (o.label === label) return o.down; return ""; };
  const TOP = (k) => (S.PARTS[k] && S.PARTS[k].max) || S.MAXLV, LV = (n, k) => "◆".repeat(n) + "◇".repeat(Math.max(0, (k ? TOP(k) : S.MAXLV) - n));
  function sides() {
    if (!s) return; const r = s.run;
    $("route").innerHTML = Array.from({ length: r.rooms }, (_, i) => `<i class="${i < r.room ? "done" : i === r.room && r.phase !== "boss" ? "now" : ""}">${i + 1}</i>`).join("") + `<i class="boss ${r.phase === "boss" ? "now" : ""}">BOSS</i>`; if ($("ords")) $("ords").innerHTML = ordersHtml(r.act, s);
    const parts = Object.keys(s.p).filter((k) => s.p[k] > 0 && S.PARTS[k]).map((k) => `<span><b style="color:${D.SC(S.PARTS[k].school)}">${S.PARTS[k].label}</b><em>${LV(s.p[k], k)}${k === "hot" ? ` ${pct(S.power(s))}` : k === "quick" ? ` ${pct(S.rate(s))}` : ""}</em></span>`).join("");
    const cores = Object.values(s.core).filter(Boolean).map((k) => `<span><b style="color:#ffd23f">${S.CORES[k].label} core</b></span>`).join("");
    $("kit").innerHTML = `<span><b style="color:${S.RIGS[s.rig || "courier"].color}">Rig</b>${S.RIGS[s.rig || "courier"].label}</span>${s.core.shot ? `<span><b>Weapon</b>${S.CORES[s.core.shot].label}</span>` : `<span><b>Guns</b>${s.guns.map((k) => S.GUNS[k].label + (s.gunLv[k] ? ` ${MK[s.gunLv[k]]}` : "")).join(" · ")}</span>`}${cores}${s.fus.map((f) => `<span><b style="color:#ffd23f">${S.FUSIONS[f].label}</b><em>fusion</em></span>`).join("")}${parts || "<span>No parts yet: fly through a school's gate.</span>"}${S.lv(s, "hot") ? "" : `<span class="pw"><b>Damage</b>${pct(S.power(s))}</span>`}${S.lv(s, "quick") ? "" : `<span class="pw"><b>Fire rate</b>${pct(S.rate(s))}</span>`}${r.dare ? `<span style="color:#5ff0a8"><b>Dare</b>${r.hurtAt} of ${r.dare.hits} hits</span>` : ""}<span><b>Rerolls</b>${s.rerolls}</span>`;
  }
  function portrait(who = "wren", mood = "calm") { $("portrait").innerHTML = `<svg viewBox="-330 -300 660 560" preserveAspectRatio="xMidYMid slice">${defs(PALS.n)}<rect x="-900" y="-900" width="1800" height="1800" fill="#150828"/><rect x="-900" y="-900" width="1800" height="1800" fill="url(#ht)" opacity=".16"/><g transform="translate(0 40) scale(.95)">${C.FACE[who](mood)}</g></svg>`; }
  $("keys").innerHTML = "<span><b>Steer</b>drag, or arrows / WASD</span><span><b>Dash</b>double-click where to go, or Space / A</span><span><b>Swap gun</b>tap the gun, Q / E, or X</span><span><b>Pause</b>Esc or P</span>";

  /* ---------- Captions: level banners, toasts ---------- */
  let banAt, toastAt;
  const banner = (t, sub = "", ms = 1500) => { $("bannerT").textContent = t; $("bannerS").textContent = sub; $("bannerS").hidden = !sub; $("banner").classList.add("on"); clearTimeout(banAt); banAt = setTimeout(() => $("banner").classList.remove("on"), ms); };
  const toast = (h, ms = 2300, col = "#3fd8f2", mid = false) => { $("toast").classList.toggle("mid", mid); $("toast").innerHTML = h; $("toast").style.boxShadow = `4px 4px 0 ${col}`; $("toast").classList.add("on"); clearTimeout(toastAt); toastAt = setTimeout(() => $("toast").classList.remove("on"), ms); };

  /* ---------- The loop ---------- */
  document.addEventListener("keydown", (e) => { if (!playing || e.repeat) return; const k = e.key.toLowerCase(); if (k === "q" || k === "e" || k === "tab") { swapAsk = true; e.preventDefault(); } if (k === "shift" || k === "x" || k === "k") { dashAsk = true; e.preventDefault(); } });
  let padSwap = false;
  function step(dt) {
    const i = input.read(); if (!playing) return; if (i.pause) return pause();
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find((q) => q && q.connected) : null; if (pad) { const b = !!((pad.buttons[2] && pad.buttons[2].pressed) || (pad.buttons[3] && pad.buttons[3].pressed)); if (b && !padSwap) swapAsk = true; padSwap = b; }
    const go = { dx: i.dx * set.sens, dy: i.dy * set.sens, sx: i.sx, sy: i.sy, act: swapAsk, dash: dashTo || ((i.kind === "keys" || i.kind === "pad") && i.act) || dashAsk }; swapAsk = dashAsk = false; dashTo = null;
    if (hitStop > 0) { hitStop -= dt; s.dragX += go.dx; s.dragY += go.dy; return; }
    if (slowMo > 0) { slowMo -= dt; dt *= 0.35; }
    S.step(s, go, dt); shake.step(dt); dust.step(dt); flash = Math.max(0, flash - dt * 3); if (trail.push([s.ship.x, s.ship.y]) > 14) trail.shift();
    for (const w of words) w.left -= dt; words = words.filter((w) => w.left > 0); for (const q of fx) q.left -= dt * 2; fx = fx.filter((q) => q.left > 0);
    for (const d of debris) { d.left -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 1 - 2.6 * dt; d.vy = d.vy * (1 - 2.6 * dt) + 60 * dt; d.r += d.vr * dt; } if (debris.length) debris = debris.filter((d) => d.left > 0);
    for (const q of smoke) { q.left -= dt * 0.9; q.y += q.vy * dt; q.r += 26 * dt; } if (smoke.length) smoke = smoke.filter((q) => q.left > 0); for (const q of flashes) q.left -= dt * 7; if (flashes.length) flashes = flashes.filter((q) => q.left > 0);
    if (soon.length) { const due = soon.filter((q) => q.at <= s.t); soon = soon.filter((q) => q.at > s.t); for (const q of due) q.f(); } for (const q of pops) q.left -= dt * 1.4; pops = pops.filter((q) => q.left > 0); for (const q of ghosts) q.left -= dt * 3; ghosts = ghosts.filter((q) => q.left > 0); if (s.dashT > 0 && ++ghostN % 3 === 0) ghosts.push({ x: s.ship.x, y: s.ship.y, left: 1 });
    let shotNow = false;
    for (const e of s.ev) {
      if (e === "shot") shotNow = true;
      else if (e === "tick") { /* hits are heard through kills */ }
      else if (e.kill) { wreck(e.kill, e.x, e.y); const big = ["turret", "shield", "weaver", "carrier", "arm", "clapper", "prism", "lancer"].includes(e.kill); dust.add(e.x, e.y, big ? 34 : 18, big ? 300 : 230, e.kill === "mine" ? 2 : 1, Math.random); sfx(SND.map && SND.map[`kill_${e.kill}`] ? `kill_${e.kill}` : e.kill === "prism" ? "kill_glass" : e.kill === "chimer" ? "kill_chime" : big ? "kill_big" : "kill", { v: big ? 1 : 0.8, rate: big ? 1 : 0.9 + Math.random() * 0.25, pan: panX(e.x), gap: big ? 0.05 : 0.04 }, () => { tone(big ? 110 : 170, big ? 0.3 : 0.15, 0.07, "triangle", 55); noise(0.12, big ? 0.08 : 0.04, 900); }); if (big || Math.random() < 0.18) word(big ? SFX.big[Math.floor(Math.random() * 2)] : SFX.kill[Math.floor(Math.random() * 4)], e.x, e.y - 20, big ? "#ff9a3d" : "#ffd23f", big ? 1.2 : 0.85); prog.codex.foes[e.kill] = (prog.codex.foes[e.kill] || 0) + 1; if (!set.low) { shake.hit(big ? 4 : 2); hitStop = big ? 0.04 : 0.018; } }
      else if (e.lode != null) { ring(e.x, e.y, 10, 95, "#b48cff", 6); if (e.lode >= 3) word("GULP!", e.x, e.y - 30, "#b48cff", 0.9); sfx("shot_heavy", { v: 0.7, rate: 0.8, pan: panX(e.x), gap: 0.08 }, () => { tone(220, 0.15, 0.04, "triangle", 110); }); }
      else if (e.ram) { ring(e.x, e.y, 10, 70, "#ff9a3d", 7); word("RAM!", e.x, e.y - 30, "#ff9a3d", 1); sfx("block", { rate: 0.7, pan: panX(e.x), gap: 0.05 }, () => { tone(180, 0.12, 0.05, "square", 90); }); }
      else if (e === "nocore") toast("<b>Every core slot is full.</b> Tamsin patches you up instead: 2 hull back.", 3200, "#ffd23f");
      else if (e.nova) { ring(e.x, e.y, 6, 70, "#ffd23f", 5); sfx("shot_spread", { v: 0.8, pan: panX(e.x), gap: 0.06 }, () => { tone(330, 0.12, 0.035, "triangle", 660); }); }
      else if (e.boom) { dust.add(e.x, e.y, 26, 260, 3, Math.random); sfx("boom", { pan: panX(e.x), gap: 0.06 }, () => { tone(90, 0.3, 0.08, "sawtooth", 40); }); word("BOOM!", e.x, e.y, "#ff5fd8"); }
      else if (e === "hit") { flash = 1; if (!set.low) shake.hit(8); hitStop = 0.07; dust.add(s.ship.x, s.ship.y, 24, 260, 3, Math.random); sfx("hurt", { gap: 0.1 }, () => { tone(110, 0.35, 0.1, "sawtooth", 40); noise(0.25, 0.1, 500); }); word(SFX.hit, s.ship.x, s.ship.y - 50, "#ff4f7b"); try { navigator.vibrate && navigator.vibrate([40, 30, 60]); } catch {} }
      else if (e === "dash") { sfx("dash", {}, () => { noise(0.18, 0.06, 2400); tone(300, 0.15, 0.03, "triangle", 900); }); word(SFX.dash, s.ship.x, s.ship.y - 60, "#3fd8f2", 0.8); }
      else if (e === "swap") sfx("swap", {}, () => { tone(520, 0.08, 0.04); });
      else if (e === "graze") sfx("graze", { rate: 2 ** (s.nerve / 12), gap: 0.05 }, () => { tone(1300 + 90 * s.nerve, 0.05, 0.018); });
      else if (e.nick) { ring(e.x, e.y, 4, 26, "#5ff0a8", 4); dust.add(e.x, e.y, 5, 160, 1, Math.random); }
      else if (e === "overdrive") { ring(s.ship.x, s.ship.y, 30, 220, "#ffd23f", 10); word("OVERDRIVE!", s.ship.x, s.ship.y - 110, "#ffd23f", 1.3); sfx("overdrive", {}, () => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.25, 0.05, "triangle"), i * 70)); }); if (!prog.seen.od) { prog.seen.od = 1; save(); toast("<b>Overdrive!</b> 8 close calls in a row: faster, harder shots for 4 seconds", 3200, "#ffd23f"); } }
      else if (e === "arm") sfx("arm", { v: 0.8, gap: 0.12 }, () => { tone(700, 0.1, 0.03, "square"); });
      else if (e === "clink") { sfx("clink", { gap: 0.06 }, () => { tone(1500, 0.03, 0.012, "square"); }); if (Math.random() < 0.1) word(SFX.block, s.ship.x, s.ship.y - 120, "#9fb4ff", 0.8); }
      else if (e === "dive") sfx("shot_soft", { rate: 1.4, v: 0.7, gap: 0.15 }, () => { tone(500, 0.15, 0.03, "sawtooth", 1200); });
      else if (e === "guard") { sfx("block", {}, () => { tone(880, 0.2, 0.05, "triangle", 440); }); word("BLOCK!", s.ship.x, s.ship.y - 50, "#9fb4ff", 0.9); }
      else if (e === "second") { banner("Second wind", "2 hull back. Once a run.", 1800); sfx("pack", { rate: 0.8 }, () => { tone(440, 0.6, 0.08, "triangle", 880); }); }
      else if (e.gate) { sfx(e.gate === "boss" || e.gate === "duel" ? "gate_boss" : "gate", {}, () => { tone(e.gate === "boss" ? 150 : 520, 0.3, 0.06, "triangle", e.gate === "boss" ? 90 : 900); }); if (e.gate === "boss") return bossIntro(); if (e.gate === "duel") return duelIntro(); }
      else if (e.gotgun) { const gg = S.GUNS[e.gotgun]; ring(e.x, e.y, 10, 90, "#f4ecff", 7); word(gg.label.toUpperCase() + "!", s.ship.x, s.ship.y - 90, "#f4ecff", 0.9); sfx("gun", {}, () => { tone(523, 0.2, 0.05, "square", 1047); }); buildSlots(); was = ""; toast(`<b>Picked up: ${esc(gg.label)}</b>, in your other slot. ${prog.seen.crate ? esc(gg.what) : "Tap it at the bottom to fire it: crates never touch the gun you're firing."}`, prog.seen.crate ? 2600 : 4200, "#f4ecff"); prog.seen.crate = 1; }
      else if (e.coin) { coinPing(); if (!prog.seen.coin) { prog.seen.coin = 1; save(); toast("<b>Stamps!</b> Wrecks drop them. Fly close and they're pulled in. Spend them at Quill's Shop.", 3200, "#ffd23f"); } }
      else if (e.coins) { sfx("coin", { rate: 1.25 }, () => { tone(1320, 0.12, 0.03, "triangle", 1760); }); word(`+${e.coins} STAMPS`, s.ship.x, s.ship.y - 70, "#ffd23f", 0.8); }
      else if (e.pack) { ring(e.x, e.y, 10, 70, "#5ff0a8", 7); word(e.heal ? "+1 HULL" : "+100", e.x, e.y - 30, "#5ff0a8", 1); sfx("pack", {}, () => { tone(784, 0.25, 0.05, "triangle", 1175); }); if (!prog.seen.pack) { prog.seen.pack = 1; save(); toast("<b>Repair kit:</b> wrecks sometimes drop one. Fly over it for 1 hull.", 3000, "#5ff0a8"); } }
      else if (e.reson) { ring(e.x, e.y, 20, 90, "#ffd23f", 7); word("DONG!", e.x, e.y - 30, "#ffd23f", 0.9); sfx("bell", { rate: 0.7, gap: 0.1 }, () => { tone(196, 0.5, 0.05, "triangle", 392); }); }
      else if (e.guard) { ring(e.x, e.y, 20, 90, "#9ffcff", 7); word("GLASS GUARD!", e.x, e.y + 90, "#9ffcff", 1.1); sfx("block", { rate: 0.75 }, () => { tone(660, 0.3, 0.05, "triangle", 990); }); if (!prog.seen.vguard) { prog.seen.vguard = 1; save(); toast("<b>Her glass guard stops every shot.</b> Break all the glass seals before its clock runs out, and she's open.", 4200, "#9ffcff"); } }
      else if (e.shatter) { wreck("seal", e.x, e.y); ring(e.x, e.y, 30, 160, "#c6ff4f", 9); word("GUARD BROKEN!", e.x, e.y + 90, "#c6ff4f", 1.3); sfx("kill_glass", { rate: 0.8 }, () => { noise(0.4, 0.06, 2400); }); if (!set.low) shake.hit(4); }
      else if (e.esplit) { ring(e.x, e.y, 20, 120, "#bfe9ff", 7); word("WHICH ONE?", S.W / 2, e.y + 110, "#bfe9ff", 1.2); sfx("echo_split", {}, () => { tone(880, 0.4, 0.04, "sine", 440); }); if (!prog.seen.esplit) { prog.seen.esplit = 1; save(); toast("<b>Only the real Echo has ripple rings.</b> The pale copies throw your shots back. Keep under the real one when they swap.", 3800, "#bfe9ff", true); } }
      else if (e === "echoshuffle") sfx("echo_split", { v: 0.5, rate: 1.3, gap: 0.3 }, () => { tone(660, 0.2, 0.03, "sine", 330); });
      else if (e.shieldoff) { word("SHIELD DOWN!", e.x, e.y - 40, "#3fd8f2", 0.9); sfx("kill_glass", { v: 0.5, rate: 1.4, pan: panX(e.x), gap: 0.1 }, () => { noise(0.15, 0.04, 3000); }); }
      else if (e.tollup) sfx("toll_up", {}, () => { tone(150, 1, 0.05, "sine", 300); });
      else if (e.tollwave) { ring(e.x, e.y, 40, 160, "#ff9a3d", 8); sfx("toll_wave", {}, () => { [147, 294, 352].forEach((f) => tone(f, 1.6, 0.05, "sine")); }); if (!set.low) shake.hit(3); if (!prog.seen.tollwave) { prog.seen.tollwave = 1; save(); toast("<b>You can't outfly the toll.</b> Double-tap to dash as the wave reaches you (it turns cyan), and the bell hangs open.", 4200, "#ffd23f", true); } }
      else if (e.thru) { ring(e.x, e.y, 10, 60, "#3fd8f2", 5); word("THROUGH!", e.x, e.y - 120, "#3fd8f2", 0.9); }
      else if (e.bellopen) { word("IT'S OPEN!", e.x, e.y + 120, "#c6ff4f", 1.1); }
      else if (e.plate) { ring(e.x, e.y, 6, 50, "#3fd8f2", 5); sfx("kill_glass", { v: 0.45, rate: 0.7, pan: panX(e.x), gap: 0.08 }, () => { noise(0.1, 0.04, 2000); }); if (!prog.seen.mshell) { prog.seen.mshell = 1; save(); toast("<b>The Mapmaker's shell turns.</b> Shots only land through the gap (lime). Break plates to widen it.", 4000, "#3fd8f2", true); } }
      else if (e.rehang) { word("NEW ARM!", e.x, e.y + 70, "#ffd23f", 1.1); sfx("arm", {}, () => { tone(220, 0.3, 0.05, "square", 330); }); }
      else if (e.mend) { word("TOO SLOW!", e.x, e.y + 90, "#9ffcff", 1.1); sfx("arm", {}, () => { tone(220, 0.3, 0.05, "square", 110); }); }
      else if (e.open) { ring(e.x, e.y, 8, 60, "#ff9a3d", 5); dust.add(e.x, e.y, 10, 220, 0, Math.random); }
      else if (e.wash) { ring(s.ship.x, s.ship.y, 30, Math.min(e.wash, 520), "#3fd8f2", 10); word("SWEPT!", s.ship.x, s.ship.y - 90, "#3fd8f2", 0.9); noise(0.4, 0.05, 700); }
      else if (e === "guardup" || e === "luck") { ring(s.ship.x, s.ship.y, 20, 70, "#9fb4ff", 6); word(e === "luck" ? "LUCKY!" : "GUARD UP!", s.ship.x, s.ship.y - 80, "#9fb4ff", 0.9); sfx("block", { rate: 1.3, v: 0.8 }, () => { tone(880, 0.2, 0.04, "triangle", 1320); }); }
      else if (e === "mend" || e === "breath") { ring(s.ship.x, s.ship.y, 20, 90, "#5ff0a8", 6); word("+1 HULL", s.ship.x, s.ship.y - 80, "#5ff0a8", 1); sfx("pack", {}, () => { tone(660, 0.3, 0.05, "triangle", 990); }); if (e === "breath") toast("<b>Deep Breath:</b> a clean level repairs 1 hull", 2400, "#3fd8f2"); }
      else if (e === "eye") { ring(s.ship.x, s.ship.y, 30, 260, "#7dfcff", 6); word("SLOW!", s.ship.x, s.ship.y - 80, "#7dfcff", 0.9); }
      else if (e === "duelgate") banner("Midterm duel", s.run.act === 3 ? "Something waits at the halfway mark. It flies like you." : "The First Student waits at the halfway pin", 1900);
      else if (e === "duelwon") later = { at: performance.now() + 1300, f: () => scene(C.SCENES[s.run.act === 3 ? "echoWon" : "duelWon"], coreCard, "Midterm") };
      else if (e.toll != null) { sfx("toll", { pan: panX(e.toll) }, () => { tone(196, 0.9, 0.04, "sine", 190); tone(392, 0.6, 0.02, "sine"); }); }
      else if (e === "shortcut") { banner("Shortcut", "The route is redrawn: one level skipped", 1700); sfx("gate", { rate: 0.8 }, () => { tone(392, 0.4, 0.05, "triangle", 784); }); }
      else if (e.tide != null) { word(e.tide > 0 ? "TIDE »" : "« TIDE", S.W / 2, 210, "#7dfcff", 0.8); sfx("tide", { pan: e.tide > 0 ? 0.4 : -0.4 }, () => { noise(0.5, 0.025, 600); }); }
      else if (e.dare) { const won = e.dare === "won"; toast(`<b>Dare ${won ? "won" : "lost"}:</b> ${esc(e.label)}${e.got.length ? ` · ${e.got.map((q) => `${S.PARTS[q].label} ${LV(s.p[q] || 0, q)}`).join(", ")}` : won ? "" : ` · ${esc(dareCost(e.label))}`}`, 3000); sfx(won ? "order" : "meet", { rate: won ? 1 : 0.6 }, () => { tone(won ? 784 : 196, 0.35, 0.06, "triangle", won ? 1175 : 130); }); if (won) word("DARE WON!", s.ship.x, s.ship.y - 90, "#5ff0a8", 1); }
      else if (e.caught) { sfx("bell", { v: 0.6, rate: 1.5, gap: 0.08 }, () => { tone(1175, 0.18, 0.05, "triangle", 1568); }); dust.add(e.x, e.y, 18, 260, 1, Math.random); word("STAR CATCH!", e.x, e.y - 40, "#ffd23f"); }
      else if (e.starOut) { if (!set.low) dust.add(e.x, e.y, 6, 120, 0.5, Math.random); }
      else if (e.bonus) { tone(660, 0.25, 0.06, "triangle", 990); dust.add(s.ship.x, s.ship.y, 26, 220, 1, Math.random); toast(`<b>${S.PLAIN[e.bonus].label}</b>: ${S.PLAIN[e.bonus].what}${e.n > 1 ? ", twice" : ""}`); }
      else if (e.meet) { const m = S.ENEMIES[e.meet]; toast(`<b>New: ${m.label}.</b> ${esc(m.gun || "")}`, 3200); sfx("meet", {}, () => { tone(880, 0.2, 0.04, "square", 440); }); }
      else if (e.sky) { const k = S.SKIES[e.sky]; setTimeout(() => banner(k.label, k.what, 1700), 1400); }
      else if (e.bounty) { toast(e.bounty === "none" ? "<b>Bounty paid</b>" : `<b>Bounty paid:</b> ${S.PARTS[e.bounty].label} +1`); word("PAID!", e.x, e.y, "#ffd23f", 1.1); pops.push({ x: s.ship.x, y: s.ship.y, c: e.bounty === "none" ? "#ffd23f" : D.SC(S.PARTS[e.bounty].school), left: 1 }); sfx("order", {}, () => { tone(784, 0.3, 0.06, "triangle", 1175); }); }
      else if (e.clear) { if (e.flawless) { word("FLAWLESS!", S.W / 2, 300, "#5ff0a8", 1.35); ring(s.ship.x, s.ship.y, 24, 150, "#5ff0a8", 8); sfx("flawless", {}, () => { [659, 880, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.18, 0.045, "triangle"), i * 60)); }); toast(`<b>Level ${e.clear} flawless</b> · +1 stamp`, 1600, "#5ff0a8"); } else { word("LEVEL CLEAR!", S.W / 2, 300, "#ffd23f", 1.1); sfx("clear", {}, () => { tone(659, 0.2, 0.04, "triangle", 988); }); } }
      else if (e === "pick") { stop(); return pickCard(); }
      else if (e.event) { stop(); return eventCard(e.event); }
      else if (e === "midterm") { stop(); return scene(C.SCENES.midterm, coreCard, "Midterm"); }
      else if (e.stage) { sfx("boss_stage", {}, () => { tone(120, 0.4, 0.09, "sawtooth", 60); }); if (!set.low) shake.hit(6); dust.add(e.x, e.y, 40, 300, 1, Math.random); word("KRAK!", e.x, e.y + 40, "#ff9a3d", 1.6); }
      else if (e === "parry") toast("<b>It's catching your shots.</b> Stop firing into it for a moment.");
      else if (e === "volley") sfx("volley", { gap: 0.1 }, () => { tone(300, 0.18, 0.05, "triangle", 900); });
      else if (e === "bell") sfx("bell", {}, () => { [330, 495].forEach((f) => tone(f, 0.7, 0.045)); });
      else if (e === "catch") tone(740, 0.05, 0.02);
      else if (e === "beat") { const bb = s.en.find((q) => q.kind === "boss") || { x: S.W / 2, y: 200 }; wreck("boss", bb.x, bb.y); dust.add(s.ship.x, s.ship.y - 300, 90, 420, 0, Math.random); sfx("boss_down", {}, () => { tone(523, 0.6, 0.08, "triangle", 1047); }); word("KA-THOOM!", S.W / 2, 260, "#ffd23f", 1.6); slowMo = 1.2; }
      else if (e === "won" || e === "lost") { if (!deathAt) deathAt = performance.now(); }
    }
    if ((orderT -= dt) <= 0) { orderT = 0.5; for (const k of prog.orders || []) if (!runDone.has(k) && S.orderDone(S.order(k, s.run.act), s)) { runDone.add(k); toast(`<b>Order done:</b> ${esc(orderText(k, s.run.act))} · +${S.ORDER_PAY} stamps`, 2600, "#ffd23f"); word("ORDER DONE!", s.ship.x, s.ship.y - 130, "#ffd23f", 0.95); sfx("order", {}, () => { tone(784, 0.2, 0.05, "triangle", 1568); }); sides(); } }
    if (shotNow) { const gk = s.core.shot || s.guns[s.gun], k = SHOTSND[gk] || "shot"; sfx(k, { v: k === "shot" ? 0.7 : 0.75, gap: k === "shot_heavy" ? 0.12 : 0.085, pan: panX(s.ship.x) }, () => { if (Math.random() < 0.5) tone(s.core.shot ? 360 : 420, 0.05, 0.008, "square", 160); }); }
    // A new level: banner with its number and what it pays.
    const r = s.run; if (r.phase === "room" && (lastPhase !== "room" || lastRoom !== r.room)) { const pay = r.pay.school ? `${S.SCHOOLS[r.pay.school].label} parts after` : r.pay.yard ? `${S.YARDS[r.pay.yard].label} after` : r.pay.armory ? "A new gun after" : r.pay.plain ? `${S.PLAIN[r.pay.plain].label} after` : r.choice ? esc(r.choice) : ""; if (r.pay.none) r.choice = null; banner(`Level ${r.room + 1}`, (r.hard ? "Thorned · " : "") + pay + (S.lv(s, "toll") ? ` · Toll: damage ${pct(S.power(s))}` : "") + (r.dare ? ` · Dare: ${r.dare.hits ? `${r.dare.hits} hit${r.dare.hits > 1 ? "s" : ""} or fewer` : "no hits"}` : ""), 1300); radio(C.radio(r.act, r.room + 1, prog.flags, [...(r.flags || []), s.ally ? "ally" : ""])); }
    lastPhase = r.phase; lastRoom = r.room;
    if (later && performance.now() > later.at) { const f = later.f; later = null; stop(); music(false); return f(); }
    if (deathAt && performance.now() - deathAt > (s.over === "won" ? 1600 : 1100)) finish();
  }
  const run = A.run({ step, draw, onPause: () => playing && pause() });
  function stop() { playing = false; run.stop(); }
  function resume() { if (s && s.run && s.run.phase === "core") return scene(s.run.act === 3 ? C.SCENES.echoWon : s.run.act === 2 ? C.SCENES.duelWon : C.SCENES.midterm, coreCard, "Midterm"); $("card").hidden = true; input.read(); playing = true; was = ""; buildSlots(); run.start(); if (radioQ.length && !radioBusy) { radioBusy = true; radioAt = setTimeout(radioNext, 600); } }
  function buildSlots() { if (s.core.shot) { $("slots").innerHTML = `<button class="slot core" type="button" aria-pressed="true">${S.CORES[s.core.shot].label}</button>`; return; } $("slots").innerHTML = s.guns.map((k) => `<button class="slot" type="button">${S.GUNS[k].label}${s.gunLv[k] ? ` ${MK[s.gunLv[k]]}` : ""}</button>`).join(""); [...$("slots").children].forEach((b, i) => { b.onclick = () => { if (s.gun !== i) swapAsk = true; b.blur(); }; }); }
  // Dashing: a double-tap (or double-click) dashes straight to that spot; a second finger's tap dashes to it too.
  // Keys and controllers dash the way you're moving (the kit's act). Taps on buttons never reach here.
  let tapT = 0, tapX = 0, tapY = 0, fingers = 0, dashTo = null;
  const field = (e) => { const b = $("c").getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * S.W, y: ((e.clientY - b.top) / b.height) * S.H }; };
  $("stage").addEventListener("pointerdown", (e) => { fingers++; const now = performance.now(), near = Math.hypot(e.clientX - tapX, e.clientY - tapY) < 70; if (fingers > 1 || (now - tapT < 300 && near)) { dashTo = field(e); tapT = 0; } else { tapT = now; tapX = e.clientX; tapY = e.clientY; } });
  const lift = () => { fingers = Math.max(0, fingers - 1); }; $("stage").addEventListener("pointerup", lift); $("stage").addEventListener("pointercancel", lift);
  $("bot").addEventListener("pointerdown", (e) => e.stopPropagation()); // buttons, not steering
  $("pause").onclick = () => pause();

  /* ---------- Cards ---------- */
  function card(h, wide = false) { const c = $("card"); c.innerHTML = `<div>${h}</div>`; c.classList.toggle("wide", wide); c.hidden = false; c.scrollTop = 0; const f = c.querySelector(".opt:not([disabled]),.btn.main"); if (f && !("ontouchstart" in window)) f.focus({ preventScroll: true }); return c; }
  const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
  // A short comic scene: panels one after another, then `next`.
  function scene(list, next, label = "") {
    let i = 0; const show = () => { const [who, mood, say] = list[i]; portrait(who === "keeper" || who === "beacon" ? "wren" : who, mood); card(`${label ? `<p class="fam">${esc(label)}</p>` : ""}${C.panel(who, mood, esc(say), i % 2 ? "left" : "right")}<button class="btn main" id="nx" type="button">${i < list.length - 1 ? "Next" : "Go"}</button>`); on("nx", () => { sfx("ui", {}, () => tone(660, 0.06, 0.03)); if (++i < list.length) show(); else next(); }); };
    show();
  }
  // The Flight Plan board (Nova Drift was the strategy reference; the look is ours: courier roads and post-stamp stops).
  // Six roads out from the rocket; each forks at level 3 into two sides (one per flight), each with a second stop; a
  // crossing sits between neighbouring roads and opens when both have forked.
  function planSvg() {
    const C = 190, at = (a, r) => [C + Math.cos(a) * r, C + Math.sin(a) * r], out = [], stops = [], L = (k) => S.lv(s, k), sides = (r) => Object.keys(S.PARTS).filter((q) => S.PARTS[q].road === r).sort((a, b) => S.PARTS[a].side - S.PARTS[b].side);
    const line = (a, b, col, on, dim) => out.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${on ? col : "#3a2752"}" stroke-width="${on ? 4 : 2.5}" ${on ? "" : 'stroke-dasharray="4 6"'} opacity="${dim ? 0.35 : 1}"/>`);
    out.push(`<circle cx="${C}" cy="${C}" r="128" fill="none" stroke="#2a1840" stroke-width="2" stroke-dasharray="2 8"/>`);
    S.ROADS.forEach((road, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3, col = D.SC(S.PARTS[road].school), lvR = L(road), root = at(a, 52), fk = at(a, 84), taken = S.forkTaken(s, road), shut = !S.canLevel(s, road) && !lvR && road === "track" && s.core.shot;
      line([C, C], fk, col, lvR > 0);
      sides(road).forEach((q, j) => { const sd = j ? 1 : -1, n1 = at(a + sd * 0.24, 116), n2 = at(a + sd * 0.17, 146), mine = taken === q, closed = taken && !mine;
        line(fk, n1, col, mine, closed); line(n1, n2, col, L(q) >= 2, closed);
        stops.push({ p: n1, st: mine ? "own" : closed ? "closed" : lvR >= 3 ? "open" : lvR >= 2 ? "near" : "lock", col, r: 11 });
        stops.push({ p: n2, st: L(q) >= 2 ? "own" : mine ? "open" : closed ? "closed" : "lock", col, r: 9 }); });
      stops.push({ p: root, st: lvR ? "own" : shut ? "closed" : "open", col, r: 17, n: lvR });
      const f = Object.keys(S.FUSIONS).find((k) => S.FUSIONS[k].roads[0] === road), x = at(a + Math.PI / 6, 104); if (f) stops.push({ p: x, st: s.fus.includes(f) ? "xown" : S.crossOk(s, f) ? "xopen" : "x", col: "#ffd23f", r: 8 });
    });
    for (const q of stops) { const [x, y] = q.p.map((v) => +v.toFixed(1));
      if (q.st[0] === "x") { const k = q.r, own = q.st === "xown", op = q.st === "xopen"; out.push(`<path d="M${x} ${y - k}L${x + k} ${y}L${x} ${y + k}L${x - k} ${y}Z" fill="${own ? "#ffd23f" : op ? "#3a2a06" : "#150828"}" stroke="${own ? "#05020c" : op ? "#ffd23f" : "#3a2752"}" stroke-width="2.5"/>`); continue; }
      const own = q.st === "own", op = q.st === "open" || q.st === "near", dash = q.st === "lock" || q.st === "closed";
      if (own) out.push(`<circle cx="${x + 2}" cy="${y + 3}" r="${q.r}" fill="#05020c"/>`);
      out.push(`<circle cx="${x}" cy="${y}" r="${q.r}" fill="${own ? q.col : "#150828"}" stroke="${own ? "#05020c" : op ? q.col : "#3a2752"}" stroke-width="${q.st === "open" ? 3 : 2.5}" ${dash ? 'stroke-dasharray="3 3"' : ""} opacity="${q.st === "closed" ? 0.35 : 1}"/>`);
      if (q.st === "open") out.push(`<circle cx="${x}" cy="${y}" r="${q.r + 5}" fill="none" stroke="${q.col}" stroke-width="1.2" opacity="0.6"/>`);
      if (q.n) out.push(`<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="${own ? "#14041a" : q.col}">${q.n}</text>`); }
    out.push(`<path d="M${C} ${C - 18}L${C + 11} ${C + 12}L${C} ${C + 6}L${C - 11} ${C + 12}Z" fill="#7dfcff" stroke="#05020c" stroke-width="3"/>`);
    S.ROADS.forEach((road, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3, [x, y] = at(a, 174); out.push(`<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="${D.SC(S.PARTS[road].school)}" stroke="#05020c" stroke-width="3" paint-order="stroke">${S.PARTS[road].label}</text>`); });
    return `<svg viewBox="0 0 380 380" width="100%" role="img" aria-label="Flight Plan board">${out.join("")}</svg>`;
  }
  function planCard(back) {
    const rows = S.ROADS.map((road) => { const P = S.PARTS[road], col = D.SC(P.school), L = S.lv(s, road), t = S.forkTaken(s, road), sd = Object.keys(S.PARTS).filter((q) => S.PARTS[q].road === road);
      const fork = t ? `⤷ ${S.PARTS[t].label} ${LV(S.lv(s, t), t)}` : L >= 3 ? `fork open: ${sd.map((q) => S.PARTS[q].label).join(" or ")}` : `forks at level 3: ${sd.map((q) => S.PARTS[q].label).join(" / ")}`;
      return `<span><b style="color:${col}">${P.label} ${LV(L, road)}</b><em class="${t ? "on" : L >= 3 ? "op" : ""}">${esc(fork)}</em></span>`; }).join("");
    const cross = Object.keys(S.FUSIONS).filter((f) => s.fus.includes(f) || S.crossOk(s, f)).map((f) => `<span><b style="color:#ffd23f">✦ ${S.FUSIONS[f].label}</b><em>${s.fus.includes(f) ? "yours" : "open: look for it on gate cards"}</em></span>`).join("");
    card(`<p class="fam">${esc(s.run ? `Level ${Math.min(s.run.rooms, s.run.room + 1)} of ${s.run.rooms} · ${ser().place}` : "")}</p><h1>Flight Plan</h1><p>Six roads out from your rocket. At level 3 a road forks: choose one side for this flight. Where two neighbouring roads have both forked, a <b style="color:#ffd23f">crossing</b> opens.</p><div class="comic plan">${planSvg()}</div><div class="comic"><h3>Your roads</h3><div class="kit roads">${rows}${cross}</div></div><button class="btn main" id="back" type="button">Back</button>`);
    on("back", back);
  }
  const PL = (k) => (k === "full" ? { label: "Full repair", what: "Hull back to full", color: "#5ff0a8" } : S.PLAIN[k]);
  const YARDHEAD = { salvage: ["Salvage Yard", "Take your pick of the wreckage"], cross: ["Crossroads", "Three schools, one lesson each"], post: ["Trading Post", "Pay with this run's stamps"] };
  // A new gun from a card asks which of your two guns it replaces (owner, 24 Nov 2026: "switch out both weapons").
  function slotCard(o, back) {
    const gg = S.GUNS[o.gun], c = card(`<p class="fam" style="color:#f4ecff">${esc(gg.label)}</p><h1>Swap out which gun?</h1><p>${esc(gg.what)}</p>${s.guns.map((k, j) => `<button class="opt" type="button" data-j="${j}"><small style="color:#f4ecff;font-weight:800">${j === s.gun ? "In your hand" : "Your other gun"}</small><b>${esc(S.GUNS[k].label)}${s.gunLv[k] ? ` ${MK[s.gunLv[k]]}` : ""}</b><span class="d">− Goes back to the racks</span></button>`).join("")}<button class="btn" type="button" id="back">Back</button>`);
    c.querySelectorAll("[data-j]").forEach((b) => { b.onclick = () => back(Number(b.dataset.j)); }); on("back", () => pickCard());
  }
  function pickCard() {
    const r = s.run, isGun = !r.school && !r.yard, yh = r.yard && YARDHEAD[r.yard]; prog.seen.pick = 1;
    const c = card(`<p class="fam" style="color:${isGun ? "#f4ecff" : D.SC(r.school)}">${yh ? `${yh[0]} · ${yh[1]}` : isGun ? "The armory" : `School of ${S.SCHOOLS[r.school].label} · ${S.SCHOOLS[r.school].teach}`}${r.hardPay ? " · double" : ""}</p><h1>${isGun ? "Choose a gun" : "Choose one"}</h1>${r.yard === "post" ? `<p>You have <b>${s.stamps || 0} stamps</b> this run. What you spend here doesn't reach Quill's Shop.</p>` : r.offer.some((o) => o.gun) ? "<p>A new gun swaps out one of your two guns (you choose which); an upgrade keeps a gun and makes it better.</p>" : ""}${r.offer.map((o, i) => {
      if (o.mod) { const gg = S.GUNS[o.mod], n = (s.gunLv[o.mod] || 0) + 1, m = S.MODS[o.mod][n - 1]; return `<button class="opt" type="button" data-i="${i}" style="--hue:#7dfcff"><span class="tagl">Upgrade</span><small style="color:#7dfcff;font-weight:800">${n === 1 ? "Mk II" : "Mk III"} · the gun you hold</small><b>${gg.label} ${MK[n]}</b><span class="u">+ ${esc(m.what)}</span></button>`; }
      if (o.gun) { const gg = S.GUNS[o.gun]; return `<button class="opt" type="button" data-i="${i}" style="--hue:#f4ecff">${isGun ? "" : '<span class="tagl">New gun</span><small style="color:#f4ecff;font-weight:800">Swaps one of your two guns</small>'}<b>${gg.label}</b><span class="u">${gg.what}</span></button>`; }
      if (o.plain) { const q = PL(o.plain); return `<button class="opt" type="button" data-i="${i}" style="--hue:${q.color}"><span class="tagl">Supplies</span>${o.fill ? `<small style="color:${q.color};font-weight:800">${isGun ? "The racks are running bare" : "Nothing new left to learn here"}</small>` : ""}<b>${q.label}</b><span class="u">+ ${esc(q.what)}${r.hardPay && !isGun ? ", twice" : ""}</span></button>`; }
      if (o.f) { const f = S.FUSIONS[o.f]; return `<button class="opt" type="button" data-i="${i}" style="--hue:#ffd23f"><span class="tagl">✦ Crossing</span><small style="color:#ffd23f;font-weight:800">${f.roads.map((x) => S.PARTS[x].label).join(" road + ")} road</small><b>${f.label}</b><span class="u">+ ${esc(f.what)}</span></button>`; }
      const p = S.PARTS[o.k], wv = S.lv(s, o.k), now = Math.min(TOP(o.k), wv + o.n), cost = !o.cost ? "" : o.cost === "max" ? "1 less hull, for good" : `${S.PARTS[o.cost].label} drops to level ${S.lv(s, o.cost) - 1}`; const fk = p.road && !wv, other = p.road ? Object.keys(S.PARTS).find((q) => S.PARTS[q].road === p.road && q !== o.k) : null; return `<button class="opt${o.cost ? " bold" : ""}${fk ? " fork" : ""}" type="button" data-i="${i}" style="--hue:${D.SC(p.school)}">${o.cost ? `<span class="tagl">Bold</span>` : fk ? `<span class="tagl">Fork</span>` : ""}${p.road ? `<small style="color:${D.SC(p.school)};font-weight:800">${S.PARTS[p.road].label} road${fk ? ` · closes ${esc(S.PARTS[other].label)} for this flight` : ""}</small>` : ""}<b>${p.label} <small style="color:${D.SC(p.school)};letter-spacing:2px">${LV(now, o.k)}</small></b><span class="u">${p.what}</span><small>${wv ? `Level ${wv} → ${now}` : now > 1 ? `Straight to level ${now}` : "New"}</small>${preview(o.k, now) ? `<span class="pv">${preview(o.k, now)}</span>` : ""}${cost ? `<span class="cost">− ${esc(cost)}</span>` : ""}</button>`;
    }).map((h, i) => { const o = r.offer[i]; if (!o.price) return h; const ok = (s.stamps || 0) >= o.price; return h.replace("<button ", `<button ${ok ? "" : "disabled "}`).replace(/<\/button>$/, `<small class="need" style="color:#ffd23f">${o.price} stamps${ok ? "" : " · not enough"}</small></button>`); }).join("")}<div class="row two"><button class="btn" type="button" id="reroll" ${s.rerolls || r.free ? "" : "disabled"}>${r.free ? "Reroll (free)" : `Reroll (${s.rerolls})`}</button><button class="btn" type="button" id="skip">Skip: repair 1</button></div>${isGun ? "" : '<button class="btn" type="button" id="plan">See your Flight Plan</button>'}`);
    c.querySelectorAll("[data-i]").forEach((b) => { b.onclick = () => { const o = r.offer[Number(b.dataset.i)], k = o.mod ? `${o.mod}+` : o.plain ? `plain:${o.plain}` : o.gun || o.f || o.k; prog.picks[k] = (prog.picks[k] || 0) + 1; if (o.k) prog.codex.parts[o.k] = 1; const was = stat(), col = o.plain ? PL(o.plain).color : o.mod ? "#7dfcff" : o.gun ? "#f4ecff" : o.f ? "#ffd23f" : D.SC(S.PARTS[o.k].school), name = o.plain ? PL(o.plain).label : o.mod ? `${S.GUNS[o.mod].label} ${MK[(s.gunLv[o.mod] || 0) + 1]}: ${S.MODS[o.mod][s.gunLv[o.mod] || 0].what}` : o.gun ? S.GUNS[o.gun].label : o.f ? S.FUSIONS[o.f].label : `${S.PARTS[o.k].label} ${LV(Math.min(TOP(o.k), S.lv(s, o.k) + o.n), o.k)}`; if (!S.take(s, Number(b.dataset.i), b.swapTo)) return; sfx("pick", {}, () => { tone(880, 0.15, 0.05, "triangle", 1320); }); resume(); gained(was, name, col); }; });
    c.querySelectorAll("[data-i]").forEach((b) => { const go = b.onclick; b.onclick = () => { const o = r.offer[Number(b.dataset.i)]; if (o.price && (s.stamps || 0) < o.price) return; if (o.gun && s.guns.length > 1) slotCard(o, (j) => { b.swapTo = j; go(); }); else go(); }; });
    on("reroll", () => { if (S.reroll(s)) { tone(500, 0.1, 0.04); pickCard(); } }); on("skip", () => { S.skip(s); resume(); }); on("plan", () => planCard(pickCard));
  }
  function eventCard(k) {
    const ev = S.EVENTS[k]; prog.codex.events[k] = 1; portrait(ev.who === "keeper" || ev.who === "beacon" ? "wren" : ev.who, "calm");
    const c = card(`<p class="fam">${esc(S.CAST[ev.who].name)} · ${esc(S.CAST[ev.who].role)}</p><h1>${esc(ev.title)}</h1>${C.panel(ev.who, ev.who === "keeper" ? "angry" : "wry", esc(ev.line))}${ev.opts.map((o, i) => { const ok = S.canTake(s, o); return `<button class="opt" type="button" data-i="${i}" ${ok ? "" : "disabled"}><b>${esc(o.label)}</b><span class="u">+ ${esc(o.up)}</span>${o.down ? `<span class="d">− ${esc(o.down)}</span>` : ""}${ok ? "" : `<small class="need">${esc(needText(o.need))}</small>`}</button>`; }).join("")}`);
    c.querySelectorAll("[data-i]").forEach((b) => { b.onclick = () => { const was = stat(); if (!S.decide(s, Number(b.dataset.i))) return; const got = (s.ev.find((q) => q.decided) || {}).got || []; sfx("pick", { rate: 0.9 }, () => { tone(700, 0.2, 0.05, "triangle", 1050); }); resume(); if (got.length) gained(was, got.map((q) => `${S.PARTS[q].label} ${LV(s.p[q] || 0, q)}`).join(", "), D.SC(S.PARTS[got[0]].school)); else gained(was, "", "#ff5fd8", true); }; });
  }
  // What a pick changes, in real numbers: "Damage 110% → 130%".
  function preview(k, now) {
    const was = S.lv(s, k), d = now - was; if (d <= 0) return "";
    if (k === "hot" || k === "quick") { const f = k === "hot" ? S.power : S.rate, a = f(s), old = s.p[k]; s.p[k] = now; const b = f(s); if (old) s.p[k] = old; else delete s.p[k]; return `${k === "hot" ? "Damage" : "Fire rate"} ${pct(a)} → <b>${pct(b)}</b>`; }
    if (k === "reserve") return `Hull ${s.hullMax} → <b>${s.hullMax + d}</b>, repaired`;
    if (k === "skin") return `Shields ${s.guard} → <b>${s.guard + d}</b>`;
    if (k === "split") return `Bullets a volley +${was} → <b>+${now}</b>`;
    if (k === "track") return `Tracking ${LV(was, k)} → <b>${LV(now, k)}</b>`;
    return "";
  }
  const needText = (n = {}) => (n.max ? `Needs a hull of ${n.max} or more` : n.parts ? `Needs ${n.parts} parts` : n.hull ? `Needs more than ${n.hull} hull left` : "Not open");
  const FAMNAME = { trigger: "WHEN you fire", shot: "WHAT you fire (it replaces your guns)", rule: "A new RULE for the sky" };
  function coreCard() {
    const list = S.choices(s);
    const c = card(`<p class="fam">Tamsin's midterm</p><h1>Choose a core</h1><p>A core changes how your rocket fights for the rest of the run. You also get 2 hull back.</p>${list.map((k) => `<button class="opt" type="button" data-k="${k}" style="--hue:#ffd23f"><small style="color:#ffd23f;font-weight:800">${FAMNAME[S.CORES[k].fam]}</small><b>${S.CORES[k].label} core</b>${s.core[S.CORES[k].fam] ? `<span class="tagl">Swap</span><small class="need" style="color:#ffd23f">Swaps out your ${esc(S.CORES[s.core[S.CORES[k].fam]].label)} core</small>` : ""}<span class="u">+ ${esc(S.CORES[k].up)}</span><span class="d">− ${esc(S.CORES[k].down)}</span>${S.CORES[k].fam === "shot" ? `<span class="d">− Replaces ${s.guns.map((q) => S.GUNS[q].label + (s.gunLv[q] ? ` ${MK[s.gunLv[q]]}` : "")).join(" and ")} for the rest of the run (upgrades still count)</span>` : ""}</button>`).join("")}`);
    c.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { prog.codex.cores[b.dataset.k] = 1; prog.picks[b.dataset.k] = (prog.picks[b.dataset.k] || 0) + 1; S.choose(s, b.dataset.k); sfx("core", {}, () => { tone(523, 0.4, 0.07, "triangle", 1047); }); resume(); banner(`${S.CORES[b.dataset.k].label} core`, S.CORES[b.dataset.k].up, 1800); }; });
  }
  function bossIntro() { const n = s.run.act, k = n === 3 ? "boss3" : n === 2 ? "boss2" : "boss"; stop(); music(false); scene(C.story(s.ally ? `${k}Ally` : k, prog.flags, s.run.flags), () => { resume(); music(true, true); }, ser().boss); }
  function duelIntro() { stop(); music(false); scene(C.story(s.run.act === 3 ? "echo" : "duel", prog.flags, s.run.flags), () => { resume(); music(true, true); }, "Midterm duel"); }
  function pause() { if (!playing || !$("card").hidden) return; stop(); pauseCard(); }
  function pauseCard() {
    card(`<h1>Paused</h1>${s ? `<div class="comic"><h3>Your rocket</h3><div class="kit">${$("kit").innerHTML}</div></div><div class="comic"><h3>Flight orders</h3>${ordersHtml(s.run.act, s)}</div>` : ""}<button class="btn main" id="on" type="button">Carry on</button>${s ? '<button class="btn" id="plan" type="button">Flight Plan</button>' : ""}<button class="btn" id="opts" type="button">Settings</button><button class="btn" id="out" type="button">Give up the run</button>`);
    on("on", resume); on("plan", () => planCard(pauseCard)); on("opts", () => settings(pauseCard));
    on("out", () => { const b = $("out"); b.outerHTML = `<div class="row two"><button class="btn" id="keep" type="button">Keep flying</button><button class="btn warn" id="quit" type="button">Yes, give up (half the stamps)</button></div>`; on("keep", resume); on("quit", () => { s.over = "lost"; s.quit = true; finish(); }); });
  }

  /* ---------- A run: start and end ---------- */
  function start() {
    wake(); fillOrders(); runDone = new Set(); orderT = 0; const gs = prog.train.loadout && prog.loadout ? prog.loadout : ["pulse", "splinter"];
    s = S.create({ seed: TEST ? "test" : `${Date.now()}`, run: true, ...SER[pickSer()].game, guns: gs, meta: { own: prog.own, train: prog.train }, belt: prog.exam || 0, assist: set.assist, keep: campOn() ? null : (prog.keep || {})[pickSer()] || null, rig: campOn() && prog.camp ? prog.camp.snap.rig || rigNow() : rigNow(), carry: campOn() && prog.camp ? prog.camp.snap : null, campaign: campOn() });
    s.campRun = campOn();
    $("hud").hidden = $("bot").hidden = false; $("card").hidden = true; trail = []; words = []; ghosts = []; fx = []; debris = []; smoke = []; flashes = []; soon = []; lastPhase = ""; lastRoom = -1; deathAt = 0; slowMo = 0; flash = 0; later = null; pops = []; skyFor(s.run.act); prog.runs++; save();
    portrait("wren", "calm"); buildSlots(); music(true); playing = true; input.read(); run.start(); radioClear(); if (prog.runs <= 3) radio(["tamsin", TOUCHY() ? "<b>Drag anywhere</b> to steer. <b>Double-tap a spot</b> to dash there, straight through shots." : "<b>Arrows or WASD</b> to steer. <b>Double-click a spot</b> (or Space) to dash there, straight through shots.", 1], 300);
  }
  /* ---------- Flight orders: three small goals for one flight; bests; what to buy next ---------- */
  let orderT = 0, runDone = new Set();
  const orderText = (k, n) => S.ORDERS[k].what(S.order(k, n).n);
  function fillOrders(not = []) { prog.orders = (prog.orders || []).filter((k) => S.ORDERS[k]); const keys = Object.keys(S.ORDERS); while (prog.orders.length < 3) { const l = keys.filter((k) => !prog.orders.includes(k) && !not.includes(k)); prog.orders.push(l[Math.floor(Math.random() * l.length)]); } }
  const ordersHtml = (n, live) => `<div class="orders">${(prog.orders || []).map((k) => { const done = live && S.orderDone(S.order(k, n), live); return `<span class="${done ? "done" : ""}"><i>${done ? "✓" : "○"}</i>${esc(orderText(k, n))}<em>+${S.ORDER_PAY}</em></span>`; }).join("")}</div>`;
  function nextBuy() { const l = Object.keys(S.META).map((k) => { const m = S.META[k], lvl = prog.train[k] || 0, done = m.kind === "train" ? lvl >= m.cost.length : !!prog.own[k]; return done ? null : { k, label: m.label, price: cost(k) }; }).filter(Boolean).sort((a, b) => a.price - b.price); if (!l.length) return null; const can = l.filter((q) => q.price <= prog.stamps); return can.length ? { ...can[can.length - 1], can: can.length } : l[0]; }
  const nextBuyHtml = () => { const q = nextBuy(); if (!q) return `<span><b>Quill's Shop</b>All bought</span>`; return q.can ? `<span class="buy"><b>Quill's Shop</b>You can buy ${esc(q.label)}${q.can > 1 ? ` (and ${q.can - 1} more)` : ""} now</span>` : `<span class="buy"><b>Next buy</b>${esc(q.label)}: ${q.price - prog.stamps} more stamps<i class="bar"><i style="width:${Math.round((prog.stamps / q.price) * 100)}%"></i></i></span>`; };
  const farText = (n, rooms = 10) => (n > rooms + 1 ? "won" : n === rooms + 1 ? "reached the boss" : `level ${n}`);
  const TOUCHY = () => matchMedia("(pointer: coarse)").matches;
  function finish() {
    if (!s || s.done) return; s.done = true; playing = false; radioClear(); clearTimeout(toastAt); $("toast").classList.remove("on"); run.stop(); music(false); sfx(s.over === "won" ? "won" : "lost"); $("bossbar").hidden = true;
    fillOrders(); const doneO = prog.orders.filter((k) => S.orderDone(S.order(k, s.run.act), s)), oStamps = doneO.length * S.ORDER_PAY;
    const r = s.run, won = s.over === "won", rec = { room: r.room, beat: won, hits: s.hits, exam: prog.exam }, stamps = s.quit ? Math.round(S.marks(s) / 2) : S.marks(s), before = prog.belt, belt = Math.max(before, S.beltOf(rec));
    prog.stamps += stamps + oStamps; prog.belt = belt; const oWas = prog.orders.slice(); prog.orders = prog.orders.filter((k) => !doneO.includes(k)); fillOrders(doneO); const sn = SER[r.act] ? r.act : 1, two = sn >= 2, SR = SER[sn], first2 = won && sn === 1 && prog.wins === 0, first3 = won && sn === 2 && !prog.won2;
    prog.best = Math.max(prog.best, r.room + (won ? 1 : 0)); if (won) prog.wins++; if (won && sn === 2) prog.won2 = (prog.won2 || 0) + 1; if (won && sn === 3) { prog.won3 = (prog.won3 || 0) + 1; prog.endings = { ...(prog.endings || {}), [`${s.ally ? "v" : "-"}${(prog.flags || {}).snub || (r.flags || []).includes("snub") ? "-" : "b"}`]: 1 }; } prog.flags = prog.flags || {}; for (const q of r.flags || []) { prog.flags[q] = 1; if (q === "helped") delete prog.flags.snub; if (q === "snub") delete prog.flags.helped; } prog.bests = prog.bests || {}; const bw = prog.bests[sn] || { score: 0, room: 0 }, far = won ? r.rooms + 2 : r.phase === "boss" && !r.duel ? r.rooms + 1 : r.room + 1, newScore = s.score > bw.score && bw.score > 0, newFar = far > bw.room && bw.room > 0; prog.bests[sn] = { score: Math.max(bw.score, s.score), room: Math.max(bw.room, far) }; prog.last = { won, series: sn, room: r.room, at: r.phase === "boss" ? (r.duel ? "duel" : "boss") : "level", stamps }; save();
    const wk = sn === 3 ? (won ? "won3" : r.phase === "boss" ? (r.duel ? "lostEcho" : "lostBoss3") : r.room >= 6 ? "lostLate3" : "lostEarly3") : two ? (won ? "won2" : r.phase === "boss" ? (r.duel ? "lostDuel" : "lostBoss2") : r.room >= 6 ? "lostLate2" : "lostEarly2") : won ? "won" : r.phase === "boss" ? "lostBoss" : r.room >= 6 ? "lostLate" : r.room >= 3 ? "lostMid" : "lostEarly", bossLeft = r.phase === "boss" ? s.en.find((e) => e.kind === "boss") : null, why = won ? C.story(wk, { ...prog.flags, ally: s.ally ? 1 : 0 }) : C.loss(wk, (prog.lossN = prog.lossN || {})[wk] = ((prog.lossN[wk] ?? -1) + 1), { ...prog.flags, ally: s.ally ? 1 : 0 }, !!bossLeft && bossLeft.hp < bossLeft.max * 0.3);
    const B = S.RANKS[belt], nb = belt > before;
    // Campaign: a loss in Series one ends it; later, a checkpoint retry while any are left; a Series three win completes it.
    const camp = !!s.campRun, retry = camp && !won && sn > 1 && prog.camp && prog.camp.ser === sn && prog.camp.tries > 0;
    if (camp && !won && !retry) prog.camp = null; if (camp && won && sn === 3) { prog.camp = null; prog.campWins = (prog.campWins || 0) + 1; } save();
    const end = () => {
      $("hud").hidden = $("bot").hidden = true;
      card(`<p class="fam">${won ? `${SR.name} cleared` : r.phase === "boss" ? (r.duel ? "Down in the midterm duel" : `Down at ${SR.boss.replace(/^The/, "the")}`) : `Down on level ${r.room + 1} of ${r.rooms} · ${SR.place}`}</p><h1>${won ? "Delivered!" : "Ship lost"}</h1>${C.panel(why[0][0], why[0][1], esc(why[0][2]))}
        <div class="grid2"><div class="comic"><h3>This flight</h3><div class="kit"><span><b>Score</b>${num(s.score)}${newScore ? ' <em class="nb">NEW BEST</em>' : ""}</span><span><b>Best</b>${num(prog.bests[sn].score)} · ${farText(prog.bests[sn].room, r.rooms)}${newFar ? ' <em class="nb">FURTHEST YET</em>' : ""}</span><span><b>Flawless levels</b>${s.flawless || 0}</span><span><b>Wrecks</b>${s.kills}</span><span><b>Close calls</b>${s.grazes}</span><span><b>Hits taken</b>${s.hits}</span><span><b>Time</b>${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, "0")}</span></div></div>
        <div class="comic"><h3>Earned</h3><div class="kit"><span><b>Stamps</b><span class="stamps">+${stamps + oStamps}</span>${oStamps ? ` <small>(${oStamps} from orders)</small>` : ""}</span><span><b>Belt</b><span class="chip" style="--belt:${B.color}"><i></i>${B.name}</span></span>${nb ? `<span style="color:#5ff0a8"><b>New belt!</b></span>` : belt < 8 ? `<span><b>Next</b>${esc(S.RANKS[belt + 1].how)}</span>` : ""}${won && sn === 1 ? `<span style="color:#7dfcff"><b>Series two open</b>${first2 ? "Fly it now, below" : "The Glass Tide"}</span>` : won && sn === 2 ? `<span style="color:#ff9a3d"><b>${first3 ? "Series three open" : "Glass Tide"}</b>${first3 ? "Fly it now, below" : `Mapmaker beaten ×${prog.won2}`}</span>` : won ? `<span style="color:#ff9a3d"><b>Graduated</b>Last Bell silenced ×${prog.won3}</span>` : ""}</div></div></div>
        <div class="comic"><h3>Flight orders</h3><div class="orders">${oWas.map((k) => `<span class="${doneO.includes(k) ? "done" : ""}"><i>${doneO.includes(k) ? "✓" : "○"}</i>${esc(orderText(k, sn))}<em>${doneO.includes(k) ? `+${S.ORDER_PAY}` : ""}</em></span>`).join("")}</div>${doneO.length ? "<p><small>New orders take their place. They're in the hangar.</small></p>" : ""}<div class="kit">${nextBuyHtml()}</div></div>
        ${camp ? (won && sn < 3 ? `<button class="btn main" id="cont" type="button">Fly ${esc(SER[sn + 1].name)}: the ${esc(SER[sn + 1].place)}</button>` : retry ? `<button class="btn main" id="retry" type="button">Retry ${esc(SR.name)} from the checkpoint (${prog.camp.tries} left)</button><button class="btn" id="again" type="button">Start a new campaign</button>` : `${won && sn === 3 ? '<p style="color:#5ff0a8;text-align:center"><b>Campaign complete: one rocket, three series.</b></p>' : '<p style="text-align:center"><small>Campaign over. The next one starts from Series one.</small></p>'}<button class="btn main" id="again" type="button">Start a new campaign</button>`) : first2 || first3 ? `<button class="btn main" id="next" type="button">Fly ${first2 ? "Series two: the Glass Tide" : "Series three: the Bellwake"}</button><button class="btn" id="again" type="button">Fly again</button>` : '<button class="btn main" id="again" type="button">Fly again</button>'}<div class="row two"><button class="btn" id="school" type="button">${shopLabel()}</button><button class="btn" id="home" type="button">Hangar</button></div>`);
      on("again", () => { if (camp) prog.camp = null; save(); start(); }); on("retry", () => { prog.camp.tries--; save(); start(); }); on("cont", () => { const k = SER[sn + 1].intro; if (k && !prog.seen[k]) { prog.seen[k] = 1; save(); scene(C.story(k, prog.flags), start, SER[sn + 1].name); } else start(); }); on("next", () => { prog.series = first2 ? 2 : 3; save(); const k = SER[prog.series].intro; if (!prog.seen[k]) { prog.seen[k] = 1; save(); scene(C.story(k, prog.flags), start, SER[prog.series].name); } else start(); }); on("school", () => school(hangar)); on("home", hangar); if (nb) sfx("flawless", { rate: 0.75 }, () => { tone(523, 0.3, 0.07, "triangle"); setTimeout(() => tone(784, 0.5, 0.07, "triangle"), 180); });
    };
    // A keepsake: after a Series one or two win, carry one upgrade from this run into the next series (at level 2).
    const held = Object.keys(s.p).filter((k) => S.PARTS[k] && !S.PARTS[k].road && s.p[k] > 0).sort((a, b) => s.p[b] - s.p[a]).slice(0, 3);
    // Campaign: the whole rocket rides on into the next series, which sizes it up. A checkpoint is saved here.
    const carryCard = () => { const nx = SER[sn + 1], sp = S.snap(s), pw = S.powerOf(sp), t0 = S.TOUGH[sn + 1] || 1, t1 = t0 * Math.min(S.CAMP.cap, 1 + S.CAMP.k * pw); prog.camp = { ser: sn + 1, snap: sp, tries: S.CAMP.tries }; save();
      const cores = Object.values(sp.core).filter(Boolean).map((k) => S.CORES[k].label), roads = Object.keys(sp.p).filter((k) => !S.PARTS[k].road).map((k) => { const t = S.forkTaken(s, k); return `${S.PARTS[k].label} ${sp.p[k]}${t ? ` ⤷ ${S.PARTS[t].label}` : ""}`; });
      card(`<p class="fam">${esc(S.BOSSES[sn].label)} beaten · Campaign</p><h1>Into the ${esc(nx.place)}</h1>${C.panel("tamsin", "calm", esc(`Don't unpack, Wren. The ${nx.place}'s waiting, and so is everything you bolted on today.`))}
        <div class="comic"><h3>Your rocket carries on</h3><div class="kit"><span><b>Guns</b>${sp.core.shot ? `${esc(S.CORES[sp.core.shot].label)} core fires for you` : sp.guns.map((g) => `${S.GUNS[g].label}${sp.gunLv[g] ? ` ${MK[sp.gunLv[g]]}` : ""}`).join(" · ")}</span><span><b>Cores</b>${cores.length ? esc(cores.join(" · ")) : "none yet"}</span><span><b>Roads</b>${esc(roads.join(" · ") || "none")}</span>${sp.fus.length ? `<span><b>Crossings</b>${sp.fus.map((f) => S.FUSIONS[f].label).join(" · ")}</span>` : ""}<span><b>Hull</b>${Math.min(sp.hullMax, sp.hull + 2)} of ${sp.hullMax} (2 repaired)</span></div></div>
        <div class="comic"><h3>The ${esc(nx.place)} sizes you up</h3><div class="kit"><span><b>Your power</b>${pw} levels</span><span><b>Enemy toughness</b>×${t0.toFixed(2)} → ×${t1.toFixed(2)}</span></div><p><small>The stronger the rocket you bring, the tougher it flies. Checkpoint saved: lose in ${esc(nx.name)} and you can retry from here (${S.CAMP.tries} tries).</small></p></div>
        <button class="btn main" id="go" type="button">Fly ${esc(nx.name)}: the ${esc(nx.place)}</button><div class="row two"><button class="btn" id="tally" type="button">Stamps and orders</button><button class="btn" id="home" type="button">Hangar</button></div>`);
      on("go", () => { const k = nx.intro; if (k && !prog.seen[k]) { prog.seen[k] = 1; save(); scene(C.story(k, prog.flags), start, nx.name); } else start(); }); on("tally", end); on("home", hangar); sfx("pick", {}, () => { tone(784, 0.3, 0.06, "triangle", 1175); }); };
    const keepCard = () => { if (camp && won && sn < 3) return carryCard(); if (!won || sn >= 3 || !held.length) return end(); const nx = SER[sn + 1], cur = (prog.keep || {})[sn + 1];
      const c = card(`<p class="fam">A keepsake for ${esc(nx.name)}</p><h1>${held.length > 1 ? "Keep one upgrade" : "Your keepsake"}</h1>${C.panel("tamsin", "calm", esc(`You earned this, Wren. Take one thing from today into the ${nx.place}. It'll be there every time you fly it.`))}${held.map((k) => `<button class="opt" type="button" data-keep="${k}" style="--hue:${D.SC(S.PARTS[k].school)}"><b>${S.PARTS[k].label} <small style="color:${D.SC(S.PARTS[k].school)};letter-spacing:2px">${LV(S.KEEP_LV + (prog.train.heir ? 1 : 0), k)}</small></b><span class="u">+ ${esc(S.PARTS[k].what)}</span><small>Starts every ${esc(nx.name)} flight at level ${S.KEEP_LV + (prog.train.heir ? 1 : 0)}${cur === k ? " · your keepsake now" : ""}</small></button>`).join("")}${cur ? `<button class="btn" id="keepold" type="button">Keep my ${esc(S.PARTS[cur].label)} keepsake</button>` : ""}`);
      c.querySelectorAll("[data-keep]").forEach((b) => { b.onclick = () => { prog.keep = { ...(prog.keep || {}), [sn + 1]: b.dataset.keep }; save(); sfx("pick", {}, () => { tone(784, 0.3, 0.06, "triangle", 1175); }); end(); }; }); on("keepold", end); };
    const wkey = SR.won || "won"; if (won && !prog.seen[wkey]) { prog.seen[wkey] = 1; save(); scene(why, keepCard, SR.name); } else keepCard();
  }

  /* ---------- Out of the run: hangar, Flight School, belts, settings, how to play ---------- */
  // Green opens Exam 1; each exam belt (Purple, Brown, Red) opens the next.
  const examsOpen = () => (prog.belt >= 3 ? Math.min(4, Math.max(1, prog.belt - 3)) : 0);
  const beltChip = () => { const B = S.RANKS[prog.belt]; return `<span class="chip" style="--belt:${B.color}"><i></i>${B.name} belt</span>`; };
  // The next long goal: a belt, then a series to open.
  const goalHtml = () => { const b = prog.belt < 8 ? S.RANKS[prog.belt + 1] : null; return b && prog.belt < 4 ? `<span><b>Next belt</b>${b.name}: ${esc(b.how)}</span>` : !open2() ? `<span><b>Next</b>Win Series one to open the Glass Tide</span>` : !open3() ? `<span><b>Next</b>Beat the Mapmaker to open the Bellwake</span>` : b ? `<span><b>Next belt</b>${b.name}: ${esc(b.how)}</span>` : ""; };
  // Starting rigs: Courier and Hauler are free, the others are bought in Quill's Shop and chosen here.
  const rigOwn = (k) => k === "courier" || k === "hauler" || !!prog.own[k], rigNow = () => (S.RIGS[prog.rig] && rigOwn(prog.rig) ? prog.rig : "courier");
  const rigHtml = () => { const cur = rigNow(), R = S.RIGS[cur]; return `<div class="comic rigs"><div class="row" role="group" aria-label="Your rig">${Object.keys(S.RIGS).map((k) => `<button class="btn rig" type="button" data-rig="${k}" aria-pressed="${String(cur === k)}" style="--rig:${S.RIGS[k].color}" ${rigOwn(k) ? "" : "disabled"}><i></i>${rigOwn(k) ? "" : "🔒 "}${S.RIGS[k].label}</button>`).join("")}</div><p class="rigwhat"><b style="color:${R.color}">${R.label} rig</b> <span class="up">Gives: ${esc(R.up)}.</span> <span class="down">Costs: ${esc(R.down)}.</span>${prog.own.dart || prog.own.ghost || prog.own.tinker || prog.own.scholar ? "" : " <small>More rigs in Quill's Shop.</small>"}</p></div>`; };
  function hangar() {
    stop(); fillOrders(); radioClear(); s = null; $("hud").hidden = $("bot").hidden = true; $("bossbar").hidden = true; portrait("tamsin", "calm"); music(false); skyFor(pickSer()); draw();
    const cp = prog.camp, mode = `<div class="row two modes" role="group" aria-label="How to fly"><button class="btn mode" type="button" data-mode="campaign" aria-pressed="${String(campOn())}">Campaign <small>· all three</small></button><button class="btn mode" type="button" data-mode="series" aria-pressed="${String(!campOn())}">One series</button></div>`;
    const campRow = `<p class="campline">${cp ? `<b>Checkpoint: ${SER[cp.ser].name}.</b> Your rocket is waiting · ${cp.tries} ${cp.tries === 1 ? "retry" : "retries"} left · <button class="link" id="campnew" type="button">Start over</button>` : "<b>One rocket through all three series.</b> Everything you bolt on carries over; each series sizes you up."}</p>`;
    const cur = pickSer(), pick = campOn() ? mode + campRow : mode + `<div class="row series" role="group" aria-label="Series">${[1, 2, 3].map((n) => `<button class="btn ser" type="button" data-ser="${n}" aria-pressed="${String(cur === n)}" ${isOpen(n) ? "" : "disabled"}><b>${SER[n].name}</b><small>${isOpen(n) ? `The ${SER[n].place}` : n === 2 ? "🔒 Win Series one" : "🔒 Win Series two"}</small></button>`).join("")}</div>`;
    const exams = prog.belt >= 3 ? `<h2>Exams</h2><div class="row">${[0, 1, 2, 3, 4].map((n) => `<button class="btn" type="button" data-x="${n}" aria-pressed="${String((prog.exam || 0) === n)}" ${n > examsOpen() ? "disabled" : ""}>${n ? `Exam ${n}` : "Normal"}</button>`).join("")}</div><p><small>${prog.exam ? S.BELT_RULES.slice(1, prog.exam + 1).join(" · ") : "Each exam adds one rule and earns the next belt."}</small></p>` : "";
    const c = card(`<div class="logo">Comet<span>Dojo</span></div><div class="tag">Courier Flight School</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px">${beltChip()}<span class="stamps">${num(prog.stamps)} stamps</span></div>
      ${pick}${campOn() && cp ? "" : rigHtml()}<button class="btn main" id="fly" type="button">${campOn() && cp ? "Continue: fly" : "Fly"} the ${ser().place}</button><div class="comic"><h3>Flight orders · ${SER[cur].name}</h3>${ordersHtml(cur)}<div class="kit">${goalHtml()}${(prog.keep || {})[cur] ? `<span><b>Keepsake</b>${S.PARTS[prog.keep[cur]].label} ${LV(S.KEEP_LV + (prog.train.heir ? 1 : 0), prog.keep[cur])}</span>` : ""}${prog.bests && prog.bests[cur] ? `<span><b>Best</b>${num(prog.bests[cur].score)} · ${farText(prog.bests[cur].room)}</span>` : ""}</div></div><div class="row two"><button class="btn" id="school" type="button">${shopLabel()}</button><button class="btn" id="belts" type="button">Belts</button></div><div class="row"><button class="btn" id="howto" type="button">How to play</button><button class="btn" id="codex" type="button">Codex</button><button class="btn" id="opts" type="button">Settings</button></div>${exams}
      <p style="text-align:center"><small>${prog.runs ? `${prog.runs} flights · ${prog.wins} delivered · best: ${prog.won3 ? "silenced the Last Bell" : prog.won2 ? "beat the Mapmaker" : prog.best > 10 ? "beat the Toll-Keeper" : `level ${prog.best}`}` : pickSer() === 3 ? "Ten levels of bells and wells. Yourself at the halfway mark. The Last Bell." : pickSer() === 2 ? "Ten levels of tide and glass. A duel at the halfway pin. The Mapmaker." : "Ten levels. Two gates at every turn. One Toll-Keeper."}</small></p>`);
    on("fly", () => { wake(); const n = pickSer(), k = SER[n].intro || "intro"; if (!prog.seen[k]) { prog.seen[k] = 1; save(); scene(C.story(k, prog.flags), start, ["", "Series one: the Rust Reef", "Series two: the Glass Tide", "Series three: the Bellwake"][n]); } else start(); });
    c.querySelectorAll("[data-mode]").forEach((b) => { b.onclick = () => { prog.mode = b.dataset.mode; save(); sfx("ui", {}, () => { tone(620, 0.08, 0.03); }); hangar(); }; });
    on("campnew", () => { prog.camp = null; save(); hangar(); });
    c.querySelectorAll("[data-ser]").forEach((b) => { b.onclick = () => { prog.series = Number(b.dataset.ser); save(); sfx("ui", {}, () => { tone(620, 0.08, 0.03); }); hangar(); }; });
    on("school", () => school(hangar)); on("belts", belts); on("howto", howto); on("codex", codex); on("opts", () => settings(hangar));
    c.querySelectorAll("[data-x]").forEach((b) => { b.onclick = () => { prog.exam = Number(b.dataset.x); save(); hangar(); }; });
    c.querySelectorAll("[data-rig]").forEach((b) => { b.onclick = () => { prog.rig = b.dataset.rig; save(); sfx("ui", {}, () => { tone(620, 0.08, 0.03); }); hangar(); }; });
  }
  const shopLabel = () => { const n = Object.keys(S.META).filter((k) => { const m = S.META[k], lvl = prog.train[k] || 0, done = m.kind === "train" ? lvl >= m.cost.length : !!prog.own[k]; return !done && cost(k) <= prog.stamps; }).length; return `Quill's Shop${n ? ` <span class="dot" aria-label="${n} you can buy">${n}</span>` : ""}`; };
  const cost = (k) => { const m = S.META[k]; return Array.isArray(m.cost) ? m.cost[prog.train[k] || 0] : m.cost; };
  function school(back) {
    portrait("quill", "wry"); const groups = [["train", "Upgrades", "Yours for good, on every flight"], ["gun", "Guns", "Any gun can turn up in a run; ones you own come up twice as often and can be your starting pair"], ["core", "Cores", "New cores turn up at the midterm"], ["rig", "Rigs", "How your rocket leaves the hangar: pick one there before you fly"]];
    const c = card(`<p class="fam">Between flights</p><h1>Quill's Shop</h1><p>"Stamps in, parts out, kid. Nothing here wears off."</p><p class="stamps">${num(prog.stamps)} stamps</p>${groups.map(([kind, label, what]) => `<h2>${label}</h2><p><small>${what}</small></p><div class="grid2">${Object.keys(S.META).filter((k) => S.META[k].kind === kind).map((k) => { const m = S.META[k], lvl = prog.train[k] || 0, maxed = kind === "train" ? lvl >= m.cost.length : !!prog.own[k], price = maxed ? 0 : cost(k); return `<button class="opt" type="button" data-k="${k}" ${maxed || price > prog.stamps ? "disabled" : ""} style="--hue:${maxed ? "#5ff0a8" : "var(--edge)"}"><b>${m.label}${kind === "train" ? ` <small style="letter-spacing:2px">${"◆".repeat(lvl)}${"◇".repeat(m.cost.length - lvl)}</small>` : ""}</b><span class="u">${esc(kind === "gun" ? S.GUNS[k].what : kind === "core" ? S.CORES[k].up : kind === "rig" ? `Gives: ${S.RIGS[k].up}. Costs: ${S.RIGS[k].down}.` : kind === "school" ? S.SCHOOLS[k].teach : m.what)}</span><small class="price">${maxed ? "Yours" : `<i></i>${price} stamps`}</small></button>`; }).join("")}</div>`).join("")}${prog.train.loadout ? `<h2>Starting guns</h2><div class="row">${Object.keys(S.GUNS).filter((k) => S.START.guns.includes(k) || prog.own[k]).map((k) => `<button class="btn" type="button" data-g="${k}" aria-pressed="${String((prog.loadout || ["pulse", "splinter"]).includes(k))}">${S.GUNS[k].label}</button>`).join("")}</div>` : ""}<button class="btn main" type="button" id="back">Back</button>`, true);
    c.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { const k = b.dataset.k, p = cost(k); if (p > prog.stamps) return; prog.stamps -= p; if (S.META[k].kind === "train") prog.train[k] = (prog.train[k] || 0) + 1; else prog.own[k] = 1; save(); wake(); sfx("buy", {}, () => { tone(880, 0.2, 0.06, "triangle", 1320); }); school(back); }; });
    c.querySelectorAll("[data-g]").forEach((b) => { b.onclick = () => { const l = (prog.loadout || ["pulse", "splinter"]).filter((k) => k !== b.dataset.g); prog.loadout = l.length < (prog.loadout || ["pulse", "splinter"]).length ? (l.length ? l : [b.dataset.g]) : [b.dataset.g, ...l].slice(0, 2); save(); school(back); }; });
    on("back", back);
  }
  function belts() {
    card(`<p class="fam">The school's ranks</p><h1>Belts</h1><p>Belts come from how well you fly. From Green, exams add one rule each.</p><div class="belts">${S.RANKS.map((b, i) => `<div class="${i > prog.belt ? "no" : ""}" style="--belt:${b.color}"><i></i><span><b>${b.name}</b><br><small>${esc(b.how)}</small></span><span>${i <= prog.belt ? "✓" : ""}</span></div>`).join("")}</div><button class="btn main" id="back" type="button">Back</button>`);
    on("back", hangar);
  }
  // Four endings to Series three: did Vesper fly beside you at the Bell, and did you help Bast in the Reef (or ever snub her)?
  const ENDINGS = [["vb", "Two wings and a friend", "Vesper beside you, and Bast never snubbed"], ["v-", "Nine years late", "Vesper beside you, Bast still sore"], ["-b", "The long way home", "Vesper scouts, and Bast never snubbed"], ["--", "Solo graduate", "Fly the Bell alone, Bast still sore"]];
  function codex() {
    const foes = Object.keys(S.ENEMIES).filter((k) => S.INTRO1[k] != null || S.INTRO2[k] != null || S.INTRO3[k] != null), seenP = Object.keys(prog.codex.parts).length;
    card(`<p class="fam">What you've met</p><h1>Codex</h1><h2>Enemies</h2><div class="kit">${foes.map((k) => prog.codex.foes[k] ? `<span><b>${S.ENEMIES[k].label}</b>${esc(S.ENEMIES[k].gun || "")}</span>` : `<span><b>???</b>Not met yet</span>`).join("")}</div><h2>People</h2><div class="kit">${Object.entries(S.CAST).map(([, c]) => `<span><b>${esc(c.name)}</b>${esc(c.role)}</span>`).join("")}</div><h2>Parts found</h2><p>${seenP} of ${Object.keys(S.PARTS).length}</p><h2>Events seen</h2><p>${Object.keys(prog.codex.events).length} of ${Object.keys(S.EVENTS).length}</p><h2>Endings</h2><div class="kit">${ENDINGS.map(([k, name, how]) => (prog.endings || {})[k] ? `<span><b>${name}</b>Seen</span>` : `<span><b>???</b>${how}</span>`).join("")}</div><button class="btn main" id="back" type="button">Back</button>`);
    on("back", hangar);
  }
  function howto() {
    card(`<p class="fam">Tamsin's notes</p><h1>How to fly</h1><ul><li><b>Steer</b> by dragging anywhere (the ship moves as far as your thumb), or with arrows / WASD / a controller.</li><li><b>Only the white dot</b> in the cockpit can be hit. Red with a white centre hurts.</li><li><b>Dash</b>: double-tap (or double-click) a spot and the rocket dashes straight there, up to about a third of the screen, untouchable on the way. Space or controller A dashes the way you're moving. The cyan arc under the rocket fills while it recharges.</li><li><b>Guns fire by themselves.</b> Tap the other gun, Q or E to swap. A "what you fire" core replaces them.</li><li><b>Close calls</b> (a red shot skimming past your dot) recharge your dash a little and fill your nerve: 8 in a row without being hit sets off <b>Overdrive</b>, 4 seconds of faster, harder shots.</li><li><b>Two gates</b> after every level: fly through the one you want. A school's gate offers three upgrades, its own at +2: Ember damage, Gale fire rate, Tide hull, Bronze shields, Loom more bullets or tracking (shots curve toward enemies but can miss); <b>?</b> is an event; thorns mean harder and double pay.</li><li><b>Ten levels</b>, a midterm core at level five, then the Toll-Keeper. Break its arms first; stay out of its lamp.</li><li><b>Series two, the Glass Tide,</b> opens after your first win: pick it in the hangar. Skimmers and prisms, tide that pushes shots sideways, glass walls they bounce off, a duel with the First Student at the halfway pin, then the Mapmaker.</li><li><b>Series three, the Bellwake,</b> opens after you beat the Mapmaker. Chimers glow, then ring out a circle of shots (find its gap); clappers swing on chains and spray along the swing. The bell toll sends slow waves of shots down from the top; a gravity well bends red shots toward it and swallows them. At the halfway mark you meet the Echo, your own rocket mirrored: to hit it, fly under its stream. Then the Last Bell.</li><li><b>Events</b> show what you gain (+) and what it costs (−). A dare pays only if you take few enough hits in the next level. Greyed choices need more hull or parts.</li><li><b>Power-ups show:</b> shots grow and change colour as they hit harder (gold, orange, magenta, white plasma), and a ring under your rocket shows each school you hold.</li><li><b>Wrecks drop things:</b> a green repair kit (fly over it for 1 hull) or a gun in a crate (fly over it to swap it into your hand).</li><li><b>Wrecks drop stamps</b>: fly close and they're pulled in. Levels, wins and flight orders pay more. Spend them at <b>Quill's Shop</b> on upgrades that last, new guns and cores; you keep them, delivered or not.</li></ul><button class="btn main" id="back" type="button">Back</button>`);
    on("back", hangar);
  }
  function settings(back) {
    const c = card(`<h1>Settings</h1><label class="sw">Sound effects <input type="checkbox" id="snd" ${set.snd ? "checked" : ""}></label><label class="sw">Music <input type="checkbox" id="mus" ${set.music ? "checked" : ""}></label><label class="sw">Volume <input type="range" id="vol" min="0" max="1" step="0.05" value="${set.vol}"></label><label class="sw">Low flash (no flashes, shakes or pops) <input type="checkbox" id="low" ${set.low ? "checked" : ""}></label><label class="sw">Comic words (POW!) <input type="checkbox" id="wrd" ${set.words ? "checked" : ""}></label><label class="sw">Steering <input type="range" id="sens" min="0.7" max="1.8" step="0.05" value="${set.sens}"></label><label class="sw">Helping hand: extra hull <input type="range" id="asst" min="0" max="3" step="1" value="${set.assist}"></label><p><small>Helping hand is for anyone who wants the story without the struggle. It never takes anything away.</small></p><button class="btn" id="wipe" type="button">Erase progress…</button><button class="btn main" id="back" type="button">Back</button>`);
    const bind = (id, k, f = (el) => (el.type === "checkbox" ? (el.checked ? 1 : 0) : Number(el.value))) => { $(id).oninput = $(id).onchange = (e) => { set[k] = f(e.target); saveSet(); wake(); }; };
    bind("snd", "snd"); bind("mus", "music"); bind("vol", "vol"); bind("low", "low"); bind("wrd", "words"); bind("sens", "sens"); bind("asst", "assist");
    on("wipe", () => { if (confirm("Erase all stamps, belts and shop upgrades? This can't be undone.")) { prog = fresh(); save(); hangar(); } });
    on("back", back); void c;
  }

  /* ---------- Start-up ---------- */
  window.__game = { coreCard: () => { stop(); coreCard(); }, sound: () => ({ sheet: !!SND.buf, music: !!SND.mus, loops: loopSrc.length, names: SND.map ? Object.keys(SND.map).length : 0 }), sfx, eventCard: (k) => { stop(); eventCard(k); }, pickCard: () => { stop(); pickCard(); }, get s() { return s; }, get prog() { return prog; }, set prog(v) { prog = v; save(); }, start, hangar, finish, get playing() { return playing; }, banner, scene, C, set };
  loadArt().then(() => { for (const k of ["skiff", "mine"]) if (ART[k]) D.shadeCanvas(ART[k].c); draw(); hangar(); if (TEST) document.body.dataset.ready = "1"; });
})();
