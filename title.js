'use strict';
/* ============================================================
   Tela de título, criador de personagem, slots de save
   ============================================================ */
(() => {
  const UI = VV.UI, U = VV.U, D = VV.Data, St = VV.State, h = U.h, A = VV.Audio, C = VV.Art.Chars;
  const G = () => VV.G;
  let cv, cx, el, W = 0, H = 0, t = 0, flies = [], stars = [], started = false, hills = [];
  const SHIRTS = ['#4a7fc9', '#c9462c', '#4fa83a', '#e8a53a', '#7a4aa8', '#e07aa6', '#2b2b3a', '#f0ece4'];
  const PANTS = ['#5a4a3a', '#3a4a6a', '#2b2b3a', '#6a5a2a', '#4a6a4a', '#7a3a4a'];

  /* ---------- fundo animado ---------- */
  function resize() { if (!cv) return; W = cv.width = Math.ceil(innerWidth / 3); H = cv.height = Math.ceil(innerHeight / 3); cv.style.width = '100%'; cv.style.height = '100%'; initScene(); }
  function initScene() {
    const rng = U.rng(77); stars = []; flies = []; hills = [];
    for (let i = 0; i < 90; i++) stars.push({ x: rng() * W, y: rng() * H * 0.6, s: rng(), p: rng() * 6 });
    for (let i = 0; i < 40; i++) flies.push({ x: rng() * W, y: H * 0.45 + rng() * H * 0.5, p: rng() * 6, sp: 4 + rng() * 8, r: rng() });
    for (let l = 0; l < 3; l++) { const a = []; for (let x = 0; x <= W; x += 2) a.push(H * (0.62 + l * 0.1) - (Math.sin(x * 0.02 + l * 2) * 9 + Math.sin(x * 0.05 + l) * 4 + U.vnoise(x / 18, l, 5) * 10)); hills.push(a); }
  }
  UI.titleFrame = function (dt) {
    if (!cx) return; t += dt;
    const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c0a22'); g.addColorStop(0.5, '#27204f'); g.addColorStop(1, '#4a3563'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    for (const s of stars) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.p)); cx.fillStyle = `rgba(255,248,220,${a * (0.3 + s.s * 0.7)})`; cx.fillRect(Math.round(s.x), Math.round(s.y), s.s > 0.8 ? 2 : 1, s.s > 0.8 ? 2 : 1); }
    cx.fillStyle = '#ffe9a8'; cx.beginPath(); cx.arc(W * 0.78, H * 0.2, 14, 0, 7); cx.fill(); cx.fillStyle = '#27204f'; cx.beginPath(); cx.arc(W * 0.78 + 6, H * 0.2 - 3, 12, 0, 7); cx.fill();
    const cols = ['#2f2a5a', '#231f46', '#161232'];
    hills.forEach((a, l) => {
      cx.fillStyle = cols[l]; cx.beginPath(); cx.moveTo(0, H); a.forEach((y, i) => cx.lineTo(i * 2, Math.round(y))); cx.lineTo(W, H); cx.fill();
      if (l === 1) { // casinha e árvores
        const hx = Math.round(W * 0.22), hy = Math.round(a[Math.round(hx / 2)]);
        cx.fillStyle = '#120e28'; cx.fillRect(hx - 14, hy - 14, 28, 14); cx.beginPath(); cx.moveTo(hx - 18, hy - 14); cx.lineTo(hx, hy - 28); cx.lineTo(hx + 18, hy - 14); cx.fill(); cx.fillRect(hx + 8, hy - 30, 4, 10);
        cx.fillStyle = `rgba(255,200,110,${0.85 + Math.sin(t * 3) * 0.05})`; cx.fillRect(hx - 8, hy - 10, 5, 5); cx.fillRect(hx + 3, hy - 10, 5, 5);
        for (let i = 0; i < 9; i++) { const tx = Math.round(W * (0.45 + i * 0.065)), ty = Math.round(a[Math.round(tx / 2)] || H * 0.7); cx.fillStyle = '#100c26'; cx.beginPath(); cx.moveTo(tx - 6, ty); cx.lineTo(tx, ty - 18 - (i % 3) * 4); cx.lineTo(tx + 6, ty); cx.fill(); }
      }
    });
    for (const f of flies) {
      f.x += Math.sin(t * 0.7 + f.p) * f.sp * dt; f.y += Math.cos(t * 0.9 + f.p * 2) * f.sp * 0.5 * dt; if (f.x < -5) f.x = W + 5; if (f.x > W + 5) f.x = -5;
      const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.2 + f.p * 3)); const x = Math.round(f.x), y = Math.round(f.y);
      cx.fillStyle = `rgba(255,230,110,${a * 0.18})`; cx.fillRect(x - 2, y - 2, 5, 5); cx.fillStyle = `rgba(255,240,150,${a})`; cx.fillRect(x, y, 1, 1);
    }
  };

  /* ---------- telas ---------- */
  function screen(...kids) { el.replaceChildren(...kids); }
  function lastSave(saves) { return saves.filter(Boolean).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0]; }
  UI.showTitle = function () {
    const g = G(); g.mode = 'title'; UI.showHud(false);
    if (!cv) {
      cv = h('canvas', { id: 'titlebg' }); cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; el = h('div', { class: 'title' });
      UI.root().append(cv, el); window.addEventListener('resize', resize);
    }
    cv.style.display = ''; el.style.display = ''; resize(); mainMenu(!started);
  };
  UI.hideTitle = function () { cv.style.display = 'none'; el.style.display = 'none'; };
  const logo = () => h('div', { class: 'logo' }, h('div', { class: 'l1' }, 'VALE DOS'), h('div', { class: 'l2' }, 'VAGA-LUMES'), h('div', { class: 'l3' }, 'uma história de fazenda, amizade e luz'));
  function mainMenu(first) {
    if (first) { screen(logo(), h('button', { class: 'btn big ok pulse', onclick: () => { started = true; A.init(); A.play('title'); mainMenu(false); } }, 'Pressione para começar'), h('div', { class: 'ver' }, 'v1.0 · feito com HTML, CSS e JavaScript')); return; }
    const saves = St.listSaves(), last = lastSave(saves);
    screen(logo(), h('div', { class: 'menu col' },
      last ? UI.btn(`Continuar — ${last.name}, dia ${last.day}`, () => startLoad(last.slot), 'ok big') : null,
      UI.btn('Novo jogo', () => creator(), 'big'), UI.btn('Carregar jogo', () => slots(), 'big'), UI.btn('Opções', () => options(), 'big'), UI.btn('Créditos', () => credits(), 'big')),
      h('div', { class: 'ver' }, 'v1.0 · feito com HTML, CSS e JavaScript'));
  }
  function startLoad(slot) { if (!G().loadGame(slot)) { UI.toast('Não foi possível carregar este save.', 'bad'); return; } UI.hideTitle(); }
  function slots() {
    const saves = St.listSaves(); const list = h('div', { class: 'slots' });
    saves.forEach((s, i) => list.append(h('div', { class: 'slotcard' + (s ? '' : ' empty') }, s ? h('div', { class: 'sinfo' }, h('img', { class: 'px portrait', src: C.portrait(VV.Ent.specFromLook(s.look)) }), h('div', null, h('b', null, `${s.name} — ${s.farm}`), h('div', { class: 'dim' }, `${D.SEASONS[s.season]}, dia ${s.day} · Ano ${s.year} · ${U.fmt(s.gold)}G`), h('div', { class: 'dim sm' }, `${Math.floor(s.playtime)}h${Math.floor(s.playtime % 1 * 60)}m · ${s.ts ? new Date(s.ts).toLocaleString('pt-BR') : ''}`))) : h('div', { class: 'dim' }, `Slot ${i + 1} — vazio`),
      s ? h('div', { class: 'row' }, UI.btn('Jogar', () => startLoad(s.slot), 'ok'), UI.btn('Exportar', () => { const S = St.load(s.slot); const b = new Blob([St.exportJSON(S)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(b), download: `vale-${s.name}-slot${s.slot}.json` }); document.body.append(a); a.click(); a.remove(); }), UI.btn('Apagar', () => UI.confirm('Apagar este save para sempre?', () => { St.del(s.slot); slots(); }), 'warn')) : h('div', { class: 'row' }, UI.btn('Importar...', () => importInto(i + 1))))));
    screen(h('h2', null, 'Carregar jogo'), list, h('div', { class: 'row' }, UI.btn('Voltar', () => mainMenu(false))));
  }
  function importInto(slot) {
    const inp = h('input', { type: 'file', accept: '.json,application/json', onchange: e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const S = St.importJSON(r.result); St.save(S, slot); UI.toast('Save importado!', 'good'); slots(); } catch (err) { UI.toast('Arquivo inválido.', 'bad'); } }; r.readAsText(f); } });
    inp.click();
  }
  function options() {
    const s = G().settings;
    const sl = (label, key, kind) => h('label', { class: 'opt' }, h('span', null, label), h('input', { type: 'range', min: 0, max: 100, value: Math.round(s[key] * 100), oninput: e => { s[key] = e.target.value / 100; A.setVolume(kind, s[key]); St.saveSettings(s); } }));
    screen(h('h2', null, 'Opções'), h('div', { class: 'opts' }, sl('Música', 'music', 'music'), sl('Efeitos', 'sfx', 'sfx'), sl('Ambiente', 'amb', 'amb')), h('div', { class: 'row' }, UI.btn('Voltar', () => mainMenu(false))));
  }
  function credits() {
    screen(h('h2', null, 'Créditos'), h('div', { class: 'credits' }, h('p', null, 'Vale dos Vaga-lumes'), h('p', { class: 'dim' }, 'Toda a arte em pixel foi gerada por código. Toda a música e todos os efeitos foram sintetizados em tempo real com a Web Audio API.'), h('p', { class: 'dim' }, 'Sem imagens ou sons externos. Código aberto, para jogar direto no navegador.'), h('p', { class: 'dim sm' }, 'Em memória da Vovó Alba, que enxergava a menor luz do mundo.')), h('div', { class: 'row' }, UI.btn('Voltar', () => mainMenu(false))));
  }

  /* ---------- criador de personagem ---------- */
  function creator() {
    const saves = St.listSaves(); const free = saves.findIndex(s => !s);
    const cfg = { name: '', farm: 'Fazenda Vaga-lume', skin: 1, hair: 1, style: 'curto', shirt: 0, pants: 0, pet: 'dog', petName: 'Pipoca', slot: free >= 0 ? free + 1 : 1 };
    const prev = h('canvas', { width: 20, height: 28, class: 'prevcv px' }); const pw = h('div', { class: 'prevbox' }, prev);
    const spec = () => ({ skin: C.SKINS[cfg.skin], hair: C.HAIRS[cfg.hair], style: cfg.style, shirt: SHIRTS[cfg.shirt], pants: PANTS[cfg.pants], shoes: '#4a3020' });
    let dir = 0;
    const draw = () => { const sh = C.sheet(spec()); const c = prev.getContext('2d'); c.clearRect(0, 0, 20, 28); c.drawImage(sh.frames[dir][0], 0, 0); };
    const swatches = (list, key) => h('div', { class: 'swatches' }, list.map((c, i) => h('button', { class: 'sw' + (cfg[key] === i ? ' on' : ''), style: `background:${c}`, onclick: e => { cfg[key] = i; [...e.target.parentNode.children].forEach((b, j) => b.classList.toggle('on', j === i)); draw(); A.sfx('click', { vol: 0.4 }); } })));
    const name = h('input', { type: 'text', maxlength: 14, placeholder: 'Seu nome', oninput: e => { cfg.name = e.target.value; } });
    const farm = h('input', { type: 'text', maxlength: 22, value: cfg.farm, oninput: e => { cfg.farm = e.target.value; } });
    const petn = h('input', { type: 'text', maxlength: 12, value: cfg.petName, oninput: e => { cfg.petName = e.target.value; } });
    const styles = h('div', { class: 'swatches' }, C.STYLES.map(s => h('button', { class: 'btn sm' + (cfg.style === s ? ' ok' : ''), onclick: e => { cfg.style = s; [...e.target.parentNode.children].forEach(b => b.classList.remove('ok')); e.target.classList.add('ok'); draw(); } }, s)));
    const pets = h('div', { class: 'swatches' }, ['dog', 'cat'].map(p => h('button', { class: 'btn sm' + (cfg.pet === p ? ' ok' : ''), onclick: e => { cfg.pet = p; cfg.petName = p === 'cat' ? 'Mingau' : 'Pipoca'; petn.value = cfg.petName; [...e.target.parentNode.children].forEach(b => b.classList.remove('ok')); e.target.classList.add('ok'); } }, p === 'dog' ? 'Cachorro' : 'Gato')));
    const slotSel = h('div', { class: 'swatches' }, [1, 2, 3].map(n => h('button', { class: 'btn sm' + (cfg.slot === n ? ' ok' : ''), onclick: e => { cfg.slot = n; [...e.target.parentNode.children].forEach((b, j) => b.classList.toggle('ok', j === n - 1)); } }, `Slot ${n}${saves[n - 1] ? ' (sobrescreve)' : ''}`)));
    draw();
    screen(h('h2', null, 'Novo personagem'), h('div', { class: 'creator' },
      h('div', { class: 'prevcol' }, pw, h('div', { class: 'row' }, UI.btn('◀', () => { dir = (dir + 3) % 4; draw(); }), UI.btn('▶', () => { dir = (dir + 1) % 4; draw(); }))),
      h('div', { class: 'form' }, h('label', null, 'Nome', name), h('label', null, 'Nome da fazenda', farm), h('label', null, 'Pele', swatches(C.SKINS, 'skin')), h('label', null, 'Cabelo', swatches(C.HAIRS, 'hair')), h('label', null, 'Penteado', styles), h('label', null, 'Camisa', swatches(SHIRTS, 'shirt')), h('label', null, 'Calça', swatches(PANTS, 'pants')), h('label', null, 'Companheiro', pets), h('label', null, 'Nome do companheiro', petn), h('label', null, 'Salvar em', slotSel))),
      h('div', { class: 'row' }, UI.btn('Voltar', () => mainMenu(false)), UI.btn('Começar aventura!', () => {
        const nm = (cfg.name || '').trim() || 'Fazendeiro';
        const go = () => { const g = G(); g.slot = cfg.slot; UI.hideTitle(); g.newGame({ name: nm, farm: (cfg.farm || '').trim() || 'Fazenda Vaga-lume', look: { skin: cfg.skin, hair: C.HAIRS[cfg.hair], style: cfg.style, shirt: SHIRTS[cfg.shirt], pants: PANTS[cfg.pants], shoes: '#4a3020' }, pet: cfg.pet, petName: (cfg.petName || '').trim() || 'Pipoca' }); };
        if (saves[cfg.slot - 1]) UI.confirm('Já existe um jogo neste slot. Sobrescrever?', go); else go();
      }, 'ok big')));
  }
})();
