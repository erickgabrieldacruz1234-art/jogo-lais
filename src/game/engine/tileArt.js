// ============================================================================
// ARTE DAS FASES (pixel art procedural, tile de 32x32 unidades de mundo)
// Cada tema define cores e estilos de piso, parede, decoração e água.
// Tudo que é estático é pré-renderizado uma vez por fase.
// ============================================================================

import { R, E, L, rng, makeCanvas } from "./pixel";
import { PROPS } from "./props";

export const T = 32;

export const THEMES = {
  ibiza: {
    floor: "cobble", floorC: ["#8a7a6e", "#6e6058", "#a8988a", "#5a4c46"],
    floor2C: ["#c8a878", "#b08c60", "#e0c498", "#8a6a44"],
    wall: "stucco", wallC: { top: "#efe6d6", topDark: "#d6c8b2", face: "#e8dcc8", faceDark: "#bfae96", trim: "#b8603a", trimDark: "#8a4428", line: "#a8987e" },
    deco: ["pot", "palm", "pot"], flowers: ["#ff5ab4", "#ff8ad8", "#ffd166", "#ffffff"],
    water: ["#1d4f8a", "#2a68a8", "#5ab0e8", "#cfeaff"],
    lighting: { ambient: "rgba(16, 10, 44, 0.62)", player: 70, glow: 0.3 },
    ambient: { type: "sparkles", colors: ["#ffd36a", "#ff8ad8", "#7ad8ff", "#ffffff"] },
    windowGlow: "#ffc867", bg: "#120c1e"
  },
  praia: {
    floor: "sand", floorC: ["#ecd08a", "#d8b86e", "#f8e4ac", "#c9a458"],
    floor2C: ["#d6b878", "#bf9e5e", "#e8cf98", "#a8884a"],
    wall: "sandstone", wallC: { top: "#c9a46a", topDark: "#b08c56", face: "#a8824c", faceDark: "#7a5a32", trim: "#8ab86a", trimDark: "#5a8a44", line: "#6a4a28" },
    deco: ["palm", "rock", "palm"], flowers: ["#ffb3a0", "#fff1e6", "#ff8a5a"],
    water: ["#0f8aa8", "#18b0c8", "#7ae8f0", "#f2fbff"],
    lighting: null, tint: "rgba(255, 190, 120, 0.06)",
    ambient: { type: "seagulls", colors: ["#ffffff"] }, bg: "#0a3a4a"
  },
  jardim: {
    floor: "grass", floorC: ["#5cb04a", "#4a9a3c", "#78c860", "#3a8432"],
    floor2C: ["#d8c8a8", "#bca888", "#ece0c4", "#9a8a6a"],
    wall: "hedge", wallC: { top: "#3a8a3e", topDark: "#2a6a30", face: "#2f7434", faceDark: "#1f5426", trim: "#ff8ab0", trimDark: "#e8456a", line: "#1a4a22" },
    deco: ["roseBush", "topiary", "roseBush"], flowers: ["#e8456a", "#ff8ab0", "#ffd166", "#ffffff", "#c58aff"],
    water: ["#2a86c8", "#3a9ad6", "#9ae0ff", "#e6f7ff"],
    lighting: null, tint: "rgba(255, 220, 240, 0.05)",
    ambient: { type: "petals", colors: ["#ffb3cf", "#ff8ab0", "#ffffff"] }, bg: "#1a3a1a"
  },
  bruxas: {
    floor: "flag", floorC: ["#4a4060", "#3a3250", "#5a5074", "#2e2840"],
    floor2C: ["#4e3a2e", "#3e2c22", "#64483a", "#2e2018"],
    wall: "haunted", wallC: { top: "#2a2238", topDark: "#221c30", face: "#1e182a", faceDark: "#141020", trim: "#5a8a3a", trimDark: "#3a5a26", line: "#0e0a16" },
    deco: ["tomb", "deadTree", "pumpkins"], flowers: ["#ff9a2a", "#c58aff", "#8a6a3a"],
    water: ["#2a1a4a", "#3a2a6a", "#7a5ad8", "#c8b8ff"],
    lighting: { ambient: "rgba(20, 6, 40, 0.6)", player: 72, glow: 0.32 },
    ambient: { type: "fog", colors: ["#c8b8ff", "#e0d8ff"] }, windowGlow: "#9cff8a", bg: "#08060e"
  },
  floresta: {
    floor: "grass", floorC: ["#4a9a3e", "#3a8432", "#62b050", "#2e6e28"],
    floor2C: ["#a07a4a", "#8a6a3e", "#b88c58", "#6a4a2a"],
    wall: "hedge", wallC: { top: "#2a6a32", topDark: "#1e5226", face: "#24582a", faceDark: "#163e1c", trim: "#e8453a", trimDark: "#a82a22", line: "#123018" },
    deco: ["tree", "rock", "tree"], flowers: ["#ffd166", "#ffffff", "#ff8ab0", "#c58aff"],
    water: ["#2a86c8", "#3a9ad6", "#9ae0ff", "#e6f7ff"],
    lighting: null, tint: "rgba(255, 230, 170, 0.06)",
    ambient: { type: "petals", colors: ["#9ad06a", "#ffd166", "#6cb050"] }, bg: "#16301a"
  },
  deposito: {
    floor: "flag", floorC: ["#8a6a4a", "#76583c", "#a07a56", "#5e4430"],
    floor2C: ["#6e5a40", "#5a4834", "#84704e", "#44362a"],
    wall: "sandstone", wallC: { top: "#7a5232", topDark: "#664428", face: "#5c3a22", faceDark: "#462a18", trim: "#4a8a3a", trimDark: "#2e6a24", line: "#2e1c10" },
    deco: ["barrel", "logs", "barrel"], flowers: ["#ffd166", "#c9a070"],
    water: ["#2a6a8a", "#3a7a9a", "#8ac8e0", "#e0f4ff"],
    lighting: { ambient: "rgba(30, 16, 8, 0.35)", player: 84, glow: 0.25 },
    ambient: { type: "fireflies", colors: ["#ffe9a0", "#ffd08a"] }, windowGlow: "#ffc867", bg: "#140c06"
  },
  mina: {
    floor: "flag", floorC: ["#5a4a44", "#4a3c36", "#6e5a52", "#3a2e2a"],
    floor2C: ["#4a3a30", "#3a2e26", "#5e4a3e", "#2a201a"],
    wall: "ruins", wallC: { top: "#4a3a32", topDark: "#3e302a", face: "#32261f", faceDark: "#241a14", trim: "#ff9ad8", trimDark: "#b04a8a", line: "#160e0a" },
    deco: ["crystal", "rock", "pillar"], flowers: ["#7ad8ff", "#ff9ad8", "#ffd36a"],
    water: ["#103a6e", "#16508e", "#5ab8ff", "#bfe8ff"],
    lighting: { ambient: "rgba(10, 6, 14, 0.66)", player: 80, glow: 0.32 },
    ambient: { type: "fireflies", colors: ["#7ad8ff", "#ff9ad8"] }, bg: "#060406"
  },
  lar: {
    floor: "grass", floorC: ["#5cb04a", "#4a9a3c", "#78c860", "#3a8432"],
    floor2C: ["#d8c8a8", "#bca888", "#ece0c4", "#9a8a6a"],
    wall: "hedge", wallC: { top: "#3a8a3e", topDark: "#2a6a30", face: "#2f7434", faceDark: "#1f5426", trim: "#ff8ab0", trimDark: "#e8456a", line: "#1a4a22" },
    deco: ["tree", "roseBush", "topiary"], flowers: ["#e8456a", "#ff8ab0", "#ffd166", "#ffffff", "#c58aff"],
    water: ["#2a86c8", "#3a9ad6", "#9ae0ff", "#e6f7ff"],
    lighting: null, tint: "rgba(255, 220, 200, 0.05)",
    ambient: { type: "petals", colors: ["#ffb3cf", "#ff8ab0", "#ffffff"] }, bg: "#1a3a1a"
  },
  lago: {
    floor: "flag", floorC: ["#5a6a7e", "#4a5868", "#6e8094", "#3a4656"],
    floor2C: ["#2e5a46", "#244a3a", "#3a7058", "#1a3a2e"],
    wall: "ruins", wallC: { top: "#3e4a62", topDark: "#344056", face: "#2a3448", faceDark: "#1e2636", trim: "#7ad8ff", trimDark: "#3a8ab8", line: "#161c2a" },
    deco: ["crystal", "willow", "pillar"], flowers: ["#9ae0ff", "#ffffff", "#c58aff"],
    water: ["#103a6e", "#16508e", "#5ab8ff", "#bfe8ff"],
    lighting: { ambient: "rgba(8, 14, 44, 0.55)", player: 74, glow: 0.32 },
    ambient: { type: "fireflies", colors: ["#d8ff7a", "#fff6b0", "#a0ffd0"] }, bg: "#04070e"
  }
};

