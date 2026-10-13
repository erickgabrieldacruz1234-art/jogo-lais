// ============================================================================
// INIMIGOS EM PIXEL ART (tamanho de tile, com expressões)
// Desenhados na base (cx, by). Piscam, franzem a testa quando perseguem,
// se espremem ao andar e ficam brancos ao levar um golpe.
// ============================================================================

import { R, E } from "./pixel";

const OUT = "#1a0e18";

function eyes(g, x, y, t, o, spread = 4, size = 3, angry = false, pupil = "#1a0e18") {
  const blink = Math.sin(t * 1.7 + o.x * 3) > 0.97;
  for (const s of [-1, 1]) {
    const ex = x + s * spread;
    if (blink) {
      R(g, ex - size / 2, y, size, 1, OUT);
      continue;
    }
    E(g, ex, y, size / 2 + 0.5, size / 2 + 1, "#ffffff");
    R(g, ex - 0.5 + (o.dir === "left" ? -1 : o.dir === "right" ? 1 : 0), y - 0.5 + (o.dir === "up" ? -1 : o.dir === "down" ? 1 : 0), 2, 2, pupil);
    if (angry) R(g, ex - size / 2 - 1 + (s > 0 ? 0 : 1), y - size - 1 + (s > 0 ? 1 : 0), size + 1, 1, OUT);
    if (angry) R(g, ex - size / 2 + (s > 0 ? -1 : 2), y - size, 2, 1, OUT);
  }
}

