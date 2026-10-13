// Primitivas de pixel art para desenhar em canvas na resolução do mundo (1 unidade = 1 pixel).

export function R(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Elipse preenchida linha a linha (bordas serrilhadas = estilo pixel art). */
export function E(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  rx = Math.max(0.5, rx);
  ry = Math.max(0.5, ry);
  const r0 = Math.ceil(ry);
  for (let dy = -r0; dy <= r0; dy++) {
    const t = dy / ry;
    if (Math.abs(t) > 1) continue;
    const half = Math.round(rx * Math.sqrt(1 - t * t));
    if (half <= 0) continue;
    g.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
  }
}

/** Linha grossa feita de quadrados. */
export function L(g, x0, y0, x1, y1, size, c) {
  g.fillStyle = c;
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    g.fillRect(Math.round(x0 + (x1 - x0) * t - size / 2), Math.round(y0 + (y1 - y0) * t - size / 2), size, size);
  }
}

/** PRNG determinístico (mesmo mapa sempre igual). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return { c, g };
}