// ------------------------------------------------------------------ pisos
function floorTile(g, th, x, y, style, c, r) {
  R(g, x, y, T, T, c[0]);
  if (style === "cobble") {
    for (let row = 0; row < 4; row++) {
      const off = (row % 2) * 4;
      for (let col = -1; col < 4; col++) {
        const sx = x + col * 8 + off + 1, sy = y + row * 8 + 1;
        const w = 7 - Math.floor(r() * 2), h = 6;
        E(g, sx + w / 2, sy + h / 2, w / 2, h / 2, r() > 0.3 ? c[0] : c[2]);
        R(g, sx + 1, sy + 1, w - 3, 1, c[2]);
        R(g, sx + 1, sy + h - 1, w - 2, 1, c[1]);
      }
    }
    for (let i = 0; i < 4; i++) R(g, x + r() * T, y + r() * T, 1, 1, c[3]);
  } else if (style === "sand") {
    for (let i = 0; i < 40; i++) R(g, x + r() * T, y + r() * T, 1, 1, r() > 0.5 ? c[1] : c[2]);
    if (r() > 0.6) {
      const yy = y + 6 + r() * 20;
      for (let i = 0; i < 10; i++) R(g, x + 6 + i * 2, yy + Math.round(Math.sin(i * 0.8) * 1), 2, 1, c[1]);
    }
  } else if (style === "grass") {
    for (let i = 0; i < 26; i++) R(g, x + r() * T, y + r() * T, 1, 2, r() > 0.5 ? c[1] : c[2]);
    for (let i = 0; i < 3; i++) {
      const gx = x + 3 + r() * 26, gy = y + 4 + r() * 24;
      R(g, gx, gy, 1, 3, c[3]);
      R(g, gx + 2, gy + 1, 1, 2, c[3]);
    }
    if (r() > 0.75) {
      const fx = x + 6 + r() * 20, fy = y + 6 + r() * 20;
      const fc = th.flowers[Math.floor(r() * th.flowers.length)];
      R(g, fx - 1, fy, 3, 1, fc);
      R(g, fx, fy - 1, 1, 3, fc);
      R(g, fx, fy, 1, 1, "#fff6b0");
    }
  } else if (style === "flag") {
    R(g, x, y, T, 1, c[3]);
    R(g, x, y, 1, T, c[3]);
    R(g, x + 16, y, 1, 16, c[3]);
    R(g, x, y + 16, T, 1, c[3]);
    R(g, x + 8, y + 16, 1, 16, c[3]);
    R(g, x + 1, y + 1, 14, 1, c[2]);
    R(g, x + 17, y + 1, 14, 1, c[2]);
    R(g, x + 1, y + 17, 6, 1, c[2]);
    R(g, x + 9, y + 17, 22, 1, c[2]);
    for (let i = 0; i < 14; i++) R(g, x + r() * T, y + r() * T, 1, 1, r() > 0.5 ? c[1] : c[2]);
    if (r() > 0.7) L(g, x + 4 + r() * 10, y + 4 + r() * 10, x + 12 + r() * 14, y + 10 + r() * 16, 1, c[3]);
  }
}

