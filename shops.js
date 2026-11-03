'use strict';
/* ============================================================
   Interface: lojas, oficina, forja, culinária, baú e caixote de envio
   ============================================================ */
(() => {
  const UI = VV.UI, U = VV.U, D = VV.Data, St = VV.State, h = U.h, A = VV.Audio;
  const G = () => VV.G;
  const entryName = e => e.virt === 'rod2' ? 'Melhoria da Vara' : D.ITEMS[e.item].n;
  const entryInst = e => e.virt === 'rod2' ? { id: 'rod', n: 1, tier: 1 } : { id: e.item, n: 1, tier: D.ITEMS[e.item] && D.ITEMS[e.item].tool ? 0 : undefined };

  /* ---------- loja ---------- */
  let shopQty = 1;
  UI.openShop = function (cfg) {
    let tab = 0; const tabs = cfg.tabs.map(t => t.name); if (cfg.canSell) tabs.push('Vender');
    UI.window(cfg.title, (body, refresh) => {
      const S = G().S;
      body.append(h('div', { class: 'shophead' }, cfg.npc ? UI.portrait(cfg.npc) : null, h('div', { class: 'tabs row' }, tabs.map((t, i) => h('button', { class: 'tab' + (i === tab ? ' on' : ''), onclick: () => { tab = i; refresh(); } }, t))), UI.goldTag()));
      if (tab < cfg.tabs.length) {
        body.append(h('div', { class: 'row qtyrow' }, h('span', { class: 'dim' }, 'Quantidade:'), [1, 5, 25].map(q => h('button', { class: 'tab' + (shopQty === q ? ' on' : ''), onclick: () => { shopQty = q; refresh(); } }, 'x' + q))));
        const list = h('div', { class: 'shoplist' });
        for (const e of cfg.tabs[tab].items) {
          const d = D.ITEMS[e.item]; const unit = e.virt || (d && d.tool) ? 1 : shopQty; const total = e.price * unit; const can = S.gold >= total;
          const row = h('div', { class: 'shoprow' + (can ? '' : ' no') }, UI.slot(entryInst(e), { tip: !!d }), h('div', { class: 'rinfo' }, h('b', null, entryName(e) + (d && d.n && D.CROPS && e.item.startsWith('seed_') ? '' : '')), h('div', { class: 'dim sm' }, e.virt ? 'Vara de pesca melhor (barra maior)' : (d.d || ''))),
            h('div', { class: 'price' }, UI.miniImg('coin'), ' ' + U.fmt(e.price) + (unit > 1 ? ` x${unit}` : '')), UI.btn('Comprar', () => { if (G().buyItem(e, unit)) refresh(); }, can ? 'ok' : 'dis'));
          if (d) UI.tip(row, () => UI.itemTip({ id: e.item, n: 1 }));
          list.append(row);
        }
        body.append(list);
      } else {
        body.append(h('div', { class: 'dim' }, 'Clique para vender 1 · Shift+clique vende a pilha toda.'));
        const grid = h('div', { class: 'grid inv' });
        for (let i = 0; i < 36; i++) {
          const it = S.inv[i], locked = i >= S.invSize, v = it ? G().sellValue(it) : 0;
          const s = UI.slot(it, { locked, cls: it && !v ? 'dimmed' : '', onclick: e => { if (it && v) { G().sellItem(i, e.shiftKey ? it.n : 1); refresh(); UI.refreshHud(); } } });
          if (it && v) s.append(h('span', { class: 'pv' }, v + 'G')); grid.append(s);
        }
        body.append(grid);
      }
    }, { size: 'big' });
  };

  /* ---------- oficina do Ney ---------- */
  UI.openCarpenter = function () {
    let tab = 0; const TABS = ['Construções', 'Animais', 'Casa', 'Mochila'];
    UI.window('Oficina do Seu Ney', (body, refresh) => {
      const g = G(), S = g.S;
      body.append(h('div', { class: 'shophead' }, UI.portrait('ney'), h('div', { class: 'tabs row' }, TABS.map((t, i) => h('button', { class: 'tab' + (i === tab ? ' on' : ''), onclick: () => { tab = i; refresh(); } }, t))), UI.goldTag()));
      const list = h('div', { class: 'shoplist' });
      const cost = (b) => h('div', { class: 'reqs' }, h('span', { class: S.gold >= b.gold ? 'ok' : 'bad' }, UI.miniImg('coin'), ' ' + U.fmt(b.gold)), b.wood ? h('span', { class: St.countItem(S, 'wood') >= b.wood ? 'ok' : 'bad' }, UI.itemImg({ id: 'wood' }, 'ti'), ` ${St.countItem(S, 'wood')}/${b.wood}`) : null, b.stone ? h('span', { class: St.countItem(S, 'stone') >= b.stone ? 'ok' : 'bad' }, UI.itemImg({ id: 'stone' }, 'ti'), ` ${St.countItem(S, 'stone')}/${b.stone}`) : null);
      if (tab === 0) {
        for (const k in D.BUILD) {
          const b = D.BUILD[k], err = S.buildings[k] ? 'Construído' : S.construction[k] ? `Em obras (${S.construction[k].days}d)` : g.canBuild(k);
          list.append(h('div', { class: 'shoprow' }, h('div', { class: 'rinfo' }, h('b', null, b.n), h('div', { class: 'dim sm' }, b.d + ` Obra: ${b.days} dia(s).`), cost(b)), UI.btn(S.buildings[k] ? '✔' : 'Construir', () => { if (g.startBuild(k)) refresh(); }, !err ? 'ok' : 'dis')));
        }
      } else if (tab === 1) {
        for (const k in D.ANIMALS) {
          const a = D.ANIMALS[k], has = S.buildings[a.home], cnt = g.animalCount(a.home), cap = D.BUILD[a.home].cap;
          list.append(h('div', { class: 'shoprow' }, h('div', { class: 'rinfo' }, h('b', null, a.n), h('div', { class: 'dim sm' }, has ? `${cnt}/${cap} no ${D.BUILD[a.home].n}` : `Requer ${D.BUILD[a.home].n}`)), h('div', { class: 'price' }, UI.miniImg('coin'), ' ' + U.fmt(a.price)), UI.btn('Comprar', () => { if (g.buyAnimal(k)) refresh(); }, has && cnt < cap && S.gold >= a.price ? 'ok' : 'dis')));
        }
        list.append(h('div', { class: 'dim sm' }, `Feno guardado: ${S.hayStock || 0}/${g.hayCap()}. Use o comedouro/depósito dentro do galinheiro ou celeiro. Animais precisam de feno todo dia!`));
      } else if (tab === 2) {
        const hu = D.HOUSE_UP[S.houseLvl];
        if (S.houseReform) list.append(h('div', { class: 'dim' }, `Reforma em andamento (${S.houseReform.days} dia(s)).`));
        else if (!hu) list.append(h('div', { class: 'dim' }, 'Sua casa já está completa!'));
        else list.append(h('div', { class: 'shoprow' }, h('div', { class: 'rinfo' }, h('b', null, hu.n), h('div', { class: 'dim sm' }, 'Necessária para casar. Reforma: 2 dias.'), cost(hu)), UI.btn('Reformar', () => { if (g.upgradeHouse()) refresh(); }, !g.canUpgradeHouse() ? 'ok' : 'dis')));
      } else {
        const PK = [[24, 2000], [36, 10000]];
        for (const [sz, pr] of PK) list.append(h('div', { class: 'shoprow' }, h('div', { class: 'rinfo' }, h('b', null, `Mochila de ${sz} espaços`), h('div', { class: 'dim sm' }, S.invSize >= sz ? 'Você já tem.' : (S.invSize < sz - 12 && sz === 36 ? 'Compre a de 24 primeiro.' : ''))), h('div', { class: 'price' }, UI.miniImg('coin'), ' ' + U.fmt(pr)), UI.btn('Comprar', () => { if (S.invSize >= sz || (sz === 36 && S.invSize < 24)) return; if (S.gold < pr) { UI.toast('Dinheiro insuficiente.', 'bad'); return; } S.gold -= pr; S.invSize = sz; A.sfx('achieve'); UI.toast(`Mochila ampliada para ${sz} espaços!`, 'good', 'sack'); UI.refreshHud(); refresh(); }, S.invSize < sz && S.gold >= pr && (sz !== 36 || S.invSize >= 24) ? 'ok' : 'dis')));
      }
      body.append(list);
    }, { size: 'big' });
  };

  /* ---------- forja do Tomás ---------- */
  UI.openSmith = function () {
    let tab = 0, geodeMsg = '';
    UI.window('Forja do Tomás', (body, refresh) => {
      const g = G(), S = g.S;
      body.append(h('div', { class: 'shophead' }, UI.portrait('tomas'), h('div', { class: 'tabs row' }, ['Melhorar ferramentas', 'Abrir geodos'].map((t, i) => h('button', { class: 'tab' + (i === tab ? ' on' : ''), onclick: () => { tab = i; refresh(); } }, t))), UI.goldTag()));
      if (tab === 0) {
        if (S.upgrade) body.append(h('div', { class: 'dim' }, `Tomás está trabalhando em: ${D.ITEMS[S.upgrade.id].n} (${S.upgrade.days} dia(s)). Você será avisado por carta.`));
        const list = h('div', { class: 'shoplist' });
        S.inv.forEach((it, i) => {
          if (!it || !['hoe', 'can', 'axe', 'pick', 'sword'].includes(it.id)) return; const t = it.tier || 0; const c = D.UPGRADE_COST[t], err = g.canUpgradeTool(i);
          list.append(h('div', { class: 'shoprow' }, UI.slot(it, {}), h('div', { class: 'rinfo' }, h('b', null, `${D.ITEMS[it.id].n} (${D.TIERS[t]})`), c ? h('div', { class: 'reqs' }, h('span', { class: S.gold >= c.gold ? 'ok' : 'bad' }, UI.miniImg('coin'), ' ' + c.gold), h('span', { class: St.countItem(S, c.bar) >= c.n ? 'ok' : 'bad' }, UI.itemImg({ id: c.bar }, 'ti'), ` ${St.countItem(S, c.bar)}/${c.n}`)) : h('div', { class: 'dim sm' }, 'Nível máximo')), c ? UI.btn(`→ ${D.TIERS[t + 1]}`, () => { if (g.startToolUpgrade(i)) refresh(); }, !err ? 'ok' : 'dis') : null));
        });
        body.append(list);
      } else {
        const list = h('div', { class: 'shoplist' }); let any = false;
        S.inv.forEach((it, i) => { if (!it || !/geode/.test(it.id)) return; any = true; list.append(h('div', { class: 'shoprow' }, UI.slot(it), h('div', { class: 'rinfo' }, h('b', null, D.ITEMS[it.id].n), h('div', { class: 'dim sm' }, 'Custo: 25G')), UI.btn('Abrir', () => { const r = g.openGeode(i); if (r) geodeMsg = `Você encontrou: ${D.ITEMS[r.id].n} x${r.n}!`; refresh(); }, S.gold >= 25 ? 'ok' : 'dis'))); });
        if (!any) list.append(h('div', { class: 'dim' }, 'Você não tem geodos. Eles aparecem ao quebrar pedras e na mina.'));
        body.append(list, geodeMsg ? h('div', { class: 'goldtag' }, geodeMsg) : null);
      }
    }, { size: 'big' });
  };

  /* ---------- fabricação (bancada) ---------- */
  UI.openCraft = function () { UI.window('Bancada de Trabalho', (body, refresh) => { G().updateRecipes(); UI.craftList(body, refresh); }, { size: 'big' }); };

  /* ---------- culinária ---------- */
  UI.openCook = function () {
    UI.window('Cozinha', (body, refresh) => {
      const g = G(), S = g.S; g.updateRecipes();
      body.append(h('div', { class: 'dim' }, 'Ingredientes são retirados da sua mochila (a escolha usa os de menor valor primeiro).'));
      const list = h('div', { class: 'recipes' });
      for (const r of D.COOK) {
        if (!S.known.cook.includes(r.id)) continue; const can = !!g.cookPicks(r); const d = D.ITEMS[r.out];
        list.append(h('div', { class: 'recipe' + (can ? '' : ' no') }, UI.slot({ id: r.out, n: 1 }), h('div', { class: 'rinfo' }, h('b', null, d.n), h('div', { class: 'dim sm' }, `+${d.e} energia · +${d.h} vida` + (d.buff ? ` · ${D.BUFFS[d.buff.stat]} +${d.buff.val}` : '')),
          h('div', { class: 'reqs' }, Object.entries(r.req).map(([k, n]) => { const have = k[0] === '_' ? St.countWhere(S, id => D.ING[k](id)) : St.countItem(S, k); const nm = k[0] === '_' ? D.ING_NAME[k] : D.ITEMS[k].n; return h('span', { class: have >= n ? 'ok' : 'bad' }, k[0] === '_' ? null : UI.itemImg({ id: k }, 'ti'), ` ${nm} ${Math.min(have, 99)}/${n} `); }))), UI.btn('Cozinhar', () => { if (g.cook(r)) refresh(); }, can ? 'ok' : 'dis')));
      }
      const locked = D.COOK.filter(r => !S.known.cook.includes(r.id)).length;
      body.append(list, locked ? h('div', { class: 'dim sm' }, `${locked} receita(s) a descobrir: converse com os moradores e suba suas habilidades.`) : null);
    }, { size: 'big' });
  };

  /* ---------- baú ---------- */
  UI.openChest = function (o) {
    UI.window(o.kind === 'treasure' ? 'Tesouro do Golem' : 'Baú', (body, refresh) => {
      const S = G().S;
      const rows = Math.ceil(o.cap / 12);
      const cg = h('div', { class: 'grid inv' }), ig = h('div', { class: 'grid inv' });
      for (let i = 0; i < o.cap; i++) cg.append(UI.slot(o.items[i], { onclick: e => { const it = o.items[i]; if (!it) return; const n = e.shiftKey ? Math.ceil(it.n / 2) : it.n; const rest = St.addItem(S, Object.assign({}, it, { n }), S.inv, S.invSize); const moved = n - rest; if (!moved) { UI.toast('Mochila cheia!', 'bad', 'sack'); return; } it.n -= moved; if (it.n <= 0) o.items[i] = null; A.sfx('pickup', { vol: 0.5 }); refresh(); UI.refreshHud(); } }));
      for (let i = 0; i < 36; i++) ig.append(UI.slot(S.inv[i], { locked: i >= S.invSize, onclick: e => { const it = S.inv[i]; if (!it || i >= S.invSize) return; const n = e.shiftKey ? Math.ceil(it.n / 2) : it.n; const rest = St.addItem(S, Object.assign({}, it, { n }), o.items, o.cap); const moved = n - rest; if (!moved) { UI.toast('O baú está cheio!', 'bad', 'chest'); return; } it.n -= moved; if (it.n <= 0) S.inv[i] = null; A.sfx('pickup', { vol: 0.5 }); refresh(); UI.refreshHud(); } }));
      body.append(h('div', { class: 'dim' }, 'Conteúdo do baú'), cg, h('div', { class: 'dim' }, 'Sua mochila · clique move a pilha, Shift move metade'), ig);
    }, { size: 'big', onClose: () => { o.open = false; A.sfx('close'); } });
  };

  /* ---------- caixote de envio ---------- */
  UI.openBin = function () {
    UI.window('Caixote de Envio', (body, refresh) => {
      const g = G(), S = g.S;
      const ig = h('div', { class: 'grid inv' });
      for (let i = 0; i < 36; i++) { const it = S.inv[i], v = it ? g.sellValue(it) : 0; const s = UI.slot(it, { locked: i >= S.invSize, cls: it && !v ? 'dimmed' : '', onclick: e => { if (it && v) { if (g.binAdd(i, e.shiftKey ? 1 : it.n)) refresh(); } } }); if (it && v) s.append(h('span', { class: 'pv' }, v + 'G')); ig.append(s); }
      const sl = h('div', { class: 'shiplist' });
      S.shipping.forEach((s, i) => sl.append(h('div', { class: 'shiprow click', onclick: () => { g.binTake(i); refresh(); } }, UI.itemImg({ id: s.id, tier: 0 }, 'ti'), h('span', null, D.itemName(s) + ' x' + s.n), h('b', null, D.sellPrice(s) * s.n + 'G'))));
      if (!S.shipping.length) sl.append(h('div', { class: 'dim' }, 'Vazio. Clique nos itens da mochila para enviar.'));
      body.append(h('div', { class: 'binwrap' }, h('div', null, h('div', { class: 'dim' }, 'Mochila · clique envia a pilha, Shift envia 1'), ig), h('div', null, h('div', { class: 'dim' }, 'Será vendido ao amanhecer (clique para devolver)'), sl, h('div', { class: 'goldtag big' }, UI.miniImg('coin'), ' ' + U.fmt(g.binValue()) + 'G'))));
    }, { size: 'big' });
  };
})();
