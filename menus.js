'use strict';
/* ============================================================
   Interface: menu principal (abas), pausa, resumo do dia, quadro,
   correio, Lanternário e utilidades.
   ============================================================ */
(() => {
  const UI = VV.UI, U = VV.U, D = VV.Data, St = VV.State, h = U.h, A = VV.Audio;
  const G = () => VV.G;
  const TAGS = { '@fish': 'Peixes', '@gem': 'Gemas', '@crop': 'Colheitas', '@cooked': 'Pratos', '@forage': 'Itens de coleta', '@flower': 'Flores', '@trash': 'Lixo' };
  const tname = id => TAGS[id] || (D.ITEMS[id] ? D.ITEMS[id].n : id);
  let selIdx = null;

  const TABS = [['inv', 'Mochila'], ['craft', 'Fabricar'], ['skills', 'Habilidades'], ['social', 'Amigos'], ['quests', 'Missões'], ['coll', 'Coleção'], ['map', 'Mapa'], ['opt', 'Opções']];
  let curTab = 'inv';

  UI.openMenu = function (tab) {
    if (UI.top() && UI.top().opts.menu) { curTab = tab || curTab; UI.refreshTop(); return; }
    curTab = tab || 'inv'; selIdx = null;
    const box = h('div', { class: 'win big menuwin' });
    const nav = h('div', { class: 'tabs' }), body = h('div', { class: 'wbody tabbody' });
    box.append(h('div', { class: 'wtitle' }, h('span', null, 'Vale dos Vaga-lumes'), h('button', { class: 'xbtn', onclick: () => UI.close() }, '✕')), h('div', { class: 'menucols' }, nav, body));
    const m = UI.open(box, { menu: true, onClose: () => { selIdx = null; } });
    const refresh = () => {
      nav.replaceChildren(...TABS.map(([k, n]) => h('button', { class: 'tab' + (k === curTab ? ' on' : ''), onclick: () => { curTab = k; A.sfx('click', { vol: 0.5 }); refresh(); } }, n)));
      const sc = body.scrollTop; body.replaceChildren(); TAB[curTab](body, refresh); body.scrollTop = sc;
    };
    m.refresh = refresh; refresh();
  };

  /* ---------- mochila ---------- */
  function equip(idx, refresh) {
    const S = G().S, it = S.inv[idx]; if (!it) return; const d = D.ITEMS[it.id];
    if (d.ring) { const sl = !S.rings[0] ? 0 : !S.rings[1] ? 1 : 0; const old = S.rings[sl]; S.rings[sl] = { id: it.id, n: 1 }; S.inv[idx] = old ? { id: old.id, n: 1 } : null; A.sfx('ring'); }
    else if (d.boots) { const old = S.boots; S.boots = { id: it.id, n: 1 }; S.inv[idx] = old ? { id: old.id, n: 1 } : null; A.sfx('ring'); }
    else if (d.food || it.id === 'estrelafruta') {
      if (idx >= 12) { UI.toast('Coloque o item na barra de atalhos (primeiras 12 posições) para consumir.', 'warn'); return; }
      S.sel = idx; if (G().eat()) { UI.close(); return; }
    } else return;
    G().recalcMaxStats(); UI.refreshHud(); refresh();
  }
  function unequip(kind, i, refresh) {
    const S = G().S; const it = kind === 'ring' ? S.rings[i] : S.boots; if (!it) return;
    if (!St.hasRoom(S, { id: it.id, n: 1 })) { UI.toast('Mochila cheia!', 'bad'); return; }
    St.addItem(S, { id: it.id, n: 1 }); if (kind === 'ring') S.rings[i] = null; else S.boots = null; A.sfx('ring'); UI.refreshHud(); refresh();
  }
  function sortInv(refresh) {
    const S = G().S; const items = S.inv.slice(12, S.invSize).filter(Boolean);
    const catOrder = ['ferramenta', 'especial', 'semente', 'cultura', 'peixe', 'comida', 'coleta', 'animal', 'artesanato', 'mineral', 'recurso', 'lixo'];
    items.sort((a, b) => (catOrder.indexOf(D.ITEMS[a.id].cat) - catOrder.indexOf(D.ITEMS[b.id].cat)) || a.id.localeCompare(b.id) || (b.q || 0) - (a.q || 0));
    const merged = []; for (const it of items) { const l = merged[merged.length - 1]; if (l && l.id === it.id && (l.q || 0) === (it.q || 0) && (l.from || '') === (it.from || '') && !D.ITEMS[it.id].tool) l.n += it.n; else merged.push(it); }
    for (let i = 12; i < S.invSize; i++) S.inv[i] = merged[i - 12] || null; A.sfx('click'); refresh();
  }
  const TAB = {};
  TAB.inv = (body, refresh) => {
    const S = G().S;
    const left = h('div', { class: 'invleft' });
    left.append(h('div', { class: 'pcard' }, UI.playerPortrait(), h('div', null, h('b', null, S.name), h('div', { class: 'dim' }, S.farm), h('div', { class: 'dim' }, St.dateText(S)))));
    left.append(h('div', { class: 'stats' },
      h('div', null, UI.miniImg('coin'), ` ${U.fmt(S.gold)}G`), h('div', null, UI.miniImg('heart'), ` ${Math.round(S.hp)}/${S.maxHp}`), h('div', null, UI.miniImg('bolt'), ` ${Math.round(S.energy)}/${S.maxEnergy}`),
      h('div', { class: 'dim' }, `Ataque +${St.attackBonus(S)} · Defesa ${St.defense(S)} · Sorte ${St.luck(S)}`), h('div', { class: 'dim' }, `Tempo de jogo: ${Math.floor(S.playtime)}h ${Math.floor(S.playtime % 1 * 60)}min`)));
    const eq = h('div', { class: 'equip' }, h('div', { class: 'dim' }, 'Equipamento'));
    const er = h('div', { class: 'row' });
    for (let i = 0; i < 2; i++) er.append(UI.slot(S.rings[i], { cls: 'eqs', onclick: () => unequip('ring', i, refresh) }));
    er.append(UI.slot(S.boots, { cls: 'eqs', onclick: () => unequip('boots', 0, refresh) })); eq.append(er, h('div', { class: 'dim sm' }, 'Anel · Anel · Botas (clique para remover)'));
    left.append(eq);
    if (S.buffs.length) left.append(h('div', { class: 'dim' }, 'Efeitos: ' + S.buffs.map(b => `${D.BUFFS[b.stat]} +${b.val}`).join(', ')));
    left.append(h('div', { class: 'row' }, UI.btn('Organizar', () => sortInv(refresh)), UI.btn(selIdx != null ? 'Descartar' : 'Descartar…', () => { if (selIdx == null) { UI.toast('Selecione um item primeiro.', 'info'); return; } const it = S.inv[selIdx]; if (!it || D.ITEMS[it.id].tool) { UI.toast('Ferramentas não podem ser descartadas.', 'warn'); return; } UI.confirm(`Descartar ${D.itemName(it)} x${it.n}?`, () => { S.inv[selIdx] = null; selIdx = null; refresh(); UI.refreshHud(); }); }, 'warn')));
    const grid = h('div', { class: 'grid inv' });
    for (let i = 0; i < 36; i++) {
      const locked = i >= S.invSize;
      grid.append(UI.slot(S.inv[i], {
        locked, sel: selIdx === i, label: i < 12 ? (i < 9 ? i + 1 : i === 9 ? 0 : i === 10 ? '-' : '=') : null,
        onclick: () => { if (locked) { UI.toast('Compre uma mochila maior na Oficina do Seu Ney.', 'info', 'sack'); return; } if (selIdx == null) { if (S.inv[i]) { selIdx = i; A.sfx('click', { vol: 0.5 }); } } else { const a = selIdx; selIdx = null; if (a !== i) { const t = S.inv[a]; S.inv[a] = S.inv[i]; S.inv[i] = t; A.sfx('pickup', { vol: 0.5 }); UI.refreshHud(); } } refresh(); },
        onright: () => equip(i, refresh),
      }));
    }
    body.append(h('div', { class: 'invwrap' }, left, h('div', null, grid, h('div', { class: 'dim sm' }, 'Clique para mover/trocar · clique direito para equipar ou comer'))));
  };

  /* ---------- fabricação ---------- */
  TAB.craft = (body, refresh) => { G().updateRecipes(); UI.craftList(body, refresh); };
  UI.craftList = function (body, refresh) {
    const S = G().S; const list = h('div', { class: 'recipes' });
    for (const r of D.CRAFT) {
      if (!S.known.craft.includes(r.id)) continue;
      const can = G().craftCan(r);
      const row = h('div', { class: 'recipe' + (can ? '' : ' no') }, UI.slot({ id: r.out, n: r.qty }, { tip: true }),
        h('div', { class: 'rinfo' }, h('b', null, D.ITEMS[r.out].n + (r.qty > 1 ? ' x' + r.qty : '')), h('div', { class: 'reqs' }, Object.entries(r.req).map(([id, n]) => { const have = St.countItem(S, id); return h('span', { class: have >= n ? 'ok' : 'bad' }, UI.itemImg({ id }, 'ti'), ` ${have}/${n} `); }))),
        UI.btn('Fabricar', () => { if (G().craft(r)) refresh(); }, can ? 'ok' : 'dis'));
      list.append(row);
    }
    const locked = D.CRAFT.filter(r => !S.known.craft.includes(r.id));
    body.append(h('div', { class: 'dim' }, 'Fabricar itens e equipamentos com seus materiais.'), list, locked.length ? h('div', { class: 'dim sm' }, `${locked.length} receita(s) ainda por descobrir — suba suas habilidades!`) : null);
  };

  /* ---------- habilidades ---------- */
  TAB.skills = body => {
    const S = G().S; const wrap = h('div', { class: 'skills' });
    for (const k in D.SKILLS) {
      const sk = D.SKILLS[k], lv = St.skillLevel(S, k), fr = St.skillFrac(S, k);
      const card = h('div', { class: 'skill' }, h('div', { class: 'skh' }, h('b', { style: `color:${sk.col}` }, sk.n), h('span', null, `Nível ${lv}`)),
        h('div', { class: 'xpbar' }, h('div', { style: `width:${Math.round(fr * 100)}%;background:${sk.col}` })), h('div', { class: 'dim sm' }, lv >= 10 ? 'Máximo!' : `${S.skills[k]} / ${D.XP_LEVELS[lv + 1]} XP`),
        h('ul', { class: 'perks' }, sk.perks.map((p, i) => h('li', { class: i < lv ? 'on' : '' }, `${i + 1}. ${p}`))));
      wrap.append(card);
    }
    body.append(wrap);
  };

  /* ---------- amigos ---------- */
  let socSel = null;
  TAB.social = (body, refresh) => {
    const S = G().S; const list = h('div', { class: 'npcs' }), det = h('div', { class: 'npcdet' });
    for (const id of Object.keys(D.NPCS)) {
      const n = D.NPCS[id], f = St.friend(S, id), met = !!f.met;
      list.append(h('div', { class: 'npcrow' + (socSel === id ? ' on' : '') + (met ? '' : ' unk'), onclick: () => { socSel = id; A.sfx('click', { vol: 0.4 }); refresh(); } },
        met ? UI.portrait(id) : h('div', { class: 'portrait unk' }, '?'), h('div', { class: 'ninfo' }, h('b', null, met ? n.name : '???'), met ? UI.heartsRow(f.pts, n.romance && !f.dating && !f.married ? 8 : 10) : h('span', { class: 'dim sm' }, 'Ainda não conhecido'))));
    }
    if (socSel && St.friend(S, socSel).met) {
      const n = D.NPCS[socSel], f = St.friend(S, socSel);
      det.append(h('div', { class: 'pcard' }, UI.portrait(socSel), h('div', null, h('b', null, n.name), h('div', { class: 'dim' }, n.role), h('div', { class: 'dim sm' }, `Aniversário: ${n.bday[1]} de ${D.SEASONS[n.bday[0]]}`))),
        h('p', null, n.bio), h('div', null, UI.heartsRow(f.pts, 10), ` ${St.hearts(S, socSel)}/10`),
        h('div', { class: 'dim' }, f.married ? '💍 Casados' : f.engaged ? 'Noivos' : f.dating ? '♥ Namorando' : n.romance ? 'Pode se tornar um amor' : 'Amizade'),
        h('div', { class: 'dim sm' }, f.talked ? `Conversou hoje: ${S.daily.talked[socSel] ? 'sim' : 'não'} · Presente hoje: ${S.daily.gifted[socSel] ? 'sim' : 'não'}` : ''),
        h('div', { class: 'likes' }, h('div', null, h('b', { class: 'love' }, 'Ama: '), n.loves.map(tname).join(', ') || '—'), h('div', null, h('b', { class: 'like' }, 'Gosta: '), n.likes.map(tname).join(', ') || '—'), h('div', null, h('b', { class: 'hate' }, 'Odeia: '), n.hates.map(tname).join(', ') || '—')));
    } else det.append(h('div', { class: 'dim' }, 'Selecione alguém que você já conheceu.'));
    body.append(h('div', { class: 'social' }, list, det));
  };

  /* ---------- missões ---------- */
  TAB.quests = body => {
    const S = G().S; const wrap = h('div', { class: 'qlist' });
    wrap.append(h('h3', null, 'Em andamento'));
    for (const id of S.quests.active) { const q = G().questById(id); if (!q) continue; const pr = G().questProgress(q); const r = q.reward || {}; wrap.append(h('div', { class: 'qcard' }, h('b', null, (q.main ? '✦ ' : '') + q.title), h('div', null, q.desc), pr ? h('div', { class: 'qp' }, h('div', { style: `width:${100 * pr[0] / pr[1]}%` }), h('span', null, `${pr[0]}/${pr[1]}`)) : null, h('div', { class: 'dim sm' }, 'Recompensa: ' + [r.gold ? r.gold + 'G' : null, ...(r.items || []).map(([i, n]) => `${D.ITEMS[i].n} x${n}`)].filter(Boolean).join(', ')))); }
    if (!S.quests.active.length) wrap.append(h('div', { class: 'dim' }, 'Nenhuma missão ativa.'));
    wrap.append(h('h3', null, 'Pedidos da vila'));
    if (!S.requests.length) wrap.append(h('div', { class: 'dim' }, 'Veja o quadro de avisos na vila.'));
    for (const r of S.requests) wrap.append(h('div', { class: 'qcard' }, h('b', null, D.NPCS[r.npc].name), h('div', null, r.text), h('div', { class: 'dim sm' }, `Até o dia ${r.until} · ${r.reward.gold}G`)));
    wrap.append(h('h3', null, 'Lanternário'));
    const lv = G().lanternLevel(); wrap.append(h('div', { class: 'qcard' }, h('b', null, `${lv}/6 salas restauradas`), h('div', { class: 'xpbar' }, h('div', { style: `width:${lv / 6 * 100}%;background:#ffe66a` })), ...D.Story.bundles.map(b => h('div', { class: 'dim sm' }, (S.bundles[b.id] && S.bundles[b.id].every(v => v) ? '✔ ' : '○ ') + b.name))));
    wrap.append(h('h3', null, `Concluídas (${S.quests.done.length})`), h('div', { class: 'dim sm' }, S.quests.done.map(id => (G().questById(id) || { title: id }).title).join(' · ') || '—'));
    const ach = D.Story.achievements; wrap.append(h('h3', null, `Conquistas (${Object.keys(S.ach).length}/${ach.length})`), h('div', { class: 'achs' }, ach.map(a => { const on = !!S.ach[a.id]; const e = h('div', { class: 'ach' + (on ? ' on' : '') }, on ? '★' : '☆', ' ', h('span', null, a.n)); UI.tip(e, `<b>${a.n}</b><div>${a.d}</div>`); return e; })));
    body.append(wrap);
  };

  /* ---------- coleção ---------- */
  TAB.coll = body => {
    const S = G().S; const ids = Object.keys(D.ITEMS).filter(id => !['ferramenta', 'colocável'].includes(D.ITEMS[id].cat) && !D.ITEMS[id].place && !D.ITEMS[id].tool);
    const found = ids.filter(id => S.collected[id]).length;
    const grid = h('div', { class: 'grid coll' });
    for (const id of ids) { const have = !!S.collected[id]; const s = h('div', { class: 'slot' + (have ? '' : ' unk') }, have ? UI.itemImg({ id }) : h('span', { class: 'dim' }, '?')); if (have) UI.tip(s, UI.itemTip({ id, n: 1 }) + (S.fish[id] ? `<div class="eff">Capturados: ${S.fish[id]}</div>` : '')); grid.append(s); }
    body.append(h('div', { class: 'dim' }, `Itens registrados: ${found}/${ids.length}`), grid);
  };

  /* ---------- mapa ---------- */
  TAB.map = body => {
    const g = G(), S = g.S; const lay = { forest: [0, 0], mountain: [1, 0], farm: [0, 1], town: [1, 1], beach: [2, 1] };
    const wrap = h('div', { class: 'worldmap' }); const sc = 0.36;
    for (const id in lay) {
      const m = g.maps[id]; const w = Math.round(m.w * 16 * sc), hh = Math.round(m.h * 16 * sc);
      const cv = h('canvas', { width: w, height: hh, class: 'mapc px' }); const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      if (!m.groundCanvas || m.groundSeason !== St.season(S)) VV.Art.Tiles.renderMap(m, St.season(S));
      c.drawImage(m.groundCanvas, 0, 0, w, hh); if (m.waterCanvas && m.waterCanvas[0]) c.drawImage(m.waterCanvas[0], 0, 0, w, hh);
      m.obj.forEach(o => { if (o.t === 'tree') { c.fillStyle = '#255a2c'; c.fillRect(o.x * 16 * sc, (o.y - 1) * 16 * sc, 5, 6); } });
      for (const b of m.buildings) { c.fillStyle = '#c8955a'; c.fillRect(b.x * 16 * sc, b.y * 16 * sc, b.w * 16 * sc, b.h * 16 * sc); c.fillStyle = '#7a3a2c'; c.fillRect(b.x * 16 * sc, b.y * 16 * sc, b.w * 16 * sc, 4); }
      const here = g.map.id === id || (g.map.isMine && id === 'mountain');
      if (here && !g.map.isMine) { c.fillStyle = '#ff4a68'; c.fillRect(g.player.x * sc - 3, g.player.y * sc - 6, 6, 6); c.strokeStyle = '#fff'; c.strokeRect(g.player.x * sc - 3, g.player.y * sc - 6, 6, 6); }
      const sx = 0; wrap.append(h('div', { class: 'mapcell' + (here ? ' here' : ''), style: `grid-column:${lay[id][0] + 1};grid-row:${lay[id][1] + 1}` }, cv, h('div', { class: 'mapname' }, m.name)));
    }
    const where = g.map.indoor ? `Dentro: ${g.map.name}` : g.map.isMine ? `Mina — andar ${g.map.mineFloor}` : g.map.name;
    body.append(h('div', { class: 'dim' }, `Você está em: ${where}`), wrap);
  };

  /* ---------- opções ---------- */
  function slider(label, key, apply) {
    const s = G().settings; const val = h('span', { class: 'dim' }, Math.round(s[key] * 100) + '%');
    const inp = h('input', { type: 'range', min: 0, max: 100, value: Math.round(s[key] * 100), oninput: e => { s[key] = e.target.value / 100; val.textContent = e.target.value + '%'; apply(s[key]); St.saveSettings(s); } });
    return h('label', { class: 'opt' }, h('span', null, label), inp, val);
  }
  function toggle(label, key, after) { const s = G().settings; return h('label', { class: 'opt' }, h('span', null, label), h('input', { type: 'checkbox', checked: s[key], onchange: e => { s[key] = e.target.checked; St.saveSettings(s); after && after(); } })); }
  TAB.opt = (body, refresh) => {
    const g = G(), s = g.settings;
    body.append(h('div', { class: 'opts' },
      slider('Música', 'music', v => A.setVolume('music', v)), slider('Efeitos', 'sfx', v => A.setVolume('sfx', v)), slider('Ambiente', 'amb', v => A.setVolume('amb', v)),
      h('label', { class: 'opt' }, h('span', null, 'Escala dos pixels'), h('select', { onchange: e => { s.scale = e.target.value; St.saveSettings(s); VV.Render.resize(s); } }, ['auto', '2', '3', '4', '5'].map(v => h('option', { value: v, selected: String(s.scale) === v }, v === 'auto' ? 'Automática' : v + 'x')))),
      toggle('Dicas na tela', 'hints'), toggle('Tremor de tela', 'shake'), toggle('Salvar automaticamente ao dormir', 'autoSave'), toggle('Mostrar FPS', 'showFps'),
      h('div', { class: 'row' }, UI.btn('Salvar agora', () => { if (g.save()) UI.toast('Jogo salvo!', 'good', 'star'); else UI.toast('Falha ao salvar.', 'bad'); }, 'ok'), UI.btn('Exportar save', () => UI.exportSave()), UI.btn('Menu principal', () => UI.confirm('Voltar ao menu principal? (progresso não salvo será perdido)', () => { UI.closeAll(); VV.Main.toTitle(); }), 'warn')),
      h('div', { class: 'dim sm' }, 'Controles: WASD mover · Espaço usar ferramenta · E interagir · Q/R trocar item · 1-0 atalhos · Tab mochila · M mapa · L missões · Shift correr · Esc pausa')));
  };
  UI.exportSave = function () {
    const g = G(); if (!g.S) return; g.save(true); g.S._ts = Date.now();
    const blob = new Blob([St.exportJSON(g.S)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: `vale-${g.S.name}-dia${g.S.day}.json` }); document.body.append(a); a.click(); a.remove(); UI.toast('Save exportado!', 'good');
  };

  UI.openPause = function () {
    UI.window('Pausa', (body, refresh) => {
      const g = G();
      body.append(h('div', { class: 'col' },
        UI.btn('Continuar', () => UI.close(), 'ok'), UI.btn('Mochila e menus', () => { UI.close(); UI.openMenu('inv'); }), UI.btn('Salvar jogo', () => { if (g.save()) UI.toast('Jogo salvo!', 'good', 'star'); }),
        UI.btn('Opções', () => { UI.close(); UI.openMenu('opt'); }), UI.btn('Exportar save', () => UI.exportSave()),
        UI.btn('Menu principal', () => UI.confirm('Voltar ao menu principal?', () => { UI.closeAll(); VV.Main.toTitle(); }), 'warn')));
    }, { size: 'small' });
  };

  /* ---------- resumo do dia ---------- */
  UI.sleepSummary = function (log, cb) {
    const S = G().S;
    const box = h('div', { class: 'win summary' }); const body = h('div', { class: 'wbody center' });
    body.append(h('h2', null, log.faint ? 'Você desmaiou de exaustão...' : 'Bom dia!'), h('div', { class: 'dim' }, St.dateText(S)));
    if (log.faint && log.loss) body.append(h('p', { class: 'bad' }, `Alguém encontrou você e levou ao médico. Custo: ${log.loss}G`));
    if (log.shipping.length) {
      const list = h('div', { class: 'shiplist' });
      for (const s of log.shipping) list.append(h('div', { class: 'shiprow' }, UI.itemImg({ id: s.id }, 'ti'), h('span', null, D.itemName({ id: s.id, from: s.from }) + ' x' + s.n), h('b', null, s.v + 'G')));
      body.append(h('h3', null, 'Vendas do caixote'), list, h('div', { class: 'goldtag big' }, UI.miniImg('coin'), ' +' + U.fmt(log.gains) + 'G'));
    } else body.append(h('div', { class: 'dim' }, 'Nada foi enviado ao caixote ontem.'));
    if (log.notes.length) body.append(h('h3', null, 'Novidades'), h('ul', { class: 'notes' }, log.notes.map(n => h('li', null, n))));
    body.append(h('div', { class: 'dim' }, `Previsão para hoje: ${G().weatherName(G().weather)} · Amanhã: ${G().weatherName(S.nextWeather)}`), UI.btn('Começar o dia', () => { m.opts.onClose = null; UI.drop(m); cb(); }, 'ok big'));
    box.append(body); const m = UI.open(box, { noVeilClose: true, cls: 'dark', onClose: cb });
  };

  /* ---------- elevador da mina ---------- */
  UI.chooseFloor = function (list, cb) {
    UI.window('Elevador da Mina', (body) => {
      const wrap = h('div', { class: 'col' }, h('div', { class: 'dim' }, 'Escolha um andar já visitado.'));
      wrap.append(UI.btn('Entrada (andar 1)', () => { UI.close(); cb(1); }));
      for (const f of list) wrap.append(UI.btn(`Andar ${f}`, () => { UI.close(); cb(f); }));
      body.append(wrap);
    }, { size: 'small' });
  };

  /* ---------- altar ---------- */
  UI.altarInfo = function () {
    const S = G().S, lv = G().lanternLevel();
    UI.dialog({ name: '', noPortrait: true, lines: [lv >= 6 ? 'O altar brilha com seis luzes. O Lanternário está completamente restaurado.' : `Um altar antigo, coberto de musgo. Seis pedestais ao redor esperam por ofertas. (${lv}/6 restauradas)`, ...(lv < 6 ? ['Cada pedestal pede uma coleção diferente de itens do vale.'] : []), ] });
  };

  /* ---------- quadro de avisos ---------- */
  UI.openBoard = function () {
    UI.window('Quadro de Avisos', (body, refresh) => {
      const S = G().S; G().genRequests && 0;
      if (!S.requests.length) body.append(h('div', { class: 'dim' }, 'Nenhum pedido no momento. Volte amanhã!'));
      for (const r of S.requests) {
        const can = G().requestCan(r);
        body.append(h('div', { class: 'request' }, UI.portrait(r.npc), h('div', { class: 'rinfo' }, h('b', null, D.NPCS[r.npc].name), h('div', null, r.text),
          h('div', { class: 'reqs' }, r.need.map(([id, n]) => { const have = St.countItem(S, id); return h('span', { class: have >= n ? 'ok' : 'bad' }, UI.itemImg({ id }, 'ti'), ` ${have}/${n} `); })),
          h('div', { class: 'dim sm' }, `Recompensa: ${r.reward.gold}G · prazo até o dia ${r.until}`)), UI.btn('Entregar', () => { if (G().requestDone(r)) refresh(); }, can ? 'ok' : 'dis')));
      }
    });
  };

  /* ---------- correio ---------- */
  UI.openMail = function () {
    UI.window('Caixa de Correio', (body, refresh) => {
      const S = G().S; const list = S.mail.slice().reverse();
      if (!list.length) body.append(h('div', { class: 'dim' }, 'Sua caixa de correio está vazia.'));
      for (const m of list) {
        const unread = !S.readMail.includes(m.id);
        body.append(h('div', { class: 'mailrow' + (unread ? ' unread' : '') }, h('div', null, h('b', null, (unread ? '✉ ' : '') + m.title), h('div', { class: 'dim sm' }, `${m.from} · dia ${m.day}${m.items && !m.taken ? ' · tem anexo!' : ''}`)),
          UI.btn('Ler', () => { G().readMail(m); UI.dialog({ name: m.from, noPortrait: true, lines: m.text.split('\n\n'), onEnd: () => { UI.refreshHud(); } }); UI.refreshTop && 0; }, 'ok')));
      }
    });
  };

  /* ---------- oferta do Lanternário ---------- */
  UI.openBundle = function (bi) {
    const g = G(), S = g.S, b = D.Story.bundles[bi];
    UI.window(b.name, (body, refresh) => {
      const done = S.bundles[b.id];
      body.append(h('div', { class: 'dim' }, 'Ofereça os itens pedidos. Cada espaço aceita uma das opções.'), h('div', { class: 'dim', style: `color:${b.color}` }, 'Recompensa: ' + b.reward.text));
      const grid = h('div', { class: 'bslots' });
      b.items.forEach((it, i) => {
        const filled = done[i];
        const cell = h('div', { class: 'bslot' + (filled ? ' ok' : '') }, h('div', { class: 'bopts' }, filled ? UI.slot({ id: filled, n: 1 }) : it.any.slice(0, 6).map(id => UI.slot({ id, n: 1 }, { cls: 'ghost' }))), h('div', { class: 'dim sm' }, filled ? '✔ Entregue' : `Precisa: ${it.n}x`));
        if (!filled) {
          const cands = g.bundleCandidates(bi, i);
          cell.append(UI.btn(cands.length ? 'Oferecer' : 'Faltam itens', () => {
            if (!cands.length) { UI.toast('Você não tem nenhum desses itens.', 'warn'); return; }
            if (cands.length === 1) { g.deliverBundle(bi, i, cands[0]); refresh(); return; }
            UI.choose({ name: b.name, text: 'Qual item oferecer?', options: cands.map(id => ({ t: D.ITEMS[id].n, v: id })), cb: v => { g.deliverBundle(bi, i, v); UI.refreshTop(); } });
          }, cands.length ? 'ok' : 'dis'));
        }
        grid.append(cell);
      });
      body.append(grid);
    });
  };
})();
