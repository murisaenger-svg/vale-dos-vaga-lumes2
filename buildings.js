'use strict';
/* ============================================================
   Prédios, decorações e máquinas em pixel art.
   Cada sprite: { c, ax, ay, glow? } — glow = camada de luz noturna.
   ============================================================ */
VV.Art.Build = (() => {
  const U = VV.U, Px = VV.Px;
  const cache = {};
  const memo = (k, f) => cache[k] || (cache[k] = f());

  function roof(p, x, y, w, h, col, style) {
    const hi = U.shade(col, 0.22), lo = U.shade(col, -0.22), dk = U.shade(col, -0.4);
    p.r(x, y, w, h, col);
    const rows = style === 'tile' ? 4 : 3;
    for (let ry = 0; ry < h; ry += rows) {
      p.r(x, y + ry + rows - 1, w, 1, lo);
      const off = (ry / rows) % 2 ? 3 : 0;
      for (let rx = off; rx < w; rx += 6) { p.r(x + rx, y + ry, 1, rows, lo); p.p(x + rx + 1, y + ry, hi); }
      p.r(x, y + ry, w, 1, hi);
    }
    p.r(x, y + h - 2, w, 2, dk); p.r(x, y + h - 3, w, 1, lo);
    // recorte inclinado nas pontas
    return p;
  }
  function window_(p, g, x, y, w, h, lit, curtain) {
    p.r(x - 1, y - 1, w + 2, h + 2, '#6b4a2f'); p.r(x - 1, y - 1, w + 2, 1, '#8a6240');
    p.r(x, y, w, h, '#8ec3e6'); p.r(x, y, w, 1, '#c8e8fa'); p.p(x + 1, y + 1, '#ffffff'); p.p(x + 2, y + 1, '#e8f6ff');
    p.r(x + (w >> 1), y, 1, h, '#6b4a2f'); p.r(x, y + (h >> 1), w, 1, '#6b4a2f');
    p.r(x - 2, y + h + 1, w + 4, 2, '#8a6240'); p.r(x - 2, y + h + 2, w + 4, 1, '#4e341f');
    if (curtain) { p.r(x, y, 2, h, curtain); p.r(x + w - 2, y, 2, h, curtain); }
    if (g) { g.r(x - 4, y - 4, w + 8, h + 8, 'rgba(255,200,110,0.35)'); g.r(x - 1, y - 1, w + 2, h + 2, 'rgba(255,225,150,0.9)'); }
  }
  function door(p, x, y, w, h, col) {
    p.r(x - 1, y - 1, w + 2, h + 1, '#4a3020'); p.r(x, y, w, h, col);
    p.r(x, y, 1, h, U.shade(col, 0.2)); p.r(x + w - 1, y, 1, h, U.shade(col, -0.25));
    p.r(x + 2, y + 2, w - 4, 4, U.shade(col, -0.18)); p.r(x + 2, y + h - 6, w - 4, 4, U.shade(col, -0.18));
    p.p(x + w - 3, y + (h >> 1), '#ffd23f'); p.p(x + w - 3, y + (h >> 1) + 1, '#c08a1a');
    p.r(x - 2, y + h, w + 4, 1, '#8f8a96');
  }
  function siding(p, x, y, w, h, col, kind) {
    const lo = U.shade(col, -0.14), hi = U.shade(col, 0.14);
    p.r(x, y, w, h, col);
    if (kind === 'brick') { for (let ry = 0; ry < h; ry += 4) { p.r(x, y + ry, w, 1, lo); for (let rx = (ry / 4) % 2 ? 4 : 0; rx < w; rx += 8) p.r(x + rx, y + ry, 1, 4, lo); } for (let i = 0; i < w * h / 24; i++) p.p(x + U.hash2(i, 1, 4) * w, y + U.hash2(i, 2, 4) * h, hi); }
    else if (kind === 'plank') { for (let ry = 0; ry < h; ry += 4) { p.r(x, y + ry + 3, w, 1, lo); p.r(x, y + ry, w, 1, hi); } for (let i = 0; i < w * h / 40; i++) p.p(x + U.hash2(i, 5, 4) * w, y + U.hash2(i, 6, 4) * h, lo); }
    else { for (let rx = 0; rx < w; rx += 4) { p.r(x + rx, y, 1, h, lo); p.r(x + rx + 1, y, 1, h, hi); } }
    p.r(x, y + h - 2, w, 2, U.shade(col, -0.3)); p.r(x, y, w, 1, U.shade(col, -0.3));
  }

  /* ---------- casas genéricas ---------- */
  // tilesW/H em tiles; a base do prédio fica nos 2 tiles inferiores
  function house(o) {
    const key = 'house' + JSON.stringify(o);
    return memo(key, () => {
      const T = 16, W = o.w * T, H = o.h * T, p = new Px(W, H), g = new Px(W, H);
      const wallH = 2 * T, wallY = H - wallH - 2;
      const roofH = H - wallH - 2 + 6;
      p.shadow(W / 2, H - 2, W / 2 - 4, 5, 0.22);
      siding(p, 4, wallY, W - 8, wallH, o.wall, o.kind || 'stripe');
      // telhado
      const ov = 6, rh = roofH;
      for (let i = 0; i < rh; i++) {
        const inset = Math.round(i * (o.pitch ?? 0.1));
        const rr = (i / rh);
        p.r(inset, i + (wallY - rh + 8), W - inset * 2, 1, 'rgba(0,0,0,0)');
      }
      roof(p, 0, wallY - rh + 8, W, rh, o.roof, o.roofStyle);
      // cumeeira e beiral
      p.r(0, wallY - rh + 8, W, 2, U.shade(o.roof, 0.3));
      p.r(0, wallY + 5, W, 3, U.shade(o.roof, -0.35));
      // chaminé
      if (o.chimney !== false) { const cx = o.chimneyX ?? W - 28; p.r(cx, wallY - rh - 2, 9, 14, '#8a6a5a'); p.r(cx, wallY - rh - 2, 9, 2, '#b08a78'); p.r(cx - 1, wallY - rh - 4, 11, 3, '#6a4a3e'); p.r(cx + 1, wallY - rh - 2, 1, 14, '#a8847a'); for (let y = wallY - rh; y < wallY - rh + 12; y += 3) p.r(cx, y, 9, 1, '#6a4a3e'); }
      // porta + janelas
      const dx = o.doorX ?? (Math.floor(o.w / 2) * T + 3);
      door(p, dx, H - 22, 10, 20, o.door || '#8a5a35');
      if (o.awning) { for (let x = 0; x < 16; x += 4) { p.r(dx - 3 + x, H - 28, 4, 5, (x / 4) % 2 ? '#ffffff' : o.awning); } p.r(dx - 3, H - 23, 16, 1, U.shade(o.awning, -0.3)); }
      const wins = o.windows ?? [dx - 22, dx + 22];
      for (const wx of wins) window_(p, g, wx, H - 26, 8, 10, true, o.curtain);
      if (o.flowerBox) for (const wx of wins) { p.r(wx - 2, H - 14, 12, 3, '#7a5230'); for (let i = 0; i < 6; i++) { p.p(wx - 1 + i * 2, H - 16 + (i % 2), ['#ff7aa6', '#ffe14a', '#ffffff'][i % 3]); p.p(wx - 1 + i * 2, H - 15, '#3f9e3b'); } }
      // base de pedra
      p.r(4, H - 5, W - 8, 4, '#8f8a96'); for (let x = 4; x < W - 4; x += 5) p.r(x, H - 5, 1, 4, '#6d6878'); p.r(4, H - 5, W - 8, 1, '#aaa6b4');
      if (o.sign) {
        p.r(W - 24, H - 34, 20, 12, '#c8955a'); p.r(W - 24, H - 34, 20, 1, '#e8b87a'); p.r(W - 24, H - 23, 20, 1, '#7a5230');
        if (o.sign === 'cross') { p.r(W - 16, H - 32, 4, 8, '#e8453a'); p.r(W - 18, H - 30, 8, 4, '#e8453a'); }
        if (o.sign === 'cup') { p.r(W - 18, H - 31, 8, 6, '#fff'); p.r(W - 10, H - 30, 2, 3, '#fff'); p.r(W - 16, H - 33, 1, 2, '#ddd'); p.r(W - 13, H - 33, 1, 2, '#ddd'); }
        if (o.sign === 'coin') { p.disc(W - 14, H - 28, 4, '#ffd23f'); p.p(W - 14, H - 28, '#c08a1a'); p.disc(W - 15, H - 29, 1, '#fff08a'); }
        if (o.sign === 'bell') { p.ell(W - 14, H - 29, 4, 4, '#ffd23f'); p.r(W - 15, H - 25, 3, 2, '#7a5230'); }
        if (o.sign === 'hammer') { p.r(W - 15, H - 30, 2, 8, '#7a5230'); p.r(W - 19, H - 32, 10, 4, '#9aa0ad'); }
      }
      p.outline({ strength: 0.8 });
      g.outline && 0;
      return { c: p.c, glow: g.c, ax: 0, ay: H, w: o.w, h: o.h, doorTx: Math.floor((dx + 5) / T) };
    });
  }

  function barn(kind) { // celeiro (animais grandes) / galinheiro
    return memo('barn' + kind, () => {
      const T = 16, big = kind === 'barn', w = big ? 8 : 5, h = big ? 6 : 4, W = w * T, H = h * T, p = new Px(W, H);
      p.shadow(W / 2, H - 2, W / 2 - 4, 4, 0.22);
      const wall = big ? '#c4473a' : '#b98a55', roofC = big ? '#7a3d34' : '#8a5a38';
      const wy = H - (big ? 56 : 36);
      siding(p, 3, wy, W - 6, H - wy - 3, wall, 'plank');
      // telhado em forma de empena
      const gh = big ? 36 : 22;
      for (let i = 0; i < gh; i++) { const half = Math.round(W / 2 - 2 - i * ((W / 2 - 6) / gh) * (big ? 0.55 : 0.62)); p.r(W / 2 - half, wy - i, half * 2, 1, i % 4 === 3 ? U.shade(wall, -0.2) : wall); }
      // aba do telhado
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < gh + 4; i++) { const x = W / 2 + s * (W / 2 - 1 - i * (W / 2 - 6) / gh * (big ? 0.55 : 0.62)); p.r(Math.round(x) - (s > 0 ? 3 : 0), wy - i + 1, 4, 3, i % 2 ? roofC : U.shade(roofC, 0.15)); }
      p.r(W / 2 - 3, wy - gh - 1, 6, 4, U.shade(roofC, 0.25));
      // portas
      const dw = big ? 24 : 14, dh = big ? 34 : 22, dx = Math.floor(w / 2) * T + 8 - dw / 2;
      p.r(dx - 2, H - dh - 5, dw + 4, dh + 2, '#f5efe4'); p.r(dx, H - dh - 3, dw, dh, U.shade(wall, -0.1));
      p.r(dx, H - dh - 3, dw / 2 - 1, dh, wall); p.r(dx + dw / 2 + 1, H - dh - 3, dw / 2 - 1, dh, wall);
      for (let i = 0; i < 2; i++) { p.line(dx + (i ? dw / 2 + 1 : 0), H - dh - 3, dx + (i ? dw - 1 : dw / 2 - 2), H - 5, '#f5efe4'); p.line(dx + (i ? dw - 1 : dw / 2 - 2), H - dh - 3, dx + (i ? dw / 2 + 1 : 0), H - 5, '#f5efe4'); }
      p.r(dx, H - dh - 3, dw, 1, '#f5efe4'); p.r(dx, H - 5, dw, 1, '#f5efe4'); p.r(dx + dw / 2 - 1, H - dh - 3, 2, dh, '#f5efe4');
      p.r(dx - 2, H - 4, dw + 4, 1, '#3a2c26');
      if (big) { p.r(W / 2 - 6, wy - 16, 12, 10, '#2c1b10'); p.r(W / 2 - 6, wy - 16, 12, 1, '#f5efe4'); p.r(W / 2 - 6, wy - 7, 12, 1, '#f5efe4'); p.r(W / 2 - 6, wy - 16, 1, 10, '#f5efe4'); p.r(W / 2 + 5, wy - 16, 1, 10, '#f5efe4'); p.line(W / 2 - 5, wy - 15, W / 2 + 4, wy - 8, '#f5efe4'); p.line(W / 2 + 4, wy - 15, W / 2 - 5, wy - 8, '#f5efe4'); }
      else { p.r(W / 2 - 3, wy - 10, 6, 6, '#2c1b10'); p.r(W / 2 - 3, wy - 10, 6, 1, '#f5efe4'); }
      p.r(3, H - 4, W - 6, 3, '#8f8a96');
      p.outline({ strength: 0.8 });
      return { c: p.c, ax: 0, ay: H, w, h, doorTx: Math.floor(w / 2) };
    });
  }

  function silo() {
    return memo('silo', () => {
      const p = new Px(40, 100); p.shadow(20, 96, 17, 4, 0.22);
      for (let y = 20; y < 96; y++) for (let x = 5; x < 35; x++) { const t = (x - 5) / 30; p.p(x, y, t < 0.2 ? '#e8e2d4' : t < 0.55 ? '#cfc8b8' : t < 0.85 ? '#aaa296' : '#8f877c'); }
      for (let y = 26; y < 96; y += 9) p.r(5, y, 30, 1, '#7a7268');
      p.ell(20, 22, 15, 10, '#b64a3c'); p.r(5, 22, 30, 0, '#b64a3c'); p.ball(20, 18, 15, 9, '#c4473a', { seed: 2, noise: 0.05 });
      p.r(18, 6, 4, 4, '#8f877c'); p.r(8, 70, 24, 20, '#3a2c26'); p.r(8, 70, 24, 1, '#f5efe4');
      p.outline({ strength: 0.8 });
      return { c: p.c, ax: 20, ay: 99 };
    });
  }

  /* ---------- decorações ---------- */
  function deco(kind, a) {
    return memo('deco' + kind + a, () => {
      let p;
      switch (kind) {
        case 'well': p = new Px(32, 40); p.shadow(16, 36, 13, 3, 0.2); p.ball(16, 31, 12, 5, '#8f8a96', { seed: 2 }); p.r(4, 24, 24, 9, '#a8a2b0'); for (let y = 24; y < 33; y += 3) { p.r(4, y, 24, 1, '#6d6878'); for (let x = (y / 3) % 2 ? 4 : 9; x < 28; x += 10) p.r(x, y, 1, 3, '#6d6878'); } p.ell(16, 24, 11, 4, '#2c6aa8'); p.ell(16, 24, 8, 2, '#4a9ad8'); p.r(5, 8, 2, 18, '#7a5230'); p.r(25, 8, 2, 18, '#7a5230'); p.r(3, 5, 26, 4, '#b64a3c'); p.r(5, 3, 22, 3, '#c4573a'); p.r(8, 1, 16, 3, '#d4674a'); p.r(15, 9, 2, 8, '#5a3a22'); p.r(13, 16, 6, 4, '#8a6240'); p.outline(); return { c: p.c, ax: 16, ay: 39 };
        case 'lamp': p = new Px(16, 44); p.shadow(8, 41, 5, 2, 0.2); p.r(7, 10, 2, 31, '#4a4858'); p.r(7, 10, 1, 31, '#6a6878'); p.r(5, 38, 6, 3, '#3a3848'); p.r(4, 2, 8, 9, '#ffe9a0'); p.r(5, 3, 6, 7, '#fff7d8'); p.r(3, 1, 10, 2, '#3a3848'); p.r(3, 11, 10, 2, '#3a3848'); p.r(4, 2, 1, 9, '#6a6878'); p.r(11, 2, 1, 9, '#6a6878'); p.outline(); return { c: p.c, ax: 8, ay: 42 };
        case 'sign': p = new Px(20, 28); p.shadow(10, 25, 6, 2, 0.2); p.r(9, 10, 3, 16, '#7a5230'); p.r(9, 10, 1, 16, '#9a6e40'); p.r(2, 2, 16, 10, '#c8955a'); p.r(2, 2, 16, 1, '#e8b87a'); p.r(2, 11, 16, 1, '#7a5230'); p.r(4, 5, 12, 1, '#5a3a22'); p.r(4, 8, 9, 1, '#5a3a22'); p.outline(); return { c: p.c, ax: 10, ay: 26 };
        case 'bench': p = new Px(36, 24); p.shadow(18, 21, 15, 2, 0.2); p.r(3, 6, 30, 4, '#a97844'); p.r(3, 6, 30, 1, '#c8955a'); p.r(3, 11, 30, 4, '#a97844'); p.r(3, 11, 30, 1, '#c8955a'); p.r(4, 15, 3, 6, '#5a3a22'); p.r(29, 15, 3, 6, '#5a3a22'); p.r(5, 1, 2, 9, '#7a5230'); p.r(29, 1, 2, 9, '#7a5230'); p.outline(); return { c: p.c, ax: 18, ay: 22 };
        case 'mailbox': p = new Px(16, 28); p.shadow(8, 25, 5, 2, 0.2); p.r(7, 12, 2, 13, '#7a5230'); p.r(2, 4, 12, 9, '#4a7fc9'); p.r(2, 4, 12, 2, '#7aaae8'); p.r(3, 8, 10, 4, '#3a67a8'); p.r(11, 1, 2, 5, '#e8453a'); p.outline(); return { c: p.c, ax: 8, ay: 26 };
        case 'bin': p = new Px(32, 30); p.shadow(16, 27, 13, 3, 0.2); p.r(3, 10, 26, 16, '#a97844'); p.r(3, 10, 26, 2, '#c8955a'); for (let x = 3; x < 29; x += 6) p.r(x, 12, 1, 14, '#7a5230'); p.r(3, 14, 26, 2, '#6a6878'); p.r(3, 22, 26, 2, '#6a6878'); p.r(1, 6, 30, 6, '#b88049'); p.r(1, 6, 30, 1, '#d8a060'); p.r(4, 8, 24, 3, '#2c1b10'); p.outline(); return { c: p.c, ax: 16, ay: 28 };
        case 'chest': p = new Px(22, 22); p.shadow(11, 19, 8, 2, 0.2); const cc = a === 'big' ? ['#4a7fc9', '#7aaae8', '#2a4a88'] : ['#a97844', '#c8955a', '#6a4220']; p.r(2, 9, 18, 10, cc[0]); p.ell(11, 9, 9, 5, cc[0]); p.r(2, 4, 18, 5, cc[1]); p.ell(11, 5, 9, 3, cc[1]); p.r(2, 9, 18, 1, cc[2]); p.r(1, 9, 1, 10, '#8f8a96'); p.r(20, 9, 1, 10, '#8f8a96'); p.r(9, 8, 4, 5, '#ffd23f'); p.p(10, 10, '#8a5a10'); p.r(2, 18, 18, 1, cc[2]); p.outline(); return { c: p.c, ax: 11, ay: 20 };
        case 'chest_open': p = new Px(22, 26); p.shadow(11, 22, 8, 2, 0.2); p.r(2, 12, 18, 9, '#a97844'); p.r(2, 12, 18, 1, '#6a4220'); p.r(3, 13, 16, 3, '#2c1b10'); p.r(2, 3, 18, 6, '#c8955a'); p.r(2, 8, 18, 1, '#6a4220'); p.r(9, 12, 4, 4, '#ffd23f'); p.outline(); return { c: p.c, ax: 11, ay: 23 };
        case 'scarecrow': p = new Px(32, 40); p.shadow(16, 37, 6, 2, 0.2); p.r(15, 14, 2, 22, '#7a5230'); p.r(4, 18, 24, 2, '#7a5230'); p.r(9, 15, 14, 12, '#4a7fc9'); p.r(9, 15, 14, 2, '#7aaae8'); for (let x = 9; x < 23; x += 3) p.p(x, 24, '#3a67a8'); p.ball(16, 9, 5, 5, '#e8c86a', { seed: 3 }); p.p(14, 8, '#2b1d2e'); p.p(18, 8, '#2b1d2e'); p.r(15, 11, 3, 1, '#2b1d2e'); p.r(9, 5, 14, 2, '#c8955a'); p.r(11, 1, 10, 5, '#d8a560'); p.r(11, 4, 10, 1, '#b64a3c'); p.r(3, 19, 2, 3, '#e8c86a'); p.r(27, 19, 2, 3, '#e8c86a'); p.r(12, 27, 3, 5, '#e8c86a'); p.r(18, 27, 3, 5, '#e8c86a'); p.outline(); return { c: p.c, ax: 16, ay: 38 };
        case 'sprinkler': p = new Px(16, 24); p.shadow(8, 20, 4, 2, 0.15); const sc = a === 1 ? ['#e8943a', '#ffc070'] : ['#9aa0ad', '#d0d6e2']; p.r(7, 8, 2, 11, sc[0]); p.r(7, 8, 1, 11, sc[1]); p.r(4, 6, 8, 3, sc[0]); p.r(4, 6, 8, 1, sc[1]); p.p(5, 4, '#4a9ad8'); p.p(10, 4, '#4a9ad8'); p.r(5, 18, 6, 2, '#6d6878'); p.outline(); return { c: p.c, ax: 8, ay: 21 };
        case 'torch': p = new Px(12, 24); p.r(5, 10, 2, 12, '#7a5230'); p.r(4, 7, 4, 4, '#4a4858'); p.outline(); return { c: p.c, ax: 6, ay: 22 };
        case 'bridge': p = new Px(16, 16); p.r(0, 0, 16, 16, '#a97844'); for (let x = 0; x < 16; x += 4) { p.r(x, 0, 1, 16, '#6a4220'); p.r(x + 1, 0, 1, 16, '#c8955a'); } p.r(0, 0, 16, 2, '#5a3a22'); p.r(0, 14, 16, 2, '#5a3a22'); return { c: p.c, ax: 0, ay: 16 };
        case 'fountain': p = new Px(56, 56); p.shadow(28, 50, 24, 5, 0.22); p.ball(28, 40, 24, 10, '#a8a2b0', { seed: 1 }); p.ell(28, 38, 21, 8, '#2c6aa8'); p.ell(28, 38, 18, 6, '#4a9ad8'); p.r(25, 14, 6, 24, '#a8a2b0'); p.r(25, 14, 2, 24, '#cfcad6'); p.ball(28, 14, 8, 4, '#a8a2b0', { seed: 2 }); p.ell(28, 13, 6, 2, '#4a9ad8'); for (let i = 0; i < 10; i++) { p.p(28 + Math.sin(i) * 5, 4 + i, '#bde6ff'); } p.outline(); return { c: p.c, ax: 28, ay: 52 };
        case 'stall': p = new Px(48, 48); p.shadow(24, 44, 22, 4, 0.22); p.r(4, 12, 3, 32, '#7a5230'); p.r(41, 12, 3, 32, '#7a5230'); for (let x = 0; x < 48; x += 8) p.r(x, 4, 8, 12, (x / 8) % 2 ? '#ffffff' : '#c4473a'); p.r(0, 14, 48, 3, '#8a2a24'); p.r(4, 30, 40, 12, '#c8955a'); p.r(4, 30, 40, 2, '#e8b87a'); for (let i = 0; i < 6; i++) p.disc(8 + i * 6, 28, 2, ['#e8453a', '#f2c230', '#6fcf4a'][i % 3]); p.outline(); return { c: p.c, ax: 24, ay: 46 };
        case 'stairs_down': p = new Px(16, 16); p.r(0, 0, 16, 16, '#2c2640'); for (let i = 0; i < 4; i++) { p.r(1 + i, 1 + i * 3, 14 - i * 2, 3, ['#6a6188', '#5a5278', '#4a4263', '#3a3450'][i]); p.r(1 + i, 3 + i * 3, 14 - i * 2, 1, '#2c2640'); } return { c: p.c, ax: 0, ay: 16 };
        case 'stairs_up': p = new Px(16, 16); p.r(0, 0, 16, 16, '#5c5476'); for (let i = 0; i < 4; i++) { p.r(1 + (3 - i), 1 + i * 3, 14 - (3 - i) * 2, 3, ['#9a90bc', '#8a80ac', '#7a709c', '#6a608c'][i]); p.r(1 + (3 - i), 3 + i * 3, 14 - (3 - i) * 2, 1, '#2c2640'); } p.r(0, 0, 16, 1, '#2c2640'); return { c: p.c, ax: 0, ay: 16 };
        case 'ladder': p = new Px(16, 16); p.r(0, 0, 16, 16, '#3a3450'); p.ell(8, 8, 6, 6, '#16121f'); p.r(4, 6, 1, 8, '#a97844'); p.r(11, 6, 1, 8, '#a97844'); for (let y = 7; y < 14; y += 3) p.r(4, y, 8, 1, '#c8955a'); return { c: p.c, ax: 0, ay: 16 };
        case 'dock': p = new Px(16, 16); p.r(0, 0, 16, 16, '#9a6e40'); for (let y = 0; y < 16; y += 4) { p.r(0, y + 3, 16, 1, '#4a3020'); p.r(0, y, 16, 1, '#c8955a'); } p.r(0, 0, 1, 16, '#5a3a22'); p.r(15, 0, 1, 16, '#5a3a22'); return { c: p.c, ax: 0, ay: 16 };
        case 'rug': p = new Px(48, 32); p.r(0, 0, 48, 32, a || '#b64a3c'); p.r(2, 2, 44, 28, U.shade(a || '#b64a3c', 0.2)); p.r(4, 4, 40, 24, a || '#b64a3c'); for (let x = 6; x < 42; x += 6) { p.p(x, 8, '#f2e0a8'); p.p(x + 3, 16, '#f2e0a8'); p.p(x, 24, '#f2e0a8'); } for (let y = 0; y < 32; y += 3) { p.p(0, y, '#f2e0a8'); p.p(47, y, '#f2e0a8'); } return { c: p.c, ax: 0, ay: 32 };
      }
      return null;
    });
  }

  /* ---------- móveis de interior ---------- */
  function furn(kind, a) {
    return memo('furn' + kind + a, () => {
      let p;
      switch (kind) {
        case 'bed': p = new Px(32, 44); p.r(2, 2, 28, 40, '#7a5230'); p.r(2, 2, 28, 3, '#9a6e40'); p.r(4, 8, 24, 32, a || '#4a7fc9'); p.r(4, 8, 24, 3, U.shade(a || '#4a7fc9', 0.25)); p.r(4, 24, 24, 16, U.shade(a || '#4a7fc9', -0.12)); p.r(6, 10, 20, 10, '#f5efe4'); p.r(6, 10, 20, 2, '#fff'); p.r(6, 18, 20, 2, '#d8d0c0'); p.r(2, 40, 3, 4, '#5a3a22'); p.r(27, 40, 3, 4, '#5a3a22'); p.outline(); return { c: p.c, ax: 0, ay: 44 };
        case 'table': p = new Px(40, 32); p.shadow(20, 28, 17, 3, 0.2); p.r(3, 8, 34, 4, '#c8955a'); p.r(3, 8, 34, 1, '#e8b87a'); p.r(3, 12, 34, 2, '#8a5a30'); p.r(5, 14, 3, 12, '#6a4220'); p.r(32, 14, 3, 12, '#6a4220'); p.outline(); return { c: p.c, ax: 20, ay: 29 };
        case 'chair': p = new Px(16, 24); p.shadow(8, 21, 5, 2, 0.2); p.r(3, 2, 10, 12, '#a97844'); p.r(3, 2, 10, 1, '#c8955a'); p.r(2, 12, 12, 4, '#c8955a'); p.r(3, 16, 2, 5, '#6a4220'); p.r(11, 16, 2, 5, '#6a4220'); p.outline(); return { c: p.c, ax: 8, ay: 22 };
        case 'shelf': p = new Px(32, 48); p.r(1, 4, 30, 42, '#7a5230'); p.r(1, 4, 30, 2, '#9a6e40'); for (let r = 0; r < 3; r++) { const y = 8 + r * 12; p.r(3, y, 26, 10, '#4a3020'); p.r(3, y + 10, 26, 2, '#9a6e40'); for (let b = 0; b < 6; b++) { const bh = 6 + ((b * 7 + r) % 4); p.r(4 + b * 4, y + 10 - bh, 3, bh, ['#c4473a', '#4a7fc9', '#4faa3c', '#e8c36a', '#8a4aa8', '#e8943a'][(b + r * 2) % 6]); p.r(4 + b * 4, y + 10 - bh, 1, bh, 'rgba(255,255,255,0.3)'); } } p.outline(); return { c: p.c, ax: 0, ay: 47 };
        case 'counter': p = new Px(48, 36); p.r(0, 6, 48, 26, '#9a6e40'); p.r(0, 6, 48, 5, '#c8955a'); p.r(0, 6, 48, 1, '#e8b87a'); for (let x = 4; x < 48; x += 12) { p.r(x, 14, 8, 14, '#7a5230'); p.r(x + 1, 15, 6, 12, '#8a6240'); p.p(x + 6, 21, '#ffd23f'); } p.outline(); return { c: p.c, ax: 0, ay: 34 };
        case 'stove': p = new Px(32, 44); p.shadow(16, 41, 13, 2, 0.2); p.r(2, 14, 28, 26, '#6d6878'); p.r(2, 14, 28, 3, '#9a96a6'); p.r(5, 22, 22, 14, '#3a3848'); p.r(7, 24, 18, 10, '#1f1c2a'); p.r(6, 18, 4, 2, '#c4473a'); p.r(14, 18, 4, 2, '#4a7fc9'); p.r(22, 18, 4, 2, '#e8c36a'); p.r(6, 2, 20, 12, '#4a4858'); p.r(8, 4, 16, 8, '#6a6878'); p.r(12, 0, 8, 4, '#4a4858'); p.outline(); return { c: p.c, ax: 16, ay: 42 };
        case 'tv': p = new Px(32, 36); p.r(2, 14, 28, 18, '#7a5230'); p.r(2, 14, 28, 2, '#9a6e40'); p.r(6, 2, 20, 14, '#2a2a38'); p.r(8, 4, 16, 10, '#3a5a8a'); p.r(9, 5, 5, 3, '#8ac0ea'); p.r(14, 16, 4, 2, '#2a2a38'); p.outline(); return { c: p.c, ax: 16, ay: 33 };
        case 'plant': p = new Px(20, 30); p.r(5, 18, 10, 9, '#c4573a'); p.r(5, 18, 10, 2, '#e07a58'); p.r(4, 16, 12, 3, '#d4674a'); for (let i = 0; i < 5; i++) p.ball(10 + (i - 2) * 3, 10 - (i % 2) * 3, 4, 5, '#4faa3c', { seed: i }); p.outline(); return { c: p.c, ax: 10, ay: 28 };
        case 'window': p = new Px(24, 28); window_(p, null, 4, 4, 16, 16, false, a); p.outline(); return { c: p.c, ax: 0, ay: 28 };
        case 'painting': p = new Px(24, 20); p.r(0, 0, 24, 20, '#7a5230'); p.r(2, 2, 20, 16, '#8ec3e6'); p.r(2, 12, 20, 6, '#4faa3c'); p.ell(8, 12, 7, 4, '#3f9e3b'); p.disc(17, 6, 2, '#ffe14a'); return { c: p.c, ax: 0, ay: 20 };
        case 'barrel': p = new Px(20, 26); p.shadow(10, 23, 7, 2, 0.2); p.r(3, 4, 14, 18, '#a97844'); p.ell(10, 4, 7, 2, '#c8955a'); p.ell(10, 22, 7, 2, '#8a5a30'); for (const y of [7, 13, 19]) p.r(3, y, 14, 2, '#6d6878'); p.r(3, 4, 2, 18, '#c8955a'); p.outline(); return { c: p.c, ax: 10, ay: 24 };
        case 'fireplace': p = new Px(40, 44); p.r(2, 4, 36, 38, '#8f8a96'); for (let y = 4; y < 42; y += 5) { p.r(2, y, 36, 1, '#6d6878'); } p.r(2, 4, 36, 4, '#aaa6b4'); p.r(8, 16, 24, 26, '#1f1428'); p.r(10, 18, 20, 24, '#2f1e12'); p.r(0, 2, 40, 4, '#7a5230'); p.outline(); return { c: p.c, ax: 0, ay: 43 };
      }
      return null;
    });
  }

  /* ---------- máquinas de artesanato ---------- */
  function machine(kind, working) {
    return memo('mach' + kind + working, () => {
      const p = new Px(24, 30);
      p.shadow(12, 27, 9, 2, 0.2);
      switch (kind) {
        case 'furnace': p.r(3, 8, 18, 18, '#6d6878'); p.r(3, 8, 18, 3, '#9a96a6'); p.r(6, 14, 12, 10, '#1f1c2a'); p.r(8, 16, 8, 6, working ? '#ff8a2a' : '#2f2a3a'); if (working) { p.r(10, 18, 4, 3, '#ffd23f'); p.p(12, 17, '#fff'); } p.r(8, 0, 8, 9, '#4a4858'); p.r(8, 0, 8, 2, '#6a6878'); p.r(4, 25, 16, 1, '#3a3848'); break;
        case 'keg': p = new Px(24, 30); p.shadow(12, 27, 9, 2, 0.2); p.r(4, 6, 16, 20, '#a97844'); p.ell(12, 6, 8, 3, '#c8955a'); p.ell(12, 26, 8, 2, '#7a5230'); for (const y of [9, 16, 23]) p.r(4, y, 16, 2, '#6d6878'); p.r(4, 6, 2, 20, '#c8955a'); p.r(10, 14, 4, 4, working ? '#e8c36a' : '#4a3020'); p.r(11, 18, 2, 4, '#4a4858'); if (working) { p.p(12, 2, '#fff'); p.p(10, 0, '#fff'); } break;
        case 'jar': p = new Px(24, 30); p.shadow(12, 27, 9, 2, 0.2); p.r(4, 14, 16, 12, '#d8a560'); p.r(4, 14, 16, 2, '#f0c080'); p.r(6, 8, 12, 7, '#7a5230'); p.r(5, 4, 14, 5, '#b64a3c'); p.r(5, 4, 14, 1, '#e0726a'); p.r(7, 18, 10, 6, working ? '#e8453a' : '#ede0b8'); p.r(7, 18, 2, 6, 'rgba(255,255,255,0.4)'); break;
        case 'loom': p = new Px(24, 30); p.shadow(12, 27, 9, 2, 0.2); p.r(2, 4, 3, 22, '#7a5230'); p.r(19, 4, 3, 22, '#7a5230'); p.r(2, 4, 20, 3, '#9a6e40'); p.r(5, 8, 14, 12, working ? '#e8c36a' : '#d8d0c0'); for (let x = 6; x < 19; x += 2) p.r(x, 8, 1, 12, working ? '#c08a1a' : '#a8a090'); p.r(2, 22, 20, 3, '#6a4220'); break;
        case 'maker': p = new Px(24, 30); p.shadow(12, 27, 9, 2, 0.2); p.r(3, 10, 18, 16, '#b8805a'); p.r(3, 10, 18, 3, '#d8a070'); p.disc(12, 7, 5, '#9aa0ad'); p.disc(12, 7, 3, '#d0d6e2'); p.r(10, 16, 4, 8, working ? '#8ac0ea' : '#6a4a38'); p.r(5, 22, 14, 2, '#7a5230'); break;
        case 'bench': p = new Px(32, 30); p.shadow(16, 27, 13, 2, 0.2); p.r(2, 10, 28, 5, '#c8955a'); p.r(2, 10, 28, 1, '#e8b87a'); p.r(2, 15, 28, 2, '#8a5a30'); p.r(4, 17, 3, 9, '#6a4220'); p.r(25, 17, 3, 9, '#6a4220'); p.r(6, 6, 8, 4, '#9aa0ad'); p.r(5, 5, 3, 3, '#6d7381'); p.r(18, 4, 2, 7, '#7a5230'); p.r(16, 3, 6, 3, '#9aa0ad'); break;
        case 'hive': p = new Px(24, 30); p.shadow(12, 27, 9, 2, 0.2); p.r(4, 12, 16, 14, '#e8c36a'); p.r(4, 12, 16, 2, '#fff08a'); for (let y = 14; y < 26; y += 4) p.r(4, y + 2, 16, 1, '#b8903a'); p.r(2, 8, 20, 5, '#c8955a'); p.r(2, 8, 20, 1, '#e8b87a'); p.r(9, 20, 6, 3, '#3a2c26'); p.r(5, 26, 14, 2, '#7a5230'); if (working) { p.p(6, 4, '#2b1d2e'); p.p(7, 4, '#ffd23f'); p.p(18, 2, '#2b1d2e'); } break;
        case 'bomb': break;
      }
      p.outline();
      return { c: p.c, ax: 12, ay: 28 };
    });
  }

  function sprinklerHose() { return null; }
  function bigDecor(kind) { // hoje: pedras decorativas / chafariz / árvore de lanternas
    return memo('big' + kind, () => {
      const p = new Px(32, 44);
      p.shadow(16, 40, 12, 3, 0.2);
      if (kind === 'lanternTree') { p.r(14, 14, 4, 26, '#583a22'); p.r(14, 14, 1, 26, '#7a5230'); for (let i = 0; i < 5; i++) p.ball(16 + (i - 2) * 5, 10 + (i % 2) * 5, 6, 5, '#3f8a3a', { seed: i }); for (const [x, y] of [[6, 14], [26, 12], [16, 20], [10, 6], [22, 6]]) { p.r(x, y, 3, 5, '#ffe9a0'); p.p(x + 1, y + 1, '#fff'); } }
      p.outline(); return { c: p.c, ax: 16, ay: 42 };
    });
  }

  return { house, barn, silo, deco, furn, machine, bigDecor };
})();
