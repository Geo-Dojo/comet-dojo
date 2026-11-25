// Comet Dojo: the cast and the comic panels they speak in. Wren and Tamsin come from the mock-ups (faces.js);
// Bast and Quill are drawn here on the same face so the style matches. Story lines for Series one live here too.
(function () {
  "use strict";
  const P = PALS.n;
  // Bast: rival courier. Wren's face shape re-lit: darker skin, a shaved crest instead of curls, a scar, a gold jacket.
  function bastFace(mood) {
    let svg = wrenFace({ ...P, trim: P.sun, trimS: P.sunS, c2: "#ffd23f" }, mood).replace(/#b9744f/g, "#8a5233").replace(/#dd9a6c/g, "#b97b52").replace(/#5a2a4a/g, "#3d1a2c").replace(/#f3c3a4/g, "#d8a07c");
    svg = svg.replace(/<circle cx="[-\d.]+" cy="[-\d.]+" r="[\d.]+" fill="#1b1026"[^>]*\/>/g, "").replace(/<path d="M[^"]*" fill="none" stroke="#5b3f78"[^>]*\/>/g, "");
    svg = svg.replace(/<path d="M[^"]*" fill="none" stroke="(#3fd8f2|#ffd23f)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"\/>/g, "");
    const crest = "M-112,-70 C-118,-118 -84,-150 -30,-160 L-20,-196 L10,-166 L24,-206 L46,-160 L70,-188 L78,-148 C104,-128 116,-102 114,-70 C96,-104 60,-122 2,-124 C-52,-124 -94,-106 -112,-70Z";
    return svg + `<path d="${crest}" fill="#1b1026" stroke="#05020c" stroke-width="6" stroke-linejoin="round"/><path d="M-90,-96 C-60,-126 -10,-136 40,-128" stroke="#ffd23f" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/><path d="M-30,-160 L-20,-196 L10,-166 L24,-206 L46,-160" stroke="#ff9a3d" stroke-width="4" fill="none" opacity=".8"/>` +
      `<path d="M56,-2 L84,40" stroke="#05020c" stroke-width="7" stroke-linecap="round"/><path d="M56,-2 L84,40" stroke="#e6a07a" stroke-width="3" stroke-linecap="round"/>`;
  }
  // Quill: back-alley mechanic. Tamsin's face shape: ginger hair, a soot-dark coat, welding goggles up on the brow, a moustache.
  function quillFace(mood) {
    const svg = tamsinFace({ ...P, foe2: "#9fb4ff", foe2S: "#1a2150", c2: "#ff9a3d" }, mood).replace(/#cfc8e4/g, "#d0703a").replace(/#a9a1c6/g, "#b85a2a").replace(/#8f86b4/g, "#a24f22").replace(/#7b71a8/g, "#6a2a10").replace(/#5d5388/g, "#5a2410").replace(/#4a4078/g, "#4a1c0c").replace(/#cf9a7d/g, "#d9b08c").replace(/#f0c4a4/g, "#f5d3b3");
    return svg + `<path d="M-44,64 C-20,52 -4,58 4,66 C12,58 30,52 52,62 C46,84 22,82 4,74 C-14,84 -38,86 -44,64Z" fill="#b85a2a" stroke="#05020c" stroke-width="5" stroke-linejoin="round"/>` +
      `<g transform="translate(0 -118)"><rect x="-100" y="-26" width="200" height="22" rx="10" fill="#2a2338" stroke="#05020c" stroke-width="6"/>${[-46, 46].map((x) => `<circle cx="${x}" cy="-14" r="30" fill="#0b2a38" stroke="#05020c" stroke-width="8"/><circle cx="${x}" cy="-14" r="30" fill="none" stroke="#ff9a3d" stroke-width="4"/><path d="M${x - 14},-26 l12,-6" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`).join("")}</g>`;
  }
  // Vesper, the First Student: Wren's face re-lit in magenta (Tamsin's first cadet, nine years in the Glass Tide): paler skin,
  // dark plum curls, lime eyes like her rocket's glass, and a magenta flight band across the brow.
  function vesperFace(mood) {
    const svg = wrenFace({ ...P, trim: "#ff5fd8", trimS: "#3d0a36", c1: "#c6ff4f" }, mood).replace(/#b9744f/g, "#c98a68").replace(/#dd9a6c/g, "#e8b48e").replace(/#5a2a4a/g, "#6a3348").replace(/#1b1026/g, "#3a0c34").replace(/#7a4a1e/g, "#7fb21a");
    return svg + `<path d="M-120,-78 C-70,-108 60,-112 118,-84 L114,-60 C56,-88 -66,-86 -116,-54Z" fill="#ff5fd8" stroke="#05020c" stroke-width="6" stroke-linejoin="round"/><path d="M-96,-80 C-40,-100 40,-100 96,-82" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>` +
      `<path d="M70,-150 C96,-120 104,-96 100,-70" stroke="#ff5fd8" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>`;
  }
  // The Mapmaker: not a face but a living compass, cyan rings and ticks round one watching eye, its needle a pin of the routes it draws.
  function makerFace(mood) {
    const tilt = { calm: 0, wry: 18, worried: -24, angry: 38 }[mood] || 0, lid = { calm: 0.35, wry: 0.5, worried: 0.15, angry: 0.62 }[mood] || 0.35;
    const ticks = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.283, r0 = i % 6 ? 128 : 112; return `<path d="M${(Math.cos(a) * r0).toFixed(1)},${(Math.sin(a) * r0).toFixed(1)} L${(Math.cos(a) * 142).toFixed(1)},${(Math.sin(a) * 142).toFixed(1)}" stroke="#3fd8f2" stroke-width="${i % 6 ? 3 : 7}" stroke-linecap="round"/>`; }).join("");
    return `<circle r="176" fill="#08202c" stroke="#05020c" stroke-width="12"/><circle r="176" fill="none" stroke="#3fd8f2" stroke-width="6"/><circle r="150" fill="none" stroke="#3fd8f2" stroke-width="2" opacity=".6"/>${ticks}` +
      `<g transform="rotate(${tilt})"><path d="M0,-150 L22,0 L0,150 L-22,0Z" fill="#0b2a38" stroke="#05020c" stroke-width="8" stroke-linejoin="round"/><path d="M0,-150 L22,0 L-22,0Z" fill="#ff5fd8" stroke="#05020c" stroke-width="5" stroke-linejoin="round"/><path d="M0,150 L22,0 L-22,0Z" fill="#3fd8f2" opacity=".55"/></g>` +
      `<ellipse rx="54" ry="38" fill="#f4ecff" stroke="#05020c" stroke-width="8"/><circle r="22" fill="#c6ff4f" stroke="#05020c" stroke-width="5"/><circle r="9" fill="#05020c"/><circle cx="-7" cy="-8" r="5" fill="#fff"/>` +
      `<clipPath id="mkeye"><ellipse rx="54" ry="38"/></clipPath><g clip-path="url(#mkeye)"><path d="M-70,-40 L70,-40 L70,${(-40 + lid * 52 + (mood === "angry" ? 14 : 0)).toFixed(0)} C30,${(-38 + lid * 60).toFixed(0)} -30,${(-38 + lid * 60).toFixed(0)} -70,${(-40 + lid * 52).toFixed(0)}Z" fill="#0b2a38"/></g>` +
      `<path d="M-70,${(-40 + lid * 52).toFixed(0)} C-30,${(-38 + lid * 60).toFixed(0)} 30,${(-38 + lid * 60).toFixed(0)} 70,${(-40 + lid * 52 + (mood === "angry" ? 14 : 0)).toFixed(0)}" fill="none" stroke="#05020c" stroke-width="6" clip-path="url(#mkeye)"/><ellipse rx="54" ry="38" fill="none" stroke="#05020c" stroke-width="8"/>` +
      `<text y="-188" text-anchor="middle" font-family="Bricolage Grotesque,system-ui" font-weight="900" font-size="34" fill="#3fd8f2" stroke="#05020c" stroke-width="6" paint-order="stroke">N</text>`;
  }
  // The Echo: Wren's own face rung back by the Bell, drained to bone white and ice blue, with ripple rings where the voice comes from.
  function echoFace(mood) {
    const svg = wrenFace({ ...P, trim: "#bfe9ff", trimS: "#0d2236", c1: "#ffffff", c2: "#bfe9ff" }, mood).replace(/#b9744f/g, "#8fa3bf").replace(/#dd9a6c/g, "#c9d8ea").replace(/#5a2a4a/g, "#3a4a66").replace(/#1b1026/g, "#2a3a56").replace(/#f3c3a4/g, "#e6eef8");
    return svg + [150, 190, 230].map((r, i) => `<circle r="${r}" fill="none" stroke="#bfe9ff" stroke-width="${5 - i}" opacity="${0.45 - i * 0.12}" stroke-dasharray="${18 + i * 8} ${14 + i * 6}"/>`).join("");
  }
  // The Last Bell: a great bronze bell, cracked, with one slit eye where the clapper should hang and a mouth that is its rim.
  function bellFace(mood) {
    const lid = { calm: 0.4, wry: 0.55, worried: 0.2, angry: 0.7 }[mood] ?? 0.4;
    return `<path d="M-60,-170 C-40,-200 40,-200 60,-170 C120,-140 130,-40 140,60 C150,110 190,130 200,160 L-200,160 C-190,130 -150,110 -140,60 C-130,-40 -120,-140 -60,-170Z" fill="#3a1606" stroke="#05020c" stroke-width="12" stroke-linejoin="round"/>` +
      `<path d="M-60,-170 C-40,-200 40,-200 60,-170 C120,-140 130,-40 140,60 C150,110 190,130 200,160 L-200,160 C-190,130 -150,110 -140,60 C-130,-40 -120,-140 -60,-170Z" fill="none" stroke="#ff9a3d" stroke-width="5"/>` +
      `<path d="M-150,100 L150,100 M-136,40 L136,40" stroke="#ff9a3d" stroke-width="4" opacity=".7"/><path d="M40,-180 L22,-120 L48,-90 L20,-30" fill="none" stroke="#05020c" stroke-width="8" stroke-linejoin="round"/><path d="M40,-180 L22,-120 L48,-90 L20,-30" fill="none" stroke="#ffd23f" stroke-width="3"/>` +
      `<rect x="-24" y="-204" width="48" height="26" rx="8" fill="#3a1606" stroke="#05020c" stroke-width="8"/>` +
      `<ellipse cy="-40" rx="70" ry="${(14 + 30 * (1 - lid)).toFixed(0)}" fill="#fff2b0" stroke="#05020c" stroke-width="8"/><circle cy="-40" r="${(10 + 12 * (1 - lid)).toFixed(0)}" fill="#c6ff4f" stroke="#05020c" stroke-width="5"/><circle cy="-40" r="7" fill="#05020c"/>` +
      `<path d="M-190,160 Q0,${mood === "angry" ? 120 : 190} 190,160" fill="none" stroke="#05020c" stroke-width="10"/><path d="M-190,160 Q0,${mood === "angry" ? 120 : 190} 190,160" fill="none" stroke="#ffd23f" stroke-width="4"/>` +
      `<circle cy="196" r="26" fill="#c6ff4f" stroke="#05020c" stroke-width="7"/>`;
  }
  const FACE = { wren: (m) => wrenFace(P, m), tamsin: (m) => tamsinFace(P, m), bast: bastFace, quill: quillFace, vesper: vesperFace, maker: makerFace, echo: echoFace, bell: bellFace };
  const BG = { wren: P.sky[1], tamsin: P.foeS, bast: P.sunS, quill: "#1a2150", keeper: P.foeS, beacon: P.sky[2], vesper: "#3d0a36", maker: "#08202c", echo: "#0d2236", bell: "#3a1606" };
  // One comic panel: halftone backdrop, the speaker, their words in a bubble. `side` puts the face left or right.
  function panel(who, mood = "calm", say = "", side = "right") {
    const room = who === "beacon" ? `<g transform="translate(0 -10) scale(.84)">${cockpitBg(P, true)}</g>` : "";
    const fig = who === "keeper" ? at(0, 30, 0.78, keeper(P, 0)) : who === "beacon" ? "" : who === "maker" ? at(side === "left" ? -150 : 150, 20, 0.95, makerFace(mood)) : who === "bell" ? at(side === "left" ? -150 : 150, 30, 0.95, bellFace(mood)) : at(side === "left" ? -120 : 130, 80, 0.92, FACE[who](mood));
    return `<figure class="pan ${side}"><svg viewBox="-420 -330 840 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs(P)}<rect x="-1200" y="-1200" width="2400" height="2400" fill="${mix(BG[who] || P.sky[1], "#0a0414", 0.55)}"/><rect x="-1200" y="-1200" width="2400" height="2400" fill="url(#ht)" opacity="${room ? 0.06 : 0.18}"/>${room}<g filter="url(#wob)">${fig}</g></svg>${say ? `<figcaption class="bub">${say}</figcaption>` : ""}<span class="who">${(window.Sector.CAST[who] || {}).name || ""}</span></figure>`;
  }
  // The story beats of both series. Each is a list of [who, mood, line]; a line may instead be a function of the saved flags
  // (beacon: answered the dead beacon; snub: took Bast's parts; siphon: took a stranded courier's fuel), or null to skip it.
  // The story (rewritten 24 Nov 2026, owner: "complete and logical, with weight and urgency"). One thread: the school's old
  // graduation bell, the Last Bell, has started ringing by itself, and every toll calls a courier "home"; none arrive. The
  // Toll-Keeper sells it names, the Mapmaker draws the roads to it, and now it is ringing on the school's own frequency.
  // Each series buys time: open the Reef gate before it seals, stop the Mapmaker before it draws the school onto the
  // Bell's road, then silence the Bell before it calls Tamsin. Flags from choices (beacon, snub, siphon, ally) change lines.
  const SCENES = {
    intro: [["tamsin", "worried", "Wren. Up. The bell rang again last night: three outer stations went dark, and their couriers flew off toward the sound."],
      ["wren", "worried", "Rang? The school bell's been cracked for nine years."],
      ["tamsin", "calm", "Not ours. The Last Bell, out past the Reef. It calls couriers home, and none of them land. The stations need medicine before the next toll."],
      ["tamsin", "worried", "Ten markers through the Rust Reef, then the Toll-Keeper's gate. It seals at the next bell. I've lost students out there, Wren. Don't be one."],
      ["bast", "wry", "Relax, cadet. If you crash, I'll deliver your parcels. For a fee."]],
    midterm: [["tamsin", "calm", "Halfway, and the stations are still answering. Pick a core, Wren: it changes how you fly the rest of the way."]],
    boss: [["keeper", "angry", "A courier! The toll is a name. The Bell pays well for names. Give me yours."], ["wren", "angry", "You're selling us to it? Come and take it."]],
    bossAlly: [["keeper", "angry", "Two couriers. Two names. The Bell will pay double."], ["bast", "angry", "Nobody sells my name, rust-bucket. You owe me one after this, cadet."]],
    won: [["tamsin", "wry", "The gate's open and the medicine's through. That was real flying, Wren."],
      ["quill", "worried", "Kid. The Keeper's hold. It's full of school badges. Names it sold to the Bell. Some of them are ours."],
      (f) => (f.beacon ? ["wren", "worried", "One of them matches the dead beacon. 'Ves...'. Vesper?"] : ["wren", "worried", "There's one with a gold edge. 'Vesper. First cadet.'"]),
      ["tamsin", "worried", "My first student. Her badge is here, but her rocket isn't. She went after whatever draws the routes to that bell: the Mapmaker, in the Glass Tide."],
      (f) => ["bast", "worried", f.snub ? "...Not bad. You still owe me for the Reef. The Glass Tide can collect." : f.helped ? "...You covered me out there. Fine. Whatever's in the Glass Tide, I'm on your channel." : "...You got through the gate on your own? Fine. Whatever's in the Glass Tide, I'm on your channel."]],
    lostBoss: [["tamsin", "worried", "Those chains hold its plating up. Cut both arms first, then stay out of the lamp. The gate's still shut, Wren. Again."]],
    lostLate: [["tamsin", "calm", "The Reef thickens past marker seven. Plating and Second Wind are worth the stamps. The stations can hold one more night."]],
    lostEarly: [["tamsin", "calm", "Again. Slower this time. Double-tap a gap and dash through the shots, not around them."]],
    lostMid: [["quill", "wry", "Bring me stamps, kid. I'll bolt something useful onto that rocket before the next toll."]],
    // Series two: the Glass Tide.
    intro2: [["tamsin", "worried", "Bad news, Wren. The Mapmaker redraws the Tide's routes every night, and every night they bend closer to the Bell."],
      ["quill", "worried", "I plotted it. Three more nights and its map runs straight through the school. Every cadet we have would fly off toward that sound."],
      (f) => ["wren", "worried", f.beacon ? "And Vesper? The beacon said her name. She's in there?" : "And Vesper's badge was in the Keeper's hold. Is she in there?"],
      ["tamsin", "calm", "Alive, I think. Flying for it. Shots bounce off the glass in there, and the tide pushes them sideways. Read both, and come home."],
      (f) => ["bast", "wry", f.snub ? "Don't look at me to cover you, cadet. I remember the Reef." : "Someone's waiting at the halfway pin. I'll keep the channel open."]],
    duel: [["vesper", "wry", "Tamsin's new cadet. Does she still teach the dash first?"], ["wren", "angry", "She still keeps your chair at the table. Why are you flying for the thing that's drawing her school onto the Bell's road?"], ["vesper", "angry", "Because it promised me a route home. Show me you can fly one yourself."]],
    duelWon: [["vesper", "worried", "...You're good. Nine years, and the Mapmaker never drew me a way home. Only roads to the Bell."], ["tamsin", "calm", "Midterm, Wren. Pick a core. And Vesper, if you're listening: the door's open. It always was."]],
    boss2: [["maker", "angry", "Every route in the Tide is a line I drew. Tonight's line runs through your little school, courier. Yours ends here."], ["wren", "angry", "Then I'll draw my own."]],
    boss2Ally: [["maker", "angry", "The First Student, flying for the school again? I'll redraw you both."], ["vesper", "angry", "Stay on my wing, Wren. It hates being rushed. And I owe it nine years."]],
    won2: [["tamsin", "wry", "The Mapmaker's pins are down. The school's off the map. That was flying, Wren."],
      ["quill", "worried", "One problem. Without the Mapmaker the routes froze where they were. Every one of them still points at the Bell."],
      ["vesper", "calm", "Then that's where we finish it. Tell Tamsin I'm flying home the long way. Right behind you."],
      (f) => (f.siphon ? ["tamsin", "worried", "And Wren: a courier came home from the Tide with an empty tank. We'll talk about that."] : ["bast", "wry", "Fine. Best in the school. Don't let it go to your head, cadet."])],
    lostDuel: [["tamsin", "worried", "Vesper reads your dash. Let her fire first, then go through it, not around. The map moved again tonight, Wren."]],
    lostBoss2: [["tamsin", "worried", "Its shell turns. Shoot when the lime gap faces you, and crack plates to widen it. Watch the dashed warnings too. We're out of nights."]],
    lostLate2: [["quill", "wry", "The Glass Tide's no Reef, kid. Plating and Second Wind first, then go again. The map's two lines from our door."]],
    lostEarly2: [["tamsin", "calm", "Skimmers drop curtains: find the gap behind them. Prism shots crack: get wide before they split."]],
    // Series three: the Bellwake. The routes stay put, all pointing at the Last Bell, and now it rings on the school's frequency.
    intro3: [["tamsin", "worried", "...Wren. Did you hear it? Last night it rang on the school's own frequency. I heard my name in it."],
      ["vesper", "worried", "That's how it took me, nine years ago. First your name, then the pull. She rang it at her graduation, Wren. It knows her."],
      ["tamsin", "calm", "If it calls me, every cadet tied to this school goes after me. The school goes dark. So fly into the sound and switch it off."],
      ["wren", "angry", "Ten markers. Then the Bell. Keep talking to me until I get there."],
      (f) => ["vesper", "worried", f.siphon ? "Careful. It rings back what you fly, and you've flown hungry. At the halfway mark you'll meet yourself." : "Careful. It rings back what you fly. At the halfway mark you'll meet yourself."]],
    echo: [["echo", "wry", "Turn left, cadet. You always turn left."], ["wren", "worried", "...That's my voice."], ["echo", "angry", "It's your flying. Every run you ever made, rung back. Come home. Or catch me, if you can stand under me."]],
    echoWon: [["echo", "worried", "...You turned right."], ["tamsin", "calm", "Midterm, Wren. Pick a core. Whatever that was, it can't fly a run you haven't flown yet. I can hold on. Hurry."]],
    boss3: [["bell", "angry", "COURIER. COME HOME. YOUR TEACHER IS ALREADY ON HER WAY."], ["tamsin", "worried", "...Wren, I can feel it pulling. Be quick."], ["wren", "angry", "She's not yours. School's out."]],
    boss3Ally: [["bell", "angry", "THE FIRST STUDENT. YOU CAME HOME AFTER ALL."], ["vesper", "angry", "Not to you. Wren, the gap in its toll is where the clapper was. Fly through it. I'll keep it looking at me."]],
    won3: [["tamsin", "wry", "...It's quiet. For the first time in nine years the Bellwake is quiet. I'm still here, Wren."],
      (f) => (f.ally ? ["vesper", "calm", "We flew it together. Nine years late, and right on time. Thank you, Wren."] : ["vesper", "calm", "No bell. Just the routes, and the way home. I'm landing tonight. Thank you, Wren."]),
      ["quill", "wry", "The stations are lighting up, kid. One by one. Every courier it called is turning round."],
      ["tamsin", "calm", "Ten markers, three series, one cadet. Wren: you've graduated. Our school bell is yours to ring now. Ring it gently."],
      (f) => (f.snub ? ["bast", "wry", "Graduated. Fine. You still owe me for the Reef, courier. Now you can afford it."] : f.helped ? ["bast", "wry", "You covered me in the Reef, and I never said thanks. Thanks, courier. Don't let it go to your head."] : ["bast", "wry", "Graduated, and you never once needed me. Annoying. Congratulations, courier."])],
    lostEcho: [["tamsin", "worried", "Only the real Echo has ripple rings. The pale ones throw your shots back. Watch it when they swap, and stay under it. I can still hear the toll, Wren."]],
    lostBoss3: [["vesper", "worried", "You can't outfly its toll. Dash as the wave turns cyan, then hit the bell while it hangs open. She's still holding on."]],
    lostLate3: [["quill", "wry", "The Bellwake chews plating, kid. Shields grow back; buy them first. Tamsin's still with us. Go again."]],
    lostEarly3: [["tamsin", "calm", "Chimers glow before they ring: get wide. Clappers spray where they swing: stay behind the swing."]]
  };
  // More lines for losing (second audit, 24 Nov 2026): each loss takes the next one in turn, and a loss with the boss nearly
  // broken says so first. Every line still carries a tip and the clock.
  const LOSS = {
    lostBoss: [[["quill", "wry", "While its arms are chained on, you're scratching paint. Pick one and keep on it. And it hangs a new one near the end. I'll patch the hull, kid."]], [["bast", "wry", "Getting flattened by a toll booth, cadet? Watch its lamp: the light comes before the shots."]]],
    lostLate: [[["bast", "wry", "Past marker seven everything shoots back. Shields grow back; plating doesn't. Choose like you mean it."]], [["tamsin", "worried", "Close, Wren. Take the repair gate when you're low, even if the other one shines. The bell hasn't rung yet."]]],
    lostEarly: [[["quill", "wry", "Mines ring before they blow. Shoot them early or give them room."]], [["tamsin", "calm", "Only the white dot in your cockpit can be hit. Let the shots brush the wings."]]],
    lostMid: [[["tamsin", "calm", "Close calls fill your nerve. Eight in a row and the rocket runs hot. Brush the shots, don't flee them."]], [["bast", "wry", "Turrets don't move, cadet. You're supposed to."]]],
    lostDuel: [[["vesper", "wry", "You dash where I'd dash. Wait one beat longer, then go."]], [["quill", "worried", "She sends your own shots back, kid. Stop firing into her parry: hit her when the glow's gone."]], [["tamsin", "calm", "Her glass guard runs on a clock. Break every seal before it closes and she's wide open."]]],
    lostBoss2: [[["vesper", "worried", "Break the pins and its walls fall. It can't redraw what's broken. One more night, Wren."]], [["quill", "wry", "It rushes you in the last stage. Keep a dash ready for the lane slam."]]],
    lostLate2: [[["tamsin", "calm", "The tide turns every few seconds. Lean with it and the red shots miss you on their own."]], [["bast", "wry", "Glass makes every shot bounce once. Stay off the walls, genius."]]],
    lostEarly2: [[["quill", "wry", "Skimmers fly the edges. Sit in the middle and let the curtain come to you."]], [["vesper", "calm", "Prisms glow before they crack. Count to one, then slide."]]],
    lostEcho: [[["vesper", "worried", "When it splits, only one of them is real. Don't feed the copies: every shot you give them comes back."]], [["tamsin", "calm", "Keep your eyes on the real one when they swap places. It slides; you follow. Keep moving, Wren."]]],
    lostBoss3: [[["quill", "wry", "The Bell calls chimers down beside it. Break them first or the rings stack up."]], [["tamsin", "worried", "...I'm still here. Its shell is hard until it rings. Dash through the wave, then everything you've got. Hurry, Wren."]]],
    lostLate3: [[["vesper", "calm", "Gravity wells pull the red shots in. Put the well between you and them."]], [["bast", "wry", "Carriers keep launching while they live. Kill the mother ship, cadet."]]],
    lostEarly3: [[["quill", "wry", "Bell tolls always leave a two-shot gap. Find it early."]], [["vesper", "calm", "Clappers spray along their swing. Sit behind it and they can't touch you."]]]
  };
  const CLOSE = { lostBoss: ["tamsin", "worried", "It was cracking, Wren. One more pass and that gate was open."], lostBoss2: ["vesper", "angry", "Its shell was in pieces. One more plate and it was done."], lostBoss3: ["tamsin", "worried", "It was nearly quiet. I heard it falter."], lostDuel: ["vesper", "wry", "You almost had me. Almost."], lostEcho: ["echo", "worried", "...Almost. You nearly turned right."] };
  // The loss scene for the nth loss of this kind (n counts up from 0), with the near-miss line first when close.
  const loss = (k, n = 0, saved = {}, close = false) => { const all = [SCENES[k], ...(LOSS[k] || [])], l = all[((n % all.length) + all.length) % all.length].map((q) => (typeof q === "function" ? q(saved) : q)).filter(Boolean); return close && CLOSE[k] ? [CLOSE[k], ...l] : l; };
  // Radio between levels: a line as each level starts, so the series reads as one flight with a clock running.
  // RADIO[series][level 1..10]: [who, line]. Lines can depend on flags (functions), like the scenes.
  const RADIO = {
    1: [null, ["tamsin", "Marker one. Clean lines, Wren. The stations are counting on that cargo."], ["quill", "Mines drift in the old shipping lanes. Shoot them before they ring."], ["tamsin", "Station Kell just went quiet. Keep moving."], ["bast", "You're slow, cadet. I'm two markers ahead. Kidding. Mostly."], ["tamsin", "Turrets ahead. They never move, so you have to."], ["quill", "Midterm's behind you. That core looks good on you, kid."], (f) => ["bast", f.ally ? "I've got your back for the gate. Shields are up ahead." : f.snub ? "Still no thanks for the Reef? Fine. Shields are up ahead." : "Shields are up ahead, cadet. Try not to scratch the paint."], ["tamsin", "The Reef's thickest here. Breathe. Dash through, not around."], ["quill", "Weavers. Hit the head and the rest falls apart."], ["tamsin", "Last marker. The gate seals at the next bell. Go."]],
    2: [null, ["tamsin", "The glass sings when shots hit it. Listen for it, Wren."], ["quill", "Skimmers. They drop a curtain as they cross: the gap's behind them."], ["tamsin", "The map moved again. One night closer."], ["quill", "Prisms crack into five. Get wide before they split."], ["vesper", "Halfway pin, cadet. I'm waiting."], ["tamsin", "Vesper's alive. Keep her that way. Keep yourself that way."], (f) => ["vesper", f.ally ? "I'm on your wing for the Mapmaker. Don't make me regret it." : "The Mapmaker watches the eighth marker. It'll try to rush you."], ["quill", "Two lines from our door now, kid. Two."], ["tamsin", "The tide turns every few seconds. Ride it, don't fight it."], ["tamsin", "Last marker. Tear up its map."]],
    3: [null, ["tamsin", "I can hear it from here, Wren. Fly fast."], ["vesper", "Chimers. Little sisters of the Bell. They glow before they ring."], ["quill", "Gravity wells bend red shots. Stay out of the middle."], ["vesper", "Clappers swing on chains. Stay behind the swing."], ["tamsin", "It said my name again. I'm fine. Halfway, Wren."], ["tamsin", "...Still here. Keep going."], ["quill", "Carriers launch chasers. Kill the carrier, not the rockets."], ["tamsin", "The pull's stronger. Talk to me, Wren. Just fly."], (f) => ["vesper", f.ally ? "I'm with you for the last stretch. Nine years. Let's end it." : "One more marker after this. It's louder than it's ever been."], ["tamsin", "Last marker. Ring it out, Wren. Ring it out."]]
  };
  const radio = (n, lvl, saved = {}, run = []) => { const f = { ...saved }; for (const q of run || []) f[q] = 1; const l = (RADIO[n] || [])[lvl]; return typeof l === "function" ? l(f) : l || null; };
  // A scene with the flags filled in: saved flags (from earlier runs) and this run's (an array) together.
  const story = (k, saved = {}, run = []) => { const f = { ...saved }; for (const q of run || []) f[q] = 1; return SCENES[k].map((l) => (typeof l === "function" ? l(f) : l)).filter(Boolean); };
  const COLOR = { tamsin: "#ff9a3d", quill: "#7dfcff", bast: "#ffd23f", vesper: "#ff5fd8", wren: "#5ff0a8" };
  window.CCast = { panel, SCENES, RADIO, radio, COLOR, FACE, story, loss, LOSS, CLOSE };
})();
