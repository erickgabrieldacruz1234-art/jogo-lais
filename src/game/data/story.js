// ============================================================================
// HISTÓRIA E FINAL — todos os textos editáveis em um só lugar.
// ============================================================================

import { say } from "./speakers";

/**
 * Abertura animada (antes da Fase 1): um capítulo por cena.
 * "scene" escolhe o cenário animado em components/OpeningScene.jsx.
 */
export const STORY = [
  {
    scene: "meet",
    chapter: "Capítulo I — O Encontro",
    text: "Era uma vez uma garota ruiva, de cachos rebeldes e coragem do tamanho do mundo, chamada Lais. Numa noite cheia de luzes em Ibiza, os olhos dela encontraram os de um garoto de franja e sorriso bobo chamado Erick."
  },
  {
    scene: "love",
    chapter: "Capítulo II — Apaixonada",
    text: "Ela se apaixonou pelo jeito dele: pelas piadas ruins, pelos abraços demorados e pelas flores que ele vivia aparecendo para dar. Juntos, viajaram, riram até doer a barriga e colecionaram lembranças como quem coleciona estrelas."
  },
  {
    scene: "surprise",
    chapter: "Capítulo III — A Surpresa",
    text: "Numa noite de lua cheia, Erick preparava escondido a maior surpresa de todas: cinco rosas mágicas, uma para cada lembrança especial dos dois. Ele só precisava de coragem para entregá-las."
  },
  {
    scene: "kidnap",
    chapter: "Capítulo IV — A Rainha do Esquecimento",
    text: "Mas a Rainha do Esquecimento, que detesta histórias de amor, desceu do céu numa nuvem de sombras. Levou Erick para o seu castelo e espalhou as cinco rosas pelos lugares mais especiais da história deles."
  },
  {
    scene: "quest",
    chapter: "Capítulo V — A Promessa",
    text: "Lais não chorou por muito tempo. Prendeu os cachos, pegou o arco e olhou para o castelo no horizonte. Se o Esquecimento queria apagar a história dos dois, ia ter que passar por ela primeiro."
  }
];

/** Fala final da abertura, antes da Fase 1. */
export const OPENING = [
  say("lais", "Cinco rosas, cinco lembranças... e um namorado sequestrado. Tá bom, Rainha do Esquecimento. Você mexeu com a ruiva errada."),
  say("lais", "Aguenta firme, Erick. Eu vou buscar cada rosa — e depois vou buscar você.")
];

/** Cena final: primeira parte (antes do buquê). */
export const FINAL_PART_1 = [
  say("erick", "Lais… você conseguiu! Eu sabia que você chegaria até mim."),
  say("lais", "É claro que eu viria. Eu nunca deixaria você para trás."),
  say("erick", "Durante essa aventura, você encontrou cinco rosas. Cada uma representa uma coisa que eu sinto por você."),
  say("lais", "Cinco rosas? O que você está aprontando?")
];

/** Cena final: segunda parte (depois do buquê). */
export const FINAL_PART_2 = [
  say("erick", "Eu queria que cada rosa lembrasse uma parte da nossa história… o dia em que nos conhecemos, as viagens, as flores que já te dei e todos os momentos que ainda quero viver com você."),
  say("narrador", "…"),
  say("erick", "Mas, mais do que qualquer presente, eu quero continuar construindo essa história ao seu lado."),
  say("erick", "Lais, você aceita namorar comigo? ❤️")
];

export const PROPOSAL = {
  question: "LAIS, ACEITA NAMORAR COMIGO?",
  answers: ["SIM, MEU AMOR! ❤️", "CLARO QUE SIM! 💖"]
};

export const ENDING = {
  title: "FIM DA AVENTURA… MAS APENAS O COMEÇO DA NOSSA HISTÓRIA. ❤️",
  signature: "Com amor, para Lais. De Erick.",
  highlight: "Você é a minha escolha favorita, hoje e sempre."
};
