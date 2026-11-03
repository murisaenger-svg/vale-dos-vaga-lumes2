'use strict';
/* ============================================================
   NPCs da Vila Luzerna: aparência, rotina, gostos, diálogos e cenas.
   Rotina: [hhmm, 'mapa.ponto', rótulo?]. Os pontos são definidos em maps.js
   ============================================================ */
VV.Data.NPCS = (() => {
  const N = {};
  const npc = (id, o) => { N[id] = Object.assign({ id, romance: false, loves: [], likes: [], hates: [], lines: {}, stories: [] }, o); };

  npc('ze', {
    name: 'Vovô Zé', role: 'Prefeito & Guardião do Lanternário', bday: [1, 8], romance: false,
    look: { skin: 1, hair: '#d9d9e0', style: 'curto', shirt: '#6a8a5a', pants: '#5a4a3a', beard: '#d9d9e0', glasses: '#4a3a2a', hat: 'straw', hatColor: '#d8b868' },
    bio: 'Amigo antigo da Vovó Alba. Cuida do Lanternário, a velha torre onde os vaga-lumes se reuniam.',
    loves: ['honey', 'wine', 'lumi_blossom', 'pumpkin_soup'], likes: ['@crop', '@cooked', 'cheese'], hates: ['@trash', 'bomb'],
    sched: { wk: [['0630', 'hall.desk'], ['1200', 'diner.table1'], ['1330', 'hall.desk'], ['1730', 'town.bench1'], ['2000', 'hall.bed']], we: [['0800', 'town.fountain'], ['1200', 'diner.table1'], ['1500', 'town.bench1'], ['1900', 'hall.bed']], rain: [['0700', 'hall.desk'], ['2000', 'hall.bed']] },
    lines: {
      intro: ['Ora, ora! Você deve ser o novo dono da fazenda da Alba. Sou o Zé, prefeito, guardião do Lanternário... e velho demais para ficar de pé tanto tempo!', 'Sua avó era a pessoa mais teimosa e gentil que conheci. Cuide bem do vale, ouviu?'],
      low: ['Os vaga-lumes sumiram do vale há uns anos. Foi estranho... como se a luz tivesse ido embora.', 'O Lanternário está em ruínas, mas ainda guarda algo especial.', 'A fazenda da Alba sempre produziu os melhores nabos da região.'],
      mid: ['Você está fazendo a Alba orgulhosa, sabia? Eu sinto isso.', 'Já reparou como à noite o vale ficou menos escuro? Acho que Lumi gosta de você.', 'Eu jogava xadrez com a sua avó toda quinta. Ela trapaceava!'],
      high: ['Você me lembra tanto ela... Obrigado por trazer vida de volta ao vale.', 'Se um dia os vaga-lumes voltarem, quero estar na torre para ver. Prometa que me chamará.'],
      rain: ['Chuva é bênção. Meus joelhos que o digam!', 'Dia bom para ficar em casa com chá e boas lembranças.'],
      s0: ['Primavera! A terra acorda e o coração também.'], s1: ['Verão... lembro de acampar no vale com a Alba, contando estrelas.'], s2: ['As folhas douradas me lembram o cabelo da Alba quando jovem.'], s3: ['O inverno é longo, mas a Festa das Lanternas aquece qualquer alma.'],
    },
    stories: [
      { h: 2, lines: ['Zé: Venha cá. Quero lhe mostrar uma coisa.', 'Zé: Esta é uma antiga lanterna do Lanternário. Há muito tempo ela brilhava sozinha.', 'Zé: Dizem que só se acende quando há gratidão genuína no vale. Ainda não funcionou comigo...', 'Zé: Talvez funcione com você. Guarde isto.'], gift: ['wood', 20] },
      { h: 6, lines: ['Zé: Alba me pediu uma coisa antes de partir.', 'Zé: Pediu que eu te entregasse isto quando você estivesse pronto. Acho que chegou a hora.', 'Zé: É o Brasão Lúmen. Com ele, Lumi te reconhecerá como Guardião do Vale.'], gift: ['lumi_crest', 1] },
    ],
  });

  npc('beto', {
    name: 'Beto', role: 'Dono do Mercado Luzerna', bday: [0, 12],
    look: { skin: 3, hair: '#2b1c16', style: 'curto', shirt: '#4a7fc9', pants: '#5a5a6a', apron: '#f0ece4', beard: '#2b1c16' },
    bio: 'Vende de tudo um pouco e sabe de todas as fofocas da vila.',
    loves: ['cheese', 'cake', 'wine'], likes: ['@crop', 'egg', 'milk'], hates: ['@trash', 'clay'],
    sched: { wk: [['0800', 'shop.counter'], ['1200', 'diner.table2'], ['1300', 'shop.counter'], ['1800', 'town.bench2'], ['2000', 'shop.bed']], we: [['0900', 'shop.counter'], ['1700', 'town.market'], ['2000', 'shop.bed']], rain: [['0800', 'shop.counter'], ['2000', 'shop.bed']] },
    lines: {
      intro: ['Bem-vindo ao Mercado Luzerna! Sementes frescas, ferramentas boas, preços honestos... na maior parte do tempo.', 'Qualquer coisa que a fazenda produzir, eu compro. Ou deixe no caixote de envio, que pagamos de manhã.'],
      low: ['Bom dia! Já viu as sementes da estação?', 'Os negócios estão devagar, mas sempre há o que vender.', 'Não vendo fiado, mas aceito pagamento em queijo.'],
      mid: ['Você tem talento para negócios, sabia? Cuidado, vou querer contratá-lo.', 'Soube que você anda minerando. Traga-me cobre!', 'O Tomás diz que você tem mão boa com a picareta.'],
      high: ['Sinto que posso confiar em você como amigo, não só cliente.', 'Prometo: no próximo ano, desconto para você nas sementes. Não conte a ninguém!'],
      rain: ['Em dia de chuva só entra freguês molhado e ninguém compra nada...'],
      s0: ['Primavera é a minha época favorita. Muita semente para vender!'], s1: ['Verão: sorvete, melão e prejuízo no estoque de sementes de inverno.'], s2: ['Outono tem as melhores abóboras. A Cora faz uma sopa que é pecado.'], s3: ['Inverno... pouco movimento. Mas a Festa das Lanternas ajuda.'],
    },
    stories: [{ h: 3, lines: ['Beto: Posso confiar numa coisa? Esta caixa de sementes sobrou da época da Alba.', 'Beto: Ela sempre pedia umas sementes esquisitas. Disse que "uma delas seria o segredo do vale".', 'Beto: Fique com elas. Quem sabe...'], gift: ['seed_girassol', 5] }],
  });

  npc('cora', {
    name: 'Cora', role: 'Dona da Cantina Vaga-lume', bday: [2, 5],
    look: { skin: 4, hair: '#2b1c16', style: 'coque', shirt: '#c9462c', pants: '#4a3a3a', apron: '#fff6e8', skirt: 0 },
    bio: 'Cozinheira de mão cheia e mãe da pequena Lia. Sabe o que você quer comer antes de você saber.',
    loves: ['pumpkin_soup', 'strawberry_pie', 'cake', 'lumi_tea'], likes: ['@cooked', 'egg', 'milk', 'honey'], hates: ['@trash', 'bomb'],
    sched: { wk: [['0700', 'diner.counter'], ['1500', 'diner.table1'], ['1530', 'diner.counter'], ['2100', 'diner.bed']], we: [['0800', 'diner.counter'], ['1500', 'town.market'], ['1700', 'diner.counter'], ['2100', 'diner.bed']], rain: [['0700', 'diner.counter'], ['2100', 'diner.bed']] },
    lines: {
      intro: ['Chegou o fazendeiro novo! Sou a Cora. Se estiver com fome, a Cantina está sempre aberta.', 'E se tiver ingredientes bons, me traga! Eu ensino receitas a quem me impressiona.'],
      low: ['O prato do dia é sempre o melhor prato. Não aceito reclamação!', 'Já comeu hoje? Tem cara de quem não comeu.', 'Pare de olhar o bolo, é para a festa!'],
      mid: ['Obrigada pela ajuda com os ingredientes! Você é um amor.', 'A Lia fala de você o tempo todo. Cuidado, ela quer ser fazendeira agora.', 'Quer aprender uma receita? Fale comigo quando estiver cheio de ovos.'],
      high: ['Você faz parte desta família, viu? Sempre terá um prato na minha mesa.', 'Eu juro: nada cura o dia ruim como uma sopa quente e boa companhia.'],
      rain: ['Dia de chuva é dia de sopa! A cantina fica lotada.'],
      s0: ['Primavera! Vou fazer torta de morango, venha cedo!'], s1: ['No verão eu só faço pratos frios. Calor demais para fogão!'], s2: ['Outono... abóbora em tudo! Sopa, pão, torta, doce.'], s3: ['Inverno é o meu reino. Cacau, ensopados, chá.'],
    },
    stories: [{ h: 4, lines: ['Cora: Sabe, a Alba me ensinou a cozinhar quando eu era pequena. Ela adorava Sopa de Abóbora.', 'Cora: Eu nunca consegui fazer igual... Será que você consegue?', 'Cora: Toma, a receita dela. Faça com carinho.'], recipe: 'pumpkin_soup' }],
  });

  npc('iris', {
    name: 'Dra. Íris', role: 'Médica do Vale', bday: [3, 3],
    look: { skin: 0, hair: '#8a5a2c', style: 'rabo', shirt: '#f0f0f5', pants: '#4a5a7a', glasses: '#5a4a6a', collar: '#4a9ad8' },
    bio: 'Estudou na capital e voltou para casa. Cuida de todos... inclusive de fazendeiros teimosos.',
    loves: ['salad', 'lumi_blossom', 'honey'], likes: ['@forage', 'veg_soup', 'milk'], hates: ['bomb', 'wine'],
    sched: { wk: [['0800', 'clinic.desk'], ['1200', 'forest.glade'], ['1330', 'clinic.desk'], ['1800', 'town.fountain'], ['2000', 'clinic.bed']], we: [['0900', 'town.fountain'], ['1300', 'forest.glade'], ['1700', 'clinic.desk'], ['2000', 'clinic.bed']], rain: [['0800', 'clinic.desk'], ['2000', 'clinic.bed']] },
    lines: {
      intro: ['Olá! Sou a Íris, a médica daqui. Se você se machucar na mina, me procure — eu curo e cobro pouco.', 'Mas sinceramente, prefiro que você não precise de mim.'],
      low: ['Beba água. Durma cedo. Não desmaie na mina. Fácil, né?', 'Todo fazendeiro novo vem pálido. Depois fica corado. É o ar do campo.', 'Estudei anos para tratar de joelhos ralados. Vida de médica de vila!'],
      mid: ['Estou colecionando ervas do bosque. Se encontrar alguma rara, me conte!', 'Você anda dormindo bem? Parece mais descansado.', 'Às vezes à noite vejo luzinhas no bosque. Parecem vaga-lumes... mas é impossível, né?'],
      high: ['Você é a pessoa mais saudável do vale. Ou a mais teimosa. Talvez ambas!', 'Obrigada por sempre me ouvir. A vila tem sorte de ter você.'],
      rain: ['Chuva traz resfriado. Se tossir, venha me ver!'],
      s0: ['A primavera traz alergias. Ou melhor, pacientes!'], s1: ['Insolação todo verão. Chapéu, gente!'], s2: ['Outono é calmo. Meu período favorito para caminhar.'], s3: ['Inverno: gripe, resfriado e fazendeiro com dedo congelado.'],
    },
    stories: [{ h: 4, lines: ['Íris: Posso te contar uma coisa? Eu vi um vaga-lume no bosque ontem.', 'Íris: Só um. Mas piscava de um jeito... diferente. Como se tentasse falar.', 'Íris: Se você o encontrar, me avise. Acho que o vale está acordando.'], gift: ['lumi_blossom', 1] }],
  });

  npc('tomas', {
    name: 'Tomás', role: 'Ferreiro', bday: [2, 20],
    look: { skin: 4, hair: '#1a1210', style: 'curto', shirt: '#7a3a2a', pants: '#3a3a44', apron: '#5a4a3a', beard: '#1a1210' },
    bio: 'Forja ferramentas e quebra geodos. Não fala muito, mas quando fala, vale a pena ouvir.',
    loves: ['gold_bar', 'geode', 'diamond', 'miner_snack'], likes: ['@gem', 'iron_bar', 'copper_bar', 'coal'], hates: ['@trash', 'fiber', 'clay'],
    sched: { wk: [['0800', 'smith.anvil'], ['1200', 'smith.counter'], ['1300', 'smith.anvil'], ['1800', 'diner.table2'], ['2000', 'smith.bed']], we: [['0900', 'smith.anvil'], ['1600', 'mountain.quarry'], ['1900', 'diner.table2'], ['2100', 'smith.bed']], rain: [['0800', 'smith.anvil'], ['2000', 'smith.bed']] },
    lines: {
      intro: ['...Tomás. Ferreiro.', 'Traga barras e ouro, melhoro suas ferramentas. Traga geodos, eu abro.'],
      low: ['Ferro bom, ferramenta boa.', 'Quer melhorar o machado? Leva dois dias.', 'Hmm.'],
      mid: ['Você tem boas mãos. Raro hoje em dia.', 'Já desceu até o fundo da mina? Dizem que há um guardião de cristal.', 'Aprendi a forjar com o seu avô, sabe?'],
      high: ['Você é um amigo de verdade. Não tenho muitos. Obrigado.', 'Quando terminar a mina, me traga o coração de cristal. Vou forjar algo especial.'],
      rain: ['Chuva... o fogo da forja fica mais bonito.'],
      s0: ['Primavera: hora de afiar enxadas.'], s1: ['Verão: forja quente demais. Mas é trabalho.'], s2: ['Outono: melhor época para forjar.'], s3: ['Inverno: forja é o lugar mais quente da vila.'],
    },
    stories: [{ h: 4, lines: ['Tomás: Meu pai foi mineiro. Morreu no andar 28.', 'Tomás: Não conto isso a ninguém. Mas você desce lá todo dia.', 'Tomás: Tome cuidado. Leve isto.'], gift: ['bomb', 5] }],
  });

  npc('nina', {
    name: 'Nina', role: 'Pescadora da Praia da Maré', bday: [1, 17],
    look: { skin: 2, hair: '#3c6fb0', style: 'longo', shirt: '#4a9ab8', pants: '#e0d8c0', hat: 'bandana', hatColor: '#f0e0b8' },
    bio: 'Vive na cabana da praia e conhece cada peixe pelo nome — e pelo mau humor.',
    loves: ['grilled_fish', 'fish_stew', 'lanterna', 'atum'], likes: ['@fish', 'coral', 'shell'], hates: ['@trash', 'wine'],
    sched: { wk: [['0600', 'beach.pier'], ['1200', 'fishhut.table'], ['1300', 'beach.pier'], ['1800', 'beach.rocks'], ['2000', 'fishhut.bed']], we: [['0600', 'beach.pier'], ['1400', 'town.river'], ['1800', 'beach.rocks'], ['2000', 'fishhut.bed']], rain: [['0700', 'fishhut.table'], ['2000', 'fishhut.bed']] },
    lines: {
      intro: ['Ei, forasteiro! Cuidado com as ondas. E nunca assuste meus peixes.', 'Quer pescar? Fale comigo. Vendo iscas e varas melhores.'],
      low: ['Peixe bom só aparece para quem tem paciência.', 'Tem peixe que só sai à noite. Esses são meus preferidos.', 'Hoje a maré está boa... ou ruim. Depende do ponto de vista.'],
      mid: ['Você já tentou pescar na chuva? Aparecem coisas incríveis.', 'Dizem que existe uma carpa dourada no lago que foi da sua avó.', 'Gosto de você. Não fala demais.'],
      high: ['Meu amigo, a pesca é sobre ouvir o silêncio. Você aprendeu isso.', 'Se encontrar a Lula Cintilante, me conte. Procuro por ela há dez anos.'],
      rain: ['Chuva! Dia perfeito para pescar!'],
      s0: ['Primavera: sardinhas à vontade.'], s1: ['Verão: atuns gigantes!'], s2: ['Outono: salmão subindo o rio.'], s3: ['Inverno: peixes de gelo. Raro e valioso.'],
    },
    stories: [{ h: 4, lines: ['Nina: Sabe por que moro aqui? Meu pai me trouxe aos seis anos.', 'Nina: A Alba pescava ao meu lado. Era uma boa pescadora.', 'Nina: Ela me deu esta vara. Acho que você a merece mais.'], gift: ['lure', 5] }],
  });

  npc('ney', {
    name: 'Seu Ney', role: 'Carpinteiro', bday: [3, 14],
    look: { skin: 1, hair: '#8a8a90', style: 'curto', shirt: '#c8805a', pants: '#4a4a5a', hat: 'cap', hatColor: '#4a7a9a', beard: '#8a8a90' },
    bio: 'Constrói celeiros, galinheiros e qualquer coisa de madeira. Fala sozinho enquanto trabalha.',
    loves: ['veg_soup', 'hearty_stew', 'wood'], likes: ['@cooked', 'stone', 'hay'], hates: ['@trash', 'bomb'],
    sched: { wk: [['0800', 'carp.bench'], ['1200', 'carp.desk'], ['1300', 'carp.bench'], ['1700', 'town.bench2'], ['1900', 'carp.bed']], we: [['0900', 'carp.bench'], ['1500', 'forest.glade'], ['1900', 'carp.bed']], rain: [['0800', 'carp.bench'], ['1900', 'carp.bed']] },
    lines: {
      intro: ['Bom dia, bom dia! Sou o Ney. Se quer construir algo na fazenda, é comigo.', 'Galinheiro, celeiro, silo, poço... tudo. Mas leva uns dias.'],
      low: ['Madeira boa é madeira seca. Eu sempre digo.', 'Não passe perto da serra. Já perdi dois dedos... brincadeira! Só um.', 'Ah, os bons tempos de construir com a Alba...'],
      mid: ['Você anda cortando muita árvore. Deixe algumas em pé, hein?', 'Se faltar madeira, me avise. Tenho um estoque secreto.', 'Eu construí aquele banco da praça, sabia?'],
      high: ['Eu o tenho como filho. Aviso a todos: se alguém mexer com você, mexe comigo.', 'O Lanternário só está de pé por causa dos remendos que fiz.'],
      rain: ['Chuva é boa para ficar na oficina, lixando.'],
      s0: ['Primavera: tempo de construir!'], s1: ['Verão: o cheiro de madeira cortada é o melhor.'], s2: ['Outono: preparar tudo para o frio.'], s3: ['Inverno: lareira e lasca de madeira.'],
    },
    stories: [{ h: 3, lines: ['Ney: Vem cá, rapaz. Vou te ensinar um truque.', 'Ney: Para cortar madeira rápido, bata sempre na altura do meio do tronco.', 'Ney: Tá, tá, é mentira. Mas leve esta madeira extra!'], gift: ['wood', 50] }],
  });

  npc('caio', {
    name: 'Caio', role: 'Mestre da Guilda dos Exploradores', bday: [2, 11], romance: true,
    look: { skin: 3, hair: '#c9462c', style: 'espetado', shirt: '#4a3a5a', pants: '#3a3a4a', collar: '#c8a050', hat: 'bandana', hatColor: '#c24a3a' },
    bio: 'Aventureiro aposentado que prefere treinar novatos a levar espadadas. Mente que "nunca teve medo".',
    loves: ['hearty_stew', 'ruby', 'miner_snack', 'sword_steel'], likes: ['@gem', '@cooked', 'cheese'], hates: ['@trash', 'salad'],
    sched: { wk: [['0800', 'guild.counter'], ['1200', 'guild.board'], ['1400', 'mountain.lookout'], ['1800', 'diner.table2'], ['2100', 'guild.bed']], we: [['1000', 'mountain.quarry'], ['1500', 'guild.counter'], ['1900', 'diner.table1'], ['2100', 'guild.bed']], rain: [['0900', 'guild.counter'], ['2100', 'guild.bed']] },
    lines: {
      intro: ['Ora ora, um novato! Sou o Caio. Guilda dos Exploradores, às suas ordens.', 'A mina fica lá em cima. Leve uma espada, comida e coragem. Pode ser que volte inteiro.'],
      low: ['Os monstros da mina são menos terríveis do que parecem. Quase.', 'Já desceu até o décimo andar? Lá é seguro. Depois... cuidado.', 'Você não é de falar muito, né? Gosto disso.'],
      mid: ['Você luta bem para um fazendeiro! Quase me impressiona.', 'Quando eu era jovem, quase venci o Golem de Cristal. Quase.', 'Se precisar de arma, a Guilda tem. Para você, desconto. Pouco, mas tem.'],
      high: ['Sempre quis um parceiro de aventuras. Você é o melhor que já tive.', 'Quando a mina acabar, quero fazer uma expedição para o norte. Vem comigo?'],
      rain: ['Chuva... a mina está silenciosa hoje.'],
      s0: ['Primavera: monstros mais ativos. Cuidado!'], s1: ['Verão: mina fresquinha. Melhor lugar da vila.'], s2: ['Outono: ótima época para uma expedição.'], s3: ['Inverno: a mina nunca congela.'],
    },
    stories: [{ h: 4, lines: ['Caio: Posso te contar um segredo? Eu tenho medo de morcego.', 'Caio: Todo explorador tem um pavor besta. O meu é esse.', 'Caio: Não conta a ninguém! Aqui, uma bomba por sua discrição.'], gift: ['bomb', 5] }, { h: 8, lines: ['Caio: Ei... posso falar uma coisa sem rir?', 'Caio: Quando estou com você, esqueço de todo o resto.', 'Caio: Acho que... gosto de você de um jeito diferente.'], gift: ['bouquet', 0] }],
  });

  npc('marina', {
    name: 'Marina', role: 'Artista', bday: [0, 24], romance: true,
    look: { skin: 0, hair: '#e07aa6', style: 'longo', shirt: '#7a5ac8', pants: '#3a3a5a', skirt: 1 },
    bio: 'Pinta o vale desde que chegou. Vê cores onde os outros veem sombras.',
    loves: ['amethyst', 'hot_cocoa', 'lumi_blossom', 'tulipa'], likes: ['@flower', '@gem', 'honey'], hates: ['@trash', 'bomb'],
    sched: { wk: [['0900', 'homeA.easel'], ['1300', 'town.fountain'], ['1500', 'forest.glade'], ['1800', 'diner.table1'], ['2100', 'homeA.bed']], we: [['0900', 'mountain.lookout'], ['1400', 'beach.rocks'], ['1800', 'diner.table1'], ['2100', 'homeA.bed']], rain: [['0900', 'homeA.easel'], ['2100', 'homeA.bed']] },
    lines: {
      intro: ['Oh, olá! Você é o dono da fazenda? Que luz maravilhosa tem aquela fazenda ao entardecer!', 'Eu sou a Marina. Pinto. Quando consigo.'],
      low: ['Estou procurando a cor certa para o pôr do sol. É sempre uma cor que não existe.', 'Você tem alguma flor bonita? Preciso de modelo.', 'O vale inteiro é uma tela viva.'],
      mid: ['Pintei a sua fazenda ontem. Quer ver? Ah, ainda está feia. Mas vai ficar linda.', 'Já reparou como o céu muda de cor no outono?', 'Gosto de pintar quando chove. Fica tudo mais... azul.'],
      high: ['Você aparece em muitas pinturas minhas. Sem querer. Ou querendo.', 'Prometo que vou te pintar um dia. Uma obra só para você.'],
      rain: ['Chuva! As cores ficam saturadas. Perfeito!'],
      s0: ['Primavera! Rosa, verde-claro, amarelo...'], s1: ['Verão: azul profundo e ouro.'], s2: ['Outono: todos os laranjas do mundo!'], s3: ['Inverno: branco e azul. E um toque de vermelho.'],
    },
    stories: [{ h: 4, lines: ['Marina: Posso te mostrar uma coisa? É a minha tela favorita.', 'Marina: É a primeira vez que vejo vaga-lumes na vida... só na pintura, claro.', 'Marina: Imaginei como seria. Ficou bonito, né?'], gift: ['quartz', 3] }, { h: 8, lines: ['Marina: Eu pintei você.', 'Marina: Não ria! É o meu melhor trabalho. Você parece... feliz.', 'Marina: Acho que gosto de você, sabia? Muito.'], gift: ['bouquet', 0] }],
  });

  npc('rafa', {
    name: 'Rafa', role: 'Músico Itinerante', bday: [1, 25], romance: true,
    look: { skin: 2, hair: '#2b1c16', style: 'cacheado', shirt: '#e0a63a', pants: '#4a4a6a', hat: 'beanie', hatColor: '#4a9a8a' },
    bio: 'Toca violão na cantina e compõe canções sobre a vila. Dorme pouco, ri muito.',
    loves: ['pancakes', 'honey', 'berry_tart', 'sapphire'], likes: ['@cooked', '@flower', 'milk'], hates: ['@trash', 'clay'],
    sched: { wk: [['1000', 'town.bench1'], ['1400', 'beach.rocks'], ['1800', 'diner.stage'], ['2200', 'homeA.sofa']], we: [['1000', 'forest.glade'], ['1500', 'town.fountain'], ['1800', 'diner.stage'], ['2200', 'homeA.sofa']], rain: [['1000', 'diner.stage'], ['2200', 'homeA.sofa']] },
    lines: {
      intro: ['E aí! Rafa, às ordens. Se ouvir um violão desafinado, sou eu.', 'Toco todo fim de tarde na cantina. Apareça!'],
      low: ['Estou compondo uma canção sobre o vale. Ainda não tem fim.', 'Quer ouvir uma música? Ah, esqueci o violão.', 'Música boa vem de coração tranquilo.'],
      mid: ['Fiz uma música sobre você. Não, você ainda não pode ouvir!', 'A Marina me disse que você é gente boa. Confio nela.', 'Cada canto da vila tem um som. Já reparou?'],
      high: ['Você é a nota que faltava na minha música.', 'Posso tocar para você sempre que quiser. Não cobro.'],
      rain: ['Chuva é o melhor metrônomo do mundo!'],
      s0: ['Primavera: canções leves e alegres.'], s1: ['Verão: serenatas ao entardecer.'], s2: ['Outono: baladas melancólicas.'], s3: ['Inverno: lareira, violão e chocolate.'],
    },
    stories: [{ h: 4, lines: ['Rafa: Tenho uma notícia: consegui terminar a música do vale!', 'Rafa: Ainda não tem letra... mas tem melodia. Escute.', 'Rafa: ♪ lá lá lá... ♪ Boa, né?'], gift: ['honey', 2] }, { h: 8, lines: ['Rafa: Escrevi a letra. Fala de uma pessoa que chegou e acendeu o vale.', 'Rafa: Acho que a música é sobre você.', 'Rafa: E acho que eu também.'], gift: ['bouquet', 0] }],
  });

  npc('luna', {
    name: 'Luna', role: 'Florista', bday: [0, 18], romance: true,
    look: { skin: 5, hair: '#7a4aa8', style: 'coque', shirt: '#6ab87a', pants: '#e0d0b8', skirt: 1, apron: '#f5efe4' },
    bio: 'Cultiva flores raras e acredita que cada uma sussurra segredos para quem sabe ouvir.',
    loves: ['@flower', 'lumi_blossom', 'strawberry_pie', 'honey'], likes: ['@forage', 'milk', 'cookie'], hates: ['@trash', 'bomb', 'coal'],
    sched: { wk: [['0800', 'flowers.counter'], ['1200', 'flowers.window'], ['1300', 'flowers.counter'], ['1700', 'town.bench1'], ['2000', 'flowers.bed']], we: [['0800', 'forest.glade'], ['1300', 'flowers.counter'], ['1900', 'flowers.bed']], rain: [['0800', 'flowers.counter'], ['2000', 'flowers.bed']] },
    lines: {
      intro: ['Oh! Você deve ser o novo dono. Eu sou a Luna, da Floricultura. Que bom ter alguém jovem na vila!', 'Se tiver flores bonitas, eu compro com prazer!'],
      low: ['As flores falam, sabia? Só falam baixo.', 'Cada pétala tem uma história.', 'Sua fazenda tem boa terra. Plante algumas tulipas!'],
      mid: ['Fiz um buquê só para a vitrine. Ficou tão bonito que não quero vender!', 'Você tem o dom de plantar. Eu sinto.', 'A Marina pinta minhas flores. Ficam ainda mais lindas.'],
      high: ['Quando estou perto de você, as flores parecem desabrochar mais rápido.', 'Posso te contar um segredo? Plantei uma flor para você. Ainda não nasceu.'],
      rain: ['Chuva! Minhas flores agradecem.'],
      s0: ['Primavera! A melhor época do ano para mim!'], s1: ['Verão: girassóis até onde a vista alcança.'], s2: ['Outono: crisântemos e folhas secas.'], s3: ['Inverno: só as flores-de-gelo sobrevivem. Lindas!'],
    },
    stories: [{ h: 4, lines: ['Luna: Quero te mostrar a minha flor favorita.', 'Luna: Chama-se Flor-Lúmen. Só desabrocha à noite e brilha, olha!', 'Luna: Achei uma no bosque. Fique com ela.'], gift: ['lumi_blossom', 1] }, { h: 8, lines: ['Luna: Plantei algo no jardim da loja. Venha ver.', 'Luna: É um canteiro de tulipas, desenhando um coração... bobagem, né?', 'Luna: Acho que gosto de você mais do que de qualquer flor.'], gift: ['bouquet', 0] }],
  });

  npc('lia', {
    name: 'Lia', role: 'Criança curiosa', bday: [2, 1], romance: false, kid: true,
    look: { skin: 4, hair: '#2b1c16', style: 'rabo', shirt: '#f2a63a', pants: '#4a5a8a', kid: 1, hat: null },
    bio: 'Filha da Cora. Quer ser exploradora, fazendeira e cozinheira ao mesmo tempo.',
    loves: ['cookie', 'cake', 'honey', 'egg_gold'], likes: ['@flower', 'milk', 'hot_cocoa'], hates: ['@trash', 'salad'],
    sched: { wk: [['0800', 'town.fountain'], ['1500', 'town.market'], ['1700', 'diner.table1'], ['2000', 'diner.bed']], we: [['0900', 'forest.glade'], ['1400', 'town.fountain'], ['1800', 'diner.table1'], ['2000', 'diner.bed']], rain: [['0800', 'diner.table1'], ['2000', 'diner.bed']] },
    lines: {
      intro: ['Oi! Você é o fazendeiro? Eu sou a Lia! Posso ver suas galinhas um dia? Por favor?', 'Minha mãe disse que sou curiosa demais. Mas curiosidade é boa, né?'],
      low: ['Você já viu um vaga-lume de verdade? Eu só vi em desenho!', 'Quero ser exploradora quando crescer. Ou astronauta.', 'Você tem docinho?'],
      mid: ['Sabia que os vaga-lumes piscam para conversar?', 'Eu vi uma luzinha no bosque! Era azul!', 'Quando eu crescer, vou te ajudar na fazenda!'],
      high: ['Você é meu melhor amigo adulto!', 'Eu desenhei você e a sua fazenda. Posso te dar?'],
      rain: ['Eu adoro pular nas poças!'],
      s0: ['Tem muita flor, né?'], s1: ['Verão é o melhor! Sem escola!'], s2: ['Vamos pisar nas folhas!'], s3: ['Neve! Neve! Neve!'],
    },
    stories: [{ h: 4, lines: ['Lia: Vem cá, vem cá! Eu descobri um esconderijo!', 'Lia: Atrás da cantina tem um buraquinho que leva a um jardim secreto!', 'Lia: Mas é segredo! Toma, um presente por não contar.'], gift: ['cookie', 3] }],
  });

  D_assign();
  function D_assign() { VV.Data.NPC_ORDER = Object.keys(N); }
  return N;
})();
