'use strict';
/* ============================================================
   Estado persistente, inventário, tempo, habilidades e salvamento
   ============================================================ */
VV.State = (() => {
  const D = VV.Data, U = VV.U;
  const SAVE_VER = 3;
  const MIN_PER_DAY_END = 1560; // 02:00
  const DAY_START = 360;

  function newState(opts) {
    const S = {
      v: SAVE_VER, seed: opts.seed || (Math.random() * 1e9 | 0), name: opts.name || 'Fazendeiro', farm: opts.farm || 'Vale dos Vaga-lumes',
      look: opts.look, pet: opts.pet || 'dog', petName: opts.petName || 'Pipoca',
      day: 1, min: DAY_START + 20, gold: 500, earned: 0,
      energy: 100, maxEnergy: 100, hp: 100, maxHp: 100,
      invSize: 12, inv: new Array(36).fill(null), sel: 0,
      skills: { farm: 0, mine: 0, forage: 0, fish: 0, combat: 0 },
      friends: {}, flags: {}, stats: {},
      weather: 'sun', nextWeather: 'sun',
      quests: { done: [], active: ['q_start'], prog: {} },
      bundles: {}, known: { craft: [], cook: [] },
      animals: [], buildings: {}, construction: {}, shipping: [], upgrade: null, houseLvl: 0,
      collected: {}, fish: {}, buffs: [], rings: [null, null], weapon: null, boots: null,
      mine: { deepest: 0, elevator: [] },
      mapState: {}, spouse: null, wedding: null, mail: [], readMail: [], requests: [], daily: { gifted: {}, talked: {} },
      loc: { map: 'farm', x: 8 * 16 + 8, y: 9 * 16 + 14, dir: 0 },
      ach: {}, calendar: {}, tutorial: {}, playtime: 0,
    };
    // inventário inicial
    const add = (id, n = 1, extra) => { addItem(S, Object.assign({ id, n }, extra)); };
    add('hoe', 1, { tier: 0 }); add('can', 1, { tier: 0 }); add('axe', 1, { tier: 0 }); add('pick', 1, { tier: 0 }); add('scythe', 1, { tier: 0 }); add('rod', 1, { tier: 0 }); add('sword', 1, { tier: 0 });
    add('seed_nabo', 15); add('seed_tulipa', 5);
    S.can = { water: 40, max: 40 };
    // receitas iniciais
    D.CRAFT.forEach(r => { if (!r.skill) S.known.craft.push(r.id); });
    D.COOK.forEach(r => { if (r.start) S.known.cook.push(r.id); });
    S.known.craft.push('fence'); // garantia
    return S;
  }

  /* ---------- tempo ---------- */
  const season = S => Math.floor((S.day - 1) / 28) % 4;
  const dayOfSeason = S => (S.day - 1) % 28 + 1;
  const year = S => Math.floor((S.day - 1) / 112) + 1;
  const weekday = S => (S.day - 1) % 7;
  function clockText(min) { const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2, '0')}:${String(m - m % 10).padStart(2, '0')}`; }
  function hour(S) { return S.min / 60; }
  function dateText(S) { return `${D.DAYS[weekday(S)]} ${dayOfSeason(S)} de ${D.SEASONS[season(S)]}`; }

  /* ---------- inventário ---------- */
  const isTool = id => !!(D.ITEMS[id] && D.ITEMS[id].tool);
  const stackKey = it => it.id + '|' + (it.q || 0) + '|' + (it.from || '');
  function maxStack(it) { return isTool(it.id) || (D.ITEMS[it.id] && D.ITEMS[it.id].ring) ? 1 : 999; }
  function addItem(S, inst, arr, cap) {
    arr = arr || S.inv; cap = cap || (arr === S.inv ? S.invSize : arr.length);
    let n = inst.n || 1;
    if (!D.ITEMS[inst.id]) return 0;
    const st = maxStack(inst);
    if (st > 1) for (let i = 0; i < cap && n > 0; i++) {
      const s = arr[i];
      if (s && stackKey(s) === stackKey(inst) && s.n < st) { const k = Math.min(n, st - s.n); s.n += k; n -= k; }
    }
    while (n > 0) {
      let slot = -1; for (let i = 0; i < cap; i++) if (!arr[i]) { slot = i; break; }
      if (slot < 0) break;
      const k = Math.min(n, st);
      arr[slot] = Object.assign({}, inst, { n: k }); n -= k;
    }
    if (n < (inst.n || 1) && arr === S.inv) discover(S, inst.id);
    return n; // restante que não coube
  }
  function discover(S, id) {
    if (S.collected[id]) return;
    const it = D.ITEMS[id]; if (!it) return;
    if (['ferramenta', 'colocável', 'lixo'].includes(it.cat) && it.cat !== 'lixo') return;
    S.collected[id] = S.day; S.stats.collected = Object.keys(S.collected).length;
    if (VV.G && VV.G.onDiscover) VV.G.onDiscover(id);
  }
  function countItem(S, id, arr) { let c = 0; for (const s of (arr || S.inv)) if (s && s.id === id) c += s.n; return c; }
  function countWhere(S, fn) { let c = 0; for (const s of S.inv) if (s && fn(s.id)) c += s.n; return c; }
  function removeItem(S, id, n) {
    let left = n;
    // retira primeiro dos de menor qualidade
    const idx = S.inv.map((s, i) => i).filter(i => S.inv[i] && S.inv[i].id === id).sort((a, b) => (S.inv[a].q || 0) - (S.inv[b].q || 0));
    for (const i of idx) { const s = S.inv[i]; const k = Math.min(left, s.n); s.n -= k; left -= k; if (s.n <= 0) S.inv[i] = null; if (!left) break; }
    return n - left;
  }
  function removeWhere(S, fn, n) {
    let left = n; const idx = S.inv.map((s, i) => i).filter(i => S.inv[i] && fn(S.inv[i].id)).sort((a, b) => (D.ITEMS[S.inv[a].id].p) - (D.ITEMS[S.inv[b].id].p));
    const taken = [];
    for (const i of idx) { const s = S.inv[i]; const k = Math.min(left, s.n); taken.push({ id: s.id, n: k, q: s.q }); s.n -= k; left -= k; if (s.n <= 0) S.inv[i] = null; if (!left) break; }
    return taken;
  }
  function hasRoom(S, inst) {
    const st = maxStack(inst); let n = inst.n || 1;
    for (let i = 0; i < S.invSize; i++) { const s = S.inv[i]; if (!s) return true; if (st > 1 && stackKey(s) === stackKey(inst) && s.n < st) n -= st - s.n; if (n <= 0) return true; }
    return false;
  }
  function held(S) { return S.inv[S.sel] || null; }

  /* ---------- habilidades ---------- */
  function skillLevel(S, k) { const xp = S.skills[k] || 0; let l = 0; while (l < 10 && xp >= D.XP_LEVELS[l + 1]) l++; return l; }
  function addXP(S, k, n) {
    const before = skillLevel(S, k);
    S.skills[k] = (S.skills[k] || 0) + n;
    const after = skillLevel(S, k);
    if (after > before) { S.stats.maxSkill = Math.max(S.stats.maxSkill || 0, after); return after; }
    return 0;
  }
  const skillFrac = (S, k) => { const l = skillLevel(S, k); if (l >= 10) return 1; const a = D.XP_LEVELS[l], b = D.XP_LEVELS[l + 1]; return (S.skills[k] - a) / (b - a); };

  /* ---------- amizades ---------- */
  function friend(S, id) { return S.friends[id] || (S.friends[id] = { pts: 0, talked: 0, gifted: 0, giftWeek: 0, met: 0, dating: 0, engaged: 0, married: 0, stories: [], lastGift: -1 }); }
  const hearts = (S, id) => Math.min(10, Math.floor(friend(S, id).pts / 250));
  function addFriend(S, id, n) {
    const f = friend(S, id), before = hearts(S, id);
    const cap = (VV.Data.NPCS[id].romance && !f.dating && !f.married) ? 8 * 250 + 249 : 10 * 250 + 249; // romance trava em 8 sem namoro
    f.pts = U.clamp(f.pts + n, 0, f.married ? 14 * 250 : cap);
    return hearts(S, id) > before;
  }

  /* ---------- buffs e atributos derivados ---------- */
  function buff(S, stat) { let v = 0; for (const b of S.buffs) if (b.stat === stat) v += b.val; return v; }
  function ringVal(S, kind) { let v = 0; for (const r of S.rings) if (r) { const it = D.ITEMS[r.id]; if (it && it.ring === kind) v += ({ def: 3, luck: 2, atk: 4, lumi: 1, mag: 1 }[kind] || 1); } return v; }
  function defense(S) { return buff(S, 'def') + ringVal(S, 'def') + (S.boots ? 1 : 0) + (skillLevel(S, 'combat') >= 3 ? 3 : 0); }
  function attackBonus(S) { const l = skillLevel(S, 'combat'); return buff(S, 'atk') + ringVal(S, 'atk') + (l >= 1 ? 2 : 0) + (l >= 5 ? 3 : 0) + (l >= 9 ? 4 : 0); }
  function luck(S) { return buff(S, 'luck') + ringVal(S, 'luck'); }
  function maxHpFor(S) { const l = skillLevel(S, 'combat'); return 100 + (l >= 2 ? 10 : 0) + (l >= 4 ? 10 : 0) + (l >= 7 ? 15 : 0) + (S.flags.heart1 ? 20 : 0) + (S.flags.heart2 ? 20 : 0); }

  /* ---------- salvamento ---------- */
  const KEY = n => 'vv_save_' + n;
  function listSaves() {
    const out = [];
    for (let i = 1; i <= 3; i++) {
      try { const raw = localStorage.getItem(KEY(i)); if (!raw) { out.push(null); continue; } const d = JSON.parse(raw); out.push({ slot: i, name: d.name, farm: d.farm, day: d.day, gold: d.gold, season: season(d), look: d.look, year: year(d), playtime: d.playtime || 0, ts: d._ts }); }
      catch (e) { out.push(null); }
    }
    return out;
  }
  function save(S, slot) {
    try { S._ts = Date.now(); localStorage.setItem(KEY(slot), JSON.stringify(S)); return true; }
    catch (e) { console.warn('save falhou', e); return false; }
  }
  function load(slot) {
    try { const raw = localStorage.getItem(KEY(slot)); if (!raw) return null; const d = JSON.parse(raw); return migrate(d); }
    catch (e) { console.warn('load falhou', e); return null; }
  }
  function del(slot) { try { localStorage.removeItem(KEY(slot)); } catch (e) { } }
  function migrate(d) {
    const base = newState({ look: d.look });
    for (const k in base) if (d[k] === undefined) d[k] = base[k];
    d.v = SAVE_VER; return d;
  }
  // exportar / importar (backup em arquivo)
  function exportJSON(S) { return JSON.stringify(S); }
  function importJSON(txt) { const d = JSON.parse(txt); if (!d || !d.inv || !d.day) throw new Error('inválido'); return migrate(d); }

  // configurações
  const SET_KEY = 'vv_settings';
  const defaults = { music: 0.6, sfx: 0.7, amb: 0.6, scale: 'auto', hints: true, shake: true, lang: 'pt', autoSave: true, showFps: false, fullbright: false, zoom: 3 };
  function loadSettings() { try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) { return Object.assign({}, defaults); } }
  function saveSettings(s) { try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) { } }

  return {
    newState, season, dayOfSeason, year, weekday, clockText, hour, dateText, DAY_START, MIN_PER_DAY_END,
    addItem, countItem, countWhere, removeItem, removeWhere, hasRoom, held, isTool, discover,
    skillLevel, addXP, skillFrac, friend, hearts, addFriend, buff, ringVal, defense, attackBonus, luck, maxHpFor,
    listSaves, save, load, del, exportJSON, importJSON, loadSettings, saveSettings, defaults,
  };
})();
