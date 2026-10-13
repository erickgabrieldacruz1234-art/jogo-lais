// ============================================================================
// CAMPANHA BÔNUS — "NOSSA PRIMEIRA AVENTURA JUNTOS"
// Cooperativo local: Lais (jogador 1) e Erick (jogador 2).
// Mesmo formato das fases principais (salas 15x9 em texto). Letras extras:
//   Q  início do Erick     w  pilha de madeira     z  semente
//   s  pedra especial      C  baú                  H  terreno/casa
//   1-5 canteiros de rosa  n/m banco (2 lugares)   f  cerca
//   g  quadro de missões
// ============================================================================

import { say } from "./speakers";

const enemy = (look, ai, extra = {}) => ({ type: "enemy", look, ai, hp: 1, speed: 0.6, ...extra });

const HOME_LEGEND = {
  H: { type: "houseBlock" },
  1: { type: "plot", index: 0 },
  2: { type: "plot", index: 1, rubble: true },
  3: { type: "plot", index: 2 },
  4: { type: "plot", index: 3, rubble: true },
  5: { type: "plot", index: 4 },
  n: { type: "bench" },
  m: { type: "benchPart" },
  f: { type: "fence" },
  g: { type: "board" }
};

const homeRoom = (openRight) => [
  "###############",
  "#T%,,,,,,,,,%T#",
  "#....HHHHH..g.#",
  "#....HHHHH....#",
  "#............." + (openRight ? "." : "#"),
  "#.1.2.3.4.5...#",
  "#.....PQ......#",
  "#T,,,,,,f,nm,f#",
  "###############"
];

const HOUSE_LINES = [
  [say("lais", "Ainda é só um terreno... mas já dá pra imaginar a nossa casinha aqui."), say("erick", "Com o mapa da construção, a gente sabe por onde começar.")],
  [say("erick", "A fundação está firme. Agora é só continuar trazendo material!")],
  [say("lais", "Paredes e porta! Já parece um lar de verdade.")],
  [say("erick", "Telhado e janelas prontos. Quero ver o pôr do sol daqui.")],
  [say("lais", "Lareira acesa, flores na janela... é a nossa casa, Erick."), say("erick", "A nossa casa. ❤️")]
];

