# A Lenda de Lais

Uma aventura 2D em pixel art inspirada em **Diamond Rush**, feita por Erick para Lais. São 5 fases compactas, de salas em grade, com pedras para empurrar, chaves, portas, armadilhas, inimigos e tesouros. Em cada fase Lais precisa encontrar **uma rosa e uma chave** para abrir a porta de saída. No final, ela resgata Erick: as 5 rosas viram um buquê e ele faz o pedido de namoro.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5180
npm run build        # versão para publicar (pasta dist/)
npm run test:fases   # joga as 5 fases automaticamente (sem dano e com dano)
```

### Controles

| Ação | Teclado | Celular |
| --- | --- | --- |
| Andar / empurrar | Setas ou WASD (andar contra a pedra empurra) | D-pad |
| Espada | J ou Z | botão **Espada** |
| Flecha | K ou X | botão **Arco** |
| Interagir (alavanca, placa, altar) | E, Espaço ou Enter | botão **E** |
| Reiniciar sala (se um enigma travar) | R | menu de pausa |
| Pausa | Esc ou P | botão ❚❚ |

## As fases

| # | Fase | Tema | Desafios principais |
| --- | --- | --- | --- |
| 1 | Onde Tudo Começou | Ibiza à noite | empurrar caixas, espinhos com ritmo, pedra na placa, chave escondida atrás de arbustos, parede rachada com tesouro |
| 2 | A Viagem que Vivemos | Praia | pedras que afundam e viram ponte, ondas mágicas, alavanca, corredor em que a ordem dos empurrões importa, parede falsa com tesouro |
| 3 | O Jardim das Mil Rosas | Jardim encantado | labirinto de cercas vivas, flores na ordem certa, pedras nos canteiros do templo, besouros |
| 4 | A Noite das Bruxas | Vila assombrada | chave pequena e porta trancada, guarda-roupa empurrável, fantasmas, lanterna acionada por flecha, gárgulas que cospem fogo, porta secreta |
| 5 | O Caminho Até Você | Lago ao luar | ponte com três pedras, espinhos, porta trancada, altar da memória e cristais acertados com flechas na ordem, sala de sombras que precisa ser limpa |

Cada fase tem de 5 a 6 salas e leva de 3 a 7 minutos. Ao pegar a rosa, aparece a mensagem romântica da fase. As rosas ficam guardadas e aparecem na barra superior.

## Como editar

| Arquivo | O que tem |
| --- | --- |
| `src/game/data/phases.js` | As 5 fases. Cada sala é um desenho em texto de 15×9 caracteres; a legenda está no topo do arquivo. Aqui também ficam as mensagens das rosas e as falas de entrada. |
| `src/game/data/story.js` | Abertura, diálogos do final, o pedido e as mensagens finais. |
| `src/game/data/characters.js` | Sprites de Lais e Erick. |
| `src/game/engine/tileArt.js` | Cores e estilo de cada fase, desenho das rosas, chaves e diamantes. |

Depois de mudar uma sala, rode `npm run test:fases`. O teste joga a fase de verdade e avisa se algum enigma ficou sem solução.

### Atalhos de teste (na URL)

- `?dev&abertura` — abre a história animada (`&cap=4` vai direto ao capítulo 4; `&tempo=3` começa no segundo 3 da cena).
- `?dev&fase=3`: começa direto na fase 3, com as rosas anteriores.
- `&nocard`: pula o cartão de título.
- `?dev&final`: abre o final.
- `?dev&final&etapa=question` (ou `bouquet`, `end`): abre o final numa etapa específica.

## Abertura e capa

Ao começar uma nova aventura, uma história ilustrada em 5 capítulos mostra como Lais e Erick se conheceram, se apaixonaram e como a Rainha do Esquecimento sequestrou Erick e espalhou as cinco rosas. Os textos ficam em `src/game/data/story.js` (`STORY`); as cenas animadas em `src/components/OpeningScene.jsx`. A capa animada está em `src/components/MenuScene.jsx`.

## Personalidade

- **Falas da Lais:** balõezinhos engraçados ao empurrar, lutar, achar diamantes, ficar parada etc. Edite em `src/game/data/quips.js`.
- **Lumi:** fadinha que acompanha a Lais e ilumina o caminho. Quando ela fica parada uns segundos, a Lumi voa até a rosa ou a chave da sala, como dica.
- **Inimigos:** desenhados em `src/game/engine/enemyArt.js`. Eles piscam, ficam bravos ao perseguir e ficam brancos ao levar golpe.

## Testes

`npm run test:fases` joga cada fase em dois modos:
- **lógico** (sem dano): todo enigma tem solução e nada pode ser pulado;
- **realista** (com dano): o robô espera o ritmo de espinhos, ondas e fogo; a fase falha se a Lais morrer.

Os testes usam `node --jitless`, porque o Node 24 desta máquina trava aleatoriamente com o JIT ligado (problema do Node, não do jogo).

## Estrutura

```text
src/
├── App.jsx                    menu → abertura → fases → final; save automático
├── components/
│   ├── GameCanvas.jsx         ponte React ↔ motor
│   ├── HUD.jsx                barra superior: fase, objetivo, rosas, chave, diamantes, salas, vidas
│   ├── RoseModal.jsx          tela especial da rosa
│   ├── FinalScene.jsx         resgate, buquê, pedido, abraço e mensagem final
│   ├── DialogueOverlay.jsx, LevelCard.jsx, MainMenu.jsx, MenuScene.jsx, PauseModal.jsx, VirtualControls.jsx
└── game/
    ├── data/                  fases, história, personagens, falas
    ├── engine/
    │   ├── tileGame.js        motor em grade: salas, empurrar, chaves, portas, portões, armadilhas, inimigos, flechas
    │   ├── tileArt.js         arte procedural dos tiles e itens
    │   ├── actors.js, props.js, pixel.js
    ├── sfx.js                 efeitos sonoros sintetizados + caixinha de música do final
    ├── audioManager.js, saveManager.js
tests/web/playtest.mjs + plans.mjs   solução automática de cada fase
```

O save fica no navegador (`localStorage`, chave `a_lenda_de_lais_save_v3`).

## Observações

- O cenário é desenhado por código (pixel art procedural). Lais e Erick usam os sprites fornecidos.
- A música de fundo é o arquivo romântico do projeto. O final troca para uma caixinha de música sintetizada.
- O projeto Godot antigo (`project.godot`, `scenes/`, `scripts/`) não foi atualizado e não é usado pela versão web.
