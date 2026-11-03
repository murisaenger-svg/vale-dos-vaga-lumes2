'use strict';
/* ============================================================
   Natureza em pixel art: árvores (4 estações + estágios de
   crescimento), pedras, minérios, arbustos, ervas, cultivos, cercas.
   Cada sprite = { c: canvas, ax, ay } onde (ax,ay) é a âncora na base.
   ============================================================ */
VV.Art.Nature = (() => {
  const U = VV.U, Px = VV.Px;
  const cache = {};
  const memo = (key, fn) => cache[key] || (cache[key] = fn());

  const BARK = ['#7c5432', '#9a6e40', '#583a22'];

  function canopyColors(s, variant, i) {
    if (s === 0) return variant === 1 ? ['#f3a6c6', '#e88db4', '#fbc3d8'][i % 3] : ['#6cc04a', '#7ccc55', '#5cb043'][i % 3];
    if (s === 1) return ['#4fa83a', '#5db644', '#43982f'][i % 3];
    return ['#e0862c', '#cc5a2a', '#e8b83a', '#d4702a'][i % 4];
  }

  function oakSprite(s, scale, variant) {
    const p = new Px(52, 68);
    const ax = 26, by = 66;
    p.shadow(ax, by - 1, Math.round(15 * scale) + 2, 4, 0.22);
    const tw = scale > 0.9 ? 8 : scale > 0.6 ? 6 : 4;
    const th = Math.round(30 * scale) + 6;
    const x0 = ax - tw / 2;
    for (let y = by - th; y < by; y++) {
      const flare = y > by - 6 ? Math.round((y - (by - 6)) * 0.5) : 0;
      const w = tw + flare * 2, xx = ax - w / 2;
      p.r(xx, y, w, 1, BARK[0]);
      p.p(xx, y, BARK[1]); p.p(xx + 1, y, BARK[1]); p.p(xx + w - 1, y, BARK[2]); if (w > 5) p.p(xx + w - 2, y, BARK[2]);
      if (U.hash2(y, 7, 3) > 0.6) p.p(xx + 2 + (y % 3), y, BARK[2]);
    }
    if (scale > 0.9) { p.p(x0 + 3, by - 12, '#3f2a18'); p.p(x0 + 3, by - 11, '#3f2a18'); p.p(x0 + 4, by - 11, '#3f2a18'); }
    const cx = ax, cy = by - th - 4 * scale;
    if (s === 3) {
      const br = (x1, y1, x2, y2) => { p.line(x1, y1, x2, y2, BARK[0]); p.line(x1 + 1, y1, x2 + 1, y2, BARK[2]); p.p(x2, y2 - 1, '#f4f8ff'); p.p((x1 + x2) / 2, (y1 + y2) / 2 - 1, '#f4f8ff'); };
      const ty = by - th + 2;
      br(ax, ty, ax - 11 * scale, ty - 14 * scale); br(ax, ty, ax + 11 * scale, ty - 16 * scale); br(ax, ty, ax, ty - 20 * scale);
      br(ax - 5 * scale, ty - 7 * scale, ax - 14 * scale, ty - 8 * scale); br(ax + 5 * scale, ty - 9 * scale, ax + 14 * scale, ty - 11 * scale);
      p.r(ax - tw / 2, by - 1, tw, 1, '#f4f8ff');
    } else {
      const balls = [[0, -4, 15, 12], [-12, 2, 10, 9], [12, 2, 10, 9], [0, 7, 13, 8], [-7, -12, 9, 8], [8, -12, 9, 8], [-14, -6, 7, 6], [14, -6, 7, 6]];
      balls.forEach((b, i) => {
        const col = canopyColors(s, variant, i);
        p.ball(Math.round(cx + b[0] * scale), Math.round(cy + b[1] * scale), Math.max(3, Math.round(b[2] * scale)), Math.max(3, Math.round(b[3] * scale)), col, { seed: i + s * 9 });
      });
      for (let i = 0; i < 10 * scale; i++) { // folhinhas de destaque
        const lx = cx + (U.hash2(i, 1, s) - 0.5) * 30 * scale, ly = cy + (U.hash2(i, 2, s) - 0.5) * 24 * scale - 2;
        p.p(lx, ly, U.shade(canopyColors(s, variant, i), 0.45)); p.p(lx + 1, ly + 1, U.shade(canopyColors(s, variant, i), -0.3));
      }
      if (s === 0 && variant === 1) for (let i = 0; i < 12; i++) p.p(cx + (U.hash2(i, 3, 4) - 0.5) * 34 * scale, cy + (U.hash2(i, 4, 4) - 0.5) * 26 * scale, '#ffffff');
    }
    p.outline({ strength: 0.78 });
    return { c: p.c, ax, ay: by + 1 };
  }

  function pineSprite(s, scale) {
    const p = new Px(44, 68), ax = 22, by = 66;
    p.shadow(ax, by - 1, 12, 3, 0.22);
    const th = 12;
    p.r(ax - 2, by - th, 4, th, BARK[0]); p.r(ax - 2, by - th, 1, th, BARK[1]); p.r(ax + 1, by - th, 1, th, BARK[2]);
    const g = s === 3 ? ['#2f7a4e', '#3d9460', '#245f3e'] : s === 2 ? ['#3a7d3a', '#4a9648', '#2c612e'] : ['#2f8040', '#3d9a52', '#246a35'];
    const tiers = 5, tierH = 14;
    for (let i = 0; i < tiers; i++) {
      const top = 4 + i * 10 * scale, mw = Math.round((6 + i * 3.4) * scale);
      for (let y = 0; y < tierH * scale; y++) {
        const hw = Math.round(((y + 1) / (tierH * scale)) * mw);
        const yy = Math.round(top + y);
        for (let x = -hw; x <= hw; x++) {
          const n = U.hash2(x + i * 9, yy, 5);
          const t = x / (hw + 0.5);
          let col = t < -0.35 ? g[1] : t > 0.35 ? g[2] : g[0];
          if (n > 0.9) col = U.shade(col, 0.2); else if (n < 0.1) col = U.shade(col, -0.2);
          if (y > tierH * scale - 3 && x % 2 === 0) col = U.shade(col, -0.25);
          p.p(ax + x, yy, col);
        }
        if (s === 3 && y < 4 * scale + (i % 2)) for (let x = -hw; x <= hw; x++) if (U.hash2(x + i, yy, 8) > 0.2 && Math.abs(x) <= hw - (y > 1 ? 1 : 0)) p.p(ax + x, yy, x > 1 ? '#d9e6f6' : '#ffffff');
      }
    }
    p.outline({ strength: 0.78 });
    return { c: p.c, ax, ay: by + 1 };
  }

  function palmSprite(s) {
    const p = new Px(56, 68), ax = 28, by = 66;
    p.shadow(ax + 2, by - 1, 10, 3, 0.2);
    let x = ax - 2;
    for (let y = by; y > 22; y--) { const t = (by - y) / 44; x = ax - 2 + Math.sin(t * 1.8) * 5 + t * 3; p.r(Math.round(x), y, 4, 1, y % 5 === 0 ? BARK[2] : BARK[0]); p.p(Math.round(x), y, BARK[1]); }
    const tx = Math.round(x) + 2, ty = 22;
    const fr = [[-22, -4], [-16, -14], [-6, -20], [8, -20], [18, -14], [24, -4], [-20, 8], [22, 8]];
    for (const [dx, dy] of fr) {
      const mx = tx + dx / 2, my = ty + dy / 2 - 5;
      for (let k = 0; k <= 16; k++) {
        const t = k / 16, qx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * (tx + dx), qy = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * my + t * t * (ty + dy + 6);
        p.p(qx, qy, '#2f8a3c'); p.p(qx, qy + 1, '#3fa64a'); p.p(qx, qy - 1, k % 3 === 0 ? '#58c25c' : '#3fa64a'); if (k % 2) p.p(qx, qy + 2, '#246d30');
      }
    }
    p.disc(tx - 2, ty + 3, 2, '#6b4a2a'); p.disc(tx + 3, ty + 3, 2, '#7d5a34');
    p.outline({ strength: 0.78 });
    return { c: p.c, ax, ay: by + 1 };
  }

  function stumpSprite() {
    const p = new Px(20, 20); p.shadow(10, 15, 8, 3, 0.2);
    p.r(4, 8, 12, 8, BARK[0]); p.r(4, 8, 2, 8, BARK[1]); p.r(14, 8, 2, 8, BARK[2]);
    p.ell(10, 8, 6, 3, '#c9985c'); p.ell(10, 8, 4, 2, '#dcb272'); p.ell(10, 8, 2, 1, '#b3814a'); p.p(10, 8, '#8a5a30');
    p.outline(); return { c: p.c, ax: 10, ay: 17 };
  }
  function seedlingSprite(stage, s) {
    const p = new Px(20, 24); p.shadow(10, 20, 4, 2, 0.15);
    const g = s === 3 ? '#8a9a8a' : '#4fae3f', gl = s === 3 ? '#b8c8b8' : '#7ad05a';
    if (stage === 0) { p.ell(10, 19, 3, 1, '#6d4a30'); p.p(10, 17, g); p.p(9, 16, gl); p.p(11, 16, gl); }
    else if (stage === 1) { p.r(10, 13, 1, 7, '#6f9a44'); p.ell(7, 13, 2, 1, g); p.ell(13, 12, 2, 1, gl); p.p(10, 12, gl); }
    else { p.r(9, 6, 2, 14, BARK[0]); p.p(9, 6, BARK[1]); p.ell(6, 8, 3, 2, g); p.ell(14, 7, 3, 2, gl); p.ell(10, 4, 3, 3, g); p.p(10, 3, gl); p.p(5, 7, gl); }
    p.outline(); return { c: p.c, ax: 10, ay: 21 };
  }

  /* ---------- pedras e minérios ---------- */
  const ORE = {
    stone: null, copper: ['#e0873f', '#ffb06a'], iron: ['#d8d2cc', '#8a8490'], gold: ['#ffd23f', '#fff08a'],
    crystal: ['#74e6ff', '#d6f8ff'], coal: ['#25232d', '#4a4856'], quartz: ['#f2f4ff', '#ffffff'], amethyst: ['#b777ff', '#e3c8ff'],
    topaz: ['#ffb040', '#ffe2a0'], emerald: ['#3fdb7a', '#b0ffd0'], ruby: ['#ff4a5e', '#ffb0ba'], sapphire: ['#4a7dff', '#b0c8ff'], diamond: ['#c8f4ff', '#ffffff'],
  };
  function rockSprite(kind, cave, big) {
    const W = big ? 36 : 20, H = big ? 34 : 20, p = new Px(W, H);
    const base = cave ? '#6c6684' : '#9d979a';
    const cx = W >> 1, bY = H - 3;
    p.shadow(cx, bY, big ? 14 : 7, big ? 4 : 3, 0.25);
    if (big) { p.ball(cx - 4, bY - 10, 11, 9, base, { seed: 1 }); p.ball(cx + 6, bY - 7, 9, 7, U.shade(base, 0.06), { seed: 2 }); p.ball(cx - 8, bY - 5, 7, 5, U.shade(base, -0.05), { seed: 3 }); }
    else { p.ball(cx, bY - 5, 7, 5, base, { seed: 4 }); p.ball(cx + 3, bY - 3, 5, 3, U.shade(base, 0.05), { seed: 5 }); }
    const o = ORE[kind];
    if (o) {
      const n = big ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const sx = cx - (big ? 12 : 5) + U.hash2(i, 1, kind.length) * (big ? 24 : 10), sy = bY - (big ? 17 : 8) + U.hash2(i, 2, kind.length) * (big ? 12 : 6);
        const gem = ['quartz', 'amethyst', 'topaz', 'emerald', 'ruby', 'sapphire', 'diamond', 'crystal'].includes(kind);
        if (gem) { p.p(sx, sy - 1, o[1]); p.p(sx, sy, o[0]); p.p(sx + 1, sy, o[0]); p.p(sx, sy + 1, U.shade(o[0], -0.3)); }
        else { p.p(sx, sy, o[0]); p.p(sx + 1, sy, o[0]); p.p(sx, sy + 1, o[1]); p.p(sx + 1, sy - 1, o[1]); }
      }
    }
    p.outline({ strength: 0.78 });
    return { c: p.c, ax: cx, ay: H - 1 };
  }
  function logSprite() {
    const p = new Px(36, 20); p.shadow(18, 15, 14, 3, 0.2);
    p.r(3, 5, 30, 10, BARK[0]); p.r(3, 5, 30, 2, BARK[1]); p.r(3, 13, 30, 2, BARK[2]);
    for (let x = 6; x < 30; x += 5) p.p(x, 9, BARK[2]);
    p.ell(4, 10, 3, 5, '#c9985c'); p.ell(4, 10, 1, 3, '#a8763f');
    p.outline(); return { c: p.c, ax: 18, ay: 17 };
  }
  function branchSprite() {
    const p = new Px(20, 18); p.shadow(10, 13, 6, 2, 0.15);
    p.line(3, 12, 16, 7, BARK[0]); p.line(3, 11, 16, 6, BARK[1]); p.line(9, 10, 12, 4, BARK[0]); p.line(6, 11, 5, 6, BARK[2]);
    p.outline(); return { c: p.c, ax: 10, ay: 15 };
  }

  /* ---------- plantas ---------- */
  function bushSprite(s, berry) {
    const p = new Px(20, 20); p.shadow(10, 16, 7, 3, 0.2);
    const gc = s === 3 ? '#8aa597' : s === 2 ? '#a88a3a' : '#3f9e3b';
    if (s === 3 && !berry) { p.line(4, 15, 8, 5, BARK[0]); p.line(10, 15, 10, 4, BARK[0]); p.line(16, 15, 12, 6, BARK[0]); p.p(8, 4, '#fff'); p.p(10, 3, '#fff'); p.p(12, 5, '#fff'); }
    else {
      p.ball(10, 11, 8, 6, gc, { seed: 3 }); p.ball(5, 12, 5, 4, U.shade(gc, 0.05), { seed: 4 }); p.ball(15, 12, 5, 4, U.shade(gc, -0.05), { seed: 5 });
      if (berry) for (const [x, y] of [[6, 9], [11, 8], [14, 12], [8, 13], [12, 11]]) { p.p(x, y, berry); p.p(x, y - 1, U.shade(berry, 0.4)); }
    }
    p.outline({ strength: 0.75 }); return { c: p.c, ax: 10, ay: 18 };
  }
  function weedSprite(s, v) {
    const p = new Px(18, 18);
    const g = s === 3 ? ['#9fb8a4', '#c8dccb', '#7d9886'] : s === 2 ? ['#9a8a3a', '#bfae4c', '#7a6c2c'] : ['#4faa3c', '#74c85a', '#38872f'];
    const blades = v === 0 ? [[5, 13, 3, 6], [8, 13, 8, 10], [11, 13, 13, 7], [7, 13, 5, 9], [10, 13, 11, 9]] : [[4, 13, 2, 8], [7, 13, 6, 5], [9, 13, 10, 6], [12, 13, 15, 9], [8, 13, 8, 9]];
    for (const [x1, y1, x2, y2] of blades) { p.line(x1, y1, x2, y2, g[0]); p.line(x1 + 1, y1, x2 + 1, y2, g[2]); p.p(x2, y2, g[1]); }
    if (s <= 1 && v === 1) { p.p(8, 8, '#ffe66a'); p.p(7, 8, '#fff'); p.p(9, 8, '#fff'); p.p(8, 7, '#fff'); }
    p.outline({ strength: 0.6 }); return { c: p.c, ax: 9, ay: 15 };
  }
  function grassTall(s) { // mato alto (foice -> feno)
    const p = new Px(18, 20), g = s === 3 ? ['#aac0b0', '#d4e4d8'] : s === 2 ? ['#b8a444', '#d8c862'] : ['#5fb84a', '#86d468'];
    for (let i = 0; i < 9; i++) { const x = 2 + i * 1.6, h = 8 + ((i * 7) % 5); p.line(x, 17, x + (i % 2 ? 1 : -1), 17 - h, g[0]); p.p(x + (i % 2 ? 1 : -1), 17 - h, g[1]); }
    p.outline({ strength: 0.55 }); return { c: p.c, ax: 9, ay: 18 };
  }

  /* ---------- cultivos ---------- */
  function cropSprite(t, c, stage, stages, dead) {
    const p = new Px(18, 34), ax = 9, by = 31;
    const ready = stage >= stages - 1;
    const lc = dead ? '#8a6a3a' : c.l, lh = dead ? '#a8844a' : U.shade(c.l, 0.3), ld = dead ? '#6a4a28' : U.shade(c.l, -0.3);
    const f = c.f, fh = U.shade(f, 0.4), fd = U.shade(f, -0.3);
    const k = stage / Math.max(1, stages - 1); // 0..1
    const leaf = (x, y, w, up) => { p.ell(x, y, w, 1 + (up ? 1 : 0), lc); p.p(x - 1, y - 1, lh); p.p(x + w - 1, y, ld); };
    if (stage === 0) { p.p(ax, by - 1, lc); p.p(ax - 1, by - 2, lh); p.p(ax + 1, by - 2, lc); p.ell(ax, by, 2, 1, '#5a3b25'); }
    else {
      switch (t) {
        case 'leaf': {
          const r = 2 + Math.round(k * 5);
          for (let i = 0; i < 3 + stage; i++) { const a = i * 1.7; leaf(ax + Math.cos(a) * r * 0.9, by - 3 - Math.abs(Math.sin(a)) * r * 0.6 - (i % 2) * 2, 2 + Math.round(k * 2), true); }
          if (ready) { p.ball(ax, by - 6, 5, 4, f, { seed: 3 }); p.p(ax - 2, by - 8, fh); }
          break;
        }
        case 'root': {
          const h = 3 + Math.round(k * 9);
          for (const [dx, a] of [[-4, -0.5], [0, 0], [4, 0.5], [-2, -0.25], [2, 0.25]]) { p.line(ax, by - 1, ax + dx + a * h * 0.3, by - 1 - h, lc); p.p(ax + dx + a * h * 0.3, by - 2 - h, lh); if (stage > 1) p.p(ax + dx + a * h * 0.3 - 1, by - 1 - h * 0.6, ld); }
          if (ready) { p.ell(ax, by, 3, 2, f); p.p(ax - 1, by - 1, fh); p.p(ax + 1, by + 1, fd); }
          break;
        }
        case 'stalk': { // milho / girassol
          const h = 5 + Math.round(k * 20);
          for (let y = 0; y < h; y++) p.p(ax, by - y, y % 6 === 5 ? ld : lc);
          for (let y = 5; y < h; y += 5) { const side = (y / 5) % 2 ? 1 : -1; p.line(ax, by - y, ax + side * 6, by - y - 3, lc); p.line(ax + side * 3, by - y - 1, ax + side * 6, by - y - 2, lh); p.p(ax + side * 6, by - y - 3, ld); }
          if (ready) {
            if (c.flower) { p.disc(ax, by - h - 1, 5, '#8a5a24'); for (let a = 0; a < 12; a++) { p.p(ax + Math.cos(a / 12 * 6.28) * 6.5, by - h - 1 + Math.sin(a / 12 * 6.28) * 6.5, f); p.p(ax + Math.cos(a / 12 * 6.28) * 5.5, by - h - 1 + Math.sin(a / 12 * 6.28) * 5.5, fh); } p.disc(ax, by - h - 1, 2, '#5a3a18'); }
            else { p.ell(ax + 3, by - h + 8, 2, 4, f); p.p(ax + 2, by - h + 5, fh); p.ell(ax - 3, by - h + 11, 2, 4, f); p.p(ax - 4, by - h + 8, fh); p.p(ax, by - h, '#e0d090'); p.p(ax - 1, by - h - 1, '#e0d090'); }
          }
          break;
        }
        case 'vine': { // tomate, pimenta, berinjela, feijão (estaca)
          const h = 4 + Math.round(k * 17);
          p.r(ax + 4, by - h - 2, 1, h + 3, '#8a6a40');
          for (let y = 0; y < h; y++) p.p(ax, by - y, y % 4 === 3 ? ld : lc);
          for (let y = 3; y < h; y += 3) { const s2 = (y / 3) % 2 ? 1 : -1; leaf(ax + s2 * 4, by - y, 3, true); }
          if (ready) for (const [dx, dy] of [[-4, 5], [3, 9], [-3, 12], [5, 4]]) { if (dy < h) { p.disc(ax + dx, by - dy, 1, f); p.p(ax + dx - 1, by - dy - 1, fh); p.p(ax + dx, by - dy + 1, fd); } }
          break;
        }
        case 'bush': {
          const r = 3 + Math.round(k * 4);
          p.ball(ax, by - 3, r + 1, 3 + Math.round(k * 2), c.l, { seed: 7 });
          if (ready) for (const [dx, dy] of [[-4, -2], [1, -4], [4, -1], [-1, 0], [3, 1], [-3, -5]]) { p.disc(ax + dx, by - 3 + dy, 1, f); p.p(ax + dx - 1, by - 4 + dy, fh); }
          break;
        }
        case 'gourd': { // abóbora, melancia, melão
          const r = 2 + Math.round(k * 3);
          for (let i = -1; i <= 1; i += 2) { leaf(ax + i * (r + 1), by - 3 - (i > 0 ? 1 : 0), 3, false); p.line(ax, by - 1, ax + i * (r + 1), by - 3, lc); }
          if (ready) { p.ball(ax, by - 4, 6, 5, f, { seed: 5 }); for (let x = -4; x <= 4; x += 3) p.line(ax + x, by - 8, ax + x * 0.8, by - 1, fd); if (c.stripe) { for (let x = -4; x <= 4; x += 2) p.line(ax + x, by - 8, ax + x, by - 1, c.stripe); } p.r(ax - 1, by - 10, 2, 2, '#4f7a2e'); }
          else if (stage >= 2) p.ball(ax, by - 3, 3, 2, c.l, { seed: 2 });
          break;
        }
        case 'flower': {
          const h = 3 + Math.round(k * 8);
          p.line(ax, by - 1, ax, by - h, lc); leaf(ax - 3, by - 3, 3, true); leaf(ax + 3, by - 5, 3, true);
          if (stage >= 2) { const rad = ready ? 3 : 1; for (let a = 0; a < 6; a++) p.disc(Math.round(ax + Math.cos(a) * rad), Math.round(by - h - 1 + Math.sin(a) * rad), 1, f); p.p(ax, by - h - 1, '#ffe14a'); }
          break;
        }
        case 'grape': {
          p.r(ax - 7, by - 20, 14, 1, '#8a6a40'); p.r(ax - 7, by - 20, 1, 21, '#8a6a40'); p.r(ax + 6, by - 20, 1, 21, '#8a6a40');
          const h = 4 + Math.round(k * 15);
          for (let y = 0; y < h; y++) { p.p(ax - 3 + Math.round(Math.sin(y / 2)), by - y, lc); p.p(ax + 3 - Math.round(Math.sin(y / 2)), by - y, lc); }
          for (let y = 2; y < h; y += 3) { leaf(ax - 4, by - y, 3, true); leaf(ax + 4, by - y - 1, 3, true); }
          if (ready) for (const [dx, dy] of [[-5, 9], [-1, 12], [4, 8], [1, 5], [-4, 4]]) { p.disc(ax + dx, by - dy, 1, f); p.p(ax + dx + 1, by - dy + 1, f); p.p(ax + dx, by - dy + 2, fd); p.p(ax + dx - 1, by - dy - 1, fh); }
          break;
        }
      }
    }
    p.outline({ strength: 0.6 });
    return { c: p.c, ax, ay: by + 3 };
  }

  /* ---------- cerca ---------- */
  function fenceSprite(mask, tier) { // máscara: N=1,E=2,S=4,W=8
    const p = new Px(16, 24), wood = tier === 1 ? ['#9aa0ad', '#b9bfcb', '#6d7381'] : ['#a97844', '#c8955a', '#7a5230'];
    const post = (x) => { p.r(x, 6, 4, 14, wood[0]); p.r(x, 6, 1, 14, wood[1]); p.r(x + 3, 6, 1, 14, wood[2]); p.r(x, 5, 4, 1, wood[1]); };
    if (mask & 2) { p.r(8, 9, 8, 2, wood[0]); p.r(8, 9, 8, 1, wood[1]); p.r(8, 15, 8, 2, wood[0]); p.r(8, 15, 8, 1, wood[1]); }
    if (mask & 8) { p.r(0, 9, 8, 2, wood[0]); p.r(0, 9, 8, 1, wood[1]); p.r(0, 15, 8, 2, wood[0]); p.r(0, 15, 8, 1, wood[1]); }
    if (mask & 1) { p.r(6, 0, 4, 12, wood[0]); p.r(6, 0, 1, 12, wood[1]); }
    if (mask & 4) { p.r(6, 12, 4, 10, wood[0]); p.r(6, 12, 1, 10, wood[1]); p.r(9, 12, 1, 10, wood[2]); }
    post(6);
    p.outline({ strength: 0.7 });
    return { c: p.c, ax: 8, ay: 22 };
  }

  return {
    oak: (s, st, v) => memo(`oak${s}_${st}_${v}`, () => st >= 4 ? oakSprite(s, 1, v) : st === 3 ? oakSprite(s, 0.62, v) : seedlingSprite(st, s)),
    pine: s => memo('pine' + s, () => pineSprite(s, 1)),
    palm: s => memo('palm' + s, () => palmSprite(s)),
    stump: () => memo('stump', stumpSprite),
    rock: (kind, cave, big) => memo(`rock${kind}${cave}${big}`, () => rockSprite(kind, cave, big)),
    log: () => memo('log', logSprite), branch: () => memo('branch', branchSprite),
    bush: (s, berry) => memo('bush' + s + berry, () => bushSprite(s, berry)),
    weed: (s, v) => memo(`weed${s}${v}`, () => weedSprite(s, v)),
    grassTall: s => memo('gt' + s, () => grassTall(s)),
    crop: (t, c, stage, stages, dead) => memo(`crop${t}${c.l}${c.f}${stage}${stages}${dead}`, () => cropSprite(t, c, stage, stages, dead)),
    fence: (m, tier) => memo(`fence${m}${tier}`, () => fenceSprite(m, tier)),
    ORE,
  };
})();