// ---------------------------------------------------------------------------- MISSÃO 1
const M1 = {
  id: "m1",
  index: 1,
  title: "A Floresta dos Monstrinhos",
  subtitle: "Missão 1",
  theme: "floresta",
  roomsW: 2,
  roomsH: 2,
  startQuip: "Fica perto de mim, tá? Vamos juntos!",
  intro: [
    say("erick", "Lais... agora que estamos juntos, que tal a gente procurar um lugar só nosso?"),
    say("lais", "Dizem que depois da floresta existe uma clareira linda. Mas tem monstrinhos no caminho!"),
    say("narrador", "Derrotem os monstrinhos, achem a chave nas ruínas, abram o baú, resolvam o enigma das alavancas e vençam o guardião da floresta.")
  ],
  legend: {
    e: enemy("slime", "wander"),
    r: enemy("beetle", "patrol"),
    k: { type: "smallKey" },
    C: { type: "chest", locked: true, flag: "chest", gives: { wood: 3 }, message: "O baú tinha o primeiro lote de madeira! (+3)" },
    a: { type: "lever", group: "L", link: "a", links: ["a", "b"] },
    b: { type: "lever", group: "L", link: "b", links: ["a", "b", "c"], startOn: true },
    c: { type: "lever", group: "L", link: "c", links: ["b", "c"] },
    G: { type: "gate", group: "L" },
    Y: {
      type: "sign",
      lines: [say("placa", "AS TRÊS ALAVANCAS TEIMOSAS\nCada alavanca também mexe nas vizinhas.\nDeixem as três ligadas para abrir o portão.\n(Se embolar, a pausa reinicia o enigma.)")]
    },
    X: enemy("bigslime", "chase", { boss: true, hp: 8, speed: 0.9, sight: 14, drops: "map", every: 3.2, color: "#7aff9a", defeatText: "O Rei Geleca foi derrotado! Ele deixou cair um mapa..." })
  },
  groups: { L: { message: "As três alavancas ligadas! O portão se abriu." } },
  mission: {
    objectives: [
      { id: "kills", kind: "kills", label: "Monstrinhos derrotados", target: 5 },
      { id: "key", kind: "count", item: "keyFound", label: "Chave das ruínas" },
      { id: "chest", kind: "flag", flag: "chest", label: "Baú aberto" },
      { id: "levers", kind: "group", group: "L", label: "Alavancas", states: ["desligadas", "resolvido"] },
      { id: "boss", kind: "boss", label: "Guardião da floresta" },
      { id: "map", kind: "count", item: "map", label: "Mapa da construção" },
      { id: "secret", kind: "count", item: "diamonds", label: "Segredo da floresta", optional: true }
    ]
  },
  rooms: {
    "0,0": [
      "###############",
      "#$#,,,,,,,,,,T#",
      "#=#..%....%...#",
      "#...P.Q.......#",
      "#,.............",
      "#%..e.....e..%#",
      "#,............#",
      "#T,,,,,..,,,,T#",
      "#######.#######"
    ],
    "1,0": [
      "###############",
      "#T,,,,#k#,,,,T#",
      "#.....#W#.....#",
      "#.............#",
      "..r.........r.#",
      "#......###.####",
      "#,.....#..O.C##",
      "#T,,,,,#.....##",
      "###############"
    ],
    "0,1": [
      "#######.#######",
      "#T,,,,,.,,,,,T#",
      "#.............#",
      "#...a..b..c...#",
      "#.............G",
      "#....Y........#",
      "#......e......#",
      "#T,,,,,,,,,,,T#",
      "###############"
    ],
    "1,1": [
      "###############",
      "#T,,,,,,,,,,,T#",
      "#.............#",
      "#.....,,,.....#",
      "........X.....#",
      "#.....,,,.....#",
      "#.+...........#",
      "#.............#",
      "#######D#######"
    ]
  },
  outro: [
    say("erick", "Acho que encontramos o lugar perfeito para o nosso cantinho."),
    say("lais", "Então vamos fazer dele um lugar especial para nós dois!")
  ]
};

