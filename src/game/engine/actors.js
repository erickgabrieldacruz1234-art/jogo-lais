// ============================================================================
// DESENHO DE ATORES DINÂMICOS
// Blocos empurráveis, placas, alvos, enigmas de símbolo, inimigos, chefes,
// projéteis e golpes. Coordenadas de mundo; âncora no centro da base.
// ============================================================================

import { R, E, L } from "./pixel";

export const GLYPH_NAMES = ["Sol", "Lua", "Estrela", "Coração", "Onda", "Folha"];
export const COLOR_SET = [
  { name: "Vermelho", c: "#e8456a" },
  { name: "Rosa", c: "#ff9ac4" },
  { name: "Amarelo", c: "#ffd166" },
  { name: "Branco", c: "#ffffff" }
];

export function glow(g, x, y, r, color, a = 0.5) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, color);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.globalAlpha = a;
  g.fillStyle = grd;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.globalAlpha = 1;
}

/** Símbolos simples em pixels: 0 sol, 1 lua, 2 estrela, 3 coração, 4 onda, 5 folha. */
export function drawGlyph(g, x, y, idx, c) {
  x = Math.round(x);
  y = Math.round(y);
  switch (idx % 6) {
    case 0:
      E(g, x, y, 2.5, 2.5, c);
      for (const [dx, dy] of [[0, -5], [0, 4], [-5, 0], [4, 0], [-4, -4], [3, -4], [-4, 3], [3, 3]]) R(g, x + dx, y + dy, 1, 1, c);
      break;
    case 1:
      E(g, x, y, 4, 4, c);
      E(g, x + 2, y - 1, 3.5, 3.5, "#2a2a36");
      break;
    case 2:
      R(g, x, y - 4, 1, 9, c);
      R(g, x - 4, y, 9, 1, c);
      R(g, x - 2, y - 2, 5, 5, c);
      break;
    case 3:
      for (const [dx, dy, w] of [[-3, -2, 2], [1, -2, 2], [-4, -1, 8], [-4, 0, 8], [-3, 1, 6], [-2, 2, 4], [-1, 3, 2]]) R(g, x + dx, y + dy, w, 1, c);
      break;
    case 4:
      for (let i = -4; i <= 4; i++) {
        R(g, x + i, y - 2 + Math.round(Math.sin(i) * 1.5), 1, 1, c);
        R(g, x + i, y + 2 + Math.round(Math.sin(i) * 1.5), 1, 1, c);
      }
      break;
    default:
      E(g, x, y, 2.5, 4, c);
      R(g, x, y - 4, 1, 9, "#2a2a36");
  }
}

const shadow = (g, x, y, rx) => E(g, x, y - 1, rx, 2, "rgba(0,0,0,0.3)");