function floor2Tile(g, th, x, y, c, r) {
  // variação do piso (terracota, areia molhada, caminho de pedra, terra com folhas, musgo)
  R(g, x, y, T, T, c[0]);
  if (th.floor === "cobble") {
    // ladrilhos claros com losango azul (azulejo mediterrâneo)
    for (let yy = 0; yy < T; yy += 16) for (let xx = 0; xx < T; xx += 16) {
      R(g, x + xx, y + yy, 16, 16, c[3]);
      R(g, x + xx + 1, y + yy + 1, 15, 15, c[0]);
      R(g, x + xx + 1, y + yy + 1, 15, 1, c[2]);
      const cx = x + xx + 8, cy = y + yy + 8;
      for (let i = 0; i < 4; i++) {
        R(g, cx - i, cy - 3 + i, 1 + i * 2, 1, i === 3 ? "#3a6ab0" : "#5a8ad0");
        R(g, cx - i, cy + 3 - i, 1 + i * 2, 1, "#5a8ad0");
      }
      R(g, cx, cy, 1, 1, "#e8c060");
    }
  } else if (th.floor === "grass") {
    for (let yy = 0; yy < T; yy += 11) {
      const off = (yy / 11) % 2 ? 5 : 0;
      for (let xx = -off; xx < T; xx += 11) {
        R(g, x + xx + 1, y + yy + 1, 9, 9, c[3]);
        R(g, x + xx + 1, y + yy + 1, 8, 8, c[0]);
        R(g, x + xx + 2, y + yy + 2, 5, 1, c[2]);
      }
    }
    for (let i = 0; i < 6; i++) R(g, x + r() * T, y + r() * T, 1, 1, "#5cb04a");
  } else {
    for (let i = 0; i < 40; i++) R(g, x + r() * T, y + r() * T, 1 + (r() > 0.8 ? 1 : 0), 1, r() > 0.5 ? c[1] : c[2]);
    if (th.floor === "sand") for (let i = 0; i < 2; i++) {
      const sx = x + 6 + r() * 20, sy = y + 6 + r() * 20;
      E(g, sx, sy, 2, 1.5, "#f7b39b");
      R(g, sx - 1, sy - 1, 2, 1, "#fff1e6");
    }
    if (th.floor === "flag" && th.wall === "haunted") for (let i = 0; i < 5; i++) R(g, x + r() * 28, y + r() * 28, 3, 2, ["#8a4a1a", "#6a3a1a", "#a8642a"][i % 3]);
  }
}

function flowerDecal(g, th, x, y, r) {
  const style = th.wall;
  if (style === "sandstone") {
    for (let i = 0; i < 3; i++) {
      const sx = x + 6 + r() * 20, sy = y + 6 + r() * 20;
      if (i === 0) {
        const c = "#f08a5a";
        R(g, sx - 1, sy - 3, 2, 7, c);
        R(g, sx - 3, sy - 1, 7, 2, c);
      } else {
        E(g, sx, sy, 3, 2, "#c96f5c");
        E(g, sx, sy - 0.5, 2, 1, "#f7b39b");
      }
    }
    return;
  }
  if (style === "haunted") {
    for (let i = 0; i < 2; i++) {
      const px = x + 8 + r() * 16, py = y + 10 + r() * 14;
      E(g, px, py, 5, 4, "#5a2a08");
      E(g, px, py, 4, 3, "#e07a1c");
      R(g, px - 2, py - 1, 1, 1, "#ffe066");
      R(g, px + 1, py - 1, 1, 1, "#ffe066");
      R(g, px - 1, py - 5, 2, 2, "#3e6a22");
    }
    return;
  }
  for (let i = 0; i < 9; i++) {
    const fx = x + 3 + r() * 26, fy = y + 4 + r() * 24;
    const c = th.flowers[Math.floor(r() * th.flowers.length)];
    R(g, fx, fy + 1, 1, 3, "#2f6b24");
    R(g, fx - 1, fy, 3, 1, c);
    R(g, fx, fy - 1, 1, 3, c);
    R(g, fx, fy, 1, 1, style === "ruins" ? "#ffffff" : "#fff6b0");
  }
}