// ---------------------------------------------------------------------------- MISSÃO 2
const M2 = {
  id: "m2",
  index: 2,
  title: "A Madeira Perdida",
  subtitle: "Missão 2",
  theme: "deposito",
  roomsW: 2,
  roomsH: 2,
  startQuip: "Bora buscar madeira pra nossa casa!",
  intro: [
    say("lais", "Pra construir a casa, a gente precisa de madeira. Muita madeira!"),
    say("erick", "O velho depósito do lenhador fica aqui perto. Mas tá cheio de criaturas e travas."),
    say("narrador", "Empurrem as caixas nos botões, achem as 3 pilhas de madeira, derrotem as criaturas e acertem os alvos com flechas para abrir o cofre.")
  ],
  legend: {
    w: { type: "wood", pile: true, amount: 2 },
    p: { type: "plate", group: "A" },
    G: { type: "gate", group: "A" },
    q: { type: "plate", group: "J", player: true },
    J: { type: "gate", group: "J" },
    X: { type: "target", group: "TG" },
    V: { type: "gate", group: "TG" },
    C: { type: "chest", flag: "secret", gives: { wood: 2 }, message: "Baú secreto! Madeira extra (+2)." },
    e: enemy("crab", "wander"),
    c: enemy("beetle", "chase", { sight: 5, speed: 0.75 }),
    Y: {
      type: "sign",
      lines: [say("placa", "PORTÃO DE PRESSÃO\nEle só fica aberto enquanto alguém pisa num dos botões.\nUm segura, o outro passa. Trabalho em equipe!")]
    }
  },
  groups: {
    A: { message: "As duas caixas nos botões! A porta do depósito se abriu." },
    J: { mode: "any" },
    TG: { message: "Na mosca! O cofre do depósito se abriu." }
  },
  mission: {
    objectives: [
      { id: "door", kind: "group", group: "A", label: "Porta do depósito", states: ["bloqueada", "aberta"] },
      { id: "wood", kind: "count", item: "piles", label: "Madeira encontrada", target: 3 },
      { id: "kills", kind: "kills", label: "Criaturas derrotadas", target: 5 },
      { id: "vault", kind: "group", group: "TG", label: "Cofre dos alvos", states: ["fechado", "aberto"] },
      { id: "secret", kind: "flag", flag: "secret", label: "Baú secreto", optional: true }
    ]
  },
  rooms: {
    "0,0": [
      "###############",
      "#T,,,,,,,,,,,T#",
      "#..p......p...#",
      "#.............#",
      "#..B..PQ..B...G",
      "#.............#",
      "#..e.......e..#",
      "#T,,,,w,,,,,,T#",
      "#######.#######"
    ],
    "1,0": [
      "###############",
      "#X,,,,#C#,,,,X#",
      "#.....#W#.....#",
      "#.............#",
      "...............",
      "#....e....##V##",
      "#.........#,w,#",
      "#T,,,,,,,,#,,,#",
      "###############"
    ],
    "0,1": [
      "#######.#######",
      "#T,,,,,.,,,,,T#",
      "#.............D",
      "#..q...c..Y...#",
      "#######J#######",
      "#,,,,,,,,,,,,,#",
      "#..q.....w....#",
      "#T,,,c,,,,,,,T#",
      "###############"
    ]
  },
  outro: [
    say("lais", "Se a gente continuar trabalhando assim junto, nossa casa vai ficar linda!"),
    say("erick", "Com você do meu lado, até carregar madeira fica divertido.")
  ]
};
// a saída leste do depósito (1,0) não leva a lugar nenhum: fecha a borda
M2.rooms["1,0"][4] = "..............#";

// ---------------------------------------------------------------------------- MISSÃO 3
const M3 = {
  id: "m3",
  index: 3,
  title: "As Pedras do Construtor",
  subtitle: "Missão 3",
  theme: "mina",
  roomsW: 2,
  roomsH: 2,
  startQuip: "Cuidado com as gárgulas! Vamos tapar o fogo com as pedras.",
  intro: [
    say("erick", "Uma casa precisa de alicerce. Na mina antiga existem quatro pedras especiais do construtor."),
    say("lais", "Mina escura, armadilhas, guardião... ainda bem que eu tenho você do lado."),
    say("narrador", "Empurrem pedras na frente das gárgulas de fogo, encontrem as 4 pedras especiais e acertem os cristais na ordem certa para abrir a saída.")
  ],
  legend: {
    s: { type: "stone" },
    a: { type: "spikes", offset: 1.5 },
    b: enemy("bat", "wander", { speed: 0.5 }),
    g: enemy("golem", "chase", { boss: true, hp: 10, speed: 1.0, sight: 6, drops: "stone", every: 3.6, color: "#ff9ad8", defeatText: "O Guardião de Pedra caiu! Ele protegia a última pedra especial." }),
    1: { type: "crystal", group: "C", order: 2, color: "#ffe066" },
    2: { type: "crystal", group: "C", order: 4, color: "#9affb0" },
    3: { type: "crystal", group: "C", order: 1, color: "#ff8ad8" },
    4: { type: "crystal", group: "C", order: 3, color: "#7ad8ff" },
    G: { type: "gate", group: "C" },
    Y: {
      type: "sign",
      lines: [say("placa", "A PORTA DO CONSTRUTOR\nToque os cristais na ordem das cores do pôr do sol:\nROSA, AMARELO, AZUL e por último VERDE.\n(Espada ou flecha acendem os cristais.)")]
    }
  },
  groups: { C: { mode: "sequence", message: "Os cristais cantaram em ordem! A saída se abriu.", wrong: "Os cristais apagaram... ordem errada." } },
  mission: {
    objectives: [
      { id: "stones", kind: "count", item: "stone", label: "Pedras especiais", target: 4 },
      { id: "turrets", kind: "turrets", label: "Gárgulas bloqueadas", target: 2 },
      { id: "boss", kind: "boss", label: "Guardião de Pedra" },
      { id: "crystals", kind: "group", group: "C", label: "Cristais da saída", states: ["fora de ordem", "em ordem"] }
    ]
  },
  rooms: {
    "0,0": [
      "#####v###v#####",
      "#T...,...,...T#",
      "#.............#",
      "#..O.......O..#",
      "#.PQ...........",
      "#.............#",
      "#....,,s,,....#",
      "#T,,,,,,,,,,,T#",
      "###############"
    ],
    "1,0": [
      "###############",
      "#T,,,,,,,,,,,T#",
      "#..^a^a^a^a^.b#",
      "#..a^a^a^a^a..#",
      "...^a^asa^a^..#",
      "#..a^a^a^a^a..#",
      "#b.^a^a^a^a^..#",
      "#T,,,,,,,,,,,.#",
      "#############.#"
    ],
    "1,1": [
      "#############.#",
      "#T,,,,,,,,,,,.#",
      "#.............#",
      "#.............#",
      "..............#",
      "#......g......#",
      "#.............#",
      "#T,,,,,s,,,,,T#",
      "###############"
    ],
    "0,1": [
      "######D########",
      "#T,,,,G,,,,,,T#",
      "#.............#",
      "#..1..2..3..4.#",
      "#..............",
      "#.....Y.......#",
      "#.............#",
      "#T,,,,,,,,,,,T#",
      "###############"
    ]
  },
  outro: [
    say("erick", "Ainda falta muita coisa, mas já estamos construindo algo nosso."),
    say("lais", "E o melhor é que estamos fazendo isso juntos.")
  ]
};