// ------------------------------------------------------------------ blocos
export function drawBlock(g, e, t) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const look = e.look || "crate";
  if (look === "crate") {
    R(g, x - 8, y - 18, 16, 18, "#2a170c");
    R(g, x - 7, y - 17, 14, 16, "#b07a42");
    R(g, x - 7, y - 17, 14, 2, "#d6a464");
    L(g, x - 6, y - 15, x + 6, y - 3, 1, "#7a4c26");
    L(g, x + 6, y - 15, x - 6, y - 3, 1, "#7a4c26");
    R(g, x - 7, y - 4, 14, 1, "#7a4c26");
  } else if (look === "barrel") {
    R(g, x - 7, y - 18, 14, 18, "#2a170c");
    R(g, x - 6, y - 17, 12, 16, "#8a5a34");
    R(g, x - 6, y - 14, 12, 1, "#3a3a44");
    R(g, x - 6, y - 5, 12, 1, "#3a3a44");
    E(g, x, y - 16, 5, 1.5, "#6b4226");
    R(g, x - 4, y - 13, 2, 7, "#a8743f");
  } else if (look === "rock") {
    E(g, x, y - 8, 8.5, 8, "#2a2a36");
    E(g, x, y - 8.5, 7.5, 7, "#7d8094");
    E(g, x - 2, y - 11, 4, 3, "#a7aabd");
    R(g, x + 2, y - 5, 3, 1, "#55576a");
  } else if (look === "mossy") {
    E(g, x, y - 8, 8.5, 8, "#1e2420");
    E(g, x, y - 8.5, 7.5, 7, "#6a7d6a");
    E(g, x - 1, y - 13, 6, 3, "#5aa04a");
    R(g, x - 4, y - 6, 2, 2, "#4a7a3a");
  } else if (look === "magic") {
    R(g, x - 8, y - 17, 16, 17, "#1a1a3a");
    R(g, x - 7, y - 16, 14, 15, "#3a4a8a");
    R(g, x - 7, y - 16, 14, 2, "#6a8ae0");
    drawGlyph(g, x, y - 8, e.glyph ?? 2, "#9ae8ff");
    glow(g, x, y - 8, 14, "#7ad8ff", 0.25 + Math.sin(t * 3) * 0.1);
  } else if (look === "wardrobe") {
    R(g, x - 8, y - 30, 16, 30, "#1a0e10");
    R(g, x - 7, y - 29, 14, 28, "#5a3428");
    R(g, x, y - 28, 1, 26, "#2a1410");
    R(g, x - 3, y - 16, 1, 3, "#c9a040");
    R(g, x + 2, y - 16, 1, 3, "#c9a040");
    R(g, x - 8, y - 31, 16, 2, "#3a2018");
  } else if (look === "statue") {
    R(g, x - 7, y - 6, 14, 6, "#55576a");
    R(g, x - 6, y - 5, 12, 4, "#a7aabd");
    R(g, x - 4, y - 24, 8, 18, "#7d8094");
    E(g, x, y - 26, 4, 4, "#a7aabd");
    R(g, x - 3, y - 22, 2, 12, "#c8cad8");
  } else if (look === "hedge") {
    E(g, x, y - 9, 9, 9, "#1a3a26");
    E(g, x, y - 10, 8, 8, "#2f6b3a");
    E(g, x - 2, y - 12, 4, 3, "#5aa04a");
    R(g, x + 1, y - 7, 2, 2, "#ff8ab0");
  }
}

// ------------------------------------------------------------------ placas
export function drawPlate(g, e, pressed) {
  const x = Math.round(e.x), y = Math.round(e.y);
  R(g, x - 9, y - 13, 18, 12, "#2a2a36");
  R(g, x - 8, y - (pressed ? 11 : 12), 16, pressed ? 9 : 10, pressed ? "#6ae0a0" : "#8a8a99");
  R(g, x - 8, y - (pressed ? 11 : 12), 16, 1, pressed ? "#b0ffd0" : "#a5a5b5");
  if (e.glyph != null) drawGlyph(g, x, y - 7, e.glyph, pressed ? "#1a5a3a" : "#55576a");
  if (pressed) glow(g, x, y - 7, 14, "#6ae0a0", 0.35);
}

