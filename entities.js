'use strict';
/* ============================================================
   Entidades: colisão, NPCs, animais, pets, monstros, projéteis,
   itens no chão e partículas.
   ============================================================ */
VV.Ent = (() => {
  const U = VV.U, D = VV.Data, T = 16, C = VV.Art.Chars;

  /* ---------- colisão por caixa ---------- */
  function boxBlocked(map, x, y, hw, hh, fly) {
    const pts = [[x - hw, y], [x + hw, y], [x - hw, y - hh], [x + hw, y - hh]];
    for (const [px, py] of pts) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (fly) { if (!map.inb(tx, ty)) return true; const k = map.ground[ty][tx]; if (k === 'cave_wall' || k === 'void' || k === 'cliff' || k === 'wall_top' || k === 'wall_face') return true; continue; }
      if (!map.walkable(tx, ty)) return true;
    }
    return false;
  }
  function moveBox(map, e, dx, dy, hw = 5, hh = 5, fly) {
    let moved = false;
    if (dx) { if (!boxBlocked(map, e.x + dx, e.y, hw, hh, fly)) { e.x += dx; moved = true; } else { // desliza em cantos
        for (const s of [3, -3]) if (!boxBlocked(map, e.x + dx, e.y + s, hw, hh, fly) && Math.abs(dy) < 0.01) { e.y += Math.sign(s) * Math.min(Math.abs(dx), 0.8); break; } } }
    if (dy) { if (!boxBlocked(map, e.x, e.y + dy, hw, hh, fly)) { e.y += dy; moved = true; } else {
        for (const s of [3, -3]) if (!boxBlocked(map, e.x + s, e.y + dy, hw, hh, fly) && Math.abs(dx) < 0.01) { e.x += Math.sign(s) * Math.min(Math.abs(dy), 0.8); break; } } }
    return moved;
  }

  /* ---------- aparência dos NPCs ---------- */
  function specFromLook(look) {
    const L = look;
    return {
      skin: typeof L.skin === 'number' ? C.SKINS[L.skin] : L.skin, hair: L.hair, style: L.style, shirt: L.shirt, pants: L.pants,
      shoes: L.shoes, hat: L.hat || null, hatColor: L.hatColor, beard: L.beard || null, glasses: L.glasses || null, apron: L.apron || null,
      skirt: L.skirt ? 1 : 0, kid: L.kid ? 1 : 0, collar: L.collar || null, eye: L.eye, band: L.band,
    };
  }

  /* ---------- NPC ---------- */
  class NPC {
    constructor(id) {
      const d = D.NPCS[id];
      this.id = id; this.d = d; this.name = d.name;
      this.spec = specFromLook(d.look);
      this.sheet = C.sheet(this.spec);
      this.map = null; this.x = 0; this.y = 0; this.dir = 0; this.walk = 0; this.path = []; this.dest = null;
      this.hidden = false; this.talkTimer = 0; this.emote = null; this.state = 'idle'; this.bubble = null; this.wait = 0;
      this.hw = 5; this.hh = 5; this.speed = 34;
    }
    place(mapId, tx, ty) { this.map = mapId; this.x = tx * T + 8; this.y = ty * T + 14; this.path = []; this.dest = null; }
    get tx() { return Math.floor(this.x / T); } get ty() { return Math.floor((this.y - 2) / T); }
    update(dt, map, G) {
      if (this.talkTimer > 0) { this.talkTimer -= dt; return; }
      if (this.path.length) {
        const [tx, ty] = this.path[0];
        const gx = tx * T + 8, gy = ty * T + 14;
        const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
        const sp = this.speed * dt;
        if (d <= sp + 0.2) { this.x = gx; this.y = gy; this.path.shift(); }
        else {
          this.x += dx / d * sp; this.y += dy / d * sp;
          if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 2 : 1; else this.dir = dy > 0 ? 0 : 3;
        }
        this.walk += dt * 6; this.state = 'walk';
      } else { this.state = 'idle'; this.walk = 0; }
    }
    frame() { return Math.floor(this.walk) % 4; }
    draw(ctx, G) {
      const spr = this.sheet.frames[this.dir][this.state === 'walk' ? this.frame() : 0];
      ctx.drawImage(spr, Math.round(this.x - this.sheet.ax), Math.round(this.y - this.sheet.ay + 3));
    }
  }

  /* ---------- Animais ---------- */
  class Animal {
    constructor(o) {
      Object.assign(this, { id: o.id, type: o.type, name: o.name, age: o.age || 0, friend: o.friend || 0, fed: !!o.fed, petted: !!o.petted, product: o.product || null, map: o.map, x: o.x || 0, y: o.y || 0, home: o.home });
      this.dir = 0; this.walk = 0; this.target = null; this.wait = Math.random() * 3; this.sleeping = false; this.speed = 14; this.hop = 0; this.emote = null;
    }
    get baby() { return this.age < (this.type.startsWith('chicken') ? 3 : 5); }
    sprite() {
      const f = Math.floor(this.walk) % 2;
      if (this.type === 'cow') return C.cow(this.color || 'white', this.dir === 1 ? 1 : 2, f);
      if (this.type === 'sheep') return VV.Art.Special.sheep(f, this.dir === 1 ? 1 : 2);
      return C.chicken(this.type === 'chicken_brown' ? 'brown' : 'white', this.dir === 1 ? 1 : 2, f, this.baby);
    }
    update(dt, map) {
      if (this.sleeping) return;
      this.wait -= dt;
      if (!this.target && this.wait <= 0) {
        const home = map.animalHome;
        let rx0, ry0, rx1, ry1;
        if (home) { rx0 = home.x0; ry0 = home.y0; rx1 = home.x1; ry1 = home.y1; }
        else { const hx = this.hx ?? (this.hx = this.x / T), hy = this.hy ?? (this.hy = this.y / T); rx0 = hx - 6; rx1 = hx + 6; ry0 = hy - 4; ry1 = hy + 4; }
        for (let i = 0; i < 8; i++) {
          const tx = U.ri(Math.floor(rx0), Math.floor(rx1)), ty = U.ri(Math.floor(ry0), Math.floor(ry1));
          if (map.walkable(tx, ty) && !map.getObj(tx, ty)) { this.target = [tx * T + 8, ty * T + 12]; break; }
        }
        this.wait = 1.5 + Math.random() * 5;
      }
      if (this.target) {
        const dx = this.target[0] - this.x, dy = this.target[1] - this.y, d = Math.hypot(dx, dy);
        if (d < 2) { this.target = null; this.walk = 0; }
        else {
          const sp = this.speed * dt * (this.baby ? 1.3 : 1);
          const mv = { x: this.x, y: this.y };
          const ox = this.x, oy = this.y;
          moveBox(map, this, dx / d * sp, dy / d * sp, 5, 4);
          if (Math.abs(this.x - ox) + Math.abs(this.y - oy) < 0.05) this.target = null;
          if (Math.abs(dx) > 1) this.dir = dx > 0 ? 2 : 1;
          this.walk += dt * 4;
        }
      }
    }
    draw(ctx) {
      const s = this.sprite();
      ctx.drawImage(s.c, Math.round(this.x - s.ax), Math.round(this.y - s.ay + 2));
    }
  }

  /* ---------- Pet ---------- */
  class Pet {
    constructor(kind) { this.kind = kind; this.x = 0; this.y = 0; this.dir = 2; this.walk = 0; this.map = 'farm'; this.sleep = false; this.target = null; this.wait = 0; }
    place(map, x, y) { this.map = map; this.x = x; this.y = y; }
    update(dt, map, player) {
      const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy);
      if (this.map !== map.id) return;
      let sp = 0;
      if (d > 28 && d < 400) sp = Math.min(70, 28 + (d - 28) * 0.8);
      else if (d >= 400) { this.x = player.x - 8; this.y = player.y; }
      if (sp) {
        const ox = this.x, oy = this.y;
        moveBox(map, this, dx / d * sp * dt, dy / d * sp * dt, 5, 4);
        if (Math.abs(dx) > 2) this.dir = dx > 0 ? 2 : 1;
        this.walk += dt * 10;
      } else this.walk = 0;
    }
    draw(ctx) {
      const f = Math.floor(this.walk) % 2;
      const s = this.kind === 'cat' ? VV.Art.Special.cat(f) : VV.Art.Special.dog(f);
      const spr = this.dir === 1 ? (() => { const k = 'pf' + this.kind + f; return (Pet.fl = Pet.fl || {})[k] || (Pet.fl[k] = (() => { const p = new VV.Px(s.c.width, s.c.height); p.blit(s.c, 0, 0); return p.flipX(); })()); })() : null;
      if (spr) ctx.drawImage(spr.c, Math.round(this.x - s.ax), Math.round(this.y - s.ay + 2));
      else ctx.drawImage(s.c, Math.round(this.x - s.ax), Math.round(this.y - s.ay + 2));
    }
  }

  /* ---------- Monstros ---------- */
  class Monster {
    constructor(type, x, y, scale = 1) {
      const d = VV.Mines.MON[type];
      this.type = type; this.d = d; this.x = x; this.y = y; this.hp = Math.round(d.hp * scale); this.maxHp = this.hp;
      this.dmg = Math.round(d.dmg * (0.9 + 0.1 * scale)); this.kind = d.kind; this.fly = !!d.fly;
      this.vx = 0; this.vy = 0; this.kx = 0; this.ky = 0; this.hurt = 0; this.cool = 0; this.anim = Math.random() * 6; this.dead = false;
      this.state = 'idle'; this.t = Math.random() * 3; this.aim = [0, 0]; this.flash = 0; this.dir = 1;
      this.hw = this.kind === 'golem' ? 11 : 6; this.hh = this.kind === 'golem' ? 9 : 5; this.z = 0; this.boss = !!d.boss;
      this.phase = 0; this.atkT = 3; this.stun = 0; this.hidden = this.kind === 'crab';
    }
    update(dt, G) {
      const p = G.player, map = G.map, d = this.d;
      this.anim += dt;
      this.flash = Math.max(0, this.flash - dt); this.hurt = Math.max(0, this.hurt - dt); this.cool = Math.max(0, this.cool - dt);
      // knockback
      if (Math.abs(this.kx) + Math.abs(this.ky) > 1) { moveBox(map, this, this.kx * dt, this.ky * dt, this.hw, this.hh, this.fly); this.kx *= Math.pow(0.0006, dt); this.ky *= Math.pow(0.0006, dt); return; }
      if (this.stun > 0) { this.stun -= dt; return; }
      const dx = p.x - this.x, dy = (p.y - 6) - (this.y - 4), dist = Math.hypot(dx, dy);
      const aggro = this.boss ? 400 : this.kind === 'bat' ? 140 : 110;
      if (dx) this.dir = dx > 0 ? 2 : 1;
      const spd = d.spd * (this.boss && this.hp < this.maxHp * 0.5 ? 1.5 : 1);
      switch (this.kind) {
        case 'slime': {
          this.t -= dt;
          if (this.state === 'hop') { // pulo em direção ao alvo
            moveBox(map, this, this.aim[0] * spd * 2.2 * dt, this.aim[1] * spd * 2.2 * dt, this.hw, this.hh);
            this.z = Math.sin((1 - Math.max(0, this.t) / 0.45) * Math.PI) * 5;
            if (this.t <= 0) { this.state = 'idle'; this.t = 0.5 + Math.random() * 0.6; this.z = 0; }
          } else if (this.t <= 0) {
            if (dist < aggro) { this.aim = [dx / dist, dy / dist]; } else { const a = Math.random() * 6.28; this.aim = [Math.cos(a), Math.sin(a)]; }
            this.state = 'hop'; this.t = 0.45; VV.Audio.sfx('slime', { vol: dist < 120 ? 0.5 : 0.1 });
          }
          break;
        }
        case 'bat': {
          this.t -= dt;
          if (this.t <= 0) { this.t = 0.5 + Math.random() * 0.7; const a = dist < aggro ? Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.6 : Math.random() * 6.28; this.aim = [Math.cos(a), Math.sin(a)]; }
          const k = dist < aggro ? 1 : 0.4;
          moveBox(map, this, this.aim[0] * spd * k * dt, this.aim[1] * spd * k * dt, this.hw, this.hh, true);
          this.z = 8 + Math.sin(this.anim * 9) * 2;
          break;
        }
        case 'crab': {
          if (dist < 80) { this.hidden = false; if (dist > 12) moveBox(map, this, dx / dist * spd * dt, dy / dist * spd * dt, this.hw, this.hh); }
          else { this.hidden = true; }
          break;
        }
        case 'wisp': {
          this.t -= dt;
          if (this.t <= 0) { this.t = 1 + Math.random(); const a = dist < aggro ? Math.atan2(dy, dx) + Math.sin(this.anim) * 0.8 : Math.random() * 6.28; this.aim = [Math.cos(a), Math.sin(a)]; }
          moveBox(map, this, this.aim[0] * spd * dt, this.aim[1] * spd * dt, this.hw, this.hh, true);
          this.z = 6 + Math.sin(this.anim * 3) * 3;
          if (dist < 160 && this.cool <= 0 && Math.random() < dt * 0.5) { this.cool = 2.5; G.shoot(this.x, this.y - 8, dx / dist, dy / dist, 90, this.dmg, '#9fe8ff'); }
          break;
        }
        case 'golem': {
          this.atkT -= dt;
          if (this.state === 'idle') {
            if (dist > 20) moveBox(map, this, dx / dist * spd * dt, dy / dist * spd * dt, this.hw, this.hh);
            if (this.atkT <= 0) { this.state = Math.random() < 0.5 ? 'stomp' : 'volley'; this.t = this.state === 'stomp' ? 0.9 : 0.6; this.atkT = 2.6 - (this.hp < this.maxHp * 0.5 ? 0.9 : 0); }
          } else if (this.state === 'stomp') {
            this.t -= dt; this.z = this.t < 0.45 ? 10 * (this.t / 0.45) : 10 * (1 - (this.t - 0.45) / 0.45);
            if (this.t <= 0) { this.state = 'idle'; this.z = 0; G.shake(5); G.ring(this.x, this.y, 70, this.dmg * 1.2, '#74e6ff'); VV.Audio.sfx('bomb', { vol: 0.5 }); }
          } else if (this.state === 'volley') {
            this.t -= dt;
            if (this.t <= 0) { const n = this.hp < this.maxHp * 0.5 ? 12 : 8; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + this.anim; G.shoot(this.x, this.y - 8, Math.cos(a), Math.sin(a), 80, this.dmg * 0.7, '#74e6ff'); } this.state = 'idle'; VV.Audio.sfx('ring'); }
          }
          break;
        }
      }
      // dano de contato
      if (!this.hidden && dist < this.hw + 7 && this.cool <= 0 && p.iframes <= 0 && !(this.kind === 'slime' && this.state !== 'hop' && dist > 9)) {
        G.hurtPlayer(this.dmg, this.x, this.y); this.cool = 0.7;
      }
    }
    hit(dmg, kx, ky, G) {
      if (this.hidden) return false;
      this.hp -= dmg; this.flash = 0.15; this.hurt = 0.2;
      const kb = this.boss ? 40 : 160; this.kx = kx * kb; this.ky = ky * kb; this.stun = this.boss ? 0 : 0.12;
      if (this.kind === 'slime') this.state = 'idle', this.t = 0.4;
      if (this.hp <= 0) this.dead = true;
      return true;
    }
    draw(ctx) {
      let spr;
      const f = Math.floor(this.anim * (this.kind === 'bat' ? 14 : 4)) % 2;
      if (this.kind === 'slime') spr = C.slime(this.d.col, this.state === 'hop' ? 1 : (Math.floor(this.anim * 2) % 2));
      else if (this.kind === 'bat') spr = C.bat(f, this.d.col);
      else if (this.kind === 'wisp') spr = C.wisp(f);
      else if (this.kind === 'golem') spr = C.golem(f, '#8a8ea4');
      else if (this.kind === 'crab') { if (this.hidden) spr = C.golem(0, '#8a8494'); else spr = C.golem(f, '#9a8a90'); }
      if (!spr) return;
      ctx.save();
      const sc = this.kind === 'crab' ? 0.5 : 1;
      if (this.flash > 0) ctx.globalAlpha = 0.6;
      ctx.translate(Math.round(this.x), Math.round(this.y - this.z));
      if (sc !== 1) ctx.scale(sc, sc);
      ctx.drawImage(spr.c, -spr.ax, -spr.ay + 3);
      if (this.flash > 0) { ctx.globalCompositeOperation = 'source-atop'; }
      ctx.restore();
      if (this.flash > 0) { ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(this.x - 4), Math.round(this.y - this.z - 8), 8, 6); ctx.restore(); }
    }
  }

  /* ---------- Itens no chão ---------- */
  class Drop {
    constructor(inst, x, y, vx, vy) { this.inst = inst; this.x = x; this.y = y; this.vx = vx ?? (Math.random() - 0.5) * 60; this.vy = vy ?? (Math.random() - 0.5) * 60; this.z = 8; this.vz = 70 + Math.random() * 30; this.t = 0; this.dead = false; this.life = 90; }
    update(dt, G) {
      this.t += dt; this.life -= dt;
      if (this.z > 0 || this.vz > 0) { this.vz -= 300 * dt; this.z += this.vz * dt; if (this.z < 0) { this.z = 0; this.vz = Math.abs(this.vz) > 25 ? -this.vz * 0.4 : 0; } this.vx *= 0.98; this.vy *= 0.98; moveBox(G.map, this, this.vx * dt, this.vy * dt, 2, 2); }
      const p = G.player, dx = p.x - this.x, dy = (p.y - 6) - this.y, d = Math.hypot(dx, dy);
      const mag = 22 + (VV.State.ringVal(G.S, 'mag') ? 50 : 0) + (VV.State.buff(G.S, 'mag') ? 40 : 0);
      if (this.t > 0.35 && d < mag) { this.x += dx / d * Math.min(d, 150 * dt); this.y += dy / d * Math.min(d, 150 * dt); }
      if (this.t > 0.3 && d < 9) { if (G.pickup(this.inst, this.x, this.y)) this.dead = true; }
      if (this.life <= 0) this.dead = true;
    }
    draw(ctx) {
      const ic = VV.Art.Icons.canvas(this.inst.id, { tier: this.inst.tier });
      const bob = this.z <= 0.5 ? Math.sin(this.t * 4) * 1 : 0;
      ctx.fillStyle = 'rgba(20,10,40,0.25)'; ctx.fillRect(Math.round(this.x - 4), Math.round(this.y + 1), 8, 2);
      ctx.drawImage(ic, Math.round(this.x - 8), Math.round(this.y - 14 - this.z + bob), 16, 16);
    }
  }

  /* ---------- Projéteis ---------- */
  class Shot {
    constructor(x, y, dx, dy, spd, dmg, col) { this.x = x; this.y = y; this.vx = dx * spd; this.vy = dy * spd; this.dmg = dmg; this.col = col; this.life = 3; this.dead = false; }
    update(dt, G) {
      this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
      const tx = Math.floor(this.x / T), ty = Math.floor((this.y) / T);
      if (!G.map.inb(tx, ty) || G.map.ground[ty][tx] === 'cave_wall' || G.map.ground[ty][tx] === 'void') this.dead = true;
      const p = G.player;
      if (Math.hypot(p.x - this.x, (p.y - 6) - this.y) < 7 && p.iframes <= 0) { G.hurtPlayer(this.dmg, this.x - this.vx, this.y - this.vy); this.dead = true; }
      if (this.life <= 0) this.dead = true;
    }
    draw(ctx) { ctx.fillStyle = this.col; ctx.fillRect(Math.round(this.x - 2), Math.round(this.y - 2), 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(this.x - 1), Math.round(this.y - 1), 2, 2); }
  }

  /* ---------- Partículas ---------- */
  class Particles {
    constructor() { this.list = []; this.texts = []; }
    add(p) { if (this.list.length < 700) this.list.push(p); }
    burst(x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, s = (o.speed || 40) * (0.3 + Math.random() * 0.9);
        this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g ?? 160, life: (o.life || 0.5) * (0.6 + Math.random() * 0.7), max: o.life || 0.5, col: Array.isArray(o.col) ? o.col[i % o.col.length] : (o.col || '#fff'), size: o.size || 2, fade: o.fade !== false, shrink: o.shrink });
      }
    }
    text(x, y, str, col = '#fff', o = {}) { this.texts.push({ x, y, str, col, t: 0, life: o.life || 1.1, big: o.big, vy: o.vy ?? -22, ox: o.ox || 0 }); }
    update(dt) {
      for (const p of this.list) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; } }
      this.list = this.list.filter(p => p.life > 0);
      for (const t of this.texts) { t.t += dt; t.y += t.vy * dt; t.vy *= 0.94; }
      this.texts = this.texts.filter(t => t.t < t.life);
    }
    draw(ctx) {
      for (const p of this.list) {
        const a = p.fade ? Math.min(1, p.life / p.max * 1.5) : 1; const s = p.shrink ? Math.max(1, p.size * p.life / p.max) : p.size;
        ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.ceil(s), Math.ceil(s));
      }
      ctx.globalAlpha = 1;
    }
  }

  return { moveBox, boxBlocked, NPC, Animal, Pet, Monster, Drop, Shot, Particles, specFromLook };
})();
