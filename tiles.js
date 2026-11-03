'use strict';
/* ============================================================
   Terrenos em pixel art: texturas por estação, autotile procedural
   (bordas orgânicas entre terrenos), água animada e terra arada.
   ============================================================ */
VV.Art = VV.Art || {};
VV.Art.Tiles = (() => {
  const U = VV.U, Px = VV.Px, T = 16;

  const GRASS = [
    { b: '#7ec850', l: '#9bdc66', d: '#62b449', k: '#4a9a40' }, // primavera
    { b: '#63b93c', l: '#84d054', d: '#4a9d35', k: '#378030' }, // verão
    { b: '#b9b042', l: '#d1c858', d: '#98933a', k: '#7b7a30' }, // outono
    { b: '#e7eff8', l: '#ffffff', d: '#c6d6ea', k: '#a1b8d8' }, // inverno
  ];
  const KIND = {
    grass: { pr: 2, blend: 1 }, path: { pr: 3, blend: 1 }, sand: { pr: 1, blend: 1 }, water: { pr: 0, blend: 1, solid: 1 },
    cobble: { pr: 4, blend: 1 }, rock: { pr: 3, blend: 1 },
    cliff: { solid: 1 }, void: { solid: 1 },
    wood: {}, tile: {}, wall_top: { solid: 1 }, wall_face: { solid: 1 },
    cave_floor: {}, cave_wall: { solid: 1 },
  };
  const WALLS = [
    { w: '#eadbb6', s: '#decca2', t: '#8a5a35', k: 'stripe' },   // creme
    { w: '#abc89c', s: '#9dbd8e', t: '#6b4b33', k: 'stripe' },   // sálvia
    { w: '#9dc4e2', s: '#8fb8d8', t: '#5f4a3a', k: 'stripe' },   // céu
    { w: '#e2abab', s: '#d69d9d', t: '#6b4538', k: 'stripe' },   // rosa
    { w: '#a9713d', s: '#97622f', t: '#5a3820', k: 'plank' },    // madeira
    { w: '#8e8a98', s: '#7e7a8a', t: '#4c4858', k: 'brick' },    // pedra
  ];

  /* ---------- geradores de textura ---------- */
  const GEN = {};
  GEN.grass = (v, s) => {
    const g = GRASS[s], p = new Px(T, T), r = U.rng(s * 131 + v * 17 + 5);
    p.r(0, 0, T, T, g.b);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const n = VV.pnoise(x / 4 + v * 3.1, y / 4 + v * 1.7, 4, s * 10 + v);
      if (n > 0.66) p.p(x, y, g.l); else if (n < 0.28) p.p(x, y, g.d);
    }
    for (let i = 0; i < 7; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), r() < 0.5 ? g.l : g.d);
    const nt = [2, 3, 2, 3][v];
    for (let i = 0; i < nt; i++) {
      const x = U.ri(1, 13, r), y = U.ri(4, 14, r);
      if (s === 3) { p.p(x, y, g.d); p.p(x + 1, y, g.d); p.p(x + 2, y + 1, g.k); }
      else { p.p(x, y, g.k); p.p(x, y - 1, g.d); p.p(x - 1, y - 2, g.l); p.p(x + 1, y - 1, g.d); p.p(x + 1, y - 2, g.l); }
    }
    if (s === 3) { for (let i = 0; i < 3; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), '#ffffff'); if (v === 3) { p.p(5, 9, '#cfe3f7'); p.p(10, 4, '#cfe3f7'); } }
    else if (v === 3 || (v === 1 && s === 1)) {
      const cols = s === 0 ? ['#ff8fb4', '#ffffff', '#ffd84a', '#c9a0ff'] : s === 1 ? ['#ffe14d', '#ffffff', '#ff9d4a'] : ['#e8793a', '#d2442d'];
      const c = cols[U.ri(0, cols.length - 1, r)], x = U.ri(3, 12, r), y = U.ri(3, 12, r);
      if (s === 2) { p.p(x, y, c); p.p(x + 1, y, c); p.p(x + 1, y + 1, U.shade(c, -0.2)); }
      else { p.p(x, y - 1, c); p.p(x - 1, y, c); p.p(x + 1, y, c); p.p(x, y + 1, c); p.p(x, y, '#ffd23a'); p.p(x, y + 2, g.k); }
      if (s === 0) { const x2 = U.ri(2, 13, r), y2 = U.ri(2, 13, r); p.p(x2, y2, '#ffffff'); p.p(x2, y2 + 1, g.k); }
    } else if (s === 2 && v === 2) { p.p(4, 5, '#d2442d'); p.p(5, 5, '#e8793a'); p.p(11, 11, '#e8a53a'); p.p(10, 11, '#d2442d'); }
    return p;
  };
  GEN.path = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 31 + 7);
    const b = s === 3 ? '#c4a581' : '#b98c5b', l = s === 3 ? '#d8c19f' : '#cfa46c', d = s === 3 ? '#a98962' : '#9c7145';
    p.r(0, 0, T, T, b);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const n = VV.pnoise(x / 3 + v * 2.3, y / 3 + v * 4.1, 5, 77 + v);
      if (n > 0.67) p.p(x, y, l); else if (n < 0.27) p.p(x, y, d);
    }
    for (let i = 0; i < 2 + (v & 1); i++) {
      const x = U.ri(1, 13, r), y = U.ri(1, 13, r);
      p.p(x, y, '#cbc4b6'); p.p(x + 1, y, '#b3ab9d'); p.p(x, y + 1, '#8f8678'); p.p(x + 1, y + 1, '#8f8678');
    }
    for (let i = 0; i < 6; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), r() < 0.5 ? l : d);
    if (s === 3) for (let i = 0; i < 4; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), '#ffffff');
    return p;
  };
  GEN.cobble = v => {
    const p = new Px(T, T), r = U.rng(v * 13 + 3);
    p.r(0, 0, T, T, '#625e72');
    const stone = (x, y, w, h, i) => {
      const k = (U.hash2(x, y, v + i) - 0.5) * 0.12;
      const b = U.shade('#aaa6b4', k);
      p.r(x, y, w, h, b);
      p.r(x, y, w, 1, U.shade(b, 0.22)); p.r(x, y + h - 1, w, 1, U.shade(b, -0.2));
      p.p(x, y, '#625e72'); p.p(x + w - 1, y, '#625e72'); p.p(x, y + h - 1, '#625e72'); p.p(x + w - 1, y + h - 1, '#625e72');
      for (let j = 0; j < 2; j++) p.p(x + 1 + Math.floor(r() * (w - 2)), y + 1 + Math.floor(r() * (h - 3)), U.shade(b, r() < 0.5 ? 0.12 : -0.1));
    };
    stone(0, 0, 7, 7, 0); stone(8, 0, 8, 7, 1);
    stone(0, 8, 3, 8, 2); stone(4, 8, 8, 8, 3); stone(12, 8, 4, 8, 4);
    return p;
  };
  GEN.sand = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 19 + 11);
    const b = s === 3 ? '#efe6cc' : '#ead69f', l = s === 3 ? '#fbf5e3' : '#f6e8b8', d = s === 3 ? '#d6c9a8' : '#d4bc7e';
    p.r(0, 0, T, T, b);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const n = VV.pnoise(x / 5 + v, y / 2.2 + v * 3, 4, 91);
      if (n > 0.68) p.p(x, y, l); else if (n < 0.26) p.p(x, y, d);
    }
    for (let i = 0; i < 5; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), '#b89e68');
    if (v === 2) { p.p(4, 9, '#fff2e8'); p.p(5, 9, '#f5cfc2'); p.p(5, 10, '#d9a99a'); }
    return p;
  };
  GEN.rock = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 23 + 1);
    const b = s === 3 ? '#b9b8c6' : '#8f8a8d', l = s === 3 ? '#dcdce8' : '#a8a2a3', d = s === 3 ? '#9a99ac' : '#756f74';
    p.r(0, 0, T, T, b);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const n = VV.pnoise(x / 3.5 + v * 5, y / 3.5, 4, 55 + v);
      if (n > 0.64) p.p(x, y, l); else if (n < 0.3) p.p(x, y, d);
    }
    for (let i = 0; i < 2; i++) { let x = U.ri(1, 13, r), y = U.ri(1, 12, r); const dx = r() < 0.5 ? 1 : -1; for (let k = 0; k < 4; k++) { p.p(x, y, d); x += dx * (k % 2); y += 1; } }
    return p;
  };
  GEN.cliff = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 29 + 9);
    p.r(0, 0, T, T, s === 3 ? '#a9a8bb' : '#6f6670');
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = VV.pnoise(x / 4 + v, y / 2.5, 4, 66); if (n > 0.62) p.p(x, y, s === 3 ? '#c2c1d4' : '#857b86'); else if (n < 0.3) p.p(x, y, s === 3 ? '#8d8ca2' : '#58505b'); }
    return p;
  };
  GEN.cliff_face = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 37 + 2);
    const b = s === 3 ? '#b4b3c8' : '#8e8084', l = s === 3 ? '#dad9ec' : '#b0a2a2', d = s === 3 ? '#8f8eaa' : '#6b5c65', k = s === 3 ? '#74738f' : '#4e434d';
    p.r(0, 0, T, T, b);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = VV.pnoise(x / 6 + v * 3, y / 2, 4, 71); if (n > 0.6) p.p(x, y, l); else if (n < 0.34) p.p(x, y, d); }
    p.r(0, 0, T, 2, l); p.r(0, 2, T, 1, b);
    for (const sy of [6, 11]) { for (let x = 0; x < T; x++) if (U.hash2(x, sy, v) > 0.35) p.p(x, sy, d); }
    p.r(0, 14, T, 2, k); p.r(0, 13, T, 1, d);
    if (s !== 3) for (let x = 0; x < T; x++) if (U.hash2(x, 99, v) > 0.45) { p.p(x, 0, '#7fae52'); if (U.hash2(x, 98, v) > 0.5) p.p(x, 1, '#5f9440'); }
    return p;
  };
  GEN.wood = v => {
    const p = new Px(T, T), r = U.rng(v * 41 + 4);
    p.r(0, 0, T, T, '#b88049');
    for (let row = 0; row < 2; row++) {
      const y0 = row * 8, off = row ? 7 : 0, k = (U.hash2(row, v, 3) - 0.5) * 0.1;
      const base = U.shade('#b88049', k);
      p.r(0, y0, T, 8, base);
      p.r(0, y0, T, 1, U.shade(base, 0.22));
      p.r(0, y0 + 7, T, 1, '#7c5230');
      p.r(off % T, y0, 1, 8, '#7c5230'); p.p((off + 8) % T, y0, '#7c5230');
      for (let i = 0; i < 4; i++) { const x = U.ri(0, 15, r), y = y0 + U.ri(2, 5, r); p.r(x, y, U.ri(2, 4, r), 1, U.shade(base, r() < 0.5 ? 0.12 : -0.12)); }
    }
    if (v === 2) { p.p(10, 3, '#8a5c34'); p.p(11, 3, '#6e4627'); p.p(10, 4, '#6e4627'); }
    return p;
  };
  GEN.tile = v => {
    const p = new Px(T, T);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const c = (x + y) % 2 ? '#d9c8a1' : '#ebdfc3';
      p.r(x * 8, y * 8, 8, 8, c); p.r(x * 8, y * 8, 8, 1, U.shade(c, 0.25)); p.r(x * 8, y * 8 + 7, 8, 1, U.shade(c, -0.14)); p.r(x * 8 + 7, y * 8, 1, 8, U.shade(c, -0.1));
    }
    return p;
  };
  GEN.wall_top = (v, s, th) => {
    const p = new Px(T, T), w = WALLS[th] || WALLS[0];
    p.r(0, 0, T, T, U.shade(w.t, -0.32));
    p.r(0, 0, T, 1, U.shade(w.t, -0.1));
    for (let i = 0; i < 6; i++) p.p(U.hash2(i, v, 1) * 16, U.hash2(i, v, 2) * 16, U.shade(w.t, -0.45));
    return p;
  };
  GEN.wall_face = (v, s, th) => {
    const p = new Px(T, T), w = WALLS[th] || WALLS[0];
    p.r(0, 0, T, T, w.w);
    if (w.k === 'stripe') { for (let x = 0; x < T; x += 4) p.r(x, 0, 2, 13, w.s); for (let x = 2; x < T; x += 4) for (let y = 3; y < 12; y += 4) p.p(x, y, U.shade(w.w, 0.2)); }
    else if (w.k === 'plank') { for (let x = 0; x < T; x += 5) { p.r(x, 0, 1, 13, U.shade(w.w, -0.3)); p.r(x + 1, 0, 1, 13, U.shade(w.w, 0.12)); } for (let i = 0; i < 6; i++) p.p(U.hash2(i, v, 8) * 16, U.hash2(i, v, 9) * 12, U.shade(w.w, -0.14)); }
    else { for (let y = 0; y < 13; y += 4) { p.r(0, y, T, 1, U.shade(w.w, -0.3)); const o = (y / 4) % 2 ? 0 : 4; for (let x = o; x < T; x += 8) p.r(x, y, 1, 4, U.shade(w.w, -0.3)); } for (let i = 0; i < 8; i++) p.p(U.hash2(i, v, 8) * 16, U.hash2(i, v, 9) * 12, U.shade(w.w, 0.14)); }
    p.r(0, 0, T, 1, U.shade(w.w, -0.3)); // sombra do teto
    p.r(0, 13, T, 3, w.t); p.r(0, 13, T, 1, U.shade(w.t, 0.25)); p.r(0, 15, T, 1, U.shade(w.t, -0.25));
    return p;
  };
  GEN.cave_floor = (v, s) => {
    const p = new Px(T, T), r = U.rng(v * 53 + 8);
    p.r(0, 0, T, T, '#4c4662');
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = VV.pnoise(x / 3.5 + v * 2, y / 3.5 + v, 4, 41); if (n > 0.66) p.p(x, y, '#5d5778'); else if (n < 0.3) p.p(x, y, '#3d3853'); }
    for (let i = 0; i < 6; i++) p.p(U.ri(0, 15, r), U.ri(0, 15, r), r() < 0.6 ? '#5d5778' : '#332f48');
    if (v === 1) { p.p(5, 6, '#6a82b8'); p.p(6, 6, '#8aa2d6'); }
    if (v === 3) { let x = 3, y = 4; for (let k = 0; k < 6; k++) { p.p(x, y, '#2f2b44'); x += k % 2; y += 1; } }
    return p;
  };
  GEN.cave_wall = v => {
    const p = new Px(T, T);
    p.r(0, 0, T, T, '#2b2642');
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = VV.pnoise(x / 3 + v * 2, y / 3, 4, 17); if (n > 0.68) p.p(x, y, '#362f52'); else if (n < 0.25) p.p(x, y, '#231f38'); }
    return p;
  };
  GEN.cave_wall_face = v => {
    const p = new Px(T, T);
    p.r(0, 0, T, T, '#5c5476');
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const n = VV.pnoise(x / 5 + v * 2, y / 2, 4, 27); if (n > 0.62) p.p(x, y, '#716891'); else if (n < 0.33) p.p(x, y, '#4a4363'); }
    p.r(0, 0, T, 2, '#8a80ac'); p.r(0, 2, T, 1, '#6a6188');
    for (const sy of [6, 10]) for (let x = 0; x < T; x++) if (U.hash2(x, sy, v) > 0.4) p.p(x, sy, '#443d5d');
    p.r(0, 13, T, 3, '#2f2a47'); p.r(0, 12, T, 1, '#463f60');
    return p;
  };
  GEN.void = () => new Px(T, T).r(0, 0, T, T, '#0b0714');

  // água: padrão contínuo em coordenadas globais, loop perfeito em 4 frames
  function waterPixel(gx, gy, f, s) {
    const a = (f / 4) * Math.PI * 2;
    const n = U.vnoise(gx / 5.5 + Math.cos(a) * 1.3, gy / 2.2 + Math.sin(a) * 1.3, 301);
    const n2 = U.vnoise(gx / 2.5 - Math.sin(a) * 0.9, gy / 4 + Math.cos(a) * 0.9, 302);
    const ice = s === 3;
    const base = ice ? [96, 160, 208] : [58, 132, 196], deep = ice ? [78, 140, 192] : [44, 108, 170], hi = ice ? [190, 232, 252] : [120, 194, 238], sp = [232, 248, 255];
    if (n > 0.8 && n2 > 0.5) return hi;
    if (n2 > 0.95 && n > 0.6) return sp;
    if (n < 0.27) return deep;
    return base;
  }

  /* ---------- cache & composição ---------- */
  const cache = new Map();
  function tex(kind, v, s, th, f) {
    const key = kind + '|' + v + '|' + s + '|' + th;
    let t = cache.get(key);
    if (!t) { const p = GEN[kind](v, s, th); t = p.data().data; cache.set(key, t); }
    return t;
  }
  function edgeColor(K, s) {
    switch (K) {
      case 'grass': return U.shade(GRASS[s].k, -0.3);
      case 'path': return '#7e5632';
      case 'sand': return '#b09762';
      case 'cobble': return '#4b475a';
      case 'rock': return '#5a5459';
      default: return '#333';
    }
  }
  const edgeCache = {};
  const ec = (K, s) => (edgeCache[K + s] = edgeCache[K + s] || U.hex2rgb(edgeColor(K, s)));

  function overlay(out, W, ox, oy, K, tx, ty, nbk, s, mode) {
    const sd = [nbk[0] === K, nbk[1] === K, nbk[2] === K, nbk[3] === K];
    const dg = [nbk[4] === K && !sd[0] && !sd[1], nbk[5] === K && !sd[1] && !sd[2], nbk[6] === K && !sd[2] && !sd[3], nbk[7] === K && !sd[3] && !sd[0]];
    const kt = tex(K, (U.hash2(tx, ty, 9) * 4) | 0, s, 0);
    const th = [[], [], [], []];
    for (let i = 0; i < 16; i++) {
      const gx = tx * 16 + i, gy = ty * 16 + i;
      th[0][i] = 2.2 + 2.6 * U.vnoise(gx / 3.4, ty * 5.3 + 1, 31);
      th[2][i] = 2.2 + 2.6 * U.vnoise(gx / 3.4, ty * 5.3 + 2, 32);
      th[3][i] = 2.2 + 2.6 * U.vnoise(gy / 3.4, tx * 5.3 + 3, 33);
      th[1][i] = 2.2 + 2.6 * U.vnoise(gy / 3.4, tx * 5.3 + 4, 34);
    }
    const E = ec(K, s);
    for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
      let depth = -99;
      if (sd[0]) depth = Math.max(depth, th[0][px] - (py + 0.5));
      if (sd[2]) depth = Math.max(depth, th[2][px] - (15.5 - py));
      if (sd[3]) depth = Math.max(depth, th[3][py] - (px + 0.5));
      if (sd[1]) depth = Math.max(depth, th[1][py] - (15.5 - px));
      const cx = [16, 16, 0, 0], cy = [0, 16, 16, 0];
      for (let c = 0; c < 4; c++) if (dg[c]) depth = Math.max(depth, 3.7 - Math.hypot(cx[c] - px - 0.5, cy[c] - py - 0.5));
      const o = ((oy + py) * W + ox + px) * 4;
      if (depth > 0) {
        if (depth <= 1) { out[o] = E[0]; out[o + 1] = E[1]; out[o + 2] = E[2]; out[o + 3] = 255; }
        else { const i = (py * 16 + px) * 4; out[o] = kt[i]; out[o + 1] = kt[i + 1]; out[o + 2] = kt[i + 2]; out[o + 3] = 255; }
      } else if (mode && depth > -1.2 && depth <= 0) { // espuma (somente em água)
        if (((px + py + mode * 2) & 3) < 3) { out[o] = out[o] * 0.35 + 255 * 0.65; out[o + 1] = out[o + 1] * 0.35 + 255 * 0.65; out[o + 2] = out[o + 2] * 0.35 + 255 * 0.65; }
      }
    }
  }
  function kindsAround(get, x, y, self) {
    const k = (dx, dy) => get(x + dx, y + dy) || self;
    return [k(0, -1), k(1, 0), k(0, 1), k(-1, 0), k(1, -1), k(1, 1), k(-1, 1), k(-1, -1)];
  }
  function composeTile(out, W, ox, oy, kind, tx, ty, nbk, s, th, frame) {
    const v = (U.hash2(tx, ty, 5) * 4) | 0;
    let rk = kind;
    if (kind === 'cave_wall' && nbk[2] !== 'cave_wall' && nbk[2] !== 'void' && nbk[2]) rk = 'cave_wall_face';
    if (kind === 'cliff' && nbk[2] !== 'cliff' && nbk[2] !== 'void' && nbk[2]) rk = 'cliff_face';
    if (kind === 'water') {
      for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
        const c = waterPixel(tx * 16 + px, ty * 16 + py, frame, s), o = ((oy + py) * W + ox + px) * 4;
        out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
      }
    } else {
      const base = tex(rk, v, s, th);
      for (let i = 0; i < 256; i++) {
        const o = ((oy + (i >> 4)) * W + ox + (i & 15)) * 4, b = i * 4;
        out[o] = base[b]; out[o + 1] = base[b + 1]; out[o + 2] = base[b + 2]; out[o + 3] = base[b + 3];
      }
    }
    const kd = KIND[kind];
    if (!kd || !kd.blend) return;
    const hi = [];
    for (const k of nbk) if (k && KIND[k] && KIND[k].blend && KIND[k].pr > kd.pr && !hi.includes(k)) hi.push(k);
    hi.sort((a, b) => KIND[a].pr - KIND[b].pr);
    for (const K of hi) overlay(out, W, ox, oy, K, tx, ty, nbk, s, kind === 'water' ? frame + 1 : 0);
  }

  // pré-renderiza o chão do mapa (terra) e 4 quadros de água
  function renderMap(map, season) {
    const W = map.w * T, H = map.h * T;
    const ground = new Px(W, H), gid = ground.x.createImageData(W, H);
    const get = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? null : map.ground[y][x];
    let hasWater = false;
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const k = map.ground[y][x];
      if (k === 'water') { hasWater = true; continue; }
      composeTile(gid.data, W, x * T, y * T, k, x, y, kindsAround(get, x, y, k), season, map.theme || 0, 0);
    }
    ground.put(gid);
    const water = [];
    if (hasWater) for (let f = 0; f < 4; f++) {
      const p = new Px(W, H), id = p.x.createImageData(W, H);
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
        if (map.ground[y][x] !== 'water') continue;
        composeTile(id.data, W, x * T, y * T, 'water', x, y, kindsAround(get, x, y, 'water'), season, 0, f);
      }
      p.put(id); water.push(p.c);
    }
    map.groundCanvas = ground.c; map.waterCanvas = water; map.groundSeason = season;
  }

  /* ---------- terra arada (dinâmica, por máscara de vizinhos) ---------- */
  const soilCache = {};
  function soil(mask, wet) {
    const key = mask + (wet ? 'w' : 'd');
    if (soilCache[key]) return soilCache[key];
    const p = new Px(T, T);
    const base = wet ? '#46301f' : '#6d4a30', ridge = wet ? '#5b3e29' : '#8a6040', fur = wet ? '#2f1e12' : '#53361f', rim = wet ? '#6a4c36' : '#a0764b';
    p.r(0, 0, T, T, base);
    for (let y = 0; y < T; y += 4) { p.r(0, y, T, 1, ridge); p.r(0, y + 2, T, 1, fur); p.r(0, y + 3, T, 1, fur); }
    for (let i = 0; i < 10; i++) p.p(U.hash2(i, mask, 5) * 16, U.hash2(i, mask, 6) * 16, U.hash2(i, mask, 7) > 0.5 ? ridge : fur);
    if (wet) for (let i = 0; i < 5; i++) p.p(U.hash2(i, mask, 15) * 16, U.hash2(i, mask, 16) * 16, '#5a6f93');
    const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
    if (!N) { p.r(0, 0, T, 1, rim); p.r(0, 1, T, 1, ridge); }
    if (!S) { p.r(0, 14, T, 2, '#2c1b10'); p.r(0, 13, T, 1, fur); }
    if (!W) { p.r(0, 0, 1, T, rim); }
    if (!E) { p.r(15, 0, 1, T, '#2c1b10'); }
    const clear = (x, y) => p.x.clearRect(x, y, 1, 1);
    if (!N && !W) { clear(0, 0); } if (!N && !E) { clear(15, 0); } if (!S && !W) { clear(0, 15); clear(1, 15); clear(0, 14); } if (!S && !E) { clear(15, 15); clear(14, 15); clear(15, 14); }
    return (soilCache[key] = p.c);
  }

  // re-renderiza um bloco 3x3 do chão (após mudar um tile)
  function refresh(map, tx, ty) {
    if (!map.groundCanvas) return;
    const gx = map.groundCanvas.getContext('2d');
    const get = (x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? null : map.ground[y][x];
    for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      const k = map.ground[y][x]; if (k === 'water') continue;
      const id = gx.createImageData(16, 16);
      composeTile(id.data, 16, 0, 0, k, x, y, kindsAround(get, x, y, k), map.groundSeason, map.theme || 0, 0);
      gx.putImageData(id, x * 16, y * 16);
    }
  }

  return { T, KIND, GRASS, WALLS, renderMap, soil, composeTile, tex, refresh };
})();
