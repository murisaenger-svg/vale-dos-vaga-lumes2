'use strict';
/* ============================================================
   Renderizador: câmera, camadas, ordenação por profundidade,
   iluminação dinâmica, clima, partículas e efeitos.
   ============================================================ */
VV.Render = (() => {
  const U = VV.U, D = VV.Data, T = 16, N = VV.Art.Nature, B = VV.Art.Build, Sp = VV.Art.Special, Ic = VV.Art.Icons, Tl = VV.Art.Tiles;
  let canvas, ctx, VW = 480, VH = 270, SC = 3;
  let light, lctx;
  const cam = { x: 0, y: 0, tx: 0, ty: 0, shake: 0, sx: 0, sy: 0 };
  const lightSprites = {};
  let time = 0;
  const weatherFx = { drops: [], flakes: [], leaves: [], flies: [], flash: 0, splashes: [] };

  function init(c, settings) {
    canvas = c; ctx = canvas.getContext('2d', { alpha: false });
    light = document.createElement('canvas'); lctx = light.getContext('2d');
    resize(settings);
    window.addEventListener('resize', () => resize(settings));
  }
  function resize(settings) {
    const ww = window.innerWidth, wh = window.innerHeight;
    let sc = settings && settings.scale !== 'auto' ? Number(settings.scale) : Math.max(2, Math.round(wh / 270));
    sc = Math.max(1, sc);
    SC = sc;
    VW = Math.ceil(ww / sc); VH = Math.ceil(wh / sc);
    canvas.width = VW; canvas.height = VH;
    canvas.style.width = (VW * sc) + 'px'; canvas.style.height = (VH * sc) + 'px';
    light.width = VW; light.height = VH;
    ctx.imageSmoothingEnabled = false;
  }
  const size = () => ({ w: VW, h: VH, sc: SC });
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / SC, y: (e.clientY - r.top) / SC };
  }
  function screenToWorld(sx, sy) { return { x: sx + cam.x, y: sy + cam.y }; }

  function snapCamera(G) { follow(G, 1); cam.x = cam.tx; cam.y = cam.ty; }
  function follow(G, k) {
    const m = G.map, p = G.player;
    const mw = m.w * T, mh = m.h * T;
    let tx = p.x - VW / 2, ty = (p.y - 10) - VH / 2;
    if (mw <= VW) tx = (mw - VW) / 2; else tx = U.clamp(tx, 0, mw - VW);
    if (mh <= VH) ty = (mh - VH) / 2; else ty = U.clamp(ty, 0, mh - VH);
    cam.tx = tx; cam.ty = ty;
    cam.x = U.lerp(cam.x, tx, k); cam.y = U.lerp(cam.y, ty, k);
  }
  function shake(a) { cam.shake = Math.max(cam.shake, a); }

  /* ---------- ambiente ---------- */
  const KEYS = [[300, [48, 52, 110]], [390, [255, 200, 170]], [480, [255, 244, 232]], [600, [255, 255, 255]], [990, [255, 255, 255]], [1090, [255, 190, 140]], [1170, [120, 110, 170]], [1260, [64, 72, 135]], [1440, [48, 56, 118]], [1560, [42, 48, 105]]];
  function ambientAt(min) {
    let m = min; if (m < 300) m = 300;
    for (let i = 0; i < KEYS.length - 1; i++) {
      const a = KEYS[i], b = KEYS[i + 1];
      if (m >= a[0] && m <= b[0]) { const t = (m - a[0]) / (b[0] - a[0]); return [U.lerp(a[1][0], b[1][0], t), U.lerp(a[1][1], b[1][1], t), U.lerp(a[1][2], b[1][2], t)]; }
    }
    return KEYS[KEYS.length - 1][1];
  }
  function nightness(min) { const a = ambientAt(min); return U.clamp(1 - (a[0] + a[1] + a[2]) / 765, 0, 1) * 1.25; }
  function lightSprite(r, col) {
    const k = r + col; if (lightSprites[k]) return lightSprites[k];
    const c = document.createElement('canvas'); c.width = c.height = r * 2; const x = c.getContext('2d');
    const rgb = U.hex2rgb(col); const g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`); g.addColorStop(0.35, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`); g.addColorStop(0.7, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.18)`); g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    return (lightSprites[k] = c);
  }

  /* ---------- desenho de objetos ---------- */
  const flip = {};
  function spr(ctx_, s, x, y, fw = 1, fh = 1) { ctx_.drawImage(s.c, Math.round(x * T + (s.ax ? 8 * fw : 0) - s.ax), Math.round((y + 1) * T - s.ay + 1)); }
  function drawIcon(id, x, y, a) { ctx.drawImage(Ic.canvas(id), Math.round(x), Math.round(y)); }

  function objSprite(G, o, x, y) {
    const S = G.S, map = G.map, season = VV.State.season(S);
    switch (o.t) {
      case 'tree': { const sc = map.indoor ? 0 : season; if (o.k === 'pine') return N.pine(sc); if (o.k === 'palm') return N.palm(sc); return N.oak(sc, o.stage, o.v ? 1 : 0); }
      case 'stump': return N.stump();
      case 'log': return N.log();
      case 'rock': return N.rock(o.ore, o.cave, o.big);
      case 'weed': return N.weed(season, o.v || 0);
      case 'gtall': return N.grassTall(season);
      case 'bush': return N.bush(season, o.berry && o.grown ? (D.ITEMS[o.berry] ? D.ITEMS[o.berry].c[0] : '#d8392d') : null);
      case 'debris': return o.item === 'wood' ? N.branch() : N.rock('stone', false, false);
      case 'crop': { const c = D.CROPS[o.c]; if (!c) return null; const st = o.dead ? Math.max(1, Math.min(4, o.stage)) : o.stage; return N.crop(c.type, c, st, 5, o.dead); }
      case 'fence': {
        let mk = 0; const same = (xx, yy) => { const q = map.getObj(xx, yy); return q && q.t === 'fence'; };
        if (same(x, y - 1)) mk |= 1; if (same(x + 1, y)) mk |= 2; if (same(x, y + 1)) mk |= 4; if (same(x - 1, y)) mk |= 8;
        return N.fence(mk, o.tier || 0);
      }
      case 'bin': return B.deco('bin');
      case 'chest': return o.open ? B.deco('chest_open') : B.deco('chest', o.kind === 'big' ? 'big' : '');
      case 'machine': {
        const k = ({ furnace: 'furnace', keg: 'keg', jar: 'jar', loom: 'loom', press: 'maker', mayomaker: 'maker', hive: 'hive' })[o.k];
        if (o.k === 'scarecrow') return B.deco('scarecrow');
        if (o.k === 'sprinkler' || o.k === 'sprinkler2') return B.deco('sprinkler', o.k === 'sprinkler2' ? 1 : 0);
        if (o.k === 'torch') return B.deco('torch');
        return B.machine(k, !!(o.busy && !o.ready));
      }
      case 'deco': {
        if (o.k === 'lanternTree') return B.bigDecor('lanternTree');
        if (o.k === 'lanternPost') return Sp.lanternPost();
        return B.deco(o.k, o.a);
      }
      case 'furn': {
        if (o.k && o.k.startsWith('machine_')) return B.machine(o.mk, o.mk === 'furnace' && (G.S.min % 60 < 40 ? true : false));
        return B.furn(o.k, o.a);
      }
      case 'stairs': return B.deco(o.dir === 'down' ? 'stairs_down' : 'stairs_up');
      case 'dock': return o.k === 'bridge' ? B.deco('bridge') : B.deco('dock');
      case 'pedestal': return null;
      case 'altar': return null;
      case 'board': return B.deco('sign');
      case 'trough': return null;
      case 'hopper': return null;
      case 'floor': return null;
    }
    return null;
  }

  function drawObjects(G, list, x0, y0, x1, y1) {
    const map = G.map, S = G.S;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = map.obj.get(y * map.w + x);
      if (!o || o.t === 'ref') continue;
      const t = o.t;
      if (t === 'floor' || t === 'dock') { // ao nível do chão
        const s = objSprite(G, o, x, y); if (s) list.ground.push([x, y, s, o]); continue;
      }
      if (t === 'stairs') { list.ground.push([x, y, objSprite(G, o, x, y), o]); continue; }
      list.items.push({ y: (y + 1) * T - (o.t === 'forage' ? 6 : 0) + (t === 'crop' ? -2 : 0), o, x, y });
    }
  }

  function drawObjItem(G, it) {
    const { o, x, y } = it; const map = G.map;
    const sx = o.shake ? Math.sin(o.shake * 50) * Math.min(2, o.shake * 8) : 0;
    switch (o.t) {
      case 'forage': {
        const bob = Math.sin(time * 3 + x) * 0.8;
        ctx.fillStyle = 'rgba(20,10,40,0.25)'; ctx.fillRect(x * T + 4, y * T + 13, 8, 2);
        ctx.drawImage(Ic.canvas(o.item), x * T, Math.round(y * T - 1 + bob));
        if (((time * 2 + x * 3 + y) % 4) < 0.25) { ctx.fillStyle = '#fff'; ctx.fillRect(x * T + 11, y * T + 1, 1, 1); }
        return;
      }
      case 'pedestal': drawPedestal(G, o, x, y); return;
      case 'altar': drawAltar(G, o, x, y); return;
      case 'trough': { const px = x * T, py = y * T; ctx.fillStyle = '#7a5230'; ctx.fillRect(px, py + 4, o.fw * T, 12); ctx.fillStyle = '#a97844'; ctx.fillRect(px, py + 4, o.fw * T, 2); ctx.fillStyle = G.S.flags.troughFull ? '#e8c36a' : '#4a3020'; ctx.fillRect(px + 2, py + 7, o.fw * T - 4, 6); if (G.S.flags.troughFull) { ctx.fillStyle = '#f5d88a'; for (let i = 0; i < o.fw * 3; i++) ctx.fillRect(px + 3 + i * 5, py + 6 + (i % 2), 2, 1); } return; }
      case 'hopper': { const px = x * T, py = y * T; ctx.fillStyle = '#6a6878'; ctx.fillRect(px + 2, py - 12, o.fw * T - 4, 28); ctx.fillStyle = '#9a96a6'; ctx.fillRect(px + 2, py - 12, o.fw * T - 4, 3); ctx.fillStyle = '#e8c36a'; ctx.fillRect(px + 5, py - 6, o.fw * T - 10, 4); return; }
    }
    const s = objSprite(G, o, x, y);
    if (!s) return;
    const fw = o.fw || 1;
    let dx = Math.round(x * T + (s.ax ? 8 * fw : 0) - s.ax + sx), dy = Math.round((y + 1) * T - s.ay + 1);
    if (o.t === 'furn') dy = Math.round((y + 1) * T - s.ay + 1);
    if (o.t === 'crop' && o.hit) dy -= 1;
    ctx.drawImage(s.c, dx, dy);
    if (o.t === 'crop' && !o.dead) {
      const soil = map.soil.get(map.key(x, y));
      const c = D.CROPS[o.c];
      if (o.stage >= 4 && c) { const bob = Math.sin(time * 5 + x) * 0.8; ctx.drawImage(Ic.canvas(o.c), x * T, Math.round(y * T - 17 + bob)); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x * T + 8, y * T - 18, 1, 1); }
    }
    if (o.t === 'machine') {
      if (o.ready && o.out) { const bob = Math.sin(time * 5) * 1.2; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(x * T + 1, y * T - 13 + bob, 14, 14); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x * T + 1, y * T - 13 + bob, 14, 1); ctx.drawImage(Ic.canvas(o.out.id), x * T, Math.round(y * T - 14 + bob)); }
      else if (o.busy && o.k === 'furnace') { /* brilho via luz */ }
    }
    if (o.t === 'bush' && o.berry && o.grown === false) { /* sem frutos */ }
    if (o.t === 'chest' && o.kind === 'treasure') { ctx.fillStyle = `rgba(255,230,120,${0.4 + Math.sin(time * 4) * 0.3})`; ctx.fillRect(x * T + 8, y * T - 2, 1, 1); }
  }

  function drawPedestal(G, o, x, y) {
    const S = G.S, b = D.Story.bundles[o.b]; const px = x * T, py = y * T;
    const done = S.bundles[b.id] && S.bundles[b.id].every(v => v);
    const prog = S.bundles[b.id] ? S.bundles[b.id].filter(v => v).length : 0;
    ctx.fillStyle = 'rgba(20,10,40,0.3)'; ctx.fillRect(px + 1, py + 13, 14, 3);
    ctx.fillStyle = '#6e6880'; ctx.fillRect(px + 2, py + 6, 12, 10); ctx.fillStyle = '#9a94a8'; ctx.fillRect(px + 2, py + 6, 12, 2); ctx.fillStyle = '#4a4560'; ctx.fillRect(px + 2, py + 14, 12, 2); ctx.fillRect(px + 12, py + 8, 2, 6);
    ctx.fillStyle = '#9a94a8'; ctx.fillRect(px + 3, py + 4, 10, 3); ctx.fillStyle = '#bcb6cc'; ctx.fillRect(px + 3, py + 4, 10, 1);
    const col = b.color;
    const a = done ? 1 : 0.35 + prog / b.items.length * 0.4;
    ctx.fillStyle = done ? col : '#3a3458'; ctx.fillRect(px + 5, py - 4, 6, 8); ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fillRect(px + 6, py - 3, 4, 6); ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.fillRect(px + 6, py - 3, 1, 2);
    if (done) { ctx.globalAlpha = 0.5 + Math.sin(time * 3 + o.b) * 0.3; ctx.fillStyle = col; ctx.fillRect(px + 4, py - 5, 8, 10); ctx.globalAlpha = 1; }
  }
  function drawAltar(G, o, x, y) {
    const px = x * T, py = y * T; const lvl = G.lanternLevel();
    ctx.fillStyle = 'rgba(20,10,40,0.3)'; ctx.fillRect(px - 2, py + 12, 36, 4);
    ctx.fillStyle = '#6e6880'; ctx.fillRect(px, py + 4, 32, 12); ctx.fillStyle = '#9a94a8'; ctx.fillRect(px, py + 4, 32, 3); ctx.fillStyle = '#4a4560'; ctx.fillRect(px, py + 14, 32, 2);
    ctx.fillStyle = '#9a94a8'; ctx.fillRect(px + 8, py - 6, 16, 11); ctx.fillStyle = '#bcb6cc'; ctx.fillRect(px + 8, py - 6, 16, 2);
    // lanterna grande
    ctx.fillStyle = '#3a3458'; ctx.fillRect(px + 10, py - 20, 12, 14); ctx.fillStyle = '#8a8498'; ctx.fillRect(px + 9, py - 22, 14, 2); ctx.fillRect(px + 9, py - 8, 14, 2);
    const k = lvl / 6; ctx.fillStyle = `rgb(${Math.round(60 + 195 * k)},${Math.round(52 + 180 * k)},${Math.round(90 + 70 * k)})`; ctx.fillRect(px + 11, py - 19, 10, 12);
    if (lvl >= 6) { ctx.fillStyle = '#fff'; ctx.fillRect(px + 13, py - 17, 6, 8); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px + 12, py - 18, 2, 3);
  }

  function drawPlayer(G, p) {
    const S = G.S, sh = p.sheet;
    const dir = p.dir;
    let img;
    if (p.useT > 0) img = sh.use[dir]; else img = sh.frames[dir][p.moving ? Math.floor(p.walkT) % 4 : 0];
    if (p.fishing && p.fish.state !== 'none') img = sh.use[dir];
    const px = Math.round(p.x - sh.ax), py = Math.round(p.y - sh.ay + 3);
    // sombra
    ctx.fillStyle = 'rgba(20,10,40,0.28)'; ctx.fillRect(Math.round(p.x - 5), Math.round(p.y - 1), 10, 3);
    ctx.save();
    if (p.iframes > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = 0.45;
    if (p.sleepy) ctx.globalAlpha = 0.9;
    ctx.drawImage(img, px, py);
    ctx.restore();
    // ferramenta em movimento
    if (p.useT > 0 && p.tool) {
      const t = 1 - p.useT / p.useMax; const ic = Ic.canvas(p.tool.id, { tier: p.tool.tier });
      let ang, ox = 0, oy = -9, sgn = 1;
      const swing = (t - 0.5) * 2.2;
      if (dir === 2) { ox = 7; ang = -0.9 + swing * 1.4; } else if (dir === 1) { ox = -7; ang = 0.9 - swing * 1.4; sgn = -1; } else if (dir === 0) { ox = 2; oy = -4; ang = swing * 1.3; } else { ox = 2; oy = -14; ang = -swing * 1.3; }
      if (p.tool.id === 'rod') { /* vara fica estendida */ ang = dir === 2 ? -0.5 : dir === 1 ? 0.5 : 0; }
      ctx.save(); ctx.translate(Math.round(p.x + ox), Math.round(p.y + oy)); ctx.rotate(ang); if (sgn < 0) ctx.scale(-1, 1);
      ctx.drawImage(ic, -4, -12); ctx.restore();
      if (p.tool.weapon && t > 0.2 && t < 0.7) { // arco da espada
        ctx.save(); ctx.globalAlpha = 0.55 * (1 - Math.abs(t - 0.45) * 3);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; const cx = p.x, cy = p.y - 8, r = 15; const base = [Math.PI / 2, Math.PI, 0, -Math.PI / 2][dir === 0 ? 0 : dir === 1 ? 1 : dir === 2 ? 2 : 3];
        ctx.beginPath(); ctx.arc(cx, cy, r, base - 0.9 + (t - 0.2) * 3, base - 0.9 + (t - 0.2) * 3 + 1.1); ctx.stroke(); ctx.restore();
      }
    }
    // item erguido
    if (p.carry && p.carryT > 0) { ctx.drawImage(Ic.canvas(p.carry.id, { tier: p.carry.tier }), Math.round(p.x - 8), Math.round(p.y - 38 + Math.sin(time * 6) * 1)); }
  }

  function drawBuilding(G, b) {
    const s = b.spr;
    ctx.drawImage(s.c, b.x * T, b.y * T);
  }
  function drawGlows(G, vis) {
    const nf = G.night;
    if (nf < 0.15 && !G.map.dark) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, nf * 1.1);
    for (const b of G.map.buildings) if (b.spr.glow && b.x * T < cam.x + VW && (b.x + b.w) * T > cam.x && b.y * T < cam.y + VH && (b.y + b.h) * T > cam.y) ctx.drawImage(b.spr.glow, b.x * T, b.y * T);
    ctx.restore();
  }

  /* ---------- clima ---------- */
  function updateWeather(G, dt) {
    const W = G.weather, m = G.map; const out = m.outdoor;
    const fx = weatherFx;
    // chuva
    if (out && (W === 'rain' || W === 'storm')) {
      const want = W === 'storm' ? 260 : 150;
      while (fx.drops.length < want) fx.drops.push({ x: Math.random() * (VW + 80), y: Math.random() * VH, s: 220 + Math.random() * 120, l: 5 + Math.random() * 5 });
      for (const d of fx.drops) { d.y += d.s * dt; d.x -= d.s * 0.18 * dt; if (d.y > VH) { d.y = -10; d.x = Math.random() * (VW + 80); if (Math.random() < 0.3) fx.splashes.push({ x: Math.random() * VW, y: Math.random() * VH, t: 0 }); } }
      if (fx.splashes.length > 40) fx.splashes.splice(0, 10);
      for (const s of fx.splashes) s.t += dt; fx.splashes = fx.splashes.filter(s => s.t < 0.25);
      if (W === 'storm') { if (Math.random() < dt * 0.12) { fx.flash = 1; setTimeout(() => VV.Audio.sfx('thunder', { vol: 0.7 }), 300 + Math.random() * 600); } }
    } else { fx.drops.length = 0; fx.splashes.length = 0; }
    fx.flash = Math.max(0, fx.flash - dt * 2.2);
    // neve
    if (out && (W === 'snow' || (VV.State.season(G.S) === 3 && W !== 'rain' && W !== 'storm'))) {
      const want = W === 'snow' ? 110 : 40;
      while (fx.flakes.length < want) fx.flakes.push({ x: Math.random() * VW, y: Math.random() * VH, s: 14 + Math.random() * 20, p: Math.random() * 6, z: Math.random() < 0.3 ? 2 : 1 });
      for (const f of fx.flakes) { f.y += f.s * dt; f.p += dt; f.x += Math.sin(f.p) * 8 * dt - 3 * dt; if (f.y > VH) { f.y = -4; f.x = Math.random() * VW; } if (f.x < -4) f.x = VW; }
    } else fx.flakes.length = 0;
    // folhas / pétalas ao vento
    const season = VV.State.season(G.S);
    if (out && W !== 'rain' && W !== 'storm' && (season === 0 || season === 2) && m.id !== 'mine') {
      const want = W === 'wind' ? 26 : 8;
      while (fx.leaves.length < want) fx.leaves.push({ x: Math.random() * VW, y: Math.random() * VH, vx: 20 + Math.random() * 30, vy: 8 + Math.random() * 12, p: Math.random() * 6, c: season === 0 ? ['#ffb0cc', '#ff8fb4', '#ffffff'][Math.floor(Math.random() * 3)] : ['#e0862c', '#cc5a2a', '#e8b83a'][Math.floor(Math.random() * 3)] });
      const k = W === 'wind' ? 2.4 : 1;
      for (const l of fx.leaves) { l.p += dt * 3; l.x += (l.vx * k + Math.sin(l.p) * 10) * dt; l.y += (l.vy + Math.cos(l.p) * 10) * dt; if (l.x > VW + 4 || l.y > VH + 4) { l.x = -4; l.y = Math.random() * VH * 0.8; } }
    } else fx.leaves.length = 0;
    // vaga-lumes (noite quente + progresso do Lanternário)
    const lvl = G.lanternLevel();
    if (out && G.night > 0.5 && season !== 3 && W !== 'rain' && W !== 'storm') {
      const want = 5 + lvl * 7 + (G.S.flags.lanternarioDone ? 25 : 0);
      while (fx.flies.length < want) fx.flies.push({ x: Math.random() * VW, y: Math.random() * VH, p: Math.random() * 6, s: 6 + Math.random() * 8, a: Math.random() * 6 });
      for (const f of fx.flies) { f.p += dt * (0.8 + f.s * 0.05); f.a += (Math.random() - 0.5) * dt * 3; f.x += Math.cos(f.a) * f.s * dt; f.y += Math.sin(f.a) * f.s * dt * 0.7; if (f.x < -6) f.x = VW + 4; if (f.x > VW + 6) f.x = -4; if (f.y < -6) f.y = VH; if (f.y > VH + 6) f.y = -4; }
      if (fx.flies.length > want) fx.flies.length = want;
    } else fx.flies.length = 0;
  }
  function drawWeatherFront(G) {
    const fx = weatherFx;
    if (fx.drops.length) {
      ctx.strokeStyle = 'rgba(180,210,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const d of fx.drops) { ctx.moveTo(Math.round(d.x), Math.round(d.y)); ctx.lineTo(Math.round(d.x - d.l * 0.2), Math.round(d.y + d.l)); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,225,255,0.5)';
      for (const s of fx.splashes) { const r = s.t * 14; ctx.fillRect(Math.round(s.x - r), Math.round(s.y), 2, 1); ctx.fillRect(Math.round(s.x + r), Math.round(s.y), 2, 1); }
    }
    if (fx.flakes.length) { ctx.fillStyle = '#fff'; for (const f of fx.flakes) ctx.fillRect(Math.round(f.x), Math.round(f.y), f.z, f.z); }
    for (const l of fx.leaves) { ctx.fillStyle = l.c; ctx.fillRect(Math.round(l.x), Math.round(l.y), 2, 2); ctx.fillRect(Math.round(l.x) + 1, Math.round(l.y) + 1, 1, 1); }
    if (fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.flash * 0.7})`; ctx.fillRect(0, 0, VW, VH); }
  }

  /* ---------- iluminação ---------- */
  function drawLighting(G) {
    const m = G.map, S = G.S;
    let amb;
    if (m.indoor && !m.dark) { const n = G.night; amb = [255 - n * 22, 245 - n * 30, 230 - n * 24]; if (m.id === 'hall') amb = [255, 246, 232]; }
    else if (m.dark) amb = G.S.settings && G.S.settings.fullbright ? [200, 200, 220] : (m.id === 'mine30' ? [60, 66, 100] : [38, 38, 72]);
    else {
      amb = ambientAt(S.min);
      if (G.weather === 'rain' || G.weather === 'storm') amb = [amb[0] * 0.72, amb[1] * 0.76, amb[2] * 0.88];
      if (G.weather === 'snow') amb = [amb[0] * 0.9, amb[1] * 0.93, amb[2]];
      if (VV.State.season(S) === 3) amb = [amb[0] * 0.95, amb[1] * 0.98, amb[2]];
    }
    // festival
    if (G.festival && G.festival.lanterns && !m.indoor) amb = [amb[0] * 0.8, amb[1] * 0.75, amb[2] * 0.95];
    if (amb[0] > 250 && amb[1] > 250 && amb[2] > 250 && !m.lights.length) { drawLightsPost(G); return; }
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = `rgb(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0})`; lctx.fillRect(0, 0, VW, VH);
    lctx.globalCompositeOperation = 'lighter';
    const night = m.dark ? 1 : (m.indoor ? 0.5 : G.night);
    const add = (x, y, r, col, a) => {
      const sx = x - cam.x, sy = y - cam.y;
      if (sx < -r || sy < -r || sx > VW + r || sy > VH + r) return;
      lctx.globalAlpha = a; lctx.drawImage(lightSprite(r, col), Math.round(sx - r), Math.round(sy - r));
    };
    const fl = 0.9 + Math.sin(time * 9) * 0.05 + Math.sin(time * 23) * 0.04;
    for (const l of m.lights) {
      if (l.indoor) { if (m.dark) continue; continue; }
      const on = l.night ? night : 1;
      if (on <= 0.05) continue;
      if (l.hallLight) { add(l.x, l.y, l.r * (0.5 + G.lanternLevel() / 6 * 0.7), l.col, 0.9 * (0.2 + G.lanternLevel() / 6)); continue; }
      add(l.x, l.y, l.r * (l.flicker ? fl : 1), l.col, (l.a || 0.7) * on);
    }
    // objetos com luz (tochas, fornalhas, lanternas)
    const rx0 = Math.floor(cam.x / T) - 4, ry0 = Math.floor(cam.y / T) - 4, rx1 = Math.ceil((cam.x + VW) / T) + 4, ry1 = Math.ceil((cam.y + VH) / T) + 4;
    for (let y = Math.max(0, ry0); y <= Math.min(m.h - 1, ry1); y++) for (let x = Math.max(0, rx0); x <= Math.min(m.w - 1, rx1); x++) {
      const o = m.obj.get(y * m.w + x); if (!o) continue;
      if (o.t === 'machine' && o.k === 'torch') add(x * T + 8, y * T - 2, 62 * fl, '#ffb050', 0.95 * Math.max(night, m.dark ? 1 : 0.35));
      if (o.t === 'machine' && o.k === 'furnace' && o.busy && !o.ready) add(x * T + 8, y * T, 36 * fl, '#ff8a3a', 0.8);
      if (o.t === 'deco' && o.k === 'lanternTree') add(x * T + 8, y * T - 20, 80, '#9fe8ff', 0.9 * Math.max(night, 0.3));
      if (o.t === 'crop' && o.stage >= 4 && o.c === 'estrelafruta') add(x * T + 8, y * T - 6, 30, '#ffe66a', 0.8);
      if (o.t === 'pedestal') { const b = D.Story.bundles[o.b]; const done = G.S.bundles[b.id] && G.S.bundles[b.id].every(v => v); if (done) add(x * T + 8, y * T, 40, b.color, 0.9); }
    }
    // jogador / lanterna
    const p = G.player;
    const base = m.dark ? 70 + VV.State.ringVal(S, 'lumi') * 35 + (VV.State.buff(S, 'lumi') ? 30 : 0) : (night > 0.3 ? 48 : 0);
    if (base > 0) add(p.x, p.y - 8, base * (0.97 + Math.sin(time * 7) * 0.03), '#ffe9b8', m.dark ? 0.95 : 0.7 * night);
    // monstros brilhantes
    for (const mo of G.monsters) { if (mo.kind === 'wisp') add(mo.x, mo.y - 8, 40, '#9fe8ff', 0.8); if (mo.kind === 'golem') add(mo.x, mo.y - 10, 60, '#74e6ff', 0.8); }
    // vaga-lumes
    for (const f of weatherFx.flies) { const a = Math.max(0, Math.sin(f.p) * 0.9 + 0.1); if (a > 0.05) add(f.x + cam.x, f.y + cam.y, 14, '#d8ff7a', a * 0.9 * night); }
    // Lumi
    if (G.lumi && G.lumi.visible) add(G.lumi.x, G.lumi.y - 6, 54, '#ffe66a', 0.95);
    // ouro de estrelas, etc. (partículas luminosas)
    for (const pt of G.fx.list) if (pt.glow) add(pt.x, pt.y, pt.glow, pt.col, 0.6 * Math.min(1, pt.life / pt.max * 2));
    lctx.globalAlpha = 1; lctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(light, 0, 0); ctx.restore();
    // brilho aditivo suave nas luzes (bloom)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 * Math.max(night, m.dark ? 0.8 : 0); ctx.drawImage(light, 0, 0); ctx.restore();
  }
  function drawLightsPost() { }

  /* ---------- quadro principal ---------- */
  function ensureGround(G, map) {
    const season = map.indoor ? 0 : VV.State.season(G.S);
    if (!map.groundCanvas || map.groundSeason !== season) Tl.renderMap(map, season);
  }
  const hash = (a, b) => U.hash2(a, b, 17);

  function frame(G, dt) {
    time += dt;
    const m = G.map, S = G.S, p = G.player;
    ensureGround(G, m);
    follow(G, Math.min(1, dt * 7));
    if (cam.shake > 0.1) { cam.sx = (Math.random() - 0.5) * cam.shake * 2; cam.sy = (Math.random() - 0.5) * cam.shake * 2; cam.shake *= Math.pow(0.002, dt); } else { cam.shake = 0; cam.sx = cam.sy = 0; }
    const cx = Math.round(cam.x + cam.sx), cy = Math.round(cam.y + cam.sy);
    ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(-cx, -cy);
    // chão
    ctx.drawImage(m.groundCanvas, 0, 0);
    if (m.waterCanvas && m.waterCanvas.length) ctx.drawImage(m.waterCanvas[Math.floor(time * 2.2) % 4], 0, 0);
    const x0 = Math.max(0, Math.floor(cx / T) - 1), y0 = Math.max(0, Math.floor(cy / T) - 1), x1 = Math.min(m.w - 1, Math.ceil((cx + VW) / T) + 1), y1 = Math.min(m.h - 1, Math.ceil((cy + VH) / T) + 3);
    // solo arado
    if (m.soil.size) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const s = m.soil.get(y * m.w + x); if (!s) continue;
        let mask = 0; if (m.soil.has((y - 1) * m.w + x)) mask |= 1; if (m.soil.has(y * m.w + x + 1)) mask |= 2; if (m.soil.has((y + 1) * m.w + x)) mask |= 4; if (m.soil.has(y * m.w + x - 1)) mask |= 8;
        ctx.drawImage(Tl.soil(mask, s.wet), x * T, y * T);
        if (s.fert) { ctx.fillStyle = s.fert > 1 ? '#a8d878' : '#c8a878'; ctx.fillRect(x * T + 2, y * T + 2, 2, 1); ctx.fillRect(x * T + 11, y * T + 9, 2, 1); ctx.fillRect(x * T + 6, y * T + 12, 1, 1); }
      }
    }
    // decorações de chão (tapetes)
    for (const d of m.deco) if (d.t === 'rug') ctx.drawImage(B.deco('rug', d.col).c, d.x, d.y);
    for (const d of m.deco) if (d.t === 'wallDeco') { const s = B.furn(d.k, d.a); ctx.drawImage(s.c, d.x, d.y); }
    const list = { ground: [], items: [] };
    drawObjects(G, list, x0, y0, x1, y1);
    for (const g of list.ground) { const s = g[2]; if (s) ctx.drawImage(s.c, g[0] * T, g[1] * T); }
    // decor cristais da mina
    // fila ordenada por profundidade
    const q = list.items;
    for (const b of m.buildings) if (b.x * T < cx + VW && (b.x + b.w) * T > cx && b.y * T < cy + VH && (b.y + b.h) * T > cy) q.push({ y: (b.y + b.h) * T - 1, b });
    for (const d of m.deco) if (d.t === 'crystal') q.push({ y: (d.y + 1) * T, cr: d });
    for (const n of G.npcs) if (n.map === m.id && !n.hidden) q.push({ y: n.y, npc: n });
    for (const a of G.animals) if (a.map === m.id) q.push({ y: a.y, an: a });
    for (const mo of G.monsters) q.push({ y: mo.y, mo });
    if (G.pet && G.pet.map === m.id) q.push({ y: G.pet.y, pet: G.pet });
    if (G.spouseNpc && G.spouseNpc.map === m.id && !G.spouseNpc.hidden && !q.some(e => e.npc === G.spouseNpc)) q.push({ y: G.spouseNpc.y, npc: G.spouseNpc });
    for (const d of G.drops) q.push({ y: d.y, dr: d });
    for (const e of G.effects) if (e.type === 'fall') q.push({ y: e.y, fall: e });
    q.push({ y: p.y, pl: p });
    q.sort((a, b) => a.y - b.y);
    for (const it of q) {
      if (it.o) drawObjItem(G, it);
      else if (it.b) drawBuilding(G, it.b);
      else if (it.npc) { it.npc.draw(ctx, G); if (it.npc.emote) drawEmote(it.npc.x, it.npc.y - 30, it.npc.emote); if (it.npc.hasQuest) drawEmote(it.npc.x, it.npc.y - 30, 'quest'); }
      else if (it.an) { it.an.draw(ctx); if (it.an.emote) drawEmote(it.an.x, it.an.y - 22, it.an.emote); else if (it.an.product) drawEmote(it.an.x, it.an.y - 22, it.an.product.id, true); }
      else if (it.mo) { it.mo.draw(ctx); drawMonsterBar(it.mo); }
      else if (it.pet) it.pet.draw(ctx);
      else if (it.dr) it.dr.draw(ctx);
      else if (it.pl) drawPlayer(G, p);
      else if (it.cr) { const s = Sp.crystal(it.cr.col); ctx.drawImage(s.c, Math.round(it.cr.x * T + 8 - s.ax), Math.round((it.cr.y + 1) * T - s.ay + 1)); }
      else if (it.fall) drawFall(G, it.fall);
    }
    drawGlows(G);
    for (const sh of G.shots) sh.draw(ctx);
    G.fx.draw(ctx);
    // efeitos extras
    for (const e of G.effects) { if (e.type === 'ring') { const t = e.t / e.life; ctx.strokeStyle = e.col; ctx.globalAlpha = 1 - t; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * t, e.r * t * 0.6, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; } else if (e.type === 'flash') { ctx.globalAlpha = 1 - e.t / e.life; ctx.fillStyle = e.col; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.4 + e.t / e.life), 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; } }
    // Lumi
    if (G.lumi && G.lumi.visible && G.lumi.map === m.id) drawLumi(G);
    // reticle
    drawReticle(G);
    ctx.restore();
    // iluminação
    drawLighting(G);
    // clima frontal (espaço de tela)
    updateWeather(G, dt);
    if (m.outdoor) drawWeatherFront(G);
    // textos flutuantes
    ctx.save(); ctx.translate(-cx, -cy);
    for (const t of G.fx.texts) drawFloatText(t);
    ctx.restore();
    // vinheta suave
    drawVignette(G);
  }

  function drawFall(G, e) {
    const t = Math.min(1, e.t / e.life), s = e.spr;
    ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y));
    const a = U.ease.inOut(t) * 1.5 * e.dirx;
    ctx.rotate(a); ctx.globalAlpha = 1 - Math.max(0, t - 0.8) * 5;
    ctx.drawImage(s.c, -s.ax, -s.ay + 1);
    ctx.restore();
  }
  function drawEmote(x, y, id, item) {
    const bob = Math.sin(time * 4) * 1.5;
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x - 7), Math.round(y - 7 + bob), 14, 14); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(Math.round(x - 7), Math.round(y - 7 + bob), 14, 1); ctx.fillRect(Math.round(x - 7), Math.round(y + 6 + bob), 14, 1); ctx.fillRect(Math.round(x - 7), Math.round(y - 7 + bob), 1, 14); ctx.fillRect(Math.round(x + 6), Math.round(y - 7 + bob), 1, 14);
    ctx.fillRect(Math.round(x - 1), Math.round(y + 7 + bob), 3, 2);
    if (item) { ctx.drawImage(Ic.canvas(id), Math.round(x - 8), Math.round(y - 8 + bob)); return; }
    const cols = { heart: '#e8453a', quest: '#f2a63a', happy: '#ffd23f', sad: '#4a9ad8', angry: '#e8453a', music: '#7a5ac8', zzz: '#8aa8d8', gift: '#e86a9a' };
    ctx.fillStyle = cols[id] || '#999';
    if (id === 'heart') { ctx.fillRect(Math.round(x - 4), Math.round(y - 4 + bob), 3, 3); ctx.fillRect(Math.round(x + 1), Math.round(y - 4 + bob), 3, 3); ctx.fillRect(Math.round(x - 4), Math.round(y - 1 + bob), 8, 2); ctx.fillRect(Math.round(x - 3), Math.round(y + 1 + bob), 6, 1); ctx.fillRect(Math.round(x - 1), Math.round(y + 2 + bob), 2, 2); }
    else if (id === 'quest') { ctx.fillRect(Math.round(x - 1), Math.round(y - 5 + bob), 3, 6); ctx.fillRect(Math.round(x - 1), Math.round(y + 3 + bob), 3, 2); }
    else if (id === 'music') { ctx.fillRect(Math.round(x), Math.round(y - 5 + bob), 1, 7); ctx.fillRect(Math.round(x - 2), Math.round(y + 1 + bob), 3, 3); ctx.fillRect(Math.round(x), Math.round(y - 5 + bob), 4, 2); }
    else if (id === 'zzz') { ctx.fillRect(Math.round(x - 3), Math.round(y - 4 + bob), 5, 1); ctx.fillRect(Math.round(x), Math.round(y - 3 + bob), 1, 1); ctx.fillRect(Math.round(x - 2), Math.round(y - 2 + bob), 1, 1); ctx.fillRect(Math.round(x - 3), Math.round(y - 1 + bob), 5, 1); }
    else { ctx.fillRect(Math.round(x - 3), Math.round(y - 3 + bob), 6, 6); }
  }
  function drawMonsterBar(m) {
    if (m.hp >= m.maxHp || m.hidden) return;
    const w = m.boss ? 40 : 14, x = Math.round(m.x - w / 2), y = Math.round(m.y - (m.boss ? 38 : 20) - m.z);
    ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 1, y - 1, w + 2, 4); ctx.fillStyle = '#4a1a2a'; ctx.fillRect(x, y, w, 2); ctx.fillStyle = '#e8453a'; ctx.fillRect(x, y, Math.max(0, Math.round(w * m.hp / m.maxHp)), 2);
  }
  function drawLumi(G) {
    const L = G.lumi, f = Math.floor(time * 8) % 2; const s = VV.Art.Chars.firefly(f);
    const bob = Math.sin(time * 3) * 2;
    ctx.drawImage(s.c, Math.round(L.x - s.ax), Math.round(L.y - s.ay - 6 + bob));
    if (Math.random() < 0.2) G.fx.add({ x: L.x + (Math.random() - 0.5) * 6, y: L.y - 2, vx: (Math.random() - 0.5) * 8, vy: 6, g: 0, life: 0.8, max: 0.8, col: '#ffe66a', size: 1, glow: 8 });
  }
  function drawFloatText(t) {
    const a = 1 - Math.max(0, (t.t / t.life - 0.6) / 0.4);
    ctx.globalAlpha = a; ctx.font = (t.big ? 'bold 10px' : 'bold 8px') + ' "Pixelify Sans", monospace'; ctx.textAlign = 'center';
    const x = Math.round(t.x + t.ox), y = Math.round(t.y);
    ctx.fillStyle = '#1a1020'; ctx.fillText(t.str, x + 1, y + 1); ctx.fillText(t.str, x - 1, y + 1); ctx.fillText(t.str, x, y + 2); ctx.fillText(t.str, x, y);
    ctx.fillStyle = t.col; ctx.fillText(t.str, x, y + 1);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  function drawReticle(G) {
    const p = G.player; if (!G.showReticle) return;
    const t = G.targetTile(); if (!t) return;
    const pulse = 0.55 + Math.sin(time * 8) * 0.25;
    ctx.save(); ctx.strokeStyle = G.targetValid ? `rgba(255,255,255,${pulse})` : `rgba(255,120,120,${pulse * 0.7})`; ctx.lineWidth = 1;
    const x = t.x * T + 0.5, y = t.y * T + 0.5, c = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
    ctx.moveTo(x + 15 - c, y); ctx.lineTo(x + 15, y); ctx.lineTo(x + 15, y + c);
    ctx.moveTo(x + 15, y + 15 - c); ctx.lineTo(x + 15, y + 15); ctx.lineTo(x + 15 - c, y + 15);
    ctx.moveTo(x + c, y + 15); ctx.lineTo(x, y + 15); ctx.lineTo(x, y + 15 - c);
    ctx.stroke(); ctx.restore();
  }
  function drawVignette() {
    const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VH * 0.95);
    g.addColorStop(0, 'rgba(10,5,25,0)'); g.addColorStop(1, 'rgba(10,5,25,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }

  /* ---------- sobreposições de tela (minijogo de pesca etc.) ---------- */
  function overlay(G) {
    const p = G.player;
    if (p.fishing && p.fish.state !== 'none') drawFishing(G);
  }
  function drawFishing(G) {
    const f = G.player.fish;
    // cena da linha
    const px = Math.round(f.bx - cam.x), py = Math.round(f.by - cam.y);
    if (f.state === 'wait' || f.state === 'bite') {
      ctx.save(); ctx.fillStyle = f.state === 'bite' ? '#e8453a' : '#ffffff'; const bob = Math.sin(time * (f.state === 'bite' ? 30 : 3)) * (f.state === 'bite' ? 2 : 0.7);
      ctx.fillRect(px - 1, Math.round(py + bob - 1), 3, 3); ctx.fillStyle = '#e8453a'; ctx.fillRect(px - 1, Math.round(py + bob - 1), 3, 1);
      if (f.state === 'bite') { ctx.fillStyle = '#fff'; ctx.fillRect(px - 5, py - 18, 10, 12); ctx.fillStyle = '#e8453a'; ctx.fillRect(px - 1, py - 16, 2, 6); ctx.fillRect(px - 1, py - 8, 2, 2); }
      ctx.restore();
    }
    if (f.state === 'play') {
      const bx = Math.round(VW / 2 + 70), by = Math.round(VH / 2 - 60), H = 120, Wd = 20;
      ctx.fillStyle = '#1a1020'; ctx.fillRect(bx - 4, by - 4, Wd + 22, H + 8);
      ctx.fillStyle = '#3a6a9a'; ctx.fillRect(bx, by, Wd, H);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, by + i * 12, Wd, 1); }
      const barH = f.barH, barY = by + H - f.bar * H - barH * H / 2 + 0;
      ctx.fillStyle = 'rgba(120,255,140,0.55)'; ctx.fillRect(bx + 1, Math.round(by + H - (f.bar + f.barH / 2) * H), Wd - 2, Math.round(f.barH * H));
      ctx.fillStyle = '#9aff9a'; ctx.fillRect(bx + 1, Math.round(by + H - (f.bar + f.barH / 2) * H), Wd - 2, 1); ctx.fillRect(bx + 1, Math.round(by + H - (f.bar - f.barH / 2) * H) - 1, Wd - 2, 1);
      ctx.drawImage(Ic.canvas(f.fishId), bx + 2, Math.round(by + H - f.pos * H - 8), 16, 16);
      // progresso
      ctx.fillStyle = '#4a1a2a'; ctx.fillRect(bx + Wd + 6, by, 8, H);
      ctx.fillStyle = f.prog > 0.66 ? '#6fcf4a' : f.prog > 0.33 ? '#f2c230' : '#e8453a'; ctx.fillRect(bx + Wd + 6, Math.round(by + H - f.prog * H), 8, Math.round(f.prog * H));
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('SEGURE', bx + 10, by + H + 14); ctx.textAlign = 'left';
    }
  }

  return { init, resize, size, toGame, screenToWorld, frame, overlay, snapCamera, shake, cam, nightness, ambientAt, get time() { return time; }, get ctx() { return ctx; }, weatherFx };
})();