// ---------------------------------------------------------------------------- MISSÃO 4
const M4 = {
  id: "m4",
  index: 4,
  title: "O Jardim das Cinco Rosas",
  subtitle: "Missão 4",
  theme: "lar",
  roomsW: 3,
  roomsH: 1,
  house: true,
  startQuip: "Nosso jardim vai ser o mais lindo do mundo!",
  intro: [
    say("lais", "A casa está pronta... mas falta o jardim. E eu sei exatamente quais flores quero plantar."),
    say("erick", "As cinco rosas que você conquistou para me salvar. Elas merecem o lugar mais bonito."),
    say("narrador", "Encontrem 3 sementes, consertem o canal de irrigação, quebrem as pedras dos canteiros, afastem os últimos monstrinhos, juntem madeira para a cerca e o banco e plantem as cinco rosas.")
  ],
  legend: {
    ...HOME_LEGEND,
    z: { type: "seed" },
    w: { type: "wood", amount: 1 },
    e: enemy("slime", "wander"),
    c: enemy("beetle", "chase", { sight: 5 }),
    S: { type: "source", dir: "right" },
    o: { type: "outlet", dir: "left" },
    a: { type: "pipe", shape: "I", rot: 0 },
    b: { type: "pipe", shape: "L", rot: 0 },
    h: { type: "pipe", shape: "I", rot: 1 },
    d: { type: "pipe", shape: "L", rot: 2 },
    j: { type: "pipe", shape: "I", rot: 0 },
    t: { type: "pipe", shape: "T", rot: 1 },
    l: { type: "pipe", shape: "L", rot: 1 },
    u: { type: "pipe", shape: "I", rot: 1 },
    x: { type: "pipe", shape: "L", rot: 0 },
    Y: {
      type: "sign",
      lines: [say("placa", "CANAL DO JARDIM\nGirem os canos (E / Ctrl direito) até a água ir da nascente até a comporta.\nCanos com água ficam azuis.")]
    }
  },
  mission: {
    plant: true,
    plantNeeds: ["seeds", "irr"],
    benchWood: 2,
    finale: true,
    objectives: [
      { id: "seeds", kind: "count", item: "seed", label: "Sementes", target: 3 },
      { id: "irr", kind: "flag", flag: "irrigated", label: "Canal de irrigação", states: ["seco", "funcionando"] },
      { id: "rubble", kind: "count", item: "rubble", label: "Pedras removidas", target: 2 },
      { id: "kills", kind: "kills", label: "Últimos monstrinhos", target: 4 },
      { id: "bench", kind: "flag", flag: "bench", label: "Cerca e banco (2 madeiras)" },
      { id: "planted", kind: "planted", label: "Rosas plantadas", target: 5 }
    ]
  },
  rooms: {
    "0,0": homeRoom(true),
    "1,0": [
      "###############",
      "#T,,,,,,,,,,,T#",
      "#.Sab..xo.....#",
      "#...h..u...Y..#",
      "....dtjl.......",
      "#.............#",
      "#..e...z...e..#",
      "#T,,,,,,,,,,,T#",
      "###############"
    ],
    "2,0": [
      "###############",
      "#T,,,w,,,,w,,T#",
      "#.............#",
      "#..z......z...#",
      "..............#",
      "#....c...c....#",
      "#.............#",
      "#T,,,,,,,,,,,T#",
      "###############"
    ]
  },
  outro: [
    say("erick", "No começo, eu só queria que você me encontrasse."),
    say("lais", "E agora?"),
    say("erick", "Agora quero descobrir tudo o que ainda podemos construir juntos.")
  ]
};

