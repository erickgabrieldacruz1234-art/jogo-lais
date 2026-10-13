// ============================================================================
// ARTE DA CAMPANHA "NOSSA PRIMEIRA AVENTURA JUNTOS"
// Materiais, baú, canos de irrigação, canteiros, banco, cerca, quadro de
// missões e a CASA, que muda de verdade a cada etapa de construção.
// (cx, by) = centro do tile e base; (x, y) = canto do tile.
// ============================================================================

import { R, E, L } from "./pixel";
import { drawRose, T } from "./tileArt";

const OUT = "#1a0e10";
const glow = (g, x, y, r, c, a) => {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, c);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = a;
  g.fillStyle = grd;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.globalAlpha = 1;
};

export function drawWood(g, cx, by, t) {
  const fy = Math.round(Math.sin(t * 2 + cx) * 1);
  E(g, cx, by - 2, 13, 3, "rgba(0,0,0,0.3)");
  glow(g, cx, by - 10, 18, "#ffd08a", 0.25);
  const logs = [[-7, -5], [7, -5], [0, -12]];
  for (const [ox, oy] of logs) {
    R(g, cx + ox - 9, by + oy - 4 + fy, 18, 8, OUT);
    R(g, cx + ox - 8, by + oy - 3 + fy, 16, 6, "#8a5a34");
    R(g, cx + ox - 8, by + oy - 3 + fy, 16, 2, "#a8743f");
    E(g, cx + ox + 8, by + oy + fy, 3.5, 4, OUT);
    E(g, cx + ox + 8, by + oy + fy, 2.5, 3, "#e0b878");
    R(g, cx + ox + 7, by + oy - 1 + fy, 2, 1, "#a8743f");
  }
  R(g, cx - 2, by - 20 + fy, 3, 3, "#4a9a3a");
}

export function drawSpecialStone(g, cx, by, t) {
  const fy = Math.round(Math.sin(t * 2.5 + cx) * 2);
  E(g, cx, by - 2, 9, 2.5, "rgba(0,0,0,0.3)");
  glow(g, cx, by - 12 + fy, 18, "#ffd36a", 0.45);
  E(g, cx, by - 11 + fy, 10, 9, OUT);
  E(g, cx, by - 11 + fy, 9, 8, "#8a8a99");
  E(g, cx - 2, by - 14 + fy, 5, 3, "#b4b4c4");
  L(g, cx - 6, by - 8 + fy, cx + 2, by - 14 + fy, 1, "#ffd36a");
  L(g, cx + 2, by - 14 + fy, cx + 6, by - 9 + fy, 1, "#ffd36a");
  R(g, cx - 1, by - 12 + fy, 2, 2, "#fff6c0");
  if (Math.sin(t * 6 + cx) > 0.7) R(g, cx + 7, by - 20 + fy, 1, 1, "#ffffff");
}

export function drawSeed(g, cx, by, t) {
  const fy = Math.round(Math.sin(t * 3 + cx) * 1.5);
  E(g, cx, by - 2, 7, 2, "rgba(0,0,0,0.3)");
  glow(g, cx, by - 10 + fy, 14, "#a0ff9a", 0.45);
  E(g, cx, by - 8 + fy, 7, 6, OUT);
  E(g, cx, by - 8 + fy, 6, 5, "#c9a070");
  R(g, cx - 4, by - 14 + fy, 8, 2, "#8a5a34");
  R(g, cx - 1, by - 19 + fy, 2, 5, "#3a8a3a");
  E(g, cx - 3, by - 19 + fy, 2.5, 1.5, "#6cd05a");
  E(g, cx + 3, by - 18 + fy, 2.5, 1.5, "#6cd05a");
}

export function drawMapItem(g, cx, by, t) {
  const fy = Math.round(Math.sin(t * 2 + cx) * 2);
  E(g, cx, by - 2, 9, 2, "rgba(0,0,0,0.3)");
  glow(g, cx, by - 12 + fy, 18, "#fff2c0", 0.5);
  R(g, cx - 10, by - 16 + fy, 20, 9, OUT);
  R(g, cx - 9, by - 15 + fy, 18, 7, "#f2e4c4");
  E(g, cx - 9, by - 11.5 + fy, 2.5, 4.5, "#d8c49a");
  E(g, cx + 9, by - 11.5 + fy, 2.5, 4.5, "#d8c49a");
  R(g, cx - 1, by - 16 + fy, 2, 9, "#c81d3a");
  R(g, cx - 6, by - 13 + fy, 3, 1, "#8a6a44");
  R(g, cx + 3, by - 12 + fy, 4, 1, "#8a6a44");
}

