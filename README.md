# 🏮 Vale dos Vaga-lumes

Um RPG de fazenda e vida no campo em **pixel art**, feito só com **HTML, CSS e JavaScript puro**. Sem build, sem dependências, sem imagens ou sons externos: toda a arte é gerada por código e toda a música e todos os efeitos são sintetizados em tempo real com a Web Audio API.

Você herda a fazenda da Vovó Alba num vale onde os vaga-lumes desapareceram. Plante, pesque, minere, faça amizades, case-se e devolva a luz ao vale restaurando o antigo **Lanternário**.

## ▶ Como jogar

Basta servir a pasta com qualquer servidor estático:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Ou publique no **GitHub Pages** (Settings → Pages → branch `main`, pasta `/root`). Funciona em Chrome, Edge, Firefox e Safari recentes.

> Abrir o `index.html` direto do disco (`file://`) também funciona na maioria dos navegadores.

## 🎮 Controles

| Ação | Tecla |
|---|---|
| Mover | `WASD` / setas |
| Usar ferramenta / arma | `Espaço` ou `J` (ou clique esquerdo) |
| Interagir / conversar / colher | `E` (ou clique direito) |
| Trocar item da barra | `Q` / `R`, roda do mouse, `1`–`0`, `-`, `=` |
| Mochila e menus | `Tab` ou `I` |
| Mapa / Missões | `M` / `L` |
| Correr | `Shift` |
| Pausa | `Esc` |

Gamepad básico também é suportado.

## ✨ Recursos

- **Agricultura completa**: enxada, regador, 23 culturas por estação, qualidade (prata/ouro/irídio), fertilizantes, aspersores, espantalhos, culturas que rebrotam, estufa.
- **Habilidades**: Agricultura, Mineração, Coleta, Pesca e Combate, com 10 níveis e bônus próprios.
- **Mina de 30 andares** gerada proceduralmente, 5 tipos de monstros, minérios, gemas, geodos, bombas e o chefão **Golem de Cristal**.
- **Pesca** com minigame, 18 espécies (2 lendárias), iscas, horário, clima e estação.
- **Animais**: galinhas, vacas e ovelhas; ração, carinho, qualidade por amizade; galinheiro, celeiro, silo e poço.
- **Artesanato**: fornalha, barril, conservas, queijeira, tear, maionese, colmeias, bancada; **18 receitas de culinária** com bônus.
- **12 moradores** com rotinas diárias reais (andam entre mapas, mudam com chuva e fim de semana), gostos, aniversários, cenas de amizade, presentes, **namoro, noivado e casamento**.
- **Lanternário**: 6 salas de oferendas que restauram o vale, desbloqueiam recompensas e mudam a torre e o final do jogo.
- **Festivais** nas quatro estações, **correio**, quadro de pedidos, 11 missões principais e 18 conquistas.
- **Ciclo dia/noite**, 4 estações, chuva, tempestade, neve, iluminação dinâmica, vaga-lumes e a espiritual **Lumi**.
- **3 slots de save** (localStorage), exportar/importar saves em arquivo, salvamento automático.
- **HUD e interface próprios**: barra de atalhos, relógio, energia e vida, rastreador de missão, mochila com abas, loja, oficina, forja, culinária, baús, caixote de envio, criador de personagem, tela de título animada.

## 🗂 Estrutura

```
index.html
css/style.css
js/
  core/    util, input (teclado/mouse/gamepad), audio (síntese Web Audio)
  art/     px (motor de pixel art), tiles, nature, characters, buildings, icons, special
  data/    items, npcs, story
  game/    world, maps, mines, state, entities, render, game, tools, social, economy
  ui/      ui (HUD, diálogos), menus, shops, title
  main.js  inicialização e laço principal
tools/     páginas de pré-visualização da arte (desenvolvimento)
```

Todos os módulos vivem sob o namespace global `window.VV`. A ordem dos `<script>` em `index.html` importa.

## 🛠 Para desenvolvedores

- Resolução interna dinâmica (escala inteira) com `imageSmoothing` desligado para pixels nítidos.
- Iluminação por lightmap (`lighter` + `multiply`), terrenos com autotile por prioridade, ordenação em Y.
- Conteúdo orientado a dados: novos itens, NPCs, missões e receitas ficam em `js/data/`.
- Para depurar no console: `VV.G` (jogo), `VV.G.S` (estado salvo), `VV.Data` (dados).

## 📜 Licença

MIT — veja `LICENSE`. Em memória da Vovó Alba, que enxergava a menor luz do mundo.
