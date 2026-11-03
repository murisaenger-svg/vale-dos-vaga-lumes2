'use strict';
/* ============================================================
   Personagens, animais e monstros em pixel art (paramétricos).
   Sprites 20x28, âncora nos pés. 4 direções x 4 quadros de caminhada.
   dir: 0 baixo, 1 esquerda, 2 direita, 3 cima
   ============================================================ */
VV.Art.Chars = (() => {
  const U = VV.U, Px = VV.Px;
  const OX = 2, OY = 3, W = 20, H = 28;
  const cache = {};

  const SKINS = ['#fbd5b5', '#f2b98e', '#d99a6c', '#b9764c', '#8d5330', '#5f3720'];
  const HAIRS = ['#2b1c16', '#5a3520', '#8a5a2c', '#c78b3a', '#e8c56a', '#c9462c', '#7a4aa8', '#3c6fb0', '#d9d9e0', '#e07aa6'];
  const STYLES = ['curto', 'longo', 'coque', 'cacheado', 'espetado', 'rabo'];

  function draw(spec, dir, frame, mode) {
    const p = new Px(W, H);
    const R = (x, y, w, h, c) => p.r(OX + x, OY + y, w, h, c);
    const D = (x, y, c) => p.p(OX + x, OY + y, c);
    const s = spec;
    const skin = s.skin, skinS = U.shade(skin, -0.16);
    const hair = s.hair, hairH = U.shade(hair, 0.28), hairD = U.shade(hair, -0.25);
    const shirt = s.shirt, shirtS = U.shade(shirt, -0.2), shirtH = U.shade(shirt, 0.18);
    const pants = s.pants, pantsS = U.shade(pants, -0.22);
    const shoes = s.shoes || '#4a2e22';
    const kid = !!s.kid, ls = kid ? 3 : 0; // pernas mais curtas
    const walk = frame % 2 === 1;
    const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    const bob = walk ? 1 : 0;
    const dy = bob + (kid ? 2 : 0);
    const side = dir === 1 || dir === 2;
    const style = s.style || 'curto';
    const longHair = style === 'longo' || style === 'rabo';
    const useA = mode === 'use';

    // ---- cabelo traseiro (atrás do corpo) ----
    const backHair = () => {
      if (style === 'longo') { if (dir === 0) { R(2, 4 + dy, 12, 8, hairD); } else if (dir === 3) { R(2, 2 + dy, 12, 11, hair); R(3, 3 + dy, 2, 8, hairH); } else R(2, 3 + dy, 6, 9, hair); }
      if (style === 'rabo') { if (dir === 3) { R(7, 9 + dy, 3, 6, hair); R(7, 9 + dy, 1, 6, hairH); } if (side) { R(1, 5 + dy, 3, 7, hair); R(1, 5 + dy, 1, 7, hairH); } }
      if (style === 'cacheado') { R(2, 2 + dy, 12, 6, hairD); }
    };
    // ---- pernas ----
    const legY = 17 + dy - (bob ? 1 : 0) - (kid ? 0 : 0);
    const legs = () => {
      const top = 17 + dy - bob;
      const lh = 5 - ls + 0;
      if (side) {
        const fwd = step !== 0 ? step : 0;
        const ax = 5; // pernas de lado
        const l1 = ax + fwd * 2, l2 = ax - fwd * 2;
        R(l2 + 1, top, 4, lh, pantsS); R(l2 + 1, top + lh, 4, 2, U.shade(shoes, -0.15)); R(l2 + 4, top + lh + 1, 1, 1, U.shade(shoes, -0.15));
        R(l1 + 1, top, 4, lh, pants); R(l1 + 1, top + lh, 4, 2, shoes); R(l1 + 4, top + lh, 1, 2, U.shade(shoes, 0.15));
        R(l1 + 1, top, 1, lh, U.shade(pants, 0.12));
      } else {
        const lift = n => (step === n ? 1 : 0);
        if (s.skirt) {
          R(5, top + 2, 2, lh - 1, skin); R(9, top + 2, 2, lh - 1, skin);
          R(5, top + lh + 1 - lift(1), 3, 2, shoes); R(8, top + lh + 1 - lift(-1), 3, 2, shoes);
        } else {
          R(5, top, 3, lh - lift(1), pants); R(8, top, 3, lh - lift(-1), pants);
          R(5, top, 1, lh - lift(1), U.shade(pants, 0.12)); R(10, top, 1, lh - lift(-1), pantsS); R(8, top + 1, 1, lh - 1, pantsS);
          R(5, top + lh - lift(1), 3, 2, shoes); R(8, top + lh - lift(-1), 3, 2, shoes);
          R(5, top + lh - lift(1), 1, 2, U.shade(shoes, 0.18)); R(5, top + lh + 1 - lift(1), 3, 1, U.shade(shoes, -0.25)); R(8, top + lh + 1 - lift(-1), 3, 1, U.shade(shoes, -0.25));
        }
      }
    };
    // ---- tronco ----
    const torso = () => {
      const ty = 10 + dy - bob + (kid ? 0 : 1);
      const th = 7 - (kid ? 1 : 0);
      if (side) {
        R(5, ty, 6, th, shirt); R(5, ty, 6, 1, shirtH); R(5, ty + th - 1, 6, 1, shirtS);
        R(10, ty + 1, 1, th - 1, shirtS);
        if (s.apron) { R(8, ty + 1, 3, th, s.apron); }
        const swing = step === 0 ? 0 : -step;
        const ax = 6 + swing * 2;
        if (!useA) { R(ax, ty + 1, 3, 5, shirt); R(ax, ty + 1, 3, 1, shirtH); R(ax, ty + 6, 3, 1, skin); R(ax, ty + 3, 1, 3, shirtS); }
        else { R(8, ty + 2, 5, 3, shirt); R(12, ty + 2, 2, 3, skin); }
        if (s.skirt) R(4, ty + th, 8, 3, shirtS), R(4, ty + th, 8, 1, shirt);
      } else {
        R(4, ty, 8, th, shirt); R(4, ty, 8, 1, shirtH); R(4, ty + th - 1, 8, 1, shirtS); R(11, ty + 1, 1, th - 1, shirtS);
        if (dir === 0) { D(7, ty, skinS); D(8, ty, skinS); if (s.collar) { D(6, ty + 1, s.collar); D(9, ty + 1, s.collar); } }
        if (s.apron && dir === 0) { R(5, ty + 1, 6, th, s.apron); R(5, ty + 1, 6, 1, U.shade(s.apron, 0.2)); R(4, ty, 1, 1, s.apron); R(11, ty, 1, 1, s.apron); }
        const sa = step === 0 ? 0 : step, ay = ty + 1;
        const lyA = useA && dir === 0 ? 1 : sa, ryA = useA && dir === 0 ? 1 : -sa;
        if (dir === 3 && useA) { R(2, ay - 2, 2, 5, shirt); R(12, ay - 2, 2, 5, shirt); D(2, ay - 3, skin); D(13, ay - 3, skin); }
        else {
          R(2, ay + lyA, 2, 5, shirt); R(2, ay + lyA, 2, 1, shirtH); R(2, ay + lyA + 5, 2, 1, skin); D(2, ay + lyA + 3, shirtS);
          R(12, ay + ryA, 2, 5, shirt); R(12, ay + ryA, 2, 1, shirtH); R(12, ay + ryA + 5, 2, 1, skin); D(13, ay + ryA + 3, shirtS);
        }
        if (s.skirt) { R(3, ty + th, 10, 3, shirtS); R(3, ty + th, 10, 1, shirt); for (let x = 3; x < 13; x += 2) D(x, ty + th + 2, U.shade(shirtS, -0.15)); }
      }
    };
    // ---- cabeça ----
    const head = () => {
      const hy = dy - bob;
      R(4, 2 + hy, 8, 1, skin); R(3, 3 + hy, 10, 6, skin); R(4, 9 + hy, 8, 1, skin);
      R(3, 3 + hy, 1, 6, skin); R(12, 7 + hy, 1, 2, skinS); R(4, 9 + hy, 8, 1, skinS); R(5, 10 + hy, 6, 1, skinS);
      if (dir === 0) {
        const ey = 6 + hy;
        D(5, ey, U.shade(s.eye || '#2b1d2e', 0.1)); D(5, ey + 1, s.eye || '#2b1d2e'); D(10, ey, U.shade(s.eye || '#2b1d2e', 0.1)); D(10, ey + 1, s.eye || '#2b1d2e');
        D(5, ey, '#ffffff'); D(10, ey, '#ffffff'); D(5, ey + 1, s.eye || '#2b1d2e'); D(10, ey + 1, s.eye || '#2b1d2e');
        if (!s.noBlush) { D(4, ey + 2, '#f09a9a'); D(11, ey + 2, '#f09a9a'); }
        D(7, ey + 3, '#b05a52'); D(8, ey + 3, '#b05a52');
        if (s.beard) { R(4, 8 + hy, 8, 3, s.beard); D(7, 9 + hy, '#b05a52'); D(8, 9 + hy, '#b05a52'); R(4, 8 + hy, 8, 1, U.shade(s.beard, 0.18)); }
        if (s.glasses) { const g = s.glasses; R(4, 5 + hy, 3, 1, g); R(4, 8 + hy, 3, 1, g); D(4, 6 + hy, g); D(4, 7 + hy, g); D(6, 6 + hy, g); D(6, 7 + hy, g); R(9, 5 + hy, 3, 1, g); R(9, 8 + hy, 3, 1, g); D(9, 6 + hy, g); D(9, 7 + hy, g); D(11, 6 + hy, g); D(11, 7 + hy, g); D(7, 6 + hy, g); D(8, 6 + hy, g); }
      } else if (side) {
        D(13, 7 + hy, skin); D(13, 6 + hy, skin);
        const ey = 6 + hy;
        D(10, ey, '#ffffff'); D(10, ey + 1, s.eye || '#2b1d2e'); D(11, ey + 1, s.eye || '#2b1d2e'); D(11, ey, s.eye || '#2b1d2e');
        if (!s.noBlush) D(9, ey + 2, '#f09a9a');
        D(12, ey + 3, '#b05a52');
        D(7, 7 + hy, skinS);
        if (s.beard) { R(8, 8 + hy, 5, 3, s.beard); R(8, 8 + hy, 5, 1, U.shade(s.beard, 0.18)); }
        if (s.glasses) { R(9, 5 + hy, 4, 1, s.glasses); R(9, 8 + hy, 3, 1, s.glasses); D(9, 6 + hy, s.glasses); D(9, 7 + hy, s.glasses); D(12, 6 + hy, s.glasses); D(12, 7 + hy, s.glasses); }
      }
    };
    const hairFront = () => {
      const hy = dy - bob;
      if (s.hat === 'straw' && dir !== 4) { /* cabelo curto por baixo do chapéu */ }
      const topCap = () => {
        if (dir === 3) { R(3, 1 + hy, 10, 9, hair); R(4, 2 + hy, 3, 2, hairH); R(3, 8 + hy, 10, 1, hairD); if (longHair) R(3, 10 + hy, 10, 2, hair); return; }
        if (style === 'cacheado') { R(2, 0 + hy, 12, 5, hair); R(3, -1 + hy, 10, 2, hair); R(1, 2 + hy, 2, 5, hair); R(13, 2 + hy, 2, 5, hair); R(4, 0 + hy, 3, 1, hairH); R(3, 4 + hy, 10, 1, hairD); return; }
        R(4, 1 + hy, 8, 1, hair); R(3, 2 + hy, 10, 2, hair); R(4, 1 + hy, 3, 1, hairH); R(5, 2 + hy, 2, 1, hairH);
        if (dir === 0) { R(3, 4 + hy, 1, 4, hair); R(12, 4 + hy, 1, 4, hair); R(4, 4 + hy, 5, 1, hair); D(9, 4 + hy, hair); D(10, 4 + hy, hair); D(4, 5 + hy, hair); D(11, 4 + hy, hairD); }
        else { R(3, 4 + hy, 5, 5, hair); R(8, 4 + hy, 5, 1, hair); R(3, 8 + hy, 5, 1, hairD); D(8, 5 + hy, hair); }
      };
      topCap();
      if (style === 'coque') { p.disc(OX + 8, OY - 1 + hy, 2, hair); D(7, -2 + hy, hairH); }
      if (style === 'espetado') { for (const x of [4, 6, 8, 10, 12]) { D(x, 0 + hy, hair); if (x % 4 === 0) D(x, -1 + hy, hair); } }
      if (longHair && dir !== 3) { if (dir === 0) { R(2, 4 + hy, 2, 8, hair); R(12, 4 + hy, 2, 8, hair); R(2, 4 + hy, 1, 8, hairH); R(3, 11 + hy, 1, 1, hairD); R(12, 11 + hy, 1, 1, hairD); } }
      if (style === 'rabo' && dir === 0) { D(2, 4 + hy, hair); D(13, 4 + hy, hair); }
      // chapéus
      if (s.hat) {
        const hc = s.hatColor || '#e8c36a', hd = U.shade(hc, -0.25), hl = U.shade(hc, 0.25);
        if (s.hat === 'straw') { R(4, 0 + hy, 8, 3, hc); R(4, 0 + hy, 8, 1, hl); R(4, 2 + hy, 8, 1, s.band || '#c24a3a'); R(0, 3 + hy, 16, 1, hc); R(1, 4 + hy, 14, 1, hd); R(1, 3 + hy, 14, 1, hl); R(2, 3 + hy, 1, 1, hc); }
        else if (s.hat === 'cap') { R(3, 0 + hy, 10, 4, hc); R(3, 0 + hy, 10, 1, hl); R(3, 3 + hy, 10, 1, hd); if (dir === 0) R(3, 4 + hy, 10, 1, hd); else if (side) R(dir === 2 ? 9 : 3, 3 + hy, 6, 1, hd); }
        else if (s.hat === 'beanie') { R(3, 0 + hy, 10, 4, hc); R(3, 3 + hy, 10, 1, hd); R(3, 0 + hy, 10, 1, hl); D(7, -1 + hy, hl); D(8, -1 + hy, hl); for (let x = 4; x < 12; x += 2) D(x, 1 + hy, hd); }
        else if (s.hat === 'helmet') { R(3, 0 + hy, 10, 5, '#9aa0ad'); R(3, 0 + hy, 10, 1, '#d0d6e2'); R(3, 4 + hy, 10, 1, '#6d7381'); D(7, -1 + hy, '#c9453a'); D(8, -1 + hy, '#c9453a'); if (dir === 0) { R(7, 5 + hy, 2, 3, '#9aa0ad'); } }
        else if (s.hat === 'bandana') { R(3, 1 + hy, 10, 3, hc); R(3, 1 + hy, 10, 1, hl); R(3, 3 + hy, 10, 1, hd); if (dir === 3 || side) { R(12 - (dir === 2 ? 0 : 9), 3 + hy, 2, 4, hc); } }
      }
    };
    // ordem de desenho
    if (dir === 3) { backHair(); legs(); torso(); head(); hairFront(); }
    else { backHair(); legs(); torso(); head(); hairFront(); }
    p.outline({ strength: 0.8 });
    return p;
  }

  function sheet(spec) {
    const key = JSON.stringify(spec);
    if (cache[key]) return cache[key];
    const frames = [[], [], [], []];
    for (let d = 0; d < 4; d++) {
      for (let f = 0; f < 4; f++) {
        if (d === 1) continue;
        frames[d][f] = draw(spec, d === 1 ? 2 : d, f, 'walk').c;
      }
    }
    // esquerda = espelho da direita
    for (let f = 0; f < 4; f++) frames[1][f] = draw(spec, 2, f, 'walk').flipX().c;
    const use = [];
    for (let d = 0; d < 4; d++) use[d] = d === 1 ? draw(spec, 2, 0, 'use').flipX().c : draw(spec, d, 0, 'use').c;
    return (cache[key] = { frames, use, ax: 10, ay: 27 });
  }
  function portrait(spec) {
    const key = 'p' + JSON.stringify(spec);
    if (cache[key]) return cache[key];
    const src = draw(spec, 0, 0, 'walk');
    const p = new Px(20, 18);
    p.x.drawImage(src.c, 0, 0, 20, 18, 0, 0, 20, 18);
    return (cache[key] = p.url());
  }

  /* ---------- animais ---------- */
  function chicken(color, dir, frame, baby) {
    const key = `ch${color}${dir}${frame}${baby}`;
    if (cache[key]) return cache[key];
    const p = new Px(16, 16);
    const body = baby ? '#ffe26a' : color === 'brown' ? '#b9703a' : '#f5f1e6';
    const sc = baby ? 0 : 1;
    p.shadow(8, 13, baby ? 3 : 5, 2, 0.2);
    if (baby) { p.ball(8, 10, 3, 3, body, { seed: 1 }); p.ball(11, 8, 2, 2, body, { seed: 2 }); p.p(13, 8, '#f08a2a'); p.p(11, 7, '#2b1d2e'); p.p(7, 13, '#f08a2a'); p.p(9, 13, '#f08a2a'); }
    else {
      p.ball(7, 9, 5, 4, body, { seed: 1 });
      p.ball(12, 5, 3, 3, body, { seed: 2 });
      p.r(11, 1, 2, 2, '#d8392d'); p.p(12, 0, '#d8392d'); p.r(14, 6, 2, 1, '#f0a02a'); p.p(14, 7, '#d8392d'); p.p(12, 4, '#2b1d2e');
      p.line(3, 8, 1, 6, U.shade(body, -0.1)); p.line(3, 9, 1, 8, U.shade(body, -0.2));
      p.ell(6, 9, 3, 2, U.shade(body, -0.12));
      const l = frame ? 1 : 0;
      p.r(6 + l, 13, 1, 2, '#e8982c'); p.r(9 - l, 13, 1, 2, '#e8982c'); p.p(5 + l, 14, '#e8982c'); p.p(8 - l, 14, '#e8982c');
    }
    p.outline();
    const out = dir === 1 ? p.flipX() : p;
    return (cache[key] = { c: out.c, ax: 8, ay: 15 });
  }
  function cow(pattern, dir, frame) {
    const key = `cow${pattern}${dir}${frame}`;
    if (cache[key]) return cache[key];
    const p = new Px(34, 26);
    const body = pattern === 'brown' ? '#b9783e' : '#f6f2ea', spot = pattern === 'brown' ? '#7a4a22' : '#35303a';
    p.shadow(16, 22, 13, 3, 0.22);
    const l = frame ? 1 : 0;
    p.r(7, 17, 3, 5 - l, '#8a8590'); p.r(12 + l, 17, 3, 5, '#6e6a76'); p.r(20, 17, 3, 5 - (1 - l), '#8a8590'); p.r(25 - l, 17, 3, 5, '#6e6a76');
    p.r(7, 21 - l, 3, 1, '#3a2c26'); p.r(20, 21 - (1 - l), 3, 1, '#3a2c26');
    p.ball(15, 12, 11, 6, body, { seed: 3, noise: 0.1 });
    p.ell(11, 10, 3, 2, spot); p.ell(20, 13, 3, 2, spot); p.p(17, 8, spot); p.p(18, 8, spot);
    p.ball(27, 8, 5, 5, body, { seed: 4, noise: 0.1 });
    p.r(26, 11, 6, 3, '#f0b4b0'); p.p(28, 12, '#c47a78'); p.p(30, 12, '#c47a78');
    p.r(24, 3, 2, 2, '#e8dcc0'); p.r(30, 3, 2, 2, '#e8dcc0'); p.p(26, 7, '#2b1d2e'); p.p(24, 5, '#e0a4a0'); p.ell(25, 6, 2, 2, spot);
    p.line(4, 10, 2, 16, '#35303a'); p.p(2, 17, '#35303a'); p.p(1, 17, '#35303a');
    p.ell(13, 16, 3, 2, '#f0b4b0');
    p.outline();
    const out = dir === 1 ? p.flipX() : p;
    return (cache[key] = { c: out.c, ax: 17, ay: 23 });
  }

  /* ---------- monstros ---------- */
  function slime(color, frame) {
    const key = `sl${color}${frame}`;
    if (cache[key]) return cache[key];
    const p = new Px(20, 18), f = frame;
    const w = f ? 7 : 8, h = f ? 6 : 5, cy = f ? 11 : 10;
    p.shadow(10, 15, 8, 2, 0.2);
    p.ball(10, cy, w, h, color, { seed: 5, noise: 0.08, hi: 0.5 });
    p.r(10 - w, cy + h - 1, w * 2 + 1, 2, U.shade(color, -0.12));
    p.r(6, cy - 2, 2, 3, '#ffffff'); p.r(12, cy - 2, 2, 3, '#ffffff'); p.p(7, cy - 1, '#2b1d2e'); p.p(7, cy, '#2b1d2e'); p.p(13, cy - 1, '#2b1d2e'); p.p(13, cy, '#2b1d2e');
    p.p(9, cy + 2, '#2b1d2e'); p.p(10, cy + 2, '#2b1d2e');
    p.p(6, cy - h + 1, U.shade(color, 0.6)); p.p(7, cy - h + 1, U.shade(color, 0.6));
    p.outline({ strength: 0.75 });
    return (cache[key] = { c: p.c, ax: 10, ay: 16 });
  }
  function bat(frame, color) {
    const key = `bat${frame}${color}`;
    if (cache[key]) return cache[key];
    const p = new Px(22, 16), c = color || '#5a4a78', cd = U.shade(c, -0.3), cl = U.shade(c, 0.25);
    p.shadow(11, 14, 5, 1, 0.12);
    p.ball(11, 8, 3, 3, c, { seed: 2 });
    p.p(8, 4, c); p.p(8, 3, c); p.p(14, 4, c); p.p(14, 3, c);
    if (frame) { p.line(8, 7, 1, 3, c); p.line(8, 8, 1, 6, cd); p.line(8, 9, 3, 10, cd); p.line(14, 7, 21, 3, c); p.line(14, 8, 21, 6, cd); p.line(14, 9, 19, 10, cd); p.r(2, 4, 6, 3, cd); p.r(14, 4, 6, 3, cd); }
    else { p.line(8, 8, 1, 10, c); p.line(8, 9, 1, 13, cd); p.line(14, 8, 21, 10, c); p.line(14, 9, 21, 13, cd); p.r(2, 10, 6, 2, cd); p.r(14, 10, 6, 2, cd); }
    p.p(9, 7, '#ff5a5a'); p.p(13, 7, '#ff5a5a'); p.p(10, 10, '#fff'); p.p(12, 10, '#fff');
    p.outline({ strength: 0.75 });
    return (cache[key] = { c: p.c, ax: 11, ay: 12 });
  }
  function golem(frame, color) {
    const key = `gol${frame}${color}`;
    if (cache[key]) return cache[key];
    const p = new Px(30, 32), c = color || '#8a8494', l = frame ? 1 : 0;
    p.shadow(15, 28, 11, 3, 0.25);
    p.ball(15, 11, 6, 5, U.shade(c, 0.05), { seed: 1 });
    p.ball(15, 20, 10, 7, c, { seed: 2 });
    p.ball(5, 20 + l, 4, 5, U.shade(c, -0.05), { seed: 3 }); p.ball(25, 20 - l, 4, 5, U.shade(c, -0.05), { seed: 4 });
    p.r(9, 25, 5, 4, U.shade(c, -0.2)); p.r(17, 25, 5, 4, U.shade(c, -0.2));
    p.r(11, 9, 3, 2, '#ffb02a'); p.r(17, 9, 3, 2, '#ffb02a'); p.p(12, 9, '#fff2a0'); p.p(18, 9, '#fff2a0');
    for (const [x, y] of [[12, 18], [18, 22], [14, 24]]) { p.p(x, y, '#5a8f4a'); p.p(x + 1, y, '#76ad5e'); }
    p.outline({ strength: 0.8 });
    return (cache[key] = { c: p.c, ax: 15, ay: 29 });
  }
  function wisp(frame) {
    const key = 'wisp' + frame;
    if (cache[key]) return cache[key];
    const p = new Px(20, 24);
    const a = frame ? 1 : 0;
    p.ball(10, 10, 6, 7, '#9fe8ff', { seed: 7, hi: 0.6, noise: 0.05 });
    for (let i = 0; i < 4; i++) { p.p(6 + i * 2, 17 + ((i + a) % 2) * 2, '#9fe8ff'); p.p(6 + i * 2, 18 + ((i + a) % 2), '#6fc8ee'); }
    p.r(7, 8, 2, 3, '#1c2d4a'); p.r(12, 8, 2, 3, '#1c2d4a'); p.p(10, 13, '#1c2d4a'); p.p(11, 13, '#1c2d4a');
    p.outline({ strength: 0.6, tint: [30, 60, 110] });
    return (cache[key] = { c: p.c, ax: 10, ay: 20 });
  }
  function firefly(frame) { // espírito Lumi
    const key = 'lumi' + frame;
    if (cache[key]) return cache[key];
    const p = new Px(24, 24), a = frame % 2;
    p.ell(7, 8 - a, 4, 5, '#cde9ff'); p.ell(17, 8 - a, 4, 5, '#cde9ff'); p.ell(7, 8 - a, 2, 3, '#ffffff'); p.ell(17, 8 - a, 2, 3, '#ffffff');
    p.ball(12, 13, 3, 5, '#5a3a62', { seed: 3 });
    p.ball(12, 17, 3, 3, '#ffe66a', { seed: 5, hi: 0.7, noise: 0.03 }); p.p(12, 18, '#ffffff');
    p.p(11, 10, '#ffffff'); p.p(13, 10, '#ffffff'); p.p(10, 5, '#5a3a62'); p.p(14, 5, '#5a3a62'); p.p(9, 4, '#5a3a62'); p.p(15, 4, '#5a3a62');
    p.outline({ strength: 0.6 });
    return (cache[key] = { c: p.c, ax: 12, ay: 21 });
  }

  const CHEF = { skin: '#f2b98e', hair: '#2b1c16', style: 'curto', shirt: '#4a7fc9', pants: '#6a5a8a', shoes: '#4a2e22' };
  return { SKINS, HAIRS, STYLES, sheet, portrait, chicken, cow, slime, bat, golem, wisp, firefly, W, H, CHEF };
})();