// Clareira (lar) entre as missões: só a sala da casa.
const HUB = {
  id: "lar",
  index: 0,
  title: "Nosso Cantinho",
  subtitle: "A clareira",
  theme: "lar",
  roomsW: 1,
  roomsH: 1,
  house: true,
  hub: true,
  legend: HOME_LEGEND,
  rooms: { "0,0": homeRoom(false) },
  houseLines: HOUSE_LINES
};
M4.houseLines = HOUSE_LINES;

export const BONUS_MISSIONS = [M1, M2, M3, M4];
export const BONUS_HUB = HUB;

/**
 * Roteiro da campanha. progress.bonus.step aponta para um destes passos.
 * hub.deliver = etapa da casa depois da entrega de materiais.
 */
export const BONUS_STEPS = [
  { kind: "intro" },
  { kind: "mission", mission: 0 },
  { kind: "hub", after: 0, deliver: 0, reward: "Recompensas: mapa da construção, primeiro lote de madeira e a clareira desbloqueada!" },
  { kind: "mission", mission: 1 },
  { kind: "hub", after: 1, deliver: 1, reward: "Madeira entregue! A fundação da casa foi construída." },
  { kind: "mission", mission: 2 },
  { kind: "hub", after: 2, deliver: 3, reward: "Pedras entregues! Paredes, porta, telhado e janelas prontos." },
  { kind: "mission", mission: 3 },
  { kind: "free" }
];

export const BONUS_INTRO = {
  title: "Nossa Primeira Aventura Juntos",
  text: "Ela disse sim! ❤️ Agora Lais e Erick vão construir, lado a lado, o primeiro cantinho dos dois. Esta aventura é para jogar em DUPLA, no mesmo teclado.",
  controls: [
    { who: "Jogador 1 — Lais", color: "#ff8aa8", keys: [["Andar", "W A S D"], ["Espada", "Espaço"], ["Flecha", "F"], ["Interagir", "E"]] },
    { who: "Jogador 2 — Erick", color: "#7ad8ff", keys: [["Andar", "Setas"], ["Espada", "Enter"], ["Flecha", "Shift direito"], ["Interagir", "Ctrl direito"]] }
  ],
  tips: ["Esc pausa (lá dá para reiniciar o puzzle da sala).", "Fiquem juntos: a câmera mostra os dois.", "Se alguém cair, volta em 3 segundos."]
};

export const BONUS_FINAL_MESSAGE = "Nossa aventura está apenas começando. ❤️";

export const newBonus = () => ({ step: 0, houseStage: 0, planted: [], built: {}, totals: { wood: 0, stone: 0, seed: 0, kills: 0, delivered: 0 }, done: false });