// ------------------------------------------------------------------ alvos
export function drawTarget(g, e, lit, t) {
  const x = Math.round(e.x), y = Math.round(e.y);
  const look = e.look || "target";
  const col = e.color || "#7ad8ff";
  if (look === "target") {
    R(g, x - 1, y - 8, 3, 8, "#4a2c1a");
    E(g, x, y - 16, 8, 8, "#2a170c");
    E(g, x, y - 16, 7, 7, lit ? "#ffe066" : "#f2e6d8");
    E(g, x, y - 16, 5, 5, lit ? "#ff9a2a" : "#e8456a");
    E(g, x, y - 16, 3, 3, lit ? "#ffe066" : "#f2e6d8");
    E(g, x, y - 16, 1.5, 1.5, lit ? "#ffffff" : "#e8456a");
    if (lit) glow(g, x, y - 16, 22, "#ffe066", 0.5);
  } else if (look === "crystal") {
    E(g, x, y - 2, 7, 2, "rgba(0,0,0,0.3)");
    const blink = e._flash > 0;
    const c = lit || blink ? col : "#4a5a7a";
    for (let i = 0; i < 9; i++) R(g, x - (8 - i) / 2 - 1, y - 20 + i, 8 - i + 2, 1, "#16162a");
    for (let i = 0; i < 10; i++) R(g, x - 4 + Math.abs(i - 5) * 0.5, y - 20 + i * 1.8, 8 - Math.abs(i - 5), 2, c);
    R(g, x - 2, y - 17, 1, 8, "#ffffff");
    if (lit || blink) glow(g, x, y - 12, blink ? 34 : 24, col, blink ? 0.85 : 0.5);
  } else if (look === "lantern") {
    R(g, x - 1, y - 30, 2, 30, "#1e1a24");
    R(g, x - 6, y - 32, 12, 2, "#2a2430");
    R(g, x - 4, y - 30, 8, 10, "#1e1a24");
    R(g, x - 3, y - 29, 6, 8, lit ? "#ff9a2a" : "#3a3040");
    if (lit) {
      R(g, x - 1, y - 28, 2, 3, "#fff6c0");
      glow(g, x, y - 25, 30, "#ff9a2a", 0.55 + Math.sin(t * 9) * 0.05);
    }
  } else if (look === "rune") {
    E(g, x, y - 2, 9, 3, "rgba(0,0,0,0.3)");
    R(g, x - 7, y - 24, 14, 23, "#1e2420");
    R(g, x - 6, y - 23, 12, 21, lit ? "#5a6a8a" : "#5d6a5c");
    R(g, x - 6, y - 23, 3, 21, lit ? "#7a8aaa" : "#7b8a78");
    drawGlyph(g, x, y - 13, e.glyph ?? 2, lit ? "#ffffff" : "#2a2a36");
    if (lit) glow(g, x, y - 13, 26, col, 0.55);
  } else if (look === "fountain") {
    E(g, x, y - 5, 14, 5, "#2a2a36");
    E(g, x, y - 6, 12, 4, "#a7aabd");
    E(g, x, y - 6, 10, 3, lit ? "#9ae8ff" : "#3a4a5a");
    R(g, x - 2, y - 20, 4, 14, "#7d8094");
    E(g, x, y - 21, 5, 2, "#a7aabd");
    if (lit) {
      for (let i = 0; i < 4; i++) R(g, x - 1 + Math.sin(t * 5 + i) * 3, y - 24 - ((t * 20 + i * 5) % 14), 2, 2, "#ffffff");
      glow(g, x, y - 18, 40, col, 0.6);
    }
  } else if (look === "symbol") {
    R(g, x - 8, y - 22, 16, 22, "#1e1e28");
    R(g, x - 7, y - 21, 14, 20, lit ? "#b8b0e0" : "#8a8698");
    drawGlyph(g, x, y - 11, e.glyph ?? 0, lit ? "#ffffff" : "#2a2a36");
    if (lit) glow(g, x, y - 11, 22, col, 0.55);
  } else if (look === "switch") {
    R(g, x - 6, y - 14, 12, 14, "#1e1e28");
    R(g, x - 5, y - 13, 10, 12, "#55576a");
    E(g, x, y - 8, 3.5, 3.5, lit ? "#5aff8a" : "#e8453a");
    if (lit) glow(g, x, y - 8, 16, "#5aff8a", 0.5);
  } else if (look === "crackedWall") {
    if (lit) {
      for (let i = 0; i < 5; i++) R(g, x - 14 + i * 7, y - 3, 4, 2, "#6a6680");
      return;
    }
    const w = e.w || 32;
    R(g, x - w / 2, y - 30, w, 30, "#1e1e28");
    R(g, x - w / 2 + 1, y - 29, w - 2, 28, "#7a7688");
    for (let yy = y - 24; yy < y - 2; yy += 6) R(g, x - w / 2 + 1, yy, w - 2, 1, "#4a4658");
    L(g, x - 3, y - 28, x + 2, y - 16, 1, "#1e1e28");
    L(g, x + 2, y - 16, x - 4, y - 6, 1, "#1e1e28");
    L(g, x + 2, y - 16, x + 8, y - 12, 1, "#1e1e28");
  } else if (look === "pumpkin") {
    E(g, x, y - 6, 8, 6, "#5a2a08");
    E(g, x, y - 6, 7, 5, lit ? "#f59a3a" : "#8a5a2a");
    R(g, x - 1, y - 13, 2, 3, "#3e6a22");
    if (lit) {
      R(g, x - 4, y - 8, 2, 2, "#ffe066");
      R(g, x + 2, y - 8, 2, 2, "#ffe066");
      R(g, x - 3, y - 4, 6, 1, "#ffe066");
      glow(g, x, y - 6, 22, "#ff9a2a", 0.6);
    } else {
      R(g, x - 4, y - 8, 2, 2, "#2a1a08");
      R(g, x + 2, y - 8, 2, 2, "#2a1a08");
    }
    if (e.glyph != null) drawGlyph(g, x, y - 20, e.glyph, lit ? "#ffe066" : "#8a86a0");
  }
}