export function drawChest(g, cx, by, open, locked, t) {
  E(g, cx, by - 1, 13, 3, "rgba(0,0,0,0.3)");
  if (!open) glow(g, cx, by - 10, 20, "#ffe9a0", 0.25 + Math.sin(t * 3) * 0.1);
  R(g, cx - 12, by - 18, 24, 18, OUT);
  R(g, cx - 11, by - 11, 22, 10, "#a8743f");
  R(g, cx - 11, by - 11, 22, 1, "#f5c542");
  R(g, cx - 11, by - 5, 22, 1, "#6b4226");
  if (open) {
    R(g, cx - 12, by - 26, 24, 9, OUT);
    R(g, cx - 11, by - 25, 22, 7, "#6b4226");
    R(g, cx - 10, by - 17, 20, 5, "#1a0e06");
    for (let i = 0; i < 4; i++) R(g, cx - 6 + i * 4, by - 16 + (i % 2), 2, 2, "#ffd36a");
  } else {
    R(g, cx - 11, by - 17, 22, 6, "#8a5a34");
    R(g, cx - 11, by - 17, 22, 1, "#c99561");
    R(g, cx - 3, by - 14, 6, 6, locked ? "#c9c9d6" : "#f5c542");
    R(g, cx - 1, by - 12, 2, 3, OUT);
  }
}

// ---------------------------------------------------------------- canos
export const PIPE_DIRS = {
  I: [["up", "down"], ["left", "right"], ["up", "down"], ["left", "right"]],
  L: [["up", "right"], ["right", "down"], ["down", "left"], ["left", "up"]],
  T: [["left", "right", "down"], ["up", "down", "left"], ["left", "right", "up"], ["up", "down", "right"]]
};
const ARM = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function channel(g, x, y, dirs, wet, t, stone = "#8a8a99") {
  const cx = x + 16, cy = y + 16;
  const draw = (w, c) => {
    R(g, cx - w, cy - w, w * 2, w * 2, c);
    for (const d of dirs) {
      const [dx, dy] = ARM[d];
      if (dx) R(g, dx > 0 ? cx : x, cy - w, 16, w * 2, c);
      else R(g, cx - w, dy > 0 ? cy : y, w * 2, 16, c);
    }
  };
  draw(8, "#3a3440");
  draw(7, stone);
  draw(4, "#2a2228");
  if (wet) {
    draw(4, "#3a9ad6");
    for (let i = 0; i < 3; i++) {
      const k = (t * 1.5 + i / 3) % 1;
      R(g, cx - 1 + Math.sin(k * 6) * 2, cy - 1, 2, 1, "#bfe8ff");
    }
    glow(g, cx, cy, 14, "#7ad8ff", 0.25);
  }
}

export function drawPipe(g, x, y, shape, rot, wet, t, fixed) {
  channel(g, x, y, PIPE_DIRS[shape][rot % 4], wet, t, fixed ? "#6a6a78" : "#a8a8b8");
  if (!fixed) {
    R(g, x + 2, y + 2, 2, 2, "#c9c9d6");
    R(g, x + 28, y + 28, 2, 2, "#c9c9d6");
  }
}

export function drawSource(g, x, y, dir, t) {
  channel(g, x, y, [dir], true, t);
  E(g, x + 16, y + 16, 9, 8, "#2a2a36");
  E(g, x + 16, y + 15, 8, 7, "#7d8094");
  E(g, x + 16, y + 15, 5, 4, "#3a9ad6");
  for (let i = 0; i < 3; i++) R(g, x + 13 + i * 3, y + 12 - ((t * 10 + i * 3) % 5), 1, 1, "#ffffff");
}

export function drawOutlet(g, x, y, dir, wet, t) {
  channel(g, x, y, [dir], wet, t);
  R(g, x + 6, y + 6, 20, 20, "#2a2a36");
  R(g, x + 7, y + 7, 18, 18, wet ? "#3a9ad6" : "#4a4458");
  if (wet) for (let i = 0; i < 2; i++) R(g, x + 10 + i * 8, y + 12 + Math.sin(t * 3 + i) * 2, 4, 1, "#bfe8ff");
  R(g, x + 6, y + 6, 20, 2, "#7d8094");
}