// ------------------------------------------------------------------ paredes (vista 3/4)
const FACE = 14;

function wallTile(g, th, x, y, n, r, cracked) {
  const c = th.wallC;
  const faceVisible = !n.down;
  const topH = faceVisible ? T - FACE : T;
  // topo
  R(g, x, y, T, topH, c.top);
  if (th.wall === "hedge") {
    for (let i = 0; i < 16; i++) E(g, x + r() * T, y + r() * topH, 3 + r() * 3, 2 + r() * 2, r() > 0.5 ? c.topDark : "#4a9a48");
    for (let i = 0; i < 6; i++) R(g, x + r() * T, y + r() * topH, 2, 1, "#6cc058");
    for (let i = 0; i < 3; i++) {
      const fx = x + 3 + r() * 26, fy = y + 2 + r() * Math.max(1, topH - 4);
      R(g, fx, fy, 3, 3, "#5a0c1a");
      R(g, fx, fy, 2, 2, r() > 0.5 ? c.trim : "#ffffff");
    }
  } else if (th.wall === "stucco") {
    // telhado de terracota
    for (let row = 0; row * 6 < topH; row++) {
      const yy = y + row * 6;
      const off = row % 2 ? 4 : 0;
      for (let xx = -off; xx < T; xx += 8) {
        R(g, x + xx, yy, 8, 6, c.trim);
        R(g, x + xx + 1, yy + 4, 6, 2, c.trimDark);
        R(g, x + xx + 1, yy, 5, 1, "#d8804e");
        R(g, x + xx, yy, 1, 6, c.trimDark);
      }
    }
  } else {
    // blocos de pedra
    const lineC = c.line;
    for (let row = 0; row * 10 < topH; row++) {
      const yy = y + row * 10;
      const off = row % 2 ? 8 : 0;
      for (let xx = -off; xx < T; xx += 16) {
        const bx = x + Math.max(0, xx), bw = Math.min(16, T - Math.max(0, xx), xx + 16);
        if (bw <= 0) continue;
        const bh = Math.min(10, topH - row * 10);
        R(g, bx, yy, bw, bh, r() > 0.25 ? c.top : c.topDark);
        R(g, bx, yy, bw, 1, "rgba(255,255,255,0.18)");
        R(g, bx, yy, 1, bh, "rgba(255,255,255,0.1)");
        R(g, bx, yy + bh - 1, bw, 1, lineC);
        R(g, bx + bw - 1, yy, 1, bh, lineC);
      }
    }
    if (th.wall === "haunted") for (let i = 0; i < 3; i++) R(g, x + r() * 28, y + r() * Math.max(1, topH - 3), 4, 2, c.trim);
    if (th.wall === "sandstone" && r() > 0.6) R(g, x + 4 + r() * 20, y + 2, 5, 2, c.trim);
    if (th.wall === "ruins" && r() > 0.65) {
      R(g, x + 6 + r() * 18, y + 3 + r() * 6, 3, 5, c.trim);
      R(g, x + 7 + r() * 16, y + 3 + r() * 6, 1, 2, "#ffffff");
    }
  }
  // contorno escuro onde o muro termina (leitura clara de parede x chão)
  const edge = th.wall === "hedge" ? "#0f2a14" : th.wall === "stucco" ? "#4a1a10" : "#14101c";
  if (!n.left) R(g, x, y, 2, T, edge);
  if (!n.right) R(g, x + T - 2, y, 2, T, edge);
  if (!n.up) R(g, x, y, T, 2, edge);
  if (!faceVisible) return;
  // face frontal
  const fy = y + topH;
  R(g, x, fy, T, FACE, c.face);
  if (th.wall === "hedge") {
    for (let i = 0; i < 12; i++) E(g, x + r() * T, fy + 2 + r() * (FACE - 4), 3, 2, r() > 0.5 ? c.faceDark : c.face);
    for (let i = 0; i < 2; i++) R(g, x + 4 + r() * 24, fy + 3 + r() * 8, 2, 2, c.trim);
  } else if (th.wall === "stucco") {
    for (let i = 0; i < 6; i++) R(g, x + r() * T, fy + r() * FACE, 2, 1, c.faceDark);
    if (r() > 0.55) {
      wallTile.lastWindow = true;
      // janelinha iluminada
      R(g, x + 11, fy + 2, 10, 9, c.trimDark);
      E(g, x + 16, fy + 3, 4, 2, th.windowGlow);
      R(g, x + 12, fy + 4, 8, 6, th.windowGlow);
      R(g, x + 16, fy + 3, 1, 7, c.trimDark);
    }
  } else {
    // tijolos
    for (let row = 0; row < 3; row++) {
      const by = fy + row * 5;
      R(g, x, by + 4, T, 1, c.line);
      const off = row % 2 ? 6 : 0;
      for (let bx = off; bx < T; bx += 12) R(g, x + bx, by, 1, 4, c.line);
      R(g, x + off + 1, by, 8, 1, "rgba(255,255,255,0.12)");
    }
    if (th.wall === "haunted" && r() > 0.6) {
      for (let i = 0; i < 6; i++) R(g, x + 2 + i * 2, fy + 1 + (i % 2), 1, 3, c.trim);
    }
    if (th.wall === "sandstone" && r() > 0.6) {
      R(g, x + 4, fy + FACE - 4, 6, 3, c.trim);
      R(g, x + 6, fy + FACE - 6, 2, 3, c.trimDark);
    }
    if (th.wall === "ruins" && r() > 0.6) for (let i = 0; i < 4; i++) R(g, x + 20 + (i % 2), fy + i * 3, 1, 3, "#4a8a5a");
  }
  R(g, x, fy, T, 2, edge);
  R(g, x, fy + FACE - 2, T, 2, "rgba(0,0,0,0.35)");
  const roll = r();
  if (!cracked && n.left && n.right) {
    if (th.wall === "stucco") {
      if (roll < 0.22) {
        // vaso pendurado com buganvílias
        R(g, x + 12, fy + 1, 8, 5, "#8a4428");
        R(g, x + 13, fy + 1, 6, 4, "#b8603a");
        for (let i = 0; i < 9; i++) R(g, x + 8 + r() * 16, fy - 2 + r() * 10 + (i % 3) * 2, 2, 2, i % 2 ? "#ff5ab4" : "#ff8ad8");
        for (let i = 0; i < 4; i++) R(g, x + 10 + i * 4, fy + 5, 1, 3 + (i % 2) * 3, "#2f7a3a");
      } else if (roll < 0.4) wallTile.lastTorch = { x: x + 16, y: fy + 4, color: "#ffb03a" };
    } else if (th.wall === "sandstone" && roll < 0.3) {
      for (let i = 0; i < 4; i++) L(g, x + 6 + i * 5, fy + FACE - 1, x + 7 + i * 5 + Math.round(Math.sin(i) * 2), fy + 4 + i % 2 * 3, 1, "#4a8a44");
      E(g, x + 24, fy + 9, 3, 2, "#f7b39b");
      E(g, x + 24, fy + 8.5, 2, 1, "#fff1e6");
    } else if (th.wall === "haunted") {
      if (roll < 0.25) {
        for (let a = 0; a < 5; a++) for (let k = 0; k < 9; k++) R(g, x + 1 + Math.cos(a * 0.35) * k, fy + 1 + Math.sin(a * 0.35) * k, 1, 1, "rgba(220,220,240,0.55)");
        for (let k = 3; k < 9; k += 3) for (let a = 0; a < 5; a++) R(g, x + 1 + Math.cos(a * 0.35) * k, fy + 1 + Math.sin(a * 0.35) * k + 1, 1, 1, "rgba(220,220,240,0.4)");
      } else if (roll < 0.45) wallTile.lastTorch = { x: x + 16, y: fy + 4, color: "#9cff8a" };
    } else if (th.wall === "ruins") {
      if (roll < 0.25) {
        for (const [ox, h] of [[10, 6], [14, 9], [18, 5]]) {
          R(g, x + ox, fy + FACE - h, 3, h, "#7ad8ff");
          R(g, x + ox, fy + FACE - h, 1, h, "#e6faff");
        }
      } else if (roll < 0.42) wallTile.lastTorch = { x: x + 16, y: fy + 4, color: "#7ad8ff" };
    } else if (th.wall === "hedge" && roll < 0.25) {
      for (let i = 0; i < 5; i++) {
        const fx = x + 4 + r() * 24, fyy = fy + 2 + r() * 9;
        R(g, fx - 1, fyy - 1, 3, 3, "#5a0c1a");
        R(g, fx - 1, fyy - 1, 2, 2, "#ff8ab0");
      }
    }
  }
  if (cracked) {
    L(g, x + 12, fy - 2, x + 16, fy + 6, 1, "#1a1420");
    L(g, x + 16, fy + 6, x + 12, fy + 12, 1, "#1a1420");
    L(g, x + 16, fy + 6, x + 22, fy + 9, 1, "#1a1420");
    R(g, x + 15, fy + 5, 3, 3, "#1a1420");
  }
}