// ------------------------------------------------------------------ enigma de símbolos/cores
export function drawDial(g, e, value, solved, t) {
  const x = Math.round(e.x), y = Math.round(e.y);
  if (e.look === "flowerColor") {
    const w = e.w || 40;
    R(g, x - w / 2 - 1, y - 18, w + 2, 18, "#2a170c");
    R(g, x - w / 2, y - 17, w, 16, "#8a5a34");
    R(g, x - w / 2 + 2, y - 15, w - 4, 12, "#4a2e1a");
    const c = COLOR_SET[value % COLOR_SET.length].c;
    let k = 0;
    for (let fx = x - w / 2 + 5; fx < x + w / 2 - 3; fx += 5) {
      for (let fy = y - 13; fy < y - 4; fy += 5) {
        const sway = Math.round(Math.sin(t * 2 + fx + k++) * 0.6);
        R(g, fx + sway, fy - 2, 1, 4, "#2f6b24");
        R(g, fx - 1 + sway, fy - 3, 3, 3, c);
      }
    }
    if (solved) glow(g, x, y - 10, 30, c, 0.35);
    return;
  }
  R(g, x - 9, y - 6, 18, 6, "#2a2a36");
  R(g, x - 8, y - 26, 16, 21, "#1e1e28");
  R(g, x - 7, y - 25, 14, 19, solved ? "#b8b0e0" : "#c9c4b4");
  R(g, x - 7, y - 25, 14, 2, "#e8e4dc");
  drawGlyph(g, x, y - 15, value, solved ? "#ffffff" : "#2a2a36");
  R(g, x - 6, y - 4, 2, 2, "#8a8698");
  R(g, x + 4, y - 4, 2, 2, "#8a8698");
  if (solved) glow(g, x, y - 15, 22, "#c8b8ff", 0.5);
}

