// ============================================================================
// OBJETOS DE CENÁRIO (props)
// ----------------------------------------------------------------------------
// Cada tipo define:
//   size(p)  -> { w, h } do sprite (âncora = centro da base, em x,y do prop)
//   box(p)   -> caixa de colisão relativa à base [dx, dy, w, h] ou null
//   light(p) -> { r, color } luz emitida em fases noturnas (opcional)
//   draw(g, p, w, h) -> desenha o sprite em um canvas próprio (é cacheado)
//
// Para usar um sprite final no lugar do desenho procedural, basta adicionar
// "image: '/assets/...png'" ao tipo (veja SPRITE_OVERRIDES no fim do arquivo).
// ============================================================================

import { R, E, L, rng, hashStr, makeCanvas } from "./pixel";

export const PALETTES = {
  green: ["#173d22", "#24613a", "#3a8a45", "#62b552", "#a5dd6e"],
  dark: ["#0f2418", "#1a3a26", "#265234", "#3a7045", "#5a9a5a"],
  autumn: ["#4a160c", "#86300f", "#c4561a", "#ec8f2e", "#ffd06a"],
  amber: ["#4a2a0c", "#7f4a12", "#b9761f", "#e3a83a", "#ffe08a"],
  cherry: ["#5a1a3a", "#9a3566", "#d0609a", "#f29ac4", "#ffd6ea"],
  blue: ["#0e2236", "#1a3d5c", "#2c5f86", "#4f8fb8", "#8fc8e8"],
  palm: ["#123d20", "#1f6b30", "#33963f", "#6cc44f", "#b3ec7a"]
};

const pal = (p, def) => PALETTES[p.pal] || PALETTES[def];

function canopy(g, cx, cy, rx, ry, c, seed) {
  const blobs = [
    [0, 0.1, 1],
    [-0.5, 0.3, 0.62],
    [0.5, 0.3, 0.62],
    [-0.32, -0.35, 0.62],
    [0.32, -0.35, 0.62],
    [0, -0.55, 0.5]
  ];
  for (const [bx, by, s] of blobs) E(g, cx + bx * rx, cy + by * ry, rx * s + 1.5, ry * s + 1.5, c[0]);
  for (const [bx, by, s] of blobs) E(g, cx + bx * rx, cy + by * ry, rx * s, ry * s, c[1]);
  for (const [bx, by, s] of blobs) E(g, cx + bx * rx - 1, cy + by * ry - 2, rx * s * 0.8, ry * s * 0.7, c[2]);
  for (const [bx, by, s] of blobs) E(g, cx + bx * rx - rx * s * 0.3, cy + by * ry - ry * s * 0.4, rx * s * 0.35, ry * s * 0.3, c[3]);
  const r = rng(seed);
  for (let i = 0; i < rx * ry * 0.06; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.8;
    R(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d - 2, 1, 1, r() > 0.5 ? c[4] : c[1]);
  }
}

const TRUNK = ["#2a170c", "#4a2c1a", "#6b4226", "#8a5a34"];

