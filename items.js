'use strict';
/* ============================================================
   DADOS: itens, culturas, peixes, receitas, máquinas, lojas, habilidades
   ============================================================ */
VV.Data = VV.Data || {};
(() => {
  const D = VV.Data;
  const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
  const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  D.SEASONS = SEASONS; D.DAYS = DAYS;
  D.TIERS = ['Básico', 'Cobre', 'Ferro', 'Ouro'];
  D.TIER_COL = ['#b8a58a', '#e0873f', '#d8d2cc', '#ffd23f'];
  D.QUALITY = ['', 'Prata', 'Ouro', 'Iridescente'];
  D.QMULT = [1, 1.25, 1.5, 2];

  const items = {};
  const add = (id, n, cat, p, sh, c, o = {}) => { items[id] = Object.assign({ id, n, cat, p, sh, c: c || ['#aaa'], d: '' }, o); return items[id]; };

  /* ---------- ferramentas ---------- */
  add('hoe', 'Enxada', 'ferramenta', 0, 'tool_hoe', null, { tool: 1, d: 'Prepara a terra para o plantio.' });
  add('can', 'Regador', 'ferramenta', 0, 'tool_can', null, { tool: 1, d: 'Rega as plantações. Encha em qualquer água.' });
  add('axe', 'Machado', 'ferramenta', 0, 'tool_axe', null, { tool: 1, d: 'Derruba árvores e quebra troncos.' });
  add('pick', 'Picareta', 'ferramenta', 0, 'tool_pick', null, { tool: 1, d: 'Quebra pedras e minérios.' });
  add('scythe', 'Foice', 'ferramenta', 0, 'tool_scythe', null, { tool: 1, d: 'Corta mato alto e rende feno.' });
  add('rod', 'Vara de Pesca', 'ferramenta', 0, 'tool_rod', null, { tool: 1, d: 'Para pescar em águas profundas.' });
  add('sword', 'Espada Enferrujada', 'ferramenta', 0, 'tool_sword', null, { tool: 1, weapon: 1, dmg: [4, 7], d: 'Já viu dias melhores.' });

  /* ---------- armas ---------- */
  add('sword_steel', 'Espada de Aço', 'ferramenta', 800, 'tool_sword', ['#c8d0dc'], { tool: 1, weapon: 1, dmg: [9, 14], fixed: 1, d: 'Lâmina equilibrada e afiada.' });
  add('sword_lumi', 'Lâmina Lumínica', 'ferramenta', 3000, 'tool_sword', ['#ffe48a'], { tool: 1, weapon: 1, dmg: [16, 24], crit: 0.12, fixed: 1, d: 'Brilha como mil vaga-lumes.' });
  add('sword_crystal', 'Espada de Cristal', 'ferramenta', 0, 'tool_sword', ['#74e6ff'], { tool: 1, weapon: 1, dmg: [26, 38], crit: 0.15, fixed: 1, d: 'Forjada do coração do Golem.' });
  add('club', 'Maça de Pedra', 'ferramenta', 1500, 'tool_club', ['#9d979a'], { tool: 1, weapon: 1, dmg: [14, 22], slow: 1, fixed: 1, d: 'Lenta, mas devastadora.' });

  /* ---------- recursos ---------- */
  add('wood', 'Madeira', 'recurso', 2, 'log', ['#9a6e40'], { d: 'Material de construção básico.' });
  add('stone', 'Pedra', 'recurso', 2, 'stone', ['#9d979a'], { d: 'Útil para construir e fabricar.' });
  add('fiber', 'Fibra', 'recurso', 1, 'fiber', ['#6fb04a'], { d: 'Fibras vegetais resistentes.' });
  add('hay', 'Feno', 'recurso', 3, 'hay', ['#e8c36a'], { d: 'Alimento dos animais da fazenda.' });
  add('coal', 'Carvão', 'recurso', 15, 'coal', ['#25232d'], { d: 'Combustível de forjas e máquinas.' });
  add('sap', 'Seiva', 'recurso', 5, 'drop', ['#c8a24a'], { d: 'Gotas grudentas de árvore.' });
  add('clay', 'Argila', 'recurso', 5, 'clay', ['#c46a46'], {});
  add('copper_ore', 'Minério de Cobre', 'mineral', 5, 'ore', ['#e0873f', '#ffb06a'], { d: 'Derreta na fornalha.' });
  add('iron_ore', 'Minério de Ferro', 'mineral', 10, 'ore', ['#8a8490', '#d8d2cc'], { d: 'Derreta na fornalha.' });
  add('gold_ore', 'Minério de Ouro', 'mineral', 25, 'ore', ['#c8962a', '#ffd23f'], { d: 'Derreta na fornalha.' });
  add('copper_bar', 'Barra de Cobre', 'mineral', 60, 'bar', ['#e0873f', '#ffb06a'], {});
  add('iron_bar', 'Barra de Ferro', 'mineral', 120, 'bar', ['#8a8490', '#d8d2cc'], {});
  add('gold_bar', 'Barra de Ouro', 'mineral', 250, 'bar', ['#c8962a', '#ffd23f'], {});
  add('quartz', 'Quartzo', 'mineral', 25, 'gem', ['#e6ecff', '#ffffff'], { gem: 1, d: 'Um cristal translúcido.' });
  add('amethyst', 'Ametista', 'mineral', 100, 'gem', ['#b777ff', '#e3c8ff'], { gem: 1 });
  add('topaz', 'Topázio', 'mineral', 80, 'gem', ['#ffb040', '#ffe2a0'], { gem: 1 });
  add('emerald', 'Esmeralda', 'mineral', 250, 'gem', ['#3fdb7a', '#b0ffd0'], { gem: 1 });
  add('ruby', 'Rubi', 'mineral', 250, 'gem', ['#ff4a5e', '#ffb0ba'], { gem: 1 });
  add('sapphire', 'Safira', 'mineral', 250, 'gem', ['#4a7dff', '#b0c8ff'], { gem: 1 });
  add('diamond', 'Diamante', 'mineral', 750, 'gem', ['#c8f4ff', '#ffffff'], { gem: 1 });
  add('lumi_shard', 'Estilhaço Lumínico', 'mineral', 300, 'gem', ['#ffe66a', '#ffffff'], { gem: 1, d: 'Fragmento de luz solidificada.' });
  add('geode', 'Geodo', 'mineral', 50, 'geode', ['#8a8494', '#b0a8c0'], { d: 'Leve ao Ferreiro para abrir.' });
  add('frozen_geode', 'Geodo Congelado', 'mineral', 100, 'geode', ['#9ad8f0', '#e0f8ff'], { d: 'Leve ao Ferreiro para abrir.' });
  add('crystal_core', 'Coração de Cristal', 'mineral', 2000, 'gem', ['#74e6ff', '#ffffff'], { gem: 1, d: 'Pulsando com energia antiga.' });

  /* ---------- coleta ---------- */
  const forage = (id, n, p, sh, c, e, h, d, s) => add(id, n, 'coleta', p, sh, c, { e, h, d, forage: 1, food: 1, seasons: s });
  forage('wild_garlic', 'Alho-selvagem', 20, 'leaf', ['#9ad07a', '#d8f0c0'], 20, 8, 'Aroma forte e fresco.', [0]);
  forage('dandelion', 'Dente-de-leão', 40, 'flower', ['#ffe14a', '#fff8a0'], 25, 10, 'Flor amarelinha.', [0]);
  forage('daffodil', 'Narciso', 30, 'flower', ['#ffd23f', '#ffffff'], 0, 0, 'Perfumado e bonito.', [0]);
  forage('berry_wild', 'Amora-brava', 25, 'berries', ['#8a3a8a', '#c870c8'], 25, 10, 'Doce e azeda.', [1, 2]);
  forage('grape_wild', 'Uva-do-mato', 80, 'berries', ['#7a3fa8', '#b080e0'], 30, 12, '', [1]);
  forage('shell', 'Concha', 60, 'shell', ['#f5cfc2', '#fff2e8'], 0, 0, 'Achada na areia.', [0, 1, 2, 3]);
  forage('coral', 'Coral', 90, 'coral', ['#ff7a8a', '#ffb0ba'], 0, 0, 'Colorido e delicado.', [0, 1, 2, 3]);
  forage('mushroom', 'Cogumelo-comum', 35, 'mushroom', ['#c8a070', '#e8d0a8'], 30, 12, '', [0, 2]);
  forage('mushroom_red', 'Cogumelo Rubro', 75, 'mushroom', ['#d8392d', '#ffffff'], 40, 16, 'Raro e saboroso.', [2]);
  forage('chestnut', 'Castanha', 20, 'nut', ['#8a5a30', '#c08a50'], 20, 8, '', [2]);
  forage('hazelnut', 'Avelã', 40, 'nut', ['#b8844a', '#e0b070'], 25, 10, '', [2]);
  forage('winter_root', 'Raiz-de-inverno', 70, 'root', ['#a06a8a', '#d8a8c8'], 30, 12, '', [3]);
  forage('snow_yam', 'Inhame-da-neve', 100, 'root', ['#e8d8b8', '#fff'], 40, 16, '', [3]);
  forage('holly', 'Azevinho', 80, 'leaf', ['#2f7a4e', '#d8392d'], 0, 0, 'Decora bem as portas.', [3]);
  forage('crystal_fruit', 'Fruto-de-cristal', 150, 'gem', ['#9ad8f0', '#ffffff'], 60, 24, 'Cintila na neve.', [3]);
  forage('spice_berry', 'Baga-picante', 80, 'berries', ['#e8453a', '#ff9a8a'], 30, 12, '', [1]);
  forage('fiddlehead', 'Samambaia', 25, 'leaf', ['#4fa83a', '#9ad07a'], 25, 10, '', [0, 1]);
  forage('lumi_blossom', 'Flor-Lúmen', 200, 'flower', ['#9fe8ff', '#ffffff'], 80, 30, 'Só desabrocha à noite.', [0, 1, 2, 3]);

  /* ---------- sementes e culturas ---------- */
  // t: tipo de sprite / l: cor da folha / f: cor do fruto
  const crops = {};
  const crop = (id, n, seasons, days, reg, p, sp, type, l, f, e, extra = {}) => {
    crops[id] = Object.assign({ id, n, seasons, days, reg, p, sp, type, l, f, e, xp: Math.round(days * 1.6 + p / 25) }, extra);
    add(id, n, 'cultura', p, crop_shape(type), [f, l], { crop: 1, e, h: Math.floor(e * 0.4), d: extra.d || '' });
    add('seed_' + id, 'Semente de ' + n.replace(/^(Flor-de-|Flor )/, ''), 'semente', Math.floor(sp / 2), 'seed', [f, l], { seed: id, d: `Cresce em ${days} dias. Estação: ${seasons.map(s => SEASONS[s]).join(', ')}.${reg ? ' Rebrota a cada ' + reg + ' dias.' : ''}` });
  };
  function crop_shape(t) { return ({ leaf: 'leaf', root: 'root', stalk: 'ear', vine: 'round', bush: 'berries', gourd: 'gourd', flower: 'flower', grape: 'berries' })[t] || 'round'; }
  // Primavera
  crop('nabo', 'Nabo', [0], 4, 0, 35, 20, 'root', '#6aa845', '#e8e0f0', 30);
  crop('alho', 'Alho', [0], 4, 0, 60, 40, 'root', '#7ab84a', '#f4eee0', 28);
  crop('batata', 'Batata', [0], 6, 0, 80, 50, 'root', '#6aa845', '#c8a46a', 40);
  crop('couveflor', 'Couve-flor', [0], 8, 0, 175, 80, 'leaf', '#4fa83a', '#f4f0d8', 55);
  crop('morango', 'Morango', [0], 8, 4, 120, 100, 'bush', '#3f9e3b', '#e8302d', 38);
  crop('tulipa', 'Tulipa', [0], 6, 0, 30, 20, 'flower', '#4fa83a', '#ff6a9a', 0, { flower: 1 });
  // Verão
  crop('rabanete', 'Rabanete', [1], 6, 0, 90, 40, 'root', '#5aa84a', '#e8453a', 35);
  crop('pimenta', 'Pimenta', [1], 5, 3, 40, 40, 'vine', '#4fa83a', '#d8392d', 25);
  crop('tomate', 'Tomate', [1], 11, 4, 60, 50, 'vine', '#4fa83a', '#e8302d', 40);
  crop('mirtilo', 'Mirtilo', [1], 13, 4, 50, 80, 'bush', '#3f8e5b', '#4a5ad8', 28);
  crop('melao', 'Melão', [1], 12, 0, 250, 80, 'gourd', '#4f9e3b', '#9ad87a', 60, { stripe: '#6fb04a' });
  crop('milho', 'Milho', [1, 2], 14, 4, 50, 150, 'stalk', '#5aa83a', '#f2c230', 25);
  crop('girassol', 'Girassol', [1, 2], 8, 0, 80, 100, 'stalk', '#4fa83a', '#ffc21a', 0, { flower: 1 });
  // Outono
  crop('berinjela', 'Berinjela', [2], 5, 5, 60, 20, 'vine', '#4fa83a', '#7a3fa8', 30);
  crop('batatadoce', 'Batata-doce', [2], 6, 0, 100, 60, 'root', '#6aa845', '#e8793a', 45);
  crop('amaranto', 'Amaranto', [2], 7, 0, 150, 70, 'leaf', '#a83a5a', '#d8456a', 40);
  crop('uva', 'Uva', [2], 10, 3, 80, 60, 'grape', '#4fa83a', '#7a3fa8', 30);
  crop('cranberry', 'Oxicoco', [2], 7, 5, 75, 240, 'bush', '#3f8e4b', '#d8302d', 25);
  crop('abobora', 'Abóbora', [2], 13, 0, 320, 100, 'gourd', '#4f9e3b', '#e8821e', 70);
  // Inverno
  crop('raizgelada', 'Raiz Gelada', [3], 7, 0, 120, 50, 'root', '#5a98b8', '#9ad8f0', 45);
  crop('repolhoroxo', 'Repolho Roxo', [3], 9, 0, 190, 90, 'leaf', '#7a4a98', '#a86ac8', 50);
  crop('flordegelo', 'Flor-de-gelo', [3], 6, 0, 100, 60, 'flower', '#5a98b8', '#c8f0ff', 0, { flower: 1 });
  // Rara
  crop('estrelafruta', 'Fruta-Estelar', [0, 1, 2, 3], 28, 0, 900, 1600, 'gourd', '#a85ad8', '#ffe66a', 120, { stripe: '#ffffff', d: 'Fruta cósmica que cresce em qualquer estação.' });
  D.CROPS = crops;

  /* ---------- peixes ---------- */
  // loc: river, lake, ocean, mine, pond ; time [h0,h1]; diff 1..10; wx: null|'rain'
  const fishes = {};
  const fish = (id, n, loc, seasons, time, diff, p, extra = {}) => {
    fishes[id] = Object.assign({ id, n, loc, seasons, time, diff, p }, extra);
    add(id, n, 'peixe', p, 'fish', extra.col || ['#7aa8d8', '#d8eaf8'], { fish: 1, e: Math.floor(p / 2.5), h: Math.floor(p / 6), d: extra.d || '' });
  };
  fish('carpa', 'Carpa', ['river', 'lake'], [0, 1, 2, 3], [6, 26], 2, 30, { col: ['#c8903a', '#f0c880'] });
  fish('perca', 'Perca', ['river', 'lake'], [0, 1, 2], [6, 26], 3, 55, { col: ['#6a9a4a', '#d8c85a'] });
  fish('truta', 'Truta-arco-íris', ['river'], [0, 2, 3], [6, 19], 4, 70, { col: ['#6aa8c8', '#ff8aa8'] });
  fish('bagre', 'Bagre', ['river', 'lake'], [2, 3], [6, 26], 5, 110, { wx: 'rain', col: ['#7a6a5a', '#b8a898'] });
  fish('salmao', 'Salmão', ['river'], [2], [6, 19], 5, 90, { col: ['#e87a6a', '#f8b8a8'] });
  fish('lucio', 'Lúcio', ['lake'], [3], [6, 26], 6, 160, { col: ['#5a8a5a', '#a8c898'] });
  fish('tilapia', 'Tilápia', ['lake'], [1], [6, 19], 3, 60, { col: ['#c8a8d8', '#f0e0f8'] });
  fish('sardinha', 'Sardinha', ['ocean'], [0, 1, 2, 3], [6, 19], 2, 35, { col: ['#a8b8d8', '#e8f0f8'] });
  fish('cavala', 'Cavala', ['ocean'], [0, 3], [6, 26], 4, 70, { col: ['#4a7a98', '#a8d0e8'] });
  fish('atum', 'Atum', ['ocean'], [1, 2], [6, 19], 6, 130, { col: ['#3a5a8a', '#a0b8e0'] });
  fish('polvo', 'Polvo', ['ocean'], [1], [18, 26], 6, 170, { col: ['#c85a8a', '#f0a8c8'], sh: 'octo' });
  fish('baiacu', 'Baiacu', ['ocean'], [1], [12, 20], 7, 210, { col: ['#e8c85a', '#fff0a8'] });
  fish('enguia', 'Enguia', ['ocean'], [0, 2], [18, 26], 7, 100, { wx: 'rain', col: ['#4a6a4a', '#98b898'] });
  fish('lanterna', 'Peixe-Lanterna', ['ocean', 'lake'], [0, 1, 2, 3], [20, 26], 7, 190, { col: ['#1a2a5a', '#ffe66a'], d: 'Ilumina o próprio caminho.' });
  fish('cego', 'Peixe-Cego', ['mine'], [0, 1, 2, 3], [6, 26], 5, 130, { col: ['#c8b8d8', '#f0e8f8'] });
  fish('gelo', 'Peixe-de-Gelo', ['lake', 'river'], [3], [6, 26], 6, 140, { col: ['#a8e0f8', '#ffffff'] });
  fish('carpa_dourada', 'Carpa Dourada de Alba', ['lake'], [0, 1, 2, 3], [6, 26], 9, 1500, { legend: 1, wx: 'rain', col: ['#ffc21a', '#fff08a'], d: 'LENDÁRIA. A carpa preferida da Vovó Alba.' });
  fish('lula', 'Lula Cintilante', ['ocean'], [0, 1, 2, 3], [20, 26], 9, 1800, { legend: 1, col: ['#7a5ad8', '#b8f8ff'], sh: 'octo', d: 'LENDÁRIA. Brilha nas profundezas.' });
  D.FISH = fishes;
  add('trash_boot', 'Bota Velha', 'lixo', 1, 'boot', ['#6a5a4a'], { d: 'Alguém perdeu isto há muito tempo.' });
  add('trash_algae', 'Alga', 'lixo', 3, 'leaf', ['#4a8a5a'], {});
  add('trash_can', 'Lata Enferrujada', 'lixo', 1, 'can', ['#8a7a6a'], {});
  add('bait', 'Isca', 'recurso', 3, 'bait', ['#c46a46'], { d: 'Aumenta a chance de fisgar.' });
  add('lure', 'Isca Brilhante', 'recurso', 20, 'bait', ['#74e6ff'], { d: 'Atrai peixes raros.' });

  /* ---------- produtos animais e artesanato ---------- */
  add('egg', 'Ovo', 'animal', 50, 'egg', ['#f5f1e6', '#d8d0c0'], { food: 1, e: 25, h: 10 });
  add('egg_brown', 'Ovo Marrom', 'animal', 60, 'egg', ['#c88a58', '#a86a38'], { food: 1, e: 25, h: 10 });
  add('egg_gold', 'Ovo Dourado', 'animal', 400, 'egg', ['#ffd23f', '#c08a1a'], { food: 1, e: 60, h: 25 });
  add('milk', 'Leite', 'animal', 125, 'milk', ['#f8f8ff', '#c8d0e0'], { food: 1, e: 40, h: 16 });
  add('milk_big', 'Leite Grande', 'animal', 190, 'milk', ['#f8f8ff', '#e8c870'], { food: 1, e: 70, h: 28 });
  add('wool', 'Lã', 'animal', 340, 'wool', ['#f4f0ea', '#c8c0b8']);
  add('mayo', 'Maionese', 'artesanato', 190, 'jar', ['#fff4c8', '#e8d898']);
  add('cheese', 'Queijo', 'artesanato', 230, 'cheese', ['#ffd24a', '#e8a020'], { food: 1, e: 50, h: 20 });
  add('cloth', 'Tecido', 'artesanato', 470, 'cloth', ['#e8c8f0', '#c090d0']);
  add('honey', 'Mel', 'artesanato', 100, 'jar', ['#ffc21a', '#c88a0a'], { food: 1, e: 30, h: 12 });
  add('juice', 'Suco', 'artesanato', 0, 'bottle', ['#f08a3a', '#ffd0a0'], { food: 1, d: 'Suco fresquinho. Valor depende da cultura.', gen: 'juice' });
  add('wine', 'Vinho', 'artesanato', 0, 'bottle', ['#8a2a5a', '#d070a0'], { food: 1, d: 'Envelhecido com paciência.', gen: 'wine' });
  add('pickles', 'Picles', 'artesanato', 0, 'jar', ['#6aa845', '#c8e8a0'], { food: 1, gen: 'pickles' });
  add('jam', 'Geleia', 'artesanato', 0, 'jar', ['#c8303a', '#ff8a8a'], { food: 1, gen: 'jam' });
  add('fertilizer', 'Fertilizante', 'recurso', 100, 'sack', ['#8a6a4a', '#c8a878'], { d: 'Melhora a qualidade das colheitas (+1 nível).' });
  add('fert2', 'Fertilizante Superior', 'recurso', 250, 'sack', ['#6a8a4a', '#a8d878'], { d: 'Melhora bastante a qualidade das colheitas.' });
  add('speedgro', 'Adubo Veloz', 'recurso', 100, 'sack', ['#4a98c8', '#a8e0f8'], { d: 'Acelera o crescimento das plantas em 10%.' });
  add('moss', 'Musgo Mágico', 'recurso', 150, 'sack', ['#3a9a5a', '#a8f0b8'], { d: 'Mantém o solo úmido sem regar (1 dia).' });

  /* ---------- máquinas / decoração / itens colocáveis ---------- */
  const place = (id, n, p, sh, d, o = {}) => add(id, n, 'colocável', p, sh, o.c || ['#b88049'], Object.assign({ place: id, d }, o));
  place('chest', 'Baú', 0, 'chest', 'Guarda 36 itens.');
  place('chest_big', 'Baú Grande', 0, 'chest', 'Guarda 70 itens.', { c: ['#4a7fc9'] });
  place('furnace', 'Fornalha', 0, 'm_furnace', 'Funde minérios em barras. Precisa de carvão.');
  place('keg', 'Barril de Fermentação', 0, 'm_keg', 'Transforma frutas em vinho e legumes em suco.');
  place('jar', 'Pote de Conservas', 0, 'm_jar', 'Transforma frutas em geleia e legumes em picles.');
  place('loom', 'Tear', 0, 'm_loom', 'Transforma lã em tecido.');
  place('press', 'Queijeira', 0, 'm_maker', 'Transforma leite em queijo.');
  place('mayomaker', 'Máquina de Maionese', 0, 'm_maker', 'Transforma ovos em maionese.');
  place('hive', 'Colmeia', 0, 'm_hive', 'Produz mel de tempos em tempos.');
  place('scarecrow', 'Espantalho', 0, 'm_scare', 'Protege plantações de corvos num raio de 8 tiles.');
  place('sprinkler', 'Aspersor', 0, 'm_sprk', 'Rega as 4 casas vizinhas toda manhã.');
  place('sprinkler2', 'Aspersor de Ferro', 0, 'm_sprk', 'Rega as 8 casas vizinhas toda manhã.', { c: ['#d8d2cc'] });
  place('torch', 'Tocha', 0, 'torch', 'Ilumina a noite.');
  place('fence', 'Cerca de Madeira', 0, 'fence', 'Delimita áreas. Pode ser recolhida com a Machado.');
  place('fence2', 'Cerca de Pedra', 0, 'fence', 'Mais resistente.', { c: ['#9aa0ad'] });
  place('path_wood', 'Piso de Madeira', 0, 'floor', 'Caminho de tábuas.', { c: ['#b88049'] });
  place('path_stone', 'Piso de Pedra', 0, 'floor', 'Caminho de pedras.', { c: ['#9d979a'] });
  place('bomb', 'Bomba', 0, 'bomb', 'Explode pedras em área. Cuidado!', { use: 'bomb' });
  place('lantern_deco', 'Lanterna Decorativa', 0, 'lamp', 'Ilumina o seu jardim.');
  place('flower_pot', 'Vaso de Flores', 0, 'pot', 'Alegra qualquer canto.');

  /* ---------- comidas (receitas) ---------- */
  const food = (id, n, p, sh, c, e, h, d, buff) => add(id, n, 'comida', p, sh, c, { food: 1, cooked: 1, e, h, d, buff });
  food('fried_egg', 'Ovo Frito', 35, 'plate', ['#fff', '#ffc21a'], 50, 20, 'Simples e saboroso.');
  food('omelet', 'Omelete', 125, 'plate', ['#ffd24a', '#e8a020'], 80, 32, 'Cremosa e macia.');
  food('salad', 'Salada Fresca', 110, 'bowl', ['#6fcf4a', '#e8453a'], 90, 36, 'Leve e crocante.');
  food('veg_soup', 'Sopa de Legumes', 140, 'bowl', ['#e8793a', '#6fcf4a'], 100, 42, 'Esquenta o coração.', { stat: 'def', val: 2, dur: 300 });
  food('pumpkin_soup', 'Sopa de Abóbora', 300, 'bowl', ['#e8821e', '#ffd0a0'], 140, 56, 'Cremosa e aconchegante.', { stat: 'luck', val: 1, dur: 400 });
  food('corn_bread', 'Pão de Milho', 90, 'bread', ['#f2c230', '#c8901a'], 70, 28, 'Dourado por fora.', { stat: 'spd', val: 1, dur: 300 });
  food('strawberry_pie', 'Torta de Morango', 260, 'cake', ['#e8302d', '#ffd0d0'], 120, 48, 'Doce e radiante.', { stat: 'luck', val: 2, dur: 400 });
  food('grilled_fish', 'Peixe Grelhado', 170, 'fish_plate', ['#e8a860', '#fff'], 110, 44, 'Crocante por fora.', { stat: 'fish', val: 1, dur: 400 });
  food('fish_stew', 'Ensopado de Peixe', 250, 'bowl', ['#c8804a', '#f8e0a8'], 150, 60, 'Um clássico da vila.', { stat: 'fish', val: 2, dur: 500 });
  food('cake', 'Bolo de Chocolate', 280, 'cake', ['#6a3a22', '#ffe8d0'], 100, 40, 'Todos amam bolo.', { stat: 'spd', val: 1, dur: 400 });
  food('cookie', 'Biscoito Amanteigado', 90, 'cookie', ['#d8a560', '#fff0c8'], 60, 24, 'Crocante e dourado.');
  food('berry_tart', 'Tortinha de Frutas', 220, 'cake', ['#7a3fa8', '#ffd0f0'], 110, 44, 'Frutas silvestres e massa.', { stat: 'mag', val: 1, dur: 400 });
  food('hearty_stew', 'Ensopado Reforçado', 320, 'bowl', ['#a06a3a', '#e8c880'], 180, 80, 'Para aventureiros.', { stat: 'atk', val: 3, dur: 500 });
  food('miner_snack', 'Lanche do Mineiro', 200, 'bread', ['#9a7a5a', '#e8d0a8'], 100, 40, 'Energia para o subsolo.', { stat: 'mine', val: 1, dur: 500 });
  food('lumi_tea', 'Chá Lúmen', 500, 'cup', ['#9fe8ff', '#ffffff'], 200, 90, 'Brilha suavemente.', { stat: 'lumi', val: 1, dur: 600 });
  food('farmer_lunch', 'Almoço do Fazendeiro', 300, 'plate', ['#e8793a', '#f2c230'], 160, 64, 'Para trabalhar o dia todo.', { stat: 'farm', val: 2, dur: 600 });
  food('forager_salad', 'Salada do Coletor', 150, 'bowl', ['#9ad07a', '#c8a070'], 100, 40, 'Direto do bosque.', { stat: 'forage', val: 1, dur: 500 });
  food('pancakes', 'Panquecas', 80, 'plate', ['#e8c88a', '#c88a4a'], 80, 32, 'Com mel é melhor.');
  food('hot_cocoa', 'Chocolate Quente', 110, 'cup', ['#6a3a22', '#fff'], 90, 36, 'Perfeito no inverno.', { stat: 'def', val: 1, dur: 400 });
  D.BUFFS = { def: 'Defesa', luck: 'Sorte', spd: 'Velocidade', fish: 'Pesca', mag: 'Imã', atk: 'Ataque', mine: 'Mineração', lumi: 'Brilho', farm: 'Agricultura', forage: 'Coleta' };

  /* ---------- presentes / especiais ---------- */
  add('bouquet', 'Buquê', 'especial', 500, 'bouquet', ['#ff6a9a', '#ffffff'], { d: 'Entregue a quem você quer namorar.', gift: 1 });
  add('pendant', 'Pingente Vaga-lume', 'especial', 5000, 'pendant', ['#ffe66a', '#ffffff'], { d: 'Peça em casamento a quem você ama.', gift: 1 });
  add('lumi_ring', 'Anel Lúmen', 'especial', 4000, 'ring', ['#ffe66a', '#ffffff'], { d: 'Aumenta o raio de luz e o ímã de itens.', ring: 'lumi' });
  add('ring_def', 'Anel de Ferro', 'especial', 800, 'ring', ['#d8d2cc', '#8a8490'], { d: '+3 de defesa.', ring: 'def' });
  add('ring_luck', 'Anel do Trevo', 'especial', 1000, 'ring', ['#6fcf4a', '#e8ffd0'], { d: '+2 de sorte.', ring: 'luck' });
  add('ring_atk', 'Anel Carmesim', 'especial', 1200, 'ring', ['#ff4a5e', '#ffb0ba'], { d: '+4 de ataque.', ring: 'atk' });
  add('ring_mag', 'Anel Magnético', 'especial', 900, 'ring', ['#4a7dff', '#b0c8ff'], { d: 'Atrai itens de longe.', ring: 'mag' });
  add('boots_leather', 'Botas de Couro', 'especial', 600, 'boots', ['#8a5a30'], { d: '+1 de defesa.', boots: 1 });
  add('recipe_book', 'Livro de Receitas', 'especial', 0, 'book', ['#c4473a'], {});
  add('lumi_crest', 'Brasão Lúmen', 'especial', 0, 'star', ['#ffe66a', '#fff'], { d: 'Prova de que Lumi confia em você.' });
  add('elevator', 'Chave da Mina', 'especial', 0, 'key', ['#ffd23f'], {});
  add('mystery_seed', 'Semente Misteriosa', 'semente', 1000, 'seed', ['#a85ad8', '#ffe66a'], { seed: 'estrelafruta', d: 'Uma semente cósmica.' });
  // sementes especiais de flor/verão podem ser achadas em baús de mato
  D.ITEMS = items;

  /* ---------- fabricação (artesanato) ---------- */
  // req: itens consumidos; unlock: nível de habilidade ou NPC friendship
  const R = (id, out, qty, req, o = {}) => ({ id, out, qty, req, ...o });
  D.CRAFT = [
    R('chest', 'chest', 1, { wood: 50 }),
    R('chest_big', 'chest_big', 1, { wood: 120, copper_bar: 2 }, { skill: ['farm', 3] }),
    R('furnace', 'furnace', 1, { copper_ore: 20, stone: 25 }),
    R('keg', 'keg', 1, { wood: 30, copper_bar: 1, iron_bar: 1 }, { skill: ['farm', 3] }),
    R('jar', 'jar', 1, { wood: 50, stone: 40, coal: 8 }, { skill: ['farm', 2] }),
    R('loom', 'loom', 1, { wood: 60, fiber: 30 }, { skill: ['farm', 4] }),
    R('press', 'press', 1, { wood: 45, stone: 10, copper_bar: 1 }, { skill: ['farm', 3] }),
    R('mayomaker', 'mayomaker', 1, { wood: 15, stone: 15, copper_bar: 1 }, { skill: ['farm', 2] }),
    R('hive', 'hive', 1, { wood: 40, coal: 8, iron_bar: 1 }, { skill: ['forage', 3] }),
    R('scarecrow', 'scarecrow', 1, { wood: 50, coal: 1, fiber: 20 }),
    R('sprinkler', 'sprinkler', 1, { copper_bar: 1, iron_bar: 1 }, { skill: ['farm', 2] }),
    R('sprinkler2', 'sprinkler2', 1, { iron_bar: 1, gold_bar: 1, quartz: 1 }, { skill: ['farm', 5] }),
    R('fence', 'fence', 10, { wood: 20 }),
    R('fence2', 'fence2', 10, { stone: 20 }, { skill: ['farm', 1] }),
    R('torch', 'torch', 4, { wood: 2, sap: 2 }),
    R('path_wood', 'path_wood', 10, { wood: 1 }),
    R('path_stone', 'path_stone', 10, { stone: 1 }),
    R('bomb', 'bomb', 2, { iron_ore: 1, coal: 1 }, { skill: ['mine', 3] }),
    R('fertilizer', 'fertilizer', 2, { sap: 5, fiber: 5 }),
    R('fert2', 'fert2', 2, { sap: 5, fertilizer: 1, quartz: 1 }, { skill: ['farm', 5] }),
    R('speedgro', 'speedgro', 2, { clay: 1, fiber: 5 }, { skill: ['farm', 3] }),
    R('moss', 'moss', 2, { fiber: 20, sap: 8 }, { skill: ['forage', 2] }),
    R('bait', 'bait', 5, { fiber: 3, sap: 1 }, { skill: ['fish', 1] }),
    R('lure', 'lure', 3, { copper_bar: 1, fiber: 4 }, { skill: ['fish', 4] }),
    R('lantern_deco', 'lantern_deco', 1, { wood: 10, iron_bar: 1, coal: 2 }),
    R('flower_pot', 'flower_pot', 1, { clay: 3, stone: 2 }),
  ];

  /* ---------- culinária ---------- */
  D.COOK = [
    { id: 'fried_egg', out: 'fried_egg', any: [], req: { egg: 1 }, start: 1 },
    { id: 'pancakes', out: 'pancakes', req: { egg: 1, milk: 1 }, start: 1 },
    { id: 'salad', out: 'salad', req: { _veg: 2 }, start: 1 },
    { id: 'omelet', out: 'omelet', req: { egg: 1, milk: 1, _veg: 1 }, npc: ['cora', 2] },
    { id: 'veg_soup', out: 'veg_soup', req: { _veg: 3 }, start: 1 },
    { id: 'corn_bread', out: 'corn_bread', req: { milho: 1, egg: 1 }, npc: ['cora', 3] },
    { id: 'pumpkin_soup', out: 'pumpkin_soup', req: { abobora: 1, milk: 1 }, npc: ['cora', 5] },
    { id: 'strawberry_pie', out: 'strawberry_pie', req: { morango: 3, egg: 1, milk: 1 }, npc: ['cora', 4] },
    { id: 'grilled_fish', out: 'grilled_fish', req: { _fish: 1, coal: 1 }, npc: ['nina', 2] },
    { id: 'fish_stew', out: 'fish_stew', req: { _fish: 2, _veg: 1 }, npc: ['nina', 5] },
    { id: 'cake', out: 'cake', req: { egg: 2, milk: 1, fiber: 1 }, npc: ['cora', 6] },
    { id: 'cookie', out: 'cookie', req: { egg: 1, milk: 1 }, npc: ['luna', 3] },
    { id: 'berry_tart', out: 'berry_tart', req: { _berry: 3, egg: 1 }, npc: ['luna', 4] },
    { id: 'hearty_stew', out: 'hearty_stew', req: { _veg: 2, egg: 1, coal: 1 }, npc: ['caio', 5] },
    { id: 'miner_snack', out: 'miner_snack', req: { cheese: 1, chestnut: 2 }, npc: ['tomas', 3] },
    { id: 'lumi_tea', out: 'lumi_tea', req: { lumi_blossom: 1, honey: 1 }, skill: ['forage', 6] },
    { id: 'farmer_lunch', out: 'farmer_lunch', req: { egg: 2, _veg: 2 }, skill: ['farm', 4] },
    { id: 'forager_salad', out: 'forager_salad', req: { wild_garlic: 1, dandelion: 1, mushroom: 1 }, skill: ['forage', 2] },
    { id: 'hot_cocoa', out: 'hot_cocoa', req: { milk: 1, honey: 1 }, npc: ['marina', 3] },
  ];
  // grupos genéricos para ingredientes
  D.ING = {
    _veg: id => { const c = crops[id]; return !!c && !c.flower && !['mirtilo', 'morango', 'uva', 'cranberry'].includes(id) && id !== 'estrelafruta'; },
    _fish: id => !!fishes[id],
    _berry: id => ['berry_wild', 'morango', 'mirtilo', 'cranberry', 'grape_wild', 'spice_berry'].includes(id),
  };
  D.ING_NAME = { _veg: 'Legume qualquer', _fish: 'Peixe qualquer', _berry: 'Fruta silvestre' };

  /* ---------- processamento das máquinas ---------- */
  const isFruit = id => ['morango', 'mirtilo', 'uva', 'cranberry', 'berry_wild', 'grape_wild', 'spice_berry', 'melao', 'tomate'].includes(id);
  D.MACHINES = {
    furnace: { n: 'Fornalha', recipes: [
      { in: 'copper_ore', n: 5, out: 'copper_bar', fuel: 1, t: 30 }, { in: 'iron_ore', n: 5, out: 'iron_bar', fuel: 1, t: 120 }, { in: 'gold_ore', n: 5, out: 'gold_bar', fuel: 1, t: 300 },
      { in: 'quartz', n: 1, out: 'lumi_shard', fuel: 1, t: 90, chance: 0.15 }] },
    keg: { n: 'Barril de Fermentação', dynamic: true, fn: it => {
      const c = crops[it]; if (!c || c.flower) return null;
      if (isFruit(it)) return { out: 'wine', from: it, t: 6 * 60 * 24 / 24 * 4, mult: 3 };
      return { out: 'juice', from: it, t: 4 * 60, mult: 2.25 };
    } },
    jar: { n: 'Pote de Conservas', dynamic: true, fn: it => {
      const c = crops[it]; if (!c || c.flower) return null;
      if (isFruit(it)) return { out: 'jam', from: it, t: 3 * 60, mult: 2 };
      return { out: 'pickles', from: it, t: 3 * 60, mult: 2 };
    } },
    loom: { n: 'Tear', recipes: [{ in: 'wool', n: 1, out: 'cloth', t: 60 }] },
    press: { n: 'Queijeira', recipes: [{ in: 'milk', n: 1, out: 'cheese', t: 180 }, { in: 'milk_big', n: 1, out: 'cheese', t: 180, qty: 2 }] },
    mayomaker: { n: 'Máquina de Maionese', recipes: [{ in: 'egg', n: 1, out: 'mayo', t: 180 }, { in: 'egg_brown', n: 1, out: 'mayo', t: 180 }, { in: 'egg_gold', n: 1, out: 'mayo', t: 180, qty: 3 }] },
  };

  /* ---------- lojas ---------- */
  D.SHOPS = {
    seeds: season => {
      const list = [];
      for (const id in crops) { const c = crops[id]; if (id === 'estrelafruta') continue; if (c.seasons.includes(season)) list.push({ item: 'seed_' + id, price: c.sp }); }
      return list.concat([{ item: 'fertilizer', price: 100 }, { item: 'speedgro', price: 120 }, { item: 'bait', price: 6 }, { item: 'hay', price: 40 }]);
    },
    general: () => [{ item: 'wood', price: 12 }, { item: 'stone', price: 12 }, { item: 'coal', price: 100 }, { item: 'fiber', price: 6 }, { item: 'torch', price: 15 }, { item: 'fence', price: 20 }, { item: 'path_wood', price: 4 }, { item: 'chest', price: 300 }, { item: 'sprinkler', price: 1200 }, { item: 'scarecrow', price: 900 }],
    fish: () => [{ item: 'bait', price: 5 }, { item: 'lure', price: 90 }, { item: 'rod_buy', price: 500, virt: 'rod2' }],
    guild: () => [{ item: 'sword_steel', price: 800 }, { item: 'club', price: 1500 }, { item: 'sword_lumi', price: 3000 }, { item: 'bomb', price: 150 }, { item: 'ring_def', price: 800 }, { item: 'ring_atk', price: 1200 }, { item: 'ring_luck', price: 1000 }, { item: 'ring_mag', price: 900 }, { item: 'boots_leather', price: 600 }],
    diner: () => [{ item: 'salad', price: 220 }, { item: 'omelet', price: 250 }, { item: 'grilled_fish', price: 340 }, { item: 'cake', price: 560 }, { item: 'hot_cocoa', price: 220 }, { item: 'cookie', price: 180 }],
    clinic: () => [{ item: 'veg_soup', price: 280 }],
    flowers: () => [{ item: 'bouquet', price: 500 }, { item: 'seed_tulipa', price: 20 }, { item: 'seed_girassol', price: 100 }, { item: 'flower_pot', price: 120 }],
    animals: () => [],
  };
  D.ANIMALS = {
    chicken: { n: 'Galinha', price: 800, home: 'coop', prod: ['egg', 'egg_brown'], gold: 'egg_gold' },
    chicken_brown: { n: 'Galinha Marrom', price: 800, home: 'coop', prod: ['egg_brown'], gold: 'egg_gold' },
    cow: { n: 'Vaca', price: 1500, home: 'barn', prod: ['milk'], big: 'milk_big' },
    sheep: { n: 'Ovelha', price: 2500, home: 'barn', prod: ['wool'] },
  };
  D.BUILD = {
    coop: { n: 'Galinheiro', wood: 300, stone: 100, gold: 4000, days: 2, cap: 4, d: 'Abriga até 4 aves.' },
    barn: { n: 'Celeiro', wood: 450, stone: 150, gold: 6000, days: 2, cap: 4, d: 'Abriga até 4 animais grandes.' },
    silo: { n: 'Silo', wood: 100, stone: 100, gold: 100, days: 1, d: 'Armazena feno para os animais.' },
    well: { n: 'Poço Dourado', wood: 0, stone: 100, gold: 1000, days: 1, d: 'Água fresca para regar sem sair da fazenda.' },
  };
  D.UPGRADE_COST = [{ gold: 500, bar: 'copper_bar', n: 5 }, { gold: 1500, bar: 'iron_bar', n: 5 }, { gold: 5000, bar: 'gold_bar', n: 5 }];
  D.HOUSE_UP = [{ n: 'Cozinha Completa', gold: 10000, wood: 450 }, { n: 'Quarto das Crianças', gold: 65000, wood: 100 }];

  /* ---------- habilidades ---------- */
  D.SKILLS = {
    farm: { n: 'Agricultura', col: '#7ec850', perks: ['+10% de chance de colheita Prata', 'Receitas de Pote e Maionese', 'Barris e Queijeira', 'Tear e Adubo Veloz', 'Aspersor de Ferro', '+1 de colheita extra (10%)', 'Almoço do Fazendeiro', 'Venda de frutas mais valiosa', 'Cultivos de Ouro mais comuns', 'Mestre do Campo'] },
    mine: { n: 'Mineração', col: '#b0a8d0', perks: ['Picareta gasta menos energia', 'Pedras dão mais minério', 'Mais carvão', 'Bombas', 'Brilho de gemas', 'Menos energia na mina', 'Minérios dobrados (10%)', 'Gemas raras', 'Mais geodos', 'Mestre Mineiro'] },
    forage: { n: 'Coleta', col: '#e8a53a', perks: ['Machado gasta menos energia', 'Musgo Mágico', 'Colmeias', 'Seiva extra', 'Coleta em Ouro mais comum', 'Salada do Coletor e Chá', 'Madeira dobrada (10%)', 'Tesouros no mato', 'Árvores caem mais rápido', 'Mestre Coletor'] },
    fish: { n: 'Pesca', col: '#4a9ad8', perks: ['Isca simples', 'Barra de pesca maior', 'Peixes mordem mais rápido', 'Isca Brilhante', 'Peixes de Ouro mais comuns', 'Barra ainda maior', 'Tesouros ao pescar', 'Lixo raro some', 'Peixes raros mais comuns', 'Mestre Pescador'] },
    combat: { n: 'Combate', col: '#e8453a', perks: ['+2 de ataque', '+10 de vida', '+3 de defesa', '+10 de vida', '+3 de ataque', 'Críticos mais fortes', '+15 de vida', 'Cura ao matar (10%)', '+4 de ataque', 'Mestre Guerreiro'] },
  };
  D.XP_LEVELS = [0, 100, 280, 550, 900, 1400, 2100, 3000, 4200, 6000, 99999];

  /* ---------- helpers ---------- */
  D.sellPrice = (inst) => {
    const it = items[inst.id]; if (!it) return 0;
    let base = it.p;
    if (it.gen && inst.from) { const c = crops[inst.from]; const f = items[inst.from]; const mult = { juice: 2.25, wine: 3, pickles: 2, jam: 2 }[it.gen]; base = Math.floor(((c ? c.p : f ? f.p : 20)) * mult) + (it.gen === 'wine' ? 0 : 50); }
    return Math.floor(base * D.QMULT[inst.q || 0]);
  };
  D.itemName = (inst) => {
    const it = items[inst.id]; if (!it) return inst.id;
    if (it.gen && inst.from) { const f = items[inst.from]; const nm = f ? f.n : ''; return ({ juice: 'Suco de ', wine: 'Vinho de ', pickles: 'Picles de ', jam: 'Geleia de ' })[it.gen] + nm; }
    return it.n;
  };
})();
