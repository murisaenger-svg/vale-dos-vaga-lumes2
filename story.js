'use strict';
/* ============================================================
   Narrativa e progressão: missões, ofertas do Lanternário,
   conquistas, cartas, festivais e dicas.
   ============================================================ */
VV.Data.Story = (() => {
  /* ---------- missões principais e secundárias ----------
     goal: {type, ...}  tipos: have(id,n) | sell | talk(npc) | reach(mapa) | skill | build | flag | kill(n) | catch(n) | harvest(n)
  */
  const quests = [
    { id: 'q_start', main: 1, title: 'O Legado da Vovó', desc: 'Explore a fazenda, converse com Lumi e comece a limpar o terreno.', goal: { type: 'flag', flag: 'metLumi' }, reward: { gold: 100 }, next: 'q_clear' },
    { id: 'q_clear', main: 1, title: 'Terreno Limpo', desc: 'Corte 10 pedaços de mato ou madeira da fazenda para abrir espaço.', goal: { type: 'have', id: 'fiber', n: 10 }, reward: { gold: 150 }, next: 'q_plant' },
    { id: 'q_plant', main: 1, title: 'Primeiras Sementes', desc: 'Use a Enxada e plante 5 sementes de qualquer tipo.', goal: { type: 'stat', stat: 'planted', n: 5 }, reward: { items: [['seed_nabo', 5], ['fertilizer', 2]] }, next: 'q_village' },
    { id: 'q_village', main: 1, title: 'Conhecendo a Vila', desc: 'Vá até a Vila Luzerna e fale com o Prefeito Zé.', goal: { type: 'talk', npc: 'ze' }, reward: { gold: 200 }, next: 'q_bin' },
    { id: 'q_bin', main: 1, title: 'Primeira Colheita', desc: 'Colha e venda 3 culturas (no caixote de envio ou no Mercado).', goal: { type: 'stat', stat: 'cropsSold', n: 3 }, reward: { gold: 300 }, next: 'q_mine' },
    { id: 'q_mine', main: 1, title: 'Descendo o Vale', desc: 'Suba até a Montanha e entre na mina. Alcance o 5º andar.', goal: { type: 'stat', stat: 'mineDepth', n: 5 }, reward: { items: [['bomb', 3]] }, next: 'q_light' },
    { id: 'q_light', main: 1, title: 'A Primeira Luz', desc: 'Entregue a primeira oferta de Lumi no Lanternário.', goal: { type: 'flag', flag: 'bundle1' }, reward: { gold: 500 }, next: 'q_fish' },
    { id: 'q_fish', main: 1, title: 'Primeiro Peixe', desc: 'Compre uma vara com a Nina (já tem uma!) e pesque 3 peixes.', goal: { type: 'stat', stat: 'fishCaught', n: 3 }, reward: { items: [['bait', 20]] }, next: 'q_animals' },
    { id: 'q_animals', main: 1, title: 'Vida na Fazenda', desc: 'Peça ao Seu Ney para construir um Galinheiro e compre uma galinha.', goal: { type: 'flag', flag: 'hasAnimal' }, reward: { gold: 400 }, next: 'q_deep' },
    { id: 'q_deep', main: 1, title: 'Fundo do Poço', desc: 'Chegue ao 20º andar da mina.', goal: { type: 'stat', stat: 'mineDepth', n: 20 }, reward: { items: [['ring_def', 1]] }, next: 'q_golem' },
    { id: 'q_golem', main: 1, title: 'O Guardião de Cristal', desc: 'Derrote o Golem de Cristal no 30º andar da mina.', goal: { type: 'flag', flag: 'golemSlain' }, reward: { gold: 3000, items: [['crystal_core', 1]] }, next: 'q_restore' },
    { id: 'q_restore', main: 1, title: 'O Retorno dos Vaga-lumes', desc: 'Restaure todas as seis salas do Lanternário.', goal: { type: 'flag', flag: 'lanternarioDone' }, reward: { gold: 10000 }, next: null },
  ];

  /* ---------- Lanternário: 6 ofertas (cada uma uma sala) ---------- */
  const bundles = [
    { id: 'b_colheita', name: 'Sala da Colheita', color: '#7ec850', reward: { text: 'Estufa restaurada: cultive em qualquer estação!', flag: 'greenhouse' }, items: [{ any: ['nabo', 'alho', 'batata', 'couveflor'], n: 1 }, { any: ['tomate', 'pimenta', 'rabanete', 'melao'], n: 1 }, { any: ['abobora', 'berinjela', 'batatadoce', 'amaranto'], n: 1 }, { any: ['raizgelada', 'repolhoroxo'], n: 1 }, { any: ['milho', 'girassol'], n: 1 }, { any: ['morango', 'mirtilo', 'uva', 'cranberry'], n: 1 }] },
    { id: 'b_riacho', name: 'Sala do Riacho', color: '#4a9ad8', reward: { text: 'Barco de Nina disponível: pesque em alto-mar.', flag: 'boat' }, items: [{ any: ['carpa', 'perca', 'tilapia'], n: 1 }, { any: ['truta', 'salmao', 'bagre'], n: 1 }, { any: ['sardinha', 'cavala', 'atum'], n: 1 }, { any: ['polvo', 'baiacu', 'enguia'], n: 1 }, { any: ['lanterna', 'cego', 'gelo', 'lucio'], n: 1 }] },
    { id: 'b_mina', name: 'Sala da Mina', color: '#b0a8d0', reward: { text: 'Atalho da mina: elevador a cada 10 andares.', flag: 'elevator' }, items: [{ any: ['copper_bar'], n: 5 }, { any: ['iron_bar'], n: 5 }, { any: ['gold_bar'], n: 3 }, { any: ['quartz', 'amethyst', 'topaz'], n: 3 }, { any: ['emerald', 'ruby', 'sapphire'], n: 1 }] },
    { id: 'b_bosque', name: 'Sala do Bosque', color: '#e8a53a', reward: { text: 'Receita: Chá Lúmen e +25% de coleta.', flag: 'forageBoost' }, items: [{ any: ['wild_garlic', 'dandelion', 'daffodil', 'fiddlehead'], n: 1 }, { any: ['berry_wild', 'grape_wild', 'spice_berry'], n: 1 }, { any: ['mushroom', 'mushroom_red'], n: 1 }, { any: ['chestnut', 'hazelnut'], n: 1 }, { any: ['winter_root', 'snow_yam', 'holly', 'crystal_fruit'], n: 1 }, { any: ['lumi_blossom'], n: 1 }] },
    { id: 'b_fazenda', name: 'Sala da Fazenda', color: '#e8c36a', reward: { text: 'Todos os animais ficam mais felizes. Produção +10%.', flag: 'animalBoost' }, items: [{ any: ['egg', 'egg_brown'], n: 2 }, { any: ['milk', 'milk_big'], n: 1 }, { any: ['wool'], n: 1 }, { any: ['honey'], n: 1 }, { any: ['cheese', 'mayo', 'cloth'], n: 1 }] },
    { id: 'b_vila', name: 'Sala da Vila', color: '#ff7aa6', reward: { text: 'O Lanternário acende. Os vaga-lumes retornam!', flag: 'lanternarioDone' }, items: [{ any: ['wine', 'juice'], n: 1 }, { any: ['jam', 'pickles'], n: 1 }, { any: ['pumpkin_soup', 'strawberry_pie', 'cake', 'fish_stew'], n: 1 }, { any: ['bouquet'], n: 1 }, { any: ['lumi_shard', 'diamond'], n: 1 }] },
  ];

  /* ---------- missões da vila (quadro de avisos) ---------- */
  const requests = [
    { npc: 'cora', text: 'Preciso de 3 ovos para a torta de hoje.', need: [['egg', 3]], reward: { gold: 300 } },
    { npc: 'cora', text: 'Trouxe cogumelos? Preciso de 2 para o refogado.', need: [['mushroom', 2]], reward: { gold: 250 } },
    { npc: 'beto', text: 'Meu estoque de feno acabou. Traz 10?', need: [['hay', 10]], reward: { gold: 300 } },
    { npc: 'tomas', text: 'Preciso de 3 barras de cobre para um pedido.', need: [['copper_bar', 3]], reward: { gold: 400 } },
    { npc: 'nina', text: 'Quero uma carpa fresquinha para o almoço.', need: [['carpa', 1]], reward: { gold: 150 } },
    { npc: 'nina', text: 'Tragam-me um Peixe-Lanterna. Só pra olhar.', need: [['lanterna', 1]], reward: { gold: 600 } },
    { npc: 'luna', text: 'Cinco tulipas para um casamento!', need: [['tulipa', 5]], reward: { gold: 350 } },
    { npc: 'iris', text: 'Preciso de ervas: 3 alhos-selvagens.', need: [['wild_garlic', 3]], reward: { gold: 200 } },
    { npc: 'ney', text: 'Estou sem tábuas! Preciso de 50 madeiras.', need: [['wood', 50]], reward: { gold: 350 } },
    { npc: 'caio', text: 'Quero 2 rubis. Para... uma coisa.', need: [['ruby', 2]], reward: { gold: 700 } },
    { npc: 'marina', text: 'Uma ametista para meu pigmento!', need: [['amethyst', 1]], reward: { gold: 280 } },
    { npc: 'rafa', text: 'Traga mel! Minha voz precisa.', need: [['honey', 1]], reward: { gold: 220 } },
    { npc: 'ze', text: 'Quero provar o vinho de uma uva sua.', need: [['wine', 1]], reward: { gold: 600 } },
    { npc: 'lia', text: 'Quero 1 ovo dourado! Para mostrar na escola!', need: [['egg_gold', 1]], reward: { gold: 800 } },
    { npc: 'beto', text: 'Estou sem abóboras. Preciso de 2.', need: [['abobora', 2]], reward: { gold: 800 } },
    { npc: 'cora', text: 'Preciso de 5 morangos para uma encomenda.', need: [['morango', 5]], reward: { gold: 700 } },
  ];

  /* ---------- conquistas ---------- */
  const achievements = [
    { id: 'a_first', n: 'Pé na Terra', d: 'Plante sua primeira semente.', stat: 'planted', v: 1 },
    { id: 'a_harvest', n: 'Mão na Massa', d: 'Colha 100 culturas.', stat: 'harvested', v: 100 },
    { id: 'a_rich', n: 'Cofrinho', d: 'Acumule 50.000G.', stat: 'earned', v: 50000 },
    { id: 'a_millionaire', n: 'Magnata do Vale', d: 'Ganhe 1.000.000G no total.', stat: 'earned', v: 1000000 },
    { id: 'a_fish', n: 'Mestre das Águas', d: 'Pesque 100 peixes.', stat: 'fishCaught', v: 100 },
    { id: 'a_legend', n: 'Lenda do Lago', d: 'Pesque um peixe lendário.', stat: 'legends', v: 1 },
    { id: 'a_mine', n: 'Fundo do Mundo', d: 'Alcance o andar 30 da mina.', stat: 'mineDepth', v: 30 },
    { id: 'a_slayer', n: 'Caçador de Monstros', d: 'Derrote 200 monstros.', stat: 'kills', v: 200 },
    { id: 'a_cook', n: 'Chef do Vale', d: 'Cozinhe 20 pratos.', stat: 'cooked', v: 20 },
    { id: 'a_craft', n: 'Mãos de Ouro', d: 'Fabrique 50 itens.', stat: 'crafted', v: 50 },
    { id: 'a_friend', n: 'Coração do Vale', d: 'Alcance 8 corações com 5 pessoas.', stat: 'bestFriends', v: 5 },
    { id: 'a_marry', n: 'Para Sempre', d: 'Case-se com alguém do vale.', stat: 'married', v: 1 },
    { id: 'a_light', n: 'Luz do Vale', d: 'Restaure o Lanternário.', stat: 'lanternario', v: 1 },
    { id: 'a_skill', n: 'Especialista', d: 'Alcance o nível 10 em uma habilidade.', stat: 'maxSkill', v: 10 },
    { id: 'a_animals', n: 'Fazendeiro de Verdade', d: 'Tenha 8 animais.', stat: 'animals', v: 8 },
    { id: 'a_gift', n: 'Generoso', d: 'Dê 30 presentes.', stat: 'gifts', v: 30 },
    { id: 'a_days', n: 'Veterano', d: 'Jogue por 112 dias (1 ano).', stat: 'days', v: 112 },
    { id: 'a_collect', n: 'Colecionador', d: 'Registre 60 itens diferentes.', stat: 'collected', v: 60 },
  ];

  /* ---------- festivais (dia fixo por estação) ---------- */
  const festivals = [
    { s: 0, d: 13, name: 'Festa das Flores', desc: 'A vila inteira se reúne para celebrar a primavera. Dê flores aos amigos!', gift: ['bouquet', 1] },
    { s: 1, d: 11, name: 'Festival do Mar', desc: 'Concurso de pesca na praia! O vencedor ganha um prêmio.', fish: true },
    { s: 2, d: 16, name: 'Feira da Colheita', desc: 'Exponha suas melhores colheitas. Prêmio por qualidade!', fair: true },
    { s: 3, d: 25, name: 'Festa das Lanternas', desc: 'A noite mais mágica do ano. Todos acendem lanternas no vale.', lanterns: true },
  ];

  /* ---------- diálogos de Lumi, o espírito do vale ---------- */
  const lumi = {
    intro: [
      'Lumi: ...Ei. Você pode me ver?',
      'Lumi: Meu nome é Lumi. Sou o espírito dos vaga-lumes deste vale. Ou o que sobrou dele.',
      'Lumi: Faz muito tempo que ninguém me enxerga. A Alba conseguia. Ela dizia que eu era a menor luz do mundo.',
      'Lumi: O vale ficou escuro depois que ela partiu. Os meus irmãos foram embora, um a um.',
      'Lumi: Mas você chegou... e eu sinto a mesma luz que ela tinha.',
      'Lumi: Cuide da fazenda. Visite o Lanternário. Se o vale voltar a brilhar, os vaga-lumes também voltam.',
      'Lumi: Estarei por aqui, principalmente à noite. Boa sorte, fazendeiro!',
    ],
    tips: [
      'Lumi: Use a Enxada na grama para preparar o solo e depois plante as sementes.',
      'Lumi: Regue todos os dias. As plantas crescem enquanto você dorme!',
      'Lumi: Fale com todos na vila. Um presente por dia faz milagres.',
      'Lumi: A mina fica na Montanha. Leve comida e uma espada!',
      'Lumi: Cada pedaço de energia conta. Durma antes das 2h da manhã.',
      'Lumi: O Lanternário aceita ofertas de todo o vale. É assim que a luz volta.',
      'Lumi: Aos poucos, mais vaga-lumes aparecem à noite. É assim que sei que estamos indo bem.',
    ],
    final: [
      'Lumi: ...',
      'Lumi: Você viu? Eles voltaram. Todos eles.',
      'Lumi: Obrigado. Por tudo. A Alba estaria orgulhosa.',
      'Lumi: O vale nunca mais ficará escuro. E eu... nunca mais ficarei sozinho.',
    ],
  };

  const letters = [
    { id: 'l_alba', day: 1, from: 'Vovó Alba', title: 'Uma Carta para Você', text: 'Querido(a),\n\nSe você está lendo isto, a fazenda agora é sua. Não é muito: terra cansada, ferramentas velhas e uma cabana que range.\n\nMas há uma coisa que nunca contei: este vale tem magia. Basta ter paciência, cuidar da terra e das pessoas.\n\nProcure o Zé na vila. E se vir uma luzinha à noite... diga olá.\n\nCom todo meu amor,\nAlba' },
    { id: 'l_beto', day: 8, from: 'Beto', title: 'Promoção!', text: 'Prezado fazendeiro,\n\nVenha ao Mercado Luzerna! Sementes fresquinhas todas as manhãs.\n\nAssinado, Beto.' },
    { id: 'l_cora', day: 15, from: 'Cora', title: 'Convite', text: 'Passe na cantina! Estou com um cardápio novo. E a Lia pergunta de você todo dia.\n\nCora' },
    { id: 'l_ney', day: 20, from: 'Seu Ney', title: 'Obras', text: 'Fazendeiro,\n\nSe quiser construir algo, passe na oficina. Madeira, pedra e ouro. Simples assim.\n\nNey' },
    { id: 'l_tomas', day: 25, from: 'Tomás', title: '...', text: 'Ferramentas melhores na forja.\n\nTomás' },
  ];

  const tips = [
    'Dica: segure Shift para correr (gasta energia).',
    'Dica: dormir antes da meia-noite recupera toda a energia.',
    'Dica: presentes preferidos rendem muito mais amizade.',
    'Dica: peixes mordem mais à noite e na chuva.',
    'Dica: guarde sementes da próxima estação.',
    'Dica: bombas quebram muitas pedras de uma vez.',
    'Dica: culturas que rebrotam rendem mais a longo prazo.',
    'Dica: use fertilizante para colheitas de qualidade superior.',
    'Dica: o Pote de Conservas é rápido; o Barril rende mais valor.',
    'Dica: animais felizes produzem mais e melhor.',
    'Dica: os elevadores da mina só funcionam depois da Sala da Mina.',
    'Dica: comida dá bônus temporários. Cozinhe antes de explorar.',
  ];

  return { quests, bundles, requests, achievements, festivals, lumi, letters, tips };
})();