export const PROPS = {
  tree: {
    size: (p) => ({ w: Math.round(42 * (p.s || 1)), h: Math.round(58 * (p.s || 1)) }),
    box: (p) => [-5 * (p.s || 1), -6, 10 * (p.s || 1), 6],
    draw(g, p, w, h) {
      const s = p.s || 1;
      const cx = w / 2;
      E(g, cx, h - 3, 12 * s, 3, "rgba(0,0,0,0.25)");
      R(g, cx - 4 * s, h - 20 * s, 8 * s, 18 * s, TRUNK[0]);
      R(g, cx - 3 * s, h - 20 * s, 6 * s, 18 * s, TRUNK[1]);
      R(g, cx - 2 * s, h - 20 * s, 2 * s, 17 * s, TRUNK[2]);
      R(g, cx - 6 * s, h - 3, 3 * s, 2, TRUNK[1]);
      R(g, cx + 3 * s, h - 3, 3 * s, 2, TRUNK[1]);
      canopy(g, cx, h * 0.38, w / 2 - 3, h * 0.3, pal(p, "green"), hashStr(p.pal || "g") + w);
    }
  },
  pine: {
    size: (p) => ({ w: Math.round(32 * (p.s || 1)), h: Math.round(60 * (p.s || 1)) }),
    box: (p) => [-4, -6, 8, 6],
    draw(g, p, w, h) {
      const c = pal(p, "dark");
      const cx = w / 2;
      E(g, cx, h - 3, 10, 3, "rgba(0,0,0,0.25)");
      R(g, cx - 2, h - 12, 5, 11, TRUNK[1]);
      for (let i = 0; i < 4; i++) {
        const top = h * 0.05 + i * h * 0.17;
        const hh = h * 0.32;
        for (let y = 0; y < hh; y++) {
          const half = ((y / hh) * w) / 2 - 1;
          R(g, cx - half - 1, top + y, half * 2 + 2, 1, c[0]);
          R(g, cx - half, top + y, half * 2, 1, c[2]);
          R(g, cx - half, top + y, half * 0.7, 1, c[3]);
        }
      }
    }
  },
  palm: {
    size: (p) => ({ w: 56, h: Math.round(74 * (p.s || 1)) }),
    box: () => [-4, -5, 8, 5],
    draw(g, p, w, h) {
      const c = PALETTES.palm;
      const dir = p.flip ? -1 : 1;
      E(g, w / 2, h - 3, 10, 3, "rgba(0,0,0,0.25)");
      const n = 16;
      let tx = w / 2, ty = h - 4;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        tx = w / 2 + dir * t * t * 10;
        ty = h - 4 - i * ((h - 22) / n);
        R(g, tx - 3, ty - 4, 7, 5, "#4a2c1a");
        R(g, tx - 2, ty - 4, 5, 4, i % 2 ? "#a8743f" : "#c98f52");
        R(g, tx - 2, ty - 1, 5, 1, "#7a4c26");
      }
      const topX = tx, topY = ty - 2;
      const fronds = [-2.9, -2.4, -1.9, -1.2, -0.6, -0.15, 0.3];
      for (const a of fronds) {
        const len = 22 + (a > -1.5 && a < -1.0 ? -4 : 0);
        for (let t = 0; t <= 1; t += 0.05) {
          const x = topX + Math.cos(a) * len * t;
          const y = topY + Math.sin(a) * len * t * 0.7 + t * t * 12;
          R(g, x - 2, y - 1, 4, 3, c[0]);
        }
        for (let t = 0; t <= 1; t += 0.05) {
          const x = topX + Math.cos(a) * len * t;
          const y = topY + Math.sin(a) * len * t * 0.7 + t * t * 12;
          R(g, x - 1, y - 1, 3, 2, t < 0.5 ? c[2] : c[3]);
          if (t > 0.15 && Math.round(t * 20) % 2 === 0) R(g, x, y + 1, 1, 2, c[1]);
        }
      }
      E(g, topX - 2, topY + 3, 2.5, 2.5, "#5a3a1a");
      E(g, topX + 3, topY + 4, 2.5, 2.5, "#6b4422");
    }
  },
  deadTree: {
    size: () => ({ w: 40, h: 56 }),
    box: () => [-4, -5, 8, 5],
    draw(g, p, w, h) {
      const c = ["#1b1424", "#3a2d44", "#5a4866"];
      const cx = w / 2;
      E(g, cx, h - 3, 10, 3, "rgba(0,0,0,0.3)");
      L(g, cx, h - 2, cx, h - 30, 6, c[0]);
      L(g, cx, h - 2, cx, h - 30, 4, c[1]);
      const br = [
        [cx, h - 26, cx - 14, h - 44],
        [cx, h - 30, cx + 12, h - 48],
        [cx - 8, h - 36, cx - 18, h - 38],
        [cx + 6, h - 40, cx + 16, h - 40],
        [cx, h - 30, cx + 2, h - 52]
      ];
      for (const b of br) L(g, b[0], b[1], b[2], b[3], 3, c[0]);
      for (const b of br) L(g, b[0], b[1], b[2], b[3], 2, c[1]);
      R(g, cx - 1, h - 28, 1, 24, c[2]);
    }
  },
  bush: {
    size: (p) => ({ w: Math.round(24 * (p.s || 1)), h: Math.round(18 * (p.s || 1)) }),
    box: (p) => [-8 * (p.s || 1), -5, 16 * (p.s || 1), 5],
    draw(g, p, w, h) {
      const c = pal(p, "green");
      E(g, w / 2, h - 2, w / 2 - 1, 2, "rgba(0,0,0,0.25)");
      canopy(g, w / 2, h / 2 + 1, w / 2 - 3, h / 2 - 3, c, w * 7);
      if (p.flowers) {
        const r = rng(w * 13 + h);
        for (let i = 0; i < 6; i++) R(g, 3 + r() * (w - 6), 3 + r() * (h - 8), 2, 2, p.flowers);
      }
    }
  },
  rock: {
    size: (p) => ({ w: Math.round(20 * (p.s || 1)), h: Math.round(15 * (p.s || 1)) }),
    box: (p) => [-8 * (p.s || 1), -6 * (p.s || 1), 16 * (p.s || 1), 6 * (p.s || 1)],
    draw(g, p, w, h) {
      const c = p.mossy ? ["#26302a", "#4a5a4e", "#6a7d6a", "#8fae7a"] : ["#2a2a36", "#55576a", "#7d8094", "#a7aabd"];
      E(g, w / 2, h - 3, w / 2 - 1, h / 2 - 2, c[0]);
      E(g, w / 2, h - 4, w / 2 - 2, h / 2 - 3, c[1]);
      E(g, w / 2 - 1, h - 6, w / 2 - 4, h / 2 - 5, c[2]);
      E(g, w / 2 - 3, h - 8, w / 5, h / 7, c[3]);
    }
  },
  house: {
    size: (p) => ({ w: p.w || 72, h: (p.h || 46) + 30 }),
    box: (p) => [-(p.w || 72) / 2 + 2, -18, (p.w || 72) - 4, 16],
    light: (p) => (p.style === "haunted" ? { r: 30, color: "#9cff8a" } : { r: 36, color: p.glow || "#ffc867" }),
    draw(g, p, w, h) {
      const st = p.style || "cottage";
      const wallC = {
        cottage: ["#3a2418", "#d9c3a0", "#b89f7c"],
        party: ["#2a1830", "#f2e6d8", "#d4c4b4"],
        haunted: ["#120d18", "#4d4260", "#3a3048"],
        stone: ["#1e1e28", "#9a96a6", "#7a7688"]
      }[st];
      const roofC = {
        cottage: ["#3a1410", "#8e3a24", "#b8543a"],
        party: ["#1a1030", p.roof || "#e0457b", "#ff7aa8"],
        haunted: ["#0c0812", "#2a1f3a", "#3e2f52"],
        stone: ["#1a1420", "#4a4458", "#666078"]
      }[st];
      const wallH = (p.h || 46) - 6;
      const wallTop = h - wallH - 2;
      E(g, w / 2, h - 2, w / 2, 3, "rgba(0,0,0,0.3)");
      R(g, 3, wallTop, w - 6, wallH, wallC[0]);
      R(g, 4, wallTop, w - 8, wallH - 1, wallC[1]);
      for (let y = wallTop + 5; y < h - 4; y += 5) R(g, 4, y, w - 8, 1, wallC[2]);
      // telhado
      const roofH = 30;
      for (let i = 0; i < roofH; i++) {
        const inset = Math.max(0, (roofH - i) * 0.9 - 6);
        R(g, inset, wallTop - roofH + i + 4, w - inset * 2, 1, i < 2 || i === roofH - 1 ? roofC[0] : i % 4 === 0 ? roofC[2] : roofC[1]);
      }
      R(g, 0, wallTop + 3, w, 2, roofC[0]);
      if (st === "haunted") {
        for (let i = 0; i < 5; i++) R(g, 8 + i * ((w - 16) / 5), wallTop - 10 + (i % 2) * 6, 4, 1, roofC[0]);
      }
      // porta
      const dx = w / 2 - 6;
      R(g, dx - 1, h - 20, 14, 18, wallC[0]);
      R(g, dx, h - 19, 12, 17, st === "haunted" ? "#1a0f20" : "#6b4226");
      R(g, dx + 9, h - 11, 2, 2, "#f5c542");
      // janelas
      const winC = st === "haunted" ? "#9cff8a" : st === "party" ? p.glow || "#ff7ad9" : "#ffd36a";
      for (const wx of [10, w - 22]) {
        R(g, wx - 1, wallTop + 7, 14, 12, wallC[0]);
        R(g, wx, wallTop + 8, 12, 10, winC);
        R(g, wx + 5, wallTop + 8, 2, 10, wallC[0]);
        R(g, wx, wallTop + 12, 12, 1, wallC[0]);
        R(g, wx + 1, wallTop + 9, 3, 2, "rgba(255,255,255,0.6)");
      }
      if (st === "party") {
        R(g, w / 2 - 16, wallTop - 2, 32, 7, "#1a1030");
        for (let i = 0; i < 6; i++) R(g, w / 2 - 14 + i * 5, wallTop, 3, 3, ["#ff5ab4", "#5af0ff", "#ffe45a"][i % 3]);
      }
    }
  },
  stage: {
    size: () => ({ w: 110, h: 62 }),
    box: () => [-54, -26, 108, 24],
    light: () => ({ r: 70, color: "#ff5ad0" }),
    draw(g, p, w, h) {
      E(g, w / 2, h - 2, w / 2, 4, "rgba(0,0,0,0.35)");
      R(g, 2, h - 26, w - 4, 24, "#1a1024");
      R(g, 3, h - 25, w - 6, 22, "#3a2650");
      for (let x = 6; x < w - 6; x += 8) R(g, x, h - 24, 1, 20, "#2a1a3a");
      R(g, 3, h - 25, w - 6, 2, "#ff5ad0");
      // caixas de som
      for (const sx of [6, w - 24]) {
        R(g, sx, h - 50, 18, 26, "#0c0812");
        R(g, sx + 1, h - 49, 16, 24, "#2a2236");
        E(g, sx + 9, h - 42, 5, 5, "#0c0812");
        E(g, sx + 9, h - 42, 3, 3, "#5a4a70");
        E(g, sx + 9, h - 30, 4, 4, "#0c0812");
      }
      // mesa do DJ
      R(g, w / 2 - 20, h - 40, 40, 14, "#0c0812");
      R(g, w / 2 - 19, h - 39, 38, 12, "#4a3a60");
      E(g, w / 2 - 9, h - 34, 5, 3, "#1a1024");
      E(g, w / 2 + 9, h - 34, 5, 3, "#1a1024");
      R(g, w / 2 - 2, h - 37, 4, 6, "#5af0ff");
      // arco de luzes
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const x = 8 + t * (w - 16);
        const y = h - 58 + Math.pow(2 * t - 1, 2) * 6;
        R(g, x - 1, y - 1, 3, 3, ["#ff5ab4", "#5af0ff", "#ffe45a", "#9aff6a"][i % 4]);
      }
    }
  },
  neonSign: {
    size: () => ({ w: 36, h: 40 }),
    box: () => [-3, -4, 6, 4],
    light: (p) => ({ r: 34, color: p.color || "#ff5ad0" }),
    draw(g, p, w, h) {
      const c = p.color || "#ff5ad0";
      R(g, w / 2 - 1, h - 18, 3, 17, "#2a2236");
      R(g, 2, 2, w - 4, 18, "#120c1a");
      R(g, 3, 3, w - 6, 16, "#1f1630");
      R(g, 4, 4, w - 8, 1, c);
      R(g, 4, 17, w - 8, 1, c);
      R(g, 4, 4, 1, 14, c);
      R(g, w - 5, 4, 1, 14, c);
      // coração neon
      const hx = w / 2, hy = 11;
      for (const [x, y] of [[-3, -2], [-2, -3], [-1, -2], [0, -1], [1, -2], [2, -3], [3, -2], [3, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-3, -1]]) {
        R(g, hx + x, hy + y, 1, 1, "#fff");
      }
    }
  },
  lantern: {
    size: () => ({ w: 14, h: 34 }),
    box: () => [-2, -3, 4, 3],
    light: (p) => ({ r: 46, color: p.color || "#ffc867", flicker: true }),
    draw(g, p, w, h) {
      R(g, w / 2 - 1, 8, 2, h - 8, "#1e1a24");
      R(g, w / 2 - 3, h - 3, 6, 3, "#1e1a24");
      R(g, w / 2 - 4, 2, 8, 9, "#1e1a24");
      R(g, w / 2 - 3, 3, 6, 7, p.color || "#ffd36a");
      R(g, w / 2 - 2, 4, 2, 3, "#fff6d0");
      R(g, w / 2 - 5, 1, 10, 2, "#2a2430");
    }
  },
  torch: {
    size: () => ({ w: 10, h: 26 }),
    box: () => [-2, -3, 4, 3],
    light: () => ({ r: 50, color: "#ff9a3a", flicker: true }),
    draw(g, p, w, h) {
      R(g, w / 2 - 1, 8, 3, h - 8, "#4a2c1a");
      R(g, w / 2 - 3, 6, 7, 4, "#2a2028");
      E(g, w / 2, 4, 3, 4, "#ff7a1a");
      E(g, w / 2, 5, 2, 2, "#ffe06a");
    }
  },
  fence: {
    size: (p) => ({ w: p.w || 32, h: 16 }),
    box: (p) => [-(p.w || 32) / 2, -5, p.w || 32, 5],
    draw(g, p, w, h) {
      const c = p.white ? ["#5a5a66", "#e8e4dc", "#c8c2b6"] : ["#2a170c", "#8a5a34", "#6b4226"];
      R(g, 0, 4, w, 3, c[0]);
      R(g, 0, 9, w, 3, c[0]);
      R(g, 0, 4, w, 2, c[1]);
      R(g, 0, 9, w, 2, c[1]);
      for (let x = 1; x < w; x += 8) {
        R(g, x, 1, 4, h - 2, c[0]);
        R(g, x + 1, 1, 2, h - 3, c[1]);
        R(g, x + 1, h - 4, 2, 2, c[2]);
      }
    }
  },
  hedge: {
    size: (p) => ({ w: p.w || 32, h: (p.d || 16) + 14 }),
    box: (p) => [-(p.w || 32) / 2, -(p.d || 16), p.w || 32, p.d || 16],
    draw(g, p, w, h) {
      const c = pal(p, "dark");
      R(g, 0, 0, w, h, c[0]);
      R(g, 1, 1, w - 2, h - 15, c[3]);
      R(g, 1, h - 15, w - 2, 13, c[1]);
      const r = rng(w * 31 + h);
      for (let i = 0; i < (w * h) / 14; i++) {
        const x = 1 + r() * (w - 3), y = 1 + r() * (h - 4);
        R(g, x, y, 2, 1, y < h - 15 ? c[4] : c[2]);
      }
      if (p.flowers) for (let i = 0; i < w / 8; i++) R(g, 2 + r() * (w - 4), 2 + r() * (h - 6), 2, 2, p.flowers);
      R(g, 0, h - 2, w, 2, "rgba(0,0,0,0.35)");
    }
  },
  wall: {
    size: (p) => ({ w: p.w || 32, h: (p.d || 12) + (p.tall || 22) }),
    box: (p) => [-(p.w || 32) / 2, -(p.d || 12), p.w || 32, p.d || 12],
    draw(g, p, w, h) {
      const c = p.ruin ? ["#1e2420", "#5d6a5c", "#7b8a78", "#4a7a3a"] : ["#1e1e28", "#8a8698", "#a8a4b8", "#6a6678"];
      const tall = p.tall || 22;
      R(g, 0, 0, w, h, c[0]);
      R(g, 1, 1, w - 2, h - tall - 1, c[2]);
      R(g, 1, h - tall, w - 2, tall - 1, c[1]);
      for (let y = h - tall + 4; y < h - 1; y += 5) {
        R(g, 1, y, w - 2, 1, c[0]);
        for (let x = ((y / 5) % 2) * 6 + 2; x < w - 2; x += 12) R(g, x, y - 4, 1, 4, c[0]);
      }
      if (p.ruin) {
        const r = rng(w + h);
        for (let i = 0; i < w / 6; i++) R(g, r() * w, h - tall + r() * tall, 3, 2, c[3]);
      }
      if (p.battlement) for (let x = 1; x < w - 4; x += 8) R(g, x, -0, 5, 4, c[2]);
    }
  },
  pillar: {
    size: (p) => ({ w: 18, h: p.broken ? 26 : 46 }),
    box: () => [-7, -6, 14, 6],
    draw(g, p, w, h) {
      const c = ["#1e2420", "#7b8a78", "#9aaa96", "#4a7a3a"];
      E(g, w / 2, h - 3, 8, 3, "rgba(0,0,0,0.3)");
      R(g, 1, h - 7, w - 2, 6, c[0]);
      R(g, 2, h - 6, w - 4, 4, c[2]);
      R(g, 3, 6, w - 6, h - 12, c[0]);
      R(g, 4, 6, w - 8, h - 12, c[1]);
      R(g, 5, 6, 2, h - 12, c[2]);
      for (let x = 8; x < w - 4; x += 3) R(g, x, 6, 1, h - 12, c[0]);
      if (p.broken) {
        R(g, 3, 4, 4, 3, c[1]);
        R(g, 9, 2, 5, 5, c[1]);
      } else {
        R(g, 1, 2, w - 2, 5, c[0]);
        R(g, 2, 3, w - 4, 3, c[2]);
      }
      R(g, 4, h - 18, 3, 6, c[3]);
    }
  },
  pumpkin: {
    size: (p) => ({ w: Math.round(16 * (p.s || 1)), h: Math.round(14 * (p.s || 1)) }),
    box: (p) => [-6 * (p.s || 1), -5, 12 * (p.s || 1), 5],
    light: () => ({ r: 22, color: "#ff9a2a", flicker: true }),
    draw(g, p, w, h) {
      const cx = w / 2, cy = h / 2 + 1;
      E(g, cx, cy, w / 2 - 0.5, h / 2 - 1.5, "#5a2a08");
      E(g, cx, cy, w / 2 - 1.5, h / 2 - 2.5, "#e07a1c");
      E(g, cx - w / 5, cy, w / 6, h / 2 - 3, "#f59a3a");
      R(g, cx - 1, cy - h / 2 + 2, 1, h - 5, "#b85a10");
      R(g, cx - 1, 0, 3, 3, "#3e6a22");
      R(g, cx - w / 4 - 1, cy - 2, 3, 2, "#ffe066");
      R(g, cx + w / 4 - 2, cy - 2, 3, 2, "#ffe066");
      R(g, cx - w / 4, cy + 1, w / 2, 2, "#ffe066");
      R(g, cx - 1, cy + 1, 2, 1, "#e07a1c");
    }
  },
  grave: {
    size: () => ({ w: 14, h: 18 }),
    box: () => [-6, -4, 12, 4],
    draw(g, p, w, h) {
      R(g, 1, 4, w - 2, h - 5, "#1a1824");
      E(g, w / 2, 5, w / 2 - 1, 4, "#1a1824");
      R(g, 2, 5, w - 4, h - 7, "#6a6680");
      E(g, w / 2, 5, w / 2 - 2, 3, "#6a6680");
      R(g, 3, 4, 2, h - 8, "#8a86a0");
      R(g, w / 2 - 1, 6, 2, 6, "#3a3648");
      R(g, w / 2 - 3, 8, 6, 2, "#3a3648");
      R(g, 0, h - 3, w, 3, "#2a3a26");
    }
  },
  cauldron: {
    size: () => ({ w: 22, h: 20 }),
    box: () => [-9, -6, 18, 6],
    light: () => ({ r: 34, color: "#7aff5a", flicker: true }),
    draw(g, p, w, h) {
      E(g, w / 2, h - 7, 10, 7, "#0c0a10");
      E(g, w / 2, h - 7, 9, 6, "#2a2636");
      E(g, w / 2 - 3, h - 9, 3, 2, "#4a4658");
      E(g, w / 2, h - 13, 9, 2, "#7aff5a");
      R(g, w / 2 - 4, h - 17, 3, 3, "#b4ff9a");
      R(g, w / 2 + 3, h - 19, 2, 2, "#b4ff9a");
    }
  },
  umbrella: {
    size: () => ({ w: 40, h: 42 }),
    box: () => [-2, -3, 4, 3],
    draw(g, p, w, h) {
      const c = p.color || "#e84a5a";
      R(g, w / 2 - 1, 8, 2, h - 8, "#e8e4dc");
      E(g, w / 2 + 4, h - 2, 14, 3, "rgba(0,0,0,0.2)");
      for (let i = 0; i < 12; i++) {
        const half = 4 + i * 1.5;
        R(g, w / 2 - half - 1, 2 + i, half * 2 + 2, 1, "#4a1a20");
        for (let x = -half; x < half; x++) {
          const seg = Math.floor(((x + half) / (half * 2)) * 6);
          R(g, w / 2 + x, 2 + i, 1, 1, seg % 2 ? "#fff6e8" : c);
        }
      }
    }
  },
  boat: {
    size: () => ({ w: 48, h: 22 }),
    box: () => [-22, -8, 44, 8],
    draw(g, p, w, h) {
      E(g, w / 2, h - 7, w / 2 - 1, 7, "#2a170c");
      E(g, w / 2, h - 8, w / 2 - 3, 5, "#8a5a34");
      E(g, w / 2, h - 9, w / 2 - 7, 3, "#5c381c");
      R(g, w / 2 - 1, 0, 2, 10, "#4a2c1a");
    }
  },
  barrel: {
    size: () => ({ w: 14, h: 18 }),
    box: () => [-6, -5, 12, 5],
    draw(g, p, w, h) {
      R(g, 1, 2, w - 2, h - 3, "#2a170c");
      R(g, 2, 2, w - 4, h - 4, "#8a5a34");
      R(g, 2, 5, w - 4, 1, "#3a3a44");
      R(g, 2, h - 6, w - 4, 1, "#3a3a44");
      E(g, w / 2, 3, w / 2 - 2, 2, "#6b4226");
      R(g, 4, 6, 2, h - 12, "#a8743f");
    }
  },
  crate: {
    size: () => ({ w: 16, h: 18 }),
    box: () => [-8, -6, 16, 6],
    draw(g, p, w, h) {
      R(g, 0, 2, w, h - 2, "#2a170c");
      R(g, 1, 3, w - 2, h - 4, "#a8743f");
      L(g, 2, 4, w - 3, h - 3, 1, "#6b4226");
      R(g, 1, 3, w - 2, 1, "#c99561");
    }
  },
  bench: {
    size: () => ({ w: 30, h: 16 }),
    box: () => [-14, -5, 28, 5],
    draw(g, p, w, h) {
      R(g, 1, 2, w - 2, 4, "#2a170c");
      R(g, 2, 2, w - 4, 3, "#a8743f");
      R(g, 1, 7, w - 2, 4, "#2a170c");
      R(g, 2, 7, w - 4, 3, "#8a5a34");
      R(g, 3, 10, 2, h - 10, "#2a170c");
      R(g, w - 5, 10, 2, h - 10, "#2a170c");
    }
  },
  fountain: {
    size: () => ({ w: 52, h: 40 }),
    box: () => [-24, -16, 48, 14],
    light: () => ({ r: 40, color: "#7ad8ff" }),
    draw(g, p, w, h) {
      E(g, w / 2, h - 10, 25, 9, "#2a2a36");
      E(g, w / 2, h - 11, 23, 7, "#a7aabd");
      E(g, w / 2, h - 11, 20, 5, "#3d93d6");
      E(g, w / 2 - 6, h - 12, 6, 2, "#8fd8ff");
      R(g, w / 2 - 3, h - 30, 6, 20, "#55576a");
      R(g, w / 2 - 2, h - 30, 3, 20, "#a7aabd");
      E(g, w / 2, h - 30, 8, 3, "#7d8094");
      R(g, w / 2 - 1, h - 38, 2, 8, "#bfefff");
    }
  },
  arch: {
    size: () => ({ w: 44, h: 50 }),
    box: () => null,
    solidPosts: true,
    draw(g, p, w, h) {
      const c = PALETTES.green;
      for (const x of [2, w - 8]) {
        R(g, x, 14, 6, h - 14, "#2a170c");
        R(g, x + 1, 14, 4, h - 15, "#8a5a34");
      }
      for (let i = 0; i <= 20; i++) {
        const a = Math.PI + (i / 20) * Math.PI;
        const x = w / 2 + Math.cos(a) * (w / 2 - 5);
        const y = 18 + Math.sin(a) * 14;
        E(g, x, y, 4, 4, c[1]);
        E(g, x - 1, y - 1, 2.5, 2.5, c[3]);
        if (i % 3 === 0) R(g, x - 1, y - 1, 3, 3, p.flowers || "#e8456a");
      }
      for (const x of [5, w - 5]) for (let y = 20; y < h - 4; y += 6) {
        E(g, x, y, 3, 3, c[2]);
        if (y % 12 === 2) R(g, x - 1, y, 2, 2, p.flowers || "#e8456a");
      }
    }
  },
  log: {
    size: () => ({ w: 40, h: 14 }),
    box: () => [-18, -8, 36, 8],
    draw(g, p, w, h) {
      R(g, 2, 2, w - 6, h - 4, "#2a170c");
      R(g, 3, 3, w - 8, h - 6, "#7a4c26");
      R(g, 3, 4, w - 8, 1, "#a8743f");
      E(g, w - 5, h / 2, 3, h / 2 - 2, "#2a170c");
      E(g, w - 5, h / 2, 2, h / 2 - 3, "#c99561");
      R(g, 8, 2, 4, 2, "#4a7a3a");
    }
  },
  mushroom: {
    size: () => ({ w: 12, h: 12 }),
    box: () => null,
    light: (p) => ({ r: 16, color: p.color || "#7ad8ff" }),
    draw(g, p, w, h) {
      const c = p.color || "#7ad8ff";
      R(g, 5, 6, 2, 6, "#e8e4dc");
      E(g, 6, 5, 5, 3, "#1a1a2a");
      E(g, 6, 5, 4, 2, c);
      R(g, 4, 4, 1, 1, "#fff");
      R(g, 2, 9, 1, 3, "#e8e4dc");
      E(g, 2, 9, 2, 1, c);
    }
  },
  reeds: {
    size: () => ({ w: 14, h: 18 }),
    box: () => null,
    draw(g) {
      for (const [x, hh] of [[2, 14], [5, 17], [8, 12], [11, 15]]) {
        R(g, x, 18 - hh, 1, hh, "#3a7a3a");
        R(g, x - 1, 18 - hh, 2, 4, "#6b4226");
      }
    }
  },
  roseBush: {
    size: (p) => ({ w: 22, h: 18 }),
    box: () => [-8, -5, 16, 5],
    draw(g, p, w, h) {
      const c = PALETTES.green;
      canopy(g, w / 2, h / 2 + 1, w / 2 - 3, h / 2 - 3, c, 99);
      const r = rng(hashStr(p.color || "r"));
      for (let i = 0; i < 7; i++) {
        const x = 3 + r() * (w - 7), y = 2 + r() * (h - 8);
        R(g, x, y, 3, 3, "#2a0c14");
        R(g, x, y, 2, 2, p.color || "#e8456a");
      }
    }
  },
  tower: {
    size: () => ({ w: 96, h: 230 }),
    box: () => [-44, -40, 88, 38],
    light: () => ({ r: 60, color: "#ffd9a0" }),
    draw(g, p, w, h) {
      const c = ["#1e1e28", "#b8b0c4", "#d8d0e2", "#8a849a"];
      E(g, w / 2, h - 4, 46, 6, "rgba(0,0,0,0.3)");
      const top = 46;
      R(g, 4, top, w - 8, h - top - 4, c[0]);
      R(g, 5, top, w - 10, h - top - 5, c[1]);
      R(g, 5, top, 10, h - top - 5, c[2]);
      R(g, w - 18, top, 13, h - top - 5, c[3]);
      for (let y = top + 6; y < h - 6; y += 7) {
        R(g, 5, y, w - 10, 1, c[3]);
        for (let x = ((y / 7) % 2) * 7 + 8; x < w - 8; x += 14) R(g, x, y - 6, 1, 6, c[3]);
      }
      // ameias
      for (let x = 0; x < w; x += 12) {
        R(g, x, top - 10, 8, 12, c[0]);
        R(g, x + 1, top - 9, 6, 10, c[2]);
      }
      // telhado cônico
      for (let i = 0; i < 40; i++) {
        const half = (i / 40) * (w / 2 - 2);
        R(g, w / 2 - half - 1, top - 50 + i, half * 2 + 2, 1, "#3a1430");
        R(g, w / 2 - half, top - 50 + i, half * 2, 1, i % 5 === 0 ? "#c84a7a" : "#9a2f5e");
      }
      R(g, w / 2, top - 58, 1, 9, "#4a2c1a");
      R(g, w / 2 + 1, top - 58, 7, 4, "#ff5a76");
      // janelas iluminadas
      for (const [wx, wy] of [[w / 2 - 6, top + 30], [w / 2 - 6, top + 80], [w / 2 - 6, top + 120]]) {
        R(g, wx - 1, wy - 1, 14, 18, c[0]);
        E(g, wx + 6, wy + 2, 6, 4, "#ffd36a");
        R(g, wx, wy + 2, 12, 14, "#ffd36a");
        R(g, wx + 5, wy, 2, 16, c[0]);
      }
      // moldura da porta (a porta em si é um objeto interativo)
      R(g, w / 2 - 15, h - 40, 30, 36, c[0]);
      E(g, w / 2, h - 40, 15, 8, c[0]);
      for (const x of [6, w - 14]) {
        R(g, x, h - 30, 8, 22, "#2a6a2a");
        R(g, x + 2, h - 28, 2, 2, "#ff7aa8");
        R(g, x + 5, h - 20, 2, 2, "#ff7aa8");
      }
    }
  },
  ruinArch: {
    size: () => ({ w: 70, h: 64 }),
    box: () => null,
    draw(g, p, w, h) {
      const c = ["#1e2420", "#7b8a78", "#9aaa96", "#4a7a3a"];
      for (const x of [0, w - 16]) {
        R(g, x, 8, 16, h - 8, c[0]);
        R(g, x + 1, 8, 14, h - 9, c[1]);
        R(g, x + 2, 8, 4, h - 9, c[2]);
      }
      R(g, 0, 2, w, 12, c[0]);
      R(g, 1, 3, w - 2, 10, c[1]);
      R(g, 1, 3, w - 2, 3, c[2]);
      R(g, 20, 1, 12, 6, c[3]);
      R(g, w - 30, 12, 8, 10, c[3]);
    }
  }
};