function waterBase(g, th, x, y, n, r) {
  const w = th.water;
  R(g, x, y, T, T, w[0]);
  for (let i = 0; i < 6; i++) R(g, x + r() * 26, y + r() * T, 4 + r() * 6, 1, w[1]);
  // margem
  if (!n.up) {
    R(g, x, y, T, 4, "rgba(0,0,0,0.35)");
    R(g, x, y + 4, T, 1, w[3]);
  }
  if (!n.left) R(g, x, y, 2, T, w[3]);
  if (!n.right) R(g, x + T - 2, y, 2, T, w[3]);
  if (!n.down) R(g, x, y + T - 2, T, 2, w[3]);
}

// ------------------------------------------------------------------ decoração sólida "T"
function decoSprite(kind, seed) {
  const { c, g } = makeCanvas(48, 64);
  const r = rng(seed);
  const cx = 24, base = 62;
  E(g, cx, base - 3, 12, 3, "rgba(0,0,0,0.28)");
  if (kind === "pot") {
    R(g, cx - 9, base - 16, 18, 14, "#5a2414");
    R(g, cx - 8, base - 15, 16, 12, "#b8603a");
    R(g, cx - 8, base - 15, 16, 2, "#d8804e");
    R(g, cx - 10, base - 18, 20, 4, "#8a4428");
    const colors = ["#ff5ab4", "#ff8ad8", "#e8456a"];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      E(g, cx + Math.cos(a) * 9, base - 28 + Math.sin(a) * 7, 6, 5, "#1f5a2a");
    }
    E(g, cx, base - 28, 10, 8, "#2f7a3a");
    for (let i = 0; i < 12; i++) R(g, cx - 12 + r() * 24, base - 38 + r() * 16, 2, 2, colors[i % 3]);
  } else if (["palm", "rock", "deadTree", "pillar", "tree", "barrel", "logs"].includes(kind)) {
    const map = { palm: { type: "palm", s: 0.75 }, rock: { type: "rock", s: 1.5 }, deadTree: { type: "deadTree" }, pillar: { type: "pillar", broken: r() > 0.5 }, tree: { type: "tree", s: 0.95, pal: r() > 0.5 ? "green" : "dark" }, barrel: { type: "barrel" }, logs: { type: "log" } };
    const p = map[kind];
    const def = PROPS[p.type];
    const sz = def.size(p);
    const { c: pc, g: pg } = makeCanvas(sz.w, sz.h);
    def.draw(pg, p, sz.w, sz.h);
    const k = Math.min(1, 46 / sz.w, 62 / sz.h);
    g.drawImage(pc, cx - (sz.w * k) / 2, base - sz.h * k, sz.w * k, sz.h * k);
  } else if (kind === "roseBush" || kind === "topiary") {
    if (kind === "topiary") {
      R(g, cx - 2, base - 14, 4, 12, "#6b4226");
      R(g, cx - 8, base - 6, 16, 5, "#b8603a");
      E(g, cx, base - 26, 11, 11, "#1f5426");
      E(g, cx, base - 27, 10, 10, "#3a8a3e");
      E(g, cx - 3, base - 30, 4, 3, "#6cc058");
    } else {
      E(g, cx, base - 14, 15, 12, "#1f5426");
      E(g, cx, base - 15, 14, 11, "#2f7434");
      E(g, cx - 4, base - 19, 6, 4, "#4a9a48");
      const colors = ["#e8456a", "#ff8ab0", "#ffffff"];
      for (let i = 0; i < 8; i++) {
        const fx = cx - 11 + r() * 22, fy = base - 24 + r() * 16;
        R(g, fx - 1, fy - 1, 4, 4, "#5a0c1a");
        R(g, fx - 1, fy - 1, 3, 3, colors[i % 3]);
        R(g, fx, fy - 1, 1, 1, "#ffd6e0");
      }
    }
  } else if (kind === "tomb") {
    R(g, cx - 8, base - 22, 16, 20, "#16141e");
    E(g, cx, base - 22, 8, 6, "#16141e");
    R(g, cx - 7, base - 21, 14, 18, "#6a6680");
    E(g, cx, base - 22, 7, 5, "#6a6680");
    R(g, cx - 6, base - 22, 2, 18, "#8a86a0");
    R(g, cx - 1, base - 20, 2, 8, "#3a3648");
    R(g, cx - 4, base - 17, 8, 2, "#3a3648");
    for (let i = 0; i < 5; i++) R(g, cx - 8 + i * 4, base - 4 - (i % 2), 3, 2, "#3a5a26");
  } else if (kind === "pumpkins") {
    for (const [px, py, s] of [[cx - 7, base - 7, 6], [cx + 7, base - 6, 5], [cx, base - 15, 7]]) {
      E(g, px, py, s + 1, s, "#5a2a08");
      E(g, px, py, s, s - 1, "#e07a1c");
      E(g, px - s / 3, py, s / 3, s - 2, "#f59a3a");
      R(g, px - 1, py - s - 1, 2, 3, "#3e6a22");
      R(g, px - 3, py - 1, 2, 2, "#ffe066");
      R(g, px + 1, py - 1, 2, 2, "#ffe066");
      R(g, px - 2, py + 2, 4, 1, "#ffe066");
    }
  } else if (kind === "crystal") {
    const cols = ["#7ad8ff", "#c58aff", "#9affe0"];
    for (const [ox, h, w, ci] of [[-7, 22, 6, 0], [4, 30, 7, 1], [-1, 16, 5, 2], [9, 14, 4, 0]]) {
      const col = cols[ci];
      for (let i = 0; i < h; i++) {
        const half = Math.max(1, (w * (1 - Math.max(0, i - h * 0.75) / (h * 0.25))) / 2);
        R(g, cx + ox - half - 1, base - 4 - i, half * 2 + 2, 1, "#16162a");
      }
      for (let i = 0; i < h; i++) {
        const half = Math.max(0.5, (w * (1 - Math.max(0, i - h * 0.75) / (h * 0.25))) / 2 - 0.5);
        R(g, cx + ox - half, base - 4 - i, half * 2, 1, col);
        R(g, cx + ox - half, base - 4 - i, 1, 1, "#ffffff");
      }
    }
    E(g, cx, base - 3, 14, 3, "#3a4656");
  } else if (kind === "willow") {
    R(g, cx - 2, base - 26, 5, 24, "#3a2a1a");
    E(g, cx, base - 34, 16, 10, "#1a4a3a");
    for (let i = 0; i < 9; i++) {
      const vx = cx - 15 + i * 3.7;
      R(g, vx, base - 34, 2, 18 + (i % 3) * 5, i % 2 ? "#2a6a4a" : "#3a8a5a");
    }
  }
  return c;
}

