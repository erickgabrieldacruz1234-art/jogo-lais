// ============================================================================
// PERSONAGENS QUE FALAM
// Cada fala nos arquivos de fase usa: say("lais", "texto").
// Para adicionar um personagem novo, inclua uma entrada aqui.
// ============================================================================

const P = (name) => `/assets/sprites/portraits/${name}.png`;

export const SPEAKERS = {
  lais: { name: "Lais", portrait: P("lais_v2") },
  erick: { name: "Erick", portrait: P("erick_v2") },
  bilhete: { name: "Bilhete de Erick", portrait: P("erick_v2") },
  espirito: { name: "Espírito das Lembranças", portrait: P("portrait_spirit") },
  placa: { name: "Placa", portrait: null },
  narrador: { name: "", portrait: null },
  caranguejo: { name: "Seu Caranguejo", portrait: null },
  jardineiro: { name: "Gnomo Jardineiro", portrait: null },
  fantasma: { name: "Fantasminha Bóris", portrait: null },
  coruja: { name: "Coruja Anciã", portrait: null },
  mecanismo: { name: "Mecanismo Antigo", portrait: null },
  travesso: { name: "Espírito Travesso", portrait: null },
  guardiao: { name: "Guardião da Noite", portrait: null },
  bruxa: { name: "Bruxa Brincalhona", portrait: null },
  sombra: { name: "Sombra do Destino", portrait: null },
  visao: { name: "Visão", portrait: null }
};

export function say(speakerId, text) {
  const s = SPEAKERS[speakerId] || { name: speakerId, portrait: null };
  return { speaker: s.name, portrait: s.portrait, text };
}