// ------------------------------------------------------------------ inimigos
export function drawEnemy(g, en, t) {
  const x = Math.round(en.x), y = Math.round(en.y);
  const hurt = en.hurtT > 0 && Math.floor(t * 30) % 2 === 0;
  const look = en.look || "slime";
  if (look !== "ghost" && look !== "bat") shadow(g, x, y, 6);
  if (hurt) g.globalAlpha = 0.4;
  const b = Math.floor(t * 6 + en.x) % 2;
  if (look === "slime" || look === "imp") {
    const c = look === "imp" ? ["#3a0c3a", "#b04ae0", "#e8a0ff"] : ["#0c3a1a", "#4ac06a", "#a0ffb0"];
    E(g, x, y - 5 - b, 8, 6 + b, c[0]);
    E(g, x, y - 5 - b, 7, 5 + b, c[1]);
    E(g, x - 2, y - 8 - b, 3, 2, c[2]);
    R(g, x - 3, y - 7 - b, 2, 2, "#1a0a1a");
    R(g, x + 2, y - 7 - b, 2, 2, "#1a0a1a");
    if (look === "imp") {
      R(g, x - 6, y - 13 - b, 2, 3, c[0]);
      R(g, x + 5, y - 13 - b, 2, 3, c[0]);
    }
  } else if (look === "crab") {
    E(g, x, y - 4, 7, 4, "#5a1010");
    E(g, x, y - 5, 6, 3, "#e8453a");
    R(g, x - 10, y - 7 - b, 4, 3, "#e8453a");
    R(g, x + 6, y - 7 - (1 - b), 4, 3, "#e8453a");
    R(g, x - 3, y - 10, 2, 2, "#fff");
    R(g, x + 2, y - 10, 2, 2, "#fff");
  } else if (look === "beetle") {
    E(g, x, y - 5, 7, 5, "#1a1a0a");
    E(g, x, y - 5, 6, 4, "#3a6a2a");
    R(g, x, y - 9, 1, 8, "#1a1a0a");
    R(g, x - 3, y - 11, 6, 3, "#1a1a0a");
    R(g, x - 2, y - 11, 1, 1, "#ffe066");
    R(g, x + 1, y - 11, 1, 1, "#ffe066");
    for (let i = 0; i < 3; i++) {
      R(g, x - 8, y - 7 + i * 2 + b, 2, 1, "#1a1a0a");
      R(g, x + 6, y - 7 + i * 2 - b, 2, 1, "#1a1a0a");
    }
    if (en.carrying) R(g, x - 1, y - 14, 3, 3, "#5fd35f");
  } else if (look === "ghost") {
    const fy = Math.sin(t * 3 + en.x) * 2;
    E(g, x, y - 1, 6, 2, "rgba(0,0,0,0.2)");
    g.globalAlpha = hurt ? 0.4 : 0.85;
    E(g, x, y - 16 + fy, 8, 8, "#3a3650");
    E(g, x, y - 16 + fy, 7, 7, "#e4e0ff");
    R(g, x - 7, y - 16 + fy, 14, 9, "#e4e0ff");
    for (let i = 0; i < 5; i++) R(g, x - 7 + i * 3, y - 7 + fy + ((i + b) % 2), 2, 2, "#e4e0ff");
    R(g, x - 4, y - 18 + fy, 3, 3, "#1a1626");
    R(g, x + 1, y - 18 + fy, 3, 3, "#1a1626");
    E(g, x, y - 12 + fy, 2, 1.5, "#1a1626");
    glow(g, x, y - 14, 20, "#c8b8ff", 0.3);
  } else if (look === "bat") {
    const fy = Math.sin(t * 6 + en.x) * 3;
    E(g, x, y - 1, 4, 1.5, "rgba(0,0,0,0.2)");
    E(g, x, y - 16 + fy, 4, 4, "#2a1a3a");
    const w = b ? 9 : 6;
    R(g, x - w - 3, y - 18 + fy - (b ? 2 : 0), w, 3, "#3a2a4a");
    R(g, x + 3, y - 18 + fy - (b ? 2 : 0), w, 3, "#3a2a4a");
    R(g, x - 2, y - 17 + fy, 1, 1, "#ff5a5a");
    R(g, x + 1, y - 17 + fy, 1, 1, "#ff5a5a");
  } else if (look === "shade") {
    E(g, x, y - 9, 8, 9, "#0a0610");
    E(g, x, y - 10, 7, 8, "#2a1a3a");
    for (let i = 0; i < 4; i++) R(g, x - 7 + i * 4, y - 3 + ((i + b) % 2) * 2, 3, 3, "#2a1a3a");
    R(g, x - 3, y - 12, 2, 2, "#ff7a3a");
    R(g, x + 2, y - 12, 2, 2, "#ff7a3a");
    glow(g, x, y - 11, 14, "#ff7a3a", 0.2);
  } else if (look === "wolf") {
    R(g, x - 9, y - 10, 16, 7, "#1a1420");
    R(g, x - 8, y - 9, 14, 5, "#6a5a7a");
    R(g, x + 5, y - 14, 6, 6, "#6a5a7a");
    R(g, x + 6, y - 16, 2, 2, "#6a5a7a");
    R(g, x + 8, y - 12, 1, 1, "#ffe066");
    R(g, x - 7, y - 3, 2, 3 - b, "#3a3048");
    R(g, x + 3, y - 3, 2, 2 + b, "#3a3048");
    R(g, x - 11, y - 9 - b, 3, 2, "#6a5a7a");
  }
  g.globalAlpha = 1;
  if (en.maxHp > 1 && en.hp < en.maxHp && !en.invulnerable) {
    R(g, x - 7, y - 24, 14, 2, "#1a0a10");
    R(g, x - 7, y - 24, (14 * en.hp) / en.maxHp, 2, "#ff5a76");
  }
}

