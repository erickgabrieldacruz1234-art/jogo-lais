import { useEffect, useRef, useState } from "react";
import DialogueOverlay from "./DialogueOverlay";
import { audio } from "../game/audioManager";
import { STORY, OPENING } from "../game/data/story";
import { CHARACTERS, drawCharacter } from "../game/data/characters";
import { drawRose, drawHeart } from "../game/engine/tileArt";
import { propSprite } from "../game/engine/props";
import { R, E, L, rng } from "../game/engine/pixel";

// Abertura animada em capítulos, como um livro ilustrado.
const W = 480, H = 270, GROUND = 222;
const LAIS = { ...CHARACTERS.lais, scale: 0.8 };
const ERICK = { ...CHARACTERS.erick, scale: 0.8 };
const ROSE_KINDS = ["ibiza", "praia", "jardim", "bruxas", "lago"];

function loadImg(src) {
  const i = new Image();
  i.src = src;
  return i;
}
const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3));

function sky(g, top, mid, bottom) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, top);
  grd.addColorStop(0.6, mid);
  grd.addColorStop(1, bottom);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
}

function stars(g, t, st, alpha = 1) {
  for (const s of st) {
    g.globalAlpha = alpha * (0.35 + ((Math.sin(t * 1.6 + s.p) + 1) / 2) * 0.65);
    R(g, s.x, s.y, s.s, s.s, "#fff6e0");
  }
  g.globalAlpha = 1;
}

function moon(g, x, y, r = 16) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r * 4);
  grd.addColorStop(0, "rgba(255,240,200,0.35)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  E(g, x, y, r, r, "#fff2c8");
  E(g, x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.2, "#f0dca8");
  E(g, x + r * 0.35, y + r * 0.3, r * 0.18, r * 0.15, "#f0dca8");
}

function hills(g, pts, color) {
  g.fillStyle = color;
  pts.forEach((y, i) => g.fillRect(i * 4, y, 4, H - y));
}

function castle(g, x, y, s, color, windows, t, hill) {
  if (hill) {
    // colina rochosa onde o castelo se apoia
    g.fillStyle = hill;
    for (let i = -60; i <= 60; i++) {
      const top = y - 2 + Math.pow(Math.abs(i) / 60, 1.8) * 34 * s;
      g.fillRect(x + i * 1.4 * s, top, 1.4 * s + 1, H - top);
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x - 32 * s, y, 64 * s, 3 * s);
    for (let i = 0; i < 6; i++) g.fillRect(x - 3 * s + Math.sin(i) * 2 * s, y + 4 * s + i * 5 * s, 6 * s, 2 * s);
  }
  g.fillStyle = color;
  g.fillRect(x - 30 * s, y - 30 * s, 60 * s, 30 * s);
  for (const [ox, h] of [[-30, 52], [-6, 70], [20, 46]]) {
    g.fillRect(x + ox * s, y - h * s, 12 * s, h * s);
    for (let i = 0; i < 12; i++) g.fillRect(x + ox * s - 2 * s + i * (8 / 12) * s, y - h * s - i * s, Math.max(1, 16 * (1 - i / 12)) * s, 1.2 * s);
  }
  if (windows) {
    for (const [ox, oy] of [[-26, -40], [-2, -58], [-2, -40], [24, -30], [-14, -18], [8, -18]]) {
      const on = Math.sin(t * 1.3 + ox) > -0.7;
      R(g, x + ox * s, y + oy * s, 3 * s, 4 * s, on ? "#ffcf6a" : "#6a4a3a");
    }
  }
}

function sprite(g, p, x, y) {
  const sp = propSprite(p);
  g.drawImage(sp.canvas, Math.round(x - sp.w / 2), Math.round(y - sp.h));
}

