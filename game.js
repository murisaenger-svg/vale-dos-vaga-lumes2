'use strict';
/* ============================================================
   Núcleo do jogo: ciclo de vida, jogador, mapas, tempo, clima,
   transições, salvamento e laço de atualização.
   Outros módulos (tools/social/economy) estendem VV.G.
   ============================================================ */
VV.G = (() => {
  const U = VV.U, D = VV.Data, St = VV.State, T = 16, Ent = VV.Ent, Inp = VV.Input, A = VV.Audio;
  const G = {
    S: null, settings: St.loadSettings(), map: null, maps: {}, player: null, npcs: [], animals: [], monsters: [], drops: [], shots: [], effects: [],
    fx: new Ent.Particles(), pet: null, lumi: null, weather: 'sun', night: 0, mode: 'title', festival: null, spouseNpc: null,
    slot: 1, showReticle: false, targetValid: true, mouseMode: false, fade: { a: 0, to: 0, speed: 3, cb: null }, clock: 0, uiOpen: false,
    cooldown: { warp: 0, use: 0, act: 0 }, sleeping: false, hintTimer: 0, autosaveT: 0, ticks: 0, lastTool: null, wasNight: false,
  };
  const DIRV = [[0, 1], [-1, 0], [1, 0], [0, -1]];
  G.DIRV = DIRV;
  const UI = () => VV.UI;

  /* ============================================================
     Início / carga
     ============================================================ */
  G.newGame = function (opts) {
    const S = St.newState(opts);
    S.settings = G.settings;
    G.begin(S, true);
  };
  G.loadGame = function (slot) {
    const S = St.load(slot); if (!S) return false;
    G.slot = slot; S.settings = G.settings;
    G.begin(S, false);
    return true;
  };
  G.begin = function (S, fresh) {
    G.S = S; G.mode = 'play';
    S.settings = G.settings;
    // jogador
    const look = S.look;
    G.player = {
      x: S.loc.x, y: S.loc.y, dir: S.loc.dir || 0, moving: false, walkT: 0, useT: 0, useMax: 0.3, tool: null, iframes: 0, kvx: 0, kvy: 0,
      sheet: VV.Art.Chars.sheet(Ent.specFromLook(look)), carry: null, carryT: 0, fishing: false, fish: { state: 'none' }, act: null, sprint: false, sleepy: false, hurtT: 0, lastHit: 0,
    };
    G.player.hw = 4; G.player.hh = 4;
    // mundo
    G.maps = {};
    VV.Maps.setLantern(G.lanternLevel());
    for (const id of VV.Maps.IDS) { const m = VV.Maps.create(id, S.seed, { fresh: fresh || !S.mapState[id] }); G.maps[id] = m; }
    for (const id of VV.Maps.IDS) if (S.mapState[id] && !fresh) G.applyMapState(G.maps[id], S.mapState[id]);
    G.applyBuildings();
    G.npcs = Object.keys(D.NPCS).map(id => new Ent.NPC(id));
    G.animals = []; G.rebuildAnimals();
    G.pet = new Ent.Pet(S.pet);
    G.monsters = []; G.drops = []; G.shots = []; G.effects = []; G.fx = new Ent.Particles();
    G.lumi = { x: 0, y: 0, map: 'farm', visible: false, t: 0, phase: 0, talkT: 0 };
    G.festival = G.festivalToday();
    G.weather = S.weather;
    G.recalcMaxStats();
    if (fresh) {
      St.friend(S, 'ze'); S.mail.push('l_alba'); S.stats.days = 1;
      G.initBundles();
    } else G.initBundles();
    G.enterMap(S.loc.map || 'farm', null, null, null, true);
    G.placeNpcsNow();
    G.night = VV.Render.nightness(S.min);
    UI().onStart && UI().onStart(fresh);
    if (fresh) { G.fade.a = 1; G.fade.to = 0; setTimeout(() => G.introScene(), 700); }
    VV.Render.snapCamera(G);
    A.init();
  };
  G.recalcMaxStats = function () {
    const S = G.S; S.maxHp = St.maxHpFor(S); S.hp = Math.min(S.hp, S.maxHp);
  };

  /* ---------- salvamento ---------- */
  G.serializeMap = function (m) {
    const objs = [];
    m.obj.forEach((o, k) => { if (o.t === 'ref') return; const c = JSON.parse(JSON.stringify(o)); delete c.shake; delete c.hit; delete c.open; objs.push(c); });
    const soil = []; m.soil.forEach((s, k) => soil.push([k, s.wet ? 1 : 0, s.fert || 0, s.moss || 0, s.idle || 0]));
    // ground: diferenças desenhadas pelo jogador (pisos)
    const gr = m.groundEdits || [];
    return { obj: objs, soil, gr };
  };
  G.applyMapState = function (m, st) {
    m.obj.clear(); m.soil.clear();
    for (const o of st.obj) m.setObj(o.x, o.y, o);
    for (const [k, w, f, mo, idle] of st.soil) m.soil.set(k, { wet: !!w, fert: f, moss: mo, idle });
    m.groundEdits = st.gr || [];
    for (const [x, y, kind] of m.groundEdits) if (m.inb(x, y)) m.ground[y][x] = kind;
    m.groundCanvas = null;
  };
  G.save = function (silent) {
    const S = G.S; if (!S) return false;
    for (const id in G.maps) { const m = G.maps[id]; if (!m.noSave) S.mapState[id] = G.serializeMap(m); }
    S.animals = G.animals.map(a => ({ id: a.id, type: a.type, name: a.name, age: a.age, friend: a.friend, fed: a.fed, petted: a.petted, product: a.product, map: a.map, x: a.x, y: a.y, home: a.home }));
    S.loc = { map: G.map.id.startsWith('mine') && G.map.isMine ? 'mountain' : G.map.id, x: G.player.x, y: G.player.y, dir: G.player.dir };
    if (G.map.isMine) { const w = G.maps.mountain.warps.find(w => w.to === 'mine'); S.loc = { map: 'mountain', x: 20 * T + 8, y: 10 * T + 14, dir: 0 }; }
    S.weather = G.weather;
    const ok = St.save(S, G.slot);
    if (!silent) UI().toast(ok ? 'Jogo salvo!' : 'Falha ao salvar (armazenamento cheio?)', ok ? 'good' : 'bad', 'book');
    return ok;
  };

  /* ============================================================
     Mapas e transições
     ============================================================ */
  G.lanternLevel = function () {
    const S = G.S; if (!S) return 0; let c = 0;
    for (const b of D.Story.bundles) if (S.bundles[b.id] && S.bundles[b.id].length && S.bundles[b.id].every(v => v)) c++;
    return c;
  };
  G.initBundles = function () { const S = G.S; for (const b of D.Story.bundles) if (!S.bundles[b.id]) S.bundles[b.id] = b.items.map(() => null); };
  G.applyBuildings = function () {
    const S = G.S, farm = G.maps.farm, B = VV.Art.Build, Sp = VV.Art.Special;
    // limpa construções anteriores
    farm.buildings = farm.buildings.filter(b => ['house'].includes(b.id));
    farm.warps = farm.warps.filter(w => !['coop', 'barn', 'greenhouse'].includes(w.to));
    for (const k in farm.plots) { const p = farm.plots[k]; if (!S.buildings[k] && !S.construction[k]) farm.blockRect(p.x, p.y, p.w, p.h, 0); }
    const set = (kind, spr, x, y, to, tx, ty) => { VV.Maps.building(farm, spr, x, y, to, tx, ty, { kind, id: kind }); };
    if (S.buildings.coop) { const p = farm.plots.coop; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) { const o = farm.getObj(p.x + i, p.y + j); if (o && !o.t.startsWith('furn')) farm.delObj(p.x + i, p.y + j); } set('coop', B.barn('coop'), p.x, p.y, 'coop', 4, 5); }
    if (S.buildings.barn) { const p = farm.plots.barn; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) farm.delObj(p.x + i, p.y + j); set('barn', B.barn('barn'), p.x, p.y, 'barn', 6, 6); }
    if (S.buildings.greenhouse) { const p = farm.plots.greenhouse; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) farm.delObj(p.x + i, p.y + j); set('greenhouse', Sp.greenhouse(true), p.x, p.y, 'greenhouse', 6, 8); }
    else { const p = farm.plots.greenhouse; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) farm.delObj(p.x + i, p.y + j); farm.buildings = farm.buildings.filter(b => b.id !== 'greenhouse'); farm.blockRect(p.x, p.y, p.w, p.h, 1); farm.buildings.push({ spr: Sp.greenhouse(false), x: p.x, y: p.y, w: p.w, h: p.h, id: 'ruin', kind: 'ruin' }); }
    if (S.buildings.silo) { const p = farm.plots.silo; farm.delObj(p.x, p.y); farm.delObj(p.x + 1, p.y); farm.blockRect(p.x, p.y, 2, 2, 1); farm.setObj(p.x, p.y + 1, { t: 'deco', k: 'silo', solid: 0 }); }
    if (S.buildings.well) { const p = farm.plots.well; farm.delObj(p.x, p.y); farm.setObj(p.x, p.y, { t: 'deco', k: 'well', solid: 1, fw: 2, fh: 1, well: 1 }); }
    // construção em andamento: estacas
    for (const k in S.construction) { const p = farm.plots[k]; if (p) { farm.blockRect(p.x, p.y, p.w, p.h, 1); farm.buildings = farm.buildings.filter(b => !(b.id === 'cons_' + k)); farm.buildings.push({ spr: G.constructionSprite(p.w, p.h), x: p.x, y: p.y, w: p.w, h: p.h, id: 'cons_' + k, kind: 'cons' }); } }
    // Lanternário
    const town = G.maps.town; const hb = town.buildings.find(b => b.kind === 'hall'); if (hb) hb.spr = Sp.tower(G.lanternLevel());
  };
  G.constructionSprite = function (w, h) {
    const key = 'cons' + w + h; G._cons = G._cons || {}; if (G._cons[key]) return G._cons[key];
    const p = new VV.Px(w * 16, h * 16); p.shadow(w * 8, h * 16 - 4, w * 7, 4, 0.2);
    p.r(4, h * 16 - 22, w * 16 - 8, 18, '#a97844'); for (let x = 4; x < w * 16 - 4; x += 6) p.r(x, h * 16 - 22, 1, 18, '#7a5230'); p.r(4, h * 16 - 22, w * 16 - 8, 2, '#c8955a');
    for (let x = 6; x < w * 16 - 6; x += 18) { p.r(x, h * 16 - 44, 3, 26, '#7a5230'); p.r(x, h * 16 - 44, 3, 3, '#c8955a'); }
    p.line(8, h * 16 - 22, 30, h * 16 - 40, '#c8955a'); p.r(w * 8 - 10, h * 16 - 14, 20, 8, '#e8d8a8'); p.r(w * 8 - 8, h * 16 - 12, 16, 1, '#7a5230'); p.r(w * 8 - 8, h * 16 - 9, 12, 1, '#7a5230');
    p.outline(); return (G._cons[key] = { c: p.c, w, h, doorTx: 0, ax: 0, ay: h * 16 });
  };

  G.musicFor = function (m) {
    const S = G.S; const n = G.night;
    if (m.isMine) return m.mineFloor === 30 ? 'mountain' : 'mine';
    if (m.indoor) return m.music || 'home';
    if (G.weather === 'rain' || G.weather === 'storm') return 'rain';
    if (n > 0.6) return 'night';
    if (m.id === 'farm') return ['spring', 'summer', 'fall', 'winter'][St.season(S)];
    return m.music;
  };
  G.enterMap = function (id, tx, ty, dir, instant) {
    const S = G.S; const prev = G.map;
    let m = G.maps[id];
    if (!m && id.startsWith('mine')) {
      const f = id === 'mine' ? 1 : parseInt(id.slice(4), 10);
      m = VV.Mines.generate(f, S.seed, S.day); G.maps['mine' + f] = m; id = 'mine' + f;
    }
    if (!m) { console.warn('mapa inexistente', id); return; }
    if (prev && prev.isMine && !m.isMine) delete G.maps[prev.id];
    if (prev && prev.isMine && m.isMine && prev.id !== m.id) delete G.maps[prev.id];
    G.map = m; const p = G.player;
    if (tx != null) { p.x = tx * T + 8; p.y = ty * T + 14; p.dir = dir ?? p.dir; }
    G.monsters = []; G.drops = []; G.shots = []; G.effects = []; G.fx.list = []; G.fx.texts = [];
    if (m.isMine) {
      const f = m.mineFloor; const sc = 1 + f * 0.035;
      for (const sp of m.spawns || []) G.monsters.push(new Ent.Monster(sp.type, sp.x * T + 8, sp.y * T + 12, sc));
      m.spawns = [];
      S.stats.mineDepth = Math.max(S.stats.mineDepth || 0, f); S.mine.deepest = Math.max(S.mine.deepest, f);
      if (f % 10 === 0 && f < 30 && !S.mine.elevator.includes(f)) { S.mine.elevator.push(f); UI().toast(`Andar ${f} registrado no elevador!`, 'good', 'key'); }
    } else if (m.monsterSpawns) { /* reservado */ }
    G.player.fishing = false; G.player.fish = { state: 'none' };
    p.useT = 0; p.act = null;
    G.cooldown.warp = 0.5;
    VV.Render.snapCamera(G);
    G.refreshAudio();
    if (!instant) { UI().banner(m.name, m.isMine ? (m.mineFloor === 30 ? 'O Guardião de Cristal aguarda...' : `${m.mineFloor} / 30`) : null); }
    G.afterEnter && G.afterEnter(m, prev);
    G.updateNpcVisibility();
  };
  G.refreshAudio = function () {
    const m = G.map; if (!m) return;
    A.play(G.mode === 'title' ? 'title' : G.musicFor(m));
    const rain = m.outdoor && (G.weather === 'rain' || G.weather === 'storm');
    A.setAmbience({ rain, wind: m.outdoor && (G.weather === 'wind' || G.weather === 'storm' || St.season(G.S) === 3 || m.id === 'mountain'), cave: !!m.isMine });
  };
  G.warpTo = function (w) {
    if (G.fade.a > 0.05 || G.cooldown.warp > 0) return;
    const S = G.S;
    // regras especiais
    if (w.to === 'mine') { G.openMineEntrance && G.openMineEntrance(); return; }
    A.sfx(G.map.indoor || w.to.length > 5 ? 'door' : 'stairs', { vol: 0.5 });
    G.cooldown.warp = 0.8;
    G.player.vx = 0;
    G.fadeOut(() => {
      G.enterMap(w.to, w.tx, w.ty, w.dir);
      G.fadeIn();
      G.onMapChange && G.onMapChange(w.to);
    });
  };
  G.fadeOut = function (cb, speed = 5) { G.fade.to = 1; G.fade.speed = speed; G.fade.cb = cb; };
  G.fadeIn = function (speed = 4) { G.fade.to = 0; G.fade.speed = speed; G.fade.cb = null; };

  /* ============================================================
     Tempo
     ============================================================ */
  const MIN_SEC = 0.7;
  G.tickClock = function (dt) {
    const S = G.S; G.clock += dt;
    let adv = 0;
    while (G.clock >= MIN_SEC) { G.clock -= MIN_SEC; adv++; }
    for (let i = 0; i < adv; i++) { S.min++; G.onMinute(); if (G.sleeping) return; }
  };
  G.absMin = () => (G.S.day - 1) * 1440 + G.S.min;
  G.onMinute = function () {
    const S = G.S;
    S.playtime += 0.7 / 60 / 60;
    if (S.min % 10 === 0) G.onTenMin();
    if (S.min === 1440 && !G.map.indoor) UI().toast('Já é meia-noite... É melhor voltar para casa.', 'warn', 'lamp');
    if (S.min === 1500) UI().toast('Você está ficando muito cansado...', 'warn', 'lamp');
    if (S.min >= 1560) { G.passOut(); }
  };
  G.onTenMin = function () {
    const S = G.S;
    // buffs
    for (const b of S.buffs) b.left -= 10; S.buffs = S.buffs.filter(b => b.left > 0);
    G.night = VV.Render.nightness(S.min);
    G.updateSchedules();
    G.updateLumi && G.updateLumi();
    // música / ambiência na virada do dia/noite
    const isN = G.night > 0.6; if (isN !== G.wasNight) { G.wasNight = isN; G.refreshAudio(); if (isN) UI().toast('Anoitece... os vaga-lumes começam a aparecer.', 'info', 'lamp'); }
    if (S.min === 360 + 20) { }
    // chuva fraca: mensagem do clima
    if (S.min === 600 && G.weather === 'storm' && G.map.outdoor) UI().toast('Tempestade! Cuidado com os raios.', 'warn', 'cloud');
    G.checkQuests && G.checkQuests();
    G.festivalTick && G.festivalTick();
  };

  /* ---------- clima ---------- */
  G.rollWeather = function (day) {
    const S = G.S; const sea = Math.floor((day - 1) / 28) % 4, dos = (day - 1) % 28 + 1;
    if (day <= 3) return 'sun';
    const fest = D.Story.festivals.find(f => f.s === sea && f.d === dos);
    if (fest) return 'sun';
    const r = Math.random();
    const P = [{ rain: 0.22, wind: 0.1, storm: 0.04 }, { rain: 0.12, wind: 0.04, storm: 0.14 }, { rain: 0.22, wind: 0.18, storm: 0.04 }, { snow: 0.45, wind: 0.08 }][sea];
    let acc = 0; for (const k in P) { acc += P[k]; if (r < acc) return k; }
    return 'sun';
  };
  G.weatherName = w => ({ sun: 'Ensolarado', rain: 'Chuvoso', storm: 'Tempestade', snow: 'Nevando', wind: 'Ventoso' })[w] || 'Limpo';

  /* ---------- desmaio / dormir ---------- */
  G.passOut = function () {
    if (G.sleeping) return; G.sleeping = true;
    const S = G.S; const loss = Math.min(1000, Math.floor(S.gold * 0.1));
    UI().closeAll && UI().closeAll();
    G.fadeOut(() => {
      S.gold -= loss;
      UI().sleepSummary && 0;
      G.endDay({ faint: true, loss });
    }, 1.5);
  };
  G.faint = function () {
    if (G.sleeping) return; G.sleeping = true;
    const S = G.S; const loss = Math.min(1500, Math.floor(S.gold * 0.1));
    UI().closeAll && UI().closeAll();
    G.fadeOut(() => { S.gold -= loss; G.endDay({ faint: true, loss, mine: true }); }, 1.5);
  };
  G.sleepInBed = function () {
    if (G.sleeping) return;
    const S = G.S;
    UI().confirm(S.min < 1200 ? 'Dormir agora? (ainda é cedo)' : 'Ir dormir e salvar o jogo?', () => {
      G.sleeping = true; A.sfx('sleep');
      G.fadeOut(() => G.endDay({}), 1.2);
    });
  };

  /* ============================================================
     Fim do dia (rotina da manhã)
     ============================================================ */
  G.endDay = function (o) {
    const S = G.S; const log = { gains: 0, items: [], notes: [], faint: o.faint, loss: o.loss, shipping: [], newMail: [] };
    const wasRaining = G.weather === 'rain' || G.weather === 'storm';
    const lateSleep = S.min > 1440;
    // venda dos itens do caixote
    let total = 0;
    for (const it of S.shipping) {
      const v = D.sellPrice(it) * it.n; total += v;
      log.shipping.push({ id: it.id, n: it.n, v, q: it.q, from: it.from });
      if (D.CROPS[it.id]) S.stats.cropsSold = (S.stats.cropsSold || 0) + it.n;
      if (D.FISH[it.id]) S.stats.fishSold = (S.stats.fishSold || 0) + it.n;
    }
    S.shipping = [];
    S.gold += total; S.earned += total; log.gains = total;
    // dia seguinte
    const prevDay = S.day;
    S.day++; S.min = St.DAY_START; S.stats.days = S.day; G.clock = 0;
    const sea = St.season(S), dos = St.dayOfSeason(S);
    const newSeason = dos === 1;
    // clima
    G.weather = S.nextWeather || 'sun'; S.weather = G.weather; S.nextWeather = G.rollWeather(S.day + 1);
    // energia
    S.energy = o.faint ? Math.floor(S.maxEnergy * 0.5) : (lateSleep ? Math.floor(S.maxEnergy * 0.75) : S.maxEnergy);
    S.hp = o.faint && o.mine ? Math.floor(S.maxHp * 0.5) : S.maxHp;
    S.buffs = [];
    if (S.spouse) { S.energy = Math.min(S.maxEnergy, S.energy + 10); }
    // reset diário social
    S.daily = { gifted: {}, talked: {} };
    if (St.weekday(S) === 0) for (const id in S.friends) S.friends[id].giftWeek = 0;
    // estações
    if (newSeason) log.notes.push(`Começou a ${D.SEASONS[sea]}!`);
    // mapas
    const rain = G.weather === 'rain' || G.weather === 'storm';
    for (const id in G.maps) { const m = G.maps[id]; if (m.isMine) delete G.maps[id]; }
    G.dailyFarming(rain, newSeason, log);
    G.dailyForage();
    G.dailyTrees();
    G.dailyAnimals(log);
    G.dailyConstruction(log);
    G.dailyAdmin(log);
    // renderiza o chão com a nova estação
    for (const id in G.maps) { const m = G.maps[id]; if (m.groundSeason !== undefined && !m.indoor && newSeason) m.groundCanvas = null; }
    G.festival = G.festivalToday();
    if (G.festival) log.notes.push(`Hoje: ${G.festival.name}!`);
    const bd = G.birthdayToday(); if (bd) log.notes.push(`Aniversário de ${D.NPCS[bd].name}!`);
    // posição
    G.applyBuildings();
    const house = G.maps.house;
    G.map = house; G.player.x = house.poi.bed[0] * T + 8; G.player.y = house.poi.bed[1] * T + 14; G.player.dir = 0;
    G.enterMap('house', house.poi.bed[0], house.poi.bed[1], 0, true);
    G.monsters = [];
    G.placeNpcsNow();
    G.checkQuests();
    G.checkAchievements();
    G.sleeping = false;
    G.night = VV.Render.nightness(S.min); G.wasNight = false;
    G.refreshAudio();
    // salva
    if (G.settings.autoSave) G.save(true);
    UI().sleepSummary(log, () => {
      G.fadeIn(1.5);
      UI().banner(St.dateText(S), `${G.weatherName(G.weather)}${G.festival ? ' · ' + G.festival.name : ''}`);
      G.afterDawn && G.afterDawn();
    });
  };

  /* ============================================================
     Loop de atualização
     ============================================================ */
  G.update = function (dt) {
    dt = Math.min(dt, 0.05);
    // fade
    const f = G.fade;
    if (f.a !== f.to) { f.a += Math.sign(f.to - f.a) * f.speed * dt; if (Math.abs(f.a - f.to) < f.speed * dt) { f.a = f.to; if (f.cb) { const cb = f.cb; f.cb = null; cb(); } } }
    if (G.mode !== 'play' || !G.S) { VV.Render.snapCamera && 0; return; }
    const S = G.S, p = G.player, m = G.map;
    G.cooldown.warp -= dt; G.cooldown.use -= dt; G.cooldown.act -= dt;
    const blocked = UI().isOpen();
    G.uiOpen = blocked;
    // entrada de mouse
    const mo = Inp.mouse;
    if (Inp.axis().x || Inp.axis().y) G.mouseMode = false;
    if (mo.active && (mo.x !== G._lmx || mo.y !== G._lmy)) { G._lmx = mo.x; G._lmy = mo.y; if (!blocked) G.mouseMode = true; }
    if (!blocked && G.fade.a < 0.6 && !G.sleeping) {
      G.tickClock(dt * (G.festivalFast ? 1 : 1));
      G.updatePlayer(dt);
      G.handleActions(dt);
    } else if (blocked) { p.moving = false; }
    if (G.sleeping) return;
    // mundo
    G.updateWorld(dt, blocked);
    // vida
    G.autosaveT += dt; G.hintTimer += dt;
    if (!blocked) { G.hpRegen(dt); }
    G.ticks += dt;
    if (G.ticks > 1) { G.ticks = 0; G.checkQuests(); G.checkAchievements(); }
    // áudio ambiente
    if (m.outdoor && !blocked) A.critters(G.night > 0.6 ? (St.season(S) === 3 ? 'none' : 'crickets') : (G.weather === 'rain' || G.weather === 'storm' ? 'none' : 'birds'), dt);
    else if (m.isMine) A.critters('drip', dt);
  };
  G.hpRegen = function (dt) {
    const S = G.S, p = G.player; p.lastHit += dt;
    if (S.hp < S.maxHp && p.lastHit > 6) { G._hpAcc = (G._hpAcc || 0) + dt * (G.map.isMine ? 0.15 : 0.5); if (G._hpAcc >= 1) { S.hp = Math.min(S.maxHp, S.hp + 1); G._hpAcc = 0; } }
  };

  G.updatePlayer = function (dt) {
    const S = G.S, p = G.player, m = G.map;
    p.iframes = Math.max(0, p.iframes - dt);
    if (p.useT > 0) { p.useT -= dt; if (p.act && p.useMax - p.useT >= p.act.at) { const a = p.act; p.act = null; a.fn(); } if (p.useT <= 0) { p.tool = p.fishing ? p.tool : null; } }
    if (p.carryT > 0) p.carryT -= dt;
    if (Math.abs(p.kvx) + Math.abs(p.kvy) > 2) { Ent.moveBox(m, p, p.kvx * dt, p.kvy * dt, p.hw, p.hh); p.kvx *= Math.pow(0.0005, dt); p.kvy *= Math.pow(0.0005, dt); return; }
    if (p.fishing) { G.updateFishing(dt); return; }
    if (p.useT > 0) { p.moving = false; return; }
    const ax = Inp.axis(); let dx = ax.x, dy = ax.y;
    p.sprint = Inp.held('sprint') && S.energy > 3 && (dx || dy);
    let speed = 56 * (1 + St.buff(S, 'spd') * 0.15);
    if (p.sprint) { speed *= 1.65; G._sprintAcc = (G._sprintAcc || 0) + dt; if (G._sprintAcc > 1.2) { G._sprintAcc = 0; S.energy = Math.max(0, S.energy - 1); } }
    if (S.energy <= 0) speed *= 0.55;
    if (dx || dy) {
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;
      if (Math.abs(dx) > Math.abs(dy) + 0.01 || (Math.abs(dx) === Math.abs(dy) && (p.dir === 1 || p.dir === 2))) p.dir = dx > 0 ? 2 : 1; else p.dir = dy > 0 ? 0 : 3;
      const moved = Ent.moveBox(m, p, dx * speed * dt, dy * speed * dt, p.hw, p.hh);
      p.moving = true; p.walkT += dt * (p.sprint ? 11 : 7.5);
      // passos
      p._stepT = (p._stepT || 0) - dt;
      if (p._stepT <= 0 && moved) { p._stepT = p.sprint ? 0.2 : 0.3; const k = m.kind(Math.floor(p.x / T), Math.floor((p.y - 2) / T)); A.sfx('step', { surf: m.indoor ? 'wood' : (k === 'sand' ? 'sand' : (k === 'cobble' || k === 'rock' || k === 'cave_floor' ? 'stone' : (St.season(S) === 3 && k === 'grass' ? 'snow' : 'grass'))), vol: 0.5 }); if (k === 'grass' && Math.random() < 0.15 && m.outdoor) G.fx.burst(p.x, p.y - 1, 2, { col: ['#7ec850', '#5db644'], speed: 18, up: 14, g: 120, life: 0.4, size: 1 }); }
      // nota: sem movimento => nenhuma ação
    } else { p.moving = false; p.walkT = 0; }
    // warps
    const w = m.warpAt(p.x, p.y - 2);
    if (w && G.cooldown.warp <= 0) G.warpTo(w);
    // escadas da mina
    if (m.isMine) {
      const o = m.getObj(Math.floor(p.x / T), Math.floor((p.y - 2) / T));
      if (o && o.t === 'stairs' && G.cooldown.warp <= 0) {
        G.cooldown.warp = 1;
        if (o.dir === 'down') G.descend(1); else G.descend(-1);
      }
    }
  };
  G.descend = function (d) {
    const m = G.map, f = m.mineFloor + d;
    A.sfx('stairs');
    G.fadeOut(() => {
      if (f < 1) { G.enterMap('mountain', 20, 10, 0); }
      else if (f > VV.Mines.MAXF) { G.enterMap('mine' + VV.Mines.MAXF, null, null, null, true); }
      else {
        G.enterMap('mine' + f, null, null, null);
        const nm = G.map; const up = d > 0 ? nm.upPos : (nm.downPos || nm.upPos); G.player.x = up[0] * T + 8; G.player.y = (up[1] + (d > 0 ? 1 : 1)) * T + 6;
        if (!G.map.walkable(up[0], up[1] + 1)) { const nf = VV.World.nearestFree(nm, up[0], up[1]); G.player.x = nf[0] * T + 8; G.player.y = nf[1] * T + 14; }
      }
      G.fadeIn(); G.cooldown.warp = 1;
    }, 6);
  };
  // abertura da mina: escolher andar via elevador
  G.openMineEntrance = function () {
    const S = G.S;
    if (S.mine.elevator.length && S.flags.elevator) {
      UI().chooseFloor(S.mine.elevator, f => { G.fadeOut(() => { G.enterMap('mine' + f, null, null, null); const nm = G.map; const up = nm.upPos; const nf = VV.World.nearestFree(nm, up[0], up[1] + 1); G.player.x = nf[0] * T + 8; G.player.y = nf[1] * T + 14; G.fadeIn(); }, 6); });
      return;
    }
    G.fadeOut(() => { G.enterMap('mine1', null, null, null); const nm = G.map; const up = nm.upPos; const nf = VV.World.nearestFree(nm, up[0], up[1] + 1); G.player.x = nf[0] * T + 8; G.player.y = nf[1] * T + 14; G.fadeIn(); }, 6);
    A.sfx('stairs');
  };

  G.updateWorld = function (dt, blocked) {
    const m = G.map, S = G.S, p = G.player;
    for (const n of G.npcs) { if (n.map === m.id && !n.hidden) n.update(dt, m, G); }
    G.updateNpcMovement && G.updateNpcMovement(dt);
    for (const a of G.animals) if (a.map === m.id) a.update(dt, m);
    if (G.pet) G.pet.update(dt, m, p);
    for (const mo of G.monsters) mo.update(dt, G);
    // mortes
    for (const mo of G.monsters) if (mo.dead) G.killMonster(mo);
    G.monsters = G.monsters.filter(x => !x.dead);
    for (const d of G.drops) d.update(dt, G); G.drops = G.drops.filter(d => !d.dead);
    for (const s of G.shots) s.update(dt, G); G.shots = G.shots.filter(s => !s.dead);
    for (const e of G.effects) { e.t += dt; if (e.type === 'ring' && e.dmg && e.t > 0.15 && !e.done) { e.done = true; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < e.r && p.iframes <= 0) G.hurtPlayer(e.dmg, e.x, e.y); } }
    G.effects = G.effects.filter(e => e.t < e.life);
    G.fx.update(dt);
    // objetos com tremor
    if (m._shaking) { for (const o of m._shaking) { o.shake -= dt; } m._shaking = m._shaking.filter(o => o.shake > 0); }
    // dicas do Lumi etc.
    G.updateLumiMove && G.updateLumiMove(dt);
    // cartas / hints
    if (G.settings.hints && G.hintTimer > 45 && !blocked) { G.hintTimer = 0; if (Math.random() < 0.4) UI().hint(U.pick(D.Story.tips)); }
  };
  G.hurtPlayer = function (dmg, fx, fy) {
    const S = G.S, p = G.player;
    if (p.iframes > 0 || G.sleeping) return;
    const d = Math.max(1, Math.round(dmg - St.defense(S) * 0.6 + (Math.random() - 0.5) * 2));
    S.hp -= d; p.iframes = 0.8; p.lastHit = 0;
    const ang = Math.atan2(p.y - 6 - fy, p.x - fx); p.kvx = Math.cos(ang) * 120; p.kvy = Math.sin(ang) * 120;
    A.sfx('hurt'); VV.Render.shake(3);
    G.fx.text(p.x, p.y - 24, '-' + d, '#ff6a6a', { big: 1 });
    G.fx.burst(p.x, p.y - 8, 8, { col: ['#ff6a6a', '#fff'], speed: 60, life: 0.4 });
    if (p.fishing) G.cancelFishing();
    UI().flashDamage && UI().flashDamage();
    if (S.hp <= 0) { S.hp = 0; G.faint(); }
  };
  G.shoot = (x, y, dx, dy, spd, dmg, col) => G.shots.push(new Ent.Shot(x, y, dx, dy, spd, dmg, col));
  G.ring = (x, y, r, dmg, col) => G.effects.push({ type: 'ring', x, y, r, dmg, col, t: 0, life: 0.5 });
  G.shake = a => { if (G.settings.shake) VV.Render.shake(a); };

  /* ---------- coleta de itens ---------- */
  G.pickup = function (inst, x, y) {
    const S = G.S;
    if (!St.hasRoom(S, inst)) { if (!G._fullT || performance.now() - G._fullT > 2000) { G._fullT = performance.now(); UI().toast('Mochila cheia!', 'bad', 'sack'); A.sfx('error', { vol: 0.5 }); } return false; }
    St.addItem(S, inst);
    A.sfx('pickup', { vol: 0.6 });
    G.fx.text(x, y - 12, `+${inst.n} ${D.itemName(inst)}`, '#fff', { life: 0.9 });
    UI().refreshHud();
    return true;
  };
  // dá item direto ao jogador, soltando no chão se não couber
  G.give = function (inst, x, y) {
    const S = G.S;
    if (St.hasRoom(S, inst)) { St.addItem(S, inst); A.sfx('pickup', { vol: 0.6 }); UI().refreshHud(); return true; }
    G.drops.push(new Ent.Drop(inst, x ?? G.player.x, y ?? G.player.y - 6)); return false;
  };
  G.spawnDrop = function (id, n, x, y, extra) { G.drops.push(new Ent.Drop(Object.assign({ id, n }, extra || {}), x, y)); };

  /* ---------- helpers ---------- */
  G.facingTile = function () {
    const p = G.player, d = DIRV[p.dir];
    return { x: Math.floor(p.x / T) + d[0], y: Math.floor((p.y - 2) / T) + d[1] };
  };
  G.targetTile = function () {
    const p = G.player;
    if (G.mouseMode && VV.Input.mouse.active) {
      const w = VV.Render.screenToWorld(VV.Input.mouse.x, VV.Input.mouse.y);
      const tx = Math.floor(w.x / T), ty = Math.floor(w.y / T);
      const px = Math.floor(p.x / T), py = Math.floor((p.y - 2) / T);
      if (Math.hypot(tx - px, ty - py) <= 2.6 && !(tx === px && ty === py)) return { x: tx, y: ty };
    }
    return G.facingTile();
  };
  G.faceTile = function (t) {
    const p = G.player, px = Math.floor(p.x / T), py = Math.floor((p.y - 2) / T);
    const dx = t.x - px, dy = t.y - py;
    if (Math.abs(dx) >= Math.abs(dy)) p.dir = dx > 0 ? 2 : 1; else p.dir = dy > 0 ? 0 : 3;
  };
  G.tileCenter = (t) => ({ x: t.x * T + 8, y: t.y * T + 10 });

  G.onDiscover = function (id) {
    const it = D.ITEMS[id]; if (!it) return;
    if (G.mode === 'play') UI().toast(`Novo item registrado: ${it.n}`, 'info', id);
  };

  /* ---------- introdução ---------- */
  G.introScene = function () {
    const S = G.S;
    UI().dialog({
      name: 'Vovó Alba', portrait: null, lines: [
        'A carta da Vovó Alba estava na caixa de correio da velha fazenda...',
        'Depois de anos longe, você finalmente chegou ao Vale dos Vaga-lumes.',
        'A fazenda está tomada pelo mato, mas há algo de especial no ar. Vamos começar?',
        'Use WASD para andar, ESPAÇO para usar a ferramenta, E para interagir e TAB para abrir a mochila.',
      ], noPortrait: true, onEnd: () => { UI().toast('Dica: pegue a Enxada (1) e prepare a terra!', 'info', 'hoe'); }
    });
  };

  return G;
})();