const decoCache = new Map();
export function decoFor(th, x, y) {
  const kinds = th.deco;
  const kind = kinds[(x * 7 + y * 13) % kinds.length];
  const key = kind + ((x * 31 + y * 17) % 3);
  if (!decoCache.has(key)) decoCache.set(key, decoSprite(kind, key.length * 97 + ((x * 31 + y * 17) % 3)));
  return decoCache.get(key);
}

// ------------------------------------------------------------------ pré-render da fase
export function renderTerrain(level) {
  const th = THEMES[level.theme];
  const { W, H, grid } = level;
  const { c, g } = makeCanvas(W * T, H * T);
  const lights = [];
  const torches = [];
  const isWall = (x, y) => {
    const ch = grid[y]?.[x];
    return ch === "#" || ch === "W" || ch === "=" || ch === "v" || ch === "D" || ch === undefined || ch === " ";
  };
  const isWater = (x, y) => grid[y]?.[x] === "~";
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      const px = x * T, py = y * T;
      const r = rng(x * 92821 + y * 68917 + 7);
      if (ch === " ") {
        R(g, px, py, T, T, th.bg);
        continue;
      }
      if (ch === "~") {
        waterBase(g, th, px, py, { up: isWater(x, y - 1), down: isWater(x, y + 1), left: isWater(x - 1, y), right: isWater(x + 1, y) }, r);
        continue;
      }
      if (isWall(x, y)) {
        wallTile.lastWindow = false;
        wallTile.lastTorch = null;
        wallTile(g, th, px, py, { up: isWall(x, y - 1), down: isWall(x, y + 1), left: isWall(x - 1, y), right: isWall(x + 1, y) }, r, ch === "W");
        if (wallTile.lastWindow) lights.push({ x: px + 16, y: py + T - 8, r: 34, color: th.windowGlow });
        if (wallTile.lastTorch) torches.push(wallTile.lastTorch);
        continue;
      }
      if (ch === ",") floor2Tile(g, th, px, py, th.floor2C, r);
      else floorTile(g, th, px, py, th.floor, th.floorC, r);
      if (ch === "%") flowerDecal(g, th, px, py, r);
      // sombra projetada pela parede acima
      if (isWall(x, y - 1)) {
        g.fillStyle = "rgba(0,0,0,0.22)";
        g.fillRect(px, py, T, 6);
        g.fillStyle = "rgba(0,0,0,0.12)";
        g.fillRect(px, py + 6, T, 4);
      }
      if (isWall(x - 1, y)) R(g, px, py, 3, T, "rgba(0,0,0,0.12)");
      if (isWall(x, y - 1) && isWall(x - 1, y)) R(g, px, py, 8, 8, "rgba(0,0,0,0.12)");
      if (isWall(x, y - 1) && th.floor !== "cobble" && r() < 0.55) {
        for (let i = 0; i < 4; i++) {
          const gx = px + 2 + r() * 28;
          R(g, gx, py + 7, 1, 3, th.floor === "sand" ? "#8ab86a" : "#3a7a3a");
          R(g, gx + 1, py + 8, 1, 2, th.floor === "sand" ? "#6a9a4a" : "#2a5a2a");
        }
      }
    }
  }
  return { canvas: c, lights, torches };
}

