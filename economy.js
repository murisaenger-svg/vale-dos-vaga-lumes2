'use strict';
/* ============================================================
   Economia e fazenda: lojas, caixote, fabricação, culinária, máquinas,
   animais, construções, melhorias de ferramentas e rotinas diárias.
   ============================================================ */
(() => {
  const G = VV.G, U = VV.U, D = VV.Data, St = VV.State, T = 16, A = VV.Audio, Ent = VV.Ent, O = VV.Maps.O;
  const UI = () => VV.UI;

  /* ============================================================
     Lojas
     ============================================================ */
  const KEEPER = { general: 'beto', diner: 'cora', clinic: 'iris', smith: 'tomas', carp: 'ney', flowers: 'luna', guild: 'caio', fish: null };
  const TITLE = { general: 'Mercado Luzerna', diner: 'Cantina Vaga-lume', clinic: 'Clínica', flowers: 'Floricultura', guild: 'Guilda dos Exploradores', fish: 'Cabana de Pesca' };
  G.shopStock = function (kind) {
    const S = G.S;
    if (kind === 'general') return [{ name: 'Sementes', items: D.SHOPS.seeds(St.season(S)) }, { name: 'Geral', items: D.SHOPS.general() }];
    return [{ name: 'Loja', items: (D.SHOPS[kind] || (() => []))() }];
  };
  G.openShopFor = function (o) {
    const S = G.S, kind = o.shop, kp = KEEPER[kind];
    if (kp) { const n = G.npcById(kp); if (!n || n.map !== G.map.id) { UI().toast(`A loja está fechada. ${D.NPCS[kp].name} não está aqui agora.`, 'warn', 'lamp'); A.sfx('error', { vol: 0.4 }); return true; } }
    if (kind === 'carp') { UI().openCarpenter(); return true; }
    if (kind === 'smith') { UI().openSmith(); return true; }
    if (kind === 'clinic') {
      UI().choose({ name: 'Dra. Íris', npc: 'iris', text: 'Como posso ajudar?', options: [{ t: 'Tratamento (50G)', v: 'heal' }, { t: 'Ver a loja', v: 'shop' }], cb: v => { if (v === 'heal') G.clinicHeal(); else UI().openShop({ kind, title: TITLE[kind], npc: kp, tabs: G.shopStock(kind) }); } });
      return true;
    }
    UI().openShop({ kind, title: TITLE[kind] || 'Loja', npc: kp, tabs: G.shopStock(kind), canSell: kind !== 'diner' && kind !== 'clinic' });
    return true;
  };
  G.clinicHeal = function () {
    const S = G.S; if (S.hp >= S.maxHp && S.energy >= S.maxEnergy * 0.95) { UI().toast('Você já está ótimo!', 'info', 'heart'); return; }
    if (S.gold < 50) { UI().toast('Dinheiro insuficiente.', 'bad', 'coin'); A.sfx('error', { vol: 0.5 }); return; }
    S.gold -= 50; S.hp = S.maxHp; S.energy = Math.min(S.maxEnergy, S.energy + Math.floor(S.maxEnergy * 0.4)); A.sfx('heart'); UI().toast('Tratamento concluído.', 'good', 'heart'); UI().refreshHud();
  };
  G.buyItem = function (entry, qty = 1) {
    const S = G.S, price = entry.price * qty;
    if (S.gold < price) { UI().toast('Dinheiro insuficiente.', 'bad', 'coin'); A.sfx('error', { vol: 0.5 }); return false; }
    if (entry.virt === 'rod2') {
      const rod = S.inv.find(i => i && i.id === 'rod'); if (!rod || (rod.tier || 0) >= 3) { UI().toast('Sua vara já está no máximo.', 'info', 'rod'); return false; }
      S.gold -= price; rod.tier = (rod.tier || 0) + 1; A.sfx('coin'); UI().toast(`Vara melhorada! (${D.TIERS[rod.tier]})`, 'good', 'rod'); UI().refreshHud(); return true;
    }
    const inst = { id: entry.item, n: qty }; if (D.ITEMS[entry.item] && D.ITEMS[entry.item].tool) { inst.n = 1; inst.tier = 0; }
    if (!St.hasRoom(S, inst)) { UI().toast('Mochila cheia!', 'bad', 'sack'); A.sfx('error', { vol: 0.5 }); return false; }
    S.gold -= price; St.addItem(S, inst); A.sfx('coin'); S.stats.spent = (S.stats.spent || 0) + price; UI().refreshHud(); return true;
  };
  G.sellValue = inst => { const d = D.ITEMS[inst.id]; return d && !d.tool && d.p > 0 && !d.noSell ? D.sellPrice(inst) : 0; };
  G.sellItem = function (idx, qty) {
    const S = G.S, it = S.inv[idx]; if (!it) return 0; const v = G.sellValue(it); if (!v) { UI().toast('Isso não pode ser vendido.', 'warn'); return 0; }
    const n = Math.min(qty || 1, it.n); const total = v * n; it.n -= n; if (it.n <= 0) S.inv[idx] = null;
    G.earn(total); A.sfx('sell'); S.stats.sold = (S.stats.sold || 0) + n; if (D.CROPS[it.id]) S.stats.cropsSold = (S.stats.cropsSold || 0) + n;
    G.fx.text(G.player.x, G.player.y - 30, `+${total}G`, '#ffe14a'); G.checkQuests(); return total;
  };

  /* ---------- caixote de envio ---------- */
  G.binAdd = function (idx, qty) {
    const S = G.S, it = S.inv[idx]; if (!it) return false; if (!G.sellValue(it)) { UI().toast('Isso não pode ser enviado.', 'warn'); A.sfx('error', { vol: 0.4 }); return false; }
    const n = Math.min(qty || it.n, it.n);
    const k = it.id + '|' + (it.q || 0) + '|' + (it.from || ''); const ex = S.shipping.find(s => s.id + '|' + (s.q || 0) + '|' + (s.from || '') === k);
    if (ex) ex.n += n; else S.shipping.push({ id: it.id, n, q: it.q || 0, from: it.from });
    it.n -= n; if (it.n <= 0) S.inv[idx] = null; A.sfx('click'); UI().refreshHud(); return true;
  };
  G.binTake = function (i) {
    const S = G.S, s = S.shipping[i]; if (!s) return; const inst = { id: s.id, n: s.n, q: s.q, from: s.from };
    if (!St.hasRoom(S, inst)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return; }
    St.addItem(S, inst); S.shipping.splice(i, 1); A.sfx('pickup'); UI().refreshHud();
  };
  G.binValue = () => G.S.shipping.reduce((a, s) => a + D.sellPrice(s) * s.n, 0);

  /* ============================================================
     Fabricação e culinária
     ============================================================ */
  G.updateRecipes = function () {
    const S = G.S;
    for (const r of D.CRAFT) if (!S.known.craft.includes(r.id) && (!r.skill || St.skillLevel(S, r.skill[0]) >= r.skill[1])) { S.known.craft.push(r.id); UI().toast(`Nova receita de fabricação: ${D.ITEMS[r.out].n}`, 'good', r.out); }
    for (const r of D.COOK) {
      if (S.known.cook.includes(r.id)) continue;
      if ((r.start) || (r.npc && St.hearts(S, r.npc[0]) >= r.npc[1]) || (r.skill && St.skillLevel(S, r.skill[0]) >= r.skill[1])) { S.known.cook.push(r.id); UI().toast(`Nova receita: ${D.ITEMS[r.out].n}`, 'good', r.out); }
    }
  };
  G.craftCan = r => Object.entries(r.req).every(([id, n]) => St.countItem(G.S, id) >= n);
  G.craft = function (r) {
    const S = G.S; if (!G.craftCan(r)) { UI().toast('Faltam materiais.', 'warn'); A.sfx('error', { vol: 0.5 }); return false; }
    const inst = { id: r.out, n: r.qty }; if (D.ITEMS[r.out].tool) inst.tier = 0;
    if (!St.hasRoom(S, inst)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return false; }
    for (const [id, n] of Object.entries(r.req)) St.removeItem(S, id, n);
    St.addItem(S, inst); A.sfx('craft'); S.stats.crafted = (S.stats.crafted || 0) + r.qty; UI().refreshHud(); G.checkAchievements(); return true;
  };
  // ingredientes de culinária (grupos genéricos _veg, _fish, _berry)
  G.cookPicks = function (r) {
    const S = G.S, picks = [], used = {};
    for (const [k, n] of Object.entries(r.req)) {
      const match = id => k[0] === '_' ? D.ING[k](id) : id === k;
      const cands = []; S.inv.forEach((s, i) => { if (s && i < S.invSize && match(s.id)) cands.push(i); });
      cands.sort((a, b) => D.sellPrice(S.inv[a]) - D.sellPrice(S.inv[b]));
      let need = n;
      for (const i of cands) { const have = S.inv[i].n - (used[i] || 0); const take = Math.min(have, need); if (take > 0) { picks.push([i, take]); used[i] = (used[i] || 0) + take; need -= take; } if (!need) break; }
      if (need) return null;
    }
    return picks;
  };
  G.cook = function (r) {
    const S = G.S, picks = G.cookPicks(r); if (!picks) { UI().toast('Faltam ingredientes.', 'warn'); A.sfx('error', { vol: 0.5 }); return false; }
    const inst = { id: r.out, n: 1 }; let from = null;
    if (!St.hasRoom(S, inst) && !picks.some(([i, n]) => S.inv[i].n === n)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return false; }
    for (const [i, n] of picks) { if (!from) from = S.inv[i].id; S.inv[i].n -= n; if (S.inv[i].n <= 0) S.inv[i] = null; }
    if (D.ITEMS[r.out].gen) inst.from = from;
    G.give(inst); A.sfx('craft'); S.stats.cooked = (S.stats.cooked || 0) + 1; UI().refreshHud(); G.checkAchievements(); return true;
  };

  /* ============================================================
     Máquinas
     ============================================================ */
  const mkind = o => o.t === 'machine' ? o.k : o.mk;
  const wrapInteract = G.interactObj;
  G.interactObj = function (o, t) {
    if (o.t === 'furn' && o.mk) return G.machineInteract(o);
    return wrapInteract(o, t);
  };
  G.recipeFor = function (kind, id) {
    const M = D.MACHINES[kind]; if (!M) return null;
    if (M.dynamic) { const r = M.fn(id); return r ? { in: id, n: 1, out: r.out, from: r.from, t: r.t, qty: 1 } : null; }
    return (M.recipes || []).find(r => r.in === id) || null;
  };
  G.machineInteract = function (o) {
    const S = G.S, kind = mkind(o), now = G.absMin();
    if (kind === 'bench') { if (o.act === 'anvil') UI().openSmith(); else UI().openCraft(); return true; }
    if (kind === 'cook') { UI().openCook(); return true; }
    if (kind === 'sprinkler' || kind === 'sprinkler2' || kind === 'scarecrow' || kind === 'torch') { UI().toast(({ sprinkler: 'Aspersor: rega as casas vizinhas toda manhã.', sprinkler2: 'Aspersor de Ferro: rega 8 casas vizinhas.', scarecrow: 'O espantalho protege as plantações de corvos.', torch: 'Uma tocha acesa.' })[kind], 'info', kind); return true; }
    if (o.busy && now >= o.readyAt) { o.busy = false; o.ready = true; }
    if (o.ready) {
      const out = Object.assign({}, o.out); if (kind === 'hive') out.q = Math.random() < 0.1 ? 1 : 0;
      if (!St.hasRoom(S, out)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return true; }
      St.addItem(S, out); o.ready = false; o.out = null; A.sfx('pickup'); G.fx.burst(o.x * T + 8, o.y * T, 8, { col: ['#fff', '#ffe66a'], speed: 30, up: 30 });
      G.fx.text(o.x * T + 8, o.y * T - 10, `+${out.n} ${D.itemName(out)}`, '#fff');
      if (kind === 'hive') { o.busy = true; o.readyAt = now + 1440 * 3; o.out = { id: 'honey', n: 1 }; }
      G.xp('farm', 3); UI().refreshHud(); return true;
    }
    if (o.busy) { const left = Math.max(0, o.readyAt - now); UI().toast(`${D.MACHINES[kind] ? D.MACHINES[kind].n : 'Máquina'}: ${left >= 60 ? Math.ceil(left / 60) + ' h' : left + ' min'} restantes`, 'info', kind); return true; }
    const M = D.MACHINES[kind]; if (!M) return false;
    const held = St.held(S);
    if (!held) { UI().toast(`${M.n}: segure um item para processar.`, 'info', kind); return true; }
    const r = G.recipeFor(kind, held.id);
    if (!r) { UI().toast('Essa máquina não processa isso.', 'warn'); A.sfx('error', { vol: 0.4 }); return true; }
    if (held.n < r.n) { UI().toast(`Precisa de ${r.n} ${D.ITEMS[held.id].n}.`, 'warn'); return true; }
    if (r.fuel && St.countItem(S, 'coal') < r.fuel) { UI().toast('Precisa de 1 Carvão como combustível.', 'warn', 'coal'); A.sfx('error', { vol: 0.4 }); return true; }
    St.removeItem(S, held.id, r.n); if (r.fuel) St.removeItem(S, 'coal', r.fuel);
    const ok = r.chance === undefined || Math.random() < r.chance;
    o.busy = true; o.ready = false; o.readyAt = now + r.t; o.out = ok ? { id: r.out, n: r.qty || 1, from: r.from, q: held.q || 0 } : { id: 'stone', n: 1 };
    if (r.from) o.out.q = 0;
    A.sfx('machine'); G.fx.burst(o.x * T + 8, o.y * T, 8, { col: ['#bbb', '#fff'], speed: 24, up: 30, life: 0.6 }); UI().refreshHud(); return true;
  };
  G.tickMachines = function () {
    const now = G.absMin();
    for (const id in G.maps) G.maps[id].obj.forEach(o => { if (o.t === 'machine' || (o.t === 'furn' && o.mk)) if (o.busy && now >= o.readyAt) { o.busy = false; o.ready = true; } });
  };
  const prevTen = G.onTenMin;
  G.onTenMin = function () { prevTen(); G.tickMachines(); };

  /* ============================================================
     Animais
     ============================================================ */
  G.rebuildAnimals = function () {
    const S = G.S; G.animals = [];
    for (const o of S.animals) {
      const a = new Ent.Animal(o); const m = G.maps && G.maps[a.map];
      if (m && (!a.x || !a.y)) { const h = m.animalHome; if (h) { a.x = U.ri(h.x0, h.x1) * T + 8; a.y = U.ri(h.y0, h.y1) * T + 12; } }
      G.animals.push(a);
    }
  };
  G.animalCount = home => G.animals.filter(a => a.map === home).length;
  G.buyAnimal = function (type, name) {
    const S = G.S, def = D.ANIMALS[type]; const b = S.buildings[def.home]; const cap = D.BUILD[def.home].cap;
    if (!b) { UI().toast(`Você precisa de um ${D.BUILD[def.home].n} primeiro.`, 'warn'); return false; }
    if (G.animalCount(def.home) >= cap) { UI().toast('Não há espaço. Construa ou espere.', 'warn'); return false; }
    if (S.gold < def.price) { UI().toast('Dinheiro insuficiente.', 'bad', 'coin'); A.sfx('error', { vol: 0.5 }); return false; }
    S.gold -= def.price; S.animalSeq = (S.animalSeq || 0) + 1;
    const m = G.maps[def.home], h = m.animalHome;
    const a = new Ent.Animal({ id: S.animalSeq, type, name: name || U.pick(['Mimosa', 'Pipa', 'Dona Clara', 'Bolinha', 'Fofa', 'Sol', 'Nuvem', 'Estrela']), age: 0, friend: 0, map: def.home, x: U.ri(h.x0, h.x1) * T + 8, y: U.ri(h.y0, h.y1) * T + 12, home: def.home });
    G.animals.push(a); S.flags.hasAnimal = 1; S.stats.animals = G.animals.length; A.sfx(type === 'cow' ? 'cow' : 'chicken'); UI().toast(`${a.name} chegou à fazenda!`, 'good', 'heart'); UI().refreshHud(); G.checkQuests(); G.checkAchievements(); return true;
  };
  G.interactAnimal = function (a) {
    const S = G.S; let did = false;
    if (a.product) {
      const out = Object.assign({}, a.product);
      if (!St.hasRoom(S, out)) { UI().toast('Mochila cheia!', 'bad', 'sack'); return; }
      St.addItem(S, out); a.product = null; did = true; A.sfx('pickup'); G.fx.text(a.x, a.y - 20, `+${D.itemName(out)}`, '#fff'); G.xp('farm', 4);
    }
    if (!a.petted) { a.petted = true; a.friend = Math.min(1000, a.friend + 15); did = true; A.sfx(a.type === 'cow' ? 'cow' : 'chicken', { vol: 0.7 }); G.fx.burst(a.x, a.y - 14, 6, { col: ['#ff6a8a', '#ffb0c4'], speed: 26, up: 34, g: -10, life: 0.8, size: 2 }); a.hop = 0.3; UI().toast(`${a.name}: carinho! (${Math.floor(a.friend / 100)}/10 ♥)`, 'good', 'heart'); }
    if (!did) UI().toast(`${a.name} está feliz. (${Math.floor(a.friend / 100)}/10 ♥)`, 'info', 'heart');
  };
  G.hayCap = () => G.S.buildings.silo ? 240 : 60;
  G.hopper = function () {
    const S = G.S, h = St.countItem(S, 'hay'), cap = G.hayCap(), have = S.hayStock || 0;
    if (!h) { UI().toast(`Feno guardado: ${have}/${cap}. Traga feno (corte mato alto com a foice).`, 'info', 'hay'); return; }
    const n = Math.min(h, cap - have); if (n <= 0) { UI().toast('O depósito de feno está cheio.', 'info', 'hay'); return; }
    St.removeItem(S, 'hay', n); S.hayStock = have + n; A.sfx('pickup'); UI().toast(`+${n} feno guardado (${S.hayStock}/${cap})`, 'good', 'hay'); UI().refreshHud();
  };
  G.feedTrough = function () {
    const S = G.S, list = G.animals.filter(a => a.map === G.map.id && !a.fed);
    if (!list.length) { UI().toast('Todos os animais já comeram.', 'info', 'hay'); return; }
    let fed = 0; for (const a of list) { if ((S.hayStock || 0) > 0) { S.hayStock--; a.fed = true; fed++; } }
    if (fed) { A.sfx('plant'); UI().toast(`${fed} animal(is) alimentado(s). Feno restante: ${S.hayStock || 0}`, 'good', 'hay'); } else UI().toast('Sem feno! Coloque feno no depósito.', 'bad', 'hay');
  };
  G.dailyAnimals = function (log) {
    const S = G.S; let hungry = 0;
    // cônjuge ajuda
    if (S.spouse && Math.random() < 0.6) for (const a of G.animals) if (!a.fed && (S.hayStock || 0) > 0) { S.hayStock--; a.fed = true; }
    for (const a of G.animals) {
      a.age++; const def = D.ANIMALS[a.type];
      if (a.fed) a.friend = Math.min(1000, a.friend + (a.petted ? 6 : 2)); else { a.friend = Math.max(0, a.friend - 20); hungry++; }
      const adult = !a.baby; const boost = S.flags.animalBoost;
      if (a.fed && adult && !a.product) {
        const every = a.type === 'sheep' ? 2 : 1;
        if (a.age % every === 0) {
          let id = def.prod[Math.floor(Math.random() * def.prod.length)], n = 1;
          if (a.friend >= 700 && Math.random() < 0.05 + (boost ? 0.03 : 0)) id = def.gold || def.big || id;
          else if (def.big && a.friend >= 500 && Math.random() < 0.25) id = def.big;
          if (boost && Math.random() < 0.1) n = 2;
          a.product = { id, n, q: a.friend >= 800 ? 2 : a.friend >= 400 ? 1 : 0 };
        }
      }
      a.fed = false; a.petted = false; a.sleeping = false;
    }
    if (hungry) log.notes.push(`${hungry} animal(is) ficaram sem comer ontem.`);
    S.stats.animals = G.animals.length;
  };

  /* ============================================================
     Construções, casa e melhorias
     ============================================================ */
  G.canBuild = function (kind) {
    const S = G.S, b = D.BUILD[kind];
    if (S.buildings[kind]) return 'Já construído';
    if (Object.keys(S.construction).length) return 'Já há uma obra em andamento';
    if (S.gold < b.gold) return 'Ouro insuficiente'; if (St.countItem(S, 'wood') < b.wood) return 'Madeira insuficiente'; if (St.countItem(S, 'stone') < b.stone) return 'Pedra insuficiente';
    return null;
  };
  G.startBuild = function (kind) {
    const S = G.S, b = D.BUILD[kind], err = G.canBuild(kind); if (err) { UI().toast(err, 'warn'); A.sfx('error', { vol: 0.5 }); return false; }
    S.gold -= b.gold; St.removeItem(S, 'wood', b.wood); St.removeItem(S, 'stone', b.stone); S.construction[kind] = { days: b.days };
    G.applyBuildings(); A.sfx('craft'); UI().banner('OBRA INICIADA', `${b.n} ficará pronto em ${b.days} dia${b.days > 1 ? 's' : ''}`); UI().refreshHud(); return true;
  };
  G.canUpgradeHouse = function () { const S = G.S, h = D.HOUSE_UP[S.houseLvl]; if (!h) return 'Casa no nível máximo'; if (S.upgrade && S.upgrade.house) return 'Obra em andamento'; if (S.gold < h.gold) return 'Ouro insuficiente'; if (St.countItem(S, 'wood') < h.wood) return 'Madeira insuficiente'; return null; };
  G.upgradeHouse = function () {
    const S = G.S, h = D.HOUSE_UP[S.houseLvl], err = G.canUpgradeHouse(); if (err) { UI().toast(err, 'warn'); return false; }
    S.gold -= h.gold; St.removeItem(S, 'wood', h.wood); S.houseReform = { days: 2 }; A.sfx('craft'); UI().banner('REFORMA INICIADA', `${h.n} em 2 dias`); UI().refreshHud(); return true;
  };
  const UPGRADABLE = ['hoe', 'can', 'axe', 'pick', 'sword'];
  G.canUpgradeTool = function (idx) {
    const S = G.S, it = S.inv[idx]; if (!it || !UPGRADABLE.includes(it.id)) return 'Esta ferramenta não pode ser melhorada';
    if (S.upgrade) return 'O ferreiro já está trabalhando em uma peça'; const t = it.tier || 0; if (t >= 3) return 'Já está no nível máximo';
    const c = D.UPGRADE_COST[t]; if (S.gold < c.gold) return 'Ouro insuficiente'; if (St.countItem(S, c.bar) < c.n) return `Faltam ${D.ITEMS[c.bar].n}`; return null;
  };
  G.startToolUpgrade = function (idx) {
    const S = G.S, err = G.canUpgradeTool(idx); if (err) { UI().toast(err, 'warn'); A.sfx('error', { vol: 0.5 }); return false; }
    const it = S.inv[idx], c = D.UPGRADE_COST[it.tier || 0]; S.gold -= c.gold; St.removeItem(S, c.bar, c.n);
    S.upgrade = { id: it.id, tier: (it.tier || 0) + 1, days: 2 }; S.inv[idx] = null; A.sfx('craft'); UI().banner('MELHORIA ENCOMENDADA', 'Tomás avisará por carta em 2 dias'); UI().refreshHud(); return true;
  };
  const GEODE = [['stone', 0.3, 3, 8], ['copper_ore', 0.2, 2, 5], ['coal', 0.12, 2, 4], ['quartz', 0.12, 1, 2], ['amethyst', 0.08, 1, 1], ['topaz', 0.07, 1, 1], ['emerald', 0.05, 1, 1], ['ruby', 0.03, 1, 1], ['diamond', 0.015, 1, 1]];
  G.openGeode = function (idx) {
    const S = G.S, it = S.inv[idx]; if (!it || !/geode/.test(it.id)) return null;
    if (S.gold < 25) { UI().toast('Abrir um geodo custa 25G.', 'warn', 'coin'); return null; }
    S.gold -= 25; St.removeItem(S, it.id, 1); let r = Math.random() * (it.id === 'frozen_geode' ? 0.8 : 1); let pick = GEODE[0];
    for (const g of GEODE) { r -= g[1]; if (r <= 0) { pick = g; break; } }
    if (it.id === 'frozen_geode' && Math.random() < 0.3) pick = U.pick(GEODE.slice(4));
    const out = { id: D.ITEMS[pick[0]] ? pick[0] : 'stone', n: U.ri(pick[2], pick[3]) }; G.give(out); A.sfx('break'); S.stats.geodes = (S.stats.geodes || 0) + 1; UI().refreshHud(); return out;
  };
  G.dailyConstruction = function (log) {
    const S = G.S;
    for (const k of Object.keys(S.construction)) {
      S.construction[k].days--;
      if (S.construction[k].days <= 0) { delete S.construction[k]; S.buildings[k] = true; log.notes.push(`${D.BUILD[k].n} ficou pronto!`); G.addMail({ id: 'build_' + k + S.day, from: 'Seu Ney', title: 'Obra concluída', text: `Fazendeiro,\n\nSeu ${D.BUILD[k].n} está pronto. Pode usar!\n\nNey` }); }
    }
    if (S.upgrade) { S.upgrade.days--; if (S.upgrade.days <= 0) { const u = S.upgrade; S.upgrade = null; G.addMail({ id: 'tool_' + S.day, from: 'Tomás', title: 'Pronto.', text: 'Sua ferramenta está pronta.\n\nTomás', items: [{ id: u.id, n: 1, tier: u.tier }] }); log.notes.push('Tomás terminou a melhoria da sua ferramenta (veja o correio).'); } }
    if (S.houseReform) { S.houseReform.days--; if (S.houseReform.days <= 0) { S.houseReform = null; S.houseLvl++; log.notes.push(`Reforma concluída: ${D.HOUSE_UP[S.houseLvl - 1].n}!`); } }
  };

  /* ============================================================
     Rotinas diárias do mundo
     ============================================================ */
  const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], NB8 = NB4.concat([[1, 1], [-1, -1], [1, -1], [-1, 1]]);
  G.dailyFarming = function (rain, newSeason, log) {
    const S = G.S, sea = St.season(S); let lost = 0, crows = 0;
    for (const id in G.maps) {
      const m = G.maps[id]; if (m.isMine || !m.soil.size && !m.obj.size) continue;
      const gh = !!m.greenhouse; const scares = []; m.obj.forEach(o => { if (o.t === 'machine' && o.k === 'scarecrow') scares.push(o); });
      m.obj.forEach((o, k) => {
        if (o.t !== 'crop') return;
        const c = D.CROPS[o.c]; const soil = m.soil.get(k); if (!soil) return;
        if (o.dead) return;
        if (!gh && !c.seasons.includes(sea)) { o.dead = true; lost++; return; }
        if (soil.wet) {
          o.grow += 1 + (soil.speed ? 0.1 : 0) + (soil.fert >= 2 ? 0.05 : 0);
          if (o.stage < 4 || !c.reg) o.stage = o.grow >= c.days ? 4 : Math.min(3, Math.floor(o.grow / c.days * 4));
          else o.stage = o.grow >= c.days ? 4 : 3;
        }
        if (!gh && m.outdoor && o.stage < 4 && Math.random() < 0.025 && !scares.some(s => Math.hypot(s.x - o.x, s.y - o.y) < 9)) { o.dead = true; crows++; }
      });
      // solo: seca, idle
      const ids = []; m.soil.forEach((s, k) => ids.push(k));
      for (const k of ids) {
        const s = m.soil.get(k), hasCrop = m.obj.get(k) && m.obj.get(k).t === 'crop';
        s.wet = !!(rain && m.outdoor); s.moss = 0;
        if (hasCrop) s.idle = 0; else { s.idle = (s.idle || 0) + 1; if (s.idle >= 6 && !gh && m.outdoor) m.soil.delete(k); }
      }
      // aspersores
      m.obj.forEach(o => {
        if (o.t !== 'machine' || (o.k !== 'sprinkler' && o.k !== 'sprinkler2')) return;
        const nb = o.k === 'sprinkler2' ? NB8 : NB4; for (const [dx, dy] of nb) { const s = m.soil.get(m.key(o.x + dx, o.y + dy)); if (s) s.wet = true; }
      });
      if (newSeason) m.groundCanvas = null;
    }
    if (lost) log.notes.push(`${lost} plantação(ões) secaram com a mudança de estação.`);
    if (crows) log.notes.push(`Corvos destruíram ${crows} plantação(ões)! Use espantalhos.`);
    S.can.water = S.can.max = G.canMax();
  };
  const FORAGE_BY_MAP = { forest: 6, farm: 3, beach: 3, mountain: 3, town: 2 };
  G.dailyForage = function () {
    const S = G.S, sea = St.season(S), ids = Object.keys(D.ITEMS).filter(id => D.ITEMS[id].forage && D.ITEMS[id].seasons && D.ITEMS[id].seasons.includes(sea) && id !== 'lumi_blossom');
    for (const mid in FORAGE_BY_MAP) {
      const m = G.maps[mid]; if (!m) continue;
      // limpa sobras antigas
      let cnt = 0; m.obj.forEach(o => { if (o.t === 'forage') cnt++; });
      if (cnt > 12) m.obj.forEach((o, k) => { if (o.t === 'forage' && Math.random() < 0.5) m.delObj(o.x, o.y); });
      for (let i = 0; i < FORAGE_BY_MAP[mid] && ids.length; i++) {
        for (let t = 0; t < 25; t++) {
          const x = U.ri(1, m.w - 2), y = U.ri(1, m.h - 2);
          if (!m.walkable(x, y) || m.getObj(x, y) || m.soil.has(m.key(x, y)) || m.kind(x, y) === 'path' || m.kind(x, y) === 'cobble' || m.warps.some(w => x >= w.x - 1 && x <= w.x + w.w && y >= w.y - 1 && y <= w.y + w.h)) continue;
          if (mid === 'beach' && m.kind(x, y) !== 'sand') continue; if (mid !== 'beach' && m.kind(x, y) !== 'grass') continue;
          if (mid === 'farm' && Math.hypot(x - 8, y - 9) < 3) continue;
          m.setObj(x, y, O.forage(U.pick(ids))); break;
        }
      }
      // Flor-Lúmen à noite no bosque após a primeira oferta
      if (mid === 'forest' && S.flags.bundle1 && Math.random() < 0.4) { const x = U.ri(3, m.w - 3), y = U.ri(3, m.h - 3); if (m.walkable(x, y) && !m.getObj(x, y) && m.kind(x, y) === 'grass') m.setObj(x, y, O.forage('lumi_blossom')); }
    }
    // mato na fazenda (não no inverno) e arbustos de frutinhas
    const f = G.maps.farm;
    if (f && sea !== 3) {
      for (let i = 0; i < 6; i++) {
        const x = U.ri(1, f.w - 2), y = U.ri(1, f.h - 2);
        if (!f.walkable(x, y) || f.getObj(x, y) || f.soil.has(f.key(x, y)) || f.kind(x, y) !== 'grass' || Math.hypot(x - 8, y - 9) < 3) continue;
        // espalha a partir de mato existente (mais realista)
        let near = false; for (const [dx, dy] of NB8) { const o = f.getObj(x + dx, y + dy); if (o && (o.t === 'weed' || o.t === 'gtall')) near = true; }
        if (near || Math.random() < 0.15) f.setObj(x, y, Math.random() < 0.35 ? O.gtall() : O.weed());
      }
    }
    for (const mid in G.maps) { const m = G.maps[mid]; if (m.isMine) continue; m.obj.forEach(o => { if (o.t === 'bush' && o.berry && !o.grown && Math.random() < 0.5) o.grown = true; }); }
  };
  G.dailyTrees = function () {
    for (const mid in G.maps) {
      const m = G.maps[mid]; if (m.isMine) continue;
      m.obj.forEach(o => {
        if (o.t === 'tree' && o.stage < 4) { o.days = (o.days || 0) + 1; if (o.days >= 2) { o.days = 0; o.stage++; o.hp = o.stage >= 4 ? 14 : 3; } }
        else if (o.t === 'tree' && o.stage >= 4 && o.hp < 14) o.hp = 14;
        else if (o.t === 'stump' && mid === 'farm' && Math.random() < 0.02) { m.delObj(o.x, o.y); }
      });
    }
  };
  G.dailyAdmin = function (log) {
    const S = G.S;
    G.tickMachines();
    G.updateRecipes();
    S.mail = S.mail.slice(-40);
    if (S.spouse && Math.random() < 0.15) { const f = G.maps.farm; let n = 0; f.soil.forEach(s => { if (!s.wet) { s.wet = true; n++; } }); if (n) log.notes.push(`${D.NPCS[S.spouse].name} regou ${n} canteiros para você.`); }
  };
})();
