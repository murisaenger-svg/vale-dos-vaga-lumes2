'use strict';
/* ============================================================
   Construção dos mapas: fazenda, vila, bosque, montanha, praia e interiores.
   Coordenadas em tiles. Portas: o tile da porta é caminhável e dispara o warp.
   ============================================================ */
VV.Maps = (() => {
  const U = VV.U, W = VV.World, T = 16, B = VV.Art.Build, S = VV.Art.Special;
  const mk = (id, w, h, o) => new W.GameMap(id, w, h, o);

  /* ---------- fábricas de objetos ---------- */
  const O = {
    tree: (k = 'oak', stage = 4, v = 0) => ({ t: 'tree', k, stage, v, hp: stage >= 4 ? 14 : 3, solid: 1, days: 0 }),
    stump: () => ({ t: 'stump', hp: 6, solid: 1 }),
    log: () => ({ t: 'log', hp: 10, solid: 1, fw: 2, fh: 1 }),
    rock: (ore = 'stone', big = false, cave = false) => ({ t: 'rock', ore, big, cave, hp: big ? 16 : ({ stone: 3, copper_ore: 4, iron_ore: 6, gold_ore: 8, coal: 5, quartz: 5, amethyst: 7, topaz: 7, emerald: 9, ruby: 9, sapphire: 9, diamond: 12, crystal: 12, geode: 6, frozen_geode: 6, lumi_shard: 14 }[ore] || 4), solid: 1, fw: big ? 2 : 1, fh: big ? 2 : 1 }),
    weed: v => ({ t: 'weed', v: v ?? Math.floor(Math.random() * 2) }),
    gtall: () => ({ t: 'gtall' }),
    bush: berry => ({ t: 'bush', berry: berry || null, solid: 1, grown: true }),
    forage: (item, q = 0) => ({ t: 'forage', item, q }),
    debris: item => ({ t: 'debris', item }),
  };
  const free = (m, x, y) => m.inb(x, y) && !m.solidAt(x, y) && !m.getObj(x, y) && m.kind(x, y) !== 'water' && m.kind(x, y) !== 'cliff';
  function freeRect(m, x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!free(m, x + i, y - j)) return false; return true; }
  function blob(m, kind, cx, cy, rx, ry, seed, wob = 0.5, only) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      if (!m.inb(x, y)) continue;
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (U.vnoise(x / 2.5, y / 2.5, seed) - 0.5) * wob;
      if (d < 1 && (!only || only(m.ground[y][x]))) m.ground[y][x] = kind;
    }
  }
  function scatter(m, rng, x0, y0, x1, y1, n, make, ok, big) {
    let tries = 0, placed = 0;
    while (placed < n && tries < n * 30) {
      tries++;
      const x = U.ri(x0, x1, rng), y = U.ri(y0, y1, rng);
      const o = make();
      const fw = o.fw || 1, fh = o.fh || 1;
      if (!freeRect(m, x, y, fw, fh)) continue;
      if (ok && !ok(x, y)) continue;
      m.setObj(x, y, o); placed++;
    }
    return placed;
  }
  function borderTrees(m, rng, thick, gaps = [], pine = 0.3, skip) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const d = Math.min(x, y, m.w - 1 - x, m.h - 1 - y);
      if (d >= thick) continue;
      if (skip && skip(x, y)) continue;
      if (gaps.some(g => x >= g[0] && x < g[0] + g[2] && y >= g[1] && y < g[1] + g[3])) continue;
      if (!free(m, x, y)) continue;
      if (d === thick - 1 && rng() < 0.35) continue;
      m.setObj(x, y, O.tree(rng() < pine ? 'pine' : 'oak', 4, rng() < 0.25 ? 1 : 0));
    }
  }
  function pathLine(m, kind, pts, wd = 2) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / (n || 1)), y = Math.round(y0 + (y1 - y0) * k / (n || 1));
        for (let a = 0; a < wd; a++) for (let b = 0; b < wd; b++) if (m.inb(x + a, y + b) && m.ground[y + b][x + a] !== 'water') m.ground[y + b][x + a] = kind;
      }
    }
  }
  function warp(m, x, y, w, h, to, tx, ty, dir) { m.warps.push({ x, y, w, h, to, tx, ty, dir }); }
  // edifício exterior: sprite com footprint bloqueado e porta caminhável
  function building(m, spr, x, y, to, toTx, toTy, o = {}) {
    const w = spr.w, h = spr.h;
    m.blockRect(x, y, w, h, 1);
    const dtx = x + spr.doorTx, dty = y + h - 1;
    m.block[dty * m.w + dtx] = 0;
    if (o.wide) m.block[dty * m.w + dtx + 1] = 0;
    const b = { spr, x, y, w, h, doorX: dtx, doorY: dty, id: o.id || to, kind: o.kind || 'house' };
    m.buildings.push(b);
    if (to) warp(m, dtx, dty, o.wide ? 2 : 1, 1, to, toTx, toTy, 3);
    if (o.light !== false) m.lights.push({ x: dtx * T + 8, y: dty * T + 20, r: 40, col: '#ffcf80', night: 1, a: 0.5 });
    return b;
  }
  function lampPost(m, x, y) { m.setObj(x, y, { t: 'deco', k: 'lamp', solid: 1 }); m.lights.push({ x: x * T + 8, y: y * T - 18, r: 70, col: '#ffe0a0', night: 1, a: 0.8 }); }

  /* ============================================================
     FAZENDA — 50 x 40
     ============================================================ */
  function farm(seed, st) {
    const rng = U.rng(seed + 11);
    const m = mk('farm', 50, 40, { name: 'Fazenda da Vovó Alba', outdoor: true, music: 'spring', canTill: true, fishLoc: 'lake', seed });
    // caminhos
    pathLine(m, 'path', [[8, 9], [8, 12], [10, 20], [10, 20]], 2);
    pathLine(m, 'path', [[8, 12], [8, 20], [49, 20]], 2);
    pathLine(m, 'path', [[23, 20], [23, 1]], 2);
    pathLine(m, 'path', [[16, 10], [16, 14], [8, 14]], 2);
    pathLine(m, 'path', [[30, 11], [30, 13], [23, 13]], 2);
    pathLine(m, 'path', [[39, 10], [39, 14], [30, 14]], 2);
    pathLine(m, 'path', [[39, 14], [39, 20]], 2);
    // lagoa
    blob(m, 'sand', 38, 31, 8, 6, 3, 0.5);
    blob(m, 'water', 38, 31, 5.5, 3.8, 4, 0.6);
    m.fishZones = [{ x: 28, y: 22, w: 24, h: 18, loc: 'lake' }];
    // pedras decorativas à margem
    // casa
    const house = building(m, B.house({ w: 8, h: 6, wall: '#eadbb6', roof: '#b64a3c', door: '#7a4a2a', flowerBox: 1, curtain: '#c4473a', windows: [10, 100], chimneyX: 100 }), 4, 3, 'house', 5, 7);
    m.poi.spawn = [8, 9]; m.poi.house = [8, 9];
    // plots de construção
    m.plots = { coop: { x: 14, y: 6, w: 5, h: 4 }, barn: { x: 26, y: 5, w: 8, h: 6 }, silo: { x: 20, y: 8, w: 2, h: 2 }, greenhouse: { x: 36, y: 4, w: 7, h: 6 }, well: { x: 13, y: 12, w: 1, h: 1 } };
    m.setObj(12, 10, { t: 'deco', k: 'mailbox', solid: 1 });
    m.setObj(13, 11, { t: 'bin', solid: 1 });
    m.poi.bin = [13, 12];
    // trilhas e vegetação de borda
    const gaps = [[22, 0, 3, 3], [49, 19, 1, 3], [48, 19, 1, 3]];
    borderTrees(m, rng, 3, gaps, 0.3, (x, y) => (x >= 46 && y >= 19 && y <= 22));
    // limpa área de spawn
    // detritos e vegetação iniciais
    const okFar = (x, y) => m.kind(x, y) === 'grass' && Math.hypot(x - 8, y - 11) > 4 && !(x >= 3 && x <= 12 && y <= 10) && !(m.plots.coop && x >= 13 && x <= 20 && y >= 5 && y <= 10) && !(x >= 25 && x <= 34 && y >= 4 && y <= 11) && !(x >= 35 && x <= 43 && y >= 3 && y <= 10) && !(x >= 19 && x <= 22 && y >= 7 && y <= 10);
    if (st && st.fresh !== false) {
      scatter(m, rng, 4, 11, 46, 37, 150, () => O.weed(), okFar);
      scatter(m, rng, 4, 11, 46, 37, 45, () => O.gtall(), okFar);
      scatter(m, rng, 4, 11, 46, 37, 22, () => O.tree(rng() < 0.4 ? 'pine' : 'oak', 4, rng() < 0.2 ? 1 : 0), (x, y) => okFar(x, y) && Math.hypot(x - 8, y - 15) > 6);
      scatter(m, rng, 4, 11, 46, 37, 26, () => O.rock('stone', false), okFar);
      scatter(m, rng, 4, 11, 46, 37, 5, () => O.rock('stone', true), (x, y) => okFar(x, y) && Math.hypot(x - 8, y - 15) > 8);
      scatter(m, rng, 4, 11, 46, 37, 7, () => O.log(), (x, y) => okFar(x, y) && Math.hypot(x - 8, y - 15) > 8);
      scatter(m, rng, 4, 11, 46, 37, 6, () => O.stump(), okFar);
      scatter(m, rng, 4, 11, 46, 37, 14, () => O.debris('wood'), okFar);
      scatter(m, rng, 4, 11, 46, 37, 14, () => O.debris('stone'), okFar);
      scatter(m, rng, 4, 11, 46, 37, 4, () => O.bush(), okFar);
    }
    m.poi.pond = [32, 28];
    // saídas do mapa: norte → Bosque, leste → Vila
    warp(m, 23, 0, 2, 1, 'forest', 23, 32, 3);
    warp(m, 49, 20, 1, 2, 'town', 2, 18, 2);
    return m;
  }

  /* ============================================================
     VILA LUZERNA — 50 x 38
     ============================================================ */
  function town(seed) {
    const rng = U.rng(seed + 23);
    const m = mk('town', 50, 38, { name: 'Vila Luzerna', outdoor: true, music: 'town', fishLoc: 'river', seed: seed + 1 });
    // estradas
    pathLine(m, 'path', [[0, 18], [49, 18]], 2);
    pathLine(m, 'path', [[24, 0], [24, 37]], 2);
    m.fill('cobble', 18, 15, 14, 8);
    m.fill('cobble', 6, 15, 2, 1); m.fill('cobble', 15, 15, 2, 1); m.fill('cobble', 31, 15, 1, 1);
    pathLine(m, 'path', [[7, 15], [7, 17]], 2); pathLine(m, 'path', [[16, 15], [16, 17]], 2);
    pathLine(m, 'path', [[31, 15], [31, 17]], 2); pathLine(m, 'path', [[38, 15], [38, 17]], 2); pathLine(m, 'path', [[45, 15], [45, 17]], 2);
    pathLine(m, 'path', [[7, 20], [7, 27]], 2); pathLine(m, 'path', [[15, 20], [15, 27]], 2); pathLine(m, 'path', [[31, 20], [31, 27]], 2);
    // rio
    m.fill('water', 0, 29, 50, 3);
    for (let x = 0; x < 50; x++) { if (U.hash2(x, 1, 5) > 0.7) m.ground[28][x] = 'sand'; if (U.hash2(x, 2, 5) > 0.7) m.ground[32][x] = 'sand'; }
    m.fishZones = [{ x: 0, y: 29, w: 50, h: 3, loc: 'river' }];
    for (let x = 24; x <= 25; x++) for (let y = 29; y <= 31; y++) m.setObj(x, y, { t: 'dock', k: 'bridge' });
    // prédios
    building(m, B.house({ w: 7, h: 6, wall: '#abc89c', roof: '#4a7ab8', door: '#8a5a35', sign: 'coin', awning: '#c4473a', flowerBox: 1, windows: [12, 84] }), 3, 9, 'shop', 6, 7, { kind: 'shop' });
    building(m, B.house({ w: 8, h: 7, wall: '#e2abab', roof: '#8a3a4a', door: '#6b4a33', sign: 'cup', awning: '#4a9a6a', flowerBox: 1, windows: [14, 96, 40, 76].slice(0, 2) }), 12, 8, 'diner', 6, 8, { kind: 'diner' });
    building(m, B.house({ w: 6, h: 6, wall: '#f0f0f5', roof: '#4a8a9a', door: '#7a9aa8', sign: 'cross', windows: [12, 72], flowerBox: 1 }), 28, 9, 'clinic', 5, 6, { kind: 'clinic' });
    building(m, B.house({ w: 6, h: 5, wall: '#9dc4e2', roof: '#d86a9a', door: '#8a5a35', flowerBox: 1, windows: [10, 76] }), 35, 10, 'flowers', 5, 6, { kind: 'flowers' });
    building(m, S.tower(st0 ? st0.lantern || 0 : 0), 42, 5, 'hall', 7, 9, { kind: 'hall', light: false });
    building(m, B.house({ w: 6, h: 6, wall: '#8e8a98', kind: 'brick', roof: '#5a5a6a', door: '#5a4a3a', sign: 'hammer', windows: [10, 72], chimney: true, chimneyX: 20 }), 4, 21, 'smith', 5, 7, { kind: 'smith' });
    building(m, B.house({ w: 7, h: 6, wall: '#a9713d', kind: 'plank', roof: '#6a4a38', door: '#4a3220', windows: [10, 88], flowerBox: 0 }), 12, 21, 'carp', 5, 7, { kind: 'carp' });
    building(m, B.house({ w: 6, h: 5, wall: '#e8d0b0', roof: '#7a4aa8', door: '#8a5a35', curtain: '#7a4aa8', flowerBox: 1, windows: [10, 76] }), 28, 22, 'homeA', 5, 6, { kind: 'home' });
    building(m, B.house({ w: 5, h: 5, wall: '#f0d8a8', roof: '#c8803a', door: '#6b4a33', windows: [8, 60] }), 35, 22, null, 0, 0, { kind: 'locked' });
    building(m, B.house({ w: 5, h: 5, wall: '#c8d8e8', roof: '#4a6a9a', door: '#6b4a33', windows: [8, 60] }), 41, 22, null, 0, 0, { kind: 'locked' });
    // fonte
    m.setObj(24, 19, { t: 'deco', k: 'fountain', fw: 2, fh: 2, solid: 1 });
    m.lights.push({ x: 25 * T, y: 18 * T, r: 60, col: '#bde6ff', night: 1, a: 0.5 });
    // decoração
    lampPost(m, 20, 17); lampPost(m, 29, 17); lampPost(m, 20, 21); lampPost(m, 29, 21);
    lampPost(m, 10, 17); lampPost(m, 38, 17); lampPost(m, 47, 17); lampPost(m, 3, 17); lampPost(m, 23, 11); lampPost(m, 26, 11); lampPost(m, 23, 27); lampPost(m, 26, 27);
    m.setObj(21, 21, { t: 'deco', k: 'bench', solid: 1, fw: 2, fh: 1 }); m.setObj(27, 21, { t: 'deco', k: 'bench', solid: 1, fw: 2, fh: 1 });
    m.setObj(19, 16, { t: 'deco', k: 'stall', solid: 1, fw: 3, fh: 2 }); m.setObj(28, 16, { t: 'deco', k: 'stall', solid: 1, fw: 3, fh: 2 });
    m.setObj(9, 16, { t: 'deco', k: 'sign', solid: 1 }); m.setObj(26, 14, { t: 'deco', k: 'sign', solid: 1, board: 1 });
    // árvores
    borderTrees(m, rng, 3, [[0, 17, 3, 4], [23, 0, 3, 3], [23, 35, 3, 3]], 0.25, (x, y) => (y >= 15 && y <= 27 && x < 3) || (x > 46 && y >= 14 && y <= 28));
    scatter(m, rng, 2, 3, 47, 8, 26, () => O.tree(rng() < 0.3 ? 'pine' : 'oak', 4, rng() < 0.3 ? 1 : 0), (x, y) => m.kind(x, y) === 'grass' && !(x >= 41 && x <= 48 && y < 15));
    scatter(m, rng, 2, 32, 47, 36, 14, () => O.tree(rng() < 0.3 ? 'pine' : 'oak'), (x, y) => m.kind(x, y) === 'grass' && Math.abs(x - 24.5) > 3);
    scatter(m, rng, 2, 3, 47, 36, 60, () => O.weed(), (x, y) => m.kind(x, y) === 'grass');
    scatter(m, rng, 2, 3, 47, 36, 8, () => O.forage('dandelion'), (x, y) => m.kind(x, y) === 'grass');
    // POIs
    Object.assign(m.poi, { fountain: [23, 21], bench1: [21, 22], bench2: [28, 22], market: [26, 17], shop_front: [7, 16], diner_front: [16, 16], river: [20, 28], clinic_front: [31, 16], hall_front: [45, 16] });
    // saídas do mapa: oeste → Fazenda, norte → Montanha, sul → Praia
    warp(m, 0, 18, 1, 2, 'farm', 47, 20, 1);
    warp(m, 24, 0, 2, 1, 'mountain', 20, 29, 3);
    warp(m, 24, 37, 2, 1, 'beach', 24, 2, 0);
    return m;
  }
  let st0 = null;

  /* ============================================================
     MONTANHA — 40 x 32
     ============================================================ */
  function mountain(seed) {
    const rng = U.rng(seed + 37);
    const m = mk('mountain', 40, 32, { name: 'Montanha Pedregosa', outdoor: true, music: 'mountain', fishLoc: 'lake', seed: seed + 3, theme: 0 });
    m.fill('cliff', 0, 0, 40, 4);
    for (let x = 0; x < 40; x++) if (U.hash2(x, 3, 6) > 0.6) m.ground[4][x] = 'cliff';
    blob(m, 'rock', 28, 22, 12, 8, 7, 0.6);
    blob(m, 'rock', 10, 24, 6, 4, 8, 0.6);
    blob(m, 'water', 31, 10, 6.5, 3.6, 9, 0.5); blob(m, 'sand', 31, 10, 8, 5, 10, 0.5, k => k !== 'water' && k !== 'cliff');
    blob(m, 'water', 31, 10, 6, 3.2, 9, 0.5);
    m.fishZones = [{ x: 22, y: 4, w: 18, h: 14, loc: 'lake' }];
    pathLine(m, 'path', [[19, 31], [19, 24], [20, 15], [20, 10]], 3);
    pathLine(m, 'path', [[9, 17], [9, 20], [19, 20]], 2);
    pathLine(m, 'path', [[0, 15], [10, 15], [19, 15]], 2);
    building(m, S.mineEntrance(), 18, 6, 'mine1', 0, 0, { kind: 'mine', wide: 0, light: false });
    // a porta da mina é 2 tiles
    const mb = m.buildings[0]; m.block[mb.doorY * m.w + 19] = 0; m.block[mb.doorY * m.w + 20] = 0;
    m.warps.length = 0; warp(m, 19, 9, 2, 1, 'mine', 0, 0, 3);
    m.lights.push({ x: 20 * T, y: 9 * T, r: 54, col: '#ffcf80', night: 0, a: 0.5 });
    building(m, S.guild(), 6, 11, 'guild', 6, 7, { kind: 'guild' });
    // cenário
    borderTrees(m, rng, 2, [[18, 30, 4, 2], [0, 14, 2, 4]], 0.7, (x, y) => y < 5 || (x > 6 && y < 8));
    scatter(m, rng, 2, 6, 37, 29, 22, () => O.tree('pine', 4), (x, y) => m.kind(x, y) !== 'rock' && m.kind(x, y) !== 'path' && x < 17 || x > 24);
    scatter(m, rng, 2, 17, 37, 29, 22, () => O.rock('stone', false), (x, y) => m.kind(x, y) === 'rock');
    scatter(m, rng, 20, 17, 37, 29, 10, () => O.rock('copper_ore', false), (x, y) => m.kind(x, y) === 'rock');
    scatter(m, rng, 20, 17, 37, 29, 4, () => O.rock('iron_ore', false), (x, y) => m.kind(x, y) === 'rock');
    scatter(m, rng, 20, 17, 37, 29, 5, () => O.rock('stone', true), (x, y) => m.kind(x, y) === 'rock');
    scatter(m, rng, 2, 6, 37, 29, 20, () => O.weed(), (x, y) => m.kind(x, y) === 'grass');
    m.setObj(21, 11, { t: 'deco', k: 'sign', solid: 1 });
    m.setObj(23, 14, { t: 'deco', k: 'bench', solid: 1, fw: 2, fh: 1 });
    warp(m, 18, 31, 4, 1, 'town', 24, 2, 3);
    warp(m, 0, 15, 1, 3, 'forest', 41, 17, 1);
    Object.assign(m.poi, { lookout: [22, 13], quarry: [30, 22], mine: [20, 11] });
    return m;
  }

  /* ============================================================
     BOSQUE SUSSURRANTE — 44 x 34
     ============================================================ */
  function forest(seed) {
    const rng = U.rng(seed + 51);
    const m = mk('forest', 44, 34, { name: 'Bosque Sussurrante', outdoor: true, music: 'forest', fishLoc: 'lake', seed: seed + 5 });
    blob(m, 'sand', 9, 25, 8, 6.5, 11, 0.6); blob(m, 'water', 9, 25, 6, 5, 12, 0.6);
    m.fishZones = [{ x: 0, y: 17, w: 20, h: 17, loc: 'lake', legend: true }];
    pathLine(m, 'path', [[23, 33], [23, 22], [22, 17], [43, 17]], 2);
    pathLine(m, 'path', [[22, 17], [12, 12], [8, 8]], 2);
    // clareira
    blob(m, 'grass', 22, 16, 6, 5, 13, 0.3);
    // árvores densas por ruído
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!free(m, x, y) || m.kind(x, y) !== 'grass') continue;
      const dp = Math.hypot(x - 22, y - 16) / 6.5;
      if (dp < 1) continue;
      const d = U.vnoise(x / 4, y / 4, 99);
      const edge = Math.min(x, y, m.w - 1 - x, m.h - 1 - y);
      if ((d > 0.45 && rng() < 0.55) || edge < 2) {
        if ((x >= 22 && x <= 24 && y >= 30) || (x >= 41 && y >= 15 && y <= 19)) continue;
        m.setObj(x, y, O.tree(rng() < 0.4 ? 'pine' : 'oak', 4, rng() < 0.35 ? 1 : 0));
      }
    }
    // gruta secreta de Lumi (noroeste)
    blob(m, 'grass', 6, 6, 4, 3.4, 14, 0.2);
    for (let y = 2; y < 11; y++) for (let x = 2; x < 11; x++) if (Math.hypot(x - 6, y - 6) < 4 && m.getObj(x, y)) m.delObj(x, y);
    m.setObj(6, 5, { t: 'deco', k: 'lanternTree', solid: 1 });
    m.lights.push({ x: 6 * T + 8, y: 5 * T - 6, r: 90, col: '#9fe8ff', night: 1, a: 0.9 });
    scatter(m, rng, 2, 2, 41, 31, 40, () => O.weed(), (x, y) => m.kind(x, y) === 'grass');
    scatter(m, rng, 2, 2, 41, 31, 6, () => O.log(), (x, y) => m.kind(x, y) === 'grass');
    scatter(m, rng, 2, 2, 41, 31, 8, () => O.stump(), (x, y) => m.kind(x, y) === 'grass');
    scatter(m, rng, 2, 2, 41, 31, 14, () => O.debris('wood'), (x, y) => m.kind(x, y) === 'grass');
    scatter(m, rng, 2, 2, 41, 31, 4, () => O.bush('berry_wild'), (x, y) => m.kind(x, y) === 'grass');
    warp(m, 22, 33, 3, 1, 'farm', 23, 2, 3);
    warp(m, 43, 16, 1, 3, 'mountain', 1, 16, 2);
    Object.assign(m.poi, { glade: [22, 17], lake: [14, 25], grove: [6, 8], south: [23, 31] });
    m.forageSpots = [];
    return m;
  }

  /* ============================================================
     PRAIA DA MARÉ — 44 x 26
     ============================================================ */
  function beach(seed) {
    const rng = U.rng(seed + 67);
    const m = mk('beach', 44, 26, { name: 'Praia da Maré', outdoor: true, music: 'beach', fishLoc: 'ocean', seed: seed + 7, base: 'sand' });
    m.fill('grass', 0, 0, 44, 4);
    for (let x = 0; x < 44; x++) { const gy = 3 + Math.floor(U.vnoise(x / 3, 1, 5) * 2.5); for (let y = 0; y < gy; y++) m.ground[y][x] = 'grass'; }
    for (let x = 0; x < 44; x++) { const wy = 13 + Math.floor(U.vnoise(x / 4, 2, 6) * 3); for (let y = wy; y < 26; y++) m.ground[y][x] = 'water'; }
    m.fishZones = [{ x: 0, y: 12, w: 44, h: 14, loc: 'ocean' }];
    pathLine(m, 'path', [[24, 0], [24, 5]], 2);
    building(m, S.cabin(), 8, 4, 'fishhut', 4, 5, { kind: 'fishhut' });
    // pier
    for (let y = 11; y <= 21; y++) for (let x = 30; x <= 31; x++) { m.setObj(x, y, { t: 'dock', k: 'dock' }); }
    for (let y = 11; y <= 13; y++) for (let x = 30; x <= 31; x++) { if (m.ground[y][x] === 'sand' || m.ground[y][x] === 'grass') delete m.getObj(x, y).k; }
    borderTrees(m, rng, 2, [[23, 0, 3, 2]], 0, (x, y) => y > 4);
    scatter(m, rng, 1, 0, 42, 4, 14, () => ({ t: 'tree', k: 'palm', stage: 4, hp: 12, solid: 1, v: 0 }), (x, y) => m.kind(x, y) === 'grass' && Math.abs(x - 24) > 2 && !(x >= 8 && x <= 13 && y <= 8));
    scatter(m, rng, 2, 4, 41, 12, 10, () => O.forage('shell'), (x, y) => m.kind(x, y) === 'sand');
    scatter(m, rng, 2, 4, 41, 12, 6, () => O.forage('coral'), (x, y) => m.kind(x, y) === 'sand');
    scatter(m, rng, 2, 4, 41, 12, 8, () => O.rock('stone', false), (x, y) => m.kind(x, y) === 'sand');
    scatter(m, rng, 2, 4, 41, 12, 7, () => O.weed(), (x, y) => m.kind(x, y) === 'grass');
    m.setObj(33, 9, { t: 'deco', k: 'sign', solid: 1 });
    m.setObj(27, 7, { t: 'deco', k: 'bench', solid: 1, fw: 2, fh: 1 });
    warp(m, 23, 0, 4, 1, 'town', 24, 36, 0);
    Object.assign(m.poi, { pier: [30, 10], rocks: [38, 10], sand: [18, 9], hut_front: [10, 8], boat: [35, 14] });
    return m;
  }

  /* ============================================================
     INTERIORES
     ============================================================ */
  const FW = { bed: [2, 2], table: [2, 1], chair: [1, 1], shelf: [2, 1], counter: [3, 1], stove: [2, 1], tv: [2, 1], plant: [1, 1], barrel: [1, 1], fireplace: [3, 1], bench: [2, 1] };
  function room(id, name, w, h, floor, wallTheme, ex, to, music, spec = {}) {
    const m = mk(id, w, h, { name, outdoor: false, music: music || 'home', theme: wallTheme, base: floor, seed: 3 });
    m.fill('wall_top', 0, 0, w, 1); m.fill('wall_face', 0, 1, w, 2);
    m.fill('wall_top', 0, 0, 1, h); m.fill('wall_top', w - 1, 0, 1, h); m.fill('wall_top', 0, h - 1, w, 1);
    m.ex = ex; m.exitTo = to;
    warp(m, ex, h - 1, 1, 1, to.map, to.tx, to.ty, 0);
    m.fill('tile', ex, h - 1, 1, 1);
    m.ground[h - 1][ex] = floor; // portal caminhável
    m.lights.push({ x: w * T / 2, y: h * T / 2, r: Math.max(w, h) * T * 0.65, col: '#ffe0a8', night: 0, a: 0.35, indoor: 1 });
    m.poi.door = [ex, h - 2];
    return m;
  }
  function F(m, k, x, y, o = {}) {
    const [fw, fh] = o.fw ? [o.fw, o.fh || 1] : (FW[k] || [1, 1]);
    const ob = Object.assign({ t: 'furn', k, fw, fh, solid: 1 }, o);
    m.setObj(x, y, ob);
    return ob;
  }
  function decoWall(m, k, px, py, a) { m.deco.push({ t: 'wallDeco', k, x: px, y: py, a }); }
  function rug(m, x, y, col) { m.deco.push({ t: 'rug', x: x * T, y: y * T, col }); }

  function interior(id, st) {
    let m;
    switch (id) {
      case 'house': {
        m = room('house', 'Casa da Vovó Alba', 12, 9, 'wood', 0, 5, { map: 'farm', tx: 8, ty: 9 }, 'home');
        F(m, 'bed', 2, 4, { act: 'bed', a: '#4a7fc9' }); F(m, 'shelf', 5, 3); F(m, 'stove', 9, 3, { act: 'cook' });
        F(m, 'table', 6, 6); F(m, 'chair', 5, 6, { solid: 0 }); F(m, 'chair', 8, 6, { solid: 0 }); F(m, 'plant', 10, 7); F(m, 'tv', 1, 7, { fw: 2 });
        decoWall(m, 'window', 8, 11); decoWall(m, 'window', 52, 11); decoWall(m, 'painting', 80, 14);
        rug(m, 5, 6, '#b64a3c');
        m.setObj(10, 5, { t: 'chest', solid: 1, items: [], cap: 36, kind: 'normal' });
        m.setObj(1, 3, { t: 'chest', solid: 1, items: [], cap: 36, kind: 'normal' });
        m.poi.bed = [4, 5]; m.poi.kitchen = [9, 4]; m.poi.table = [6, 7]; m.poi.spouse = [7, 5];
        m.upgrade = true; break;
      }
      case 'shop': {
        m = room('shop', 'Mercado Luzerna', 13, 9, 'wood', 1, 6, { map: 'town', tx: 6, ty: 15 }, 'shop');
        F(m, 'counter', 4, 5, { fw: 4, shop: 'general' }); F(m, 'shelf', 1, 3); F(m, 'shelf', 9, 3); F(m, 'barrel', 11, 6); F(m, 'barrel', 11, 7); F(m, 'plant', 1, 7); F(m, 'table', 8, 7);
        rug(m, 4, 7, '#4a7fc9'); decoWall(m, 'window', 50, 11); decoWall(m, 'painting', 110, 14);
        Object.assign(m.poi, { counter: [5, 4], aisle: [7, 6], bed: [11, 4] }); m.shopCounter = [4, 5, 4]; break;
      }
      case 'diner': {
        m = room('diner', 'Cantina Vaga-lume', 14, 10, 'wood', 3, 6, { map: 'town', tx: 16, ty: 15 }, 'town');
        F(m, 'counter', 3, 5, { fw: 5, shop: 'diner' }); F(m, 'stove', 9, 3, { fw: 2 }); F(m, 'shelf', 1, 3);
        F(m, 'table', 2, 8); F(m, 'chair', 1, 8, { solid: 0 }); F(m, 'chair', 4, 8, { solid: 0 }); F(m, 'table', 9, 8); F(m, 'chair', 8, 8, { solid: 0 }); F(m, 'chair', 11, 8, { solid: 0 });
        F(m, 'barrel', 12, 4); F(m, 'plant', 12, 6); rug(m, 10, 4, '#8a3a4a');
        decoWall(m, 'window', 70, 11); decoWall(m, 'window', 130, 11);
        Object.assign(m.poi, { counter: [5, 4], table1: [3, 8], table2: [10, 8], stage: [12, 5], bed: [12, 3] }); break;
      }
      case 'clinic': {
        m = room('clinic', 'Clínica da Dra. Íris', 11, 8, 'tile', 2, 5, { map: 'town', tx: 31, ty: 15 }, 'home');
        F(m, 'counter', 2, 4, { fw: 3, shop: 'clinic' }); F(m, 'bed', 7, 5, { a: '#f0f0f5' }); F(m, 'shelf', 5, 3); F(m, 'plant', 1, 6);
        decoWall(m, 'window', 100, 11); decoWall(m, 'painting', 60, 14);
        Object.assign(m.poi, { desk: [3, 3], bed: [9, 3], front: [4, 6] }); break;
      }
      case 'smith': {
        m = room('smith', 'Forja do Tomás', 12, 9, 'tile', 5, 5, { map: 'town', tx: 7, ty: 27 }, 'shop');
        F(m, 'machine_furnace', 8, 3, { fw: 2, fh: 1, mk: 'furnace' }); F(m, 'machine_bench', 3, 4, { fw: 2, mk: 'bench', act: 'anvil' }); F(m, 'counter', 5, 6, { fw: 3, shop: 'smith' }); F(m, 'barrel', 10, 6); F(m, 'barrel', 10, 7); F(m, 'shelf', 1, 3);
        m.lights.push({ x: 9 * T, y: 3 * T, r: 60, col: '#ff8a3a', night: 0, a: 0.8, flicker: 1 });
        decoWall(m, 'window', 60, 11);
        Object.assign(m.poi, { anvil: [4, 5], counter: [6, 5], bed: [10, 4] }); break;
      }
      case 'carp': {
        m = room('carp', 'Oficina do Seu Ney', 12, 9, 'wood', 4, 5, { map: 'town', tx: 15, ty: 27 }, 'shop');
        F(m, 'machine_bench', 2, 4, { fw: 2, mk: 'bench' }); F(m, 'machine_bench', 6, 4, { fw: 2, mk: 'bench' }); F(m, 'counter', 7, 6, { fw: 3, shop: 'carp', npcTalk: 'ney' }); F(m, 'barrel', 1, 7); F(m, 'barrel', 10, 3); F(m, 'shelf', 9, 3);
        decoWall(m, 'window', 70, 11); rug(m, 3, 6, '#8a6a4a');
        Object.assign(m.poi, { bench: [4, 5], desk: [8, 5], bed: [10, 4] }); break;
      }
      case 'flowers': {
        m = room('flowers', 'Floricultura da Luna', 11, 8, 'wood', 3, 5, { map: 'town', tx: 38, ty: 15 }, 'home');
        F(m, 'counter', 3, 5, { fw: 3, shop: 'flowers' }); F(m, 'plant', 1, 3); F(m, 'plant', 9, 3); F(m, 'plant', 1, 6); F(m, 'plant', 9, 6); F(m, 'barrel', 6, 3); F(m, 'shelf', 7, 3);
        rug(m, 4, 6, '#d86a9a'); decoWall(m, 'window', 30, 11); decoWall(m, 'window', 120, 11);
        Object.assign(m.poi, { counter: [4, 4], window: [8, 5], bed: [9, 4] }); break;
      }
      case 'homeA': {
        m = room('homeA', 'Casa da Marina e do Rafa', 11, 8, 'wood', 0, 5, { map: 'town', tx: 31, ty: 27 }, 'home');
        F(m, 'bed', 1, 4, { a: '#7a5ac8' }); F(m, 'bed', 8, 4, { a: '#e0a63a' }); F(m, 'shelf', 5, 3); F(m, 'table', 4, 6); F(m, 'plant', 9, 6); F(m, 'chair', 6, 6, { solid: 0 });
        decoWall(m, 'painting', 40, 14); decoWall(m, 'painting', 130, 14); decoWall(m, 'window', 90, 11); rug(m, 3, 6, '#7a4aa8');
        Object.assign(m.poi, { easel: [3, 5], sofa: [7, 6], bed: [2, 5] }); break;
      }
      case 'fishhut': {
        m = room('fishhut', 'Cabana da Nina', 9, 7, 'wood', 4, 4, { map: 'beach', tx: 10, ty: 8 }, 'beach');
        F(m, 'bed', 1, 4, { a: '#4a9ab8' }); F(m, 'table', 4, 5); F(m, 'chair', 3, 5, { solid: 0 }); F(m, 'chair', 6, 5, { solid: 0 }); F(m, 'barrel', 7, 3, { shop: 'fish' }); F(m, 'shelf', 5, 3);
        m.deco.push({ t: 'wallDeco', k: 'window', x: 60, y: 11 }); m.shopCounter = null;
        Object.assign(m.poi, { table: [5, 4], bed: [2, 5] }); break;
      }
      case 'guild': {
        m = room('guild', 'Guilda dos Exploradores', 14, 9, 'tile', 5, 6, { map: 'mountain', tx: 9, ty: 17 }, 'mountain');
        F(m, 'counter', 5, 5, { fw: 4, shop: 'guild' }); F(m, 'shelf', 1, 3); F(m, 'shelf', 10, 3); F(m, 'barrel', 12, 6); F(m, 'plant', 1, 7);
        m.setObj(3, 5, { t: 'board', solid: 1 }); rug(m, 5, 7, '#8a3a3a'); decoWall(m, 'window', 100, 11);
        Object.assign(m.poi, { counter: [6, 4], board: [3, 6], bed: [12, 4] }); break;
      }
      case 'hall': {
        m = room('hall', 'Lanternário de Luzerna', 14, 11, 'tile', 5, 7, { map: 'town', tx: 45, ty: 15 }, 'night', {});
        // pedestais das 6 ofertas
        const peds = [[2, 4], [11, 4], [2, 7], [11, 7], [4, 3], [9, 3]];
        peds.forEach((p, i) => m.setObj(p[0], p[1], { t: 'pedestal', b: i, solid: 1 }));
        m.setObj(6, 5, { t: 'altar', solid: 1, fw: 2, fh: 1 });
        F(m, 'shelf', 12, 9, { fw: 1 }); F(m, 'table', 3, 9); F(m, 'chair', 2, 9, { solid: 0 }); F(m, 'plant', 1, 9);
        m.lights.push({ x: 7 * T, y: 4 * T, r: 120, col: '#ffe9a0', night: 0, a: 0.8, hallLight: 1 });
        decoWall(m, 'window', 30, 11); decoWall(m, 'window', 160, 11);
        Object.assign(m.poi, { desk: [7, 7], bed: [12, 8], altar: [7, 6] }); break;
      }
      case 'coop': {
        m = room('coop', 'Galinheiro', 10, 7, 'wood', 4, 4, { map: 'farm', tx: 16, ty: 10 }, 'home');
        m.setObj(1, 3, { t: 'trough', solid: 1, fw: 2, fh: 1 }); m.setObj(6, 3, { t: 'hopper', solid: 1, fw: 2, fh: 1 });
        m.animalHome = { x0: 1, y0: 4, x1: 8, y1: 5 };
        decoWall(m, 'window', 70, 11);
        m.poi.door = [4, 5]; break;
      }
      case 'barn': {
        m = room('barn', 'Celeiro', 14, 8, 'wood', 4, 6, { map: 'farm', tx: 30, ty: 11 }, 'home');
        m.setObj(1, 3, { t: 'trough', solid: 1, fw: 3, fh: 1 }); m.setObj(9, 3, { t: 'hopper', solid: 1, fw: 2, fh: 1 });
        m.animalHome = { x0: 1, y0: 4, x1: 12, y1: 6 };
        decoWall(m, 'window', 100, 11);
        m.poi.door = [6, 6]; break;
      }
      case 'greenhouse': {
        m = room('greenhouse', 'Estufa', 14, 10, 'path', 2, 6, { map: 'farm', tx: 39, ty: 10 }, 'home');
        m.canTill = true; m.greenhouse = true; m.fishLoc = null;
        m.fill('path', 1, 3, 12, 6);
        decoWall(m, 'window', 40, 11); decoWall(m, 'window', 150, 11);
        m.poi.door = [6, 8]; break;
      }
      default: return null;
    }
    m.interiorOf = id;
    return m;
  }

  function create(id, seed, st) {
    st0 = st || null;
    switch (id) {
      case 'farm': return farm(seed, st);
      case 'town': return town(seed);
      case 'mountain': return mountain(seed);
      case 'forest': return forest(seed);
      case 'beach': return beach(seed);
      default: return interior(id, st);
    }
  }
  const IDS = ['farm', 'town', 'mountain', 'forest', 'beach', 'house', 'shop', 'diner', 'clinic', 'smith', 'carp', 'flowers', 'homeA', 'fishhut', 'guild', 'hall', 'coop', 'barn', 'greenhouse'];
  return { create, IDS, O, free, scatter, blob, warp, building, setLantern(l) { st0 = { lantern: l }; } };
})();