// ------------------------------------------------------------------ chefes
export function drawBoss(g, b, t) {
  const x = Math.round(b.x), y = Math.round(b.y);
  const hurt = b.hurtT > 0 && Math.floor(t * 30) % 2 === 0;
  E(g, x, y - 1, 16, 4, "rgba(0,0,0,0.35)");
  if (hurt) g.globalAlpha = 0.45;
  const fy = Math.round(Math.sin(t * 2) * 2);
  if (b.look === "guardian") {
    // armadura escura com lanterna no peito
    R(g, x - 10, y - 10, 7, 10, "#14101c");
    R(g, x + 3, y - 10, 7, 10, "#14101c");
    R(g, x - 13, y - 34 + fy, 26, 26, "#14101c");
    R(g, x - 12, y - 33 + fy, 24, 24, "#3a3050");
    R(g, x - 12, y - 33 + fy, 24, 3, "#5a4a78");
    E(g, x, y - 22 + fy, 5, 5, "#14101c");
    E(g, x, y - 22 + fy, 4, 4, b.vulnerable ? "#ff5a76" : "#ffd36a");
    R(g, x - 9, y - 48 + fy, 18, 15, "#14101c");
    R(g, x - 8, y - 47 + fy, 16, 13, "#4a3a68");
    R(g, x - 6, y - 42 + fy, 4, 2, "#ff5ad0");
    R(g, x + 2, y - 42 + fy, 4, 2, "#ff5ad0");
    R(g, x - 1, y - 54 + fy, 2, 7, "#ff5ad0");
    R(g, x - 19, y - 32 + fy, 6, 18, "#14101c");
    R(g, x + 13, y - 32 + fy, 6, 18, "#14101c");
    L(g, x + 18, y - 14 + fy, x + 18, y - 52 + fy, 2, "#b8b0c4");
  } else if (b.look === "witch") {
    R(g, x - 11, y - 26 + fy, 22, 24, "#1a0a24");
    R(g, x - 10, y - 25 + fy, 20, 22, "#5a2a7a");
    for (let i = 0; i < 4; i++) R(g, x - 10 + i * 6, y - 4 + fy + (i % 2), 4, 3, "#5a2a7a");
    E(g, x, y - 32 + fy, 7, 7, "#1a0a24");
    E(g, x, y - 32 + fy, 6, 6, "#9ad86a");
    R(g, x - 3, y - 33 + fy, 2, 2, "#1a0a24");
    R(g, x + 2, y - 33 + fy, 2, 2, "#1a0a24");
    R(g, x - 2, y - 29 + fy, 4, 1, "#3a1a10");
    R(g, x - 14, y - 38 + fy, 28, 3, "#1a0a24");
    for (let i = 0; i < 14; i++) R(g, x - 7 + i * 0.5 + (i > 9 ? 2 : 0), y - 39 - i + fy, 14 - i, 1, i === 3 ? "#ff9a2a" : "#2a1240");
    L(g, x - 16, y - 2 + fy, x + 16, y - 12 + fy, 2, "#6b4226");
    R(g, x + 12, y - 14 + fy, 6, 6, "#c9a040");
    R(g, x + 6, y - 22 + fy, 3, 10, "#9ad86a");
  } else if (b.look === "shadow") {
    const s = Math.sin(t * 3);
    E(g, x, y - 22 + fy, 18 + s, 22, "#05030a");
    E(g, x, y - 23 + fy, 16 + s, 20, "#1a1028");
    for (let i = 0; i < 6; i++) {
      const wx = x - 15 + i * 6;
      R(g, wx, y - 6 + fy + Math.round(Math.sin(t * 4 + i) * 2), 4, 6, "#1a1028");
    }
    for (let i = 0; i < 3; i++) {
      const a = t * 1.2 + i * 2.1;
      L(g, x, y - 26 + fy, x + Math.cos(a) * 26, y - 26 + fy + Math.sin(a) * 14, 2, "#2a1a3a");
    }
    R(g, x - 7, y - 30 + fy, 4, 3, b.vulnerable ? "#ffffff" : "#ff3a3a");
    R(g, x + 3, y - 30 + fy, 4, 3, b.vulnerable ? "#ffffff" : "#ff3a3a");
    glow(g, x, y - 28, 30, "#ff3a3a", 0.25);
  }
  g.globalAlpha = 1;
  if (!b.vulnerable && b.state === "fight") {
    g.globalAlpha = 0.35 + Math.sin(t * 5) * 0.1;
    g.strokeStyle = b.shieldColor || "#9ae8ff";
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x, y - 26, 24, 30, 0, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 0.12;
    g.fillStyle = b.shieldColor || "#9ae8ff";
    g.fill();
    g.globalAlpha = 1;
  }
}