/** Desenha um único tile de chão (usado quando uma parede rachada é quebrada). */
export function paintFloor(g, level, x, y) {
  const th = THEMES[level.theme];
  floorTile(g, th, x * T, y * T, th.floor, th.floorC, rng(x * 92821 + y * 68917 + 7));
}

// ------------------------------------------------------------------ itens
export const ROSES = {
  ibiza: { name: "Rosa do Primeiro Encontro", petal: ["#7a0c1e", "#c8102e", "#ff3a5a", "#ff9aaa"], glow: "#ff5a76", sparkle: "#ffd36a" },
  praia: { name: "Rosa da Viagem", petal: ["#8a2a1a", "#e8603a", "#ff9a6a", "#ffd0b0"], glow: "#ff9a6a", sparkle: "#7ae8f0" },
  jardim: { name: "Rosa das Mil Flores", petal: ["#8a1a5a", "#e8458a", "#ff8ac4", "#ffd6ea"], glow: "#ff8ac4", sparkle: "#ffffff" },
  bruxas: { name: "Rosa da Meia-Noite", petal: ["#1a0a24", "#4a1a6a", "#8a3ab8", "#d08aff"], glow: "#b06aff", sparkle: "#ff9a2a" },
  lago: { name: "Rosa da Lua", petal: ["#4a6a9a", "#bcd4f0", "#eef6ff", "#ffffff"], glow: "#cfe8ff", sparkle: "#fff6b0" }
};

