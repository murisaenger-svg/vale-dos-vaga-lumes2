'use strict';
/* ============================================================
   Sprites especiais: Lanternário (evolui com a restauração),
   entrada da mina, estufa, guilda, barco, plantas decorativas.
   ============================================================ */
VV.Art.Special = (() => {
  const U = VV.U, Px = VV.Px;
  const cache = {};
  const memo = (k, f) => cache[k] || (cache[k] = f());

  // level: 0..6 salas restauradas
  function tower(level) {
    return memo('tower' + level, () => {
      const W = 96, H = 160, p = new Px(W, H), g = new Px(W, H);
      p.shadow(48, H - 3, 40, 5, 0.25);
      const stone = '#9a94a8', lt = '#bcb6cc', dk = '#6e6880', dd = '#4a4560';
      const baseW = 64, topW = 46;
      // corpo da torre (levemente afunilado)
      for (let y = 40; y < H - 6; y++) {
        const t = (y - 40) / (H - 46), w = Math.round(U.lerp(topW, baseW, t)), x0 = Math.round(48 - w / 2);
        for (let x = 0; x < w; x++) {
          const u = x / w;
          let c = u < 0.18 ? lt : u < 0.62 ? stone : u < 0.86 ? dk : dd;
          const n = U.hash2(x, y, 3);
          if (n > 0.93) c = U.shade(c, 0.16); else if (n < 0.06) c = U.shade(c, -0.16);
          if ((y % 8) === 0) c = U.shade(c, -0.22);
          else if (((x + (((y / 8) | 0) % 2) * 6) % 12) === 0) c = U.shade(c, -0.18);
          p.p(x0 + x, y, c);
        }
      }
      // base
      p.r(14, H - 14, 68, 8, dk); p.r(14, H - 14, 68, 2, lt); p.r(12, H - 6, 72, 4, dd);
      // sala da lanterna (topo)
      p.r(20, 24, 56, 18, dk); p.r(20, 24, 56, 2, lt); p.r(18, 40, 60, 4, lt); p.r(18, 43, 60, 2, dd);
      const lit = level >= 6;
      p.r(26, 28, 44, 12, lit ? '#fff2b0' : '#1c1830');
      for (let x = 26; x < 70; x += 11) p.r(x, 28, 2, 12, dk);
      if (lit) { p.r(34, 30, 28, 8, '#ffffff'); g.r(0, 0, W, 60, 'rgba(255,240,170,0.22)'); g.ell(48, 34, 46, 30, 'rgba(255,240,170,0.4)'); g.ell(48, 34, 28, 18, 'rgba(255,248,210,0.6)'); }
      // telhado cônico
      for (let i = 0; i < 26; i++) { const w = Math.round(64 - i * 2.2); p.r(48 - w / 2, 24 - i, w, 1, i % 3 === 0 ? '#c4473a' : i % 3 === 1 ? '#a83a30' : '#8a2e26'); }
      p.r(46, 0, 4, 6, '#7a5230'); p.p(48, 0, '#ffd23f');
      p.r(47, -1 + 2, 2, 2, '#ffd23f');
      // janelas: cada sala restaurada acende uma
      const wins = [[22, 126], [66, 126], [30, 98], [58, 98], [38, 70], [50, 70]];
      wins.forEach((w, i) => {
        const on = i < level;
        p.r(w[0] - 1, w[1] - 1, 12, 18, dd); p.r(w[0], w[1], 10, 16, on ? '#ffe9a0' : '#1c1830');
        p.r(w[0], w[1] - 3, 10, 3, dk); p.r(w[0] + 1, w[1] - 4, 8, 1, dk);
        if (on) { p.r(w[0] + 4, w[1], 2, 16, '#c88a3a'); p.r(w[0], w[1] + 7, 10, 1, '#c88a3a'); g.r(w[0] - 6, w[1] - 6, 22, 28, 'rgba(255,215,120,0.35)'); g.r(w[0] - 2, w[1] - 2, 14, 20, 'rgba(255,232,150,0.7)'); }
        else { p.p(w[0] + 2, w[1] + 3, '#3a3458'); p.line(w[0], w[1] + 5, w[0] + 6, w[1] + 12, '#3a3458'); }
      });
      // porta
      p.r(46, H - 38, 20, 32, dd); p.ell(56, H - 38, 10, 6, dd); p.r(48, H - 36, 16, 30, '#6a4a30'); p.ell(56, H - 36, 8, 5, '#6a4a30');
      p.r(55, H - 36, 2, 30, '#4a3220'); p.p(60, H - 22, '#ffd23f');
      p.r(42, H - 8, 28, 3, dk);
      // rachaduras e trepadeiras (diminuem com restauração)
      const ruin = 6 - level;
      for (let i = 0; i < ruin * 3; i++) { const cx = 20 + U.hash2(i, 5, 2) * 56, cy = 50 + U.hash2(i, 6, 2) * 90; p.line(cx, cy, cx + 4 * (U.hash2(i, 7, 2) - 0.5) * 2, cy + 8, dd); }
      for (let i = 0; i < ruin * 6; i++) {
        const side = i % 2 ? 1 : 0, vx = side ? 70 - (i % 3) * 2 : 24 + (i % 3) * 2, vy0 = 50 + ((i * 17) % 90);
        for (let k = 0; k < 8 + (i % 6); k++) { p.p(vx + Math.round(Math.sin(k) * 2), vy0 + k, '#3f8a3a'); if (k % 3 === 0) p.p(vx + 2 + Math.round(Math.sin(k) * 2), vy0 + k, '#5fb04a'); }
      }
      if (level >= 3) for (let i = 0; i < 10; i++) { p.p(18 + i * 6, H - 15, '#ff7aa6'); p.p(18 + i * 6, H - 14, '#4fa83a'); }
      p.outline({ strength: 0.8 });
      return { c: p.c, glow: g.c, ax: 0, ay: H, w: 6, h: 10, doorTx: 3 };
    });
  }

  function mineEntrance() {
    return memo('mine', () => {
      const W = 64, H = 56, p = new Px(W, H);
      p.shadow(32, H - 2, 28, 4, 0.2);
      for (let y = 6; y < H - 2; y++) for (let x = 0; x < W; x++) {
        const dx = (x - 32) / 32, top = 6 + Math.abs(dx) * 14 - 6;
        if (y < top) continue;
        const n = U.hash2(x, y, 6);
        let c = '#7a7488'; if (n > 0.85) c = '#9a94a8'; else if (n < 0.15) c = '#5a5470';
        if (x < 10) c = U.shade(c, 0.12); if (x > 52) c = U.shade(c, -0.15);
        p.p(x, y, c);
      }
      p.ell(32, 22, 24, 14, '#8a8498');
      // boca da caverna
      p.ell(32, 36, 14, 16, '#1c1628'); p.r(18, 36, 28, 18, '#1c1628'); p.ell(32, 40, 10, 12, '#0e0a16');
      // vigas
      p.r(15, 22, 3, 32, '#7a5230'); p.r(46, 22, 3, 32, '#7a5230'); p.r(14, 20, 36, 4, '#9a6e40'); p.r(14, 20, 36, 1, '#c8955a');
      p.r(24, 12, 16, 7, '#c8955a'); p.r(24, 12, 16, 1, '#e8b87a'); p.r(26, 15, 12, 1, '#5a3a22'); p.p(30, 14, '#5a3a22'); p.p(33, 14, '#5a3a22');
      p.r(10, H - 6, 44, 3, '#6e6880');
      p.outline({ strength: 0.8 });
      return { c: p.c, ax: 0, ay: H, w: 4, h: 4, doorTx: 1 };
    });
  }

  function greenhouse(built) {
    return memo('gh' + built, () => {
      const W = 112, H = 96, p = new Px(W, H), g = new Px(W, H);
      p.shadow(56, H - 3, 50, 5, 0.22);
      p.r(4, H - 8, W - 8, 8, '#8f8a96'); p.r(4, H - 8, W - 8, 2, '#aaa6b4');
      const frame = built ? '#e8e4f0' : '#7a5a42', glass = built ? 'rgba(180,230,255,0.75)' : 'rgba(110,130,140,0.5)';
      // paredes
      p.r(6, 36, W - 12, H - 44, built ? '#bfe6f2' : '#5a6a72');
      for (let x = 6; x < W - 6; x += 2) for (let y = 38; y < H - 10; y += 2) if ((x + y) % 4 === 0) p.p(x, y, built ? '#e8fbff' : '#7a8a92');
      // telhado triangular
      for (let i = 0; i < 34; i++) { const w = W - 8 - i * 2.8; p.r(W / 2 - w / 2, 36 - i, w, 1, built ? '#cdeef8' : '#6a7a82'); }
      for (let i = 0; i < 34; i++) { const w = W - 8 - i * 2.8; p.p(W / 2 - w / 2, 36 - i, frame); p.p(W / 2 + w / 2 - 1, 36 - i, frame); }
      for (let x = 6; x < W - 6; x += 16) p.r(x, 36, 2, H - 44, frame);
      p.r(6, 36, W - 12, 2, frame); p.r(6, H - 12, W - 12, 3, frame);
      p.r(W / 2 - 1, 2, 2, 34, frame);
      if (built) { for (let x = 12; x < W - 12; x += 16) { p.r(x, 52, 10, 28, '#4fa83a'); p.disc(x + 5, 56, 4, '#6fcf4a'); p.disc(x + 5, 70, 4, '#ff7aa6'); } g.ell(56, 56, 50, 30, 'rgba(200,255,200,0.14)'); }
      else { for (let i = 0; i < 12; i++) { const cx = 10 + U.hash2(i, 1, 9) * 92, cy = 40 + U.hash2(i, 2, 9) * 40; p.line(cx, cy, cx + 6, cy + 8, '#2a3a40'); } p.r(30, 60, 14, 4, '#4a5a3a'); }
      p.r(W / 2 - 9, H - 30, 18, 24, frame); p.r(W / 2 - 7, H - 28, 14, 22, built ? '#bfe6f2' : '#4a5a62'); p.r(W / 2, H - 28, 1, 22, frame);
      p.outline({ strength: 0.75 });
      return { c: p.c, glow: g.c, ax: 0, ay: H, w: 7, h: 6, doorTx: 3 };
    });
  }

  function guild() {
    return memo('guild', () => {
      const W = 112, H = 96, p = new Px(W, H), g = new Px(W, H);
      p.shadow(56, H - 3, 50, 5, 0.22);
      // paredes de pedra
      p.r(4, 44, W - 8, 46, '#8e8a98');
      for (let y = 44; y < 90; y += 6) { p.r(4, y, W - 8, 1, '#6e6880'); for (let x = ((y - 44) / 6 % 2) * 6 + 4; x < W - 4; x += 12) p.r(x, y, 1, 6, '#6e6880'); }
      for (let i = 0; i < 40; i++) p.p(4 + U.hash2(i, 1, 4) * 104, 44 + U.hash2(i, 2, 4) * 46, '#aaa6b4');
      // telhado cinza-azulado com bandeiras
      for (let i = 0; i < 44; i++) { const w = W - i * 1.5; p.r(W / 2 - w / 2, 48 - i, w, 1, i % 5 === 0 ? '#4a5a7a' : i % 2 ? '#5a6a8a' : '#52627f'); }
      p.r(0, 46, W, 4, '#3a4a6a'); p.r(0, 44, W, 2, '#6a7a9a');
      // bandeira
      p.r(54, 0, 2, 20, '#4a3a2a'); p.r(56, 2, 14, 8, '#c4473a'); p.r(56, 2, 14, 1, '#e0726a'); p.p(62, 6, '#fff');
      // porta dupla
      p.r(46, H - 36, 20, 34, '#3a2c26'); p.r(48, H - 34, 8, 32, '#7a5230'); p.r(56, H - 34, 8, 32, '#7a5230'); p.r(55, H - 34, 2, 32, '#3a2c26'); p.p(54, H - 18, '#ffd23f'); p.p(58, H - 18, '#ffd23f');
      for (const wx of [14, 88]) { p.r(wx - 1, 56, 14, 18, '#4a3a2a'); p.r(wx, 57, 12, 16, '#ffe0a0'); g.r(wx - 6, 52, 26, 28, 'rgba(255,215,120,0.35)'); g.r(wx, 57, 12, 16, 'rgba(255,232,150,0.8)'); p.r(wx + 5, 57, 2, 16, '#6a4a30'); p.r(wx, 64, 12, 2, '#6a4a30'); }
      // escudo e espadas acima da porta
      p.r(52, 54, 12, 14, '#4a7fc9'); p.r(52, 54, 12, 2, '#7aaae8'); p.line(48, 52, 68, 72, '#d0d6e2'); p.line(68, 52, 48, 72, '#d0d6e2'); p.r(55, 58, 6, 6, '#ffd23f');
      p.r(4, H - 5, W - 8, 4, '#6e6880');
      p.outline({ strength: 0.8 });
      return { c: p.c, glow: g.c, ax: 0, ay: H, w: 7, h: 6, doorTx: 3 };
    });
  }

  function boat() {
    return memo('boat', () => {
      const p = new Px(56, 36);
      p.shadow(28, 30, 24, 3, 0.2);
      for (let y = 0; y < 14; y++) { const w = Math.round(50 - Math.abs(y - 4) * 1.4 - (y > 8 ? (y - 8) * 3 : 0)); p.r(28 - w / 2, 14 + y, w, 1, y < 2 ? '#c8955a' : y < 8 ? '#8a5a30' : '#6a4220'); }
      p.r(6, 14, 44, 2, '#c8955a'); p.r(26, 0, 2, 16, '#5a3a22'); p.r(28, 2, 12, 9, '#f5efe4'); p.line(28, 2, 40, 11, '#d8d0c0'); p.r(10, 22, 36, 1, '#5a3a22');
      p.outline(); return { c: p.c, ax: 28, ay: 32 };
    });
  }

  function cabin(kind) { // cabana de pescador
    return memo('cabin' + kind, () => {
      const W = 80, H = 64, p = new Px(W, H), g = new Px(W, H);
      p.shadow(40, H - 3, 34, 4, 0.22);
      p.r(4, 26, W - 8, 34, '#b98a55');
      for (let x = 4; x < W - 4; x += 5) { p.r(x, 26, 1, 34, '#8a5a30'); p.r(x + 1, 26, 1, 34, '#d0a068'); }
      for (let i = 0; i < 14; i++) { const w = W - 2 - i * 2; p.r(W / 2 - w / 2, 28 - i, w, 1, i % 3 === 0 ? '#5a8a8a' : i % 3 === 1 ? '#4a7a7a' : '#3a6a6a'); }
      p.r(0, 26, W, 4, '#2a5a5a'); p.r(0, 25, W, 1, '#7aaaaa');
      p.r(32, H - 30, 16, 28, '#3a2c26'); p.r(34, H - 28, 12, 26, '#6a8a8a'); p.p(43, H - 15, '#ffd23f');
      p.r(10, 38, 14, 12, '#4a3a2a'); p.r(11, 39, 12, 10, '#ffe0a0'); g.r(4, 32, 26, 24, 'rgba(255,215,120,0.35)'); g.r(11, 39, 12, 10, 'rgba(255,232,150,0.8)'); p.r(16, 39, 1, 10, '#6a4a30');
      p.r(60, 12, 6, 10, '#8a6a5a'); p.r(59, 10, 8, 3, '#6a4a3e');
      p.r(4, H - 5, W - 8, 4, '#8f8a96');
      // rede e boias
      p.disc(66, 44, 3, '#e8453a'); p.disc(66, 44, 1, '#fff'); p.disc(70, 48, 3, '#f2c230');
      p.outline({ strength: 0.8 });
      return { c: p.c, glow: g.c, ax: 0, ay: H, w: 5, h: 4, doorTx: 2 };
    });
  }

  function lanternPost() { // poste com lanterna de papel (festival)
    return memo('lp', () => {
      const p = new Px(16, 44); p.shadow(8, 41, 5, 2, 0.2);
      p.r(7, 8, 2, 33, '#5a3a22');
      p.ell(8, 12, 5, 6, '#ff6a4a'); p.ell(8, 12, 3, 4, '#ffb070'); p.r(5, 6, 6, 1, '#3a2418'); p.r(5, 18, 6, 1, '#3a2418');
      p.outline(); return { c: p.c, ax: 8, ay: 42 };
    });
  }

  function crystal(kind) { // cristais de cena
    return memo('cr' + kind, () => {
      const p = new Px(20, 28); p.shadow(10, 25, 7, 2, 0.2);
      const c = kind || '#74e6ff';
      p.line(10, 24, 10, 6, c); p.line(9, 24, 9, 8, U.shade(c, 0.3)); p.line(11, 24, 11, 8, U.shade(c, -0.25)); p.r(9, 6, 3, 4, c);
      p.line(5, 24, 5, 14, c); p.r(4, 14, 3, 4, U.shade(c, 0.1)); p.line(15, 24, 15, 12, c); p.r(14, 12, 3, 4, U.shade(c, -0.1));
      p.p(9, 7, '#fff'); p.p(4, 15, '#fff'); p.p(14, 13, '#fff');
      p.outline({ strength: 0.6, tint: [20, 60, 100] }); return { c: p.c, ax: 10, ay: 26 };
    });
  }

  function dog(frame, color) {
    return memo('dog' + frame + color, () => {
      const p = new Px(24, 20), b = color || '#c8905a', d = U.shade(b, -0.25), l = U.shade(b, 0.2);
      p.shadow(12, 17, 8, 2, 0.2);
      const f = frame % 2;
      p.r(5, 12 + (f ? 0 : 0), 2, 4 - f, d); p.r(9, 12, 2, 4 - (1 - f), b); p.r(14, 12, 2, 4 - (1 - f), d); p.r(18, 12, 2, 4 - f, b);
      p.ball(12, 10, 8, 4, b, { seed: 2, noise: 0.1 });
      p.ball(19, 6, 4, 4, b, { seed: 3, noise: 0.1 });
      p.r(21, 6, 3, 3, l); p.p(23, 6, '#2b1d2e'); p.p(19, 4, '#2b1d2e'); p.r(17, 2, 2, 4, d); p.r(20, 1, 2, 3, d);
      p.line(5, 8, 2, 4 + f, b); p.line(5, 9, 2, 5 + f, d);
      p.r(8, 10, 5, 2, l);
      p.outline(); return { c: p.c, ax: 12, ay: 17 };
    });
  }
  function cat(frame, color) {
    return memo('cat' + frame + color, () => {
      const p = new Px(22, 18), b = color || '#d8d4cc', d = U.shade(b, -0.25);
      p.shadow(11, 15, 7, 2, 0.2);
      const f = frame % 2;
      p.r(5, 11, 2, 4 - f, d); p.r(8, 11, 2, 4 - (1 - f), b); p.r(13, 11, 2, 4 - (1 - f), d); p.r(16, 11, 2, 4 - f, b);
      p.ball(11, 9, 7, 4, b, { seed: 4, noise: 0.08 }); p.ball(17, 6, 3, 3, b, { seed: 5, noise: 0.08 });
      p.p(16, 2, b); p.p(16, 3, d); p.p(19, 2, b); p.p(19, 3, d); p.p(16, 5, '#2b1d2e'); p.p(19, 5, '#2b1d2e'); p.p(18, 7, '#f0a0a0');
      p.line(4, 8, 1, 4 - f, b); p.line(5, 8, 2, 5 - f, d); for (const x of [8, 11, 14]) p.line(x, 6, x, 9, d);
      p.outline(); return { c: p.c, ax: 11, ay: 15 };
    });
  }
  function sheep(frame, dir) {
    return memo(`sheep${frame}${dir}`, () => {
      const p = new Px(30, 24), f = frame % 2;
      p.shadow(15, 21, 11, 3, 0.2);
      p.r(7, 15, 2, 5 - f, '#3a3438'); p.r(11, 15, 2, 5 - (1 - f), '#2a2428'); p.r(17, 15, 2, 5 - (1 - f), '#3a3438'); p.r(21, 15, 2, 5 - f, '#2a2428');
      p.ball(13, 11, 10, 6, '#f4f0ea', { seed: 6, noise: 0.4 }); p.ball(9, 9, 5, 4, '#f4f0ea', { seed: 7, noise: 0.4 }); p.ball(17, 9, 5, 4, '#f4f0ea', { seed: 8, noise: 0.4 });
      p.ball(24, 9, 4, 4, '#3a3438', { seed: 9, noise: 0.05 }); p.p(25, 8, '#fff'); p.r(21, 6, 3, 2, '#f4f0ea'); p.p(26, 11, '#ff9aa0');
      p.outline(); const o = dir === 1 ? p.flipX() : p; return { c: o.c, ax: 15, ay: 22 };
    });
  }

  return { tower, mineEntrance, greenhouse, guild, boat, cabin, lanternPost, crystal, dog, cat, sheep };
})();