// ---------------------------------------------------------------- jardim
export function drawPlot(g, x, y, watered, roseKind, grow, t, rubble) {
  R(g, x + 3, y + 5, 26, 22, "#3a2216");
  R(g, x + 4, y + 6, 24, 20, watered ? "#4a2e1e" : "#7a5a3e");
  for (let i = 0; i < 3; i++) R(g, x + 6, y + 10 + i * 6, 20, 1, watered ? "#3a2216" : "#5e4430");
  if (watered && !roseKind) {
    if (Math.sin(t * 3 + x) > 0.6) R(g, x + 8 + ((t * 7) % 14), y + 12, 1, 1, "#9ad8ff");
    R(g, x + 8, y + 22, 3, 1, "#5a9ad8");
  }
  if (roseKind) {
    const k = Math.min(1, grow);
    if (k < 0.4) {
      R(g, x + 15, y + 20 - k * 20, 2, 4 + k * 20, "#3a8a3a");
      E(g, x + 13, y + 18 - k * 10, 2, 1.5, "#6cd05a");
    } else {
      R(g, x + 15, y + 6, 2, 16, "#2f6b24");
      E(g, x + 11, y + 14, 3, 1.5, "#4a9a3a");
      E(g, x + 20, y + 11, 3, 1.5, "#4a9a3a");
      const s = 0.5 + (k - 0.4) * 1.0;
      glow(g, x + 16, y + 2, 14, "#ffb0c8", 0.35);
      drawRose(g, x + 16, y + 3 + Math.sin(t * 2 + x) * 0.6, roseKind, Math.min(0.95, s), t, false);
    }
  }
  if (rubble) drawRubble(g, x + 16, y + 30, rubble, t);
}

export function drawRubble(g, cx, by, hp, t) {
  E(g, cx, by - 2, 12, 3, "rgba(0,0,0,0.3)");
  for (const [ox, oy, r] of [[-6, -6, 6], [6, -6, 6], [0, -12, 7]]) {
    E(g, cx + ox, by + oy, r + 1, r, OUT);
    E(g, cx + ox, by + oy, r, r - 1, "#7d7268");
    E(g, cx + ox - 2, by + oy - 2, r / 2, r / 3, "#a8a090");
  }
  if (hp < 2) {
    L(g, cx - 4, by - 16, cx + 1, by - 8, 1, OUT);
    L(g, cx + 1, by - 8, cx + 5, by - 4, 1, OUT);
  }
}

export function drawBench(g, cx, by, sunset) {
  E(g, cx, by - 1, 16, 3, "rgba(0,0,0,0.3)");
  R(g, cx - 16, by - 20, 32, 4, OUT);
  R(g, cx - 15, by - 19, 30, 2, "#a8743f");
  R(g, cx - 16, by - 12, 32, 5, OUT);
  R(g, cx - 15, by - 11, 30, 3, "#c99561");
  for (const ox of [-13, 11]) R(g, cx + ox, by - 8, 3, 8, OUT);
  R(g, cx - 14, by - 26, 2, 14, OUT);
  R(g, cx + 12, by - 26, 2, 14, OUT);
  if (sunset) R(g, cx - 15, by - 19, 30, 1, "#ffd08a");
}

/** Só a frente do assento (desenhada por cima dos personagens sentados). */
export function drawBenchFront(g, cx, by) {
  R(g, cx - 16, by - 12, 32, 5, OUT);
  R(g, cx - 15, by - 11, 30, 3, "#c99561");
  for (const ox of [-13, 11]) R(g, cx + ox, by - 8, 3, 8, OUT);
}

export function drawFence(g, x, y) {
  R(g, x, y + 14, T, 3, OUT);
  R(g, x, y + 22, T, 3, OUT);
  R(g, x, y + 14, T, 2, "#e8dcc4");
  R(g, x, y + 22, T, 2, "#e8dcc4");
  for (const ox of [4, 20]) {
    R(g, x + ox, y + 8, 6, 22, OUT);
    R(g, x + ox + 1, y + 9, 4, 20, "#f4ecdc");
    R(g, x + ox + 1, y + 7, 4, 2, "#f4ecdc");
  }
}