// Postes do arco também colidem.
PROPS.arch.extraBoxes = () => [[-20, -5, 6, 5], [14, -5, 6, 5]];
PROPS.ruinArch.extraBoxes = () => [[-35, -8, 16, 8], [19, -8, 16, 8]];

const cache = new Map();

/** Sprite pronto (canvas) de um prop, desenhado uma vez e reaproveitado. */
export function propSprite(p) {
  const def = PROPS[p.type];
  if (!def) return null;
  const { w, h } = def.size(p);
  const key = `${p.type}|${w}|${h}|${p.pal || ""}|${p.style || ""}|${p.color || ""}|${p.flowers || ""}|${p.roof || ""}|${p.glow || ""}|${p.flip ? 1 : 0}|${p.broken ? 1 : 0}|${p.mossy ? 1 : 0}|${p.ruin ? 1 : 0}|${p.white ? 1 : 0}|${p.tall || ""}|${p.battlement ? 1 : 0}`;
  let sp = cache.get(key);
  if (!sp) {
    const { c, g } = makeCanvas(w, h);
    def.draw(g, p, w, h);
    sp = { canvas: c, w, h };
    cache.set(key, sp);
  }
  return sp;
}

export function propBoxes(p) {
  const def = PROPS[p.type];
  if (!def || p.solid === false) return [];
  const boxes = [];
  const b = def.box ? def.box(p) : null;
  if (b) boxes.push(b);
  if (def.extraBoxes) boxes.push(...def.extraBoxes(p));
  return boxes.map(([dx, dy, w, h]) => ({ x: p.x + dx, y: p.y + dy, w, h }));
}

export function propLight(p) {
  const def = PROPS[p.type];
  if (!def || !def.light || p.light === false) return null;
  return def.light(p);
}
