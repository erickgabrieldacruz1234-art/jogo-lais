// ============================================================================
// AS CINCO FASES
// Cada sala tem 15 colunas x 9 linhas. Chave "x,y" = posição da sala na fase.
// Salas vizinhas se ligam por aberturas alinhadas nas bordas.
//
// Legenda padrão (vale para todas as fases):
//   #  parede            .  chão             ,  chão variado     %  flores/enfeites
//   ~  água (pedra empurrada afunda e vira caminho)
//   =  parede falsa (dá para atravessar — segredo)
//   W  parede rachada (quebra com a espada — segredo)
//   T  decoração sólida   i  lampião          P  início da Lais
//   O  pedra empurrável   B  caixa/móvel empurrável
//   R  rosa da fase       K  chave da fase    D  porta de saída (precisa rosa + chave)
//   k  chave pequena      d  porta trancada (gasta uma chave pequena)
//   $  diamante (tesouro opcional)   +  coração (recupera vida)
//   ^  espinhos (sobem e descem)     v  gárgula que cospe fogo (na parede de cima)
//   M  altar da memória
// Cada fase pode definir letras próprias em "legend" (placas, portões,
// alavancas, alvos, cristais, inimigos, placas de aviso...).
// ============================================================================

import { say } from "./speakers";

export const PHASES = [
  // ==========================================================================
  {
    id: "ibiza",
    index: 1,
    title: "Onde Tudo Começou",
    subtitle: "Ibiza",
    theme: "ibiza",
    roomsW: 3,
    roomsH: 2,
    roseMessage: "Cada grande história começa com um encontro… e eu sou muito feliz por ter encontrado você. ❤️",
    intro: [
      say("lais", "Ibiza... as luzes, a música baixinha, o cheiro do mar. Foi aqui que tudo começou."),
      say("lais", "Erick, aguenta firme. Eu vou buscar cada rosa — e depois vou buscar você.")
    ],
    legend: {
      Y: {
        type: "sign",
        lines: [say("placa", "PISTA DE DANÇA DE IBIZA\nOs espinhos dançam em ondas, no ritmo da música.\nSiga o ritmo e pegue os diamantes sem pisar no pé de ninguém!")]
      },
      a: { type: "spikes", offset: 1 },
      b: { type: "spikes", offset: 2 },
      p: { type: "plate", group: "A" },
      G: { type: "gate", group: "A" },
      e: { type: "enemy", look: "imp", ai: "patrol", axis: "h", hp: 1, speed: 0.55 },
      X: { type: "target", group: "T" },
      H: { type: "gate", group: "T" },
      S: {
        type: "sign",
        lines: [
          say("placa", "COMO USAR O ARCO\nOlhe na direção do alvo e aperte K (ou X, ou o botão Arco no celular).\nA flecha voa em linha reta até bater em algo."),
          say("placa", "Dica: quando um alvo estiver alinhado com você, aparece uma linha pontilhada de mira e a tecla K acima da Lais.\nAcerte o alvo lá no alto para abrir o portão do leste!")
        ]
      },
      s: {
        type: "sign",
        lines: [
          say("placa", "BEM-VINDA, LAIS!\nSetas ou WASD: andar  •  andar contra pedras e caixas: empurrar\nJ ou Z: espada  •  K ou X: flecha  •  E ou Espaço: interagir"),
          say("placa", "Encontre a ROSA e a CHAVE desta fase. Só com as duas a porta de saída se abre.\nSe uma sala travar, use a pausa para reiniciar a sala.")
        ]
      }
    },
    groups: { A: { message: "Um portão se abriu!" }, T: { message: "Na mosca! O portão do leste se abriu." } },
    rooms: {
      "0,0": [
        "###############",
        "#T,,,,,#,,,X,T#",
        "#,...s.#....i.#",
        "#..P...B......H",
        "#,.....#......#",
        "#%%....#.S..%%#",
        "#,.....#......#",
        "#T,,,,,#,,,,,T#",
        "###.###########"
      ],
      "1,0": [
        "###############",
        "#T,,,,^ab,,,,T#",
        "#,..i.^ab.....#",
        "......^ab......",
        "#,....^ab..i..#",
        "#%....^ab....%#",
        "#,....^ab.....#",
        "#T,,,,^ab,,,,T#",
        "###############"
      ],
      "2,0": [
        "###############",
        "#,,,,,,,#,,,,T#",
        "#..O....#..R..#",
        "........#.....#",
        "#.......###G###",
        "#,.....p......#",
        "#%..........i.#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "0,1": [
        "###.###########",
        "#T,,,,,,T,,,,K#",
        "#,$.....T,,,,,#",
        "#,..i...T,,,,,#",
        "#,......TTBTTT#",
        "#,.............",
        "#%%...........#",
        "#T,,,,,,,,,,%T#",
        "###############"
      ],
      "1,1": [
        "#######D#######",
        "#T,$,,,.,,,i,T#",
        "#######|#######",
        "#,....e.......#",
        "#,..._..._..._#",
        "...............",
        "#%..O...O...O.#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,1": [
        "###############",
        "#T,,,i,Y,i,,,T#",
        "#,..^.a.b.^..,#",
        "#,.^.a.b$^.a.,#",
        "#,..a.b.^$a..,#",
        ".,.a.b$^.a.b.+#",
        "#%..b.^.a$b..%#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ]
    }
  },

  // ==========================================================================
  {
    id: "praia",
    index: 2,
    title: "A Viagem que Vivemos",
    subtitle: "A praia",
    theme: "praia",
    roomsW: 3,
    roomsH: 2,
    boulderLook: "sand",
    roseMessage: "Quero viver muitas outras aventuras com você, conhecer novos lugares e transformar cada viagem em uma lembrança nossa. 🌹",
    intro: [
      say("lais", "Areia quente, mar azul... a nossa viagem!"),
      say("lais", "Dica para mim mesma: pedra empurrada na água vira caminho. E onda mágica não é piscina.")
    ],
    legend: {
      Y: {
        type: "sign",
        lines: [say("placa", "GRUTA DAS CONCHAS\nTesouros nas ilhotas! Empurre uma pedra para dentro d'água e ela vira caminho.")]
      },
      w: { type: "tide", period: 4.2, wet: 1.3, wave: -0.3 },
      l: { type: "lever", group: "A" },
      H: { type: "gate", group: "A" },
      p: { type: "plate", group: "B" },
      G: { type: "gate", group: "B" },
      c: { type: "enemy", look: "crab", ai: "patrol", axis: "h", hp: 2, speed: 0.5 },
      s: {
        type: "sign",
        lines: [say("placa", "\"Duas pedras, duas placas, um corredor estreito.\nQuem empurra a da frente primeiro chega mais longe.\"")]
      }
    },
    groups: { A: { message: "A alavanca abriu o portão do leste!" }, B: { message: "As duas placas afundaram — o portão do tesouro se abriu!" } },
    rooms: {
      "0,0": [
        "###############",
        "#T,,,,,~~,,,,T#",
        "#,.....~~.....#",
        "#,P.O..~~......",
        "#,.....~~.....#",
        "#,...O.~~.....#",
        "#%.....~~....%#",
        "#T.,,,,~~,,,,T#",
        "###.###########"
      ],
      "1,0": [
        "###############",
        "#~~~~~~~~~~~~~#",
        "#~~~~~~~~~~~~~#",
        "...ww,ww,ww,..#",
        "#~~~~~~~~~~~,l#",
        "#~~~~~~~~~~~..H",
        "#~~~~~~~~~~~,,#",
        "#~~~~~~~~~~~~~#",
        "###############"
      ],
      "2,0": [
        "###############",
        "#T,,,,,,,,,,,T#",
        "#,.s..........#",
        "#,....#######.#",
        "#,.O.O....pp#.#",
        ".,....#######.#",
        "#,.......####G#",
        "#T,,,,,,,#,,R,#",
        "###############"
      ],
      "0,1": [
        "###.###########",
        "#T,.,,,,,,,=,$#",
        "#,.........#,,#",
        "#,.....c...####",
        "#,............#",
        "#.~~~~~~~~~~~..",
        "#.wwwwK~~~~~~.#",
        "#.~~~~~~~~~~~.#",
        "###############"
      ],
      "1,1": [
        "#######D#######",
        "#T,,,,,.,,,,$T#",
        "#######|#######",
        "#,.._..._..._.#",
        "#,............#",
        "...O.......O...",
        "#%.....O.....+#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,1": [
        "###############",
        "#T,,,,,,,,,,,T#",
        "#,..Y.........#",
        "#,............#",
        "#,............#",
        "..O..c.O..c.O.#",
        "#~~~~~~~~~~~~~#",
        "#~$~~~~+~~~~$~#",
        "###############"
      ]
    }
  },

  // ==========================================================================
  {
    id: "jardim",
    index: 3,
    title: "O Jardim das Mil Rosas",
    subtitle: "Todas as flores que Erick deu",
    theme: "jardim",
    roomsW: 3,
    roomsH: 2,
    boulderLook: "moss",
    roseMessage: "Eu poderia te dar mil flores, mas nenhuma delas seria tão especial quanto você. Cada uma me lembra o quanto você ilumina a minha vida. ❤️",
    intro: [
      say("lais", "Rosas vermelhas, cor-de-rosa, margaridas, girassóis... cada flor que ele já me deu está aqui."),
      say("lais", "E alguém escondeu um templo no meio disso tudo. Claro que escondeu.")
    ],
    legend: {
      y: { type: "plate", group: "E", glyph: 5 },
      Y: { type: "gate", group: "E", glyph: 5 },
      q: { type: "flowerSwitch", group: "F", order: 1, color: "#e8456a", interact: true },
      u: { type: "flowerSwitch", group: "F", order: 2, color: "#ff8ac4", interact: true },
      j: { type: "flowerSwitch", group: "F", order: 3, color: "#ffd166", interact: true },
      x: { type: "flowerSwitch", group: "F", order: 4, color: "#ffffff", interact: true },
      F: { type: "gate", group: "F" },
      p: { type: "plate", group: "A" },
      G: { type: "gate", group: "A" },
      b: { type: "enemy", look: "beetle", ai: "chase", hp: 2, speed: 0.6, sight: 6 },
      s: {
        type: "sign",
        lines: [say("placa", "\"Acorde as flores na ordem em que o amor floresce:\nprimeiro a VERMELHA, depois a COR-DE-ROSA,\ndepois a AMARELA e, por último, a BRANCA.\"")]
      }
    },
    groups: { F: { mode: "sequence", message: "As quatro flores desabrocharam! O portão do templo se abriu.", wrong: "As flores se fecharam... ordem errada." }, A: { message: "Os canteiros floresceram e o altar se abriu!" } },
    rooms: {
      "0,0": [
        "###############",
        "#P.#...#.....T#",
        "#.##.#.#.###.##",
        "#....#...#.....",
        "####.#####.#.##",
        "#....#.....#..#",
        "#.##...###.####",
        "#%.#.#.....,%,#",
        "####.##########"
      ],
      "1,0": [
        "###############",
        "#T.j..q..x..uT#",
        "#,............#",
        "...........b..#",
        "#,............F",
        "#%.....s.....%#",
        "#,............#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,0": [
        "###############",
        "#T,,##,R,##,,T#",
        "#,..##,,,##,,,#",
        "#,..###G###..,#",
        "..............#",
        "#,.O.......O..#",
        "#%...p...p...%#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "0,1": [
        "####.##########",
        "#T..,,,,,,,,,T#",
        "#,.TTTT.TTTT..#",
        "#,.T,,,,,,,T..#",
        "#,.T,b.K.b,T..#",
        "#,.T,,,,,,,T...",
        "#,.TTTTTTTTT..#",
        "#T,,,,,,,,,,$T#",
        "###############"
      ],
      "1,1": [
        "#######D#######",
        "#T%%,,,.,,,%%T#",
        "#######|#######",
        "#,.._....._..,#",
        "#,O....O....O,#",
        "...............",
        "#%....._.....%#",
        "#T%%,,,,,,,%%T#",
        "###############"
      ],
      "2,1": [
        "###############",
        "#T%%,,,,,#$,+$#",
        "#,.......#,,,,#",
        "#,..y....##Y###",
        "#,............#",
        "...O....b..O..#",
        "#%.......y...%#",
        "#T%%,,,,,,,%%T#",
        "###############"
      ]
    }
  },

  // ==========================================================================
  {
    id: "bruxas",
    index: 4,
    title: "A Noite das Bruxas",
    subtitle: "A nossa festa de Halloween",
    theme: "bruxas",
    roomsW: 3,
    roomsH: 2,
    boulderLook: "dark",
    crateLook: "wardrobe",
    roseMessage: "Até nos momentos mais malucos e inesperados, é com você que eu quero estar. Obrigado por tornar a vida mais divertida, leve e especial. 🖤",
    intro: [
      say("lais", "Abóboras acesas, teias, fantasminhas... a nossa festa de Halloween!"),
      say("lais", "Tudo bem. Eu não tenho medo. Eu tenho uma espada. E um arco. E... aquilo se mexeu?")
    ],
    legend: {
      a: { type: "spikes", offset: 1 },
      b: { type: "spikes", offset: 2 },
      g: { type: "enemy", look: "ghost", ai: "chase", hp: 2, speed: 0.7, sight: 6 },
      X: { type: "target", look: "lantern", group: "L" },
      G: { type: "gate", group: "L" },
      v: { type: "turret", dir: "down", period: 1.8 },
      V: { type: "turret", dir: "down", period: 1.8, offset: 0.6 },
      Y: { type: "turret", dir: "down", period: 1.8, offset: 1.2 }
    },
    groups: { L: { message: "A lanterna acendeu e o portão rangeu ao abrir!" } },
    rooms: {
      "0,0": [
        "###############",
        "#T,,,,,,#,,,,k#",
        "#,......#,,,,,#",
        "#,..P...###B###",
        "#,............d",
        "#%............#",
        "#,....i.......#",
        "#T,,,,,,,,,,,T#",
        "######.########"
      ],
      "1,0": [
        "###############",
        "#T,,,,,X,,,,,T#",
        "#,...^ab^a....#",
        "#,...^ab^a....#",
        "......g.g.....G",
        "#,............#",
        "#%...........%#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,0": [
        "####v##V##Y####",
        "#T,,.,,.,,.,,T#",
        "#,............#",
        "#,............#",
        "............R.#",
        "#,............#",
        "#%............#",
        "#T,,.,,.,,.,,T#",
        "###############"
      ],
      "0,1": [
        "######.########",
        "#T,,,,.,,,,,,T#",
        "#,............#",
        "#,..g.....g....",
        "#,......#######",
        "#,......#,,,,,#",
        "#,.....B=,,K,$#",
        "#T,,,,,,#,,,,,#",
        "###############"
      ],
      "1,1": [
        "#######D#######",
        "#T,,i,,.,,i,$T#",
        "#######|#######",
        "...........g..#",
        "#,._...O..._..#",
        "#,...._........",
        "#,.O.......O..#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,1": [
        "###v###V###Y###",
        "#T,.,,,.,,,.,T#",
        "#,.....$.....,#",
        "#,.$.......$..#",
        "#,....g.......#",
        "......$.......#",
        "#,..a^b^a^b...#",
        "#T,,,,,+,,,,,T#",
        "###############"
      ]
    }
  },

  // ==========================================================================
  {
    id: "lago",
    index: 5,
    title: "O Caminho Até Você",
    subtitle: "O lago iluminado pela lua",
    theme: "lago",
    roomsW: 3,
    roomsH: 2,
    boulderLook: "moss",
    roseMessage: "Falta pouco para chegar até você. Se eu pudesse escolher qualquer lugar do mundo, no final de todas as minhas aventuras, seria sempre ao seu lado. ❤️",
    intro: [
      say("lais", "O lago sob a lua... e lá no fundo, o castelo. Ele está ali."),
      say("lais", "Última rosa, última chave, última porta. Respira, Lais.")
    ],
    legend: {
      y: { type: "spikes", offset: 1 },
      z: { type: "spikes", offset: 2 },
      b: { type: "enemy", look: "bat", ai: "chase", hp: 1, speed: 0.5, sight: 6 },
      s: { type: "enemy", look: "shade", ai: "chase", hp: 2, speed: 0.6, sight: 7, group: "K" },
      S: { type: "enemy", look: "shade", ai: "patrol", axis: "h", hp: 2, speed: 0.5 },
      p: { type: "plate", group: "A" },
      G: { type: "gate", group: "A" },
      J: { type: "gate", group: "K" },
      H: { type: "gate", group: "C" },
      1: { type: "crystal", group: "C", order: 3, color: "#7ad8ff", on: "~" },
      2: { type: "crystal", group: "C", order: 1, color: "#ff8ad8", on: "~" },
      3: { type: "crystal", group: "C", order: 4, color: "#9affb0", on: "~" },
      4: { type: "crystal", group: "C", order: 2, color: "#ffe066", on: "~" },
      M: {
        type: "altar", group: "C",
        lines: [say("placa", "ALTAR DA MEMÓRIA\n\"Observe os cristais piscarem e repita a ordem com suas flechas.\"")]
      }
    },
    groups: {
      A: { message: "A placa afundou — o portão do leste se abriu!" },
      K: { mode: "clear", message: "As sombras se desfizeram. A jaula da chave se abriu!" },
      C: { mode: "sequence", message: "Os quatro cristais cantam juntos! O santuário da rosa se abriu.", wrong: "Os cristais se apagaram. Observe o altar de novo." }
    },
    rooms: {
      "0,0": [
        "###############",
        "#T,,,,~~~,,,,T#",
        "#,....~~~.....#",
        "#,P.O.~~~......",
        "#,..O.~~~.....#",
        "#,....~~~.....#",
        "#%.O..~~~..b.%#",
        "#T,,,,~~~,,,,T#",
        "###.###########"
      ],
      "1,0": [
        "###############",
        "#T,,,,#,,,,,,T#",
        "#,....#.......#",
        "......d.......#",
        "#,....#...O...#",
        "#,....#.......G",
        "#%....#...p..%#",
        "#T,,,,#,,,,,,T#",
        "###############"
      ],
      "2,0": [
        "###############",
        "#T,,##,R,##,,T#",
        "#,..##,,,##,,,#",
        "#,..###H###..,#",
        "#,............#",
        "....~1~~~2~...#",
        "#,..~3~~~4~..,#",
        "#T,,~~~~~~~,MT#",
        "###############"
      ],
      "0,1": [
        "###.###########",
        "#T,.,,,,,,,,,T#",
        "#^yz^yz^yz^yz^#",
        "#yz^yz^yz^yz^y#",
        "#,...S.........",
        "#,............#",
        "#%.....k.....%#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "1,1": [
        "###############",
        "#T,,,,###,,,,T#",
        "#,....#K#.....#",
        "#,....#J#....,#",
        "...s.......s...",
        "#,.....s......#",
        "#%...........%#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ],
      "2,1": [
        "#######D#######",
        "#T,,,i,.,i,,$T#",
        "#######|#######",
        "#,.._....._..,#",
        ".......O......#",
        "#,...O...O....#",
        "#%....._.....+#",
        "#T,,,,,,,,,,,T#",
        "###############"
      ]
    }
  }
];

export const PHASE_IDS = PHASES.map((p) => p.id);
export const getPhase = (id) => PHASES.find((p) => p.id === id) || PHASES[0];
