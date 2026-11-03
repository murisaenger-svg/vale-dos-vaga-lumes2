'use strict';
/* ============================================================
   Interface: infraestrutura (modais, dicas, HUD, avisos, diálogos)
   ============================================================ */
VV.UI = (() => {
  const U = VV.U, D = VV.Data, St = VV.State, h = U.h, A = VV.Audio, Ic = VV.Art.Icons;
  const UI = {};
  let root, hud = {}, stack = [], dlg = null, tipEl, conf = null, lastHud = '', toastBox, bannerQ = [], bannerBusy = false;
  const G = () => VV.G;

  /* ---------- ícones procedurais pequenos ---------- */
  const mini = {};
  UI.mini = function (name) {
    if (mini[name]) return mini[name];
    const p = new VV.Px(12, 12);
    const px = (x, y, c) => p.p(x, y, c);
    switch (name) {
      case 'coin': p.disc(6, 6, 5, '#7a4a0a'); p.disc(6, 6, 4, '#ffc21a'); p.disc(6, 6, 2, '#ffe680'); p.r(5, 3, 2, 6, '#c98a10'); break;
      case 'heart': p.art(['..11..11..', '.1221.1221', '1222211222', '1222222222', '.12222222.', '..122222..', '...1222...', '....12....'].map(r => r.slice(0, 10)), { 1: '#7a1a2a', 2: '#ff4a68' }); break;
      case 'bolt': p.art(['...111', '..1221', '.12221', '122211', '.1222.', '..122.', '..121.', '...1..'], { 1: '#6a5a10', 2: '#ffe14a' }); break;
      case 'sun': p.disc(6, 6, 3, '#ffd23f'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.p(Math.round(6 + Math.cos(a) * 5), Math.round(6 + Math.sin(a) * 5), '#ffb020'); } break;
      case 'rain': p.disc(5, 4, 3, '#9ab0c8'); p.disc(8, 5, 3, '#b0c4d8'); p.r(2, 8, 1, 2, '#4a9ad8'); p.r(5, 9, 1, 2, '#4a9ad8'); p.r(8, 8, 1, 2, '#4a9ad8'); p.r(10, 9, 1, 2, '#4a9ad8'); break;
      case 'storm': p.disc(5, 4, 3, '#6a6a88'); p.disc(8, 5, 3, '#7a7a98'); p.line(6, 7, 4, 10, '#ffe14a'); p.line(4, 10, 7, 10, '#ffe14a'); p.line(7, 10, 5, 12, '#ffe14a'); break;
      case 'snow': for (const [x, y] of [[3, 3], [8, 2], [6, 6], [2, 9], [9, 8]]) { p.p(x, y, '#fff'); p.p(x - 1, y, '#cfe8ff'); p.p(x + 1, y, '#cfe8ff'); p.p(x, y - 1, '#cfe8ff'); p.p(x, y + 1, '#cfe8ff'); } break;
      case 'wind': p.line(1, 4, 8, 4, '#cfe8ff'); p.line(2, 7, 10, 7, '#cfe8ff'); p.line(1, 10, 6, 10, '#cfe8ff'); p.p(9, 3, '#cfe8ff'); p.p(10, 6, '#cfe8ff'); break;
      case 'moon': p.disc(6, 6, 5, '#ffe9a8'); p.disc(8, 5, 4, '#1b1230'); break;
      case 'lock': p.r(3, 5, 6, 5, '#8a8a98'); p.r(4, 2, 1, 3, '#8a8a98'); p.r(7, 2, 1, 3, '#8a8a98'); p.r(4, 2, 4, 1, '#8a8a98'); break;
    }
    p.outline({ strength: 0.9 });
    return (mini[name] = p.url());
  };
  UI.miniImg = (name, cls = 'mi') => h('img', { src: UI.mini(name), class: cls + ' px' });
  UI.itemImg = (inst, cls = 'ico') => h('img', { src: Ic.url(inst.id, { tier: inst.tier || 0 }), class: cls + ' px', draggable: 'false' });
  const qUrl = {}; UI.qImg = q => h('img', { src: qUrl[q] || (qUrl[q] = Ic.quality(q).toDataURL()), class: 'qs px' });

  /* ---------- tooltip ---------- */
  UI.itemTip = function (inst) {
    const d = D.ITEMS[inst.id]; if (!d) return '';
    const col = inst.q ? ['#fff', '#c8d4e8', '#ffc21a', '#c07aff'][inst.q] : '#fff';
    let s = `<b style="color:${col}">${D.itemName(inst)}</b>`;
    if (inst.q) s += ` <i>${D.QUALITY[inst.q]}</i>`;
    if (d.tool && D.TIERS[inst.tier || 0] && ['hoe', 'can', 'axe', 'pick', 'rod', 'sword'].includes(inst.id)) s += ` <i>(${D.TIERS[inst.tier || 0]})</i>`;
    s += `<div class="cat">${d.cat}</div>`;
    if (d.d) s += `<div>${d.d}</div>`;
    if (d.food || d.crop || d.fish || d.forage) { const e = d.e || 0, hp = d.h || 0; if (e || hp) s += `<div class="eff">+${e} energia · +${hp} vida</div>`; }
    if (d.buff) s += `<div class="eff">${D.BUFFS[d.buff.stat]} +${d.buff.val} (${Math.round(d.buff.dur / 60)}h)</div>`;
    if (d.weapon) s += `<div class="eff">Dano ${d.dmg ? d.dmg.join('-') : ''}</div>`;
    const v = VV.G.sellValue ? VV.G.sellValue(inst) : 0; if (v) s += `<div class="val">Vale ${v}G</div>`;
    return s;
  };
  UI.tip = function (el, html) {
    el.addEventListener('mouseenter', e => { const t = typeof html === 'function' ? html() : html; if (!t) return; tipEl.innerHTML = t; tipEl.style.display = 'block'; move(e); });
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', () => { tipEl.style.display = 'none'; });
    function move(e) { const w = tipEl.offsetWidth, hh = tipEl.offsetHeight; let x = e.clientX + 16, y = e.clientY + 16; if (x + w > innerWidth - 6) x = e.clientX - w - 12; if (y + hh > innerHeight - 6) y = innerHeight - hh - 6; tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; }
  };
  UI.hideTip = () => { if (tipEl) tipEl.style.display = 'none'; };
  UI.slot = function (inst, o = {}) {
    const s = h('div', { class: 'slot' + (o.sel ? ' sel' : '') + (o.locked ? ' locked' : '') + (o.cls ? ' ' + o.cls : '') });
    if (o.locked) s.append(UI.miniImg('lock', 'lk'));
    if (inst) {
      s.append(UI.itemImg(inst));
      if (inst.n > 1) s.append(h('span', { class: 'cnt' }, inst.n));
      if (inst.q) s.append(UI.qImg(inst.q));
      if (o.tip !== false) UI.tip(s, () => UI.itemTip(inst));
    }
    if (o.label) s.append(h('span', { class: 'key' }, o.label));
    if (o.onclick) s.addEventListener('click', o.onclick);
    if (o.onright) s.addEventListener('contextmenu', e => { e.preventDefault(); o.onright(e); });
    return s;
  };
  UI.portrait = function (npcId) {
    const n = D.NPCS[npcId]; if (!n) return null;
    const spec = VV.Ent.specFromLook(n.look);
    return h('img', { src: VV.Art.Chars.portrait(spec), class: 'portrait px' });
  };
  UI.playerPortrait = function () { const S = G().S; return h('img', { src: VV.Art.Chars.portrait(VV.Ent.specFromLook(S.look)), class: 'portrait px' }); };
  UI.heartsRow = function (pts, max = 10) {
    const full = Math.floor(pts / 250), row = h('span', { class: 'hearts' });
    for (let i = 0; i < max; i++) row.append(h('i', { class: i < full ? 'on' : (i === full && pts % 250 > 125 ? 'half' : '') }, '♥'));
    return row;
  };

  /* ---------- modais ---------- */
  UI.isOpen = () => !!(stack.length || dlg || conf || (G() && G().mode === 'title'));
  UI.open = function (box, opts = {}) {
    const wrap = h('div', { class: 'modal' + (opts.cls ? ' ' + opts.cls : '') }, h('div', { class: 'veil', onclick: () => { if (!opts.noVeilClose) UI.close(); } }), box);
    root.append(wrap); const m = { wrap, opts }; stack.push(m); A.sfx('open', { vol: 0.5 }); return m;
  };
  UI.close = function () {
    const m = stack.pop(); if (!m) return; m.wrap.remove(); UI.hideTip(); m.opts.onClose && m.opts.onClose(); A.sfx('close', { vol: 0.5 });
    VV.Input.clear(); const g = G(); if (g.cooldown) { g.cooldown.use = 0.2; g.cooldown.act = 0.2; } UI.refreshHud();
  };
  UI.drop = function (m) { const i = stack.indexOf(m); if (i >= 0) { stack.splice(i, 1); m.wrap.remove(); UI.hideTip(); VV.Input.clear(); } };
  UI.closeAll = function () { while (stack.length) UI.close(); if (dlg) { dlg.el.remove(); dlg = null; } if (conf) { conf.el.remove(); conf = null; } };
  UI.top = () => stack[stack.length - 1];
  // cria uma janela que se redesenha: fn(box, refresh)
  UI.window = function (title, fn, opts = {}) {
    const box = h('div', { class: 'win ' + (opts.size || '') });
    const body = h('div', { class: 'wbody' });
    const refresh = () => { const sc = body.scrollTop; body.replaceChildren(); fn(body, refresh); body.scrollTop = sc; };
    box.append(h('div', { class: 'wtitle' }, h('span', null, title), h('button', { class: 'xbtn', onclick: () => UI.close() }, '✕')), body);
    const m = UI.open(box, opts); m.refresh = refresh; refresh(); return m;
  };
  UI.refreshTop = () => { const m = UI.top(); if (m && m.refresh) m.refresh(); };
  UI.btn = (label, onclick, cls = '') => h('button', { class: 'btn ' + cls, onclick: e => { A.sfx('click', { vol: 0.6 }); onclick(e); } }, label);
  UI.goldTag = () => h('span', { class: 'goldtag' }, UI.miniImg('coin'), ' ' + U.fmt(G().S.gold) + 'G');

  /* ---------- teclado da interface ---------- */
  function onKey(e) {
    if (!G() || G().mode !== 'play') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.code === 'Escape') document.activeElement.blur(); return; }
    const c = e.code;
    if (conf) { if (c === 'KeyY' || c === 'Enter' || c === 'KeyE') conf.yes(); else if (c === 'KeyN' || c === 'Escape') conf.no(); return; }
    if (dlg) {
      if (c === 'Space' || c === 'KeyE' || c === 'Enter' || c === 'KeyK' || c === 'KeyJ') { if (dlg.choices) { if (c !== 'Space') dlg.pick(dlg.sel); } else UI.advance(); }
      else if (dlg.choices && (c === 'ArrowDown' || c === 'KeyS')) dlg.move(1);
      else if (dlg.choices && (c === 'ArrowUp' || c === 'KeyW')) dlg.move(-1);
      else if (dlg.choices && /^Digit[1-9]$/.test(c)) dlg.pick(+c.slice(5) - 1);
      else if (c === 'Escape' && dlg.choices) dlg.pick(-1);
      VV.Input.clear(); return;
    }
    if (stack.length) {
      if (c === 'Escape' || c === 'Tab' || c === 'KeyI' && stack[0].opts.menu) { UI.close(); e.preventDefault(); return; }
      if (stack[stack.length - 1].opts.keys) stack[stack.length - 1].opts.keys(e);
      VV.Input.clear();
    }
  }

  /* ---------- diálogo ---------- */
  function parseLine(line, defName, defNpc) {
    const m = /^([^:]{1,18}):\s+([\s\S]*)$/.exec(line);
    if (m) {
      const nm = m[1]; const npcId = Object.keys(D.NPCS).find(k => D.NPCS[k].name === nm || D.NPCS[k].name.replace(/^(Vovô|Seu|Dra\.)\s/, '') === nm);
      return { name: nm, npc: npcId || null, text: m[2], lumi: nm === 'Lumi', player: nm === G().S.name };
    }
    return { name: defName, npc: defNpc, text: line };
  }
  UI.dialog = function (o) {
    UI.closeAll(); const lines = o.lines.slice();
    const el = h('div', { class: 'dialog' });
    root.append(el); VV.Input.clear();
    dlg = { el, lines, i: 0, o, typed: 0, line: null, choices: null, sel: 0 };
    A.sfx('dialog', { vol: 0.5 });
    const show = () => {
      const L = parseLine(lines[dlg.i], o.name, o.npc); dlg.line = L; dlg.typed = 0; dlg.choices = null; el.replaceChildren();
      el.classList.toggle('np', !!(o.noPortrait && !L.npc && !L.lumi && !L.player));
      const pw = h('div', { class: 'pbox' });
      if (L.npc && !o.noPortrait || L.npc) pw.append(UI.portrait(L.npc));
      else if (L.player) pw.append(UI.playerPortrait());
      else if (L.lumi) pw.append(h('div', { class: 'lumi' }));
      else if (!o.noPortrait && o.npc) pw.append(UI.portrait(o.npc));
      else pw.style.display = 'none';
      dlg.txt = h('div', { class: 'dtxt' });
      el.append(pw, h('div', { class: 'dmain' }, L.name ? h('div', { class: 'dname' }, L.name) : null, dlg.txt, h('div', { class: 'dnext' }, '▼')));
      el.onclick = () => UI.advance();
    };
    dlg.show = show; show();
  };
  UI.advance = function () {
    if (!dlg || dlg.choices) return;
    const full = dlg.line.text;
    if (dlg.typed < full.length) { dlg.typed = full.length; dlg.txt.textContent = full; return; }
    dlg.i++;
    if (dlg.i >= dlg.lines.length) { const cb = dlg.o.onEnd; dlg.el.remove(); dlg = null; VV.Input.clear(); const g = G(); g.cooldown.act = 0.25; g.cooldown.use = 0.25; A.sfx('click', { vol: 0.4 }); cb && cb(); return; }
    A.sfx('dialog', { vol: 0.35 }); dlg.show();
  };
  UI.choose = function (o) {
    UI.closeAll(); const el = h('div', { class: 'dialog' }); root.append(el); VV.Input.clear();
    dlg = { el, choices: o.options, sel: 0, o, line: { text: o.text }, typed: o.text.length };
    const pw = h('div', { class: 'pbox' }); if (o.npc) pw.append(UI.portrait(o.npc)); else pw.style.display = 'none';
    const list = h('div', { class: 'choices' });
    const draw = () => { list.replaceChildren(); o.options.forEach((op, i) => list.append(h('div', { class: 'choice' + (i === dlg.sel ? ' on' : ''), onmouseenter: () => { dlg.sel = i; draw(); }, onclick: e => { e.stopPropagation(); dlg.pick(i); } }, h('b', null, (i + 1) + '. '), op.t))); };
    dlg.move = d => { dlg.sel = (dlg.sel + d + o.options.length) % o.options.length; A.sfx('hover', { vol: 0.4 }); draw(); };
    dlg.pick = i => { const cb = o.cb; el.remove(); dlg = null; VV.Input.clear(); const g = G(); g.cooldown.act = 0.25; g.cooldown.use = 0.25; A.sfx('click', { vol: 0.6 }); if (i >= 0 && o.options[i]) cb && cb(o.options[i].v); };
    el.append(pw, h('div', { class: 'dmain' }, o.name ? h('div', { class: 'dname' }, o.name) : null, h('div', { class: 'dtxt' }, o.text), list)); draw();
  };
  UI.sign = function (text) { UI.dialog({ name: '', lines: text.split('\n'), noPortrait: true }); };
  UI.confirm = function (text, yes, no) {
    const el = h('div', { class: 'modal conf' }, h('div', { class: 'veil' }), h('div', { class: 'win small' }, h('div', { class: 'wbody center' }, h('p', null, text), h('div', { class: 'row' }, UI.btn('Sim (Y)', () => conf.yes(), 'ok'), UI.btn('Não (N)', () => conf.no())))));
    root.append(el); VV.Input.clear();
    conf = { el, yes: () => { el.remove(); conf = null; VV.Input.clear(); const g = G(); g.cooldown.act = g.cooldown.use = 0.3; yes && yes(); }, no: () => { el.remove(); conf = null; VV.Input.clear(); const g = G(); g.cooldown.act = g.cooldown.use = 0.3; no && no(); } };
  };

  /* ---------- avisos ---------- */
  UI.toast = function (text, kind = 'info', icon) {
    if (!toastBox) return;
    const el = h('div', { class: 'toast ' + kind });
    if (icon && D.ITEMS[icon]) el.append(UI.itemImg({ id: icon }, 'ti'));
    el.append(h('span', null, text)); toastBox.append(el);
    while (toastBox.children.length > 5) toastBox.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 3600); setTimeout(() => el.remove(), 4200);
  };
  UI.hint = function (text) { const el = h('div', { class: 'hint' }, text); root.append(el); setTimeout(() => el.classList.add('out'), 5500); setTimeout(() => el.remove(), 6200); };
  UI.banner = function (title, sub) {
    bannerQ.push([title, sub]); if (!bannerBusy) nextBanner();
  };
  function nextBanner() {
    const b = bannerQ.shift(); if (!b) { bannerBusy = false; return; } bannerBusy = true;
    const el = h('div', { class: 'banner' }, h('div', { class: 'bt' }, b[0]), b[1] ? h('div', { class: 'bs' }, b[1]) : null); root.append(el);
    setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => { el.remove(); nextBanner(); }, 3200);
  }
  UI.flashDamage = function () { const f = h('div', { class: 'dmgflash' }); root.append(f); setTimeout(() => f.remove(), 350); };

  /* ---------- HUD ---------- */
  function buildHud() {
    hud.clock = h('div', { class: 'hud clock' },
      hud.date = h('div', { class: 'cdate' }), h('div', { class: 'crow' }, hud.wx = h('img', { class: 'px wx' }), hud.time = h('div', { class: 'ctime' })), hud.fest = h('div', { class: 'cfest' }));
    hud.gold = h('div', { class: 'hud goldbox' }, h('img', { src: UI.mini('coin'), class: 'px' }), hud.goldTxt = h('span'));
    hud.buffs = h('div', { class: 'hud buffs' });
    hud.quest = h('div', { class: 'hud quest' });
    hud.bars = h('div', { class: 'hud bars' },
      h('div', { class: 'bar hp' }, h('div', { class: 'fill' }), h('img', { src: UI.mini('heart'), class: 'px bi' })),
      h('div', { class: 'bar en' }, h('div', { class: 'fill' }), h('img', { src: UI.mini('bolt'), class: 'px bi' })));
    UI.tip(hud.bars.children[0], () => `<b>Vida</b> ${Math.round(G().S.hp)}/${G().S.maxHp}`);
    UI.tip(hud.bars.children[1], () => `<b>Energia</b> ${Math.round(G().S.energy)}/${G().S.maxEnergy}`);
    hud.hotbar = h('div', { class: 'hud hotbar' });
    hud.hotname = h('div', { class: 'hud hotname' });
    hud.fps = h('div', { class: 'hud fps' });
    hud.hurt = h('div', { class: 'lowhp' });
    toastBox = h('div', { class: 'toasts' });
    hud.root = h('div', { class: 'hudroot' }, hud.clock, hud.gold, hud.buffs, hud.quest, hud.bars, hud.hotbar, hud.hotname, hud.fps, hud.hurt, toastBox);
    root.append(hud.root);
  }
  UI.showHud = on => { if (hud.root) hud.root.style.display = on ? '' : 'none'; };
  UI.refreshHud = function () {
    const g = G(); if (!g || !g.S || !hud.hotbar || g.mode !== 'play') return; const S = g.S;
    hud.hotbar.replaceChildren(); UI.hideTip();
    for (let i = 0; i < 12; i++) {
      const inst = S.inv[i];
      const locked = i >= S.invSize;
      const s = UI.slot(inst, { sel: i === S.sel, locked, label: i < 9 ? i + 1 : i === 9 ? 0 : i === 10 ? '-' : '=', onclick: () => { if (!locked) { S.sel = i; A.sfx('hover', { vol: 0.5 }); UI.refreshHud(); } } });
      if (inst && D.ITEMS[inst.id].tool && inst.id === 'can' && i === S.sel) { }
      if (inst && inst.id === 'can') { const wb = h('div', { class: 'wbar' }, h('div', { style: `width:${Math.round(100 * S.can.water / S.can.max)}%` })); s.append(wb); }
      hud.hotbar.append(s);
    }
    const held = St.held(S); hud.hotname.textContent = held ? D.itemName(held) : '';
    hud.hotname.classList.toggle('on', !!held);
    hud.goldTxt.textContent = U.fmt(S.gold) + 'G';
    hud.bars.children[0].firstChild.style.height = Math.max(0, 100 * S.hp / S.maxHp) + '%';
    const ef = S.energy / S.maxEnergy; const en = hud.bars.children[1].firstChild; en.style.height = Math.max(0, 100 * ef) + '%'; en.style.background = ef > 0.5 ? '#7ad84a' : ef > 0.2 ? '#e8c02a' : '#e8453a';
    hud.bars.children[0].style.display = (S.hp < S.maxHp || g.map.isMine) ? '' : 'none';
    hud.buffs.replaceChildren(...S.buffs.map(b => { const e = h('div', { class: 'buff' }, h('b', null, D.BUFFS[b.stat].slice(0, 3).toUpperCase()), '+' + b.val); UI.tip(e, `<b>${b.name}</b><div>${D.BUFFS[b.stat]} +${b.val}</div><div class="val">${Math.ceil(b.left)} min restantes</div>`); return e; }));
    // missão atual
    const q = S.quests.active[0] && g.questById ? g.questById(S.quests.active[0]) : null;
    if (q) { const pr = g.questProgress(q); hud.quest.style.display = ''; hud.quest.innerHTML = `<div class="qt">✦ ${q.title}</div><div class="qd">${q.desc}</div>${pr ? `<div class="qp"><div style="width:${100 * pr[0] / pr[1]}%"></div><span>${pr[0]}/${pr[1]}</span></div>` : ''}`; } else hud.quest.style.display = 'none';
  };
  function updateClock() {
    const g = G(); const S = g.S; if (!S) return;
    const key = S.day + '|' + (S.min - S.min % 10) + '|' + g.weather + '|' + (g.festival ? 1 : 0) + '|' + Math.round(S.energy) + '|' + Math.round(S.hp) + '|' + S.gold + '|' + S.buffs.length;
    if (key === lastHud) return; lastHud = key;
    const sea = St.season(S); hud.date.textContent = `${D.DAYS[St.weekday(S)].slice(0, 3)}. ${St.dayOfSeason(S)} · ${D.SEASONS[sea]} · Ano ${St.year(S)}`;
    const m = S.min; const h24 = Math.floor(m / 60) % 24; const mm = m % 60 - m % 10;
    const ap = h24 >= 12 ? 'pm' : 'am', h12 = h24 % 12 || 12;
    hud.time.textContent = `${String(h24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; hud.time.title = h12 + ap;
    hud.wx.src = UI.mini(g.night > 0.6 && g.weather === 'sun' ? 'moon' : g.weather);
    hud.fest.textContent = g.festival ? '★ ' + g.festival.name : ''; hud.fest.style.display = g.festival ? '' : 'none';
    hud.clock.classList.toggle('late', S.min >= 1440);
    UI.refreshHud();
  }
  UI.update = function (dt) {
    const g = G(); if (!g) return;
    if (dlg && dlg.line && dlg.typed < dlg.line.text.length && !dlg.choices) {
      dlg.typed = Math.min(dlg.line.text.length, dlg.typed + dt * 55); const n = Math.floor(dlg.typed); dlg.txt.textContent = dlg.line.text.slice(0, n);
      if (Math.floor(dlg.typed) % 3 === 0 && n > 0 && n !== dlg._ln) { dlg._ln = n; if (dlg.line.text[n - 1] !== ' ') A.sfx('dialog', { vol: 0.12 }); }
    }
    if (g.mode === 'play' && g.S) {
      updateClock();
      if (hud.fps) hud.fps.textContent = g.settings.showFps ? Math.round(1 / Math.max(0.001, dt)) + ' FPS' : '';
      hud.hurt.style.opacity = g.S.hp < g.S.maxHp * 0.25 ? 0.35 + Math.sin(performance.now() / 180) * 0.15 : 0;
    }
  };
  UI.onStart = function () { UI.closeAll(); UI.showHud(true); lastHud = ''; UI.refreshHud(); };

  UI.init = function () {
    root = document.getElementById('ui');
    tipEl = h('div', { class: 'tip' }); document.body.append(tipEl);
    buildHud(); UI.showHud(false);
    window.addEventListener('keydown', onKey);
    VV.Input.setTextFocus(() => { const t = document.activeElement && document.activeElement.tagName; return t === 'INPUT' || t === 'TEXTAREA'; });
    root.addEventListener('contextmenu', e => e.preventDefault());
  };
  UI.root = () => root;
  return UI;
})();
