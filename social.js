'use strict';
/* ============================================================
   Vida social: rotinas dos NPCs (com viagem entre mapas), diálogos,
   presentes, romance e casamento, cenas de amizade, missões,
   conquistas, Lanternário, festivais, aniversários, correio e Lumi.
   ============================================================ */
(() => {
  const G = VV.G, U = VV.U, D = VV.Data, St = VV.State, T = 16, A = VV.Audio;
  const UI = () => VV.UI;
  const NP = id => D.NPCS[id];
  const hm = s => parseInt(s.slice(0, 2), 10) * 60 + parseInt(s.slice(2), 10);
  const FACE = [3, 2, 1, 0]; // direção oposta (jogador olha 0=baixo → NPC olha para cima)

  G.npcById = id => G.npcs.find(n => n.id === id) || null;
  G.earn = function (n) { const S = G.S; S.gold += n; S.earned += n; UI().refreshHud && UI().refreshHud(); };
  const say = (n, lines, cb, extra) => UI().dialog(Object.assign({ name: n ? n.name : '', npc: n ? n.id : null, lines, onEnd: cb }, extra || {}));
  const heartFx = (x, y, col) => { G.fx.burst(x, y - 22, 8, { col: col || ['#ff6a8a', '#ffb0c4', '#fff'], speed: 34, up: 40, g: -10, life: 0.9, size: 2 }); };

  /* ============================================================
     Rotinas e viagem entre mapas
     ============================================================ */
  const SPOUSE_SCHED = [['0700', 'house.kitchen'], ['0930', 'farm.house'], ['1500', 'house.table'], ['1900', 'house.spouse'], ['2100', 'house.spouse']];
  const FEST_SPOTS = ['town.fountain', 'town.market', 'town.bench1', 'town.bench2', 'town.shop_front', 'town.diner_front', 'town.clinic_front', 'town.river'];
  const FEST_FISH = ['beach.pier', 'beach.sand', 'beach.rocks', 'beach.hut_front'];

  G.festivalToday = function () {
    const S = G.S; if (!S) return null;
    const s = St.season(S), d = St.dayOfSeason(S);
    return D.Story.festivals.find(f => f.s === s && f.d === d) || null;
  };
  G.festHours = f => f.lanterns ? [1080, 1320] : f.fair ? [540, 900] : [540, 1080];
  G.birthdayToday = function () {
    const S = G.S; const s = St.season(S), d = St.dayOfSeason(S);
    for (const id in D.NPCS) { const b = D.NPCS[id].bday; if (b && b[0] === s && b[1] === d) return id; }
    return null;
  };

  G.currentEntry = function (n) {
    const S = G.S, d = n.d, rain = G.weather === 'rain' || G.weather === 'storm';
    const f = G.festival;
    if (f && S.min >= G.festHours(f)[0] && S.min < G.festHours(f)[1]) {
      const spots = f.fish ? FEST_FISH : FEST_SPOTS; const i = G.npcs.indexOf(n);
      return ['0000', spots[i % spots.length]];
    }
    let list;
    if (S.spouse === n.id) list = rain ? [['0700', 'house.kitchen'], ['1500', 'house.table'], ['1900', 'house.spouse']] : SPOUSE_SCHED;
    else {
      const sc = d.sched || {}; const we = St.weekday(S) >= 5;
      list = (rain && sc.rain) || (we && sc.we) || sc.wk || [['0800', 'town.fountain']];
    }
    let cur = list[list.length - 1];
    for (const e of list) if (hm(e[0]) <= S.min) cur = e;
    return cur;
  };
  G.resolvePoi = function (key) {
    const [mid, poi] = key.split('.'); const m = G.maps[mid]; if (!m) return null;
    const p = m.poi[poi] || m.poi.door || m.poi.spawn || [m.w >> 1, m.h >> 1];
    const f = VV.World.nearestFree(m, p[0], p[1]);
    return { map: mid, tx: f[0], ty: f[1] };
  };

  // grafo de mapas pelas portas (ignora a mina)
  function graph() {
    const g = {};
    for (const id in G.maps) {
      const m = G.maps[id]; if (m.isMine) continue; g[id] = [];
      for (const w of m.warps) { if (!G.maps[w.to] || G.maps[w.to].isMine) continue; g[id].push({ from: id, to: w.to, wx: w.x + (w.w >> 1), wy: w.y + (w.h >> 1), tx: w.tx, ty: w.ty }); }
    }
    return g;
  }
  function route(from, dest) {
    const g = graph(); const prev = { [from]: null }; const q = [from];
    while (q.length) { const c = q.shift(); if (c === dest) break; for (const e of g[c] || []) if (!(e.to in prev)) { prev[e.to] = e; q.push(e.to); } }
    if (!(dest in prev)) return null;
    const edges = []; let c = dest; while (prev[c]) { edges.unshift(prev[c]); c = prev[c].from; }
    return edges;
  }
  function plan(n, key, instant) {
    const dst = G.resolvePoi(key); if (!dst) return;
    n.destKey = key; n.dst = dst; n.route = [];
    if (n.map === dst.map && !instant && n.map === G.map.id) { n.route.push({ map: dst.map, tx: dst.tx, ty: dst.ty, warp: null }); return; }
    const edges = n.map === dst.map ? [] : route(n.map, dst.map);
    const viaPlayer = edges && (n.map === G.map.id || edges.some(e => e.to === G.map.id));
    if (instant || !edges || !viaPlayer) { n.place(dst.map, dst.tx, dst.ty); n.route = []; n.path = []; return; }
    for (const e of edges) { const f = VV.World.nearestFree(G.maps[e.from], e.wx, e.wy); n.route.push({ map: e.from, tx: f[0], ty: f[1], warp: e }); }
    n.route.push({ map: dst.map, tx: dst.tx, ty: dst.ty, warp: null });
  }
  G.placeNpcsNow = function () {
    const S = G.S;
    G.spouseNpc = S.spouse ? G.npcById(S.spouse) : null;
    for (const n of G.npcs) { n.hidden = false; n.talkTimer = 0; n.path = []; plan(n, G.currentEntry(n)[1], true); }
    G.updateNpcVisibility();
  };
  G.updateSchedules = function () {
    for (const n of G.npcs) {
      const e = G.currentEntry(n);
      if (n.destKey !== e[1]) plan(n, e[1], false);
    }
    G.updateNpcVisibility();
  };
  G.updateNpcVisibility = function () { const id = G.map && G.map.id; for (const n of G.npcs) n.hidden = n.map !== id; };
  G.updateNpcMovement = function (dt) {
    for (const n of G.npcs) {
      const leg = n.route && n.route[0]; if (!leg) continue;
      if (n.talkTimer > 0) continue;
      if (n.map !== G.map.id) { n.legT = (n.legT || 0) + dt; if (n.legT > 1.5) { n.legT = 0; finishLeg(n, leg); } continue; }
      if (n.pathFor !== leg) {
        const path = VV.World.astar(G.map, n.tx, n.ty, leg.tx, leg.ty);
        if (path == null) { finishLeg(n, leg, true); continue; }
        n.path = path; n.pathFor = leg;
      } else if (!n.path.length) finishLeg(n, leg);
    }
  };
  function finishLeg(n, leg, snap) {
    n.route.shift(); n.pathFor = null; n.legT = 0;
    if (leg.warp) {
      const w = leg.warp;
      if (n.map === G.map.id && Math.hypot(n.x - G.player.x, n.y - G.player.y) < 200) A.sfx('door', { vol: 0.25 });
      n.place(w.to, w.tx, w.ty);
    } else if (snap) n.place(leg.map, leg.tx, leg.ty);
    n.dir = leg.warp ? n.dir : 0;
    G.updateNpcVisibility();
  }

  /* ============================================================
     Presentes e gostos
     ============================================================ */
  function tagsOf(id) {
    const d = D.ITEMS[id], t = [];
    if (d.cat === 'lixo') t.push('@trash'); if (d.cat === 'peixe') t.push('@fish'); if (d.gem) t.push('@gem'); if (d.crop) t.push('@crop');
    if (d.cooked) t.push('@cooked'); if (d.forage) t.push('@forage'); if (d.sh === 'flower') t.push('@flower');
    return t;
  }
  G.taste = function (npcId, id) {
    const n = NP(npcId), tg = tagsOf(id);
    if (n.loves.includes(id)) return 'love'; if (n.hates.includes(id)) return 'hate'; if (n.likes.includes(id)) return 'like';
    if (tg.some(t => n.loves.includes(t))) return 'love'; if (tg.some(t => n.hates.includes(t))) return 'hate'; if (tg.some(t => n.likes.includes(t))) return 'like';
    return 'neutral';
  };
  const GIFT_PTS = { love: 80, like: 45, neutral: 20, hate: -40 };
  const GIFT_LINES = {
    love: ['Nossa, eu ADORO isso! Como você sabia?', 'Isso é perfeito! Muito obrigado(a) de coração!', 'Ah! É o melhor presente que ganhei em muito tempo!'],
    like: ['Que gentil! Gostei muito, obrigado(a).', 'Para mim? Que bacana, valeu!', 'Isso vai ser útil. Obrigado(a)!'],
    neutral: ['Ah... obrigado(a). É um bom gesto.', 'Hm, interessante. Valeu pela lembrança.', 'Obrigado(a), acho que vou guardar.'],
    hate: ['Ugh... Sério? Isso não é o tipo de coisa que eu gosto.', 'Hmm... isso é... uma escolha curiosa.', 'Por que você me daria isso?'],
  };
  G.canGift = (it) => { const d = it && D.ITEMS[it.id]; return !!(d && !d.tool && !d.seed && it.id !== 'lumi_crest'); };

  G.giveGift = function (n) {
    const S = G.S, held = St.held(S); if (!held) return;
    const f = St.friend(S, n.id), d = n.d, id = held.id, def = D.ITEMS[id];
    const after = cb => { UI().refreshHud(); cb && cb(); };
    // pedido de namoro
    if (id === 'bouquet') {
      if (!d.romance) { say(n, ['Que lindo buquê! Mas... acho que somos só bons amigos, ' + S.name + '.']); return; }
      if (f.dating || f.married) { say(n, ['Já temos um ao outro, bobo(a)! Mas adorei as flores.']); f.pts += 0; return; }
      if (St.hearts(S, n.id) < 8) { say(n, ['Hm... É muito gentil, mas ainda é cedo. Quem sabe mais para frente?']); return; }
      St.removeItem(S, id, 1); f.dating = 1; f.pts = Math.max(f.pts, 8 * 250 + 20);
      A.sfx('heart'); heartFx(n.x, n.y); S.stats.dating = (S.stats.dating || 0) + 1;
      UI().banner('NOVO CORAÇÃO', `${d.name} aceitou seu buquê!`);
      say(n, ['Um buquê...? Para mim?', 'Eu estava esperando por isso há tanto tempo...', 'Sim! Eu aceito. Vamos ver onde isso vai dar, ' + S.name + '.'], () => after());
      return;
    }
    if (id === 'pendant') {
      if (!d.romance || !f.dating) { say(n, [d.romance ? 'Isso é... muito, muito sério! Precisamos ir com calma.' : 'Um pingente? Acho que você se enganou de pessoa, hehe.']); return; }
      if (St.hearts(S, n.id) < 10 || S.houseLvl < 1) { say(n, [St.hearts(S, n.id) < 10 ? 'Eu... preciso me sentir mais próximo(a) de você antes disso. Ainda não.' : 'Adoraria, mas sua casa ainda é muito pequena para nós dois. Melhore-a com o Seu Ney!']); return; }
      if (S.spouse || S.wedding) { say(n, ['Hm? Você já está comprometido(a)...']); return; }
      St.removeItem(S, id, 1); f.engaged = 1; S.wedding = { npc: n.id, day: S.day + 3 };
      A.sfx('heart'); heartFx(n.x, n.y); UI().banner('NOIVADO!', `Casamento em 3 dias com ${d.name}`);
      say(n, ['...É o Pingente Vaga-lume. Eu não consigo acreditar.', 'SIM! Mil vezes sim!', 'Daqui a três dias, ao amanhecer, na vila. Eu não vou dormir de tanta ansiedade!'], () => after());
      return;
    }
    // presente comum
    if (S.daily.gifted[n.id]) { say(n, ['Você já me deu um presente hoje! Não precisa se esforçar tanto.']); return; }
    if (f.giftWeek >= 2) { say(n, ['Já recebi presentes demais esta semana... Volte semana que vem!']); return; }
    const taste = G.taste(n.id, id);
    let pts = GIFT_PTS[taste]; const bday = G.birthdayToday() === n.id;
    if (bday && taste !== 'hate') pts *= 8; else if (bday) pts *= 2;
    pts = Math.round(pts * [1, 1.1, 1.25, 1.5][held.q || 0]);
    St.removeItem(S, id, 1); S.daily.gifted[n.id] = 1; f.giftWeek++; f.gifted++; f.lastGift = S.day; S.stats.gifts = (S.stats.gifts || 0) + 1;
    const up = St.addFriend(S, n.id, pts);
    const lines = [U.pick(GIFT_LINES[taste])]; if (bday) lines.unshift('Você lembrou do meu aniversário?! Que dia incrível!');
    if (taste === 'love') { A.sfx('gift'); heartFx(n.x, n.y); } else if (taste === 'hate') A.sfx('error', { vol: 0.4 }); else A.sfx('gift', { vol: 0.6 });
    G.fx.text(n.x, n.y - 36, (pts > 0 ? '+' : '') + pts, pts > 0 ? '#ff7aa6' : '#9aa0aa');
    say(n, lines, () => { after(); if (up) { UI().toast(`${d.name}: ${St.hearts(S, n.id)} corações!`, 'good', 'heart'); A.sfx('heart'); } });
  };

  /* ============================================================
     Interação com NPCs
     ============================================================ */
  G.interactNpc = function (n) {
    const S = G.S, f = St.friend(S, n.id), held = St.held(S);
    n.talkTimer = 1.5; n.path = []; n.dir = FACE[G.player.dir];
    if (G.festivalInteract && G.festivalInteract(n)) return;
    if (!f.met) {
      f.met = 1; S.flags['talked_' + n.id] = 1; S.daily.talked[n.id] = 1; St.addFriend(S, n.id, 20);
      say(n, n.d.lines.intro || ['Olá!'], () => G.checkQuests());
      return;
    }
    const opts = [{ t: 'Conversar', v: 'talk' }];
    if (held && G.canGift(held)) opts.push({ t: `Dar: ${D.itemName(held)}`, v: 'gift' });
    if (S.spouse === n.id) opts.push({ t: 'Abraçar', v: 'hug' });
    if (opts.length === 1) return G.talkNpc(n);
    UI().choose({ name: n.name, npc: n.id, text: U.pick(['O que você quer fazer?', 'Sim?', 'Pois não?']), options: opts, cb: v => { if (v === 'talk') G.talkNpc(n); else if (v === 'gift') G.giveGift(n); else if (v === 'hug') G.hugSpouse(n); } });
  };
  G.hugSpouse = function (n) {
    const S = G.S; if (S.daily.hug) { say(n, ['Já ganhei meu abraço hoje... mas pode dar outro!']); return; }
    S.daily.hug = 1; St.addFriend(S, n.id, 30); A.sfx('heart'); heartFx(n.x, n.y); S.energy = Math.min(S.maxEnergy, S.energy + 15); UI().refreshHud();
    say(n, [U.pick(['Mmm... precisava disso.', 'Você sempre sabe como alegrar meu dia.', 'Te amo, sabia?', 'Vamos ficar assim mais um pouquinho.'])]);
  };
  const SPOUSE_LINES = ['Como foi o trabalho na fazenda hoje?', 'Sinto que esta casa nunca esteve tão cheia de luz.', 'Fiz algo gostoso para o jantar. Não demore!', 'Às vezes olho pela janela e vejo os vaga-lumes... lembro de por que escolhi ficar.', 'Cuidado na mina, tá? Eu me preocupo.'];
  G.talkNpc = function (n) {
    const S = G.S, f = St.friend(S, n.id), d = n.d, hr = St.hearts(S, n.id);
    // cena de amizade pendente
    const si = (d.stories || []).findIndex((s, i) => hr >= s.h && !f.stories.includes(i));
    if (si >= 0) return G.playStory(n, si);
    let gain = 0;
    if (!S.daily.talked[n.id]) { S.daily.talked[n.id] = 1; gain = 20 + (f.dating || f.married ? 10 : 0); f.talked++; S.stats.talks = (S.stats.talks || 0) + 1; }
    S.flags['talked_' + n.id] = 1;
    const up = gain && St.addFriend(S, n.id, gain);
    if (gain) { heartFx(n.x, n.y, ['#ff9ab4']); G.fx.text(n.x, n.y - 34, '+' + gain, '#ff7aa6'); }
    const L = d.lines, rain = G.weather === 'rain' || G.weather === 'storm';
    let pool;
    if (S.spouse === n.id) pool = SPOUSE_LINES.concat(L.high || []);
    else if (G.birthdayToday() === n.id) pool = ['Hoje é meu aniversário! Você... talvez tenha um presentinho?'];
    else if (rain && L.rain && Math.random() < 0.6) pool = L.rain;
    else if (Math.random() < 0.25 && L['s' + St.season(S)]) pool = L['s' + St.season(S)];
    else pool = hr >= 6 ? (L.high || L.mid) : hr >= 3 ? (L.mid || L.low) : (L.low || ['...']);
    let line = U.pick(pool); if (pool.length > 1 && line === n.lastLine) line = U.pick(pool); n.lastLine = line;
    say(n, [line], () => { if (up) { A.sfx('heart'); UI().toast(`${d.name}: ${St.hearts(S, n.id)} corações!`, 'good', 'heart'); } G.checkQuests(); });
  };
  G.playStory = function (n, i) {
    const S = G.S, f = St.friend(S, n.id), st = n.d.stories[i];
    f.stories.push(i);
    say(n, st.lines, () => {
      if (st.gift && st.gift[1] > 0) { G.give({ id: st.gift[0], n: st.gift[1] }); UI().toast(`Recebeu: ${D.ITEMS[st.gift[0]].n}${st.gift[1] > 1 ? ' x' + st.gift[1] : ''}`, 'good', st.gift[0]); if (st.gift[0] === 'lumi_crest') { S.flags.heart1 = 1; G.recalcMaxStats(); } }
      if (st.recipe && !S.known.cook.includes(st.recipe)) { S.known.cook.push(st.recipe); UI().toast(`Nova receita: ${D.ITEMS[st.recipe] ? D.ITEMS[st.recipe].n : st.recipe}`, 'good', st.recipe); A.sfx('quest'); }
      if (st.flag) S.flags[st.flag] = 1;
      A.sfx('heart'); heartFx(n.x, n.y); G.checkQuests();
    });
  };
  G.petPet = function () {
    const S = G.S, p = G.pet; if (S.daily.pet) { UI().toast(`${S.petName} adora carinho, mas já ganhou muito hoje!`, 'info', 'heart'); A.sfx('click'); return; }
    S.daily.pet = 1; S.energy = Math.min(S.maxEnergy, S.energy + 5); heartFx(p.x, p.y); A.sfx(S.pet === 'cat' ? 'chicken' : 'heart', { vol: 0.6 });
    UI().toast(`Você fez carinho em ${S.petName}. +5 energia`, 'good', 'heart'); UI().refreshHud();
  };

  /* ============================================================
     Casamento, entrada em mapas e novo dia
     ============================================================ */
  G.afterEnter = function (m, prev) {
    const S = G.S; S.flags['reach_' + m.id] = 1;
    if (m.id === 'farm' && G.lumi) G.lumi.map = 'farm';
    G.checkQuests();
  };
  G.onMapChange = function () { G.updateNpcVisibility(); };
  G.afterDawn = function () {
    const S = G.S;
    if (St.weekday(S) === 0) for (const id in S.friends) S.friends[id].giftWeek = 0;
    G.genRequests();
    for (const l of D.Story.letters) if (l.day === S.day) G.addMail({ id: l.id, from: l.from, title: l.title, text: l.text });
    const bd = G.birthdayToday();
    if (bd && St.hearts(S, bd) >= 4) { const nm = NP(bd), gi = U.pick(nm.loves.filter(x => D.ITEMS[x]).length ? ['lure', 'bait', 'cookie', 'bomb'] : ['bait']); G.addMail({ id: `bd_${bd}_${St.year(S)}`, from: nm.name, title: 'Hoje é meu aniversário!', text: `Oi!\n\nHoje é meu aniversário e queria te ver na vila. Mande um presente se lembrar... não precisa, mas eu adoraria!\n\n— ${nm.name}`, items: St.hearts(S, bd) >= 6 ? [{ id: D.ITEMS[gi] ? gi : 'bait', n: 3 }] : null }); }
    if (S.wedding && S.day >= S.wedding.day && !S.wedding.done) { S.wedding.done = 1; setTimeout(() => G.weddingScene(), 900); }
    const unread = S.mail.filter(m => !S.readMail.includes(m.id)).length;
    if (unread) UI().toast(`Você tem ${unread} carta${unread > 1 ? 's' : ''} na caixa de correio!`, 'info', 'mail');
    G.checkQuests();
  };
  G.weddingScene = function () {
    const S = G.S, w = S.wedding; if (!w) return; const n = G.npcById(w.npc), f = St.friend(S, w.npc);
    G.fadeOut(() => {
      G.enterMap('town', 23, 23, 3, true); G.fadeIn();
      A.play('town');
      say(n, [`${NP(w.npc).name}: Hoje o vale está mais bonito que nunca.`, 'Zé: Reunidos aqui, sob a luz do Lanternário, para celebrar a união de duas almas.', `Zé: ${S.name}, você aceita compartilhar a vida, a terra e as luzes com ${NP(w.npc).name}?`, `${S.name}: Aceito.`, `${NP(w.npc).name}: Eu também. Para sempre.`, 'Zé: Então eu os declaro... casados! Que os vaga-lumes sejam testemunhas!'], () => {
        S.spouse = w.npc; f.married = 1; f.engaged = 0; f.dating = 1; S.wedding = null; S.flags.heart2 = 1; S.stats.married = 1; G.recalcMaxStats();
        A.sfx('achieve'); UI().banner('CASADOS!', `${NP(w.npc).name} agora mora na fazenda`);
        for (let i = 0; i < 5; i++) setTimeout(() => G.fx.burst(G.player.x + U.ri(-40, 40), G.player.y - U.ri(10, 40), 18, { col: ['#ff6a8a', '#ffe66a', '#fff'], speed: 60, up: 40, life: 1.2 }), i * 250);
        G.placeNpcsNow(); G.checkAchievements();
      }, { noPortrait: true });
    });
  };

  /* ============================================================
     Correio e pedidos do quadro
     ============================================================ */
  G.addMail = function (m) { const S = G.S; if (S.mail.some(x => x.id === m.id)) return; S.mail.push(Object.assign({ day: S.day }, m)); };
  G.readMail = function (m) {
    const S = G.S; if (!S.readMail.includes(m.id)) S.readMail.push(m.id);
    if (m.items && !m.taken) { m.taken = 1; for (const it of m.items) G.give(Object.assign({}, it)); if (m.gold) G.earn(m.gold); }
  };
  G.genRequests = function () {
    const S = G.S; S.requests = S.requests.filter(r => r.until >= S.day);
    if (S.requests.length >= 3 || S.day % 2 === 0 && S.requests.length >= 1) return;
    const pool = D.Story.requests.filter(r => !S.requests.some(x => x.text === r.text) && S.friends[r.npc] && S.friends[r.npc].met);
    if (!pool.length) return;
    const r = U.pick(pool); S.requests.push({ npc: r.npc, text: r.text, need: r.need, reward: r.reward, until: S.day + U.ri(4, 7), id: S.day * 100 + S.requests.length });
  };
  G.requestCan = r => r.need.every(([id, n]) => St.countItem(G.S, id) >= n);
  G.requestDone = function (r) {
    const S = G.S; if (!G.requestCan(r)) return false;
    for (const [id, n] of r.need) St.removeItem(S, id, n);
    if (r.reward.gold) G.earn(r.reward.gold); if (r.reward.items) for (const [id, n] of r.reward.items) G.give({ id, n });
    St.addFriend(S, r.npc, 60); S.requests = S.requests.filter(x => x !== r); S.stats.requests = (S.stats.requests || 0) + 1;
    A.sfx('quest'); UI().toast(`Pedido concluído! +${r.reward.gold || 0}G`, 'good', 'coin'); G.checkQuests(); return true;
  };

  /* ============================================================
     Missões e conquistas
     ============================================================ */
  const Q = id => D.Story.quests.find(q => q.id === id);
  G.questById = Q;
  function goalMet(g) {
    const S = G.S;
    switch (g.type) {
      case 'flag': return !!S.flags[g.flag];
      case 'have': return St.countItem(S, g.id) >= g.n;
      case 'stat': return (S.stats[g.stat] || 0) >= g.n;
      case 'talk': return !!S.flags['talked_' + g.npc];
      case 'reach': return !!S.flags['reach_' + g.map];
      case 'skill': return St.skillLevel(S, g.skill) >= g.lv;
      case 'build': return !!S.buildings[g.id];
      case 'kill': return (S.stats.kills || 0) >= g.n;
      case 'catch': return (S.stats.fishCaught || 0) >= g.n;
      case 'harvest': return (S.stats.harvested || 0) >= g.n;
    }
    return false;
  }
  G.questProgress = function (q) {
    const S = G.S, g = q.goal;
    if (g.type === 'have') return [Math.min(g.n, St.countItem(S, g.id)), g.n];
    if (g.type === 'stat') return [Math.min(g.n, S.stats[g.stat] || 0), g.n];
    if (g.type === 'kill') return [Math.min(g.n, S.stats.kills || 0), g.n];
    if (g.type === 'catch') return [Math.min(g.n, S.stats.fishCaught || 0), g.n];
    if (g.type === 'harvest') return [Math.min(g.n, S.stats.harvested || 0), g.n];
    return null;
  };
  G.checkQuests = function () {
    const S = G.S; if (!S) return;
    if (S.animals.length && !S.flags.hasAnimal) S.flags.hasAnimal = 1;
    for (const id of S.quests.active.slice()) {
      const q = Q(id); if (!q) { S.quests.active = S.quests.active.filter(x => x !== id); continue; }
      if (!goalMet(q.goal)) continue;
      S.quests.active = S.quests.active.filter(x => x !== id); S.quests.done.push(id);
      const r = q.reward || {};
      if (r.gold) G.earn(r.gold); if (r.items) for (const [i, n] of r.items) G.give({ id: i, n });
      A.sfx('quest'); UI().banner('MISSÃO CONCLUÍDA', q.title);
      if (q.next && !S.quests.done.includes(q.next) && !S.quests.active.includes(q.next)) { S.quests.active.push(q.next); const nq = Q(q.next); if (nq) setTimeout(() => UI().toast(`Nova missão: ${nq.title}`, 'info', 'quest'), 1800); }
    }
  };
  function statOf(k) {
    const S = G.S;
    switch (k) {
      case 'earned': return S.earned; case 'days': return S.day; case 'animals': return S.animals.length; case 'married': return S.stats.married || 0;
      case 'lanternario': return S.flags.lanternarioDone ? 1 : 0;
      case 'bestFriends': return Object.keys(D.NPCS).filter(id => St.hearts(S, id) >= 8).length;
      case 'collected': return Object.keys(S.collected).length;
      default: return S.stats[k] || 0;
    }
  }
  G.checkAchievements = function () {
    const S = G.S; if (!S) return;
    for (const a of D.Story.achievements) {
      if (S.ach[a.id]) continue;
      if (statOf(a.stat) >= a.v) { S.ach[a.id] = S.day; UI().banner('CONQUISTA', a.n); A.sfx('achieve'); G.shake && G.shake(0); }
    }
  };

  /* ============================================================
     Lanternário (ofertas)
     ============================================================ */
  G.bundleCandidates = function (bi, slot) {
    const S = G.S, b = D.Story.bundles[bi], it = b.items[slot];
    return it.any.filter(id => St.countItem(S, id) >= it.n);
  };
  G.deliverBundle = function (bi, slot, id) {
    const S = G.S, b = D.Story.bundles[bi], it = b.items[slot];
    if (S.bundles[b.id][slot] || !it.any.includes(id) || St.countItem(S, id) < it.n) return false;
    St.removeItem(S, id, it.n); S.bundles[b.id][slot] = id; A.sfx('ring'); UI().refreshHud();
    G.fx.burst(G.player.x, G.player.y - 20, 16, { col: [b.color, '#fff', '#ffe66a'], speed: 60, up: 40, life: 0.9 });
    if (S.bundles[b.id].every(v => v)) G.completeBundle(b);
    return true;
  };
  G.completeBundle = function (b) {
    const S = G.S; S.flags[b.reward.flag] = 1; S.flags['bundle' + G.lanternLevel()] = 1; S.flags.bundle1 = 1;
    A.sfx('achieve'); UI().banner(b.name.toUpperCase() + ' RESTAURADA', b.reward.text);
    if (b.reward.flag === 'greenhouse') S.buildings.greenhouse = true;
    if (b.reward.flag === 'forageBoost' && !S.known.cook.includes('lumi_tea')) S.known.cook.push('lumi_tea');
    G.applyBuildings(); G.shake && G.shake(4);
    if (G.lanternLevel() >= 6) { S.flags.lanternarioDone = 1; setTimeout(() => G.finalScene(), 3200); }
    G.checkQuests(); G.checkAchievements();
  };
  G.finalScene = function () {
    const S = G.S; if (S.flags.lumiFinal) return; S.flags.lumiFinal = 1;
    UI().dialog({ name: 'Lumi', lines: D.Story.lumi.final, noPortrait: true, onEnd: () => { A.sfx('firefly'); UI().banner('O VALE BRILHA', 'Os vaga-lumes voltaram para casa'); S.flags.firefliesBack = 1; } });
  };

  /* ============================================================
     Festivais
     ============================================================ */
  G.festivalInteract = function (n) {
    const S = G.S, f = G.festival; if (!f) return false;
    const [a, b] = G.festHours(f); if (S.min < a || S.min >= b) return false;
    const key = 'fest_' + n.id; S.daily[key] = S.daily[key];
    if (!S.daily[key] && St.friend(S, n.id).met) { S.daily[key] = 1; St.addFriend(S, n.id, 25); heartFx(n.x, n.y); G.fx.text(n.x, n.y - 34, '+25', '#ff7aa6'); }
    if (f.gift && n.id === 'luna' && !S.calendar['gift' + S.day]) {
      S.calendar['gift' + S.day] = 1; say(n, [`Luna: Feliz ${f.name}! Pegue um buquê — é tradição dar flores hoje.`], () => { G.give({ id: f.gift[0], n: f.gift[1] }); UI().toast('Recebeu: Buquê', 'good', 'bouquet'); }); return true;
    }
    if (f.fair && n.id === 'ze') {
      const yk = 'fair_' + St.year(S);
      if (S.flags[yk]) { say(n, ['Zé: Que bela feira, não? Você já expôs sua colheita este ano!']); return true; }
      UI().choose({ name: n.name, npc: n.id, text: 'Quer expor suas melhores colheitas na feira?', options: [{ t: 'Expor (usa itens da mochila)', v: 1 }, { t: 'Agora não', v: 0 }], cb: v => { if (v) G.runFair(n); } });
      return true;
    }
    if (f.fish && n.id === 'nina') {
      const c = S.calendar.contest;
      say(n, [`Nina: O concurso vai até as 15h! Pesque o máximo que puder. ${c && c.day === S.day ? `Sua pontuação: ${c.score}.` : 'Você ainda não pescou nada.'}`]); return true;
    }
    return false;
  };
  G.runFair = function (n) {
    const S = G.S, list = [];
    for (const s of S.inv.slice(0, S.invSize)) if (s) { const d = D.ITEMS[s.id]; if (d && (d.crop || d.cooked || d.cat === 'artesanato' || d.cat === 'animal')) list.push({ id: s.id, pts: Math.ceil(D.sellPrice(s) / 20) }); }
    list.sort((a, b) => b.pts - a.pts); const top = list.slice(0, 5); const score = top.reduce((a, b) => a + b.pts, 0);
    S.flags['fair_' + St.year(S)] = 1;
    const prize = score >= 200 ? [1500, '1º lugar!'] : score >= 120 ? [800, '2º lugar'] : score >= 60 ? [400, '3º lugar'] : [150, 'Participação'];
    say(n, [`Zé: Vamos ver... você expôs ${top.length} itens, somando ${score} pontos.`, `Zé: Resultado: ${prize[1]} Prêmio: ${prize[0]}G!`], () => { G.earn(prize[0]); A.sfx(score >= 60 ? 'achieve' : 'coin'); S.stats.fairs = (S.stats.fairs || 0) + 1; G.checkAchievements(); });
  };
  G.fishingContest = function (fish) {
    const S = G.S, f = G.festival; if (!f || !f.fish || S.min < 540 || S.min >= 900 || G.map.id !== 'beach') return;
    let c = S.calendar.contest; if (!c || c.day !== S.day) c = S.calendar.contest = { day: S.day, score: 0, n: 0 };
    const pts = Math.round(D.ITEMS[fish.id].p / 10 + fish.diff * 3); c.score += pts; c.n++;
    UI().toast(`Concurso: +${pts} pontos (total ${c.score})`, 'info', 'fish');
  };
  G.finishContest = function () {
    const S = G.S, c = S.calendar.contest; if (!c || c.day !== S.day || c.done) { UI().toast('O concurso de pesca terminou.', 'info', 'fish'); return; }
    c.done = 1; const base = 120 + St.year(S) * 60;
    const rivals = [U.ri(base, base * 3), U.ri(base, base * 3.5), U.ri(base, base * 4)];
    const rank = 1 + rivals.filter(r => r > c.score).length;
    const prize = [[1500, 'lure', 5], [800, 'bait', 10], [400, 'bait', 5], [100, 'bait', 2]][rank - 1];
    G.earn(prize[0]); G.give({ id: prize[1], n: prize[2] }); S.stats.contests = (S.stats.contests || 0) + 1;
    UI().banner('CONCURSO DE PESCA', `${rank}º lugar com ${c.score} pontos! +${prize[0]}G`); A.sfx(rank === 1 ? 'achieve' : 'quest');
  };
  G.lanternScene = function () {
    const S = G.S; const yk = 'lant_' + St.year(S); if (S.flags[yk]) return; S.flags[yk] = 1;
    UI().dialog({
      name: 'Zé', npc: 'ze', lines: ['Zé: Atenção, atenção! Que comecem as Lanternas!', 'Zé: Cada luz que subir é um pedido ao vale. Faça o seu!', 'Lumi: ...eu vi uma luz enorme. Faça um pedido, fazendeiro.'], onEnd: () => {
        A.sfx('firefly'); for (let i = 0; i < 14; i++) setTimeout(() => G.fx.burst(G.player.x + U.ri(-70, 70), G.player.y - U.ri(10, 60), 10, { col: ['#ffe66a', '#ffb347', '#fff'], speed: 24, up: 60, g: -20, life: 2, size: 2 }), i * 180);
        for (const n of G.npcs) if (St.friend(S, n.id).met) St.addFriend(S, n.id, 25);
        G.give({ id: 'lumi_shard', n: 1 }); UI().banner('FESTA DAS LANTERNAS', 'Todos se sentem mais próximos'); G.checkAchievements();
      }
    });
  };
  G.festivalTick = function () {
    const S = G.S, f = G.festival; if (!f) return;
    if (S.min === 540) UI().toast(`${f.name} começou! Vá até ${f.fish ? 'a praia' : 'a vila'}.`, 'good', 'star');
    if (f.fish && S.min === 900) G.finishContest();
    if (f.lanterns) {
      if (S.min === 1080) UI().toast('As lanternas serão acesas na vila! Vá para lá.', 'info', 'lamp');
      if (S.min >= 1080 && S.min < 1320 && G.map.id === 'town' && !G.fade.a && !S.flags['lant_' + St.year(S)]) G.lanternScene();
    }
  };

  /* ============================================================
     Lumi
     ============================================================ */
  G.updateLumi = function () {
    const S = G.S, L = G.lumi, m = G.map;
    const wantsIntro = !S.flags.metLumi && S.day <= 3;
    L.visible = !!m && !m.isMine && (m.outdoor ? (G.night > 0.4 || wantsIntro) : false);
    if (wantsIntro && m.id !== 'farm') L.visible = false;
    if (L.visible && L.map !== m.id) { L.map = m.id; L.x = G.player.x + 30; L.y = G.player.y - 30; }
  };
  G.updateLumiMove = function (dt) {
    const L = G.lumi, S = G.S, p = G.player, m = G.map; if (!L) return;
    L.t += dt; if (!L.visible || L.map !== m.id) { if (m.outdoor && !m.isMine && L.map !== m.id) G.updateLumi(); return; }
    let tx, ty;
    if (!S.flags.metLumi) { tx = 12 * T + Math.cos(L.t * 0.6) * 10; ty = 10 * T + Math.sin(L.t * 0.9) * 6; }
    else { tx = p.x + Math.cos(L.t * 0.7) * 30; ty = p.y - 26 + Math.sin(L.t * 1.3) * 7; }
    const k = Math.min(1, dt * (S.flags.metLumi ? 2.2 : 1.2)); L.x += (tx - L.x) * k; L.y += (ty - L.y) * k;
  };
  G.talkLumi = function () {
    const S = G.S, L = D.Story.lumi;
    if (!S.flags.metLumi) {
      UI().dialog({ name: 'Lumi', lines: L.intro, noPortrait: true, onEnd: () => { S.flags.metLumi = 1; A.sfx('quest'); UI().banner('LUMI', 'O espírito dos vaga-lumes'); G.checkQuests(); } }); return;
    }
    if (S.flags.lanternarioDone && !S.flags.lumiFinal) { G.finalScene(); return; }
    const lines = [U.pick(L.tips)];
    if (G.night > 0.5 && !S.daily.lumiGift && G.lanternLevel() >= 1 && Math.random() < 0.35) { S.daily.lumiGift = 1; lines.push('Lumi: Achei isto brilhando para você. Fique com ele.'); UI().dialog({ name: 'Lumi', lines, noPortrait: true, onEnd: () => { G.give({ id: 'lumi_blossom', n: 1 }); A.sfx('gift'); } }); return; }
    UI().dialog({ name: 'Lumi', lines, noPortrait: true });
  };
})();
