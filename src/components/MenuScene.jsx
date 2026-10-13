import { useEffect, useRef } from "react";
import { CHARACTERS, drawCharacter } from "../game/data/characters";
import { propSprite } from "../game/engine/props";
import { drawHeart, drawRose } from "../game/engine/tileArt";
import { R, E, rng } from "../game/engine/pixel";

const W = 640, H = 360, GROUND = 312;
const LAIS = { ...CHARACTERS.lais, scale: 0.75 };
const ERICK = { ...CHARACTERS.erick, scale: 0.75 };

function loadImg(src) {
  const i = new Image();
  i.src = src;
  return i;
}

/** Capa animada: crepúsculo, aurora, castelo, cerejeiras e o casal. */
export default function MenuScene() {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    const g = c.getContext("2d");
    const lais = loadImg(CHARACTERS.lais.src);
    const erick = loadImg(CHARACTERS.erick.src);
    const r = rng(42);
    const stars = Array.from({ length: 150 }, () => ({ x: r() * W, y: r() * H * 0.55, p: r() * 6, s: r() > 0.92 ? 2 : 1 }));
    const flies = Array.from({ length: 30 }, () => ({ x: r() * W, y: H * 0.6 + r() * H * 0.35, p: r() * 6, v: (r() - 0.5) * 10 }));
    const petals = Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * H, v: 8 + r() * 12, s: r() * 6, c: ["#ffb3cf", "#ffd6ea", "#ff8ab0"][Math.floor(r() * 3)] }));
    const hills = (seed, base, amp) => {
      const rr = rng(seed);
      let y = base;
      return Array.from({ length: W / 4 + 1 }, () => (y = Math.max(base - 26, Math.min(base + 16, y + (rr() - 0.5) * amp))));
    };
    const h1 = hills(7, 236, 6), h2 = hills(9, 266, 5);
    const sakura = propSprite({ type: "tree", pal: "cherry", s: 1.6 });
    const sakura2 = propSprite({ type: "tree", pal: "cherry", s: 1.1 });
    const lantern = propSprite({ type: "lantern", color: "#ffd36a" });
    const roseBush = ["#e8456a", "#ff8ab0", "#ffffff"].map((color) => propSprite({ type: "roseBush", color }));
    let shooting = null;

    let raf;
    const t0 = performance.now();
    const draw = (now) => {
      const t = (now - t0) / 1000;
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.imageSmoothingEnabled = false;
      // céu
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0a0820");
      sky.addColorStop(0.35, "#2a1a4e");
      sky.addColorStop(0.62, "#8a3a6e");
      sky.addColorStop(0.8, "#e88a7a");
      sky.addColorStop(1, "#ffc890");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      // aurora
      for (let b = 0; b < 3; b++) {
        g.globalAlpha = 0.08 + b * 0.03;
        g.fillStyle = ["#7af0c8", "#c58aff", "#ff8ad8"][b];
        for (let x = 0; x < W; x += 4) {
          const y = 40 + b * 18 + Math.sin(x * 0.012 + t * 0.4 + b) * 16 + Math.sin(x * 0.03 + t * 0.7) * 6;
          g.fillRect(x, y, 4, 22 - b * 4);
        }
      }
      g.globalAlpha = 1;
      for (const s of stars) {
        g.globalAlpha = 0.3 + ((Math.sin(t * 1.5 + s.p) + 1) / 2) * 0.7;
        R(g, s.x, s.y, s.s, s.s, "#fff6e0");
      }
      g.globalAlpha = 1;
      // estrela cadente
      if (!shooting && Math.random() < 0.006) shooting = { x: 80 + Math.random() * 400, y: 20 + Math.random() * 60, t: 0 };
      if (shooting) {
        shooting.t += 0.016;
        const k = shooting.t / 0.8;
        for (let i = 0; i < 14; i++) {
          g.globalAlpha = (1 - i / 14) * (1 - k);
          R(g, shooting.x + k * 160 - i * 3, shooting.y + k * 60 - i * 1.1, 2, 1, "#ffffff");
        }
        g.globalAlpha = 1;
        if (k >= 1) shooting = null;
      }
      // lua
      const mx = 520, my = 70;
      const halo = g.createRadialGradient(mx, my, 0, mx, my, 90);
      halo.addColorStop(0, "rgba(255,240,210,0.45)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = halo;
      g.fillRect(mx - 90, my - 90, 180, 180);
      E(g, mx, my, 24, 24, "#fff4d0");
      E(g, mx - 7, my - 5, 6, 5, "#f0dcae");
      E(g, mx + 8, my + 7, 4, 3, "#f0dcae");
      E(g, mx + 4, my - 10, 3, 2, "#f0dcae");
      // castelo na colina
      g.fillStyle = "#3a1e4a";
      h1.forEach((y, i) => g.fillRect(i * 4, y, 4, H - y));
      const cx = 470, cy = 214;
      g.fillStyle = "#33193f";
      for (let i = -90; i <= 90; i++) {
        const top = cy - 2 + Math.pow(Math.abs(i) / 90, 1.8) * 46;
        g.fillRect(cx + i, top, 2, H - top);
      }
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(cx - 42, cy, 84, 3);
      for (let i = 0; i < 7; i++) g.fillRect(cx - 4 + Math.sin(i) * 3, cy + 5 + i * 6, 8, 2);
      g.fillStyle = "#2a1436";
      g.fillRect(cx - 40, cy - 34, 80, 36);
      for (const [ox, h, w] of [[-46, 60, 14], [-10, 88, 18], [30, 56, 14]]) {
        g.fillRect(cx + ox, cy - h, w, h);
        for (let i = 0; i < 14; i++) g.fillRect(cx + ox - 3 + i * ((w + 6) / 28), cy - h - i, Math.max(1, (w + 6) * (1 - i / 14)), 1);
      }
      R(g, cx - 1 + 0, cy - 112, 1, 16, "#2a1436");
      R(g, cx + 1, cy - 112 + Math.round(Math.sin(t * 3)), 9, 5, "#ff5a76");
      for (const [ox, oy] of [[-42, -46], [-4, -70], [-4, -50], [34, -40], [-24, -20], [14, -20]]) {
        const on = Math.sin(t * 1.1 + ox * 0.3) > -0.85;
        R(g, cx + ox, cy + oy, 4, 5, on ? "#ffcf6a" : "#5a3a4a");
        if (on) {
          g.globalAlpha = 0.25;
          E(g, cx + ox + 2, cy + oy + 2, 6, 6, "#ffcf6a");
          g.globalAlpha = 1;
        }
      }
      g.fillStyle = "#24122e";
      h2.forEach((y, i) => g.fillRect(i * 4, y, 4, H - y));
      // campo
      R(g, 0, GROUND - 6, W, H, "#1e2e26");
      R(g, 0, GROUND - 6, W, 2, "#2e4a38");
      for (let x = 0; x < W; x += 7) R(g, x + ((x * 7) % 5), GROUND - 4 + ((x * 3) % 9), 1, 3, "#3a5a44");
      g.drawImage(sakura.canvas, 30, GROUND - sakura.h + 4);
      g.drawImage(sakura2.canvas, 560, GROUND - sakura2.h + 4);
      g.drawImage(lantern.canvas, 220, GROUND - lantern.h + 2);
      g.drawImage(lantern.canvas, 404, GROUND - lantern.h + 2);
      roseBush.forEach((b, i) => {
        g.drawImage(b.canvas, 150 + i * 36, GROUND - b.h + 10);
        g.drawImage(b.canvas, 440 + i * 36, GROUND - b.h + 12);
      });
      // brilho das lanternas
      g.globalCompositeOperation = "lighter";
      for (const lx of [227, 411]) {
        const grd = g.createRadialGradient(lx, GROUND - 28, 0, lx, GROUND - 28, 46);
        grd.addColorStop(0, "rgba(255,200,110,0.35)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.fillRect(lx - 46, GROUND - 74, 92, 92);
      }
      g.globalCompositeOperation = "source-over";
      // o casal
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(292, GROUND - 1, 26, 3);
      g.fillRect(326, GROUND - 1, 26, 3);
      drawCharacter(g, lais.complete ? lais : null, LAIS, "idle_right", t, 304, GROUND + 2);
      drawCharacter(g, erick.complete ? erick : null, ERICK, "idle_left", t, 340, GROUND + 2);
      // coração pulsante e rosa flutuando entre os dois
      const beat = 1 + Math.max(0, Math.sin(t * 4)) * 0.2;
      g.save();
      g.translate(322, GROUND - 74 + Math.sin(t * 2) * 3);
      g.scale(1.8 * beat, 1.8 * beat);
      drawHeart(g, 0, 0, "#ff5a76");
      g.restore();
      drawRose(g, 322, GROUND - 52 + Math.sin(t * 2 + 1) * 2, "ibiza", 0.55, t, false);
      // pétalas e vaga-lumes
      for (const p of petals) {
        p.y += p.v * 0.016;
        p.x += Math.sin(t + p.s) * 0.3 + 0.2;
        if (p.y > H) (p.y = -4), (p.x = Math.random() * W);
        if (p.x > W) p.x = 0;
        R(g, p.x, p.y, 2, Math.floor(t * 4 + p.s) % 2 ? 1 : 2, p.c);
      }
      for (const f of flies) {
        f.x += f.v * 0.016;
        if (f.x < 0) f.x = W;
        if (f.x > W) f.x = 0;
        const a = (Math.sin(t * 2 + f.p) + 1) / 2;
        const fy = f.y + Math.sin(t + f.p) * 6;
        g.globalAlpha = a * 0.45;
        g.fillStyle = "#e8ff9a";
        g.fillRect(f.x - 2, fy - 2, 5, 5);
        g.globalAlpha = a;
        R(g, f.x, fy, 1, 1, "#ffffff");
      }
      g.globalAlpha = 1;
      // vinheta
      g.setTransform(1, 0, 0, 1, 0, 0);
      const v = g.createRadialGradient(640, 360, 280, 640, 360, 800);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(8,4,16,0.6)");
      g.fillStyle = v;
      g.fillRect(0, 0, 1280, 720);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} width={W * 2} height={H * 2} className="menu-scene" />;
}
