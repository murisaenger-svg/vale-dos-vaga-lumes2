'use strict';
/* ============================================================
   Mundo: classe de mapa (tiles, objetos, solo, colisão), busca de caminho.
   ============================================================ */
VV.World = (() => {
  const U = VV.U, T = 16;
  const SOLID_GROUND = { water: 1, cliff: 1, void: 1, wall_top: 1, wall_face: 1, cave_wall: 1 };

  class GameMap {
    constructor(id, w, h, o = {}) {
      this.id = id; this.w = w; this.h = h;
      this.name = o.name || id;
      this.theme = o.theme || 0;
      this.outdoor = o.outdoor !== false;
      this.indoor = !this.outdoor;
      this.dark = !!o.dark;
      this.music = o.music || 'spring';
      this.fishLoc = o.fishLoc || 'river';
      this.ground = []; for (let y = 0; y < h; y++) this.ground.push(new Array(w).fill(o.base || 'grass'));
      this.obj = new Map();      // chave y*w+x -> objeto
      this.soil = new Map();     // chave -> {wet, fert, moss}
      this.block = new Uint8Array(w * h);   // bloqueio de prédios/decoração
      this.warps = [];           // {x,y,w,h,to,tx,ty,dir}
      this.poi = {};             // pontos de interesse
      this.deco = [];            // sprites sem colisão {spr,x,y,layer}
      this.buildings = [];       // {sprite, x,y, fp:{x,y,w,h}}
      this.lights = [];          // {x,y,r,col,flicker}
      this.plots = {};
      this.fishZones = o.fishZones || [];
      this.canTill = !!o.canTill;
      this.seed = o.seed || 1;
      this.flags = {};
    }
    key(x, y) { return y * this.w + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    kind(x, y) { return this.inb(x, y) ? this.ground[y][x] : 'void'; }
    getObj(x, y) { return this.obj.get(this.key(x, y)) || null; }
    setObj(x, y, o) {
      if (!this.inb(x, y)) return null;
      o.x = x; o.y = y;
      if (!o.id) o.id = Math.random().toString(36).slice(2, 8);
      this.obj.set(this.key(x, y), o);
      // objetos grandes registram referências
      if (o.fw > 1 || o.fh > 1) {
        for (let j = 0; j < (o.fh || 1); j++) for (let i = 0; i < (o.fw || 1); i++) if (i || j) this.obj.set(this.key(x + i, y - j), { t: 'ref', to: o.id, ox: x, oy: y });
      }
      return o;
    }
    delObj(x, y) {
      const o = this.getObj(x, y); if (!o) return;
      if (o.t === 'ref') { return this.delObj(o.ox, o.oy); }
      this.obj.delete(this.key(x, y));
      if (o.fw > 1 || o.fh > 1) for (let j = 0; j < (o.fh || 1); j++) for (let i = 0; i < (o.fw || 1); i++) this.obj.delete(this.key(x + i, y - j));
    }
    mainObj(x, y) { let o = this.getObj(x, y); if (o && o.t === 'ref') o = this.getObj(o.ox, o.oy); return o; }
    solidAt(x, y) {
      if (!this.inb(x, y)) return true;
      if (SOLID_GROUND[this.ground[y][x]]) return true;
      if (this.block[y * this.w + x]) return true;
      const o = this.obj.get(y * this.w + x);
      if (o) { if (o.t === 'ref') return true; if (o.solid) return true; }
      return false;
    }
    walkable(x, y) {
      if (!this.inb(x, y)) return false;
      if (this.ground[y][x] === 'water') { const o = this.getObj(x, y); return !!(o && o.t === 'dock'); }
      return !this.solidAt(x, y);
    }
    blockRect(x, y, w, h, v = 1) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.block[j * this.w + i] = v; }
    fill(kind, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inb(i, j)) this.ground[j][i] = kind; }
    warpAt(px, py) { // px, py em pixels (pés)
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      for (const w of this.warps) if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) return w;
      return null;
    }
    isWater(x, y) { return this.kind(x, y) === 'water'; }
    nearWater(x, y, r = 1) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (this.isWater(x + i, y + j)) return true; return false; }
    tillable(x, y) {
      if (!this.canTill) return false;
      const k = this.kind(x, y);
      return (k === 'grass' || k === 'path' || k === 'sand' || k === 'dirt' || k === 'tilled_floor') && !this.solidAt(x, y);
    }
    fishLocAt(x, y) { for (const z of this.fishZones) if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z; return { loc: this.fishLoc }; }
  }

  /* ---------- A* simples (4 direções) ---------- */
  function astar(map, sx, sy, tx, ty, maxN = 2500) {
    if (sx === tx && sy === ty) return [];
    if (!map.inb(tx, ty)) return null;
    const W = map.w, key = (x, y) => y * W + x;
    const open = [[0, sx, sy]], came = new Map(), g = new Map();
    g.set(key(sx, sy), 0); came.set(key(sx, sy), -1);
    let n = 0;
    const h = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
    while (open.length && n++ < maxN) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [, cx, cy] = open.splice(bi, 1)[0];
      if (cx === tx && cy === ty) {
        const path = []; let k = key(cx, cy);
        while (k !== -1 && came.get(k) !== -1) { path.push([k % W, (k / W) | 0]); k = came.get(k); }
        return path.reverse();
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, nk = key(nx, ny);
        if (!map.inb(nx, ny)) continue;
        if (!map.walkable(nx, ny) && !(nx === tx && ny === ty)) continue;
        const ng = g.get(key(cx, cy)) + 1;
        if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); came.set(nk, key(cx, cy)); open.push([ng + h(nx, ny), nx, ny]); }
      }
    }
    return null;
  }
  // tile livre mais próximo
  function nearestFree(map, x, y, maxR = 6) {
    if (map.walkable(x, y)) return [x, y];
    for (let r = 1; r <= maxR; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; if (map.walkable(x + i, y + j)) return [x + i, y + j]; }
    return [x, y];
  }
  return { GameMap, astar, nearestFree, T, SOLID_GROUND };
})();
