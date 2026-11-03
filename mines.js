'use strict';
/* ============================================================
   Mina procedural: 30 andares. Cavernas por autômato celular,
   minérios por profundidade, inimigos por faixa, chefe no 30.
   ============================================================ */
VV.Mines = (() => {
  const U = VV.U, W = VV.World, T = 16, O = VV.Maps.O;
  const MAXF = 30;

  const MON = {
    slime_green: { n: 'Gosma Verde', hp: 18, dmg: 4, spd: 26, xp: 6, col: '#6fd05a', drops: [['sap', 0.5, 1, 2], ['clay', 0.1, 1, 1]], kind: 'slime' },
    slime_red: { n: 'Gosma Rubra', hp: 36, dmg: 8, spd: 32, xp: 12, col: '#ff6a7a', drops: [['sap', 0.5, 1, 2], ['copper_ore', 0.3, 1, 3]], kind: 'slime' },
    slime_purple: { n: 'Gosma Sombria', hp: 64, dmg: 13, spd: 38, xp: 22, col: '#b777ff', drops: [['sap', 0.6, 1, 3], ['iron_ore', 0.4, 1, 3], ['amethyst', 0.05, 1, 1]], kind: 'slime' },
    bat: { n: 'Morcego', hp: 12, dmg: 3, spd: 44, xp: 7, col: '#5a4a78', drops: [['coal', 0.2, 1, 1]], kind: 'bat', fly: 1 },
    bat_red: { n: 'Morcego Rubro', hp: 28, dmg: 7, spd: 54, xp: 14, col: '#c84a5a', drops: [['coal', 0.3, 1, 2], ['ruby', 0.02, 1, 1]], kind: 'bat', fly: 1 },
    crab: { n: 'Caranguejo-pedra', hp: 40, dmg: 7, spd: 22, xp: 14, col: '#9a8a90', drops: [['stone', 0.8, 2, 5], ['iron_ore', 0.2, 1, 2], ['geode', 0.1, 1, 1]], kind: 'crab' },
    wisp: { n: 'Espectro Lúmen', hp: 48, dmg: 11, spd: 34, xp: 24, col: '#9fe8ff', drops: [['quartz', 0.4, 1, 2], ['lumi_shard', 0.04, 1, 1], ['gold_ore', 0.2, 1, 2]], kind: 'wisp', fly: 1 },
    golem: { n: 'Golem de Cristal', hp: 700, dmg: 18, spd: 20, xp: 400, col: '#74e6ff', drops: [['crystal_core', 1, 1, 1], ['diamond', 1, 2, 3], ['lumi_shard', 1, 2, 4]], kind: 'golem', boss: 1 },
  };

  function pool(d) {
    const p = [];
    if (d <= 10) p.push('slime_green', 'slime_green', 'bat');
    if (d >= 4 && d <= 14) p.push('bat');
    if (d >= 8) p.push('crab');
    if (d >= 11) p.push('slime_red', 'slime_red', 'bat_red');
    if (d >= 16) p.push('crab', 'wisp');
    if (d >= 21) p.push('slime_purple', 'slime_purple', 'wisp', 'bat_red');
    return p;
  }
  function oreFor(d, r) {
    const x = r();
    if (d >= 18 && x < 0.04) return 'gold_ore';
    if (d >= 8 && x < 0.10) return 'iron_ore';
    if (d < 18 && x < 0.16) return 'copper_ore';
    if (x < 0.22) return 'coal';
    if (d >= 22 && x < 0.24) return ['emerald', 'ruby', 'sapphire'][Math.floor(r() * 3)];
    if (d >= 25 && x < 0.245) return 'diamond';
    if (d >= 10 && x < 0.255) return ['amethyst', 'topaz'][Math.floor(r() * 2)];
    if (d >= 4 && x < 0.275) return 'quartz';
    if (x < 0.30) return d >= 15 ? 'frozen_geode' : 'geode';
    return 'stone';
  }

  function generate(floor, seed, day) {
    const r = U.rng(seed * 131 + floor * 7919 + day * 17);
    const boss = floor === MAXF;
    const w = boss ? 30 : 38, h = boss ? 24 : 32;
    const m = new W.GameMap('mine' + floor, w, h, { name: boss ? 'Câmara do Cristal' : `Mina — Andar ${floor}`, outdoor: false, dark: true, music: 'mine', base: 'cave_floor', theme: 0, fishLoc: 'mine', seed: floor });
    m.mineFloor = floor; m.isMine = true; m.spawns = []; m.noSave = true;
    // grade
    const g = [];
    for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(x < 1 || y < 1 || x >= w - 1 || y >= h - 1 ? 1 : (r() < (boss ? 0.0 : 0.43) ? 1 : 0)); }
    if (!boss) for (let it = 0; it < 5; it++) {
      const n = g.map(row => row.slice());
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        let c = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) c += g[y + j][x + i];
        n[y][x] = c >= 5 ? 1 : 0;
      }
      g.forEach((row, y) => row.forEach((_, x) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y][x] = n[y][x]; }));
    } else {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const d = Math.hypot(x - w / 2, (y - h / 2) * 1.2); g[y][x] = d < 11 ? 0 : 1; }
    }
    // maior região conectada
    const seen = new Uint8Array(w * h); let best = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      if (g[y][x] || seen[y * w + x]) continue;
      const q = [[x, y]], reg = []; seen[y * w + x] = 1;
      while (q.length) { const [cx, cy] = q.pop(); reg.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (!g[ny][nx] && !seen[ny * w + nx]) { seen[ny * w + nx] = 1; q.push([nx, ny]); } } }
      if (reg.length > best.length) best = reg;
    }
    const open = new Set(best.map(p => p[1] * w + p[0]));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m.ground[y][x] = open.has(y * w + x) ? 'cave_floor' : 'cave_wall';
    // paredes que tocam o chão ficam com "face" — tratado pelo desenhista; borda fica void
    const floorTiles = best.slice();
    U.shuffle(floorTiles, r);
    const far = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let up = boss ? [w >> 1, h - 4] : floorTiles[0];
    let down = boss ? null : floorTiles.reduce((acc, t) => far(t, up) > far(acc, up) ? t : acc, floorTiles[0]);
    m.poi.up = up; m.upPos = up;
    m.setObj(up[0], up[1], { t: 'stairs', dir: 'up' });
    if (down) { m.setObj(down[0], down[1], { t: 'stairs', dir: 'down' }); m.downPos = down; m.lights.push({ x: down[0] * T + 8, y: down[1] * T + 8, r: 36, col: '#ffd080', a: 0.5 }); }
    m.lights.push({ x: up[0] * T + 8, y: up[1] * T + 8, r: 36, col: '#ffd080', a: 0.5 });
    // lago pequeno
    if (!boss && floor % 5 === 0 && r() < 0.8) {
      const c = floorTiles[Math.floor(floorTiles.length / 2)];
      for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (open.has((c[1] + j) * w + c[0] + i) && Math.hypot(i / 3, j / 2) < 1) { m.ground[c[1] + j][c[0] + i] = 'water'; }
      m.fishZones = [{ x: c[0] - 3, y: c[1] - 2, w: 7, h: 5, loc: 'mine' }];
    }
    // minérios
    const nOre = boss ? 6 : 22 + Math.floor(floor / 2);
    for (let i = 0; i < floorTiles.length && nOre > 0; i++) {
      if (i >= nOre * 3) break;
      const t = floorTiles[i];
      if (far(t, up) < 4 || (down && far(t, down) < 3)) continue;
      if (r() > 0.34) continue;
      const big = r() < 0.06 && floor >= 3;
      if (big && !(m.ground[t[1] - 1][t[0]] === 'cave_floor' && m.ground[t[1]][t[0] + 1] === 'cave_floor' && m.ground[t[1] - 1][t[0] + 1] === 'cave_floor')) continue;
      if (!m.getObj(t[0], t[1]) && m.ground[t[1]][t[0]] === 'cave_floor') {
        if (big) { if (VV.Maps.free(m, t[0], t[1]) && VV.Maps.free(m, t[0] + 1, t[1]) && VV.Maps.free(m, t[0], t[1] - 1) && VV.Maps.free(m, t[0] + 1, t[1] - 1)) m.setObj(t[0], t[1], O.rock('stone', true, true)); }
        else m.setObj(t[0], t[1], O.rock(oreFor(floor, r), false, true));
      }
    }
    // inimigos
    if (boss) { m.spawns.push({ type: 'golem', x: w >> 1, y: (h >> 1) - 2 }); }
    else {
      const p = pool(floor); const n = 5 + Math.floor(floor / 3) + (floor % 10 === 0 ? 0 : 0);
      let placed = 0;
      for (let i = 1; placed < n && i < floorTiles.length; i++) {
        const t = floorTiles[i]; if (far(t, up) < 8) continue;
        if (m.getObj(t[0], t[1])) continue;
        m.spawns.push({ type: U.pick(p, r), x: t[0], y: t[1] }); placed++;
      }
    }
    // cogumelos e cristais de decoração
    for (let i = 0; i < 6; i++) { const t = floorTiles[(i * 37 + 5) % floorTiles.length]; if (t && !m.getObj(t[0], t[1]) && far(t, up) > 3) m.setObj(t[0], t[1], { t: 'forage', item: r() < 0.5 ? 'mushroom' : 'mushroom_red', q: 0, cave: 1 }); }
    for (let i = 0; i < 5; i++) { const t = floorTiles[(i * 53 + 11) % floorTiles.length]; if (t && !m.getObj(t[0], t[1]) && far(t, up) > 4) { m.lights.push({ x: t[0] * T + 8, y: t[1] * T + 8, r: 40, col: ['#74e6ff', '#b777ff', '#7aff9a'][i % 3], a: 0.7 }); m.deco.push({ t: 'crystal', x: t[0], y: t[1], col: ['#74e6ff', '#b777ff', '#7aff9a'][i % 3] }); } }
    // baú de tesouro raro
    if (!boss && r() < 0.18) { const t = floorTiles[floorTiles.length - 3]; if (t && !m.getObj(t[0], t[1])) m.setObj(t[0], t[1], { t: 'chest', solid: 1, items: [], cap: 12, kind: 'treasure', floor }); }
    // elevador a cada 10 andares: sala segura
    m.checkpoint = floor % 10 === 0;
    if (boss) { m.lights.push({ x: (w >> 1) * T, y: (h >> 1) * T, r: 120, col: '#74e6ff', a: 0.6 }); }
    return m;
  }

  return { generate, MON, MAXF };
})();
