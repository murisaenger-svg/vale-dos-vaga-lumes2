'use strict';
/* ============================================================
   Ações do jogador: ferramentas, agricultura, recursos, itens
   colocáveis, pesca (minijogo), combate e interação.
   ============================================================ */
(() => {
  const G = VV.G, U = VV.U, D = VV.Data, St = VV.State, T = 16, Inp = VV.Input, A = VV.Audio, Ent = VV.Ent, O = VV.Maps.O;
  const UI = () => VV.UI;
  const DIRV = G.DIRV;

  /* ---------- entrada → ações ---------- */
  G.handleActions = function (dt) {
    const S = G.S, p = G.player, mo = Inp.mouse;
    // hotbar
    const hb = Inp.hotbar(); if (hb >= 0 && hb < S.invSize) { S.sel = hb; A.sfx('hover', { vol: 0.6 }); UI().refreshHud(); }
    if (Inp.pressed('prev') || mo.wheel < 0) { S.sel = (S.sel + 11) % 12; A.sfx('hover', { vol: 0.5 }); UI().refreshHud(); }
    if (Inp.pressed('next') || mo.wheel > 0) { S.sel = (S.sel + 1) % 12; A.sfx('hover', { vol: 0.5 }); UI().refreshHud(); }
    if (Inp.pressed('menu')) { UI().openMenu('inv'); return; }
    if (Inp.pressed('map')) { UI().openMenu('map'); return; }
    if (Inp.pressed('journal')) { UI().openMenu('quests'); return; }
    if (Inp.pressed('back')) { if (p.fishing) { G.cancelFishing(); return; } UI().openPause(); return; }
    // alvo
    const held = St.held(S), def = held && D.ITEMS[held.id];
    G.showReticle = !!(held && def && (def.tool || def.seed || def.place || ['fertilizer', 'fert2', 'speedgro', 'moss'].includes(held.id)));
    if (G.showReticle) G.targetValid = G.checkTarget(held, def);
    // usar
    const useHit = Inp.pressed('use') || mo.leftHit;
    const holdUse = (Inp.held('use')) && def && def.weapon;
    if ((useHit || holdUse) && G.cooldown.use <= 0 && !p.fishing && p.useT <= 0) {
      if (mo.leftHit && G.mouseMode) { const t = G.targetTile(); G.faceTile(t); }
      G.useHeld();
    } else if (p.fishing && (Inp.pressed('use') || mo.leftHit)) G.fishingPress();
    // interagir
    if ((Inp.pressed('act') || mo.rightHit) && G.cooldown.act <= 0 && !p.fishing && p.useT <= 0) {
      if (mo.rightHit && G.mouseMode) G.faceTile(G.targetTile());
      G.cooldown.act = 0.2; G.interact();
    } else if (p.fishing && Inp.pressed('act')) G.cancelFishing();
  };

  G.spend = function (cost) {
    const S = G.S;
    if (S.energy <= 0) { UI().toast('Você está exausto! Coma algo ou vá dormir.', 'bad', 'lamp'); A.sfx('error', { vol: 0.5 }); G.cooldown.use = 0.4; return false; }
    S.energy = Math.max(0, S.energy - cost); UI().refreshHud(); return true;
  };
  G.toolCost = function (id) {
    const S = G.S; const lv = { hoe: 'farm', can: 'farm', scythe: 'farm', axe: 'forage', pick: 'mine' }[id];
    let c = 2 - (lv ? St.skillLevel(S, lv) * 0.08 : 0);
    if (id === 'axe' && St.skillLevel(S, 'forage') >= 1) c -= 0.3;
    if (id === 'pick' && St.skillLevel(S, 'mine') >= 1) c -= 0.3;
    if (id === 'pick' && St.skillLevel(S, 'mine') >= 6) c -= 0.2;
    if (id === 'rod') c = 1.5;
    return Math.max(0.6, c);
  };
  G.swing = function (tool, fn, dur = 0.3, at = 0.4) {
    const p = G.player; p.tool = tool; p.useT = dur; p.useMax = dur; p.act = { at: dur * at, fn };
    G.cooldown.use = dur + 0.04;
  };

  G.checkTarget = function (item, def) {
    const t = G.targetTile(), m = G.map, o = m.getObj(t.x, t.y);
    if (def.seed) { const s = m.soil.get(m.key(t.x, t.y)); return !!(s && !o); }
    if (def.place) return G.canPlace(def, t);
    if (['fertilizer', 'fert2', 'speedgro', 'moss'].includes(item.id)) return m.soil.has(m.key(t.x, t.y));
    switch (item.id) {
      case 'hoe': return m.tillable(t.x, t.y) && (!o || o.t === 'weed') && !m.soil.has(m.key(t.x, t.y));
      case 'can': return m.isWater(t.x, t.y) || m.soil.has(m.key(t.x, t.y));
      default: return true;
    }
  };

  G.useHeld = function () {
    const S = G.S, p = G.player, it = St.held(S); if (!it) return;
    const def = D.ITEMS[it.id];
    if (def.tool) return G.useTool(it, def);
    if (def.seed) return G.plantSeed(it, def);
    if (['fertilizer', 'fert2', 'speedgro', 'moss'].includes(it.id)) return G.applyFertilizer(it);
    if (def.place) return G.placeItem(it, def);
  };

  /* ============================================================
     Ferramentas
     ============================================================ */
  G.useTool = function (it, def) {
    const S = G.S, p = G.player, m = G.map;
    const t = G.targetTile(); G.faceTile(t);
    const id = it.id;
    if (def.weapon) return G.swingWeapon(it, def);
    if (id === 'rod') return G.castRod(it);
    if (id !== 'can' && !G.spend(G.toolCost(id))) return;
    const tier = it.tier || 0;
    const tile = t;
    switch (id) {
      case 'hoe': {
        const n = [1, 1, 3, 5][tier];
        G.swing(it, () => {
          const d = DIRV[p.dir]; let any = false;
          for (let i = 0; i < n; i++) { const x = tile.x + (i ? d[0] * i : 0), y = tile.y + (i ? d[1] * i : 0); any = G.tillTile(x, y) || any; }
          if (!any) A.sfx('hit', { vol: 0.3 });
        });
        break;
      }
      case 'can': {
        if (m.isWater(tile.x, tile.y) || (m.getObj(tile.x, tile.y) && m.getObj(tile.x, tile.y).well)) { G.swing(it, () => { S.can.water = S.can.max = G.canMax(); A.sfx('splash', { vol: 0.5 }); G.fx.burst(tile.x * T + 8, tile.y * T + 8, 10, { col: ['#8ac0ea', '#fff'], speed: 40, up: 30, life: 0.5 }); UI().toast('Regador cheio!', 'info', 'can'); UI().refreshHud(); }, 0.35); break; }
        if (S.can.water <= 0) { UI().toast('Regador vazio. Encha na água ou no poço!', 'warn', 'can'); A.sfx('error', { vol: 0.4 }); G.cooldown.use = 0.4; break; }
        if (!G.spend(G.toolCost('can'))) break;
        const n = [1, 1, 3, 5][tier];
        G.swing(it, () => {
          const d = DIRV[p.dir]; let used = 0;
          for (let i = 0; i < n; i++) { if (S.can.water <= 0) break; const x = tile.x + d[0] * i, y = tile.y + d[1] * i; if (G.waterTile(x, y)) { S.can.water--; used++; } }
          if (used) { A.sfx('water', { vol: 0.6 }); UI().refreshHud(); }
        }, 0.32);
        break;
      }
      case 'axe': G.swing(it, () => G.useAxe(tile, tier), 0.32); break;
      case 'pick': G.swing(it, () => G.usePick(tile, tier), 0.32); break;
      case 'scythe': G.swing(it, () => G.useScythe(tile), 0.28, 0.35); break;
    }
  };
  G.canMax = () => { const t = (St.held(G.S) && St.held(G.S).id === 'can') ? (St.held(G.S).tier || 0) : (G.S.inv.find(i => i && i.id === 'can') || { tier: 0 }).tier || 0; return [40, 55, 70, 90][t]; };

  G.tillTile = function (x, y) {
    const m = G.map, S = G.S;
    if (!m.inb(x, y)) return false;
    const o = m.getObj(x, y);
    if (o && o.t === 'weed') { m.delObj(x, y); G.fx.burst(x * T + 8, y * T + 8, 5, { col: ['#6fb04a', '#4a9a3a'], speed: 30, up: 20 }); }
    else if (o) return false;
    if (!m.tillable(x, y) || m.soil.has(m.key(x, y))) return false;
    if (m.kind(x, y) !== 'grass' && !m.greenhouse && m.kind(x, y) !== 'path') return false;
    m.soil.set(m.key(x, y), { wet: (G.weather === 'rain' || G.weather === 'storm') && m.outdoor, fert: 0, idle: 0 });
    A.sfx('hoe', { vol: 0.7 });
    G.fx.burst(x * T + 8, y * T + 10, 8, { col: ['#6d4a30', '#8a6040', '#53361f'], speed: 36, up: 40, life: 0.45 });
    if (Math.random() < 0.08 && m.id === 'farm') { const r = Math.random(); const drop = r < 0.5 ? ['clay', 1] : r < 0.8 ? ['seed_nabo', 1] : ['geode', 1]; G.spawnDrop(drop[0], drop[1], x * T + 8, y * T + 8); }
    return true;
  };
  G.waterTile = function (x, y) {
    const m = G.map; const s = m.soil.get(m.key(x, y)); if (!s) return false;
    if (s.wet) return false;
    s.wet = true; G.fx.burst(x * T + 8, y * T + 8, 6, { col: ['#8ac0ea', '#cfe8f8'], speed: 22, up: 20, g: 100, life: 0.4, size: 1 }); return true;
  };

  /* ---------- machado ---------- */
  G.useAxe = function (t, tier) {
    const m = G.map, S = G.S, o = m.mainObj(t.x, t.y); const power = [2, 3, 4, 5][tier] + (St.skillLevel(S, 'forage') >= 8 ? 1 : 0);
    if (!o) { A.sfx('swing', { vol: 0.5 }); return; }
    const cx = o.x * T + 8, cy = o.y * T + 8;
    switch (o.t) {
      case 'tree': {
        if (o.stage < 4) { m.delObj(o.x, o.y); G.fx.burst(cx, cy, 8, { col: ['#6fb04a', '#8a5a30'], speed: 40, up: 30 }); A.sfx('chop', { vol: 0.5 }); G.spawnDrop('wood', 1, cx, cy); if (Math.random() < 0.5) G.spawnDrop('sap', 1, cx, cy); return; }
        o.hp -= power; o.shake = 0.3; (m._shaking = m._shaking || []).push(o);
        A.sfx('chop'); G.fx.burst(cx, cy - 6, 6, { col: o.k === 'pine' ? ['#2f8040', '#3d9a52'] : ['#5db644', '#8a5a30', '#e0862c'], speed: 40, up: 20, life: 0.6 });
        G.shake(0.7);
        if (o.hp <= 0) G.fellTree(o);
        return;
      }
      case 'stump': o.hp -= power; A.sfx('chop', { vol: 0.8 }); G.fx.burst(cx, cy, 5, { col: ['#9a6e40', '#583a22'], speed: 36, up: 24 }); o.shake = 0.2; if (o.hp <= 0) { m.delObj(o.x, o.y); G.spawnDrop('wood', U.ri(3, 5), cx, cy); G.xp('forage', 3); } return;
      case 'log': o.hp -= power; A.sfx('chop', { vol: 0.8 }); G.fx.burst(cx + 8, cy, 6, { col: ['#9a6e40', '#583a22'], speed: 36, up: 24 }); if (o.hp <= 0) { m.delObj(o.x, o.y); for (let i = 0; i < U.ri(7, 10); i++) G.spawnDrop('wood', 1, cx + 8, cy); G.xp('forage', 8); A.sfx('treefall', { vol: 0.5 }); } return;
      case 'debris': if (o.item === 'wood') { m.delObj(o.x, o.y); G.spawnDrop('wood', U.ri(1, 2), cx, cy); A.sfx('chop', { vol: 0.5 }); } return;
      case 'bush': m.delObj(o.x, o.y); G.spawnDrop('wood', 2, cx, cy); G.spawnDrop('fiber', 2, cx, cy); A.sfx('chop', { vol: 0.6 }); G.fx.burst(cx, cy, 8, { col: ['#4fa83a', '#3f9e3b'], speed: 40, up: 20 }); return;
      case 'weed': case 'gtall': G.cutWeed(o); return;
      case 'fence': case 'chest': case 'machine': case 'furn': case 'deco': G.pickUpPlaced(o); return;
    }
  };
  G.fellTree = function (o) {
    const m = G.map, S = G.S, cx = o.x * T + 8, cy = (o.y + 1) * T;
    m.delObj(o.x, o.y);
    const spr = o.k === 'pine' ? VV.Art.Nature.pine(St.season(S)) : o.k === 'palm' ? VV.Art.Nature.palm(St.season(S)) : VV.Art.Nature.oak(St.season(S), 4, o.v ? 1 : 0);
    G.effects.push({ type: 'fall', x: cx, y: cy, spr, t: 0, life: 0.75, dirx: G.player.x < cx ? 1 : -1 });
    A.sfx('treefall'); G.shake(3);
    setTimeout(() => {
      if (!G.map || G.map !== m) return;
      const n = U.ri(6, 10) + (St.skillLevel(S, 'forage') >= 7 && Math.random() < 0.1 ? 8 : 0);
      for (let i = 0; i < n; i++) G.spawnDrop('wood', 1, cx + (Math.random() - 0.5) * 16, cy - 8);
      if (Math.random() < 0.55 + (St.skillLevel(S, 'forage') >= 4 ? 0.2 : 0)) G.spawnDrop('sap', U.ri(1, 2), cx, cy - 8);
      if (Math.random() < 0.25 && o.k !== 'palm') G.spawnDrop('seed_nabo', 0, cx, cy); // slot reservado
      G.fx.burst(cx, cy - 6, 24, { col: o.k === 'pine' ? ['#2f8040', '#3d9a52'] : ['#5db644', '#7ccc55', '#e0862c'], speed: 70, up: 30, life: 0.9 });
      if (m.id === 'farm' || true) { m.setObj(o.x, o.y, O.stump()); }
      G.xp('forage', 14); S.stats.trees = (S.stats.trees || 0) + 1;
      if (Math.random() < 0.3) { const q = D.Story; }
    }, 600);
  };
  G.cutWeed = function (o) {
    const m = G.map, S = G.S, cx = o.x * T + 8, cy = o.y * T + 8;
    m.delObj(o.x, o.y);
    A.sfx('swing', { vol: 0.4 }); G.fx.burst(cx, cy, 6, { col: ['#6fb04a', '#8fd05a', '#4a9a3a'], speed: 42, up: 24, life: 0.5, size: 1 });
    if (o.t === 'gtall') { if (Math.random() < 0.4) G.spawnDrop('hay', 1, cx, cy); if (Math.random() < 0.5) G.spawnDrop('fiber', 1, cx, cy); }
    else if (Math.random() < 0.55) G.spawnDrop('fiber', 1, cx, cy);
    if (Math.random() < 0.04) G.spawnDrop(U.pick(['seed_nabo', 'seed_batata', 'seed_alho']), 1, cx, cy);
    G.xp('forage', 1);
  };
  G.pickUpPlaced = function (o) {
    const m = G.map, S = G.S, cx = o.x * T + 8, cy = o.y * T + 8;
    let id = null;
    if (o.t === 'fence') id = o.tier ? 'fence2' : 'fence';
    else if (o.t === 'chest') { if (o.items.some(i => i)) { UI().toast('Esvazie o baú primeiro.', 'warn', 'chest'); return; } id = o.kind === 'big' ? 'chest_big' : 'chest'; if (o.kind === 'treasure' || o.kind === 'normal' && !o.placed) { if (!o.placed) return; } }
    else if (o.t === 'machine') { if (o.busy || o.ready) { UI().toast('A máquina está em uso.', 'warn', o.k); return; } id = o.k; }
    else if (o.t === 'furn' && o.k === 'plant' && o.placed) id = 'flower_pot';
    else if (o.t === 'deco' && o.k === 'lamp' && o.placed) id = 'lantern_deco';
    else return;
    m.delObj(o.x, o.y);
    G.give({ id, n: 1 }, cx, cy); A.sfx('pickup'); G.fx.burst(cx, cy, 5, { col: ['#c8955a', '#fff'], speed: 30 });
  };

  /* ---------- picareta ---------- */
  G.usePick = function (t, tier) {
    const m = G.map, S = G.S, o = m.mainObj(t.x, t.y); const power = [2, 3, 4, 5][tier] + (St.skillLevel(S, 'mine') >= 1 ? 0 : 0);
    const key = m.key(t.x, t.y);
    if (!o) {
      if (m.soil.has(key)) { m.soil.delete(key); A.sfx('hoe', { vol: 0.5 }); G.fx.burst(t.x * T + 8, t.y * T + 8, 6, { col: ['#6d4a30', '#8a6040'], speed: 30, up: 20 }); return; }
      const k = m.kind(t.x, t.y); const ge = (m.groundEdits || []).findIndex(e => e[0] === t.x && e[1] === t.y);
      if (ge >= 0 && (k === 'wood' || k === 'cobble')) { const edit = m.groundEdits[ge]; m.groundEdits.splice(ge, 1); m.ground[t.y][t.x] = edit[3] || 'grass'; VV.Art.Tiles.refresh(m, t.x, t.y); G.give({ id: k === 'wood' ? 'path_wood' : 'path_stone', n: 1 }, t.x * T + 8, t.y * T + 8); A.sfx('mine', { vol: 0.5 }); return; }
      A.sfx('swing', { vol: 0.5 }); return;
    }
    const cx = o.x * T + 8, cy = o.y * T + 8;
    switch (o.t) {
      case 'rock': {
        o.hp -= power; o.shake = 0.25; (m._shaking = m._shaking || []).push(o);
        A.sfx('mine'); G.shake(0.8);
        const rc = o.cave ? ['#6c6684', '#8a84a4', '#4c4662'] : ['#9d979a', '#bdb7ba', '#756f74'];
        G.fx.burst(cx, cy, 6, { col: rc, speed: 50, up: 30, life: 0.5 });
        if (o.hp <= 0) G.breakRock(o);
        return;
      }
      case 'debris': if (o.item === 'stone') { m.delObj(o.x, o.y); G.spawnDrop('stone', 1, cx, cy); A.sfx('mine', { vol: 0.6 }); G.fx.burst(cx, cy, 5, { col: ['#9d979a'], speed: 30, up: 20 }); } return;
      case 'weed': case 'gtall': G.cutWeed(o); return;
      case 'crop': if (o.dead) { m.delObj(o.x, o.y); } return;
      case 'machine': case 'chest': case 'furn': case 'fence': G.pickUpPlaced(o); return;
    }
    A.sfx('swing', { vol: 0.4 });
  };
  G.breakRock = function (o) {
    const m = G.map, S = G.S, cx = o.x * T + 8, cy = o.y * T + 8;
    m.delObj(o.x, o.y); A.sfx('break'); G.shake(1.5);
    G.fx.burst(cx, cy, o.big ? 22 : 12, { col: o.cave ? ['#6c6684', '#8a84a4', '#4c4662'] : ['#9d979a', '#bdb7ba', '#756f74'], speed: 70, up: 40, life: 0.7, size: 3 });
    const lv = St.skillLevel(S, 'mine'); const bonus = lv >= 2 ? 1 : 0;
    const drop = (id, n) => { for (let i = 0; i < n; i++) G.spawnDrop(id, 1, cx + (Math.random() - 0.5) * 10, cy); };
    let xp = 2;
    if (o.big) { drop('stone', U.ri(4, 7)); if (Math.random() < 0.3) drop('coal', U.ri(1, 2)); if (Math.random() < 0.35 + (lv >= 8 ? 0.1 : 0)) drop(o.cave ? 'geode' : 'geode', 1); if (Math.random() < 0.2) drop('copper_ore', U.ri(1, 3)); xp = 10; }
    else switch (o.ore) {
      case 'stone': drop('stone', 1 + (Math.random() < 0.3 ? bonus : 0) + (Math.random() < 0.1 ? 1 : 0)); if (Math.random() < 0.025 + (lv >= 3 ? 0.03 : 0)) drop('coal', 1); xp = 1; break;
      case 'coal': drop('coal', 1 + (lv >= 3 ? 1 : 0) * (Math.random() < 0.4 ? 1 : 0)); xp = 3; break;
      case 'copper_ore': case 'iron_ore': case 'gold_ore': { const n = U.ri(1, 2) + (lv >= 7 && Math.random() < 0.1 ? 2 : 0); drop(o.ore, n); xp = { copper_ore: 5, iron_ore: 9, gold_ore: 16 }[o.ore]; drop('stone', 1); break; }
      default: { const gem = D.ITEMS[o.ore]; drop(o.ore, 1); if (lv >= 5 && Math.random() < 0.15) drop(o.ore, 1); xp = gem && gem.gem ? 12 : 8; if (o.ore === 'geode' || o.ore === 'frozen_geode') xp = 6; }
    }
    G.xp('mine', xp); S.stats.rocks = (S.stats.rocks || 0) + 1;
  };

  /* ---------- foice ---------- */
  G.useScythe = function (t) {
    const m = G.map, p = G.player, d = DIRV[p.dir]; let hit = 0;
    const perp = [d[1], d[0]];
    for (let w = -1; w <= 1; w++) for (let k = 0; k <= 1; k++) {
      const x = t.x + perp[0] * w - d[0] * (k ? 0 : 0) + (k ? 0 : 0), y = t.y + perp[1] * w;
      const o = m.getObj(x, y);
      if (o && (o.t === 'weed' || o.t === 'gtall')) { G.cutWeed(o); hit++; }
      else if (o && o.t === 'crop' && o.dead) { m.delObj(x, y); hit++; }
      else if (o && o.t === 'crop' && o.stage >= 4 && (D.CROPS[o.c].flower)) { G.harvestCrop(o); hit++; }
    }
    A.sfx('swing', { vol: 0.6 });
    // arco visual
    const cx = p.x + d[0] * 16, cy = p.y - 8 + d[1] * 14;
    G.fx.burst(cx, cy, 4, { col: ['#fff', '#d8f0c0'], speed: 40, g: 0, life: 0.25, size: 1 });
  };

  /* ============================================================
     Agricultura
     ============================================================ */
  G.plantSeed = function (it, def) {
    const S = G.S, m = G.map, t = G.targetTile(); G.faceTile(t);
    const soil = m.soil.get(m.key(t.x, t.y));
    if (!soil || m.getObj(t.x, t.y)) { A.sfx('error', { vol: 0.4 }); G.cooldown.use = 0.2; return; }
    const crop = D.CROPS[def.seed];
    if (!crop) return;
    if (!m.greenhouse && !crop.seasons.includes(St.season(S))) { UI().toast(`${crop.n} não cresce na ${D.SEASONS[St.season(S)]}.`, 'warn', it.id); A.sfx('error', { vol: 0.5 }); G.cooldown.use = 0.4; return; }
    G.swing(null, () => {
      const dying = false;
      m.setObj(t.x, t.y, { t: 'crop', c: def.seed, stage: 0, grow: 0, dead: false, fert: soil.fert || 0, speed: soil.speed || 0, planted: S.day });
      St.removeItem(S, it.id, 1);
      A.sfx('plant'); G.fx.burst(t.x * T + 8, t.y * T + 10, 6, { col: ['#6d4a30', '#8a6040'], speed: 20, up: 20 });
      S.stats.planted = (S.stats.planted || 0) + 1; G.xp('farm', 1);
      UI().refreshHud();
    }, 0.2, 0.3);
  };
  G.applyFertilizer = function (it) {
    const S = G.S, m = G.map, t = G.targetTile(); G.faceTile(t);
    const soil = m.soil.get(m.key(t.x, t.y)); const o = m.getObj(t.x, t.y);
    if (!soil || (o && o.stage > 0)) { A.sfx('error', { vol: 0.4 }); G.cooldown.use = 0.3; return; }
    if (it.id === 'fertilizer') { if (soil.fert) { UI().toast('Este solo já está fertilizado.', 'warn'); return; } soil.fert = 1; }
    else if (it.id === 'fert2') soil.fert = 2;
    else if (it.id === 'speedgro') { soil.speed = 1; }
    else if (it.id === 'moss') { soil.moss = 3; }
    St.removeItem(S, it.id, 1); A.sfx('plant'); G.fx.burst(t.x * T + 8, t.y * T + 8, 8, { col: ['#c8a878', '#a8d878'], speed: 30, up: 20 }); UI().refreshHud();
    G.cooldown.use = 0.25;
  };
  G.rollQuality = function (fert) {
    const S = G.S, lv = St.skillLevel(S, 'farm'); const r = Math.random();
    const gold = 0.01 + lv * 0.012 + fert * 0.06 + St.luck(S) * 0.01;
    const silver = 0.05 + lv * 0.03 + fert * 0.1;
    if (fert >= 2 && r < gold * 0.4) return 3;
    if (r < gold) return 2; if (r < gold + silver) return 1; return 0;
  };
  G.harvestCrop = function (o) {
    const S = G.S, m = G.map, c = D.CROPS[o.c]; if (!c || o.dead || o.stage < 4) return false;
    const q = G.rollQuality(o.fert || 0);
    let n = 1; if (St.skillLevel(S, 'farm') >= 6 && Math.random() < 0.1) n = 2;
    if (!St.hasRoom(S, { id: o.c, n, q })) { UI().toast('Mochila cheia!', 'bad', 'sack'); A.sfx('error', { vol: 0.5 }); return false; }
    St.addItem(S, { id: o.c, n, q });
    const cx = o.x * T + 8, cy = o.y * T + 4;
    A.sfx('harvest'); G.fx.burst(cx, cy, 10, { col: [c.f, '#fff', c.l], speed: 50, up: 40, life: 0.6 });
    G.fx.text(cx, cy - 14, `+${n} ${c.n}`, q === 2 ? '#ffd23f' : q === 1 ? '#c8d4e8' : '#fff');
    S.stats.harvested = (S.stats.harvested || 0) + n; G.xp('farm', c.xp);
    G.player.carry = { id: o.c }; G.player.carryT = 0.6;
    if (c.reg) { o.stage = 3; o.grow = c.days - c.reg; } else m.delObj(o.x, o.y);
    UI().refreshHud();
    return true;
  };
  G.harvestBush = function (o) {
    const S = G.S; if (!o.berry || !o.grown) return false;
    const q = Math.random() < 0.05 + St.skillLevel(S, 'forage') * 0.02 ? 2 : 0;
    const n = 1 + (St.skillLevel(S, 'forage') >= 4 && Math.random() < 0.4 ? 1 : 0);
    G.give({ id: o.berry, n, q }, o.x * T + 8, o.y * T); o.grown = false; A.sfx('harvest'); G.xp('forage', 5);
    G.fx.burst(o.x * T + 8, o.y * T + 4, 8, { col: ['#d8392d', '#fff'], speed: 36, up: 30 });
    return true;
  };

  /* ============================================================
     Colocar itens
     ============================================================ */
  G.canPlace = function (def, t) {
    const m = G.map, o = m.getObj(t.x, t.y), p = G.player;
    if (!m.inb(t.x, t.y) || o || m.solidAt(t.x, t.y)) return false;
    const k = m.kind(t.x, t.y);
    if (m.isWater(t.x, t.y)) return false;
    if (def.place === 'path_wood' || def.place === 'path_stone') return m.outdoor && !m.isMine && ['grass', 'path', 'sand'].includes(k) && !m.soil.has(m.key(t.x, t.y));
    if (m.soil.has(m.key(t.x, t.y)) && !['sprinkler', 'sprinkler2', 'scarecrow', 'fence', 'fence2', 'torch'].includes(def.place)) return false;
    if (m.indoor && ['hive', 'scarecrow', 'sprinkler', 'sprinkler2', 'fence', 'fence2'].includes(def.place) && !m.greenhouse) return false;
    if (def.place === 'hive' && m.id !== 'farm') return false;
    if (m.outdoor && m.id !== 'farm' && !m.isMine && !['torch', 'chest', 'chest_big'].includes(def.place) && def.place !== 'bomb') return false;
    if (m.id === 'farm' && (Math.hypot(t.x - 8, t.y - 9) < 1.5)) return false;
    // não permitir sobre porta
    if (m.warps.some(w => t.x >= w.x && t.x < w.x + w.w && t.y >= w.y && t.y < w.y + w.h)) return false;
    return true;
  };
  G.placeItem = function (it, def) {
    const S = G.S, m = G.map, t = G.targetTile(); G.faceTile(t);
    if (def.use === 'bomb') return G.dropBomb(it, t);
    if (!G.canPlace(def, t)) { A.sfx('error', { vol: 0.4 }); G.cooldown.use = 0.25; return; }
    const id = def.place; let obj = null;
    switch (id) {
      case 'chest': obj = { t: 'chest', solid: 1, items: [], cap: 36, kind: 'normal', placed: 1 }; break;
      case 'chest_big': obj = { t: 'chest', solid: 1, items: [], cap: 70, kind: 'big', placed: 1 }; break;
      case 'fence': obj = { t: 'fence', solid: 1, tier: 0, hp: 10 }; break;
      case 'fence2': obj = { t: 'fence', solid: 1, tier: 1, hp: 24 }; break;
      case 'path_wood': case 'path_stone': {
        const prev = m.ground[t.y][t.x]; m.ground[t.y][t.x] = id === 'path_wood' ? 'wood' : 'cobble'; (m.groundEdits = m.groundEdits || []).push([t.x, t.y, m.ground[t.y][t.x], prev]);
        VV.Art.Tiles.refresh(m, t.x, t.y); St.removeItem(S, it.id, 1); A.sfx('plant', { vol: 0.6 }); UI().refreshHud(); G.cooldown.use = 0.12; return;
      }
      case 'lantern_deco': obj = { t: 'deco', k: 'lamp', solid: 1, placed: 1 }; m.lights.push({ x: t.x * T + 8, y: t.y * T - 18, r: 70, col: '#ffe0a0', night: 1, a: 0.8, placedAt: [t.x, t.y] }); break;
      case 'flower_pot': obj = { t: 'furn', k: 'plant', solid: 1, placed: 1, fw: 1, fh: 1 }; break;
      default: obj = { t: 'machine', k: id, solid: 1, busy: false, ready: false, out: null, readyAt: 0 }; if (id === 'hive') { obj.busy = true; obj.readyAt = G.absMin() + 1440 * 3; obj.out = { id: 'honey', n: 1 }; }
    }
    St.removeItem(S, it.id, 1);
    m.setObj(t.x, t.y, obj);
    A.sfx(id.startsWith('chest') ? 'open' : 'craft', { vol: 0.6 }); G.fx.burst(t.x * T + 8, t.y * T + 10, 6, { col: ['#c8955a', '#fff'], speed: 30, up: 14 });
    UI().refreshHud(); G.cooldown.use = 0.18;
  };
  G.dropBomb = function (it, t) {
    const S = G.S; St.removeItem(S, it.id, 1); UI().refreshHud();
    G.effects.push({ type: 'bomb', x: t.x * T + 8, y: t.y * T + 10, t: 0, life: 1.4, fuse: 1.2, r: 2 });
    A.sfx('click'); G.cooldown.use = 0.3;
  };
  G.explode = function (e) {
    const m = G.map, S = G.S, tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
    A.sfx('bomb'); G.shake(8);
    G.effects.push({ type: 'flash', x: e.x, y: e.y - 4, t: 0, life: 0.3, r: 40, col: '#ffe9a0' });
    G.fx.burst(e.x, e.y - 4, 40, { col: ['#ffb040', '#ff6a2a', '#555', '#ffe9a0'], speed: 130, up: 20, life: 0.8, size: 3 });
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      if (i * i + j * j > 11) continue;
      const o = m.mainObj(tx + i, ty + j);
      if (o && (o.t === 'rock')) { o.hp = 0; G.breakRock(o); }
      else if (o && (o.t === 'weed' || o.t === 'gtall' || o.t === 'debris')) m.delObj(o.x, o.y);
      else if (o && o.t === 'stump') { m.delObj(o.x, o.y); G.spawnDrop('wood', 3, o.x * T + 8, o.y * T + 8); }
    }
    for (const mo of G.monsters) { const d = Math.hypot(mo.x - e.x, mo.y - e.y); if (d < 52) { mo.hit(Math.round(40 + St.attackBonus(S) * 2), (mo.x - e.x) / (d || 1), (mo.y - e.y) / (d || 1), G); } }
    const p = G.player; const dp = Math.hypot(p.x - e.x, p.y - e.y); if (dp < 46) G.hurtPlayer(Math.round(25 - dp * 0.2), e.x, e.y);
  };
  const origUpdate = G.updateWorld;
  G.updateWorld = function (dt, blocked) {
    origUpdate(dt, blocked);
    for (const e of G.effects) if (e.type === 'bomb' && !e.boom) { e.fuse -= dt; if (e.fuse <= 0) { e.boom = true; G.explode(e); e.t = e.life; } }
  };

  /* ============================================================
     Comer
     ============================================================ */
  G.eat = function () {
    const S = G.S, it = St.held(S); if (!it) return false;
    const def = D.ITEMS[it.id]; if (!def || !(def.food || def.id === 'estrelafruta')) return false;
    let e = def.e || 0, h = def.h || 0;
    if (def.gen) { const f = D.ITEMS[it.from]; e = Math.floor((f ? f.p : 60) * 0.5); h = Math.floor(e * 0.4); }
    if (it.id === 'estrelafruta') { S.maxEnergy = Math.min(270, S.maxEnergy + 20); e = 100; h = 40; UI().toast('Energia máxima +20!', 'good', 'star'); }
    if (e + h <= 0) { UI().toast('Isso não pode ser comido.', 'warn'); return true; }
    St.removeItem(S, it.id, 1);
    S.energy = Math.min(S.maxEnergy, S.energy + e); S.hp = Math.min(S.maxHp, S.hp + h);
    A.sfx('eat'); const p = G.player;
    if (e) G.fx.text(p.x, p.y - 26, `+${e} Energia`, '#ffe14a');
    if (h) G.fx.text(p.x, p.y - 36, `+${h} Vida`, '#ff7a8a');
    if (def.buff) { S.buffs = S.buffs.filter(b => b.stat !== def.buff.stat); S.buffs.push({ stat: def.buff.stat, val: def.buff.val, left: def.buff.dur, name: def.n }); UI().toast(`${D.BUFFS[def.buff.stat]} +${def.buff.val}`, 'good', it.id); }
    p.carry = { id: it.id }; p.carryT = 0.5; p.useT = 0.4; p.useMax = 0.4; p.tool = null; G.cooldown.use = 0.4;
    UI().refreshHud();
    return true;
  };

  /* ============================================================
     Interação (tecla E)
     ============================================================ */
  G.interact = function () {
    const S = G.S, p = G.player, m = G.map;
    const t = G.targetTile(); const ft = G.facingTile();
    const held = St.held(S), hdef = held && D.ITEMS[held.id];
    // Lumi
    const L = G.lumi; if (L.visible && L.map === m.id && Math.hypot(L.x - p.x, L.y - 8 - p.y) < 40) { G.talkLumi(); return; }
    // NPCs / animais próximos à frente
    const d = DIRV[p.dir]; const fx = p.x + d[0] * 12, fy = p.y - 4 + d[1] * 10;
    let best = null, bd = 22;
    for (const n of G.npcs) { if (n.map !== m.id || n.hidden) continue; const dd = Math.hypot(n.x - fx, (n.y - 6) - fy); if (dd < bd) { bd = dd; best = { npc: n }; } }
    if (G.spouseNpc && G.spouseNpc.map === m.id && !G.npcs.includes(G.spouseNpc)) { const dd = Math.hypot(G.spouseNpc.x - fx, (G.spouseNpc.y - 6) - fy); if (dd < bd) { bd = dd; best = { npc: G.spouseNpc }; } }
    for (const a of G.animals) { if (a.map !== m.id) continue; const dd = Math.hypot(a.x - fx, (a.y - 6) - fy); if (dd < bd) { bd = dd; best = { an: a }; } }
    if (best && best.npc) { G.interactNpc(best.npc); return; }
    if (best && best.an) { G.interactAnimal(best.an); return; }
    // pet
    if (G.pet && G.pet.map === m.id && Math.hypot(G.pet.x - fx, G.pet.y - fy) < 16) { G.petPet(); return; }
    // objeto na frente (e no tile sob o jogador para forrageáveis)
    const o = m.mainObj(t.x, t.y) || m.mainObj(ft.x, ft.y);
    if (o) { if (G.interactObj(o, t)) return; }
    // balcões e lojas: NPC atrás do balcão (alcance 2)
    const o2 = m.mainObj(ft.x + d[0], ft.y + d[1]);
    if (o2 && o2.t === 'furn' && o2.shop && G.interactObj(o2, t)) return;
    // comer
    if (held && hdef && (hdef.food || held.id === 'estrelafruta')) { G.eat(); return; }
  };

  G.interactObj = function (o, t) {
    const S = G.S, m = G.map, p = G.player;
    switch (o.t) {
      case 'crop': if (o.dead) { UI().toast('A planta secou. Use a foice para limpar.', 'warn'); return true; } if (o.stage >= 4) return G.harvestCrop(o); { const c = D.CROPS[o.c]; const left = Math.max(0, Math.ceil(c.days - o.grow)); UI().toast(`${c.n}: ${left} dia${left === 1 ? '' : 's'} para colher`, 'info', o.c); } return true;
      case 'bush': if (o.berry && o.grown) return G.harvestBush(o); return false;
      case 'forage': { const q = Math.random() < 0.04 + St.skillLevel(S, 'forage') * 0.02 ? 2 : (Math.random() < 0.12 ? 1 : 0); const inst = { id: o.item, n: 1, q: o.q || q }; if (!St.hasRoom(S, inst)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return true; } St.addItem(S, inst); m.delObj(o.x, o.y); A.sfx('pickup'); G.fx.text(o.x * T + 8, o.y * T - 6, `+1 ${D.ITEMS[o.item].n}`, '#fff'); G.fx.burst(o.x * T + 8, o.y * T + 6, 6, { col: ['#fff', '#ffe66a'], speed: 30, up: 20, size: 1 }); G.xp('forage', 3); S.stats.foraged = (S.stats.foraged || 0) + 1; UI().refreshHud(); return true; }
      case 'chest': o.open = true; A.sfx('open'); UI().openChest(o); return true;
      case 'machine': return G.machineInteract(o);
      case 'bin': UI().openBin(); return true;
      case 'deco':
        if (o.k === 'well') { G.useWell(); return true; }
        if (o.board || (o.k === 'sign' && m.id === 'town')) { UI().openBoard(); return true; }
        if (o.k === 'sign') { UI().sign(G.signText(m)); return true; }
        if (o.k === 'stall') { UI().sign('Barraca da feira. Vazia hoje.'); return true; }
        if (o.k === 'fountain') { UI().sign('Uma fonte de pedra. A água é clara e fria. Dizem que dá sorte jogar uma moeda...'); return true; }
        if (o.k === 'mailbox') { UI().openMail(); return true; }
        if (o.k === 'bench') { UI().sign('Um banco confortável. Você descansa por um instante.'); S.energy = Math.min(S.maxEnergy, S.energy + 2); UI().refreshHud(); return true; }
        return false;
      case 'board': UI().openBoard(); return true;
      case 'furn':
        if (o.act === 'bed') { G.sleepInBed(); return true; }
        if (o.act === 'cook') { UI().openCook(); return true; }
        if (o.shop) return G.openShopFor(o);
        if (o.k === 'tv') { UI().sign(G.tvText()); return true; }
        if (o.k === 'shelf') { UI().sign('Livros sobre agricultura, receitas antigas e uma coleção de poesia da Vovó Alba.'); return true; }
        return false;
      case 'pedestal': UI().openBundle(o.b); return true;
      case 'altar': UI().altarInfo(); return true;
      case 'trough': G.feedTrough(); return true;
      case 'hopper': G.hopper(); return true;
      case 'tree': if (o.stage >= 4 && Math.random() < 0.0) return false; return false;
    }
    return false;
  };
  G.signText = function (m) {
    return ({ farm: 'Fazenda da Vovó Alba', town: 'Vila Luzerna — Mercado, Cantina, Clínica, Floricultura, Forja e Oficina.', mountain: 'Montanha Pedregosa — Guilda dos Exploradores. Mina ao norte. Cuidado com os monstros!', beach: 'Praia da Maré — Ótimo lugar para pescar!' })[m.id] || 'Uma placa de madeira.';
  };
  G.tvText = function () {
    const S = G.S, w = G.weatherName(S.nextWeather || 'sun');
    return `Previsão do Tempo de Amanhã: ${w}.\n${U.pick(D.Story.tips)}`;
  };
  G.useWell = function () {
    const S = G.S; S.can.water = G.canMax(); S.can.max = G.canMax(); A.sfx('splash', { vol: 0.5 });
    UI().toast('Regador cheio!', 'info', 'can'); UI().refreshHud();
  };

  /* ============================================================
     Pesca
     ============================================================ */
  G.castRod = function (it) {
    const S = G.S, p = G.player, m = G.map;
    const d = DIRV[p.dir]; const ptx = Math.floor(p.x / T), pty = Math.floor((p.y - 2) / T);
    let wx = -1, wy = -1;
    for (let i = 1; i <= 6; i++) { const x = ptx + d[0] * i, y = pty + d[1] * i; if (!m.inb(x, y)) break; if (m.isWater(x, y) && !(m.getObj(x, y) && m.getObj(x, y).t === 'dock')) { wx = x; wy = y; break; } if (m.solidAt(x, y) && !m.isWater(x, y)) break; }
    if (wx < 0) { UI().toast('Fique de frente para a água para pescar.', 'info', 'rod'); A.sfx('error', { vol: 0.4 }); G.cooldown.use = 0.4; return; }
    if (S.energy < 1) { UI().toast('Você está exausto demais para pescar.', 'bad', 'lamp'); return; }
    // iscas
    let bait = null; if (St.countItem(S, 'lure') > 0) bait = 'lure'; else if (St.countItem(S, 'bait') > 0) bait = 'bait';
    S.energy = Math.max(0, S.energy - 1.2); UI().refreshHud();
    p.fishing = true; p.tool = it; p.useT = 0.5; p.useMax = 0.5; p.act = null;
    p.fish = { state: 'cast', t: 0, bx: wx * T + 8, by: wy * T + 8, wx, wy, bait, fishId: null };
    A.sfx('cast');
    G.fx.burst(wx * T + 8, wy * T + 8, 10, { col: ['#bde6ff', '#fff'], speed: 36, up: 24, life: 0.5, size: 1 });
  };
  G.cancelFishing = function () { const p = G.player; p.fishing = false; p.fish = { state: 'none' }; p.tool = null; p.useT = 0; G.cooldown.use = 0.3; };
  G.updateFishing = function (dt) {
    const S = G.S, p = G.player, f = p.fish, m = G.map;
    f.t += dt;
    if (f.state === 'cast') {
      if (f.t > 0.45) {
        f.state = 'wait'; f.t = 0;
        const lv = St.skillLevel(S, 'fish');
        f.waitFor = U.clamp(2.5 + Math.random() * 5 - (f.bait ? 1.5 : 0) - lv * 0.2 - (St.buff(S, 'fish') * 0.4) - (G.weather === 'rain' ? 0.8 : 0), 1, 9);
        A.sfx('splash', { vol: 0.5 });
      }
    } else if (f.state === 'wait') {
      p.useT = 0.1; p.useMax = 0.3;
      if (f.t > f.waitFor) {
        const fish = G.pickFish(f);
        f.fish = fish; f.state = 'bite'; f.t = 0; f.fishId = fish.id;
        if (f.bait) { St.removeItem(S, f.bait, 1); UI().refreshHud(); }
        A.sfx('bite'); G.fx.burst(f.bx, f.by, 8, { col: ['#bde6ff', '#fff'], speed: 36, up: 24, life: 0.4, size: 1 });
      }
    } else if (f.state === 'bite') {
      p.useT = 0.1; p.useMax = 0.3;
      if (f.t > 0.95 + St.skillLevel(S, 'fish') * 0.03) { UI().toast('O peixe escapou...', 'warn', 'fish'); G.cancelFishing(); }
    } else if (f.state === 'play') {
      p.useT = 0.1; p.useMax = 0.3;
      // física da barra
      const hold = Inp.held('use') || Inp.mouse.left;
      f.vel += (hold ? 1.6 : -1.3) * dt * (hold && f.vel < 0 ? 2.2 : 1);
      f.vel = U.clamp(f.vel, -1.1, 1.1);
      f.bar += f.vel * dt; if (f.bar < f.barH / 2) { f.bar = f.barH / 2; f.vel = Math.max(0, f.vel * -0.3); } if (f.bar > 1 - f.barH / 2) { f.bar = 1 - f.barH / 2; f.vel = Math.min(0, f.vel * -0.3); }
      // peixe se move
      f.tm -= dt;
      if (f.tm <= 0) { f.tgt = Math.random(); f.tm = 0.5 + Math.random() * (1.4 - f.diff * 0.1); }
      const sp = f.fspeed;
      f.pos += U.clamp(f.tgt - f.pos, -sp * dt, sp * dt);
      if (Math.random() < dt * f.diff * 0.15) f.pos = U.clamp(f.pos + (Math.random() - 0.5) * 0.3, 0, 1);
      const inside = Math.abs(f.pos - f.bar) < f.barH / 2 + 0.02;
      f.prog += (inside ? 0.26 : -0.17) * dt * (1 - f.diff * 0.02);
      if (!inside) f.perfect = false;
      if (inside && Math.random() < dt * 6) A.sfx('reel', { vol: 0.4 });
      if (f.prog >= 1) G.catchFish(f);
      else if (f.prog <= 0) { UI().toast('O peixe se soltou!', 'warn', 'fish'); A.sfx('error', { vol: 0.4 }); G.cancelFishing(); }
    }
  };
  G.fishingPress = function () {
    const p = G.player, f = p.fish, S = G.S;
    if (f.state === 'bite') {
      const fish = f.fish; f.state = 'play'; f.t = 0;
      const lv = St.skillLevel(S, 'fish'), rod = (S.inv.find(i => i && i.id === 'rod') || { tier: 0 }).tier || 0;
      f.barH = 0.22 + lv * 0.014 + rod * 0.035 + (lv >= 2 ? 0.03 : 0) + (lv >= 6 ? 0.04 : 0);
      f.bar = 0.5; f.vel = 0; f.pos = 0.5; f.tgt = 0.5; f.tm = 0.3; f.prog = 0.35; f.diff = fish.diff || 2; f.fspeed = 0.18 + f.diff * 0.045; f.perfect = true;
      if (fish.trash) { f.diff = 1; f.fspeed = 0.15; f.prog = 0.6; }
      A.sfx('click'); G.shake(1);
    } else if (f.state === 'wait') { UI().toast('Calma, espere o peixe morder...', 'info'); }
  };
  G.pickFish = function (f) {
    const S = G.S, m = G.map; const z = m.fishLocAt(f.wx, f.wy); const loc = z.loc;
    const hr = S.min / 60, sea = St.season(S); const rain = G.weather === 'rain' || G.weather === 'storm';
    const lv = St.skillLevel(S, 'fish');
    const pool = [];
    for (const id in D.FISH) {
      const fi = D.FISH[id];
      if (!fi.loc.includes(loc)) continue;
      if (!fi.seasons.includes(sea) && !m.isMine) continue;
      const t0 = fi.time[0], t1 = fi.time[1]; const hh = hr < 6 ? hr + 24 : hr;
      if (hh < t0 || hh >= t1) continue;
      if (fi.wx === 'rain' && !rain) continue;
      if (fi.legend) { if (S.flags['legend_' + id]) continue; if (loc === 'lake' && !z.legend && m.id !== 'forest') continue; if (Math.random() > 0.02 + St.luck(S) * 0.005 + (f.bait === 'lure' ? 0.02 : 0)) continue; }
      let w = 10 - fi.diff * 0.7 + (f.bait === 'lure' ? fi.diff * 0.5 : 0) + (rain ? 1 : 0);
      if (lv >= 8 && fi.diff >= 6) w *= 1.4;
      pool.push({ fi, w: Math.max(0.5, w) });
    }
    // lixo
    const trashW = Math.max(0.5, 3 - lv * 0.25 - (f.bait ? 0.8 : 0));
    let tot = pool.reduce((a, b) => a + b.w, 0) + trashW; let r = Math.random() * tot;
    for (const e of pool) { r -= e.w; if (r <= 0) return Object.assign({}, e.fi); }
    const tr = U.pick(['trash_boot', 'trash_algae', 'trash_can']);
    return { id: tr, trash: 1, diff: 1 };
  };
  G.catchFish = function (f) {
    const S = G.S, p = G.player, fish = f.fish;
    const lv = St.skillLevel(S, 'fish');
    let q = 0; if (!fish.trash) { const r = Math.random(); const base = f.perfect ? 0.25 : 0.0; if (r < base * 0.3 + lv * 0.01) q = 2; else if (r < base + lv * 0.03) q = 1; }
    const inst = { id: fish.id, n: 1, q };
    G.cancelFishing();
    if (!St.hasRoom(S, inst)) G.drops.push(new Ent.Drop(inst, p.x, p.y - 6)); else St.addItem(S, inst);
    A.sfx('levelup', { vol: 0.3 }); A.sfx('pickup');
    p.carry = { id: fish.id }; p.carryT = 1.1; p.useT = 0.5; p.useMax = 0.5; p.tool = null;
    G.fx.burst(f.bx, f.by, 16, { col: ['#bde6ff', '#fff', '#8ac0ea'], speed: 60, up: 50, life: 0.7 });
    const nm = D.ITEMS[fish.id].n;
    if (fish.trash) { UI().toast(`Você pescou: ${nm}`, 'info', fish.id); G.xp('fish', 1); }
    else {
      S.stats.fishCaught = (S.stats.fishCaught || 0) + 1; S.fish[fish.id] = (S.fish[fish.id] || 0) + 1;
      if (fish.legend) { S.flags['legend_' + fish.id] = 1; S.stats.legends = (S.stats.legends || 0) + 1; UI().banner('PEIXE LENDÁRIO!', nm); A.sfx('achieve'); }
      UI().toast(`Pescou: ${nm}${q ? ' (' + D.QUALITY[q] + ')' : ''}${f.perfect ? ' — PERFEITO!' : ''}`, 'good', fish.id);
      G.xp('fish', Math.round(4 + fish.diff * 2.4 + (f.perfect ? 4 : 0)));
      if (G.fishingContest) G.fishingContest(fish);
      // tesouro
      if (lv >= 6 && Math.random() < 0.06) { const loot = U.pick([['gold_bar', 1], ['geode', 2], ['lure', 3], ['diamond', 1], ['ring_luck', 1]]); G.give({ id: loot[0], n: loot[1] }); UI().toast(`Tesouro! ${D.ITEMS[loot[0]].n}`, 'good', loot[0]); }
    }
    UI().refreshHud();
  };

  /* ============================================================
     Combate
     ============================================================ */
  G.weaponStats = function (it, def) {
    let dmg = def.dmg; let crit = def.crit || 0.04;
    if (it.id === 'sword') { const t = it.tier || 0; dmg = [[4, 7], [7, 11], [10, 15], [14, 20]][t]; crit = 0.04 + t * 0.02; }
    return { dmg, crit };
  };
  G.swingWeapon = function (it, def) {
    const S = G.S, p = G.player; const st = G.weaponStats(it, def);
    const dur = def.slow ? 0.5 : 0.28;
    A.sfx('swing', { vol: 0.8 });
    G.swing(it, () => {
      const d = DIRV[p.dir]; const cx = p.x + d[0] * 14, cy = p.y - 8 + d[1] * 12;
      let hit = 0;
      for (const mo of G.monsters) {
        if (mo.dead || mo.hidden) { if (!mo.dead && mo.hidden && Math.hypot(mo.x - cx, mo.y - cy) < 16) { A.sfx('click'); } continue; }
        const dx = mo.x - cx, dy = (mo.y - 5) - cy;
        const rx = (d[0] ? 18 : 24) + mo.hw, ry = (d[1] ? 18 : 24) + mo.hh;
        if (Math.abs(dx) < rx && Math.abs(dy) < ry) {
          let dmg = U.ri(st.dmg[0], st.dmg[1]) + St.attackBonus(S);
          const crit = Math.random() < st.crit + St.luck(S) * 0.01; if (crit) dmg = Math.round(dmg * (St.skillLevel(S, 'combat') >= 6 ? 2.4 : 2));
          const len = Math.hypot(mo.x - p.x, mo.y - p.y) || 1;
          if (mo.hit(dmg, (mo.x - p.x) / len, (mo.y - p.y) / len, G)) {
            hit++; G.fx.text(mo.x, mo.y - 14 - mo.z, String(dmg), crit ? '#ffd23f' : '#fff', { big: crit });
            G.fx.burst(mo.x, mo.y - 6, crit ? 14 : 8, { col: crit ? ['#ffd23f', '#fff'] : ['#fff', mo.d.col], speed: 70, life: 0.35 });
          }
        }
      }
      // mato e objetos
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const o = G.map.getObj(Math.floor(cx / T) + i, Math.floor(cy / T) + j); if (o && (o.t === 'weed' || o.t === 'gtall') && Math.hypot((o.x * T + 8) - cx, (o.y * T + 8) - cy) < 18) G.cutWeed(o);
      }
      if (hit) { A.sfx('hit'); G.shake(1.5); }
    }, dur, 0.3);
  };
  G.killMonster = function (mo) {
    const S = G.S; mo.dead = true;
    A.sfx('break', { vol: 0.5 });
    G.fx.burst(mo.x, mo.y - 6, mo.boss ? 60 : 16, { col: [mo.d.col, '#fff'], speed: mo.boss ? 130 : 70, up: 20, life: 0.8, size: 3 });
    for (const [id, ch, a, b] of mo.d.drops) {
      if (Math.random() < Math.min(1, ch * (1 + St.luck(S) * 0.04))) { const n = U.ri(a, b); for (let i = 0; i < n; i++) G.spawnDrop(id, 1, mo.x + (Math.random() - 0.5) * 14, mo.y - 4); }
    }
    if (Math.random() < 0.015) G.spawnDrop('geode', 1, mo.x, mo.y);
    S.stats.kills = (S.stats.kills || 0) + 1; G.xp('combat', mo.d.xp);
    if (St.skillLevel(S, 'combat') >= 8 && Math.random() < 0.1) { S.hp = Math.min(S.maxHp, S.hp + 5); G.fx.text(G.player.x, G.player.y - 30, '+5', '#ff7a8a'); }
    if (mo.boss) {
      S.flags.golemSlain = 1; G.shake(10);
      UI().banner('GOLEM DE CRISTAL DERROTADO!', 'O vale ficará mais claro...'); A.sfx('achieve');
      const m = G.map; const t = [m.w >> 1, (m.h >> 1) + 2];
      m.setObj(t[0], t[1], { t: 'chest', solid: 1, items: [{ id: 'crystal_core', n: 1 }, { id: 'diamond', n: 3 }, { id: 'lumi_shard', n: 3 }, { id: 'ring_atk', n: 1 }], cap: 12, kind: 'treasure' });
    }
  };

  /* ============================================================
     Habilidades
     ============================================================ */
  G.xp = function (skill, n) {
    const S = G.S; const lv = St.addXP(S, skill, n);
    if (lv) {
      const sk = D.SKILLS[skill]; G.recalcMaxStats();
      UI().banner(`${sk.n} — Nível ${lv}!`, sk.perks[lv - 1] || ''); A.sfx('levelup');
      G.fx.burst(G.player.x, G.player.y - 10, 24, { col: ['#ffe66a', '#fff', sk.col], speed: 70, up: 50, life: 1 });
      S.stats.maxSkill = Math.max(S.stats.maxSkill || 0, lv);
      if (lv >= 5 && skill !== 'combat') { /* receitas desbloqueadas aparecem automaticamente */ }
    }
  };
})();