export function drawBoard(g, cx, by, t, glowOn) {
  E(g, cx, by - 1, 12, 3, "rgba(0,0,0,0.3)");
  R(g, cx - 10, by - 14, 3, 14, OUT);
  R(g, cx + 7, by - 14, 3, 14, OUT);
  R(g, cx - 14, by - 32, 28, 20, OUT);
  R(g, cx - 13, by - 31, 26, 18, "#8a5a34");
  R(g, cx - 11, by - 29, 10, 8, "#f2e4c4");
  R(g, cx + 1, by - 28, 10, 12, "#f2e4c4");
  R(g, cx - 9, by - 27, 6, 1, "#8a6a44");
  R(g, cx + 3, by - 25, 6, 1, "#8a6a44");
  R(g, cx - 1, by - 31, 2, 2, "#c81d3a");
  if (glowOn) glow(g, cx, by - 22, 26, "#ffe9a0", 0.3 + Math.sin(t * 3) * 0.12);
}

// ---------------------------------------------------------------- a casa
/**
 * Casa em 5 etapas, sobre uma área de 5x2 tiles com canto superior
 * esquerdo em (x, y). Etapas: 0 terreno marcado, 1 fundação e estrutura,
 * 2 paredes e porta, 3 telhado e janelas, 4 lareira e detalhes.
 */