export function drawEnemyTile(g, o, t, cx, by) {
  const hurt = o.hurtT > 0;
  const moving = Boolean(o.move);
  const k = moving ? Math.min(1, o.move.t) : 1;
  const hop = moving ? Math.sin(k * Math.PI) * 3 : 0;
  const squash = moving ? 1 + Math.sin(k * Math.PI) * 0.12 : 1 + Math.sin(t * 3 + o.x) * 0.03;
  const angry = o.ai === "chase";
  const f = Math.floor(t * 6 + o.x) % 2;
  g.save();
  g.translate(Math.round(cx), Math.round(by - hop));
  g.scale(1 / squash, squash);
  const W = (c) => (hurt ? "#ffffff" : c);
  switch (o.look) {
    case "imp": {
      // diabrete festeiro com chapéu de festa
      E(g, 0, -9, 11, 9, OUT);
      E(g, 0, -9, 10, 8, W("#9a4ae0"));
      E(g, -3, -12, 5, 3, W("#c58aff"));
      R(g, -7, -2, 4, 3, OUT);
      R(g, 3, -2, 4, 3, OUT);
      for (let i = 0; i < 9; i++) R(g, -4 + i * 0.45, -26 + i * 1.3 - (i === 0 ? 0 : 0), 8 - i * 0.9, 1, i % 3 === 0 ? W("#ffe066") : W("#ff5ab4"));
      R(g, -1, -28, 2, 2, W("#ffffff"));
      eyes(g, 0, -10, t, o, 4, 3, angry);
      R(g, -2, -5, 4, 1, OUT);
      if (angry) R(g, -1, -4, 2, 1, "#ff9ab0");
      break;
    }
    case "crab": {
      const claw = f ? -2 : 0;
      E(g, 0, -6, 13, 7, OUT);
      E(g, 0, -7, 12, 6, W("#e8453a"));
      E(g, -4, -9, 5, 2, W("#ff8a6a"));
      for (const s of [-1, 1]) {
        E(g, s * 15, -10 + (s > 0 ? claw : -claw), 5, 4, OUT);
        E(g, s * 15, -10 + (s > 0 ? claw : -claw), 4, 3, W("#e8453a"));
        R(g, s * 15 - (s > 0 ? 0 : 3), -12 + (s > 0 ? claw : -claw), 3, 2, OUT);
        R(g, s * 4, -18, 1, 6, OUT);
        for (let l = 0; l < 3; l++) R(g, s * (8 + l * 3), -2 + (l + f) % 2, 2, 3, OUT);
      }
      eyes(g, 0, -19, t, o, 4, 3, angry);
      break;
    }
    case "beetle": {
      E(g, 0, -9, 11, 9, OUT);
      E(g, 0, -9, 10, 8, W("#2a6a5a"));
      R(g, 0, -17, 1, 16, OUT);
      E(g, -4, -12, 3, 2, W("#9affe0"));
      E(g, 4, -12, 2, 1, W("#5ac0a0"));
      E(g, 0, -18, 6, 4, OUT);
      E(g, 0, -18, 5, 3, W("#1a3a30"));
      R(g, -5, -25, 1, 5, OUT);
      R(g, 4, -25, 1, 5, OUT);
      for (let l = 0; l < 3; l++) {
        R(g, -13, -11 + l * 4 + ((l + f) % 2), 3, 1, OUT);
        R(g, 10, -11 + l * 4 + ((l + f + 1) % 2), 3, 1, OUT);
      }
      eyes(g, 0, -19, t, o, 2, 2, angry, "#ffe066");
      if (o.carrying) {
        E(g, 0, -28, 3, 4, "#5fd35f");
        R(g, -1, -30, 1, 1, "#ffffff");
      }
      break;
    }
    case "ghost": {
      const fy = Math.sin(t * 3 + o.x) * 2;
      g.translate(0, fy - 4);
      E(g, 0, -14, 11, 11, OUT);
      R(g, -11, -14, 22, 12, OUT);
      E(g, 0, -14, 10, 10, W("#f4f0ff"));
      R(g, -10, -14, 20, 11, W("#f4f0ff"));
      for (let i = 0; i < 5; i++) E(g, -8 + i * 4, -3 + ((i + f) % 2), 2.5, 2, W("#f4f0ff"));
      E(g, -4, -18, 3, 2, W("#ffffff"));
      eyes(g, 0, -14, t, o, 4, 3, false);
      R(g, -7, -9, 3, 1, "#ffb0c8");
      R(g, 4, -9, 3, 1, "#ffb0c8");
      E(g, 0, -8, 2, 1.5, OUT);
      if (angry) R(g, -1, -7, 2, 2, "#ff7aa8");
      break;
    }
    case "bat": {
      const fy = Math.sin(t * 6 + o.x) * 3;
      g.translate(0, fy - 10);
      const wing = f ? 4 : -2;
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) R(g, s * (5 + i * 3) - (s < 0 ? 3 : 0), -8 - wing + i * (f ? 1 : 0.5), 3, 4 - (i % 2), OUT);
        for (let i = 0; i < 4; i++) R(g, s * (5 + i * 3) - (s < 0 ? 2 : 1), -7 - wing + i * (f ? 1 : 0.5), 2, 2, W("#6a3a8a"));
      }
      E(g, 0, -6, 6, 6, OUT);
      E(g, 0, -6, 5, 5, W("#4a2a6a"));
      R(g, -4, -13, 2, 3, OUT);
      R(g, 3, -13, 2, 3, OUT);
      R(g, -3, -7, 2, 2, "#ff5a5a");
      R(g, 2, -7, 2, 2, "#ff5a5a");
      R(g, -2, -3, 1, 2, "#ffffff");
      R(g, 1, -3, 1, 2, "#ffffff");
      break;
    }
    case "shade": {
      for (let i = 0; i < 18; i++) {
        const half = (i < 12 ? 4 + i * 0.6 : 11 - (i - 12) * 0.4) + Math.sin(t * 8 + i) * 0.8;
        R(g, -half - 1, -22 + i, half * 2 + 2, 1, OUT);
        R(g, -half, -22 + i, half * 2, 1, W(i % 4 === 0 ? "#3a1a5a" : "#2a1240"));
      }
      for (let i = 0; i < 4; i++) R(g, -8 + i * 5, -4 + ((i + f) % 2) * 2, 3, 4, W("#2a1240"));
      R(g, -5, -15, 3, 2, hurt ? OUT : "#ff7a3a");
      R(g, 2, -15, 3, 2, hurt ? OUT : "#ff7a3a");
      if (angry) {
        R(g, -6, -17, 4, 1, "#ff7a3a");
        R(g, 2, -17, 4, 1, "#ff7a3a");
      }
      break;
    }
    case "golem": {
      // guardião de pedra com cristais
      E(g, 0, -12, 13, 12, OUT);
      E(g, 0, -12, 12, 11, W("#7a6e66"));
      E(g, -4, -16, 6, 4, W("#a09488"));
      R(g, -15, -14 + f, 6, 9, OUT);
      R(g, 9, -14 - f, 6, 9, OUT);
      R(g, -14, -13 + f, 4, 7, W("#8a7e74"));
      R(g, 10, -13 - f, 4, 7, W("#8a7e74"));
      for (const [cx2, cy2] of [[-5, -22], [3, -23], [7, -18]]) {
        R(g, cx2, cy2, 3, 5, W("#ff9ad8"));
        R(g, cx2, cy2, 1, 5, "#ffffff");
      }
      R(g, -5, -13, 3, 2, hurt ? OUT : "#7af0ff");
      R(g, 2, -13, 3, 2, hurt ? OUT : "#7af0ff");
      if (angry) R(g, -6, -15, 12, 1, OUT);
      R(g, -6, -2, 4, 3, OUT);
      R(g, 2, -2, 4, 3, OUT);
      break;
    }
    case "bigslime": {
      E(g, 0, -11, 14, 11 + f, OUT);
      E(g, 0, -11, 13, 10 + f, W("#4ac06a"));
      E(g, -5, -16, 5, 3, W("#a0ffb0"));
      R(g, -9, -22, 18, 3, W("#ffd36a"));
      for (const ox of [-8, -2, 4]) R(g, ox, -26, 3, 4, W("#ffd36a"));
      eyes(g, 0, -12, t, o, 5, 4, angry);
      R(g, -4, -5, 8, 2, OUT);
      R(g, -3, -4, 2, 2, "#ffffff");
      R(g, 2, -4, 2, 2, "#ffffff");
      break;
    }
    default: {
      E(g, 0, -8, 10, 8, OUT);
      E(g, 0, -8, 9, 7, W("#4ac06a"));
      E(g, -3, -11, 4, 2, W("#a0ffb0"));
      eyes(g, 0, -9, t, o, 3, 3, angry);
    }
  }
  g.restore();
  // vida
  if (o.maxHp > 1 && o.hp < o.maxHp) {
    R(g, cx - 9, by - 34, 18, 3, OUT);
    R(g, cx - 8, by - 33, (16 * o.hp) / o.maxHp, 1, "#ff5a76");
  }
}