/** A Rainha do Esquecimento: manto de sombras, coroa e olhos violeta. */
function queen(g, x, y, t, a = 1) {
  g.globalAlpha = a;
  const grd = g.createRadialGradient(x, y - 20, 0, x, y - 20, 70);
  grd.addColorStop(0, "rgba(140,60,220,0.45)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(x - 70, y - 90, 140, 140);
  for (let i = 0; i < 40; i++) {
    const k = i / 40;
    const half = 6 + k * 26 + Math.sin(t * 3 + i * 0.4) * 2;
    R(g, x - half, y - 40 + i, half * 2, 1, i % 3 ? "#1a0a2a" : "#2a1240");
  }
  for (let i = 0; i < 8; i++) {
    const wx = x - 30 + i * 8.5;
    R(g, wx, y + Math.round(Math.sin(t * 5 + i) * 2), 6, 6 + (i % 3) * 3, "#1a0a2a");
  }
  E(g, x, y - 46, 10, 11, "#120620");
  R(g, x - 5, y - 48, 3, 2, "#d08aff");
  R(g, x + 2, y - 48, 3, 2, "#d08aff");
  for (const ox of [-8, -3, 2, 7]) R(g, x + ox, y - 62 + (ox === -3 || ox === 2 ? -3 : 0), 2, 6, "#8a5ab8");
  R(g, x - 9, y - 57, 19, 2, "#b08ae0");
  // braços de sombra
  for (const side of [-1, 1]) {
    for (let k = 0; k < 20; k++) {
      const a2 = k / 20;
      R(g, x + side * (14 + a2 * 26), y - 30 + Math.sin(t * 4 + a2 * 6) * 6 * a2, 3, 3, "#2a1240");
    }
  }
  g.globalAlpha = 1;
}

export default function OpeningScene({ onDone }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    return q.has("dev") ? Math.max(0, Math.min(STORY.length - 1, (Number(q.get("cap")) || 1) - 1)) : 0;
  });
  const [shown, setShown] = useState("");
  const [talk, setTalk] = useState(false);
  const idxRef = useRef(0);
  const sceneT = useRef(0);
  idxRef.current = idx;
  const chapter = STORY[idx];

  // máquina de escrever da legenda
  useEffect(() => {
    if (!chapter) return;
    setShown("");
    const q = new URLSearchParams(window.location.search);
    sceneT.current = q.has("dev") ? Number(q.get("tempo")) || 0 : 0;
    let i = 0;
    const iv = setInterval(() => {
      i += 2;
      setShown(chapter.text.slice(0, i));
      if (i >= chapter.text.length) clearInterval(iv);
    }, 28);
    return () => clearInterval(iv);
  }, [chapter]);

  const next = () => {
    if (talk) return;
    if (chapter && shown.length < chapter.text.length) return setShown(chapter.text);
    audio.playSfx("button_click");
    if (idx + 1 < STORY.length) setIdx(idx + 1);
    else setTalk(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (["Space", "Enter", "KeyE"].includes(e.code)) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    audio.playMusic();
    const c = ref.current;
    const g = c.getContext("2d");
    const lais = loadImg(CHARACTERS.lais.src);
    const erick = loadImg(CHARACTERS.erick.src);
    const r = rng(11);
    const st = Array.from({ length: 110 }, () => ({ x: r() * W, y: r() * H * 0.6, p: r() * 6, s: r() > 0.9 ? 2 : 1 }));
    const mk = (seed, base, amp) => {
      const rr = rng(seed);
      let y = base;
      return Array.from({ length: W / 4 + 1 }, () => (y = Math.max(base - 20, Math.min(base + 14, y + (rr() - 0.5) * amp))));
    };
    const h1 = mk(3, 170, 7), h2 = mk(5, 195, 6);
    const petals = Array.from({ length: 50 }, () => ({ x: r() * W, y: r() * H, v: 6 + r() * 10, s: r() * 6 }));
    const fx = { hearts: [], sparks: [] };
    let raf, last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sceneT.current += dt;
      const t = now / 1000, k = sceneT.current;
      const scene = STORY[idxRef.current]?.scene || "quest";
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.imageSmoothingEnabled = false;
      const L1 = lais.complete ? lais : null, E1 = erick.complete ? erick : null;

      if (scene === "meet") {
        sky(g, "#0b0a24", "#2a1a4a", "#5a2a5a");
        stars(g, t, st);
        moon(g, 400, 46, 14);
        hills(g, h1, "#24163a");
        for (const [x, roof, glow] of [[60, "#e0457b", "#ff7ad9"], [150, "#3ab0c8", "#7af0ff"], [340, "#f0a030", "#ffe45a"], [430, "#8a5ae0", "#c58aff"]]) sprite(g, { type: "house", style: "party", roof, glow, w: 64 }, x, GROUND - 6);
        R(g, 0, GROUND - 4, W, H, "#3a2e3a");
        for (let x = 0; x < W; x += 10) R(g, x + ((x * 7) % 6), GROUND + 2 + ((x * 3) % 10), 6, 3, "#4a3a48");
        for (const x of [20, 250, 470]) sprite(g, { type: "palm", s: 1.1 }, x, GROUND);
        for (let i = 0; i <= 30; i++) {
          const u = i / 30;
          const x = 30 + u * 420, y = 70 + Math.sin(u * Math.PI) * 22;
          R(g, x, y, 1, 1, "#1a1424");
          if (i % 2 === 0) {
            const col = ["#ff5ab4", "#5af0ff", "#ffe45a", "#9aff6a"][(i / 2) % 4];
            R(g, x - 1, y + 1, 3, 3, Math.sin(t * 3 + i) > -0.5 ? col : "#3a3040");
          }
        }
        const lx = 40 + ease(k / 3) * 165, ex = 440 - ease(k / 3) * 165;
        drawCharacter(g, L1, LAIS, k < 3 ? "walk_right" : "idle_right", t, lx, GROUND + 10);
        drawCharacter(g, E1, ERICK, k < 3 ? "walk_left" : "idle_left", t, ex, GROUND + 10);
        if (k > 3.1) {
          const hk = Math.min(1, (k - 3.1) / 0.6);
          g.save();
          g.translate(240, GROUND - 70 - hk * 8);
          g.scale(1 + hk * 1.5 + Math.sin(t * 6) * 0.15, 1 + hk * 1.5 + Math.sin(t * 6) * 0.15);
          drawHeart(g, 0, 0, "#ff5a76");
          g.restore();
          if (Math.random() < dt * 4) fx.hearts.push({ x: 240 + (Math.random() - 0.5) * 60, y: GROUND - 60, life: 2 });
        }
      } else if (scene === "love") {
        sky(g, "#ff9a7a", "#ffc08a", "#ffe0a0");
        E(g, 240, 150, 40, 40, "#fff2c0");
        for (let i = 0; i < 6; i++) R(g, 0, 150 + i * 5, W, 2, "rgba(255,200,150,0.5)");
        R(g, 0, 160, W, 50, "#3aa8c0");
        for (let i = 0; i < 40; i++) R(g, (i * 53 + t * 20) % W, 165 + (i * 17) % 40, 6, 1, "#bff0ff");
        R(g, 0, 205, W, H, "#f0d48a");
        for (let x = 0; x < W; x += 6) R(g, x, 205 + ((x * 7) % 30), 2, 1, "#d8b86e");
        sprite(g, { type: "palm", s: 1.3, flip: true }, 40, 240);
        sprite(g, { type: "palm", s: 1.1 }, 440, 236);
        sprite(g, { type: "umbrella", color: "#e84a5a" }, 380, 232);
        const x = 120 + ((k * 22) % 300);
        drawCharacter(g, L1, LAIS, "walk_right", t, x, 244);
        drawCharacter(g, E1, ERICK, "walk_right", t + 0.3, x + 34, 244);
        if (Math.random() < dt * 3) fx.hearts.push({ x: x + 16, y: 190, life: 2 });
        for (const p of petals) {
          p.y = (p.y + p.v * dt) % H;
          g.globalAlpha = 0.5;
          R(g, (p.x + Math.sin(t + p.s) * 8) % W, p.y, 2, 1, "#ffffff");
        }
        g.globalAlpha = 1;
      } else if (scene === "surprise" || scene === "kidnap") {
        const dark = scene === "kidnap" ? Math.min(1, k / 2.5) : 0;
        sky(g, "#0a1030", "#1a2a5a", "#2a3a6a");
        stars(g, t, st, 1 - dark * 0.7);
        moon(g, 90, 50, 18);
        castle(g, 400, 150, 1.1, "#141a34", true, t, "#14241e");
        hills(g, h2, "#162a24");
        R(g, 0, GROUND - 4, W, H, "#2a5a3a");
        for (let x = 0; x < W; x += 7) R(g, x, GROUND + ((x * 5) % 12), 1, 3, "#3a7a4a");
        for (const [x, c] of [[40, "#e8456a"], [100, "#ff8ab0"], [380, "#ffffff"], [450, "#e8456a"]]) sprite(g, { type: "roseBush", color: c }, x, GROUND + 4);
        let ey = GROUND + 10, ex = 250, eAlpha = 1;
        const lift = scene === "kidnap" ? Math.max(0, (k - 3.6) / 3) : 0;
        if (scene === "kidnap") {
          ey = GROUND + 10 - ease(Math.min(1, lift * 2)) * 60 - Math.max(0, lift - 0.5) * 40;
          ex = 250 + ease(lift) * 150;
          eAlpha = 1 - Math.max(0, lift - 0.7) * 3.3;
        }
        // Erick com as cinco rosas
        g.globalAlpha = Math.max(0, eAlpha);
        drawCharacter(g, E1, ERICK, "idle_down", t, ex, ey);
        g.globalAlpha = 1;
        const rosesOut = scene === "kidnap" && k > 3.4;
        if (!rosesOut) ROSE_KINDS.forEach((kind, i) => drawRose(g, ex - 10 + i * 5, ey - 30 + (i % 2) * 3 - (i === 2 ? 4 : 0), kind, 0.4, t, false));
        else {
          // rosas espalhadas em 5 direções
          const kk = Math.min(1, (k - 3.4) / 2.4);
          ROSE_KINDS.forEach((kind, i) => {
            const a = -Math.PI / 2 + (i - 2) * 0.7;
            const rx = 245 + Math.cos(a) * kk * 300, ry = GROUND - 50 + Math.sin(a) * kk * 200;
            const grd = g.createRadialGradient(rx, ry, 0, rx, ry, 14);
            grd.addColorStop(0, "rgba(255,220,240,0.8)");
            grd.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = grd;
            g.fillRect(rx - 14, ry - 14, 28, 28);
            drawRose(g, rx, ry, kind, 0.6, t, false);
          });
        }
        if (scene === "surprise" && Math.random() < dt * 2) fx.sparks.push({ x: 245 + (Math.random() - 0.5) * 30, y: GROUND - 60, life: 1.2 });
        if (scene === "kidnap") {
          g.globalAlpha = dark * 0.55;
          g.fillStyle = "#1a0830";
          g.fillRect(0, 0, W, H);
          g.globalAlpha = 1;
          for (let i = 0; i < 6; i++) {
            g.globalAlpha = 0.12 * dark;
            g.fillStyle = "#8a4ad0";
            g.beginPath();
            g.ellipse((i * 97 + t * 15) % (W + 100) - 50, 200 + Math.sin(t + i) * 10, 90, 18, 0, 0, Math.PI * 2);
            g.fill();
          }
          g.globalAlpha = 1;
          const qy = -40 + ease(k / 2.6) * 170 - Math.max(0, lift - 0.5) * 40 - ease(Math.min(1, lift * 2)) * 60;
          const qx = 250 + ease(lift) * 150;
          queen(g, qx, qy, t, Math.min(1, k / 1) * (1 - Math.max(0, lift - 0.7) * 3.3));
          // fitas de sombra prendendo Erick
          if (k > 2.6 && eAlpha > 0) {
            g.strokeStyle = "rgba(160,90,240,0.8)";
            g.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              g.beginPath();
              for (let a = 0; a < 6.3; a += 0.3) {
                const px = ex + Math.cos(a + t * 4 + i) * 16, py = ey - 20 + Math.sin(a * 2 + i) * 22;
                if (a === 0) g.moveTo(px, py);
                else g.lineTo(px, py);
              }
              g.stroke();
            }
          }
          if (k > 2.6 && k < 2.78) {
            g.fillStyle = "rgba(220,180,255,0.6)";
            g.fillRect(0, 0, W, H);
          }
          // Lais chega correndo, tarde demais
          if (k > 5) {
            const lx = Math.min(170, -20 + (k - 5) * 120);
            drawCharacter(g, L1, LAIS, lx < 170 ? "walk_right" : "idle_up", t, lx, GROUND + 10);
          }
        }
      } else {
        // a promessa: amanhecer, Lais olhando para o castelo
        sky(g, "#2a2a6a", "#d07a8a", "#ffc890");
        stars(g, t, st, 0.3);
        const sun = g.createRadialGradient(250, 190, 0, 250, 190, 80);
        sun.addColorStop(0, "rgba(255,240,200,0.9)");
        sun.addColorStop(0.25, "rgba(255,210,150,0.5)");
        sun.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = sun;
        g.fillRect(170, 110, 160, 160);
        E(g, 250, 190, 20, 20, "#fff0c8");
        castle(g, 390, 158, 1.3, "#3a2a4a", true, t, "#4a3050");
        hills(g, h1.map((y) => y + 15), "#5a3a5a");
        hills(g, h2.map((y) => y + 8), "#3a2a3a");
        R(g, 0, GROUND - 2, W, H, "#2a4a2a");
        for (let x = 0; x < W; x += 5) R(g, x, GROUND + ((x * 3) % 9), 1, 3, "#4a7a3a");
        sprite(g, { type: "tree", pal: "cherry", s: 1.4 }, 70, GROUND + 4);
        for (const p of petals) {
          p.x = (p.x + 20 * dt) % W;
          p.y = (p.y + p.v * dt * 0.6) % H;
          R(g, p.x, p.y, 2, 1, "#ffb3cf");
        }
        const lx = Math.min(210, 120 + k * 30);
        // vento nos cachos: o arco nas costas
        L(g, lx - 10, GROUND - 40, lx - 2, GROUND - 8, 2, "#6b3a1a");
        drawCharacter(g, L1, LAIS, lx < 210 ? "walk_right" : "idle_right", t, lx, GROUND + 10);
        if (k > 3) {
          const a = Math.min(1, (k - 3) / 1);
          g.globalAlpha = a;
          for (let i = 0; i < 5; i++) {
            const ax = 260 + i * 14, ay = 120 + Math.sin(t * 2 + i) * 4;
            drawRose(g, ax, ay, ROSE_KINDS[i], 0.45, t, false);
          }
          g.globalAlpha = 1;
        }
      }

      // corações e brilhos
      for (const h of fx.hearts) {
        h.y -= 18 * dt;
        h.life -= dt;
        g.globalAlpha = Math.max(0, Math.min(1, h.life));
        drawHeart(g, Math.round(h.x + Math.sin(t * 3 + h.y) * 3), Math.round(h.y), "#ff5a76");
      }
      for (const s of fx.sparks) {
        s.y -= 14 * dt;
        s.life -= dt;
        g.globalAlpha = Math.max(0, s.life);
        R(g, s.x, s.y, 1, 1, "#fff2c0");
      }
      g.globalAlpha = 1;
      fx.hearts = fx.hearts.filter((h) => h.life > 0);
      fx.sparks = fx.sparks.filter((s) => s.life > 0);

      // vinheta + moldura de livro
      g.setTransform(1, 0, 0, 1, 0, 0);
      const v = g.createRadialGradient(480, 270, 240, 480, 270, 620);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(10,4,16,0.65)");
      g.fillStyle = v;
      g.fillRect(0, 0, 960, 540);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="opening-screen" onClick={next}>
      <canvas ref={ref} width={960} height={540} className="opening-canvas" />
      {!talk && chapter && (
        <div className="story-caption" key={idx}>
          <div className="story-chapter">{chapter.chapter}</div>
          <p className="story-text">{shown}</p>
          <div className="story-progress">
            {STORY.map((_, i) => (
              <span key={i} className={i <= idx ? "on" : ""} />
            ))}
            <em>{shown.length < chapter.text.length ? "…" : "toque ou Espaço ▶"}</em>
          </div>
        </div>
      )}
      {!talk && (
        <button
          className="story-skip"
          onClick={(e) => {
            e.stopPropagation();
            setTalk(true);
          }}
        >
          pular história ▸▸
        </button>
      )}
      {talk && <DialogueOverlay dialogueLines={OPENING} onFinish={onDone} />}
    </div>
  );
}
