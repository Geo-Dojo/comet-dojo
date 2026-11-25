// Everything a run can be built from: cores (the major upgrades), the five schools' parts, fusions, gates and belts.
// Words and numbers only; src/sector.js makes them work.
(function (root) {
  "use strict";
  const CORES = {
    sling: { fam: "trigger", label: "Slingshot", up: "Moving winds it up. Stop, and it lets fly a storm.", down: "No steady fire." },
    echo: { fam: "trigger", label: "Echo", up: "Every shot fires again from where you were a moment ago.", down: "A third slower." },
    dare: { fam: "trigger", label: "Daredevil", up: "Each close call fires a burst, and close calls come easier.", down: "Slower guns." },
    fever: { fam: "trigger", label: "Fever", up: "The longer you go without a hit, the faster you fire, up to twice.", down: "A hit drops you below normal." },
    vanguard: { fam: "trigger", label: "Vanguard", up: "The higher up the sky you fly, the faster you fire.", down: "Weak if you hang back." },
    swarm: { fam: "shot", label: "Swarm", up: "Every shot of your gun becomes a seeker that hunts by itself.", down: "A little weaker." },
    boomer: { fam: "shot", label: "Boomerang", up: "Your shots become discs that cut through everything, out and back.", down: "Only a few in the air." },
    beam: { fam: "shot", label: "Beam", up: "Your gun becomes one unbroken beam, hotter the steadier you hold.", down: "Weak while you dart about." },
    mortar: { fam: "shot", label: "Mortar", up: "Your shots become shells that fly to the nearest enemy and burst.", down: "Slower to fire; shells reach two thirds of the sky and can't burst right in front of you." },
    chain: { fam: "shot", label: "Chain", up: "Your shots become lightning that leaps from enemy to enemy. No aiming.", down: "Short reach: get close." },
    twin: { fam: "rule", label: "Mirror", up: "A second ship mirrors you and fires too.", down: "Both can be hit." },
    star: { fam: "rule", label: "Starfall", up: "Wrecks leave stars that burn enemies and swallow 3 red shots each. Fly through one to burst it in a gold ring.", down: "Only 4 stars at once; shots hit a little softer." },
    bell: { fam: "rule", label: "Bell", up: "A bell rings every few seconds and sweeps red shots away.", down: "Your shots hit a little softer." },
    still: { fam: "rule", label: "Stillness", up: "When a red shot is about to hit, time slows for a breath.", down: "It needs time to come back." },
    thorn: { fam: "rule", label: "Thorn", up: "2 more hull, and each hit you take blasts everything near.", down: "Your shots hit softer." }
  };
  const FAMILIES = ["trigger", "shot", "rule"];
  // Guns. You carry two and swap between them; a "what you fire" core changes what every gun's shots become.
  const GUNS = {
    pulse: { label: "Pulse Gun", what: "Two steady streams", every: 0.11, shots: [[-11, 0], [11, 0]], v: 980, dmg: 1, r: 5, life: 2 },
    splinter: { label: "Splinter Gun", what: "Five short shots, strong up close", every: 0.2, shots: [[0, -0.3], [0, -0.15], [0, 0], [0, 0.15], [0, 0.3]], v: 820, dmg: 1.25, r: 5, life: 0.48 },
    lance: { label: "Long Lance", what: "Slow, heavy, goes through everything", every: 0.62, shots: [[0, 0]], v: 1500, dmg: 5, r: 9, life: 2, pierce: 9 },
    needle: { label: "Needler", what: "A fast, wobbly hail of needles", every: 0.055, shots: [[0, 0]], v: 1150, dmg: 0.58, r: 3.5, life: 1.2, wobble: 0.09 },
    flak: { label: "Flak", what: "Shells that burst into pellets", every: 0.48, shots: [[-8, -0.08], [8, 0.08]], v: 640, dmg: 1.1, r: 7, life: 0.5, flak: 6 },
    rail: { label: "Railgun", what: "Charges, then one line straight through", every: 0.95, shots: [[0, 0]], v: 3200, dmg: 10, r: 6, life: 0.4, pierce: 20 },
    ripper: { label: "Ripper", what: "Slow spinning saws that chew through", every: 0.42, shots: [[0, 0]], v: 430, dmg: 1.8, r: 13, life: 2.4, pierce: 4, saw: true },
    // Four that change how you fly, not just what comes out (owner, 23 Nov 2026).
    bounce: { label: "Bounce Shot", what: "One straight, two angled shots that bank off the side walls", every: 0.17, shots: [[0, 0], [-8, -0.62], [8, 0.62]], v: 900, dmg: 1.4, r: 5, life: 1.7, bounce: 2 },
    orbit: { label: "Orbit Blades", what: "Three blades circle you, cutting enemies and red shots", every: 0.4, shots: [[0, 0]], v: 0, dmg: 4.4, r: 15, life: 99, orbit: 3 },
    charge: { label: "Charge Cannon", what: "Charges fast while you hold still (slowly on the move); moving off or a full charge fires a blast through everything", every: 1.2, shots: [[0, 0]], v: 1300, dmg: 24, r: 8, life: 1.2, pierce: 20, charge: true },
    mines: { label: "Drift Mines", what: "Mines float up from you and burst when anything comes close", every: 0.62, shots: [[0, 0]], v: 120, dmg: 9, r: 10, life: 6, mine: true },
    // Three more (owner, 24 Nov 2026: "add a few more weapon types").
    arc: { label: "Arc Coil", what: "Lightning that jumps between up to three enemies near you", every: 0.22, shots: [[0, 0]], v: 900, dmg: 2.2, r: 5, life: 0.4, arc: 3, reachArc: 390 },
    wave: { label: "Wave Gun", what: "Two shots that weave across each other, covering a wide lane", every: 0.14, shots: [[-6, 0], [6, 0]], v: 860, dmg: 1.25, r: 6, life: 1.6, wave: 330 },
    nova: { label: "Nova Shell", what: "A slow shell that bursts into a ring of shards, hitting all round it", every: 0.46, shots: [[0, 0]], v: 640, dmg: 3.4, r: 10, life: 0.62, nova: 8 }
,
    // Three new kinds (owner, 24 Nov 2026, Nova Drift as a strategy reference): helpers, ramming and pulling.
    wing: { label: "Drone Wing", what: "Two drones fly beside you and fire darts at the nearest enemy", every: 0.3, shots: [[-46, 0], [46, 0]], v: 1000, dmg: 1.5, r: 4, life: 1.2, wing: 520 },
    ram: { label: "Ram Prow", what: "Short spikes up front; your dash rams through enemies for big damage, and comes back sooner", every: 0.16, shots: [[-7, -0.18], [0, 0], [7, 0.18]], v: 900, dmg: 1.6, r: 6, life: 0.32, ram: 30 },
    lode: { label: "Lodestone", what: "A slow stone that pulls red shots in and swallows them, then bursts", every: 0.85, shots: [[0, 0]], v: 260, dmg: 2.2, r: 13, life: 2.2, lode: 130, pierce: 30 }
  };
  // Gun upgrades (owner: "make the upgrades so the weapons do cool unique things, or more power, more damage, shoot faster"):
  // an armory gate also offers Mk II, then Mk III, of a gun you hold. Each level is plain data, applied in emit() in sector.js.
  const MODS = {
    pulse: [{ what: "A third stream down the middle", shots: [[0, 0]] }, { what: "30% harder", dmg: 1.3 }],
    splinter: [{ what: "Seven pellets, wider", shots: [[0, -0.45], [0, 0.45]] }, { what: "Pellets go through one enemy", pierce: 1 }],
    lance: [{ what: "Fires 35% faster", rate: 1.35 }, { what: "Every hit bursts in a blast", pop: 0.45 }],
    needle: [{ what: "40% harder", dmg: 1.4 }, { what: "Needles go through one enemy", pierce: 1 }],
    flak: [{ what: "Nine pellets a shell", flak: 3 }, { what: "Shells burst with a blast too", pop: 0.7 }],
    rail: [{ what: "Fires 30% faster", rate: 1.3 }, { what: "50% harder", dmg: 1.5 }],
    ripper: [{ what: "Saws 40% bigger", size: 1.4 }, { what: "Two saws at a time", shots: [[0, 0.3]] }],
    bounce: [{ what: "Shots bank four times", bounce: 2 }, { what: "Five shots", shots: [[-4, -0.32], [4, 0.32]] }],
    orbit: [{ what: "A fourth blade on a wider ring", orbit: 1 }, { what: "40% harder, cuts twice as often", dmg: 1.4, cut: 2 }],
    charge: [{ what: "Charges 40% faster", rate: 1.4 }, { what: "Blasts 40% harder and bigger", dmg: 1.4, size: 1.25 }],
    mines: [{ what: "Two mines at a time", shots: [[0, 0]] }, { what: "Blasts 50% wider", wide: 1.5 }],
    arc: [{ what: "Jumps to five enemies, further", arc: 2 }, { what: "40% harder", dmg: 1.4 }],
    wave: [{ what: "A third shot down the middle, wider waves", shots: [[0, 0]] }, { what: "Shots go through one enemy", pierce: 1 }],
    nova: [{ what: "Twelve shards a burst", nova: 4 }, { what: "Bursts 40% harder", dmg: 1.4 }]
,
    wing: [{ what: "A third drone behind you", shots: [[0, 46]] }, { what: "Darts 40% harder", dmg: 1.4 }],
    ram: [{ what: "Rams 40% wider and leave a blast ring", wide: 1.4 }, { what: "40% harder, spikes and ram", dmg: 1.4 }],
    lode: [{ what: "Pulls from 40% further", wide: 1.4 }, { what: "40% harder", dmg: 1.4 }]
  };
  // Enemies, each with its own way of shooting; series says when they first turn up.
  const ENEMIES = {
    skiff: { label: "Skiff", series: 1, gun: "One aimed shot" }, mine: { label: "Mine", series: 1, gun: "Rushes you, then bursts in a ring" }, darter: { label: "Darter", series: 1, gun: "No gun: it dives at you" },
    turret: { label: "Turret", series: 2, gun: "Fans of three" }, weaver: { label: "Weaver", series: 2, gun: "A long eel that sheds pellets sideways" }, shield: { label: "Shieldbearer", series: 2, gun: "Its front blocks shots: hit it from the side" },
    lancer: { label: "Lancer", series: 3, gun: "A warning line, then a laser" }, splitter: { label: "Splitter", series: 3, gun: "Breaks into three when wrecked" }, carrier: { label: "Carrier", series: 3, gun: "Launches rockets that chase you (shoot them)" }, phantom: { label: "Phantom", series: 3, gun: "Fades out; only hittable when solid" },
    // Only in the game's Series two, never in the lab.
    skimmer: { label: "Skimmer", series: 2, lab: false, gun: "Skims across, dropping a curtain behind it" }, prism: { label: "Prism", series: 2, lab: false, gun: "Its glass shot cracks into a fan of five" },
    // Only in the game's Series three, the Bellwake.
    chimer: { label: "Chimer", series: 3, lab: false, gun: "Glows, then rings out a slow circle of shots" }, clapper: { label: "Clapper", series: 3, lab: false, gun: "Swings on a chain, spraying shots along its swing" }
  };
  // The Dojo: what you keep between runs. Marks are earned in every run, won or lost. Most of it adds choices; a little adds strength.
  const META = {
    needle: { kind: "gun", label: "Needler", cost: 30 }, flak: { kind: "gun", label: "Flak", cost: 45 }, ripper: { kind: "gun", label: "Ripper", cost: 60 }, rail: { kind: "gun", label: "Railgun", cost: 100 }, orbit: { kind: "gun", label: "Orbit Blades", cost: 70 }, mines: { kind: "gun", label: "Drift Mines", cost: 70 }, charge: { kind: "gun", label: "Charge Cannon", cost: 80 }, arc: { kind: "gun", label: "Arc Coil", cost: 90 }, wave: { kind: "gun", label: "Wave Gun", cost: 70 }, wing: { kind: "gun", label: "Drone Wing", cost: 75 }, ram: { kind: "gun", label: "Ram Prow", cost: 65 }, lode: { kind: "gun", label: "Lodestone", cost: 80 }, nova: { kind: "gun", label: "Nova Shell", cost: 100 },
    fever: { kind: "core", label: "Fever core", cost: 45 }, vanguard: { kind: "core", label: "Vanguard core", cost: 60 }, mortar: { kind: "core", label: "Mortar core", cost: 50 }, chain: { kind: "core", label: "Chain core", cost: 70 }, still: { kind: "core", label: "Stillness core", cost: 60 }, thorn: { kind: "core", label: "Thorn core", cost: 50 },
   
    hull: { kind: "train", label: "Tough Hull", what: "+1 hull", cost: [60, 120, 210] }, aim: { kind: "train", label: "Steady Hands", what: "+5% damage", cost: [45, 105, 180] }, guard: { kind: "train", label: "Spare Guard", what: "Start with a guard", cost: [90] }, pockets: { kind: "train", label: "Deep Pockets", what: "+1 reroll", cost: [40, 80] }, third: { kind: "train", label: "Pathfinder", what: "The first reroll on every card is free", cost: [135] }, favourite: { kind: "train", label: "Old Favourite", what: "Start with one upgrade", cost: [105] }, loadout: { kind: "train", label: "Loadout", what: "Choose your two starting guns", cost: [50] }, thrust: { kind: "train", label: "Thrusters", what: "Dash recharges 0.4 s sooner", cost: [50, 110] }, second: { kind: "train", label: "Second Wind", what: "Once a run, a last hit leaves you 2 hull", cost: [180] }
    // Shop upgrades added 24 Nov 2026 (owner: "a storefront where you can buy permanent upgrades"). Each is small; prices climb.
    , magnet: { kind: "train", label: "Stamp Magnet", what: "Stamps are pulled in from 35% further", cost: [40, 90] }, medic: { kind: "train", label: "Field Medic", what: "Repair kits drop 60% more often", cost: [80] },
    nerves: { kind: "train", label: "Hot Nerves", what: "Overdrive lasts 1 s longer", cost: [60, 120] }, oil: { kind: "train", label: "Oiled Gears", what: "+5% fire rate", cost: [50, 110, 180] },
    reach: { kind: "train", label: "Long Dash", what: "Dashes go 20% further", cost: [70] }, heir: { kind: "train", label: "Heirloom", what: "Your keepsake starts at level 3, not 2", cost: [150] },
    dart: { kind: "rig", label: "Dart rig", cost: 60 }, ghost: { kind: "rig", label: "Ghost rig", cost: 80 }, tinker: { kind: "rig", label: "Tinker rig", cost: 90 }, scholar: { kind: "rig", label: "Scholar rig", cost: 110 }
  };
  // Starting rigs (third audit, 24 Nov 2026): how the rocket leaves the hangar. Each is a trade, never just stronger.
  // The rocket is always the rocket (owner); a rig changes its numbers and its trim colour. Courier and Hauler are free.
  const RIGS = {
    courier: { label: "Courier", color: "#7dfcff", up: "Balanced: 5 hull, two guns", down: "Nothing special" },
    hauler: { label: "Hauler", color: "#9fb4ff", up: "2 more hull and a guard", down: "Fires 15% slower" },
    dart: { label: "Dart", color: "#ff9a3d", up: "Starts at Damage 2 and Fire rate 1", down: "2 less hull" },
    ghost: { label: "Ghost", color: "#b48cff", up: "Dash twice as often; close calls come easier", down: "1 less hull" },
    tinker: { label: "Tinker", color: "#ffd23f", up: "Both guns start at Mk II; armories turn up far more", down: "1 less hull" },
    scholar: { label: "Scholar", color: "#5ff0a8", up: "Four upgrades on every card, and 1 more reroll", down: "No armory gates: you keep your guns" }
  };
  const START = { guns: ["pulse", "splinter", "lance", "bounce"], cores: ["sling", "echo", "dare", "swarm", "boomer", "beam", "twin", "star", "bell"], schools: ["ember", "tide", "gale", "bronze", "loom"] };
  // The five schools of the Dojo. A gate with a school's crest pays with a choice of three of its parts. Parts stack to three.
  const SCHOOLS = { ember: { label: "Ember", teach: "more damage", color: "#ff9a3d" }, tide: { label: "Tide", teach: "more hull", color: "#3fd8f2" }, gale: { label: "Gale", teach: "faster fire", color: "#5ff0a8" }, bronze: { label: "Bronze", teach: "shields", color: "#ffd23f" }, loom: { label: "Loom", teach: "more bullets, tracking", color: "#b48cff" } };
  const P = (school, label, what, max) => ({ school, label, what, max }), F2 = (school, road, side, label, what) => ({ school, label, what, max: 2, road, side });
  // Upgrades are plain stats (owner, 23 Nov 2026): more damage, faster fire, more hull, shields, more bullets, and
  // tracking (shots lean toward enemies but can miss). Each school's gate features its own; `max` is the top level.
  const PARTS = {
    hot: P("ember", "Damage", "Shots hit 10% harder", 5), quick: P("gale", "Fire rate", "Fire 10% faster", 5), reserve: P("tide", "Hull", "1 more hull, and 2 repaired", 4),
    skin: P("bronze", "Shields", "1 more shield; a lost one grows back", 3), split: P("loom", "More bullets", "1 more bullet in every volley (or blade, mine, jump, seeker)", 3), track: P("loom", "Tracking", "Shots curve toward enemies (they can still miss)", 3)
,
    // Forks (Nova Drift was the strategy reference; every name and number here is ours). Each plain upgrade is a road: at level 3
    // it forks in two, you choose one side for the flight (the other closes), and that side has a second level. `road` is the
    // upgrade it grows from, `side` 0 or 1. Most reuse rules that were in the game before (cinder, rico, powder...).
    finish: F2("ember", "hot", 0, "Finisher", "Hits 50% harder on enemies under 40% health (100% at level 2)"),
    cinder: F2("ember", "hot", 1, "Scorch", "Hits set enemies burning for 2 s (60% hotter at level 2)"),
    tail: F2("gale", "quick", 0, "Tailwind", "Each close call fires 3.5% faster for 4 s, stacking to 10 (7% at level 2)"),
    heavy: F2("gale", "quick", 1, "Heavy Rounds", "Shots 28% harder, but fire 8% slower (each level)"),
    breath: F2("tide", "reserve", 0, "Deep Breath", "A level without a hit repairs 1 hull: 45% of the time (70% at level 2)"),
    backwash: F2("tide", "reserve", 1, "Backwash", "Getting hit sweeps away the red shots near you (wider at level 2)"),
    shock: F2("bronze", "skin", 0, "Shock Plate", "A blocked or taken hit sends out a blast ring (20 damage a level)"),
    regrow: F2("bronze", "skin", 1, "Quick Regrow", "Lost shields grow back 20% faster (40% at level 2)"),
    rico: F2("loom", "split", 0, "Ricochet", "Each hit jumps to a nearby enemy at 28% (56% at level 2)"),
    powder: F2("loom", "split", 1, "Powder Kegs", "Wrecks burst, hurting what's near them (bigger at level 2)"),
    pierce: F2("loom", "track", 0, "Needle Point", "Shots go through 1 more enemy a level"),
    open: F2("loom", "track", 1, "Opener", "Hits on unhurt enemies 80% harder a level")
  };
  // Crossings: where two neighbouring roads have both forked, a rare pick opens (fusions were retired with the special parts on
  // 23 Nov 2026; these come back only late in a flight). `roads`: the two upgrades that must both have a fork taken.
  const FUSIONS = {
    wildfire: { roads: ["hot", "quick"], label: "Wildfire", what: "Every close call sets the nearest enemy burning for 4 s" },
    mend: { roads: ["quick", "reserve"], label: "Field Mend", what: "Every 40 wrecks repair 1 hull" },
    water: { roads: ["reserve", "skin"], label: "Still Water", what: "10 s without a hit sweeps every red shot away" },
    thunder: { roads: ["skin", "split"], label: "Thunderclap", what: "Every 8 close calls, a blast ring (42 damage)" },
    slipstream: { roads: ["split", "track"], label: "Slipstream", what: "Every close call launches two seekers" },
    steam: { roads: ["track", "hot"], label: "Steam", what: "Getting hit sets every enemy burning for 4 s" }
  };
  // The six roads in order round the Flight Plan board (each neighbours the next, and the last the first).
  const ROADS = ["hot", "quick", "reserve", "skin", "split", "track"];
  // Gates that pay straight away, without a choice.
  const PLAIN = { repair: { label: "Repair", what: "3 hull back", color: "#5ff0a8" }, plate: { label: "Plating", what: "1 more hull, repaired", color: "#9fb4ff" }, guard: { label: "Guard", what: "Blocks the next 2 hits", color: "#9fb4ff" }, reroll: { label: "Second Look", what: "2 rerolls", color: "#f4ecff" } };
  // Belts: won in order by winning a run. Each adds one rule to the ones before it.
  const BELTS = ["No belt", "White", "Yellow", "Green", "Blue", "Black"], BELT_RULES = ["", "Enemies are tougher", "Bosses move faster", "Start with 1 less hull", "More thorned gates, and they're worse", "Bosses keep one attack from the series before"];
  /* ---------- Series one: the Comet Courier School (owner, 23 November 2026) ---------- */
  // Who you meet. Faces are drawn in the game's cast.js; every name and line here is ours.
  const CAST = { wren: { name: "Wren", role: "Cadet courier (you)" }, tamsin: { name: "Tamsin", role: "Head of the Comet Courier School" }, bast: { name: "Bast", role: "Rival courier" }, quill: { name: "Quill", role: "Back-alley mechanic" }, keeper: { name: "The Toll-Keeper", role: "Guards the Rust Reef gate" }, beacon: { name: "A dead beacon", role: "Nine years silent" },
    vesper: { name: "Vesper", role: "The First Student: Tamsin's first cadet" }, maker: { name: "The Mapmaker", role: "Redraws the routes of the Glass Tide" },
    echo: { name: "The Echo", role: "Your own flying, rung back by the Last Bell" }, bell: { name: "The Last Bell", role: "Calls every courier home. None arrive." } };
  // A "?" gate opens one of these. Every choice says what it pays (up) and what it costs (down); the effects are plain data
  // (see effect() in sector.js). A dare pays only if you take few enough hits in the level that follows. `until`/`after`:
  // only before / after the midterm. `need`: a choice is greyed out without enough hull (max) or parts.
  const O = (label, up, down, d, need) => ({ label, up, down, do: d, ...(need ? { need } : {}) });
  const EVENTS = {
    /* Series one: the Rust Reef */
    bast: { who: "bast", title: "Bast is pinned down", line: "Six skiffs on my tail, cadet. You going to help or watch?", opts: [O("Help Bast", "Bast flies beside you against the Toll-Keeper", "A thorned level that pays nothing", { hard: 1, ally: 1, flag: "helped" }), O("Grab what Bast dropped", "A random upgrade +1", "Bast won't forget it", { part: 1, flag: "snub" })] },
    tuner: { who: "quill", title: "Quill's tune-up", line: "I can make that engine sing. Costs you plating, or a gun, or your patience.", opts: [O("Tune the engine", "A random upgrade +2", "1 less hull, for good", { max: -1, part: 2 }, { max: 3 }), O("Swap a gun", "Choose a new gun after the level", "1 hull now", { hull: -1, armory: 1 }), O("Just a patch", "Repair 2", "1 reroll", { hull: 2, rerolls: -1 })] },
    drill: { who: "tamsin", title: "Tamsin's drill", line: "Thorns, or a clean run. Your call, Wren. The school pays for either.", opts: [O("Fly the thorns", "School upgrades after, two levels at once", "A thorned level", { hard: 1, school: 1 }), O("Fly it clean", "1 hit or fewer: a random upgrade +2", "Miss it: lose 2 rerolls", { dare: { hits: 1, win: { part: 2 }, lose: { rerolls: -2 } } }), O("Rest instead", "Repair 2", "The level pays nothing", { hull: 2 })] },
    parcel: { any: 1, who: "tamsin", title: "A lost parcel", line: "Somebody's parcel, drifting. Couriers deliver, Wren. Even other people's.", opts: [O("Deliver it", "+20 stamps, kept even if you crash", "Pirates want it: a thorned level", { stamps: 20, hard: 1 }), O("Open it", "3 rerolls", "No stamps, and nobody gets their parcel", { rerolls: 3 })] },
    storm: { who: "tamsin", title: "Ion storm ahead", line: "Storm's thick. Red shots crawl in there, but so does everything else.", opts: [O("Fly through", "School upgrades after the level", "Ion fog: more enemies (their shots crawl)", { sky: "fog", school: 1 }), O("Ride the edge", "A guard", "Rocks fall all level", { guard: 1, sky: "shower" }), O("Go around", "Repair 1", "The level pays nothing", { hull: 1 })] },
    beacon: { who: "beacon", title: "A dead beacon flickers", line: "...courier... do you read... the toll is a name... mine was Ves...", opts: [O("Answer it", "The Toll-Keeper starts 15% weaker, and you hear a name", "The level pays nothing", { bossCut: 0.15, flag: "beacon" }), O("Strip it for parts", "A random upgrade +1", "The voice goes quiet for good", { part: 1 })] },
    wreck: { any: 1, who: "quill", title: "A wrecked courier", line: "Still warm. Guns or plating, take your pick. Both, if you've the nerve.", opts: [O("Salvage the guns", "Choose a new gun after the level", "No plating", { armory: 1 }), O("Salvage the plating", "1 more hull, repaired", "No new gun", { max: 1, hull: 1 }), O("Strip it bare", "Both", "Scavengers: a thorned level, and 1 hull", { armory: 1, max: 1, hull: -1, hard: 1 })] },
    herald: { who: "keeper", title: "The Toll-Keeper's herald", line: "Pay the toll early, little courier, and the Keeper will go easy.", opts: [O("Pay 2 hull", "The Toll-Keeper starts 20% weaker", "2 hull now", { hull: -2, bossCut: 0.2 }), O("Pay in rerolls", "The Toll-Keeper starts 10% weaker", "All your rerolls", { bossCut: 0.1, rerolls: -99 }), O("Refuse", "A guard", "The Toll-Keeper starts 10% stronger", { guard: 1, bossCut: -0.1 })] },
    garage: { any: 1, who: "quill", title: "Quill's garage", line: "Trade-ins welcome. Your worst upgrade for something better. Probably better.", opts: [O("Trade in", "Your lowest upgrade becomes a new one, a level higher", "You don't choose which", { swap: 1 }), O("Patch me up", "Repair to full", "2 rerolls", { full: 1, rerolls: -2 })] },
    race: { who: "bast", title: "Bast wants a race", line: "First to the next marker. Loser buys the fuel.", opts: [O("Race", "1 hit or fewer: +20 stamps and a random upgrade +1", "A short, crowded level; lose and Bast takes 1 reroll", { sky: "rush", dare: { hits: 1, win: { stamps: 20, part: 1 }, lose: { rerolls: -1 } } }), O("Not today", "Repair 1", "Bast tells everyone you're slow", { hull: 1 })] },
    /* Series two: the Glass Tide */
    shoal: { series: 2, who: "tamsin", title: "A mirror shoal", line: "Glass all the way down. Shots bounce in there, Wren. So does luck.", opts: [O("Fly the shoal", "School upgrades after, two levels at once", "Glass sky: red shots bounce off the edges", { sky: "glass", school: 1, double: 1 }), O("Skirt it", "A guard", "The level pays nothing", { guard: 1 })] },
    bet: { series: 2, who: "bast", title: "Bast's bet", line: "Glass Tide rules, cadet: fly clean or pay up. In?", opts: [O("Bet big", "No hits at all: a random upgrade +2", "Get hit: 1 less hull, for good", { dare: { hits: 0, win: { part: 2 }, lose: { max: -1 } } }, { max: 3 }), O("Bet small", "2 hits or fewer: 3 rerolls", "Miss it: 1 hull", { dare: { hits: 2, win: { rerolls: 3 }, lose: { hull: -1 } } }), O("Keep your money", "Repair 1", "The level pays nothing", { hull: 1 })] },
    lens: { series: 2, who: "quill", title: "Quill's glass lens", line: "Ground it myself. Hits like a hammer. Breaks like, well, glass.", opts: [O("Fit the lens", "Damage +2: shots 20% harder", "1 less hull, for good", { give: "hot", give2: 1, max: -1 }, { max: 3 }), O("Melt it into plating", "1 more hull, repaired", "Your best upgrade loses a level", { max: 1, hull: 1, lose: 1 }, { parts: 1 }), O("Sell it", "+15 stamps and 2 rerolls", "Nothing for the rocket", { stamps: 15, rerolls: 2 })] },
    adrift: { series: 2, who: "tamsin", title: "A courier adrift", line: "Out of fuel, drifting toward the Mapmaker's lines. We don't leave couriers, Wren.", opts: [O("Tow them out", "+25 stamps; they know where the pins fall: the Mapmaker starts 10% weaker", "Towing is slow: a thorned level that pays nothing", { stamps: 25, bossCut: 0.1, hard: 1 }), O("Take their fuel", "Repair to full", "Tamsin will hear about it", { full: 1, flag: "siphon" })] },
    current: { series: 2, who: "tamsin", title: "The tide turns", line: "Feel that pull? Ride the current and you're through in half the time.", opts: [O("Ride it", "A short level, and school upgrades after", "The tide pushes red shots sideways", { sky: "tide", short: 1, school: 1 }), O("Wait it out", "Repair 2", "A long level that pays nothing", { hull: 2, long: 1 })] },
    note: { series: 2, until: 5, who: "vesper", title: "A note in the glass", line: "To Tamsin's new cadet: I fly for the Mapmaker now. Turn back, or meet me at the halfway pin.", opts: [O("Study it", "You learn the duel: the First Student starts 25% weaker", "It's a trap too: a thorned level", { duelCut: 0.25, hard: 1 }), O("Burn it", "2 guards", "You go into the duel blind", { guard: 2 })] },
    forge: { series: 2, who: "quill", title: "Quill's glass forge", line: "Bring me two upgrades, kid. I'll melt 'em into one good one.", opts: [O("Melt two upgrades", "A random upgrade straight to level 3", "Your two lowest upgrades are gone", { melt: 1 }, { parts: 2 }), O("Polish one", "Your best upgrade +1", "2 rerolls", { best: 1, rerolls: -2 }, { parts: 1 })] },
    surveyor: { series: 2, after: 5, who: "maker", title: "The Mapmaker's surveyor", line: "Every route is mine to draw, courier. Let me draw yours short.", opts: [O("Let it redraw", "Skip the next level entirely", "The Mapmaker starts 15% stronger; the level pays nothing", { skip: 1, bossCut: -0.15 }), O("Shoot the surveyor", "A random upgrade +1", "A thorned level", { part: 1, hard: 1 })] },
    wingmate: { series: 2, after: 5, who: "vesper", title: "The First Student, again", line: "You beat me fair. The Mapmaker hates being rushed. I could show you. Or fly with you.", opts: [O("Take the advice", "The Mapmaker starts 15% weaker", "Fly the next level in the tide", { bossCut: 0.15, sky: "tide" }), O("Ask Vesper to fly with you", "Vesper fights beside you against the Mapmaker", "Vesper tests you first: 2 hull", { ally: 1, hull: -2 })] },
    // Added 24 Nov 2026: the map's clock, and a light in the glass.
    stolen: { series: 2, who: "quill", title: "Quill's stolen page", line: "Nicked a page of tonight's map, kid. Shows where its pins fall. Shows the line it's drawing to our door, too.", opts: [O("Study the pins", "The Mapmaker starts 15% weaker", "You fly with your head in a map: a thorned level", { bossCut: 0.15, hard: 1 }), O("Sell it to Bast", "+25 stamps and a guard", "Bast flies your route first: a short, crowded level", { stamps: 25, guard: 1, sky: "rush" })] },
    lantern: { series: 2, who: "bast", title: "A lantern in the glass", line: "A courier's lantern, still lit. Whoever left it wanted to be found. Want it, cadet?", opts: [O("Hang it on the rocket", "Tracking +1: shots lean toward what the light shows", "The glass sky next level: red shots bounce", { give: "track", sky: "glass" }), O("Trade it to Quill", "2 rerolls and repair 1", "Nothing for the rocket", { rerolls: 2, hull: 1 })] },
    doorstep: { series: 2, after: 5, who: "tamsin", title: "The line's at our door", line: "Quill's right, Wren. The map's one line from the school. I can send the cadets out to slow it, or you can fly faster.", opts: [O("Fly faster", "A short level, then school upgrades, two levels at once", "It's thorned", { short: 1, school: 1, double: 1, hard: 1 }), O("Let the cadets help", "Repair 2 and a guard", "The level pays nothing", { hull: 2, guard: 1 })] },
    /* Series three: the Bellwake */
    // Added 24 Nov 2026: the names, Tamsin holding on, and your own old line.
    badges: { series: 3, who: "quill", title: "The names in the hold", line: "Those badges from the Keeper's hold? Bolted 'em to your hull. The Bell knows every name. It'll hesitate.", opts: [O("Wear the badges", "Shields +1, and the Last Bell starts 10% weaker", "It hears you coming: a gravity well next level", { give: "skin", bossCut: 0.1, sky: "well" }), O("Send them home to the school", "+30 stamps", "Nothing for the rocket", { stamps: 30 })] },
    holding: { series: 3, who: "tamsin", title: "Tamsin's holding on", line: "It's pulling, Wren. I can hold. Talk to me while you fly, or don't, and fly faster.", opts: [O("Talk to her", "Repair 2", "The level pays nothing", { hull: 2 }), O("Fly faster", "1 hit or fewer: a random upgrade +2", "Miss it: 1 hull", { dare: { hits: 1, win: { part: 2 }, lose: { hull: -1 } } })] },
    oldline: { series: 3, until: 5, who: "echo", title: "Your own old line", line: "You flew this way last run, cadet. Left a trail. Follow it again? I'll be waiting at the end of it.", opts: [O("Follow your old line", "The Echo starts 20% weaker: you know where it'll be", "Bell toll all level", { duelCut: 0.2, sky: "toll" }), O("Fly a new line", "Fire rate +1", "A thorned level", { give: "quick", hard: 1 })] },
    choir: { series: 3, who: "tamsin", title: "The bells are singing", line: "Hear that? The toll carries out here, Wren. Fly into it and the school pays double.", opts: [O("Fly the toll", "School upgrades after, two levels at once", "Bell toll: slow waves of red shots fall all level", { sky: "toll", school: 1, double: 1 }), O("Plug your ears", "A guard", "The level pays nothing", { guard: 1 })] },
    wager: { series: 3, who: "bast", title: "Bast's last bet", line: "Last series, cadet. One more bet, for old times. Clean, or close?", opts: [O("Fly it clean", "No hits at all: Tracking +2", "Get hit: 1 less hull, for good", { dare: { hits: 0, win: { give: "track", give2: 1 }, lose: { max: -1 } } }, { max: 3 }), O("Fly it close", "1 hit or fewer: +30 stamps and a random upgrade +1", "Miss it: all your rerolls", { dare: { hits: 1, win: { stamps: 30, part: 1 }, lose: { rerolls: -99 } } }), O("Buy the fuel", "Repair 1", "Bast wins by default", { hull: 1 })] },
    anchor: { series: 3, who: "quill", title: "Quill's gravity anchor", line: "Bolted a dead star's core to your hull, kid. Shields love it. Red shots love it too.", opts: [O("Fit the anchor", "Shields +1", "Next level a gravity well bends red shots", { give: "skin", sky: "well" }), O("Strip it for stamps", "+20 stamps and 1 reroll", "Nothing for the rocket", { stamps: 20, rerolls: 1 })] },
    warning: { series: 3, until: 5, who: "vesper", title: "Vesper's warning", line: "The Bell rings back whatever you fly, Wren. At the halfway mark it'll be you up there.", opts: [O("Study your own flying", "The Echo starts 25% weaker", "You fly a thorned level to learn it", { duelCut: 0.25, hard: 1 }), O("Trust your gut", "2 rerolls", "You go into the Echo blind", { rerolls: 2 })] },
    bellows: { series: 3, who: "quill", title: "Quill's bellows", line: "Pump enough air through those barrels and they'll sing. They'll also melt.", opts: [O("Overclock", "Fire rate +2: 20% faster", "1 less hull, for good", { give: "quick", give2: 1, max: -1 }, { max: 3 }), O("Pump the plating", "1 more hull, repaired", "Your best upgrade loses a level", { max: 1, hull: 1, lose: 1 }, { parts: 1 }), O("Leave it", "Repair 2", "The level pays nothing", { hull: 2 })] },
    cracked: { series: 3, who: "tamsin", title: "A cracked bell", line: "One of the Bell's little sisters, split down the side. Ring it, and the big one hears.", opts: [O("Ring it", "The Last Bell starts 15% weaker: it answers, and wastes a toll", "Everything answers too: a thorned level", { bossCut: 0.15, hard: 1 }), O("Take the bronze", "1 more hull, repaired", "The Bell never hears you coming: no weakness", { max: 1, hull: 1 }), O("Melt two upgrades into it", "A random upgrade straight to level 3", "Your two lowest upgrades are gone", { melt: 1 }, { parts: 2 })] },
    wing: { series: 3, after: 5, who: "vesper", title: "Vesper flies in", line: "I'm done hiding from it. Let me fly the last stretch with you, or scout the gate.", opts: [O("Fly together", "Vesper fights beside you against the Last Bell", "She draws fire first: 2 hull", { ally: 1, hull: -2 }, { hull: 2 }), O("Send her to scout", "The Last Bell starts 15% weaker", "Fly the next level in the bell toll", { bossCut: 0.15, sky: "toll" })] },
    chart: { series: 3, after: 5, who: "maker", title: "The Mapmaker's last chart", line: "Beaten fair, courier. I drew the Bell's routes once. I can rub out a level for you. Or show you its throat.", opts: [O("Rub out a level", "Skip the next level entirely", "The Last Bell starts 15% stronger; the level pays nothing", { skip: 1, bossCut: -0.15 }), O("Show me its throat", "The Last Bell starts 20% weaker", "The chart's a maze: a thorned level, and 1 hull", { bossCut: 0.2, hard: 1, hull: -1 })] }
  };
  // Some levels come with weather or a job. Shown as a banner when the level starts.
  const SKIES = { fog: { label: "Ion fog", what: "Red shots crawl; more enemies" }, shower: { label: "Meteor shower", what: "Rocks fall from above" }, bounty: { label: "Bounty", what: "Wreck the marked ship for a part" }, rush: { label: "Race", what: "Short and crowded" },
    tide: { label: "The tide", what: "A current pushes red shots sideways, and turns" }, glass: { label: "Glass sky", what: "Red shots bounce off the edges once" },
    toll: { label: "Bell toll", what: "Slow waves of red shots ring down from the top" }, well: { label: "Gravity well", what: "A drifting well bends red shots and swallows them" } };
  // Belts at the school: earned by how well you fly. From Green, exams add one rule each (BELT_RULES).
  const RANKS = [
    { name: "White", color: "#f4ecff", how: "Join the school" }, { name: "Yellow", color: "#ffd23f", how: "Clear 3 levels" }, { name: "Orange", color: "#ff9a3d", how: "Reach the Toll-Keeper" },
    { name: "Green", color: "#5ff0a8", how: "Beat the Toll-Keeper" }, { name: "Blue", color: "#3fd8f2", how: "Beat it taking 3 hits or fewer" }, { name: "Purple", color: "#b48cff", how: "Beat it on Exam 1" },
    { name: "Brown", color: "#c08a5a", how: "Beat it on Exam 2" }, { name: "Red", color: "#ff4f7b", how: "Beat it on Exam 3" }, { name: "Black", color: "#2a2338", how: "Beat it on Exam 4" }
  ];
  // A third choice on every story card (owner, 24 Nov 2026: "every single time you have three options"). Many are a gun,
  // since any gun can turn up in a run now.
  const THIRD = {
    bast: O("Cover her from a distance", "Bast owes you one: +10 stamps", "She flies off alone; a thorned level", { stamps: 10, hard: 1 }),
    parcel: O("Hand it to Quill", "Quill trades it for a gun: choose one after the level", "No stamps, and Quill keeps the parcel", { armory: 1 }),
    beacon: O("Patch it and fly on", "A guard", "The level pays nothing", { guard: 1 }),
    garage: O("Ask for a gun", "Choose a new gun after the level", "Quill's test drive: 1 hull", { armory: 1, hull: -1 }),
    race: O("Draft behind Bast", "A short level", "You eat Bast's exhaust: the level pays nothing", { short: 1 }),
    shoal: O("Pick through the edge", "Choose a new gun after the level", "Sharp glass: 1 hull", { armory: 1, hull: -1 }),
    adrift: O("Radio Tamsin for them", "Repair 1 and +10 stamps", "The level pays nothing", { hull: 1, stamps: 10 }),
    current: O("Cut across it", "Choose a new gun after the level", "The tide pushes red shots sideways", { armory: 1, sky: "tide" }),
    note: O("Pocket it", "3 rerolls", "Vesper knows you read it: a thorned level", { rerolls: 3, hard: 1 }),
    forge: O("Melt down scrap instead", "Choose a new gun after the level", "1 reroll", { armory: 1, rerolls: -1 }),
    surveyor: O("Lose it in the glass", "Repair 2", "A long level that pays nothing", { hull: 2, long: 1 }),
    wingmate: O("Trade notes", "A random upgrade +1 and 1 reroll", "Nothing for the Mapmaker fight", { part: 1, rerolls: 1 }),
    stolen: O("Pin it up at the school", "+15 stamps and repair 1", "The level pays nothing", { stamps: 15, hull: 1 }),
    lantern: O("Follow its light", "It leads to a wreck: choose a new gun after the level", "A thorned level", { armory: 1, hard: 1 }),
    doorstep: O("Do both", "School upgrades after, and a guard", "A thorned, crowded level", { school: 1, guard: 1, hard: 1, sky: "rush" }),
    badges: O("Keep one badge", "A guard and +10 stamps", "The level pays nothing", { guard: 1, stamps: 10 }),
    holding: O("Fly steady", "School upgrades after", "Tamsin goes quiet: a long level", { school: 1, long: 1 }),
    oldline: O("Cross your old line", "Choose a new gun after the level", "Bell toll all level", { armory: 1, sky: "toll" }),
    choir: O("Ring along", "Choose a new gun after the level", "Next level a gravity well bends red shots", { armory: 1, sky: "well" }),
    anchor: O("Bolt it on loose", "Repair 2", "Next level a gravity well bends red shots", { hull: 2, sky: "well" }),
    warning: O("Ask her to spar", "A random upgrade +1", "She doesn't hold back: 1 hull", { part: 1, hull: -1 }),
    wing: O("Fly apart, stay on the radio", "+20 stamps and a guard", "No help at the Bell", { stamps: 20, guard: 1 }),
    chart: O("Keep the chart", "It marks a wreck: choose a new gun after the level", "A thorned level", { armory: 1, hard: 1 }),
  };
  for (const [k, o] of Object.entries(THIRD)) if (EVENTS[k] && EVENTS[k].opts.length < 3) EVENTS[k].opts.push(o);
  const D = { ROADS, RIGS, MODS, CORES, FAMILIES, GUNS, ENEMIES, META, START, SCHOOLS, PARTS, FUSIONS, PLAIN, BELTS, BELT_RULES, CAST, EVENTS, SKIES, RANKS };
  if (typeof module !== "undefined" && module.exports) module.exports = D; else root.CometParts = D;
})(typeof window !== "undefined" ? window : globalThis);
