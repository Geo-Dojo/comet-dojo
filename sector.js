// The roguelike's rules: steering, guns, cores, schools of parts, gates, three series of bosses and the last one.
// No page code; everything random comes from the seed. What can be found is listed in src/parts.js; see DESIGN.md.
(function (root) {
  "use strict";
  const node = typeof module !== "undefined" && module.exports, A = node ? require("./arcade.js") : root.KitArcade, D = node ? require("./parts.js") : root.CometParts;
  const { ROADS, CORES, FAMILIES, SCHOOLS, PARTS, FUSIONS, PLAIN, GUNS, ENEMIES, META, START, EVENTS, SKIES, RANKS } = D;
  const W = 450, H = 900, N = { speed: 620, dot: 5, hull: 5, safe: 1.6, secs: 75, graze: 16, cap: 420, dash: 1.9, dashT: 0.2, dashV: 1350, dashFar: 310, nick: 0.35, nerve: 8, od: 4, pack: 0.03, packBig: 0.1, coin: 0.1, coinBig: 1, coinStage: 2, coinBoss: 4, magnet: 130, gun: 0.02, gunBig: 0.07 }, ROOMS = 4, ROOM_SECS = 19, MAXLV = 5;
  const FOES = { seal: { r: 19, hp: 9, pts: 50 }, skiff: { r: 24, hp: 5, pts: 100 }, mine: { r: 20, hp: 4, pts: 60 }, darter: { r: 18, hp: 3, pts: 90 }, turret: { r: 28, hp: 14, pts: 180 }, weaver: { r: 22, hp: 12, pts: 260 }, seg: { r: 15, hp: 3, pts: 30 }, shield: { r: 30, hp: 16, pts: 240 }, lancer: { r: 24, hp: 11, pts: 220 }, splitter: { r: 30, hp: 14, pts: 200 }, mini: { r: 13, hp: 2, pts: 40 }, carrier: { r: 36, hp: 26, pts: 320 }, rocket: { r: 10, hp: 1.6, pts: 20 }, phantom: { r: 24, hp: 10, pts: 260 }, boss: { r: 74, hp: 1, pts: 2000 }, arm: { r: 40, hp: 1, pts: 400 }, pin: { r: 18, hp: 9, pts: 80 }, skimmer: { r: 22, hp: 6, pts: 140 }, prism: { r: 26, hp: 12, pts: 220 }, chimer: { r: 22, hp: 8, pts: 160 }, clapper: { r: 24, hp: 13, pts: 240 }, fake: { r: 40, hp: 1, pts: 0 } };
  // How hard each series is: enemy health, shot speed, time between waves, how many more come, boss tempo.
  const SERIES = { 1: { hp: 1, v: 1, gap: 2.35, more: 0, pace: 1 }, 2: { hp: 1.55, v: 1.08, gap: 2.2, more: 1, pace: 1.18 }, 3: { hp: 2.3, v: 1.16, gap: 2.0, more: 1, pace: 1.34 }, 4: { hp: 2.6, v: 1.2, gap: 1.9, more: 2, pace: 1.44 } };
  const BOSSES = { 1: { key: "keeper", label: "The Toll-Keeper", hp: 330, r: 78 }, 2: { key: "maker", label: "The Mapmaker", hp: 620, r: 66 }, 3: { key: "student", label: "The First Student", hp: 1420, r: 40 }, 4: { key: "lastbell", label: "The Last Bell", hp: 2300, r: 92 } };

  const lv = (s, k) => s.p[k] || 0, has = (s, f) => s.fus.includes(f);
  // How long a lost shield takes to grow back (Shields level; Quick Regrow, the Shields road's second side, cuts it).
  const regrowSecs = (s) => (40 - 4 * lv(s, "skin")) * (1 - 0.2 * lv(s, "regrow"));
  function create({ seed = "feel", guns = ["pulse", "lance"], secs = N.secs, foes = true, core = {}, boss = 0, act = 1, hull = N.hull, run = false, parts = {}, fus = [], belt = 0, assist = 0, meta = null, levels = ROOMS, last = 4, roomSecs = ROOM_SECS, keep = null, rig = "courier", carry = null, campaign = false } = {}) {
    const M = meta || { own: {}, train: {} }, own = (k) => !!(M.own || {})[k], tr = (k) => (M.train || {})[k] || 0;
    const s = { rand: A.rng(seed), t: 0, secs, score: 0, hits: 0, kills: 0, grazes: 0, nerve: 0, odT: 0, charge: 0, gunLv: {}, packs: [], coins: [], guns: (guns.filter((k) => GUNS[k]).length ? guns.filter((k) => GUNS[k]) : ["pulse", "splinter"]).slice(0, 2), gun: 0, cool: 0, safe: 0, next: 1, foes, over: null, belt, ship: { x: W / 2, y: H * 0.8, px: W / 2, py: H * 0.8 }, dragX: 0, dragY: 0, shots: [], bad: [], en: [], id: 0, ev: [], used: {}, n: 0,
      core: { trigger: null, shot: null, rule: null, ...core }, p: { ...parts }, fus: [...fus], guard: tr("guard"), rerolls: 2 + tr("pockets"), meta: M, seen: {}, third: !!tr("third"), aim: 1 + 0.05 * tr("aim"), pool: { guns: Object.keys(GUNS).filter((k) => START.guns.includes(k) || own(k)), cores: Object.keys(CORES).filter((k) => START.cores.includes(k) || own(k)), schools: Object.keys(SCHOOLS).filter((k) => START.schools.includes(k) || own(k)) }, dashCd: 0, dashT: 0, dir: [0, -1], second: tr("second"), thrust: tr("thrust"), magnet: N.magnet * (1 + 0.35 * tr("magnet")), medic: 1 + 0.6 * tr("medic"), odPlus: tr("nerves"), oil: 1 + 0.05 * tr("oil"), far: N.dashFar * (1 + 0.2 * tr("reach")), heir: tr("heir"), stamps: 0, ally: false, allyT: 0, wind: 0, still: 0, steady: 0, spd: 0, past: [], stars: [], bells: [], waves: [], bellAt: 2.5, beams: [], arcs: [], blasts: [], walls: [], lanes: [], debt: 0, fever: 1, tailN: 0, tailT: 0, luckN: 0, clean: 0, skinT: 0, smallT: 3, slow: 0, time: 1.4, eyeT: 0, rooms: 0, volleyN: 0, mendN: 0, thunderN: 0, choirT: 2, boss };
    // A starting rig (RIGS in parts.js): a trade made in the hangar. Only in a run; the lab and the Daily fly the courier.
    s.rig = run && D.RIGS[rig] ? rig : "courier"; const RG = { hauler: 2, dart: -2, ghost: -1, tinker: -1 }[s.rig] || 0;
    if (s.rig === "hauler") { s.guard += 1; s.oil *= 0.85; } if (s.rig === "scholar") s.rerolls++; if (s.rig === "tinker") for (const g of s.guns) if (D.MODS[g]) s.gunLv[g] = 1;
    s.hullMax = Math.max(1, RG + N.hull + tr("hull") + Math.min(3, assist) - (belt >= 3 ? 1 : 0) + (s.core.rule === "thorn" ? 2 : 0)); s.hull = Math.min(hull, 99); if (run) s.hull = s.hullMax; else s.hullMax = Math.max(s.hullMax, s.hull);
    // A keepsake: one upgrade carried from the series before (chosen when you win it), at level KEEP_LV.
    if (run && keep && PARTS[keep] && !carry) setLv(s, keep, Math.max(lv(s, keep), KEEP_LV + (s.heir ? 1 : 0)));
    if (s.rig === "dart") { setLv(s, "hot", lv(s, "hot") + 2); setLv(s, "quick", lv(s, "quick") + 1); }
    if (run && tr("favourite")) { const l = Object.keys(PARTS).filter((k) => s.pool.schools.includes(PARTS[k].school) && k !== "glass"); s.p[l[Math.floor(s.rand() * l.length)]] = 1; }
    // Campaign (owner, 24 Nov 2026: "keep your upgrades through level one, two, three"): the whole rocket from the series before.
    if (run && carry) applyCarry(s, carry); s.camp = run && campaign && carry ? powerOf(carry) : 0;
    if (run) { s.foes = false; s.run = { act, room: 0, rooms: levels, last, secs: roomSecs, phase: "gates", pay: null, hard: false, left: 0, gates: null, got: [], offer: null, hurtAt: 0, seenEv: [], event: null, sky: null, skyNext: null, bossCut: 0, duelCut: 0, mid: false, midDone: false, duel: false, dare: null, flags: [] }; offerGates(s); }
    if (boss) { s.foes = false; spawnBoss(s, boss); }
    return s;
  }
  // In the ten-level series each level climbs toward the next series' numbers, so level 10 is far harder than level 1.
  const RAMP = { hp: 1.05, v: 0.14, gap: -0.5, more: 1.4 };
  // Series two in the game starts a little above where Series one starts (you begin with nothing again) and climbs past where it ends.
  const SKYC = { 1: 0.3, 2: 0.38, 3: 0.42 }, GAME2 = { hp: 1.0, v: 1.0, gap: 2.6, more: 0, pace: 1.1 }, RAMP2 = { hp: 1.45, v: 0.17, gap: -0.65, more: 1.5 };
  // Series three, the Bellwake, starts a notch above where Series two starts and climbs further.
  const GAME3 = { hp: 1.15, v: 1.04, gap: 2.5, more: 0, pace: 1.15 }, RAMP3 = { hp: 1.95, v: 0.26, gap: -0.8, more: 2.2 }, GAMES = { 2: [GAME2, RAMP2], 3: [GAME3, RAMP3] };
  // One toughness dial per series of the full game (enemy health, bosses included), set with the career and quick bots.
  const TOUGH = { 1: 1.42, 2: 1.35, 3: 1.15 };
  // The campaign's next series sizes you up: enemies (bosses too) get `k` tougher for each level of power you bring, up to `cap`.
  // `tries`: retries from the checkpoint at the start of Series two or three. Set with `node scripts/balance/campaign.mjs`.
  // s3: Series three in the campaign is that much tougher again (owner, 24 Nov 2026: "make the third round more difficult").
  const CAMP = { k: 0.11, cap: 5, tries: 2, s3: 1.25 };
  const campMul = (s) => (s.camp ? Math.min(CAMP.cap, 1 + CAMP.k * s.camp) * (s.run && s.run.act === 3 ? CAMP.s3 : 1) : 1), toughK = (s) => (s.run && s.run.rooms >= 8 ? (TOUGH[s.run.act] || 1) * campMul(s) : 1);
  const tier = (s) => { const k = toughK(s), T0 = tier0(s); return k === 1 ? T0 : { ...T0, hp: T0.hp * k }; };
  const tier0 = (s) => { const gg = s.run && s.run.rooms >= 8 && GAMES[s.run.act], R = gg ? gg[1] : RAMP, T = gg ? gg[0] : SERIES[s.run ? Math.min(4, s.run.act) : s.boss || 1]; if (!s.run || s.run.rooms < 8 || s.run.phase === "boss") return T; const f = Math.min(1, s.run.room / (s.run.rooms - 1)); return { hp: T.hp * (1 + R.hp * f), v: T.v * (1 + R.v * f), gap: T.gap + R.gap * f, more: T.more + Math.floor(R.more * f), pace: T.pace }; };
  const add = (s, kind, x, y, o = {}) => { const h = FOES[kind].hp * (kind === "boss" || kind === "arm" || kind === "fake" ? 1 : tier(s).hp * (s.belt >= 1 ? 1.2 : 1)); const e = { id: s.id++, kind, x, y, r: FOES[kind].r, hp: h, max: h, t: 0, hurt: 0, fire: 0.7 + s.rand() * 0.9, x0: x, n: 0, burn: 0, ...o }; if ((kind === "boss" || kind === "arm") && toughK(s) !== 1) { e.hp *= toughK(s); e.max *= toughK(s); } s.en.push(e); return e; };
  // Which enemies a stretch can send: everything from earlier series, and this series' newcomers one stretch at a time.
  function roster(s) { const I = s.run && s.run.rooms >= 8 && INTRO[s.run.act]; if (I) return Object.keys(I).filter((k) => I[k] <= s.run.room); const act = s.run ? Math.min(3, s.run.act) : 1, room = s.run ? s.run.room : 3, out = []; for (const [k, v] of Object.entries(ENEMIES)) { if (v.lab === false) continue; const mine = Object.keys(ENEMIES).filter((q) => ENEMIES[q].series === v.series).indexOf(k); if (v.series < act || (v.series === act && mine <= room)) out.push(k); } return out; }
  // Series one in the full game: ten levels, a new kind every level or two (later kinds borrowed from series two).
  const INTRO1 = { skiff: 0, mine: 1, darter: 2, turret: 4, shield: 6, weaver: 8 };
  // Series two, the Glass Tide: everything from the Reef from the start, then its own kinds (skimmers and prisms are new; the rest come from the lab).
  const INTRO2 = { skiff: 0, darter: 0, skimmer: 1, mine: 1, turret: 2, prism: 3, shield: 3, lancer: 4, weaver: 6, splitter: 6, phantom: 7 };
  // Series three, the Bellwake: the Reef and the Tide from the start, then chimers (level 2) and clappers (level 4); carriers late.
  const INTRO3 = { skiff: 0, darter: 0, skimmer: 0, mine: 0, chimer: 1, turret: 1, prism: 2, clapper: 3, shield: 3, lancer: 4, weaver: 5, carrier: 6, splitter: 6, phantom: 7 }, INTRO = { 1: INTRO1, 2: INTRO2, 3: INTRO3 };
  function wave(s) {
    const T = tier(s), x = 70 + s.rand() * (W - 140), hard = s.run ? (s.run.room / Math.max(1, s.run.rooms - 1)) * 0.55 + (s.run.hard ? 0.35 : 0) : Math.min(1, s.t / s.secs), sk = s.run && s.run.phase === "room" ? s.run.sky : null, n = 3 + T.more + Math.floor(hard * 2) + (sk === "fog" || sk === "rush" ? 1 : 0), before = s.en.length, list = roster(s), act = s.run ? Math.min(3, s.run.act) : 1;
    // Newer kinds come more often, so each gets its moment.
    const I = s.run && s.run.rooms >= 8 && INTRO[s.run.act], weight = (k) => (I ? (I[k] >= s.run.room - 1 ? 2.2 : 1) : ENEMIES[k].series === act ? 2.2 : 1), tot = list.reduce((a, k) => a + weight(k), 0); let u = s.rand() * tot, kind = list[0]; for (const k of list) { u -= weight(k); if (u <= 0) { kind = k; break; } }
    if (!s.seen[kind]) { s.seen[kind] = 1; s.ev.push({ meet: kind }); }
    if (kind === "skiff") { if (s.rand() < 0.5) for (let i = 0; i < n; i++) add(s, "skiff", A.clamp(W / 2 + (i - (n - 1) / 2) * Math.min(78, 380 / n), 30, W - 30), -40 - Math.abs(i - (n - 1) / 2) * 50, { amp: 26 }); else for (let i = 0; i < n; i++) add(s, "skiff", x, -40 - i * 66, { amp: 90, ph: i * 0.5 }); }
    else if (kind === "mine") for (let i = 0; i < 2 + T.more + Math.floor(hard * 2); i++) add(s, "mine", 50 + s.rand() * (W - 100), -40 - i * 80);
    else if (kind === "darter") for (let i = 0; i < 2 + T.more; i++) add(s, "darter", 40 + s.rand() * (W - 80), -30 - i * 50, { hover: 90 + s.rand() * 140, wait: 0.55 + i * 0.35 });
    else if (kind === "turret") { add(s, "turret", x, -50); if (hard > 0.3) add(s, "turret", W - x, -120); for (let i = 0; i < 2; i++) add(s, "skiff", 110 + i * 230, -60, { amp: 40 }); }
    else if (kind === "weaver") { const h = add(s, "weaver", x, -40); for (let i = 1; i <= 6; i++) add(s, "seg", x, -40, { head: h.id, i }); }
    else if (kind === "shield") { for (let i = 0; i < 1 + (hard > 0.3 ? 1 : 0); i++) add(s, "shield", 90 + i * 270, -50 - i * 40); add(s, "darter", 225, -40, { hover: 120 }); }
    else if (kind === "lancer") for (let i = 0; i < 2; i++) add(s, "lancer", A.clamp(x + (i ? 130 : -130), 40, W - 40), -50 - i * 60, { rest: 90 + i * 60 });
    else if (kind === "splitter") for (let i = 0; i < 2; i++) add(s, "splitter", 110 + i * 230, -50 - i * 70);
    else if (kind === "carrier") { add(s, "carrier", x, -60); add(s, "skiff", W - x, -40, { amp: 40 }); }
    else if (kind === "skimmer") { const two = 2 + (hard > 0.3 ? 1 : 0); for (let i = 0; i < two; i++) { const l = (i + (s.rand() < 0.5 ? 0 : 1)) % 2 === 0; add(s, "skimmer", l ? -30 - i * 90 : W + 30 + i * 90, 130 + i * 95 + s.rand() * 40, { dir: l ? 1 : -1 }); } }
    else if (kind === "prism") { add(s, "prism", x, -40, { rest: 150 + s.rand() * 90 }); if (hard > 0.35) add(s, "prism", W - x, -90, { rest: 230 + s.rand() * 60 }); add(s, "darter", 225, -40, { hover: 110 }); }
    else if (kind === "chimer") { const n2 = 2 + (hard > 0.35 ? 1 : 0); for (let i = 0; i < n2; i++) add(s, "chimer", 70 + ((i + 0.5) / n2) * (W - 140) + (s.rand() - 0.5) * 40, -40 - i * 50, { rest: 110 + s.rand() * 170, fire: 1.4 + i * 0.7 }); }
    else if (kind === "clapper") { add(s, "clapper", x, -30, { len: 170 + s.rand() * 60, ph: s.rand() * 6.28 }); if (hard > 0.4) add(s, "clapper", W - x, -30, { len: 150 + s.rand() * 60, ph: s.rand() * 6.28 }); add(s, "skiff", 225, -40, { amp: 60 }); }
    else for (let i = 0; i < 2; i++) add(s, "phantom", 90 + i * 270, -40, { rest: 120 + i * 90, cycle: 1.6 + i * 0.6 });
    if (sk === "bounty" && !s.run.bountyDone && !s.en.some((e) => e.bounty)) { const e = s.en.slice(before).find((q) => q.kind !== "seg"); if (e) { e.bounty = true; e.hp *= 3; e.max *= 3; } }
    s.next = ((s.run ? T.gap : 2.5) - hard * 0.7) * (sk === "rush" ? 0.7 : 1);
  }
  function orb(s, x, y, a, v, o) { v *= tier(s).v * (1 - 0.08 * lv(s, "current")) * (s.run && s.run.phase === "room" && s.run.sky === "fog" ? 0.78 : 1); if (s.bad.length < N.cap) s.bad.push({ id: s.id++, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 8, ...o }); }
  const bodies = (s) => (s.core.rule === "twin" ? [[s.ship.x, s.ship.y, 1], [W - s.ship.x, s.ship.y, -1]] : [[s.ship.x, s.ship.y, 1]]);
  const dot = (s) => N.dot * (1 - 0.14 * lv(s, "slip"));
  const ring = (s, x, y, max, dmg, o = {}) => s.bells.push({ x, y, r: 10, max, dmg: dmg * (has(s, "cannon") ? 3 : 1), burn: has(s, "cannon"), seen: new Set(), ...o });
  function clearNear(s, x, y, r) { for (const b of s.bad) if (Math.hypot(b.x - x, b.y - y) < r) b.gone = true; }
  function hit(s) {
    if (s.safe > 0 || s.over) return;
    const p = s.ship;
    if (s.guard > 0) { s.guard--; s.safe = 1; s.ev.push("guard"); if (lv(s, "shock")) ring(s, p.x, p.y, 190, 20 * lv(s, "shock") * fx(s)); return; }
    s.hull--; s.hits++; s.safe = N.safe; s.fever = 0.6; s.clean = 0; s.tailN = 0; s.nerve = 0; if (s.run) s.run.hurtAt++; s.ev.push("hit");
    if (lv(s, "backwash")) { clearNear(s, p.x, p.y, 120 + 45 * lv(s, "backwash")); s.ev.push({ wash: 120 + 45 * lv(s, "backwash") }); } if (lv(s, "shock")) ring(s, p.x, p.y, 190, 20 * lv(s, "shock") * fx(s)); if (s.core.rule === "thorn") { clearNear(s, p.x, p.y, 240); ring(s, p.x, p.y, 250, 70); } if (has(s, "steam")) for (const e of s.en) e.burn = Math.max(e.burn, 4);
    if (s.hull <= 0 && s.second > 0) { s.second--; s.hull = 2; s.safe = 2.2; s.bad.length = 0; s.ev.push("second"); return; }
    if (s.hull <= 0) { s.over = "lost"; s.ev.push("lost"); }
  }
  // Starfall (reworked 24 Nov 2026; the owner: "star power is too strong"). It used to keep up to 8 stars that each swallowed
  // every red shot, and a boss gave one every 30 damage (stars hurt it too, so they fed themselves): a near-permanent shield.
  // Now a star holds `eat` shots, then flares out; only `max` at once; a boss gives one every `boss` seconds while you hit it.
  // Fly through a star (after `ripe` s) to catch it: it bursts in a gold ring that clears shots and hits everything near.
  const STAR = { max: 4, eat: 3, life: 3.2, r: 34, burn: 8, boss: 2.4, ripe: 0.35, ring: 150, hit: 30 };
  const star = (s, x, y) => { s.stars.push({ x, y, left: STAR.life, r: STAR.r, eat: STAR.eat, age: 0 }); while (s.stars.length > STAR.max) s.stars.shift(); };
  // Stamps drop from wrecks in the full game: fly near and they're pulled in. Ones left when a level ends fly to you.
  // The shield-bearer's shield: health as a share of its body's, how much of a hit it soaks, how long before it regrows, how fast.
  const SHIELD = { hp: 2.0, take: 1, wait: 2.5, grow: 0.15 };
  const BIGK = ["turret", "shield", "weaver", "carrier", "lancer", "splitter", "prism", "clapper", "arm"];
  function drop(s, x, y, n) { if (!s.run || s.run.rooms < 8) return; for (let i = 0; i < n && s.coins.length < 40; i++) s.coins.push({ x: x + (s.rand() - 0.5) * 20, y, vx: (s.rand() - 0.5) * 220, vy: -40 - s.rand() * 120, left: 8 }); }
  function vacuum(s) { const n = s.coins.length; if (!n) return; s.stamps += n; s.coinN = (s.coinN || 0) + n; s.coins.length = 0; s.ev.push({ coins: n }); }
  function kill(s, e) {
    e.gone = true; s.score += FOES[e.kind].pts; s.ev.push({ kill: e.kind, x: e.x, y: e.y }); if (e.kind === "fake" || e.kind === "pin" || e.kind === "seal" || e.kind === "rocket") return;
    if (e.kind === "boss") drop(s, e.x, e.y, N.coinBoss); else if (BIGK.includes(e.kind)) drop(s, e.x, e.y, N.coinBig); else if (e.kind !== "seg" && e.kind !== "mini" && s.rand() < N.coin) drop(s, e.x, e.y, 1);
    s.kills++; if (s.core.rule === "star") star(s, e.x, e.y); if (has(s, "mend") && ++s.mendN >= 40) { s.mendN = 0; s.hull = Math.min(s.hullMax, s.hull + 1); s.ev.push("mend"); }
    if (lv(s, "powder") && e.kind !== "boss") blast(s, e.x, e.y, 70 + 14 * lv(s, "powder"), 5 * lv(s, "powder") * fx(s), e);
    if (s.run && s.run.phase === "room" && !["boss", "arm", "seg", "mini"].includes(e.kind) && s.packs.filter((k) => !k.gun).length < 2 && s.rand() < (["turret", "shield", "weaver", "carrier", "lancer", "splitter", "prism", "clapper"].includes(e.kind) ? N.packBig : N.pack) * (s.medic || 1)) s.packs.push({ x: e.x, y: e.y, left: 9 });
    const big = ["turret", "shield", "weaver", "carrier", "lancer", "splitter", "prism", "clapper"].includes(e.kind), spare = gunPool(s);
    if (s.run && s.run.phase === "room" && !s.core.shot && spare.length && !s.packs.some((k) => k.gun) && e.kind !== "boss" && s.rand() < (big ? N.gunBig : N.gun)) s.packs.push({ x: e.x, y: e.y, left: 10, gun: pickGun(s) });
    if (e.bounty && s.run) { s.run.bountyDone = true; const k = randomPart(s, 1); s.ev.push({ bounty: k || "none", x: e.x, y: e.y }); }
    if (e.kind === "mine") for (let i = 0; i < 6; i++) orb(s, e.x, e.y, i * 1.047 + e.t, 120);
    if (e.kind === "splitter") for (let i = -1; i <= 1; i++) add(s, "mini", e.x + i * 22, e.y, {});
    if (e.kind === "weaver") for (const o of s.en) if (o.head === e.id) o.gone = true;
    if (e.kind === "arm") { s.bad.length = 0; }
    if (e.kind === "boss") { s.bad.length = 0; s.waves.length = 0; s.walls.length = 0; s.lanes.length = 0; s.en.forEach((o) => { o.gone = true; }); s.ev.push("beat"); if (e.duel && s.run) { const r = s.run; r.duel = false; s.ev.push("duelwon"); if (!coresLeft(s)) { s.hull = Math.min(s.hullMax, s.hull + 2); s.ev.push("nocore"); offerGates(s); return; } r.mid = true; r.cores = null; r.phase = "core"; return; } if (s.run && s.run.act < s.run.last) { s.run.phase = "core"; return; } s.over = s.run ? "won" : "beat"; vacuum(s); if (s.run) s.ev.push("won"); }
  }
  function blast(s, x, y, r, d, not) { s.blasts.push({ x, y, r, left: 0.3 }); for (const e of s.en) if (!e.gone && e !== not && Math.hypot(e.x - x, e.y - y) < r + e.r) wound(s, e, d, "blast"); }
  // Damage, with everything that depends on who's being hit.
  function wound(s, e, d, how = "shot", ang = null) {
    if (e.gone || e.y < -60) return;
    if (e.key === "maker" && e.shell && e.hp > e.max * 0.02) { const i = plateAt(e, ang ?? Math.atan2(s.ship.y - e.y, s.ship.x - e.x)); if (e.shell[i] > 0) { e.shell[i] -= d; e.plateHit = i; e.hurt = 0.03; if (e.shell[i] <= 0) s.ev.push({ plate: 1, x: e.x + Math.cos(e.rot + i * MAP.step) * MAP.rad, y: e.y + Math.sin(e.rot + i * MAP.step) * MAP.rad }); else if (s.rand() < 0.15) s.ev.push("clink"); return; } }
    if (e.kind === "boss") { if (e.guard > 0) { e.hurt = 0.03; s.ev.push("clink"); return; } if (e.stun > 0) d *= GUARD.open; if (e.arm > 0) d *= 0.3; if (e.key === "lastbell") d *= e.open > 0 ? TOLL.soft : TOLL.hard; if (e.key === "keeper") { const n = s.en.filter((o) => o.kind === "arm" && !o.gone).length; d *= KEEPER.plate[n] ?? 1; } if (e.parry > 0 && how !== "burn") { e.store = Math.min(16, (e.store || 0) + d * 0.5); e.hurt = 0.05; return; } }
    // A shield-bearer's blue line is a shield with its own health: shots from in front wear it down (the line shrinks), and
    // only once it's gone do they reach the body. Left alone for a moment it grows back (owner, 24 Nov 2026: "almost impossible").
    if (how === "front") { if (e.sh == null) e.sh = e.shMax = e.max * SHIELD.hp; e.shT = SHIELD.wait; if (e.sh > 0) { e.sh = Math.max(0, e.sh - d * SHIELD.take); e.hurt = 0.03; s.ev.push(e.sh > 0 ? "clink" : { shieldoff: 1, x: e.x, y: e.y }); return; } how = "shot"; }
    if ((e.kind === "phantom" && e.fade > 0) || (e.kind === "seal" && e.set > 0)) return;
    if (e.kind === "fake") { e.n += d; if (e.n > (e.echo != null ? ECHO.back : 7)) { e.n = 0; orb(s, e.x, e.y + 30, Math.atan2(s.ship.y - e.y, s.ship.x - e.x), e.echo != null ? 215 : 240); } e.hurt = 0.06; return; }
    if (e.hp < e.max * 0.4) d *= 1 + 0.5 * lv(s, "finish"); if (e.hp > e.max * 0.9 && lv(s, "open")) { d *= 1 + 0.8 * lv(s, "open"); if (!e.opened) { e.opened = 1; s.ev.push({ open: 1, x: e.x, y: e.y }); } }
    if (e.duel && (e.key === "student" || e.key === "echo") && e.stage < 2) { const fl = e.max * (e.stage ? 0.33 : 0.66); if (e.hp >= fl - 1e-6) d = Math.max(0, Math.min(d, e.hp - fl)); }
    e.hp -= d; e.hurt = 0.08; s.ev.push("tick");
    if (how === "shot") { if (lv(s, "cinder")) e.burn = Math.max(e.burn, 2); if (lv(s, "reson") && ++e.n % 12 === 0) { e.hp -= 7 * lv(s, "reson"); s.ev.push({ reson: 1, x: e.x, y: e.y }); } if (lv(s, "rico")) { const o = s.en.find((q) => q !== e && !q.gone && q.y > 0 && Math.hypot(q.x - e.x, q.y - e.y) < 170); if (o) { s.arcs.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, left: 0.12 }); wound(s, o, d * 0.28 * lv(s, "rico"), "rico"); } } }
    if (s.core.rule === "star" && e.kind === "boss" && how !== "star" && how !== "ring") { s.debt = 1; s.starBoss = e; }
    if (e.hp <= 0 && !e.gone) kill(s, e);
  }
  const schoolsHeld = (s) => new Set(Object.keys(s.p).map((k) => PARTS[k].school));
  const power = (s) => s.aim * (s.core.rule === "bell" || s.core.rule === "star" ? 0.96 : s.core.rule === "thorn" ? 0.9 : 1) * (1 + 0.1 * lv(s, "hot") + 0.3 * lv(s, "glass") + 0.28 * lv(s, "heavy") + 0.04 * lv(s, "toll") * s.rooms + 0.05 * lv(s, "pattern") * schoolsHeld(s).size) * (s.hull <= 2 ? 1 + 0.25 * lv(s, "under") : 1) * (1 + 0.2 * lv(s, "rush") * Math.min(1, s.spd / 380)) * (s.odT > 0 ? 1.25 : 1);
  const rate = (s) => (s.oil || 1) * (s.odT > 0 ? 1.5 : 1) * (1 + 0.1 * lv(s, "quick")) * (1 - 0.08 * lv(s, "heavy")) * (1 + 0.035 * lv(s, "tail") * s.tailN) * (s.core.trigger === "fever" ? s.fever : 1) * (s.core.trigger === "vanguard" ? 0.62 + 1.5 * A.clamp((H - 60 - s.ship.y) / (H - 240), 0, 1) : 1);
  // Fixed-damage effects (burning, Powder Kegs, Shock Plate) grow with your damage and with the series, so a fork taken in
  // Series three keeps pace with its tougher enemies (bots: forks fell behind plain levels there).
  const fx = (s) => power(s) * (s.run && s.run.rooms >= 8 ? [1, 1.45, 2][Math.min(3, s.run.act) - 1] : 1);
  const reach = (s) => Math.min(1.75, 1 + 0.18 * lv(s, "bore"));
  function muzzles(s) { const p = s.ship, m = [[p.x, p.y, 1]]; if (s.core.trigger === "echo" && s.past.length > 60) m.push([s.past[0][0], s.past[0][1], s.core.shot === "swarm" || s.core.shot === "chain" ? 0.55 : s.core.shot === "beam" ? 0.7 : 1]); if (s.core.rule === "twin") for (const [x, y, q] of m.slice()) m.push([W - x, y, q * 0.75]); return m; }
  const seeker = (s, x, y, dmg, i = 0) => s.shots.push({ x, y, vx: (i % 2 ? 1 : -1) * (150 + 60 * (i % 5)), vy: -260, r: 6 * reach(s), dmg: dmg * (has(s, "firefly") ? 2 : 1), burn: has(s, "firefly"), life: 2.4, seek: true, gun: "swarm" });
  // A gun's upgrades so far (Mk II, Mk III), added together.
  function mods(s, gk) { const m = { shots: [], dmg: 1, rate: 1, pierce: 0, flak: 0, pop: 0, size: 1, bounce: 0, orbit: 0, cut: 1, wide: 1, arc: 0, nova: 0 }; for (const o of (D.MODS[gk] || []).slice(0, (s.gunLv || {})[gk] || 0)) for (const k in o) if (k === "shots") m.shots.push(...o.shots); else if (k === "dmg" || k === "rate" || k === "size" || k === "cut" || k === "wide") m[k] *= o[k]; else if (k !== "what") m[k] += o[k]; return m; }
  const SHOTK = { boomer: 1.6, mortar: 1.45 };
  // Mortar core (audit, 24 Nov 2026: bots won 97% with it, the next "star power"). Shells used to find the nearest enemy anywhere
  // in the sky and burst on the first thing near them. Now they reach `reach` px and only arm after `arm` px of flight: enemies
  // right on top of you are yours to dodge, and you fly forward to reach the far ones.
  const MORTAR = { reach: 650, arm: 150, speed: 600, boom: 1.35 };
  function nearOut(s, x, y, lo, hi) { let t = null, best = hi; for (const e of s.en) if (!e.gone && e.y > -20 && e.kind !== "fake") { const d = Math.hypot(e.x - x, e.y - y) - e.r; if (d >= lo && d < best) { best = d; t = e; } } return t; }
  // More bullets with a "what you fire" core: one more seeker, disc, shell or bolt a level, each at 45% (owner: once a core
  // changes how you fire, the guns stop mattering, so the upgrades must still count).
  const extra = (s, sc, l) => { const n = sc && sc !== "boomer" ? lv(s, "split") : 0; if (!n) return l; const o = l.slice(); for (let j = 1; j <= n; j++) o.push([0, (j % 2 ? 1 : -1) * 0.14 * Math.ceil(j / 2), 0.45]); return o; };
  // Beam core: as strong as a steady Pulse Gun that never misses, weaker on the move (balance pass, 24 Nov 2026).
  const BEAM = { dps: 1.02, split: 0.25, low: 0.6, steady: 0.45 };
  const gunDps = (g) => (g.dmg * g.shots.length * (g.flak ? 1 + g.flak * 0.55 : 1)) / g.every;
  // One pull of the trigger: the gun in hand decides how many shots and where; a "what you fire" core decides what each becomes.
  function emit(s, n = 1, wide = 0) {
    const sc = s.core.shot, gk = sc ? "pulse" : s.guns[s.gun], g = GUNS[gk], M = sc ? mods(s, "") : mods(s, gk), k = power(s) * M.dmg, rc = reach(s); s.volleyN++;
    // Orbit Blades: keep the blades topped up (they live while the gun is in hand); Charge Cannon: one blast as strong as the charge.
    if (g.orbit) { const n = g.orbit + M.orbit + lv(s, "split"), have = s.shots.filter((b) => b.orbit).length; for (let i = have; i < n; i++) s.shots.push({ x: s.ship.x, y: s.ship.y, vx: 0, vy: 0, r: g.r * rc, dmg: 0, life: 99, orbit: 1, ang: (i * 6.283) / n, hit: {}, cut: 0, gun: gk }); for (const b of s.shots) if (b.orbit) { b.dmg = g.dmg * k; b.r = g.r * rc; b.ring = 86 + 12 * M.orbit; b.cutEvery = 0.18 / M.cut; } s.ev.push("shot"); return; }
    // Drone Wing: each drone fires a dart at the nearest enemy in reach (straight up if none); More bullets adds drones.
    if (g.wing) { for (const [mx, my, q] of muzzles(s)) for (const [dx, dy] of wingSpots(s)) { const x = mx + dx, y = my + dy, t = near(s, x, y, g.wing * rc); for (let i = 0; i < n; i++) { const a = (t ? Math.atan2(t.y - y, t.x - x) : -1.5708) + (i - (n - 1) / 2) * 0.12; s.shots.push({ x, y: y - 8, vx: Math.cos(a) * g.v, vy: Math.sin(a) * g.v, r: g.r * rc * M.size, sz: M.size, dmg: g.dmg * k * q, life: g.life, gun: gk, pierce: lv(s, "pierce"), seen: lv(s, "pierce") ? new Set() : null }); } } s.ev.push("shot"); return; }
    const ch = g.charge ? Math.max(0.3, s.charge) : 0; if (g.charge) s.charge = 0;
    if (lv(s, "spare") && s.volleyN % 5 === 0) for (let i = 0; i < lv(s, "spare"); i++) seeker(s, s.ship.x, s.ship.y, 2.4 * k, i);
    let mi = 0;
    for (const [x, y, q] of muzzles(s)) {
      // One beam per muzzle, kept alight by each pull (Fire rate makes it hotter once, never by stacking beams).
      if (sc === "beam") { const m0 = s.beams.find((m) => m.mi === mi), left = 0.06 + (n > 1 ? n * 0.085 : 0), dps = gunDps(g) * BEAM.dps * k * (1 + BEAM.split * lv(s, "split")); mi++; if (m0) { m0.x = x; m0.q = q; m0.dps = dps; m0.left = Math.max(m0.left, left); } else s.beams.push({ mi: mi - 1, x, q, dps, w0: g.r, left }); continue; }
      let air = sc === "boomer" ? (s.core.rule === "twin" ? 10 : 8) + (s.core.trigger ? 3 : 0) + Math.round(3 / Math.max(1, g.shots.length)) - s.shots.filter((b) => b.back != null).length : 99;
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? (i - (n - 1) / 2) * ((wide || 0.12) / n) : 0;
        for (const [ox, a0, f0] of extra(s, sc, M.shots.length ? g.shots.concat(M.shots) : g.shots)) {
          const a = a0 + off + (g.wobble ? (s.rand() - 0.5) * 2 * g.wobble : 0), dmg = g.dmg * k * q * (f0 || 1), bx = x + ox, by = y - 34, fk = g.flak ? 1.8 : 1;
          if (g.charge) { s.shots.push({ x: bx, y: by, vx: 0, vy: -g.v, r: (g.r + 16 * ch) * rc * M.size, sz: M.size, dmg: dmg * ch, life: g.life, pierce: g.pierce + lv(s, "pierce"), seen: new Set(), big: ch, gun: gk }); for (let j = 1; j <= lv(s, "split"); j++) { const aa = (j % 2 ? 1 : -1) * 0.1 * Math.ceil(j / 2); s.shots.push({ x: bx, y: by, vx: Math.sin(aa) * g.v, vy: -Math.cos(aa) * g.v, r: (g.r + 10 * ch) * rc * M.size, sz: M.size * 0.7, dmg: dmg * ch * 0.45, life: g.life, pierce: g.pierce, seen: new Set(), big: ch * 0.6, gun: gk }); } continue; }
          if (g.mine) { for (let j = 1; j <= lv(s, "split"); j++) s.shots.push({ x: bx + (s.rand() - 0.5) * 90, y: by + 10, vx: (s.rand() - 0.5) * 110, vy: -g.v * 0.9, r: g.r * rc * 0.8, dmg: 0, boom: dmg * 0.45, prox: 30, wide: M.wide * 0.8, life: g.life, gun: gk }); s.shots.push({ x: bx + (s.rand() - 0.5) * 50, y: by + 10, vx: (s.rand() - 0.5) * 60, vy: -g.v, r: g.r * rc, dmg: 0, boom: dmg, prox: 34, wide: M.wide, life: g.life, gun: gk }); continue; }
          // Arc Coil: lightning to the nearest enemy in reach, then jumping on to the next nearest; a spark up the screen if none.
          if (g.arc && !sc) { const jumps = g.arc + M.arc, R = g.reachArc * rc * (M.arc ? 1.2 : 1); for (let bolt = 0; bolt <= lv(s, "split"); bolt++) { let from = [bx, by], d = dmg * (bolt ? 0.45 : 1); const seen = new Set(); let tg = near(s, bx, by, R); if (!tg) { if (bolt) break; s.shots.push({ x: bx, y: by, vx: 0, vy: -g.v, r: g.r * rc, dmg: dmg * 0.6, life: g.life, gun: gk }); continue; } for (let j = 0; j < jumps && tg; j++) { s.arcs.push({ x1: from[0], y1: from[1], x2: tg.x, y2: tg.y, left: 0.16, c: "#b48cff" }); seen.add(tg.id); from = [tg.x, tg.y]; wound(s, tg, d, j ? "chain" : "shot"); d *= 0.8; tg = s.en.filter((e) => !e.gone && e.y > -20 && !seen.has(e.id) && e.kind !== "fake").sort((a1, b1) => Math.hypot(a1.x - from[0], a1.y - from[1]) - Math.hypot(b1.x - from[0], b1.y - from[1])).find((e) => Math.hypot(e.x - from[0], e.y - from[1]) < 200) || null; } } continue; }
          if (sc === "swarm") { seeker(s, bx, by, dmg * 0.85 * fk, s.volleyN + i); continue; }
          if (sc === "boomer") { if (air-- <= 0) continue; s.shots.push({ x: bx, y: by, vx: Math.sin(a) * 300 + (i - (n - 1) / 2) * 60 * (wide || 0.6), vy: -1280, r: Math.max(13, g.r * 2) * rc, dmg: dmg * 1.9 * fk * (1 + 0.3 * lv(s, "split")), life: 4, back: 0, seen: new Map(), gun: "boomer" }); continue; }
          if (sc === "mortar") { const t = nearOut(s, bx, by, MORTAR.arm, MORTAR.reach), aa = t ? Math.atan2(t.y - by, t.x - bx) + a * 0.5 : -1.57 + a, d = t ? Math.max(60, Math.hypot(t.x - bx, t.y - by) - t.r * 0.4) : 430; s.shots.push({ x: bx, y: by, vx: Math.cos(aa) * MORTAR.speed, vy: Math.sin(aa) * MORTAR.speed, r: 10 * rc, dmg: 0, boom: dmg * MORTAR.boom * fk, life: d / MORTAR.speed, arm: MORTAR.arm / MORTAR.speed, gun: "mortar" }); continue; }
          if (sc === "chain") { let from = [bx, by], d = dmg * 0.95 * fk; const seen = new Set(); let t = near(s, bx, by, 430 * rc); for (let j = 0; j < 4 && t; j++) { s.arcs.push({ x1: from[0], y1: from[1], x2: t.x, y2: t.y, left: 0.1 }); seen.add(t.id); from = [t.x, t.y]; wound(s, t, d, j ? "chain" : "shot"); d *= 0.68; t = s.en.filter((e) => !e.gone && e.y > -20 && !seen.has(e.id) && e.kind !== "fake").sort((a1, b1) => Math.hypot(a1.x - from[0], a1.y - from[1]) - Math.hypot(b1.x - from[0], b1.y - from[1])).find((e) => Math.hypot(e.x - from[0], e.y - from[1]) < 190) || null; } continue; }
          if (ox === g.shots[0][0] && a0 === g.shots[0][1] && i === 0 && lv(s, "split") && !sc && !g.orbit) for (let j = 1; j <= lv(s, "split"); j++) { const aa = a + (j % 2 ? 1 : -1) * 0.09 * Math.ceil(j / 2) + (g.shots.length > 2 ? (j % 2 ? 1 : -1) * 0.25 : 0); s.shots.push({ x: bx, y: by, vx: Math.sin(aa) * g.v, vy: -Math.cos(aa) * g.v, r: g.r * rc * M.size, sz: M.size, dmg: dmg * 0.45, life: g.life, pierce: (g.pierce || 0) + M.pierce, seen: g.pierce || M.pierce ? new Set() : null, gun: gk, bounce: g.bounce ? g.bounce + M.bounce : 0 }); }
          s.shots.push({ x: bx, y: by, vx: Math.sin(a) * g.v, vy: -Math.cos(a) * g.v, r: g.r * rc * M.size, sz: M.size, dmg, life: g.life, pierce: (g.pierce || 0) + lv(s, "pierce") + M.pierce, seen: g.pierce || lv(s, "pierce") || M.pierce ? new Set() : null, gun: gk, flak: g.flak ? g.flak + M.flak : 0, pop: M.pop, home: g.home, saw: g.saw, bounce: g.bounce ? g.bounce + M.bounce : 0, wave: g.wave ? g.wave * (M.shots.length ? 1.25 : 1) * (ox < 0 ? -1 : ox > 0 ? 1 : 0) : 0, wt: 0, nova: g.nova ? g.nova + M.nova : 0, lode: g.lode ? g.lode * M.wide * rc : 0 });
        }
      }
    }
    s.ev.push("shot");
  }
  // Homing shots (seekers, Hail) lean toward a target: they turn at most `turn` radians a second and give up on anything
  // more than 80 degrees off their nose, so they curve and can miss instead of snapping onto it (owner: "too powerful").
  function steer(b, t, v, turn, dt, cone = 1.4) { const a0 = Math.atan2(b.vy, b.vx), d = Math.atan2(Math.sin(Math.atan2(t.y - b.y, t.x - b.x) - a0), Math.cos(Math.atan2(t.y - b.y, t.x - b.x) - a0)); if (Math.abs(d) > cone) return; const a = a0 + A.clamp(d, -turn * dt, turn * dt), sp = Math.hypot(b.vx, b.vy); const nv = sp + (v - sp) * Math.min(1, dt * 3); b.vx = Math.cos(a) * nv; b.vy = Math.sin(a) * nv; }
  function near(s, x, y, r) { let t = null, best = r; for (const e of s.en) if (!e.gone && e.y > -20 && e.kind !== "fake") { const d = Math.hypot(e.x - x, e.y - y) - e.r; if (d < best) { best = d; t = e; } } return t; }
  const inHand = (s) => (s.core.shot ? "pulse" : s.guns[s.gun]);
  const WING = [[-46, 10], [46, 10], [0, 46], [-84, 34], [84, 34]], wingSpots = (s) => (inHand(s) === "wing" ? WING.slice(0, Math.min(5, 2 + ((s.gunLv || {}).wing ? 1 : 0) + lv(s, "split"))) : []);
  const burst = (s) => { const g = GUNS[inHand(s)]; emit(s, s.core.shot === "beam" ? 4 : Math.max(1, Math.min(5, Math.round(0.5 / g.every))), s.core.shot === "boomer" ? 1.2 : 0.7); };
  function shoot(s, dt) {
    const t = s.core.trigger, g = GUNS[inHand(s)], every = s.core.shot === "beam" ? 0.05 : g.every * (SHOTK[s.core.shot] || 1); s.used[s.guns[s.gun]] = (s.used[s.guns[s.gun]] || 0) + dt;
    if (t === "sling") { s.wind = Math.min(1, s.wind + ((s.spd * dt) / 330 + dt * 0.2) * rate(s)); if (s.wind >= 0.3 && s.still > 0.05) { const w = s.wind; s.wind = 0; emit(s, Math.max(1, Math.round((s.core.shot === "beam" ? 21 : 1.15 / every) * w)), 0.75); s.ev.push("volley"); } return; }
    if (g.charge && !s.core.shot) { s.cool -= 0; s.charge = Math.min(1, s.charge + ((s.still > 0.05 ? 1 : 0.35) * dt * rate(s) * mods(s, "charge").rate) / g.every); if ((s.still <= 0 && s.charge >= 0.3 && s.still0 > 0.05) || s.charge >= 1) { emit(s); s.ev.push("volley"); } s.still0 = s.still; return; }
    if (s.cool <= 0) { s.cool = (every / (s.core.shot ? 1 : mods(s, s.guns[s.gun]).rate) * (t === "echo" ? (s.core.shot === "beam" ? 1 : 1.33) : t === "dare" ? (s.core.shot === "beam" ? 1.6 : 1.22) : 1)) / rate(s); emit(s); }
  }
  /* ---------- Bosses: each fights by its own rules ---------- */
  // The boss that ends a ten-level series is tougher and quicker than the four-stretch lab version.
  const BIG1 = { hp: 2.0, pace: 1.7, arm: 1.7 }, BIG2 = { hp: 1.45, pace: 1.3, arm: 1 };
  // Series three ends with the Last Bell (BOSSES[4]), the toughest of the three finales.
  const BIG3 = { hp: 0.52, pace: 0.85, arm: 1 }, BIG = { 1: BIG1, 2: BIG2, 4: BIG3 };
  // The midterm duel of Series two: the First Student, lighter than the lab's final version, before the core is chosen.
  const DUEL = { hp: 300, pace: 0.82 };
  // Vesper's glass guard (balance pass, 24 Nov 2026; the owner found the duel too easy). At two thirds and one third health she
  // stops, throws a glass guard over herself (no damage gets through) and sets glass seals around the sky. Break every seal before
  // the guard closes and she's stunned and open (more damage); miss and each seal left cracks into red shots aimed at you.
  // Damage can't carry her past a third in one go, so even the strongest build has to break the seals twice.
  const GUARD = { secs: [0, 6.5, 6], seals: [0, 3, 4], hp: 9, set: 0.9, stun: 1.8, open: 1.3, fan: 5 };
  // Series three's midterm: the Echo, your own rocket rung back by the Bell. It mirrors you across the middle and fires straight down.
  // Boss rework (owner, 24 Nov 2026: "the middle boss is way too weak, make her different"): at each stage line she splits into
  // pale copies across the top and keeps shuffling places with them. Only the real one (solid, with ripple rings) can be hurt;
  // copies throw your shots back as red shots. Like Vesper, damage can't carry her past a stage line in one go.
  const ECHO = { hp: 500, pace: 0.85, r: 40, copies: [0, 2, 3], swap: [0, 5.2, 4.4], shuffle: 0.8, back: 11 };
  function spawnDuel(s) { if (s.run.act === 3) { const h = ECHO.hp * (1 - Math.min(0.4, s.run.duelCut || 0)); add(s, "boss", W / 2, -110, { hp: h, max: h, pace: ECHO.pace, r: ECHO.r, key: "echo", tier: 3, label: "The Echo", duel: true, stage: 0, cd: {}, arm: 0, gap: W / 2, light: 1.57 }); return; } const h = DUEL.hp * (1 - Math.min(0.4, s.run.duelCut || 0)); add(s, "boss", W / 2, -110, { hp: h, max: h, pace: DUEL.pace, r: BOSSES[3].r, key: "student", tier: 2, label: BOSSES[3].label, duel: true, stage: 0, cd: {}, arm: 0, gap: W / 2, light: 1.57 }); }
  function echoSplit(s, e, stage) {
    for (const o of s.en) if (o.kind === "fake" && o.echo === e.id) o.gone = true;
    const n = ECHO.copies[stage] + 1; if (n < 2) { e.slots = null; return; }
    e.slots = Array.from({ length: n }, (_, i) => 60 + ((i + 0.5) / n) * (W - 120)); e.slot = Math.floor(s.rand() * n); e.swapT = ECHO.swap[stage]; e.shuf = 0; s.ev.push({ esplit: n, x: e.x, y: e.y });
    for (let k = 0, m = 0; k < n; k++) if (k !== e.slot) add(s, "fake", e.x, e.y, { hp: 1e9, max: 1e9, echo: e.id, slot: k, ph: m++ });
  }
  function guardUp(s, e, stage) {
    const n = GUARD.seals[stage]; e.guard = e.guardMax = GUARD.secs[stage] + 1.4; e.parry = 0; e.stun = 0; s.ev.push({ guard: 1, x: e.x, y: e.y });
    for (let i = 0; i < n; i++) { const x = 50 + ((i + 0.5) / n) * (W - 100) + (s.rand() - 0.5) * 24, y = 300 + s.rand() * 190; add(s, "seal", e.x, e.y, { hp: GUARD.hp, max: GUARD.hp, owner: e.id, x0: x, y0: y, sx: e.x, sy: e.y, set: GUARD.set, ph: s.rand() * 6.283, fire: 99 }); }
  }
  function guardStep(s, e, dt) {
    if (e.stun > 0) { e.stun -= dt; return; }
    e.guard -= dt; const left = s.en.filter((o) => o.kind === "seal" && o.owner === e.id && !o.gone);
    if (!left.length) { e.guard = 0; e.stun = GUARD.stun; e.cd = {}; s.bad.length = 0; s.ev.push({ shatter: 1, x: e.x, y: e.y }); return; }
    if (e.guard <= 0) { e.guard = 0; for (const o of left) { o.gone = true; fan(s, o, GUARD.fan, 0.2, 210, o.x, o.y); } s.ev.push({ mend: left.length, x: e.x, y: e.y }); }
  }
  // The Mapmaker's compass shell (boss rework, 24 Nov 2026): twelve plates turn round it with a gap; a hit lands only through
  // the gap, and a hit on a plate cracks it (break plates to widen the gap). Each stage it draws a fresh shell, turning the other way.
  const MAP = { n: 12, gap: 4, spin: [0.6, -0.75, 0.9], hp: 0.025, rad: 82, step: 6.2832 / 12 };
  const plateAt = (e, a) => { const t = (((a - e.rot) % 6.2832) + 6.2832) % 6.2832; return Math.round(t / MAP.step) % MAP.n; };
  function shellUp(s, e, stage) { e.shell = Array.from({ length: MAP.n }, (_, i) => (i < MAP.gap ? 0 : e.max * MAP.hp)); e.rot = s.rand() * 6.2832; e.spinV = MAP.spin[stage]; }
  // The Toll-Keeper (boss rework, 24 Nov 2026; the owner liked its feel): its arms are chained to it and hold its plating up. Cut
  // the arms first; with both up it shrugs off most of a hit. In its last stage it hangs one new arm, and you cut that too.
  const KEEPER = { plate: [1, 0.6, 0.3], rehang: 0.55 };
  function spawnBoss(s, n) {
    const b = BOSSES[n], big = s.run && s.run.rooms >= 8 ? BIG[n] || BIG1 : { hp: 1, pace: 1, arm: 1 }, cut = (1 - A.clamp((s.run && s.run.bossCut) || 0, -0.3, 0.4)) * big.hp, e = add(s, "boss", W / 2, -110, { hp: b.hp * cut, max: b.hp * cut, pace: big.pace, r: b.r, key: b.key, tier: n, label: b.label, stage: 0, cd: {}, arm: 0, gap: W / 2, light: 1.57 });
    if (b.key === "maker") shellUp(s, e, 0);
    if (b.key === "keeper") for (const side of [-1, 1]) add(s, "arm", W / 2 + side * 130, -110, { hp: 85 * big.arm, max: 85 * big.arm, side, owner: e.id });
  }
  const aim = (s, e) => Math.atan2(s.ship.y - e.y, s.ship.x - e.x);
  function fan(s, e, n, gap, v, x = e.x, y = e.y + 30) { const a = Math.atan2(s.ship.y - y, s.ship.x - x); for (let i = 0; i < n; i++) orb(s, x, y, a + (i - (n - 1) / 2) * gap, v); }
  function bossStep(s, e, dt) {
    const T = SERIES[e.tier], pace = T.pace * (e.pace || 1) * (s.belt >= 2 ? 1.15 : 1), p = s.ship, arms = s.en.filter((o) => o.kind === "arm" && !o.gone);
    if (e.y < 158) { e.y = Math.min(160, e.y + 130 * dt); return; }
    const stage = e.hp > e.max * 0.66 ? 0 : e.hp > e.max * 0.33 ? 1 : 2; if (stage !== e.stage) { const old = e.stage; e.stage = stage; e.arm = 1.4; s.bad.length = 0; s.walls.length = 0; s.lanes.length = 0; e.cd = {}; e.parry = 0; s.ev.push({ stage, x: e.x, y: e.y }); drop(s, e.x, e.y, N.coinStage); if (e.key === "student" && stage === 2 && !e.duel) add(s, "fake", W - e.x, e.y, { hp: 1e9, max: 1e9 }); if (e.key === "student" && e.duel && stage === old + 1) guardUp(s, e, stage); if (e.key === "echo") echoSplit(s, e, stage); if (e.key === "maker" && e.shell) shellUp(s, e, stage); if (e.key === "keeper" && stage === 2 && s.run && s.run.rooms >= 8 && !s.en.some((o) => o.kind === "arm" && !o.gone)) { const side = s.rand() < 0.5 ? -1 : 1, big = BIG[1] || BIG1, h = 85 * big.arm * KEEPER.rehang; add(s, "arm", e.x + side * 132, e.y + 34, { hp: h, max: h, side, owner: e.id }); s.ev.push({ rehang: 1, x: e.x + side * 132, y: e.y + 34 }); } }
    const go = (k, every, f, first = 0.7) => { e.cd[k] = (e.cd[k] ?? first) - dt; if (e.cd[k] <= 0) { e.cd[k] = every / pace; f(); } };
    if (e.key === "student" && (e.guard > 0 || e.stun > 0)) guardStep(s, e, dt);
    e.arm -= dt; if (e.arm > 0) return;
    if (s.belt >= 5 && e.tier > 1) go("old", 4, () => { const n = 10; for (let i = 0; i < n; i++) orb(s, e.x, e.y, (i / n) * 6.28 + s.t, 120); });
    if (e.key === "keeper") {
      // The Toll-Keeper: two arms that slam lanes (shoot them off), then a lamp whose light gives you away.
      e.x = W / 2 + Math.sin(e.t * 0.6) * 60; if (arms.length) go("slam", 2.3 - stage * 0.2, () => { const a = arms[Math.floor(s.rand() * arms.length)]; s.lanes.push({ x: A.clamp(p.x + (s.rand() - 0.5) * 60, 50, W - 50), w: 46, tele: 1.0, by: a.id }); });
      go("ring", arms.length ? 3.1 : 2.2, () => { const n = 12 + stage * 2, g = s.rand() * 6.28; for (let i = 3; i < n; i++) orb(s, e.x, e.y, g + (i / n) * 6.28, 138); });
      if (stage > 0 || arms.length < 2) { e.light += Math.sin(e.t * 0.9) * dt * 0.95; e.light = A.clamp(e.light, 0.75, 2.4); const a = Math.atan2(p.y - e.y, p.x - e.x); e.lit = Math.abs(a - e.light) < 0.23; if (e.lit) go("beam", 0.34, () => orb(s, e.x, e.y + 40, a, 275), 0.25); } else e.lit = null;
      if (stage === 2) go("fan", 1.8, () => fan(s, e, 3, 0.2, 220));
    } else if (e.key === "maker") {
      // The Mapmaker: pins and lines. A dashed line is a warning; a solid one is a wall. Shoot a pin and its lines go.
      e.x = W / 2 + Math.sin(e.t * 0.8) * 130; if (e.shell) e.rot += e.spinV * dt;
      go("chart", 5.4 - stage * 0.5, () => { const n = 3 + Math.min(1, stage), pins = Array.from({ length: n }, (_, i) => add(s, "pin", 40 + ((i + s.rand() * 0.8) / n) * (W - 80), 300 + s.rand() * 470, { left: 5.2 })); for (let i = 0; i < n; i++) s.walls.push({ a: pins[i].id, b: pins[(i + 1) % n].id, x1: pins[i].x, y1: pins[i].y, x2: pins[(i + 1) % n].x, y2: pins[(i + 1) % n].y, tele: 1.35, left: 2.6 }); }, 0.9);
      go("needle", 0.27 - stage * 0.02, () => { e.spin = (e.spin || 0) + 0.39; orb(s, e.x, e.y, e.spin, 150); if (stage > 0) orb(s, e.x, e.y, e.spin + 3.14, 150); });
      if (stage > 0) go("fan", 2.5, () => fan(s, e, 3 + stage, 0.18, 205)); if (stage === 2) go("edge", 1.1, () => { const l = s.rand() < 0.5; orb(s, l ? -6 : W + 6, 260 + s.rand() * 480, l ? 0 : 3.14, 165); });
      // Series two's Mapmaker redraws your lane in its last stage: a warning stripe where you are, then it slams.
      if (stage === 2 && s.run && s.run.rooms >= 8) go("redraw", 3.4, () => s.lanes.push({ x: p.x, w: 46, tele: 1.1 }), 1.5);
    } else if (e.key === "student" && e.stun > 0) {
      // Stunned after her guard broke: she drifts down, dazed and open to hits.
      e.y += (230 - e.y) * Math.min(1, dt * 2);
    } else if (e.key === "student") {
      // The First Student: a ship like yours, with your kinds of cores. It dashes, slings, echoes, throws discs, and turns your shots back.
      if (!(e.dash > 0)) { e.dash = 1.15 / pace; e.tx = A.clamp(s.rand() < 0.5 ? p.x + (s.rand() - 0.5) * 90 : 60 + s.rand() * (W - 120), 50, W - 50); e.ty = 110 + s.rand() * 130; } e.dash -= dt; const k = Math.min(1, dt * 5.5); e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k;
      e.past = e.past || []; e.past.push([e.x, e.y]); if (e.past.length > 70) e.past.shift();
      const f = s.en.find((o) => o.kind === "fake" && !o.gone); if (f) { f.x += (W - e.x - f.x) * Math.min(1, dt * 8); f.y += (e.y - f.y) * Math.min(1, dt * 8); }
      go("sling", 1.55, () => { fan(s, e, 5 + stage, 0.13, 265); if (stage > 0 && e.past.length > 60) fan(s, e, 3, 0.2, 230, e.past[0][0], e.past[0][1] + 20); if (f) fan(s, f, 3, 0.2, 230); });
      if (!(e.guard > 0)) go("disc", 2.9, () => { for (const d of [-0.5, 0.5]) s.bad.push({ id: s.id++, x: e.x, y: e.y, vx: Math.sin(d) * 250, vy: 470, r: 13, disc: -360, home: e.id, left: 3.4 }); }, 1.4);
      if (!(e.guard > 0)) go("parry", 6.2 - stage, () => { e.parry = 1.5; e.store = 0; s.ev.push("parry"); }, 3); if (e.parry > 0) { e.parry -= dt; if (e.parry <= 0) { const n = Math.round(Math.min(13, e.store || 0)); if (n > 1) fan(s, e, n, 0.12, 250); s.ev.push("riposte"); } }
      if (!(e.guard > 0) && (stage === 2 || (e.duel && stage === 1))) go("rain", e.duel && stage === 1 ? 3.6 : 2.9, () => curtain(s, e, 62, 165));
    } else if (e.key === "echo") {
      // The Echo: your own flying, rung back. Alone, it mirrors you across the middle (to hit it, fly under its own stream).
      // Split, it and its copies hold places across the top, drifting against you, and shuffle every few seconds: follow the real one.
      const cps = s.en.filter((o) => o.kind === "fake" && o.echo === e.id && !o.gone);
      if (e.slots && cps.length) {
        e.swapT -= dt; if (e.swapT <= 0) { e.swapT = ECHO.swap[stage] / Math.sqrt(pace); e.shuf = ECHO.shuffle; const n = e.slots.length, j = (e.slot + 1 + Math.floor(s.rand() * (n - 1))) % n, free = [...Array(n).keys()].filter((k) => k !== j); for (let i = free.length - 1; i > 0; i--) { const q = Math.floor(s.rand() * (i + 1)); [free[i], free[q]] = [free[q], free[i]]; } e.slot = j; cps.forEach((c, i) => { c.slot = free[i]; }); s.ev.push("echoshuffle"); }
        e.shuf = Math.max(0, (e.shuf || 0) - dt); const drift = (W / 2 - p.x) * 0.3, k = Math.min(1, dt * (e.shuf > 0 ? 3.2 : 5)), at = (q) => A.clamp(e.slots[q] + drift, 40, W - 40);
        e.x += (at(e.slot) - e.x) * k; e.y = 160 + Math.sin(e.t * 1.3) * 14; for (const c of cps) { c.x += (at(c.slot) - c.x) * k; c.y = 160 + Math.sin(e.t * 1.3 + c.slot) * 14; }
      } else { e.x += (A.clamp(W - p.x, 40, W - 40) - e.x) * Math.min(1, dt * 6); e.y = 160 + Math.sin(e.t * 1.3) * 14; }
      go("copy", 0.3, () => { for (const dx of [-11, 11]) orb(s, e.x + dx, e.y + 30, 1.5708, 300); });
      go("copies", 1.1, () => { for (const c of cps) orb(s, c.x, c.y + 30, 1.5708, 260); }, 0.9);
      if (stage) go("fan", 2.3, () => fan(s, e, 5, 0.17, 230), 1.2);
      if (stage === 2) go("rain", 3.4, () => curtain(s, e, 64, 160), 1.6);
    } else {
      // The Last Bell: rings on the beat, curtains, spirals; everything before it, together.
      if (e.open > 0) e.open -= dt;
      go("tollwave", TOLL.every[stage], () => { e.wind = TOLL.wind; s.ev.push({ tollup: 1, x: e.x, y: e.y }); }, 2.4);
      if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { s.waves.push({ x: e.x, y: e.y + 30, r: 50, by: e.id }); s.ev.push({ tollwave: 1, x: e.x, y: e.y }); } }
      e.x = W / 2 + Math.sin(e.t * 0.7) * 50; if (!(e.wind > 0)) go("toll", 2.7, () => { const n = 18 + stage * 3, g = s.rand() * 6.28; for (let i = 3; i < n; i++) orb(s, e.x, e.y, g + (i / n) * 6.28, 150); s.ev.push("bell"); });
      if (stage === 0) go("fan", 1.8, () => fan(s, e, 6, 0.16, 225)); if (stage >= 1) go("rain", 2.6, () => curtain(s, e, 64, 170)); if (stage === 2) { go("spiral", 0.2, () => { e.spin = (e.spin || 0) + 0.33; orb(s, e.x, e.y, e.spin, 140); }); go("slam", 2.8, () => s.lanes.push({ x: p.x, w: 46, tele: 1.0 })); }
      // Series three's Bell swings wider and, from its second stage, calls chimers down beside it.
      if (s.run && s.run.rooms >= 8) { e.x = W / 2 + Math.sin(e.t * 0.7) * 110; if (stage >= 1) go("chimes", 7.5, () => { for (const sd of [-1, 1]) add(s, "chimer", W / 2 + sd * 160, -30, { rest: 230 + s.rand() * 60, fire: 1.6 }); s.ev.push("bell"); }, 2); }
    }
  }
  // The Last Bell's toll (boss rework, owner's own idea, 24 Nov 2026): it swings back and glows (the tell), then rings a bronze
  // wave across the whole sky. Moving can't get you clear of it: dash while it's close (the part near you turns cyan) and you pass
  // through. The wave pushes your shots away as it goes. Once it's past you, the bell hangs open: hits land harder, until it
  // closes again (its bronze shrugs off most of a hit).
  const TOLL = { every: [5.8, 5.2, 4.6], wind: 1.15, v: 250, band: 26, near: 95, open: 2.4, hard: 0.6, soft: 1.8 };
  function wavesStep(s, dt) {
    const p = s.ship, R = dot(s) + TOLL.band / 2;
    for (const w of s.waves) {
      w.r += TOLL.v * dt; const d = Math.hypot(p.x - w.x, p.y - w.y), off = d - w.r;
      if (!w.done) { if (s.dashT > 0 && Math.abs(off) < TOLL.near) { w.done = 1; s.ev.push({ thru: 1, x: p.x, y: p.y }); } else if (Math.abs(off) < R) { w.done = 1; hit(s); } if (w.done) { const b = s.en.find((e) => e.id === w.by && !e.gone); if (b) { b.open = TOLL.open; s.ev.push({ bellopen: 1, x: b.x, y: b.y }); } } }
      for (const b of s.shots) if (!b.pushed && Math.abs(Math.hypot(b.x - w.x, b.y - w.y) - w.r) < TOLL.band) { const a = Math.atan2(b.y - w.y, b.x - w.x); b.vx = Math.cos(a) * 520; b.vy = Math.sin(a) * 520; b.dmg = 0; b.pushed = 1; b.seek = b.home = false; b.boom = 0; b.flak = 0; b.life = Math.min(b.life ?? 0.4, 0.4); }
    }
    s.waves = s.waves.filter((w) => w.r < 1150);
  }
  function curtain(s, e, half, v) { e.gap = A.clamp(e.gap + (s.rand() - 0.5) * 190, 80, W - 80); for (let x = 14; x < W; x += 30) if (Math.abs(x - e.gap) > half) orb(s, x, -16, 1.5708, v); }
  /* ---------- The run ---------- */
  const unhurt = (s) => s.hull >= s.hullMax;
  // The armory only opens with at least two guns to choose from, and never once a core has replaced the guns.
  const upgradable = (s) => s.guns.filter((k) => ((s.gunLv || {})[k] || 0) < 2 && D.MODS[k]), armoryOk = (s) => !s.core.shot && s.rig !== "scholar" && gunPool(s).length + upgradable(s).length >= 2;
  // Any gun can turn up in a run (owner, 24 Nov 2026: "any weapon could show up"); ones bought in Quill's Shop come up twice as often.
  const gunPool = (s) => Object.keys(GUNS).filter((k) => !s.guns.includes(k));
  const pickGun = (s, not = []) => { const l = gunPool(s).filter((k) => !not.includes(k)).flatMap((k) => (s.pool.guns.includes(k) ? [k, k] : [k])); return l.length ? l[Math.floor(s.rand() * l.length)] : null; };
  const gunsOk = (s) => !s.core.shot && s.rig !== "scholar";
  // When a card runs out of new things, it fills up with supplies so there are always three real choices.
  function fill(s, out, n) { const l = Object.keys(PLAIN).filter((k) => !out.some((o) => o.plain === k) && (k !== "repair" || !unhurt(s))); while (out.length < n && l.length) out.push({ plain: l.splice(Math.floor(s.rand() * l.length), 1)[0], fill: 1 }); }
  // The new gates (owner, 24 Nov 2026: "come up with a couple different other gates ... make it more random"):
  // Salvage Yard (a new gun, a gun upgrade and an upgrade from any school), Crossroads (three schools, one upgrade each),
  // Trading Post (spend this run's stamps). Field name `yard` (never a string method's name: see CLAUDE.md).
  const YARDS = { salvage: { label: "Salvage Yard", what: "Guns and upgrades", color: "#ffb35c" }, cross: { label: "Crossroads", what: "Three schools", color: "#c9a6ff" }, post: { label: "Trading Post", what: "Spend stamps", color: "#ffd23f" } };
  const PRICE = { gun: 8, up: 10, full: 6 };
  const postOk = (s) => (s.stamps || 0) >= PRICE.full + PRICE.gun;
  function offerGates(s) {
    const r = s.run; r.phase = "gates";
    if (r.rooms >= 8 && r.room === Math.floor(r.rooms / 2) && !r.midDone && (r.act === 2 || r.act === 3)) { r.midDone = true; r.gates = [{ x: W / 2, y: -150, half: 92, boss: true, duel: true, tier: 3, ...(r.act === 3 ? { echo: true, name: "The Echo" } : {}) }]; s.ev && s.ev.push("duelgate"); return; }
    if (r.rooms >= 8 && r.room === Math.floor(r.rooms / 2) && !r.midDone && !coresLeft(s)) { r.midDone = true; s.hull = Math.min(s.hullMax, s.hull + 2); s.ev && s.ev.push("nocore"); }
    if (r.rooms >= 8 && r.room === Math.floor(r.rooms / 2) && !r.midDone) { r.midDone = true; r.mid = true; r.cores = null; r.phase = "core"; s.ev && s.ev.push("midterm"); return; }
    if (r.room >= r.rooms || r.act > 3) { r.gates = [{ x: W / 2, y: -150, half: 92, boss: true, tier: r.rooms >= 8 && r.act === 3 ? 4 : r.act }]; s.ev && s.ev.push("bossgate"); return; }
    // Three gates every time (owner, 24 Nov 2026: "every single time you have three options"): a school, then two from
    // schools, the armory, the new gates, supplies and the Trading Post, never two the same.
    const take = (l) => l.splice(Math.floor(s.rand() * l.length), 1)[0], schools = s.pool.schools.map((k) => ({ school: k })), plain = Object.keys(PLAIN).filter((k) => k !== "repair" || !unhurt(s));
    const mix = [...schools.slice(), ...(armoryOk(s) && (r.act + r.room > 0 || s.rig === "tinker") ? [{ armory: 1 }, ...(s.rig === "tinker" ? [{ armory: 1 }] : [])] : []), ...(r.act + r.room > 0 ? [{ yard: "salvage" }, { yard: "cross" }] : [])];
    const three = [take(schools)]; mix.splice(mix.findIndex((g) => g.school === three[0].school), 1);
    const same = (a, b) => (a.school && a.school === b.school) || (a.armory && b.armory) || (a.yard && a.yard === b.yard) || (a.plain && b.plain);
    const grab = () => { let g = take(mix); while (g && three.some((o) => same(o, g))) g = take(mix); return g; };
    if (s.rand() < (s.hull <= 2 ? 0.6 : 0.3)) three.push({ plain: s.hull <= 2 && plain.includes("repair") ? "repair" : take(plain) });
    if (r.act + r.room > 1 && postOk(s) && s.rand() < 0.25) three.push({ yard: "post" });
    while (three.length < 3) { const g = grab(); if (!g) break; three.push(g); }
    while (three.length < 3) three.push({ plain: take(plain) || "reroll" });
    for (let i = three.length - 1; i > 0; i--) { const j = Math.floor(s.rand() * (i + 1)); [three[i], three[j]] = [three[j], three[i]]; }
    const sch = three.map((g, i) => (g.school || (g.yard === "cross") ? i : -1)).filter((i) => i >= 0), danger = r.act + r.room > 1 && sch.length && s.rand() < (s.belt >= 4 ? 0.6 : 0.38) ? sch[Math.floor(s.rand() * sch.length)] : -1;
    // In the full game a "?" gate (an event) often stands in for one of the choices (never the thorned one).
    if (r.rooms >= 8 && r.room >= 1 && r.room < r.rooms - 1 && eventsLeft(s).length && s.rand() < 0.42) { const l = [0, 1, 2].filter((i) => i !== danger); three[l[Math.floor(s.rand() * l.length)]] = { event: 1 }; }
    r.gates = three.map((g, i) => ({ x: [W * 0.17, W * 0.5, W * 0.83][i], y: -150, half: 62, ...g, hard: i === danger && !g.armory && !g.event && g.yard !== "post" }));
  }
  // Three of a school's parts (or a fusion you've earned). Parts at three levels don't come up.
  function offerParts(s, school, hard) {
    const open = Object.keys(PARTS).filter((k) => canLevel(s, k)), own = open.filter((k) => PARTS[k].school === school), out = [];
    // A fork waiting on this school's road: both sides come first, side by side.
    const fk = ROADS.find((r) => PARTS[r].school === school && forkOpen(s, r) && Object.keys(PARTS).some((q) => PARTS[q].road === r && open.includes(q)));
    if (fk) { for (const q of Object.keys(PARTS).filter((q) => PARTS[q].road === fk && open.includes(q))) out.push({ k: q, n: hard ? 2 : 1, fork: 1 }); if (open.includes(fk)) out.push({ k: fk, n: hard ? 2 : 1 }); }
    if (!out.length && own.length) out.push({ k: own[Math.floor(s.rand() * own.length)], n: hard ? 2 : 1 }); const rest = open.filter((k) => !out.some((o) => o.k === k || (PARTS[k].road && PARTS[o.k].road === PARTS[k].road)));
    while (out.length < (s.rig === "scholar" ? 4 : 3) && rest.length) { const k = rest.splice(Math.floor(s.rand() * rest.length), 1)[0]; if (PARTS[k].road && out.some((o) => PARTS[o.k] && PARTS[o.k].road === PARTS[k].road)) continue; out.push({ k, n: hard ? 2 : 1, fork: PARTS[k].road && !lv(s, k) ? 1 : 0 }); }
    const fus = Object.keys(FUSIONS).filter((f) => !has(s, f) && crossOk(s, f));
    // A crossing you've opened: sometimes it takes the last card (never one side of a fork).
    if (fus.length && (s.rand() < 0.6 || !out.length)) { const i = out.length - 1; if (i >= 0 && !out[i].fork) out[i] = { f: fus[Math.floor(s.rand() * fus.length)] }; else out.push({ f: fus[Math.floor(s.rand() * fus.length)] }); }
    // Guns turn up on upgrade cards too (one card in five), not only at the armory: it takes a plain upgrade's place.
    const want = s.rig === "scholar" ? 4 : 3;
    if (gunsOk(s) && s.run.act + s.run.room > 0 && s.rand() < 0.2) { const g = pickGun(s); if (g) { const i = out.findLastIndex((o, j) => j > 0 && o.k && !o.fork && !o.cost); if (out.length >= want && i >= 0) out[i] = { gun: g }; else if (out.length < want) out.push({ gun: g }); } }
    // A campaign rocket can top out every upgrade: supplies fill the card instead of leaving it short.
    fill(s, out, want);
    bold(s, out, hard);
    s.run.offer = out; s.run.school = school; s.run.yard = null; s.run.hardPay = hard; s.run.phase = "pick"; s.run.free = s.third; s.ev.push("pick");
  }
  // A bold choice (third audit): sometimes the last card pays one level more than the others, at a price you can see:
  // 1 hull for good, or another upgrade you hold losing a level. Never Hull itself, never past an upgrade's top level.
  const BOLD = 0.4;
  function bold(s, out, hard) {
    const r = s.run; if (out.length < 2 || r.act + r.room < 3 || s.rand() >= BOLD) return;
    const n = (hard ? 2 : 1) + 1, l = Object.keys(PARTS).filter((k) => k !== "reserve" && !PARTS[k].road && canLevel(s, k) && lv(s, k) + n <= capOf(k)); if (!l.length) return;
    const k = l[Math.floor(s.rand() * l.length)], mine = held(s).filter((q) => q !== k && s.p[q] > 0).sort((a, b) => s.p[b] - s.p[a]), cost = s.hullMax >= 4 && (!mine.length || s.rand() < 0.5) ? "max" : mine[0];
    if (!cost) return; const at = out.findIndex((o) => o.k === k), i = at >= 0 ? at : out.length - 1; if (out[i].fork || out[i].f) return; out[i] = { k, n, cost };
  }
  function payCost(s, c) { if (c === "max") { s.hullMax = Math.max(1, s.hullMax - 1); s.hull = Math.min(s.hull, s.hullMax); } else if (c && lv(s, c)) setLv(s, c, lv(s, c) - 1); }
  // The armory: three guns you don't have; the one you pick replaces the gun in your hand.
  function offerGuns(s) { const m = upgradable(s).map((k) => ({ mod: k })), out = []; if (m.length) out.push(m.splice(Math.floor(s.rand() * m.length), 1)[0]); while (out.length < 3) { const g = pickGun(s, out.map((o) => o.gun)); if (!g) break; out.push({ gun: g }); } while (out.length < 3 && m.length) out.push(m.shift()); fill(s, out, 3); s.run.offer = out; s.run.school = null; s.run.yard = null; s.run.phase = "pick"; s.run.free = s.third; s.ev.push("pick"); }
  // The new gates' cards. Salvage: a gun, a gun upgrade (or another gun), an upgrade from any school. Crossroads: three
  // upgrades from three different schools. Trading Post: three buys priced in this run's stamps (you can still skip).
  function offerYard(s, kind, hard) {
    const r = s.run, n = hard ? 2 : 1, out = [], open = Object.keys(PARTS).filter((k) => canLevel(s, k) && !(PARTS[k].road && !lv(s, k)));
    const up = (l) => { const k = l.length ? l[Math.floor(s.rand() * l.length)] : null; return k ? { k, n } : null; };
    if (kind === "salvage") { if (gunsOk(s)) { const g = pickGun(s); if (g) out.push({ gun: g }); const m = upgradable(s); if (m.length) out.push({ mod: m[Math.floor(s.rand() * m.length)] }); else { const g2 = pickGun(s, out.map((o) => o.gun)); if (g2) out.push({ gun: g2 }); } } const u = up(open); if (u) out.push(u); while (out.length < 3) { const v = up(open.filter((k) => !out.some((o) => o.k === k))); if (!v) break; out.push(v); } }
    else if (kind === "cross") { const sc = s.pool.schools.slice(); while (out.length < 3 && sc.length) { const c = sc.splice(Math.floor(s.rand() * sc.length), 1)[0], u = up(open.filter((k) => PARTS[k].school === c)); if (u) out.push(u); } }
    else { if (gunsOk(s)) { const g = pickGun(s); if (g) out.push({ gun: g, price: PRICE.gun }); } const u = up(open); if (u) out.push({ k: u.k, n: 2, price: PRICE.up }); out.push(unhurt(s) ? { plain: "guard", price: PRICE.full } : { plain: "full", price: PRICE.full }); while (out.length < 3) { const v = up(open.filter((k) => !out.some((o) => o.k === k))); if (!v) break; out.push({ ...v, n: 2, price: PRICE.up }); } }
    fill(s, out, 3);
    r.offer = out; r.school = null; r.yard = kind; r.hardPay = hard; r.phase = "pick"; r.free = s.third; s.ev.push("pick");
  }
  function take(s, i, slot) {
    const r = s.run; if (!r || r.phase !== "pick" || !r.offer[i]) return false; const o = r.offer[i];
    if (o.price) { if ((s.stamps || 0) < o.price) return false; s.stamps -= o.price; }
    // A new gun goes in the slot you choose (owner: "switch out both weapons"); without a choice, the one in your hand.
    const j = slot === 0 || slot === 1 ? Math.min(slot, s.guns.length) : s.gun;
    if (o.plain === "full") { s.hull = s.hullMax; s.ev.push({ bonus: "repair", n: 1 }); r.got.push("repair"); } else if (o.plain) pay(s, o.plain, r.hardPay && !!r.school);
    else if (o.mod) s.gunLv[o.mod] = (s.gunLv[o.mod] || 0) + 1; else if (o.gun) { s.guns[j] = o.gun; if (j === s.gun) { s.cool = 0; s.shots = s.shots.filter((b) => !b.orbit); } } else if (o.f) s.fus.push(o.f); else { setLv(s, o.k, lv(s, o.k) + o.n); if (o.cost) { payCost(s, o.cost); s.ev.push({ bold: o.k, cost: o.cost }); } }
    if (!o.plain) r.got.push(o.mod ? `${o.mod}+` : o.gun || o.f || o.k); r.offer = null; offerGates(s); return true;
  }
  function reroll(s) { const r = s.run; if (!r || r.phase !== "pick" || (s.rerolls <= 0 && !r.free)) return false; if (r.free) r.free = false; else s.rerolls--; const was = r.free; if (r.school) offerParts(s, r.school, r.hardPay); else if (r.yard) offerYard(s, r.yard, r.hardPay); else offerGuns(s); r.free = was; return true; }
  function skip(s) { const r = s.run; if (!r || r.phase !== "pick") return false; s.hull = Math.min(s.hullMax, s.hull + 1); r.got.push("skip"); r.offer = null; offerGates(s); return true; }
  function pay(s, k, hard) { const n = hard ? 2 : 1; if (k === "repair") s.hull = Math.min(s.hullMax, s.hull + 3 * n); else if (k === "plate") { s.hullMax += n; s.hull = Math.min(s.hullMax, s.hull + 2 * n); } else if (k === "guard") s.guard += 2 * n; else s.rerolls += 2 * n; s.run.got.push(k); s.ev.push({ bonus: k, n }); }
  // A level starts: what it pays, whether it's thorned, and sometimes weather or a job (from level 3 of the full game).
  function startRoom(s, pay, hard) {
    const r = s.run; r.phase = "room"; r.pay = pay; r.hard = hard; r.double = false; r.hurtAt = 0; s.foes = true; s.next = 0.5; r.bountyDone = false; r.showerT = 1;
    const skies = r.act === 3 ? ["toll", "well", "toll", "well", "glass", "bounty"] : r.act === 2 ? ["tide", "glass", "tide", "glass", "bounty", "shower"] : ["fog", "shower", "bounty"];
    r.sky = r.skyNext || (r.rooms >= 8 && r.room >= 2 && s.rand() < (SKYC[r.act] ?? 0.3) ? skies[Math.floor(s.rand() * skies.length)] : null); r.skyNext = null; r.tide = 0; r.tideDir = r.room % 2 ? 1 : -1; r.tideT = 4.5; r.tollT = 1.5; r.well = r.sky === "well" ? { x: W / 2, y: 360, vx: s.rand() < 0.5 ? 46 : -46 } : null;
    r.left = r.sky === "rush" ? Math.round(r.secs * 0.7) : r.secs; if (r.sky) s.ev.push({ sky: r.sky });
  }
  // A random part from the schools you can draw from, up n levels. Returns its key.
  // Set an upgrade's level (capped at its own top), with what it does at once: Hull adds and repairs, Shields adds one.
  const capOf = (k) => (PARTS[k] && PARTS[k].max) || MAXLV;
  // Forks: a road (plain upgrade) at level 3 opens its two sides; taking one closes the other for the flight.
  const sideOf = (k) => Object.keys(PARTS).find((q) => PARTS[q].road && PARTS[q].road === PARTS[k].road && q !== k);
  const forkOpen = (s, road) => lv(s, road) >= 3 && !Object.keys(PARTS).some((q) => PARTS[q].road === road && lv(s, q) > 0);
  const forkTaken = (s, road) => Object.keys(PARTS).find((q) => PARTS[q].road === road && lv(s, q) > 0) || null;
  function canLevel(s, k) { const P = PARTS[k]; if (!P || lv(s, k) >= capOf(k) || !s.pool.schools.includes(P.school)) return false; if ((k === "track" || k === "pierce") && s.core.shot) return false; if (P.road) return lv(s, P.road) >= 3 && !lv(s, sideOf(k)); return true; }
  const crossOk = (s, f) => FUSIONS[f].roads && FUSIONS[f].roads.every((r) => forkTaken(s, r));
  function setLv(s, k, now) { now = Math.max(0, Math.min(capOf(k), now)); const d = now - lv(s, k); if (now) s.p[k] = now; else delete s.p[k]; if (k === "reserve") { s.hullMax = Math.max(1, s.hullMax + d); s.hull = d > 0 ? Math.min(s.hullMax, s.hull + 2 * d) : Math.min(s.hull, s.hullMax); } if (k === "skin" && d > 0) s.guard += d; return d; }
  function randomPart(s, n) { const l = Object.keys(PARTS).filter((k) => canLevel(s, k)); if (!l.length) return null; const k = l[Math.floor(s.rand() * l.length)]; setLv(s, k, lv(s, k) + n); s.run.got.push(k); return k; }
  // Events of this series that this run hasn't had yet, and fit where you are (some only before or after the midterm).
  const eventsLeft = (s) => { const r = s.run, mid = Math.floor(r.rooms / 2); return Object.keys(EVENTS).filter((k) => { const e = EVENTS[k]; return (e.any || (e.series || 1) === r.act) && !r.seenEv.includes(k) && !(e.until != null && r.room >= Math.min(e.until, mid)) && !(e.after != null && r.room < Math.max(e.after, mid)); }); };
  // Whether an event choice can be taken: some need enough hull or parts.
  const held = (s) => Object.keys(s.p).filter((k) => s.p[k] > 0 && k !== "reserve");
  function canTake(s, o) { const n = o.need || {}; return !(n.max && s.hullMax < n.max) && !(n.parts && held(s).length < n.parts) && !(n.hull && s.hull <= n.hull); }
  // What a choice (or a dare's result) does to the ship. Hull costs stop at 1: events never end a run.
  function effect(s, d, out) {
    const r = s.run;
    if (d.max) { s.hullMax = Math.max(1, s.hullMax + d.max); s.hull = Math.min(s.hull, s.hullMax); }
    if (d.hull) s.hull = A.clamp(s.hull + d.hull, 1, s.hullMax); if (d.full) s.hull = s.hullMax;
    if (d.guard) s.guard += d.guard; if (d.rerolls) s.rerolls = Math.max(0, s.rerolls + d.rerolls); if (d.stamps) s.stamps += d.stamps; if (d.bossCut) r.bossCut += d.bossCut; if (d.duelCut) r.duelCut += d.duelCut; if (d.ally) s.ally = true; if (d.flag) r.flags.push(d.flag);
    if (d.lose) { const k = held(s).sort((a, b) => s.p[b] - s.p[a])[0]; if (k) setLv(s, k, s.p[k] - 1); }
    if (d.give) { setLv(s, d.give, lv(s, d.give) + 1 + (d.give2 || 0)); r.got.push(d.give); out.push(d.give); }
    if (d.best) { const k = held(s).filter((q) => s.p[q] < capOf(q)).sort((a, b) => s.p[b] - s.p[a])[0]; if (k) { setLv(s, k, s.p[k] + 1); out.push(k); } else out.push(randomPart(s, 1)); }
    if (d.melt) { const two = held(s).sort((a, b) => s.p[a] - s.p[b]).slice(0, 2); for (const k of two) setLv(s, k, 0); out.push(randomPart(s, 3)); }
    if (d.part) out.push(randomPart(s, d.part));
    if (d.swap) { const mine = Object.keys(s.p).filter((k) => s.p[k] > 0 && k !== "reserve").sort((a, b) => s.p[a] - s.p[b])[0], n = mine ? s.p[mine] : 0; if (mine) setLv(s, mine, 0); out.push(randomPart(s, n + 1)); }
  }
  // The choice on an event card: what it costs and pays at once, then the level it leads into (or past, for a shortcut).
  function decide(s, i) {
    const r = s.run; if (!r || r.phase !== "event") return false; const o = EVENTS[r.event].opts[i]; if (!o || !canTake(s, o)) return false; const d = o.do, out = [];
    effect(s, d, out); r.dare = d.dare ? { ...d.dare, label: o.label } : null;
    if (d.sky) r.skyNext = d.sky; r.event = null; r.choice = o.label;
    s.ev.push({ decided: o.label, got: out.filter(Boolean) });
    if (d.skip) { s.rooms++; r.room++; s.ev.push("shortcut"); offerGates(s); return true; }
    const pay = d.armory && armoryOk(s) ? { armory: 1 } : d.armory || d.school ? { school: s.pool.schools[Math.floor(s.rand() * s.pool.schools.length)] } : { none: 1 };
    startRoom(s, pay, !!d.hard); r.double = !!d.double; if (d.short) r.left = Math.round(r.left * 0.6); if (d.long) r.left = Math.round(r.left * 1.5); return true;
  }
  // A dare is settled when its level ends: few enough hits and it pays, otherwise it costs.
  function settle(s) { const r = s.run, d = r.dare; if (!d) return; r.dare = null; const ok = r.hurtAt <= d.hits, out = []; effect(s, ok ? d.win : d.lose, out); s.ev.push({ dare: ok ? "won" : "lost", label: d.label, got: out.filter(Boolean) }); }
  function runStep(s, dt) {
    const r = s.run, p = s.ship;
    if (r.phase === "gates") {
      for (const g of r.gates) g.y += 175 * dt;
      if (r.gates[0].y >= p.y) { const g = r.gates.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a)); r.gates = null; s.ev.push({ gate: g.duel ? "duel" : g.boss ? "boss" : g.event ? "event" : g.school || g.plain || "armory", hard: !!g.hard, x: g.x, y: p.y }); if (g.boss) { r.phase = "boss"; if (g.duel) { r.duel = true; s.hull = Math.min(s.hullMax, s.hull + 1); spawnDuel(s); } else spawnBoss(s, g.tier || r.act); } else if (g.event) { const l = eventsLeft(s), k = l[Math.floor(s.rand() * l.length)]; r.seenEv.push(k); r.event = k; r.phase = "event"; s.ev.push({ event: k }); } else startRoom(s, g, !!g.hard); }
    } else if (r.phase === "room") {
      r.left -= dt; if (r.left <= 3.2) s.foes = false;
      if (r.sky === "tide") { if ((r.tideT -= dt) <= 0) { r.tideT = 4.5; r.tideDir = -r.tideDir; s.ev.push({ tide: r.tideDir }); } r.tide += (r.tideDir * 70 - r.tide) * Math.min(1, dt * 1.2); }
      // Bell toll: a slow fan of red shots rings down from a point on the top edge, with a two-shot gap.
      if (r.sky === "toll" && r.left > 3 && (r.tollT -= dt) <= 0) { r.tollT = 3.4; const x = 60 + s.rand() * (W - 120), n = 11, gap = 1 + Math.floor(s.rand() * (n - 3)); for (let i = 0; i < n; i++) if (i !== gap && i !== gap + 1) orb(s, x, -8, 0.3 + (i / (n - 1)) * (Math.PI - 0.6), 125, { toll: 1 }); r.tollX = x; s.ev.push({ toll: x }); }
      if (r.well) { r.well.x += r.well.vx * dt; if (r.well.x < 110 || r.well.x > W - 110) r.well.vx = -r.well.vx; r.well.y = 360 + Math.sin(s.t * 0.5) * 60; }
      if (r.sky === "shower" && r.left > 3 && (r.showerT = (r.showerT || 0) - dt) <= 0) { r.showerT = 0.5; orb(s, 20 + s.rand() * (W - 40), -14, 1.57 + (s.rand() - 0.5) * 0.35, 150 + s.rand() * 60, { r: 12, rock: true }); }
      if (r.left <= 0 && (!s.en.length || r.left < -5)) { s.en.forEach((e) => { e.gone = true; }); s.en = []; s.bad.length = 0; s.rooms++; r.room++; settle(s); vacuum(s); if (r.rooms >= 8) { const fl = !r.hurtAt; if (fl) { s.flawless = (s.flawless || 0) + 1; s.stamps++; } s.ev.push({ clear: r.room, flawless: fl }); } if (lv(s, "breath") && !r.hurtAt && (lv(s, "breath") >= 3 || s.rand() < 0.45 + 0.25 * (lv(s, "breath") - 1))) { s.hull = Math.min(s.hullMax, s.hull + 1); s.ev.push("breath"); } if (r.pay.school) offerParts(s, r.pay.school, r.hard || r.double); else if (r.pay.yard) offerYard(s, r.pay.yard, r.hard || r.double); else if (r.pay.armory) offerGuns(s); else if (r.pay.plain) { pay(s, r.pay.plain, r.hard); offerGates(s); } else offerGates(s); }
    }
  }
  function choose(s, k) { const r = s.run; if (!r || r.phase !== "core" || !r.cores || !r.cores.includes(k)) return false; if (s.core[CORES[k].fam] === "thorn") { s.hullMax = Math.max(1, s.hullMax - 2); s.hull = Math.min(s.hull, s.hullMax); } if (CORES[k].fam === "shot" && s.core.shot) s.beams = []; s.core[CORES[k].fam] = k; if (k === "thorn") { s.hullMax += 2; s.hull += 2; } s.hull = Math.min(s.hullMax, s.hull + 2); if (r.mid) { r.mid = false; r.cores = null; s.shots = []; s.beams = []; s.wind = 0; s.fever = 1; offerGates(s); return true; } r.act++; r.room = 0; s.shots = []; s.beams = []; s.past = []; s.wind = 0; s.fever = 1; r.cores = null; offerGates(s); return true; }
  // Three of the five cores in this boss's family, the same three if asked again.
  // A campaign rocket can already hold a core of every kind: then the midterm pays 2 hull instead of a core card.
  // Swaps count (owner, 24 Nov 2026: always three choices): a rocket holding every kind of core still gets a card of swaps.
  const coresLeft = (s) => s.pool.cores.filter((k) => s.core[CORES[k].fam] !== k).length;
  function choices(s) { const r = s.run; if (!r.cores && r.mid) { const l = s.pool.cores.filter((k) => !s.core[CORES[k].fam]), o = []; for (const f of FAMILIES) { const q = l.filter((k) => CORES[k].fam === f); if (q.length) o.push(q[Math.floor(s.rand() * q.length)]); } while (o.length > 3) o.splice(Math.floor(s.rand() * o.length), 1); const more = l.filter((k) => !o.includes(k)); while (o.length < 3 && more.length) o.push(more.splice(Math.floor(s.rand() * more.length), 1)[0]); const sw = s.pool.cores.filter((k) => !o.includes(k) && s.core[CORES[k].fam] && s.core[CORES[k].fam] !== k); while (o.length < 3 && sw.length) o.push(sw.splice(Math.floor(s.rand() * sw.length), 1)[0]); r.cores = o; } if (!r.cores) { const l = s.pool.cores.filter((k) => CORES[k].fam === FAMILIES[r.act - 1]), o = []; while (o.length < 3) o.push(l.splice(Math.floor(s.rand() * l.length), 1)[0]); r.cores = o; } return r.cores; }
  // A close call: points, a quicker dash, and one pip of nerve. Full nerve (N.nerve close calls without being hit) is
  // Overdrive: N.od seconds of faster, harder shots. Being hit empties the nerve.
  function graze(s, b) {
    s.grazes++; s.score += 10; s.ev.push("graze"); s.dashCd = Math.max(0, s.dashCd - N.nick); if (b) s.ev.push({ nick: 1, x: b.x, y: b.y });
    if (s.odT <= 0 && ++s.nerve >= N.nerve) { s.nerve = 0; s.odT = N.od + (s.odPlus || 0); s.odN = (s.odN || 0) + 1; s.ev.push("overdrive"); } if (s.core.trigger === "dare") burst(s);
    if (lv(s, "tail")) { s.tailN = Math.min(10, s.tailN + 1); s.tailT = 4; } if (lv(s, "luck") && ++s.luckN >= 22 - 5 * lv(s, "luck")) { s.luckN = 0; s.guard = Math.min(3, s.guard + 1); s.ev.push("luck"); }
    if (has(s, "wildfire")) { const e = near(s, s.ship.x, s.ship.y, 900); if (e) e.burn = Math.max(e.burn, 4); } if (has(s, "eye") && s.eyeT <= -5) { s.eyeT = 1; s.ev.push("eye"); } if (has(s, "thunder") && ++s.thunderN >= 8) { s.thunderN = 0; ring(s, s.ship.x, s.ship.y, 260, 42); s.ev.push("bell"); } if (has(s, "slipstream")) for (let i = 0; i < 2; i++) seeker(s, s.ship.x, s.ship.y, 2 * power(s), i);
  }
  const segDist = (px, py, w) => { const dx = w.x2 - w.x1, dy = w.y2 - w.y1, t = A.clamp(((px - w.x1) * dx + (py - w.y1) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - w.x1 - dx * t, py - w.y1 - dy * t); };
  function step(s, input, dt) {
    s.ev = []; if (s.over || (s.run && (s.run.phase === "core" || s.run.phase === "pick" || s.run.phase === "event"))) return s;
    s.t += dt; s.safe = Math.max(0, s.safe - dt); s.cool -= dt; const p = s.ship, most = N.speed * dt; p.px = p.x; p.py = p.y;
    s.dragX = A.clamp(s.dragX + (input.dx || 0), -p.x, W - p.x); s.dragY = A.clamp(s.dragY + (input.dy || 0), -p.y, H - p.y);
    const dm = Math.hypot(s.dragX, s.dragY), k = dm > most * 2.4 ? (most * 2.4) / dm : 1, dx = s.dragX * k, dy = s.dragY * k; s.dragX -= dx; s.dragY -= dy; const sm = Math.hypot(input.sx || 0, input.sy || 0), q = sm > 1 ? 1 / sm : 1;
    p.x = A.clamp(p.x + dx + (input.sx || 0) * q * most, 18, W - 18); p.y = A.clamp(p.y + dy + (input.sy || 0) * q * most, 80, H - 30);
    if (input.act && !s.core.shot) { s.gun = (s.gun + 1) % s.guns.length; s.cool = Math.max(s.cool, 0.08); s.ev.push("swap"); }
    // The dash: a short burst the way you're moving (up if still), or straight to a point (`input.dash = { x, y }`, from a
    // double-tap: up to N.dashFar away, eased out); nothing can hit you during it.
    s.dashCd -= dt; const mv = Math.hypot(p.x - p.px + dx + (input.sx || 0), p.y - p.py + dy + (input.sy || 0)); if (mv > 0.4) s.dir = [(dx + (input.sx || 0)) / (Math.hypot(dx + (input.sx || 0), dy + (input.sy || 0)) || 1), (dy + (input.sy || 0)) / (Math.hypot(dx + (input.sx || 0), dy + (input.sy || 0)) || 1)];
    if (input.dash && s.dashCd <= 0) { s.dashCd = (s.rig === "ghost" ? Math.max(0.45, (N.dash - 0.4 * s.thrust) / 2) : Math.max(0.8, N.dash - 0.4 * s.thrust)) * (inHand(s) === "ram" ? 0.7 : 1); s.dashT = N.dashT; s.rammed = new Set(); s.safe = Math.max(s.safe, N.dashT + 0.16); s.dashTo = null;
      if (input.dash.x != null) { const ex = input.dash.x - p.x, ey = input.dash.y - p.y, d = Math.hypot(ex, ey), k = d > (s.far || N.dashFar) ? (s.far || N.dashFar) / d : 1; if (d > 8) { s.dir = [ex / d, ey / d]; s.dashTo = { x0: p.x, y0: p.y, x: A.clamp(p.x + ex * k, 18, W - 18), y: A.clamp(p.y + ey * k, 80, H - 30) }; } }
      s.ev.push("dash"); }
    // Ram Prow: a dash rams everything it passes through; Mk II widens it and leaves a blast ring where it ends.
    if (s.dashT > 0 && inHand(s) === "ram") { const M = mods(s, "ram"), R = 34 * M.wide; for (const e of s.en) if (!e.gone && e.kind !== "fake" && !s.rammed.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) < e.r + R) { s.rammed.add(e.id); wound(s, e, GUNS.ram.ram * power(s) * M.dmg, "ram"); s.ev.push({ ram: 1, x: e.x, y: e.y }); } if (s.dashT <= dt * 1.5 && M.wide > 1 && !s.rammed.has(-1)) { s.rammed.add(-1); ring(s, p.x, p.y, 120, 10 * power(s) * M.dmg); } }
    if (s.dashT > 0 && s.dashTo) { s.dashT -= dt; const f = 1 - Math.pow(Math.max(0, s.dashT / N.dashT), 2.2), q = s.dashTo; p.x = q.x0 + (q.x - q.x0) * f; p.y = q.y0 + (q.y - q.y0) * f; s.dragX = s.dragY = 0; if (s.dashT <= 0) s.dashTo = null; }
    else if (s.dashT > 0) { const v = N.dashV * 1.8 * Math.pow(Math.max(0, s.dashT / N.dashT), 0.8); s.dashT -= dt; p.x = A.clamp(p.x + s.dir[0] * v * dt, 18, W - 18); p.y = A.clamp(p.y + s.dir[1] * v * dt, 80, H - 30); }
    const spd = Math.hypot(p.x - p.px, p.y - p.py) / dt; s.spd += (spd - s.spd) * Math.min(1, dt * 8); s.still = spd < 45 ? s.still + dt : 0; s.steady = A.clamp(s.steady + (spd < 120 ? dt * 1.6 : -dt * 3.2), 0, 1); s.past.push([p.x, p.y]); if (s.past.length > 84) s.past.shift();
    const before = s.spd; if (s.core.trigger === "sling") s.spd = spd; // winding reads the true speed
    s.fever = Math.min(2, s.fever + dt * 0.055); s.clean += dt; if ((s.tailT -= dt) <= 0) s.tailN = 0; s.eyeT -= dt; s.odT = Math.max(0, s.odT - dt); shoot(s, dt);
    for (const c of s.coins) { c.left -= dt; const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < 24) { c.left = 0; s.stamps++; s.coinN = (s.coinN || 0) + 1; s.ev.push({ coin: 1, x: c.x, y: c.y }); continue; } if (d < s.magnet) { const v = 520 + (s.magnet - d) * 4; c.vx = ((p.x - c.x) / d) * v; c.vy = ((p.y - c.y) / d) * v; } else { c.vx -= c.vx * 2.2 * dt; c.vy += (75 - c.vy) * 1.8 * dt; } c.x = A.clamp(c.x + c.vx * dt, 10, W - 10); c.y += c.vy * dt; } if (s.coins.length) s.coins = s.coins.filter((c) => c.left > 0 && c.y < H + 20);
    for (const k of s.packs) { k.left -= dt; k.y += 70 * dt; if (Math.hypot(k.x - p.x, k.y - p.y) < 40 && k.gun) { k.left = 0; // A crate fills your other slot (audit, 24 Nov 2026): the gun you're firing never changes mid-fight; tap the slot to try it.
      let slot = s.gun; if (!s.core.shot && !s.guns.includes(k.gun)) { slot = s.guns.length > 1 ? 1 - s.gun : s.guns.length; s.guns[slot] = k.gun; if (slot === s.gun) { s.cool = 0; s.shots = s.shots.filter((b) => !b.orbit); } } s.ev.push({ gotgun: k.gun, x: k.x, y: k.y, slot }); } else if (Math.hypot(k.x - p.x, k.y - p.y) < 40) { k.left = 0; const heal = s.hull < s.hullMax; s.packsN = (s.packsN || 0) + 1; if (heal) s.hull++; else s.score += 100; s.ev.push({ pack: 1, x: k.x, y: k.y, heal }); } } s.packs = s.packs.filter((k) => k.left > 0 && k.y < H + 30); s.spd = before;
    if (lv(s, "skin") && s.guard < lv(s, "skin")) { s.skinT += dt; if (s.skinT > regrowSecs(s)) { s.skinT = 0; s.guard++; s.ev.push("guardup"); } }
    if (has(s, "water") && s.clean > 10) { s.clean = 0; s.bad.length = 0; s.ev.push("bell"); s.ev.push({ wash: 900 }); }
    if (lv(s, "small") && (s.smallT -= dt) <= 0) { s.smallT = 5; ring(s, p.x, p.y, 85 + 22 * lv(s, "small"), 8 * lv(s, "small")); }
    // Drones sit beside the ship and fire by themselves.
    s.drones = Array.from({ length: lv(s, "drone") }, (_, i) => [p.x + [-46, 46, 0][i], p.y + [10, 10, 46][i]]); s.wings = wingSpots(s).map(([dx, dy]) => [p.x + dx, p.y + dy]); s.droneT = (s.droneT || 0) - dt; if (s.drones.length && s.droneT <= 0) { s.droneT = 0.34; for (const [x, y] of s.drones) s.shots.push({ x, y: y - 10, vx: 0, vy: -900, r: 4, dmg: 0.85 * power(s) * (has(s, "firefly") ? 2 : 1), burn: has(s, "firefly"), life: 2, gun: "drone" }); } if (has(s, "choir") && s.drones.length && (s.choirT -= dt) <= 0) { s.choirT = 3.2; for (const [x, y] of s.drones) ring(s, x, y, 70, 9); }
    // Bast flies cover in the boss fight if you helped earlier.
    if (s.ally && s.run && s.run.phase === "boss" && s.en.some((e) => e.kind === "boss" && e.y >= 150)) { s.allyX = W * 0.14 + Math.sin(s.t * 0.9) * 34; s.allyY = H * 0.72 + Math.cos(s.t * 1.3) * 20; if ((s.allyT -= dt) <= 0) { s.allyT = 0.32; s.shots.push({ x: s.allyX, y: s.allyY - 30, vx: 0, vy: -1300, r: 5, dmg: 0.62, life: 1.2, gun: "ally" }); } } else s.allyX = null;
    if (s.foes) { s.next -= dt; if (s.next <= 0 && (s.run || s.t < s.secs - 4)) wave(s); }
    // Time: Stillness slows the sky when a shot is nearly there; the Eye slows red shots.
    let w = 1; if (s.core.rule === "still") { const close = s.safe <= 0 && s.bad.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 58); if (close && s.time > 0.05 && (s.slow > 0 || s.time > 0.5)) { s.slow = 1; s.time = Math.max(0, s.time - dt); w = 0.42; } else { s.slow = 0; s.time = Math.min(1.5, s.time + dt * 0.3); } } const wb = w * (s.eyeT > 0 ? 0.5 : 1), de = dt * w;
    for (const e of s.en) {
      if (e.gone) continue; e.t += de; e.hurt = Math.max(0, e.hurt - dt); e.fire -= de; if (e.burn > 0) { e.burn -= dt; wound(s, e, (1.3 * Math.max(1, lv(s, "cinder")) + 0.8) * fx(s) * (e.kind === "boss" ? 1.5 : 1) * dt, "burn"); if (e.gone) continue; }
      if (e.kind === "boss") bossStep(s, e, de);
      else if (e.kind === "arm") { const b = s.en.find((o) => o.id === e.owner); if (!b || b.gone) { e.gone = true; continue; } e.x = b.x + e.side * 132; e.y = b.y + 34 + Math.sin(e.t * 2 + e.side) * 8; }
      else if (e.kind === "fake") { if (!s.en.some((o) => o.kind === "boss" && !o.gone)) e.gone = true; }
      else if (e.kind === "pin") { e.left -= de; if (e.left <= 0) e.gone = true; }
      else if (e.kind === "seal") { const b = s.en.find((o) => o.id === e.owner); if (!b || b.gone || !(b.guard > 0)) { e.gone = true; continue; } e.set = Math.max(0, e.set - de); const k = 1 - e.set / GUARD.set, q = k * k * (3 - 2 * k), hx = e.x0 + Math.sin(e.t * 0.8 + e.ph) * 22, hy = e.y0 + Math.cos(e.t * 0.6 + e.ph) * 10; e.x = e.sx + (hx - e.sx) * q; e.y = e.sy + (hy - e.sy) * q; }
      else if (e.kind === "skiff") { e.y += 118 * de; e.x = A.clamp(e.x0 + Math.sin(e.t * 1.7 + (e.ph || 0)) * (e.amp || 0), 24, W - 24); if (e.fire <= 0 && e.y > 30 && e.y < H * 0.62) { e.fire = 1.9 / Math.sqrt(tier(s).pace); orb(s, e.x, e.y + 20, aim(s, e), 235); s.ev.push("foe"); } }
      else if (e.kind === "darter") { if (e.y < e.hover) e.y += 260 * de; else if (!e.dive) { e.wait = (e.wait ?? 0.55) - de; if (e.wait <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.dive = [Math.cos(a) * 640, Math.sin(a) * 640]; s.ev.push("dive"); } } else { e.x += e.dive[0] * de; e.y += e.dive[1] * de; if (e.x < -40 || e.x > W + 40) e.gone = true; } }
      else if (e.kind === "weaver") { e.y += 95 * de; e.x = A.clamp(e.x0 + Math.sin(e.t * 1.9) * 120, 26, W - 26); e.trail = e.trail || []; e.trail.unshift([e.x, e.y]); if (e.trail.length > 90) e.trail.pop(); }
      else if (e.kind === "seg") { const h = s.en.find((o) => o.id === e.head); if (!h || h.gone) { e.gone = true; continue; } const pt = h.trail && h.trail[Math.min(h.trail.length - 1, e.i * 12)]; if (pt) { e.x = pt[0]; e.y = pt[1]; } if (e.fire <= 0 && e.y > 40 && e.y < H * 0.7) { e.fire = 3.1 + e.i * 0.15; orb(s, e.x, e.y, (e.i % 2 ? 0 : 3.14) + (s.rand() - 0.5) * 0.3, 140); } }
      else if (e.kind === "shield") { if (e.sh != null && e.sh < e.shMax && (e.shT -= de) <= 0) e.sh = Math.min(e.shMax, e.sh + e.shMax * SHIELD.grow * de); e.y += 62 * de; e.x += A.clamp(p.x - e.x, -1, 1) * 30 * de; if (e.fire <= 0 && e.y > 40 && e.y < H * 0.62) { e.fire = 2; fan(s, e, 2, 0.3, 205, e.x, e.y + 30); } }
      else if (e.kind === "splitter") { e.y += 85 * de; e.x = A.clamp(e.x0 + Math.sin(e.t * 1.2) * 60, 30, W - 30); if (e.fire <= 0 && e.y > 40 && e.y < H * 0.6) { e.fire = 2.2; orb(s, e.x, e.y + 26, aim(s, e), 220); } }
      else if (e.kind === "mini") { e.y += 160 * de; e.x += A.clamp(p.x - e.x, -1, 1) * 90 * de; }
      else if (e.kind === "carrier") { e.y = Math.min(e.y + 55 * de, 210); e.x = A.clamp(e.x0 + Math.sin(e.t * 0.7) * 90, 40, W - 40); if (e.fire <= 0 && e.y > 60) { e.fire = 2.8; for (const sd of [-1, 1]) add(s, "rocket", e.x + sd * 28, e.y + 20, { vx: sd * 120, vy: 60 }); s.ev.push("launch"); } if (e.t > 16) { e.y -= 300 * de; if (e.y < -60) e.gone = true; } }
      else if (e.kind === "rocket") { const a = Math.atan2(p.y - e.y, p.x - e.x), kk = Math.min(1, de * 1.6); e.vx += (Math.cos(a) * 230 - e.vx) * kk; e.vy += (Math.sin(a) * 230 - e.vy) * kk; e.x += e.vx * de; e.y += e.vy * de; if (e.t > 6) e.gone = true; }
      else if (e.kind === "phantom") { e.y = Math.min(e.y + 90 * de, e.rest); e.cycle = (e.cycle ?? 1.6) - de; if (e.cycle <= 0) { e.fade = e.fade > 0 ? 0 : 1; e.cycle = e.fade ? 1.25 : 1.7; if (!e.fade) { e.x = 50 + s.rand() * (W - 100); const n = 8; for (let i = 0; i < n; i++) orb(s, e.x, e.y, (i / n) * 6.28 + e.t, 150); s.ev.push("appear"); } } if (e.t > 15) e.gone = true; }
      else if (e.kind === "skimmer") { e.x += e.dir * 175 * de; e.y += Math.sin(e.t * 2.4) * 18 * de; if (e.fire <= 0 && e.x > 20 && e.x < W - 20) { e.fire = 0.46 / Math.sqrt(tier(s).pace); orb(s, e.x, e.y + 18, 1.5708, 150); } if ((e.dir > 0 && e.x > W + 60) || (e.dir < 0 && e.x < -60)) e.gone = true; }
      else if (e.kind === "prism") { e.y = Math.min(e.y + 80 * de, e.rest); if (e.fire <= 0 && e.y >= e.rest - 4) { e.fire = 3.1 / Math.sqrt(tier(s).pace); orb(s, e.x, e.y + 24, aim(s, e), 175, { r: 12, split: 0.45 }); s.ev.push("foe"); } if (e.t > 14) { e.y -= 320 * de; if (e.y < -60) e.gone = true; } }
      else if (e.kind === "chimer") { e.y = Math.min(e.y + 95 * de, e.rest); if (e.y >= e.rest - 4) { if (e.glow > 0) { e.glow -= de; if (e.glow <= 0) { const n = 16, g0 = Math.floor(s.rand() * n); for (let i = 0; i < n; i++) if (i !== g0 && i !== (g0 + 1) % n) orb(s, e.x, e.y, (i / n) * 6.283 + e.t, 120); s.ev.push("bell"); } } else if (e.fire <= 0) { e.fire = 2.9 / Math.sqrt(tier(s).pace); e.glow = 0.55; s.ev.push("arm"); } } if (e.t > 13) { e.y -= 300 * de; if (e.y < -60) e.gone = true; } }
      else if (e.kind === "clapper") { e.py = Math.min((e.py ?? -30) + 32 * de, 60); const a = 0.95 * Math.sin(e.t * 1.6 + e.ph); e.ang = a; e.x = A.clamp(e.x0 + Math.sin(a) * e.len, 24, W - 24); e.y = e.py + Math.cos(a) * e.len; if (e.fire <= 0 && e.y > 40) { e.fire = 0.42 / Math.sqrt(tier(s).pace); const out = 1.5708 - a, sw = Math.cos(e.t * 1.6 + e.ph) > 0 ? 1 : -1; orb(s, e.x, e.y + 16, out - sw * 0.35, 175); } if (e.t > 15) { e.py -= 220 * de; if (e.y < -60) e.gone = true; } }
      else if (e.kind === "turret") { e.y += 52 * de; if (e.fire <= 0 && e.y > 20 && e.y < H * 0.7) { e.fire = 2.3; fan(s, e, 3, 0.22, 190, e.x, e.y); } }
      else if (e.kind === "lancer") { if (e.beam > 0) { e.beam -= de; for (const [x, y] of bodies(s)) if (Math.abs(x - e.x) < 13 && y > e.y) hit(s); } else if (e.tele > 0) { e.tele -= de; if (e.tele <= 0) e.beam = 0.28; } else { if (e.y < e.rest) e.y += 130 * de; else { e.x += A.clamp(p.x - e.x, -1, 1) * 62 * de; if (e.fire <= 0) { e.fire = 2.6; e.tele = 0.85; s.ev.push("arm"); } } } if (e.t > 13) { e.y -= 300 * de; if (e.y < -60) e.gone = true; } }
      else { e.y += 78 * de; e.x += A.clamp(p.x - e.x, -1, 1) * 46 * de; const d = Math.hypot(p.x - e.x, p.y - e.y); if (e.fuse == null && d < 105) { e.fuse = 0.65; s.ev.push("arm"); } if (e.fuse != null && (e.fuse -= de) <= 0) { e.gone = true; for (let i = 0; i < 10; i++) orb(s, e.x, e.y, i * 0.628, 190); s.ev.push({ boom: 1, x: e.x, y: e.y }); } }
      if (!e.gone && e.kind !== "pin" && e.kind !== "seal" && !(e.kind === "phantom" && e.fade > 0)) for (const [x, y] of bodies(s)) if (Math.hypot(x - e.x, y - e.y) < e.r * 0.9 + dot(s)) { hit(s); if (e.kind === "mine") e.gone = true; }
    }
    const live = s.en.filter((e) => !e.gone && e.y > -70);
    for (const l of s.lanes) { l.tele -= de; if (l.tele <= 0 && !l.done) { l.done = true; for (let i = -1; i <= 1; i++) for (let j = 0; j < 5; j++) orb(s, l.x + i * 30, -10 - j * 34, 1.5708, 400); s.ev.push({ slam: 1, x: l.x }); } } s.lanes = s.lanes.filter((l) => !l.done);
    if (s.waves.length) wavesStep(s, de);
    for (const v of s.walls) { if (!s.en.some((e) => e.id === v.a && !e.gone) || !s.en.some((e) => e.id === v.b && !e.gone)) { v.gone = true; continue; } if (v.tele > 0) v.tele -= de; else { v.left -= de; if (v.left <= 0) v.gone = true; else for (const [x, y] of bodies(s)) if (segDist(x, y, v) < dot(s) + 4) hit(s); } } s.walls = s.walls.filter((v) => !v.gone);
    const trk = 0.75 * lv(s, "track"); // Tracking: shots lean toward the nearest enemy ahead, at most this many radians a second
    for (const b of s.shots) {
      b.life -= dt;
      if (b.orbit) { if (inHand(s) !== b.gun || s.over) { b.life = 0; continue; } b.life = 99; b.ang += 7 * dt * Math.min(2, rate(s)); b.x = p.x + Math.cos(b.ang) * (b.ring || 86); b.y = p.y + Math.sin(b.ang) * (b.ring || 86) * 0.9; b.cut -= dt;
        for (const e of live) if (!e.gone && Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r && s.t - (b.hit[e.id] ?? -9) > 0.1 / rate(s)) { b.hit[e.id] = s.t; wound(s, e, b.dmg, "shot"); }
        if (b.cut <= 0) for (const q of s.bad) if (!q.gone && !q.rock && Math.hypot(q.x - b.x, q.y - b.y) < b.r + q.r) { q.gone = true; b.cut = (b.cutEvery || 0.18) / rate(s); s.ev.push("clink"); break; }
        continue; }
      if (b.bounce && ((b.x < 8 && b.vx < 0) || (b.x > W - 8 && b.vx > 0))) { b.vx = -b.vx; b.bounce--; }
      if (b.wave) { b.wt += dt; b.vx = Math.sin(b.wt * 9) * b.wave; } // Wave Gun: the two shots swing out and cross
      // Lodestone: pulls red shots in and swallows them; after six (or at the end of its flight) it bursts.
      if (b.lode) { b.vy *= 1 - 0.9 * dt; for (const q of s.bad) if (!q.gone && !q.rock) { const gx = b.x - q.x, gy = b.y - q.y, gd = Math.hypot(gx, gy) || 1; if (gd < b.r + q.r + 4) { q.gone = true; b.ate = (b.ate || 0) + 1; } else if (gd < b.lode) { const kk = 3200 * (1 - gd / b.lode) * dt, dmp = 1 - Math.min(0.5, 3 * dt); q.vx = q.vx * dmp + (gx / gd) * kk; q.vy = q.vy * dmp + (gy / gd) * kk; } } if ((b.ate || 0) >= 6 || b.life <= 0) { blast(s, b.x, b.y, 95 * reach(s), b.dmg * 2.5); s.ev.push({ lode: b.ate || 0, x: b.x, y: b.y }); b.life = 0; continue; } }
      if (b.nova && b.life <= 0) { for (let i = 0; i < b.nova; i++) { const a = (i / b.nova) * 6.283; s.shots.push({ x: b.x, y: b.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6 * reach(s), dmg: b.dmg * 0.7, life: 0.4, gun: "shard" }); } s.ev.push({ nova: 1, x: b.x, y: b.y }); b.nova = 0; continue; }
      // Seekers never chase a map pin (pins fade by themselves): chasing pins kept the Mapmaker alive for minutes (swarm core, 24 Nov 2026).
      if (b.seek && live.length) { let t = null, best = 1e9; for (const e of live) if (e.kind !== "fake") { const d = Math.hypot(e.x - b.x, e.y - b.y) + (e.kind === "pin" ? 9e8 : 0); if (d < best) { best = d; t = e; } } if (t) steer(b, t, 560, 1.2, dt, 0.9); }
      if (b.back != null) { b.vy += 1300 * dt; if (b.vy > 0 && !b.back) { b.back = 1; b.seen.clear(); } if (b.back) { const a = Math.atan2(p.y - b.y, p.x - b.x), v = Math.min(900, Math.max(300, b.vy)); b.vx += (Math.cos(a) * v - b.vx) * Math.min(1, dt * 9); b.vy += (Math.sin(a) * v - b.vy) * Math.min(1, dt * 9); if (Math.hypot(p.x - b.x, p.y - b.y) < 46) { b.life = 0; s.cool = Math.min(s.cool, 0.07); s.ev.push("catch"); } } }
      b.x += b.vx * dt; b.y += b.vy * dt; const o = { x: b.x, y: b.y, r: b.r, vx: b.vx, vy: b.vy };
      if (trk && !b.seek && !b.boom && b.back == null && b.vy < 0) { const e = near(s, b.x, b.y, 520); if (e && e.y < b.y) steer(b, e, Math.hypot(b.vx, b.vy), trk, dt, 0.95); }
      if (b.home && live.length) { const t = near(s, b.x, b.y, 700); if (t) steer(b, t, 620, 1.2, dt); }
      if (b.flak && b.life <= 0) { if (b.pop) blast(s, b.x, b.y, 64 * reach(s), b.dmg * b.pop); for (let i = 0; i < b.flak; i++) { const a = -1.57 + (i - (b.flak - 1) / 2) * 0.32; s.shots.push({ x: b.x, y: b.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 4 * reach(s), dmg: b.dmg * 0.55, life: 0.32, gun: "pellet" }); } b.flak = 0; continue; }
      if (b.boom) { if (b.arm > 0) b.arm -= dt; if (b.life <= 0 || (!(b.arm > 0) && live.some((e) => !e.gone && Math.hypot(e.x - b.x, e.y - b.y) < e.r + (b.prox || 0)))) { b.life = 0; blast(s, b.x, b.y, 78 * reach(s) * (b.wide || 1), b.boom); if (lv(s, "cinder")) for (const e of live) if (Math.hypot(e.x - b.x, e.y - b.y) < 78 + e.r) e.burn = Math.max(e.burn, 2); } continue; }
      for (const e of live) if (!e.gone && b.life > 0 && !(b.seen && b.seen.has(e.id)) && A.swept(o, { x: e.x, y: e.y, r: e.r, vx: 0, vy: 0 }, dt)) { if (b.back != null) b.seen.set(e.id, 1); else if (b.seen && b.pierce > 0) { b.seen.add(e.id); b.pierce--; } else if (b.flak) { b.life = 0; } else b.life = 0; if (b.burn) e.burn = Math.max(e.burn, 2); if (b.pop && !b.flak) blast(s, b.x, b.y, 56 * reach(s), b.dmg * b.pop, e); wound(s, e, b.flak ? b.dmg * (1 + 0.28 * b.flak) : b.dmg, e.kind === "shield" && !b.seek && b.back == null && b.vy < -150 && b.y > e.y - 6 && Math.abs(b.x - e.x) < e.r * 0.9 ? "front" : "shot", Math.atan2(b.y - e.y, b.x - e.x)); }
    }
    for (const m of s.beams) { m.left -= dt; m.w = (5 + m.w0 * 0.6 + 9 * s.steady) * reach(s); const pw = m.dps * (BEAM.low + BEAM.steady * s.steady) * m.q * (s.core.trigger === "sling" ? 1 : rate(s)); let y = -40, first = null; for (const e of live) if (!e.gone && Math.abs(e.x - m.x) < e.r + m.w && e.y < p.y && e.y > y) { y = e.y; first = e; } m.y0 = p.y - 34; m.y1 = first ? first.y + first.r * 0.5 : -20; if (first) wound(s, first, pw * dt, first.kind === "shield" && (first.sh == null || first.sh > 0) ? "front" : lv(s, "cinder") ? "shot" : "beam"); } s.beams = s.beams.filter((m) => m.left > 0);
    if (s.core.rule === "bell") { s.bellAt -= dt; if (s.bellAt <= 0) { s.bellAt = 4.2; ring(s, p.x, p.y, Math.min(300, 150 + s.grazes * 1.4), 46); s.ev.push("bell"); } }
    for (const r of s.bells) { r.r += 420 * dt; for (const b of s.bad) if (!b.gone && Math.hypot(b.x - r.x, b.y - r.y) < r.r) { b.gone = true; s.eaten = (s.eaten || 0) + 1; } for (const e of live) if (!e.gone && !r.seen.has(e.id) && Math.hypot(e.x - r.x, e.y - r.y) < r.r + e.r) { r.seen.add(e.id); if (r.burn) e.burn = Math.max(e.burn, 3); wound(s, e, r.dmg, "ring"); } } s.bells = s.bells.filter((r) => r.r < r.max);
    if (s.core.rule === "star") { s.starT = (s.starT || 0) - dt; const bo = s.starBoss; if (s.debt > 0 && s.starT <= 0 && bo && !bo.gone) { s.debt = 0; s.starT = STAR.boss; star(s, bo.x + (s.rand() - 0.5) * 150, bo.y + 70 + s.rand() * 100); } }
    for (const z of s.stars) { z.left -= dt; z.age += dt; if (z.eat > 0) for (const b of s.bad) if (!b.gone && Math.hypot(b.x - z.x, b.y - z.y) < z.r) { b.gone = true; s.eaten = (s.eaten || 0) + 1; if (--z.eat <= 0) { z.left = Math.min(z.left, 0.3); s.ev.push({ starOut: 1, x: z.x, y: z.y }); break; } } for (const e of live) if (!e.gone && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) wound(s, e, STAR.burn * fx(s) * dt, "star");
      if (z.eat > 0 && z.age > STAR.ripe && Math.hypot(p.x - z.x, p.y - z.y) < z.r + 10) { z.left = 0; ring(s, z.x, z.y, STAR.ring, STAR.hit * fx(s), { col: "#ffd23f" }); s.ev.push({ caught: 1, x: z.x, y: z.y }); } } s.stars = s.stars.filter((z) => z.left > 0);
    for (const a of s.arcs) a.left -= dt; s.arcs = s.arcs.filter((a) => a.left > 0); for (const a of s.blasts) a.left -= dt; s.blasts = s.blasts.filter((a) => a.left > 0);
    const gr = N.graze * (s.core.trigger === "dare" ? 1.9 : 1) * (s.rig === "ghost" ? 1.35 : 1) * (1 + 0.28 * lv(s, "knife"));
    const sky = s.run && s.run.phase === "room" ? s.run.sky : null, drift = sky === "tide" ? s.run.tide || 0 : 0;
    for (const b of s.bad) {
      if (b.gone) continue; if (b.split != null && (b.split -= dt * wb) <= 0) { b.gone = true; const a = Math.atan2(b.vy, b.vx), v = Math.hypot(b.vx, b.vy) * 0.95; for (let i = -2; i <= 2; i++) if (s.bad.length < N.cap) s.bad.push({ id: s.id++, x: b.x, y: b.y, vx: Math.cos(a + i * 0.3) * v, vy: Math.sin(a + i * 0.3) * v, r: 8 }); continue; }
      if (drift && !b.rock) b.x += drift * dt * wb;
      // The gravity well bends red shots toward it and swallows any that reach its middle.
      if (sky === "well" && s.run.well) { const wl = s.run.well, gx = wl.x - b.x, gy = wl.y - b.y, gd = Math.hypot(gx, gy); if (gd < 22) { b.gone = true; continue; } if (gd < 280) { const k = 520 * (1 - gd / 280) * dt * wb; b.vx += (gx / gd) * k; b.vy += (gy / gd) * k; } } if (sky === "glass" && !b.bounced && ((b.x < 10 && b.vx < 0) || (b.x > W - 10 && b.vx > 0))) { b.vx = -b.vx; b.bounced = true; }
      if (b.disc) { b.vy += b.disc * dt * wb; b.left -= dt; if (b.left <= 0) b.gone = true; } b.x += b.vx * dt * wb; b.y += b.vy * dt * wb; let d = 1e9, struck = false;
      for (const [x, y, m] of bodies(s)) { d = Math.min(d, Math.hypot(b.x - x, b.y - y)); if (A.swept({ x: b.x, y: b.y, r: b.r * 0.7, vx: b.vx * wb, vy: b.vy * wb }, { x, y, r: dot(s), vx: (m * (p.x - p.px)) / dt, vy: (p.y - p.py) / dt }, dt)) struck = true; }
      if (struck) { if (s.safe <= 0) { b.gone = true; hit(s); } } else if (!b.near && s.safe <= 0 && d < b.r + gr) { b.near = true; graze(s, b); }
    }
    s.shots = s.shots.filter((b) => b.life > 0 && b.y > -50); s.bad = s.bad.filter((b) => !b.gone && b.x > -30 && b.x < W + 30 && b.y > -240 && b.y < H + 30); s.en = s.en.filter((e) => !e.gone && e.y < H + 50);
    if (s.run) runStep(s, dt); else if (s.boss && s.t > 200 && !s.over) { s.over = "late"; s.ev.push("late"); }
    if (!s.run && s.foes && s.t >= s.secs && !s.over) { s.over = "done"; s.ev.push("done"); }
    return s;
  }
  // The campaign carries the whole rocket: upgrades and forks, crossings, guns and their Mk, cores, hull, shields, rerolls.
  const snap = (s) => ({ p: { ...s.p }, fus: [...s.fus], guns: s.guns.slice(), gun: s.gun, gunLv: { ...s.gunLv }, core: { ...s.core }, hullMax: s.hullMax, hull: s.hull, guard: s.guard, rerolls: s.rerolls, rig: s.rig });
  // Power a carried rocket brings: every upgrade level, every Mk, 2 a core and 2 a crossing.
  const powerOf = (c) => Object.values(c.p || {}).reduce((a, b) => a + b, 0) + Object.values(c.gunLv || {}).reduce((a, b) => a + b, 0) + 2 * Object.values(c.core || {}).filter(Boolean).length + 2 * (c.fus || []).length;
  function applyCarry(s, c) { s.p = { ...c.p }; s.fus = [...(c.fus || [])]; s.guns = c.guns.filter((k) => GUNS[k]).slice(0, 2); s.gun = Math.min(c.gun || 0, s.guns.length - 1); s.gunLv = { ...c.gunLv }; s.core = { trigger: null, shot: null, rule: null, ...c.core }; s.hullMax = Math.max(1, c.hullMax); s.hull = Math.min(s.hullMax, c.hull + 2); s.guard = Math.max(s.guard, c.guard || 0); s.rerolls = (c.rerolls || 0) + 1; }
  const marks = (s) => Math.round(4 + (s.run && s.run.rooms >= 8 ? 0 : s.kills / 30) + (s.run ? (s.run.act - 1) * 10 + (s.run.rooms >= 8 ? s.run.room * 1.5 : 0) + (s.over === "won" ? 25 + (s.run.act - 1) * 10 : 0) + s.stamps : 0));
  // The belt a flight earns: rec = { room: levels cleared, beat: boss beaten, hits, exam }. Belts only go up.
  function beltOf(rec) { let b = 0; if (rec.room >= 3) b = 1; if (rec.room >= 10 || rec.beat) b = 2; if (rec.beat) b = 3; if (rec.beat && rec.hits <= 3) b = 4; if (rec.beat && rec.exam >= 1) b = Math.max(b, 4 + Math.min(4, rec.exam)); return b; }
  // Flight orders: three small goals for one flight, kept between runs; each pays ORDER_PAY stamps when the flight ends.
  // Targets grow a little with the series. `got(s)` reads the finished (or running) flight.
  const KEEP_LV = 2, ORDER_PAY = 8, ORDERS = {
    kills: { n: [50, 70, 90], what: (n) => `Wreck ${n} ships`, got: (s) => s.kills },
    grazes: { n: [20, 30, 40], what: (n) => `Make ${n} close calls`, got: (s) => s.grazes },
    flawless: { n: [2, 3, 3], what: (n) => `Clear ${n} levels without a hit`, got: (s) => s.flawless || 0 },
    od: { n: [1, 2, 2], what: (n) => `Set off Overdrive ${n === 1 ? "once" : `${n} times`}`, got: (s) => s.odN || 0 },
    events: { n: [2, 2, 3], what: (n) => `Fly through ${n} "?" gates`, got: (s) => (s.run ? s.run.seenEv.length : 0) },
    reach: { n: [7, 6, 6], what: (n) => `Reach level ${n}`, got: (s) => (s.run ? s.run.room + 1 : 0) },
    score: { n: [15000, 30000, 45000], what: (n) => `Score ${n.toLocaleString("en-US")}`, got: (s) => s.score },
    packs: { n: [1, 2, 2], what: (n) => `Pick up ${n === 1 ? "a repair kit" : `${n} repair kits`}`, got: (s) => s.packsN || 0 }
  };
  const order = (k, series) => ({ k, n: ORDERS[k].n[Math.max(0, Math.min(2, (series || 1) - 1))] });
  const orderDone = (o, s) => !!ORDERS[o.k] && ORDERS[o.k].got(s) >= o.n;
  const Sector = { MORTAR, STAR, YARDS, PRICE, gunPool, offerYard, KEEPER, MAP, plateAt, TOLL, SHIELD, spawnDuel, offerGates, CAMP, snap, powerOf, canLevel, forkOpen, forkTaken, crossOk, regrowSecs, ROADS, coresLeft, wingSpots, campMul, BEAM, GUARD, RIGS: D.RIGS, BOLD, offerParts, setLv, armoryOk, W, H, N, GAME2, RAMP2, GAME3, RAMP3, ECHO, SKYC, power, rate, mods, MODS: D.MODS, GUNS, ENEMIES, META, START, marks, roster, FOES, CORES, FAMILIES, SCHOOLS, PARTS, FUSIONS, PLAIN, BELTS: D.BELTS, BELT_RULES: D.BELT_RULES, BOSSES, SERIES, ROOMS, MAXLV, BIG, DUEL, canTake, eventsLeft, TOUGH, ORDERS, ORDER_PAY, KEEP_LV, order, orderDone, create, step, choose, choices, take, reroll, skip, decide, beltOf, orb, add, lv, spawnBoss, EVENTS, SKIES, RANKS, CAST: D.CAST, INTRO1, INTRO2, INTRO3 };
  if (node) module.exports = Sector; else root.Sector = Sector;
})(typeof window !== "undefined" ? window : globalThis);