export function drawHouse(g, x, y, stage, t, sunset, buildK = 1) {
  const W = 5 * T, H = 2 * T;
  const base = y + H;
  const cx = x + W / 2;
  const show = (s) => stage > s || (stage === s && buildK >= 1);
  const partial = (s) => (stage === s ? Math.min(1, buildK) : stage > s ? 1 : 0);
  // sombra
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(x + 4, base - 6, W - 8, 8);
  if (stage === 0) {
    // terreno marcado com estacas e barbante
    R(g, x + 8, y + 18, W - 16, H - 22, "#7a5a3e");
    for (let i = 0; i < 30; i++) R(g, x + 10 + ((i * 37) % (W - 20)), y + 20 + ((i * 13) % (H - 26)), 2, 1, "#5e4430");
    for (const [sx, sy] of [[x + 8, y + 18], [x + W - 10, y + 18], [x + 8, base - 6], [x + W - 10, base - 6]]) {
      R(g, sx, sy - 10, 3, 12, OUT);
      R(g, sx + 1, sy - 9, 1, 10, "#c99561");
    }
    g.strokeStyle = "#f2e4c4";
    g.lineWidth = 1;
    g.strokeRect(x + 9.5, y + 10.5, W - 19, H - 16);
    return;
  }
  // 1: fundação de pedra + estrutura de madeira
  const fk = partial(1);
  R(g, x + 6, base - 10, W - 12, 10, OUT);
  R(g, x + 7, base - 9, W - 14, 8, "#8a8a99");
  for (let i = 0; i < 9; i++) R(g, x + 8 + i * 16, base - 9, 1, 8, "#5a5a68");
  R(g, x + 7, base - 9, W - 14, 2, "#b4b4c4");
  const wallTop = y - 30;
  if (stage === 1 || (stage === 2 && buildK < 1)) {
    const h = (base - 10 - wallTop) * (stage === 1 ? fk : 1);
    for (const px of [x + 10, x + 44, x + W / 2 - 2, x + W - 48, x + W - 14]) {
      R(g, px, base - 10 - h, 5, h, OUT);
      R(g, px + 1, base - 10 - h, 3, h, "#a8743f");
    }
    if (fk >= 1 || stage > 1) {
      R(g, x + 8, wallTop, W - 16, 4, OUT);
      R(g, x + 9, wallTop + 1, W - 18, 2, "#c99561");
      L(g, x + 12, wallTop + 4, x + 44, base - 12, 2, "#8a5a34");
      L(g, x + W - 14, wallTop + 4, x + W - 48, base - 12, 2, "#8a5a34");
    }
  }
  if (stage >= 2) {
    // paredes de madeira e porta
    const k = partial(2);
    const top = base - 10 - (base - 10 - wallTop) * k;
    R(g, x + 8, top, W - 16, base - 10 - top, OUT);
    R(g, x + 9, top + 1, W - 18, base - 11 - top, "#c9956a");
    for (let yy = top + 6; yy < base - 10; yy += 7) R(g, x + 9, yy, W - 18, 1, "#a8743f");
    for (let xx = x + 30; xx < x + W - 10; xx += 40) R(g, xx, top + 1, 1, base - 11 - top, "#a8743f");
    if (k >= 1) {
      // porta
      R(g, cx - 10, base - 40, 20, 30, OUT);
      E(g, cx, base - 40, 10, 6, OUT);
      R(g, cx - 9, base - 39, 18, 29, "#7a3a2a");
      E(g, cx, base - 39, 9, 5, "#7a3a2a");
      R(g, cx, base - 39, 1, 29, "#5a2618");
      R(g, cx + 5, base - 25, 2, 2, "#f5c542");
      R(g, cx - 12, base - 10, 24, 3, "#8a8a99");
    }
  }
  if (stage >= 3) {
    // telhado e janelas
    const k = partial(3);
    const roofH = 46;
    const rows = Math.floor(roofH * k);
    for (let i = 0; i < rows; i++) {
      const yy = wallTop - i;
      const inset = (i / roofH) * (W / 2 - 4);
      R(g, x + inset, yy, W - inset * 2, 1, i % 6 === 0 ? "#6a1a1a" : i % 6 < 3 ? "#c8403a" : "#a8302a");
    }
    R(g, x - 2, wallTop, W + 4, 4, OUT);
    R(g, x - 1, wallTop + 1, W + 2, 2, "#8a2a24");
    if (k >= 1) {
      for (const wx of [x + 22, x + W - 42]) {
        R(g, wx - 1, wallTop + 14, 22, 20, OUT);
        R(g, wx, wallTop + 15, 20, 18, sunset ? "#ffcf6a" : "#9ad8ff");
        R(g, wx + 9, wallTop + 15, 2, 18, OUT);
        R(g, wx, wallTop + 23, 20, 2, OUT);
        R(g, wx + 2, wallTop + 17, 4, 3, "#ffffff");
        if (sunset) glow(g, wx + 10, wallTop + 24, 24, "#ffcf6a", 0.4);
      }
      // janela redonda no sótão
      E(g, cx, wallTop - 18, 7, 7, OUT);
      E(g, cx, wallTop - 18, 6, 6, sunset ? "#ffcf6a" : "#9ad8ff");
      R(g, cx - 6, wallTop - 18, 12, 1, OUT);
    }
  }
  if (stage >= 4) {
    // lareira (chaminé com fumaça) e detalhes
    const k = partial(4);
    const chx = x + W - 34;
    R(g, chx, wallTop - 40, 14, 30, OUT);
    R(g, chx + 1, wallTop - 39, 12, 29, "#8a8a99");
    for (let i = 0; i < 4; i++) R(g, chx + 1, wallTop - 36 + i * 7, 12, 1, "#5a5a68");
    R(g, chx - 1, wallTop - 42, 16, 4, OUT);
    if (k >= 1) {
      for (let i = 0; i < 5; i++) {
        const ph = (t * 0.6 + i * 0.2) % 1;
        g.globalAlpha = 0.5 * (1 - ph);
        E(g, chx + 7 + Math.sin(ph * 6 + i) * 4, wallTop - 46 - ph * 40, 4 + ph * 6, 3 + ph * 4, "#e8e4ec");
      }
      g.globalAlpha = 1;
      // floreiras nas janelas
      for (const wx of [x + 22, x + W - 42]) {
        R(g, wx - 2, wallTop + 34, 24, 5, "#6b4226");
        for (let i = 0; i < 6; i++) R(g, wx + i * 4, wallTop + 31 - (i % 2), 3, 3, ["#e8456a", "#ff8ab0", "#ffd166"][i % 3]);
      }
      // lampião ao lado da porta
      R(g, cx + 16, base - 34, 6, 8, OUT);
      R(g, cx + 17, base - 33, 4, 6, "#ffd36a");
      glow(g, cx + 19, base - 30, 22, "#ffd36a", sunset ? 0.6 : 0.3);
      // tapete de boas-vindas
      R(g, cx - 10, base - 6, 20, 5, "#9a2f5e");
      R(g, cx - 8, base - 5, 16, 3, "#c84a7a");
    }
  }
  // poeira de obra durante a construção
  if (buildK < 1 && stage >= 1) {
    for (let i = 0; i < 10; i++) {
      const a = t * 3 + i;
      g.globalAlpha = 0.4;
      E(g, x + 10 + ((i * 29 + t * 40) % (W - 20)), base - 6 - ((a * 13) % 20), 4, 3, "#d8c8b0");
    }
    g.globalAlpha = 1;
  }
}
