'use strict';
/* ============================================================
   Áudio 100% sintetizado (Web Audio): SFX, música gerativa e ambiência.
   Nenhum arquivo externo: tudo gerado em tempo real.
   ============================================================ */
VV.Audio = (() => {
  let ctx = null, master, musicBus, sfxBus, ambBus, wet, reverb, noiseBuf;
  const S = { music: 0.6, sfx: 0.7, amb: 0.6 };
  let pending = null, cur = null, tg = null, timer = null;
  let nextT = 0, stepN = 0, mel = 12, curName = null;
  const amb = { nodes: {}, want: {} };

  const MODES = {
    ion: [0, 2, 4, 5, 7, 9, 11], mix: [0, 2, 4, 5, 7, 9, 10], dor: [0, 2, 3, 5, 7, 9, 10],
    aeo: [0, 2, 3, 5, 7, 8, 10], lyd: [0, 2, 4, 6, 7, 9, 11],
  };
  const TRACKS = {
    title:  { bpm: 78, root: 57, mode: 'ion', prog: [0, 5, 3, 4, 0, 5, 1, 4], dens: 0.55, arp: true, wave: 'triangle', pad: 0.9, seed: 11 },
    spring: { bpm: 100, root: 62, mode: 'ion', prog: [0, 4, 5, 3, 0, 4, 3, 4], dens: 0.5, arp: true, wave: 'triangle', pad: 0.5, seed: 21 },
    summer: { bpm: 90, root: 60, mode: 'mix', prog: [0, 6, 3, 0, 0, 6, 4, 0], dens: 0.45, arp: false, wave: 'triangle', pad: 0.5, perc: true, seed: 31 },
    fall:   { bpm: 76, root: 57, mode: 'dor', prog: [0, 3, 6, 4, 0, 3, 5, 4], dens: 0.4, arp: true, wave: 'triangle', pad: 0.7, seed: 41 },
    winter: { bpm: 64, root: 64, mode: 'lyd', prog: [0, 1, 0, 4, 0, 1, 5, 4], dens: 0.3, arp: false, wave: 'bell', pad: 0.8, seed: 51 },
    night:  { bpm: 58, root: 55, mode: 'aeo', prog: [0, 5, 3, 4], dens: 0.22, arp: false, wave: 'bell', pad: 1, seed: 61 },
    rain:   { bpm: 66, root: 60, mode: 'dor', prog: [0, 5, 2, 4], dens: 0.3, arp: false, wave: 'bell', pad: 0.9, seed: 71 },
    town:   { bpm: 108, root: 60, mode: 'ion', prog: [0, 3, 4, 0, 5, 3, 1, 4], dens: 0.6, arp: true, wave: 'pluck', pad: 0.4, perc: true, seed: 81 },
    shop:   { bpm: 96, root: 58, mode: 'mix', prog: [0, 3, 0, 4], dens: 0.5, arp: true, wave: 'pluck', pad: 0.35, seed: 91 },
    beach:  { bpm: 92, root: 62, mode: 'lyd', prog: [0, 4, 1, 4], dens: 0.45, arp: true, wave: 'pluck', pad: 0.5, seed: 101 },
    home:   { bpm: 72, root: 60, mode: 'ion', prog: [0, 3, 0, 4, 0, 5, 3, 4], dens: 0.35, arp: true, wave: 'bell', pad: 0.7, seed: 111 },
    mine:   { bpm: 62, root: 50, mode: 'aeo', prog: [0, 0, 5, 4], dens: 0.16, arp: false, wave: 'bell', pad: 1, dark: true, seed: 121 },
    forest: { bpm: 84, root: 59, mode: 'dor', prog: [0, 4, 3, 5], dens: 0.4, arp: true, wave: 'pluck', pad: 0.6, seed: 131 },
    mountain: { bpm: 70, root: 55, mode: 'lyd', prog: [0, 1, 4, 0], dens: 0.3, arp: false, wave: 'bell', pad: 0.9, seed: 141 },
  };

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = S.music * 0.55;
    sfxBus = ctx.createGain(); sfxBus.gain.value = S.sfx;
    ambBus = ctx.createGain(); ambBus.gain.value = S.amb * 0.5;
    const len = ctx.sampleRate * 1.7;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    reverb = ctx.createConvolver(); reverb.buffer = buf;
    wet = ctx.createGain(); wet.gain.value = 0.3;
    musicBus.connect(master); musicBus.connect(wet); wet.connect(reverb); reverb.connect(master);
    sfxBus.connect(master); ambBus.connect(master);
    const nl = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    if (pending) { const p = pending; pending = null; play(p); }
    applyAmbience();
  }

  /* ---------- primitivas ---------- */
  function env(g, t, a, d, s, r, dur, vol) {
    const hold = Math.max(dur, a + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(Math.max(vol * s, 0.0001), t + a + d);
    g.gain.setValueAtTime(Math.max(vol * s, 0.0001), t + hold);
    g.gain.linearRampToValueAtTime(0.0001, t + hold + r);
  }
  function tone(freq, t, dur, type, vol, dest, o = {}) {
    const osc = ctx.createOscillator(); osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(o.f2, 1), t + dur);
    const g = ctx.createGain();
    env(g, t, o.a ?? 0.004, o.d ?? 0.08, o.s ?? 0.4, o.r ?? 0.08, dur, vol);
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); f.connect(g); }
    else osc.connect(g);
    g.connect(dest || sfxBus);
    osc.start(t); osc.stop(t + Math.max(dur, (o.a ?? 0.004) + (o.d ?? 0.08)) + (o.r ?? 0.08) + 0.05);
  }
  function noise(t, dur, vol, dest, o = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(o.f2, 20), t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    env(g, t, o.a ?? 0.002, o.d ?? dur * 0.6, o.s ?? 0.2, o.r ?? 0.03, dur, vol);
    src.connect(f); f.connect(g); g.connect(dest || sfxBus);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + (o.r ?? 0.03) + 0.1);
  }

  /* ---------- efeitos sonoros ---------- */
  function sfx(name, o = {}) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + (o.delay || 0);
    const v = o.vol ?? 1, pv = 1 + (Math.random() - 0.5) * 0.12;
    switch (name) {
      case 'step': { const k = o.surf || 'grass'; const f = { grass: 900, stone: 1800, wood: 700, sand: 500, snow: 400 }[k] || 900; noise(t, 0.05, 0.1 * v, sfxBus, { type: 'bandpass', f: f * pv, q: 0.8 }); break; }
      case 'hoe': noise(t, 0.14, 0.4 * v, sfxBus, { f: 500, f2: 150 }); tone(100, t, 0.1, 'sine', 0.35 * v, sfxBus, { f2: 50 }); break;
      case 'water': noise(t, 0.3, 0.22 * v, sfxBus, { type: 'bandpass', f: 1800, f2: 900, q: 2 }); tone(700 * pv, t + 0.05, 0.1, 'sine', 0.06 * v, sfxBus, { f2: 1100 }); break;
      case 'chop': noise(t, 0.07, 0.35 * v, sfxBus, { type: 'highpass', f: 1500 }); tone(150 * pv, t, 0.1, 'square', 0.2 * v, sfxBus, { f2: 80, lp: 600 }); break;
      case 'treefall': tone(220, t, 0.7, 'sawtooth', 0.15 * v, sfxBus, { f2: 55, lp: 500, a: 0.1 }); noise(t + 0.45, 0.35, 0.4 * v, sfxBus, { f: 400, f2: 80 }); break;
      case 'mine': tone(1100 * pv, t, 0.12, 'triangle', 0.22 * v, sfxBus, { f2: 700 }); noise(t, 0.06, 0.3 * v, sfxBus, { type: 'highpass', f: 2500 }); break;
      case 'break': noise(t, 0.25, 0.45 * v, sfxBus, { f: 1500, f2: 200 }); tone(200, t, 0.18, 'square', 0.15 * v, sfxBus, { f2: 70 }); break;
      case 'coin': tone(988, t, 0.08, 'square', 0.14 * v); tone(1319, t + 0.07, 0.18, 'square', 0.14 * v, sfxBus, { r: 0.15 }); break;
      case 'sell': for (let i = 0; i < 4; i++) tone(988 * (1 + i * 0.12), t + i * 0.06, 0.07, 'square', 0.1 * v); tone(1568, t + 0.28, 0.2, 'triangle', 0.15 * v); break;
      case 'pickup': tone(560 * pv, t, 0.1, 'sine', 0.22 * v, sfxBus, { f2: 980 }); break;
      case 'click': tone(700, t, 0.04, 'square', 0.1 * v, sfxBus, { f2: 500 }); break;
      case 'hover': tone(900, t, 0.02, 'sine', 0.04 * v); break;
      case 'open': tone(440, t, 0.07, 'triangle', 0.15 * v); tone(660, t + 0.06, 0.1, 'triangle', 0.15 * v); break;
      case 'close': tone(660, t, 0.07, 'triangle', 0.13 * v); tone(440, t + 0.06, 0.1, 'triangle', 0.13 * v); break;
      case 'door': noise(t, 0.2, 0.25 * v, sfxBus, { f: 700, f2: 200 }); tone(110, t, 0.15, 'triangle', 0.2 * v, sfxBus, { f2: 70 }); break;
      case 'error': tone(170, t, 0.16, 'sawtooth', 0.14 * v, sfxBus, { lp: 700 }); tone(140, t + 0.09, 0.16, 'sawtooth', 0.14 * v, sfxBus, { lp: 700 }); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'triangle', 0.2 * v, sfxBus, { r: 0.25 })); break;
      case 'quest': [587, 740, 880].forEach((f, i) => tone(f, t + i * 0.1, 0.18, 'triangle', 0.18 * v, sfxBus, { r: 0.2 })); break;
      case 'achieve': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.22, 'square', 0.1 * v, sfxBus, { r: 0.2 })); break;
      case 'bite': for (let i = 0; i < 3; i++) tone(1200, t + i * 0.07, 0.05, 'square', 0.15 * v); break;
      case 'splash': noise(t, 0.35, 0.35 * v, sfxBus, { type: 'bandpass', f: 1200, f2: 400, q: 0.6 }); break;
      case 'cast': noise(t, 0.3, 0.2 * v, sfxBus, { type: 'highpass', f: 800, f2: 3500 }); break;
      case 'reel': tone(300 * pv, t, 0.03, 'square', 0.05 * v); break;
      case 'hit': noise(t, 0.1, 0.4 * v, sfxBus, { f: 1200, f2: 200 }); tone(130, t, 0.1, 'square', 0.2 * v, sfxBus, { f2: 60 }); break;
      case 'hurt': tone(260, t, 0.25, 'sawtooth', 0.18 * v, sfxBus, { f2: 90, lp: 900 }); noise(t, 0.12, 0.2 * v); break;
      case 'swing': noise(t, 0.14, 0.2 * v, sfxBus, { type: 'bandpass', f: 3000, f2: 700, q: 0.7 }); break;
      case 'slime': tone(180 * pv, t, 0.14, 'sine', 0.2 * v, sfxBus, { f2: 420 }); break;
      case 'bat': noise(t, 0.08, 0.15 * v, sfxBus, { type: 'bandpass', f: 4000, q: 2 }); break;
      case 'eat': for (let i = 0; i < 3; i++) noise(t + i * 0.11, 0.06, 0.25 * v, sfxBus, { f: 900, f2: 300 }); break;
      case 'plant': noise(t, 0.1, 0.2 * v, sfxBus, { f: 400, f2: 200 }); tone(200, t, 0.06, 'sine', 0.15 * v); break;
      case 'harvest': tone(480, t, 0.12, 'sine', 0.25 * v, sfxBus, { f2: 900 }); tone(900, t + 0.08, 0.1, 'sine', 0.15 * v); break;
      case 'sleep': [523, 440, 392, 330, 262].forEach((f, i) => tone(f, t + i * 0.28, 0.5, 'sine', 0.13 * v, sfxBus, { a: 0.05, r: 0.4 })); break;
      case 'thunder': noise(t, 2.4, 0.7 * v, sfxBus, { f: 300, f2: 50, a: 0.05, d: 1.6, s: 0.3, r: 0.6 }); break;
      case 'craft': for (let i = 0; i < 3; i++) { tone(300 + i * 40, t + i * 0.1, 0.06, 'square', 0.12 * v, sfxBus, { lp: 1500 }); noise(t + i * 0.1, 0.04, 0.2 * v, sfxBus, { type: 'highpass', f: 2000 }); } break;
      case 'machine': tone(90, t, 0.3, 'sawtooth', 0.12 * v, sfxBus, { lp: 300, f2: 70 }); break;
      case 'chicken': tone(500 * pv, t, 0.06, 'square', 0.08 * v, sfxBus, { f2: 650, lp: 1500 }); tone(560 * pv, t + 0.08, 0.06, 'square', 0.08 * v, sfxBus, { f2: 700, lp: 1500 }); break;
      case 'cow': tone(150, t, 0.7, 'sawtooth', 0.12 * v, sfxBus, { f2: 105, lp: 500, a: 0.1 }); break;
      case 'dialog': tone(480 + Math.random() * 160, t, 0.035, 'triangle', 0.06 * v); break;
      case 'heart': [659, 880, 1319].forEach((f, i) => tone(f, t + i * 0.08, 0.18, 'sine', 0.2 * v, sfxBus, { r: 0.25 })); break;
      case 'gift': [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.12, 'triangle', 0.15 * v)); break;
      case 'bomb': noise(t, 0.6, 0.7 * v, sfxBus, { f: 1800, f2: 60, d: 0.4 }); tone(80, t, 0.4, 'sine', 0.4 * v, sfxBus, { f2: 30 }); break;
      case 'stairs': for (let i = 0; i < 4; i++) noise(t + i * 0.09, 0.05, 0.2 * v, sfxBus, { f: 800, f2: 500 }); break;
      case 'firefly': tone(1500, t, 0.5, 'sine', 0.05 * v, sfxBus, { a: 0.2, r: 0.3, f2: 2000 }); break;
      case 'ring': tone(1760, t, 0.5, 'sine', 0.1 * v, sfxBus, { r: 0.6 }); tone(2637, t, 0.4, 'sine', 0.05 * v, sfxBus, { r: 0.5 }); break;
    }
  }

  /* ---------- música gerativa ---------- */
  function chordNotes(tr, deg) {
    const sc = MODES[tr.mode];
    const n = i => { const o = Math.floor(i / 7); return tr.root + 12 * o + sc[((i % 7) + 7) % 7]; };
    return [n(deg), n(deg + 2), n(deg + 4)];
  }
  function scaleNote(tr, idx) {
    const sc = MODES[tr.mode];
    const o = Math.floor(idx / 7);
    return tr.root + 12 * o + sc[((idx % 7) + 7) % 7];
  }
  function voice(tr, midi, t, dur, vol) {
    const f = mtof(midi), dest = tg;
    switch (tr.wave) {
      case 'bell': tone(f, t, dur * 1.4, 'sine', vol * 0.9, dest, { a: 0.004, d: 0.5, s: 0.15, r: 0.9 }); tone(f * 2.01, t, dur, 'sine', vol * 0.25, dest, { a: 0.003, d: 0.25, s: 0.05, r: 0.5 }); tone(f * 3.99, t, 0.2, 'sine', vol * 0.08, dest, { r: 0.2 }); break;
      case 'pluck': tone(f, t, dur * 0.6, 'triangle', vol, dest, { a: 0.003, d: 0.18, s: 0.08, r: 0.15, lp: 3200 }); tone(f * 2, t, 0.08, 'square', vol * 0.07, dest, { r: 0.05, lp: 3000 }); break;
      default: tone(f, t, dur * 0.9, 'triangle', vol, dest, { a: 0.01, d: 0.25, s: 0.35, r: 0.25 });
    }
  }
  function scheduleStep(tr, st, t) {
    const barIdx = Math.floor(st / 16), s = st % 16;
    const deg = tr.prog[barIdx % tr.prog.length];
    const chord = chordNotes(tr, deg);
    const stepDur = 60 / tr.bpm / 4;
    const barDur = stepDur * 16;
    if (s === 0) {
      chord.forEach((m, i) => tone(mtof(m - 12), t, barDur, 'sawtooth', 0.028 * tr.pad, tg, { a: 0.9, d: 0.3, s: 0.8, r: 1.2, lp: tr.dark ? 380 : 800 }));
      tone(mtof(chord[0] - 24), t, stepDur * 6, 'triangle', 0.16, tg, { a: 0.02, d: 0.3, s: 0.6, r: 0.3, lp: 400 });
    } else if (s === 8 && !tr.dark) tone(mtof(chord[tr.mode === 'lyd' ? 2 : 0] - 24 + (tr.mode === 'lyd' ? 0 : 7)), t, stepDur * 4, 'triangle', 0.12, tg, { a: 0.02, d: 0.3, s: 0.5, r: 0.2, lp: 400 });
    if (tr.arp && s % 2 === 0) {
      const n = chord[(s / 2) % 3] + 12;
      if (((s / 2 + barIdx) % 3) !== 2) voice({ wave: 'pluck' }, n, t, stepDur * 2, 0.05);
    }
    if (tr.perc) {
      if (s === 0 || s === 8) tone(120, t, 0.12, 'sine', 0.22, tg, { f2: 45, a: 0.002, d: 0.08, s: 0.1 });
      if (s === 4 || s === 12) noise(t, 0.05, 0.08, tg, { type: 'highpass', f: 6000 });
      if (s % 2 === 1) noise(t, 0.025, 0.03, tg, { type: 'highpass', f: 8000 });
    }
    // melodia com motivo repetido a cada 4 compassos
    const r = VV.U.rng(tr.seed * 997 + (barIdx % 4) * 131 + (Math.floor(barIdx / 8) % 2) * 17 + s * 7);
    const dens = tr.dens * (s % 4 === 0 ? 1.4 : s % 2 === 0 ? 0.9 : 0.5);
    if (r() < dens && !(s === 0 && barIdx % 8 === 7)) {
      const strong = s % 8 === 0;
      let step = [-2, -1, -1, 0, 1, 1, 2, 3, -3][Math.floor(r() * 9)];
      mel = VV.U.clamp(mel + step, 7, 16);
      if (strong) { // encosta em nota do acorde
        let best = mel, bd = 99;
        for (let i = mel - 3; i <= mel + 3; i++) { const m = scaleNote(tr, i) % 12; if (chord.some(c => c % 12 === m) && Math.abs(i - mel) < bd) { bd = Math.abs(i - mel); best = i; } }
        mel = VV.U.clamp(best, 7, 16);
      }
      const len = r() < 0.3 ? 4 : r() < 0.5 ? 2 : 1;
      voice(tr, scaleNote(tr, mel), t, stepDur * len * 1.6, 0.12 + (strong ? 0.03 : 0));
    }
  }
  function tick() {
    if (!ctx || !cur) return;
    const tr = TRACKS[cur];
    const stepDur = 60 / tr.bpm / 4;
    while (nextT < ctx.currentTime + 0.3) {
      scheduleStep(tr, stepN, nextT + ((stepN % 2) && tr.perc ? stepDur * 0.12 : 0));
      nextT += stepDur; stepN++;
    }
  }
  function play(name) {
    if (!TRACKS[name]) return;
    if (!ctx) { pending = name; return; }
    if (name === curName) return;
    curName = name;
    if (tg) { const old = tg; old.gain.cancelScheduledValues(ctx.currentTime); old.gain.setValueAtTime(old.gain.value, ctx.currentTime); old.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4); setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 2500); }
    tg = ctx.createGain(); tg.gain.value = 0; tg.connect(musicBus);
    tg.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.6);
    cur = name; stepN = 0; nextT = ctx.currentTime + 0.25; mel = 11;
    if (!timer) timer = setInterval(tick, 60);
  }
  function stop() { if (tg && ctx) { tg.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); } curName = null; cur = null; }

  /* ---------- ambiência ---------- */
  function ensureAmb(kind) {
    if (amb.nodes[kind]) return amb.nodes[kind];
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain(); g.gain.value = 0;
    if (kind === 'rain') { f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.5; }
    else if (kind === 'wind') { f.type = 'lowpass'; f.frequency.value = 500; }
    else { f.type = 'lowpass'; f.frequency.value = 160; }
    src.connect(f); f.connect(g); g.connect(ambBus); src.start();
    let lfo = null;
    if (kind === 'wind') { lfo = ctx.createOscillator(); lfo.frequency.value = 0.15; const lg = ctx.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); }
    return (amb.nodes[kind] = { src, f, g, lfo });
  }
  const AMB_VOL = { rain: 0.5, wind: 0.35, cave: 0.5 };
  function applyAmbience() {
    if (!ctx) return;
    for (const k of ['rain', 'wind', 'cave']) {
      const n = ensureAmb(k);
      n.g.gain.linearRampToValueAtTime(amb.want[k] ? AMB_VOL[k] : 0, ctx.currentTime + 1.2);
    }
  }
  function setAmbience(w) { amb.want = w; applyAmbience(); }
  // piadas de pássaros / grilos / pingos: eventos esporádicos
  let lastBird = 0;
  function critters(kind, dt) {
    if (!ctx || ctx.state !== 'running') return;
    lastBird -= dt;
    if (lastBird > 0) return;
    const t = ctx.currentTime;
    if (kind === 'birds') {
      lastBird = 2 + Math.random() * 6;
      const base = 2200 + Math.random() * 1500;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) tone(base * (1 + Math.random() * 0.3), t + i * 0.11, 0.08, 'sine', 0.05, ambBus, { f2: base * 1.4, a: 0.01 });
    } else if (kind === 'crickets') {
      lastBird = 0.9 + Math.random() * 1.5;
      for (let i = 0; i < 4; i++) tone(4300, t + i * 0.06, 0.03, 'sine', 0.018, ambBus, { a: 0.005 });
    } else if (kind === 'drip') {
      lastBird = 2 + Math.random() * 5;
      tone(1300 + Math.random() * 500, t, 0.1, 'sine', 0.05, ambBus, { f2: 700 });
    }
  }
  function setVolume(kind, v) {
    S[kind] = v;
    if (!ctx) return;
    if (kind === 'music') musicBus.gain.value = v * 0.55;
    if (kind === 'sfx') sfxBus.gain.value = v;
    if (kind === 'amb') ambBus.gain.value = v * 0.5;
  }
  return { init, sfx, play, stop, setAmbience, critters, setVolume, vol: S, get ready() { return !!ctx; }, get track() { return curName; } };
})();