/** Rosa em pixel art (âncora no centro do botão). s = escala. */
export function drawRose(g, x, y, kind, s = 1, t = 0, withStem = true) {
  const r = ROSES[kind] || ROSES.ibiza;
  const p = r.petal;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.scale(s, s);
  if (withStem) {
    R(g, -1, 2, 2, 14, "#1f5a24");
    R(g, 0, 2, 1, 14, "#3a8a3a");
    E(g, -5, 9, 4, 2, "#2f7a3a");
    E(g, 5, 12, 4, 2, "#2f7a3a");
    R(g, -6, 9, 3, 1, "#5ab04a");
  }
  // pétalas externas
  E(g, -5, -1, 5, 5, p[0]);
  E(g, 5, -1, 5, 5, p[0]);
  E(g, 0, 2, 7, 4, p[0]);
  E(g, -4, -2, 4, 4, p[1]);
  E(g, 4, -2, 4, 4, p[1]);
  E(g, 0, 1, 6, 3, p[1]);
  // miolo em espiral
  E(g, 0, -3, 5, 4, p[0]);
  E(g, 0, -3, 4, 3, p[2]);
  E(g, -1, -4, 2, 2, p[1]);
  R(g, -1, -4, 3, 1, p[0]);
  R(g, 1, -3, 1, 2, p[0]);
  R(g, -3, -2, 2, 1, p[3]);
  R(g, 2, 0, 2, 1, p[3]);
  if (kind === "lago") {
    g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.2;
    g.strokeStyle = "#fff6b0";
    g.lineWidth = 0.7;
    g.beginPath();
    g.ellipse(0, -2, 10, 9, 0, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
  }
  if (kind === "praia") {
    R(g, 3, -5, 1, 1, "#ffffff");
    R(g, -4, 1, 1, 1, "#ffffff");
  }
  if (kind === "bruxas") {
    R(g, -1, -3, 2, 1, "#ff9a2a");
  }
  g.restore();
}

export function drawKey(g, x, y, s = 1, silver = false) {
  const c = silver ? ["#3a3a4a", "#c9c9d6", "#ffffff", "#8a8a9a"] : ["#5a3a08", "#f5c542", "#fff2a0", "#c8901a"];
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.scale(s, s);
  // argola em coração
  for (const [dx, dy, w] of [[-5, -9, 4], [1, -9, 4], [-6, -8, 12], [-6, -7, 12], [-6, -6, 12], [-5, -5, 10], [-4, -4, 8], [-3, -3, 6], [-2, -2, 4]]) R(g, dx - 1, dy - 1, w + 2, 3, c[0]);
  for (const [dx, dy, w] of [[-5, -9, 4], [1, -9, 4], [-6, -8, 12], [-6, -7, 12], [-6, -6, 12], [-5, -5, 10], [-4, -4, 8], [-3, -3, 6], [-2, -2, 4]]) R(g, dx, dy, w, 1, c[1]);
  R(g, -2, -7, 4, 2, silver ? "#55556a" : "#c81d3a");
  R(g, -4, -8, 2, 1, c[2]);
  // haste
  R(g, -2, -2, 4, 13, c[0]);
  R(g, -1, -2, 2, 12, c[1]);
  R(g, -1, -2, 1, 12, c[2]);
  R(g, 1, 5, 4, 2, c[0]);
  R(g, 1, 8, 3, 2, c[0]);
  R(g, 1, 5, 3, 1, c[3]);
  R(g, 1, 8, 2, 1, c[3]);
  g.restore();
}

export function drawDiamond(g, x, y, t = 0) {
  x = Math.round(x);
  y = Math.round(y);
  const rows = [[0, 2], [-2, 6], [-4, 10], [-5, 12], [-4, 10], [-3, 8], [-2, 6], [-1, 4], [0, 2]];
  rows.forEach(([o, w], i) => R(g, x - w / 2 - 1, y - 6 + i, w + 2, 1, "#3a0a2a"));
  rows.forEach(([o, w], i) => R(g, x - w / 2, y - 6 + i, w, 1, i < 3 ? "#ffb0e0" : i < 5 ? "#ff5ab4" : "#c81d8a"));
  R(g, x - 3, y - 4, 2, 1, "#ffffff");
  if (Math.sin(t * 4 + x) > 0.7) {
    R(g, x + 4, y - 8, 1, 3, "#ffffff");
    R(g, x + 3, y - 7, 3, 1, "#ffffff");
  }
}

export function drawHeart(g, x, y, c = "#ff3a5a") {
  for (const [dx, dy, w] of [[-3, -2, 2], [1, -2, 2], [-4, -1, 8], [-4, 0, 8], [-3, 1, 6], [-2, 2, 4], [-1, 3, 2]]) R(g, x + dx, y + dy, w, 1, c);
  R(g, x - 3, y - 1, 1, 1, "#ffc0cc");
}

const iconCache = new Map();
/** Ícone (dataURL) para a interface React. */
export function iconURL(kind, arg) {
  const key = kind + ":" + arg;
  if (iconCache.has(key)) return iconCache.get(key);
  const { c, g } = makeCanvas(32, 32);
  if (kind === "rose") drawRose(g, 16, 13, arg, 1, 0, true);
  else if (kind === "key") drawKey(g, 16, 16, 1, arg === "silver");
  else if (kind === "diamond") drawDiamond(g, 16, 18);
  else if (kind === "heart") {
    g.scale(2, 2);
    drawHeart(g, 8, 8, arg === "empty" ? "#3a2a3a" : "#ff3a5a");
  }
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}