export function drawFollower(g, f, t) {
  const x = Math.round(f.x), y = Math.round(f.y);
  const fy = Math.sin(t * 6) * 2;
  E(g, x, y - 1, 5, 2, "rgba(0,0,0,0.25)");
  glow(g, x, y - 12 + fy, 22, "#ff8ad8", 0.5);
  E(g, x, y - 12 + fy, 6, 6, "#3a0c3a");
  E(g, x, y - 12 + fy, 5, 5, "#ff8ad8");
  R(g, x - 3, y - 14 + fy, 2, 2, "#1a0a1a");
  R(g, x + 1, y - 14 + fy, 2, 2, "#1a0a1a");
  R(g, x - 1, y - 10 + fy, 3, 1, "#1a0a1a");
  R(g, x - 6, y - 19 + fy, 2, 3, "#3a0c3a");
  R(g, x + 5, y - 19 + fy, 2, 3, "#3a0c3a");
  if (f.carry) R(g, x + 5, y - 9 + fy, 4, 4, "#ffffff");
}

export function drawCheckpoint(g, e, active, t) {
  const x = Math.round(e.x), y = Math.round(e.y);
  R(g, x - 1, y - 22, 2, 22, "#4a2c1a");
  const wave = Math.round(Math.sin(t * 4) * 1);
  R(g, x + 1, y - 22 + wave, 10, 7, active ? "#ff5a76" : "#8a8698");
  R(g, x + 1, y - 22 + wave, 10, 1, active ? "#ffb0c0" : "#a7aabd");
  if (active) glow(g, x + 5, y - 18, 16, "#ff5a76", 0.35);
}

// ------------------------------------------------------------------ projéteis
export function drawProjectile(g, p) {
  if (p.kind === "arrow") {
    const dx = Math.sign(p.vx), dy = Math.sign(p.vy);
    const x = Math.round(p.x), y = Math.round(p.y);
    L(g, x - dx * 7, y - dy * 7, x, y, 1, "#8a5a34");
    R(g, x - 1 + dx, y - 1 + dy, 2, 2, "#e8e4dc");
    R(g, x - dx * 7 - 1, y - dy * 7 - 1, 2, 2, "#ff8ab0");
  } else {
    const c = p.color || "#ff5ad0";
    glow(g, p.x, p.y, 10, c, 0.6);
    E(g, p.x, p.y, 3, 3, c);
    R(g, p.x - 1, p.y - 1, 2, 2, "#ffffff");
  }
}

export function drawSlash(g, s) {
  const k = 1 - s.t / s.dur;
  g.globalAlpha = Math.max(0, k);
  const base = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[s.dir];
  for (let i = -3; i <= 3; i++) {
    const a = base + i * 0.28 + (1 - k) * 0.4;
    const r = 14;
    R(g, s.x + Math.cos(a) * r - 1, s.y + Math.sin(a) * r - 1, 3, 3, i === 0 ? "#ffffff" : "#ffe9b0");
  }
  g.globalAlpha = 1;
}
