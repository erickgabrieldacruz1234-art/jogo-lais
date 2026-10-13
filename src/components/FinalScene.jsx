import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import DialogueOverlay from "./DialogueOverlay";
import { audio } from "../game/audioManager";
import { startMusicBox, stopMusicBox } from "../game/sfx";
import { FINAL_PART_1, FINAL_PART_2, PROPOSAL, ENDING } from "../game/data/story";
import { CHARACTERS, drawCharacter } from "../game/data/characters";
import { drawRose, drawHeart } from "../game/engine/tileArt";
import { PHASES } from "../game/data/phases";
import { R, E, L, rng } from "../game/engine/pixel";

const W = 480, H = 270, FLOOR = 232;
const ERICK_CAGE_X = 330;
const BOUQUET_SLOTS = [[-5, -6], [5, -6], [0, -10], [-3, -2], [3, -2]];
const RS = 0.42;

function loadImg(src) {
  const i = new Image();
  i.src = src;
  return i;
}

const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3));

// ------------------------------------------------------------------ cenário
function drawRoom(g, t, warm) {
  // parede de pedra
  R(g, 0, 0, W, FLOOR - 52, "#5a5068");
  for (let y = 0; y < FLOOR - 52; y += 10) {
    R(g, 0, y, W, 1, "#4a4258");
    for (let x = ((y / 10) % 2) * 12; x < W; x += 24) R(g, x, y, 1, 10, "#4a4258");
  }
  // estandartes com rosas
  for (const bx of [60, 400]) {
    R(g, bx - 14, 14, 28, 70, "#6a1430");
    R(g, bx - 12, 14, 24, 66, "#9a2f5e");
    for (let i = 0; i < 12; i++) R(g, bx - 14 + i * 2.5, 84 - (i % 2) * 4, 2, 4, "#6a1430");
    drawRose(g, bx, 44, "ibiza", 1, t, false);
    R(g, bx - 16, 12, 32, 3, "#c9a040");
  }
  // janela em arco com o amanhecer
  const wx = 175, wy = 24, ww = 130, wh = 124;
  R(g, wx - 8, wy, ww + 16, wh + 8, "#2a2236");
  E(g, wx + ww / 2, wy, ww / 2 + 8, 36, "#2a2236");
  const sky = g.createLinearGradient(0, wy - 36, 0, wy + wh);
  sky.addColorStop(0, "#3a3a7a");
  sky.addColorStop(0.5, "#f08a7a");
  sky.addColorStop(1, "#ffd08a");
  g.fillStyle = sky;
  g.fillRect(wx, wy, ww, wh);
  g.save();
  g.beginPath();
  g.ellipse(wx + ww / 2, wy, ww / 2, 30, 0, Math.PI, 0);
  g.fill();
  g.restore();
  E(g, wx + ww / 2, wy + wh - 22, 20, 20, "#fff2b0");
  R(g, wx, wy + wh - 26, ww, 26, "#7a5a8a");
  for (let x = wx; x < wx + ww; x += 12) E(g, x + 6, wy + wh - 26, 9, 5, "#6a4a7a");
  R(g, wx + ww / 2 - 2, wy - 28, 4, wh + 28, "#2a2236");
  R(g, wx, wy + 58, ww, 4, "#2a2236");
  for (const [cx, dir] of [[wx - 22, 1], [wx + ww + 6, -1]]) {
    R(g, cx, wy - 18, 16, wh + 36, "#8a1f3e");
    for (let i = 0; i < 4; i++) R(g, cx + 2 + i * 4, wy - 18, 1, wh + 36, "#6a1430");
    R(g, cx + (dir > 0 ? 10 : 0), wy + 52, 6, 6, "#f5c542");
  }
  R(g, wx - 30, wy - 24, ww + 60, 6, "#4a2c1a");
  // chão
  R(g, 0, FLOOR - 52, W, H - FLOOR + 52, "#7a4c26");
  for (let y = FLOOR - 52; y < H; y += 8) {
    R(g, 0, y, W, 1, "#5c381c");
    for (let x = ((y / 8) % 3) * 22; x < W; x += 66) R(g, x, y, 1, 8, "#5c381c");
  }
  R(g, 0, FLOOR - 54, W, 3, "#2a1a10");
  // tapete
  R(g, 110, FLOOR - 26, 270, 40, "#5a1430");
  R(g, 116, FLOOR - 22, 258, 32, "#9a2f5e");
  R(g, 126, FLOOR - 16, 238, 20, "#c84a7a");
  // velas
  for (const vx of [30, 130, 350, 450]) {
    R(g, vx - 5, 104, 10, 3, "#2a2236");
    R(g, vx - 2, 92, 4, 12, "#f2e6d8");
    const f = Math.sin(t * 12 + vx) > 0 ? 1 : 0;
    E(g, vx, 89 - f, 2, 3, "#ffb03a");
    E(g, vx, 90, 1, 1.5, "#fff6c0");
  }
  // luz da janela e calor
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.1 + warm * 0.08;
  g.fillStyle = "#ffd8a0";
  g.beginPath();
  g.moveTo(wx, wy + 18);
  g.lineTo(wx + ww, wy + 18);
  g.lineTo(wx + ww + 110, FLOOR + 20);
  g.lineTo(wx - 110, FLOOR + 20);
  g.fill();
  g.globalAlpha = 1;
  for (const vx of [30, 130, 350, 450]) {
    const grd = g.createRadialGradient(vx, 90, 0, vx, 90, 30);
    grd.addColorStop(0, "rgba(255,190,90,0.45)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(vx - 30, 60, 60, 60);
  }
  g.globalCompositeOperation = "source-over";
}

function drawCage(g, t, k) {
  // k: 1 = jaula inteira, 0 = desfeita
  if (k <= 0) return;
  const x0 = ERICK_CAGE_X - 30, x1 = ERICK_CAGE_X + 30;
  g.globalAlpha = k;
  for (let i = 0; i <= 6; i++) {
    const x = x0 + i * 10;
    const top = FLOOR - 64 - (1 - k) * 40;
    L(g, x, FLOOR, x, top, 2, "#3a1a5a");
    L(g, x, FLOOR, x, top, 1, "#c08aff");
    for (let y = FLOOR - 10; y > top; y -= 12) R(g, x + (i % 2 ? 1 : -2), y, 2, 1, "#e0b0ff");
  }
  g.strokeStyle = "#c08aff";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(ERICK_CAGE_X, FLOOR - 64 - (1 - k) * 40, 30, 14, 0, Math.PI, 0);
  g.stroke();
  drawHeart(g, ERICK_CAGE_X, FLOOR - 30, "#ff5a9a");
  const grd = g.createRadialGradient(ERICK_CAGE_X, FLOOR - 30, 0, ERICK_CAGE_X, FLOOR - 30, 60);
  grd.addColorStop(0, "rgba(192,138,255,0.35)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(ERICK_CAGE_X - 60, FLOOR - 90, 120, 120);
  g.globalAlpha = 1;
}

/** Buquê montado com as rosas reais coletadas. */
function drawBouquet(g, x, y, t, kinds, wrap) {
  if (wrap > 0) {
    // hastes
    kinds.forEach((_, i) => {
      const [ox, oy] = BOUQUET_SLOTS[i];
      L(g, x + ox, y + oy + 2, x, y + 11, 1, "#2f6b24");
    });
    // papel
    g.globalAlpha = Math.min(1, wrap);
    const pts = [[x - 7, y - 1], [x + 7, y - 1], [x + 2, y + 12], [x - 2, y + 12]];
    g.fillStyle = "#3a1a24";
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo(px, py + 1) : g.moveTo(px - 1, py)));
    g.closePath();
    g.fill();
    g.fillStyle = "#f6dce0";
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.closePath();
    g.fill();
    L(g, x - 3, y, x - 1, y + 11, 1, "#e0b8c0");
    L(g, x + 3, y, x + 1, y + 11, 1, "#e0b8c0");
    // laço
    E(g, x - 3, y + 6, 3, 1.5, "#c81d3a");
    E(g, x + 3, y + 6, 3, 1.5, "#c81d3a");
    R(g, x - 1, y + 5, 2, 2, "#a8102a");
    L(g, x - 1, y + 7, x - 3, y + 11, 1, "#c81d3a");
    L(g, x + 1, y + 7, x + 3, y + 11, 1, "#c81d3a");
    g.globalAlpha = 1;
  }
  kinds.forEach((kind, i) => {
    const [ox, oy] = BOUQUET_SLOTS[i];
    drawRose(g, x + ox, y + oy, kind, RS, t, false);
  });
}

export default function FinalScene({ roses, onMenu }) {
  const ref = useRef(null);
  const devStage = (() => {
    const q = new URLSearchParams(window.location.search);
    return q.has("dev") ? q.get("etapa") : null;
  })();
  const [stage, setStage] = useState(devStage || "enter");
  const stageRef = useRef(stage);
  const stageT = useRef(0);
  stageRef.current = stage;
  const kinds = PHASES.map((p) => p.id).filter((id) => roses.includes(id));
  const bouquetKinds = kinds.length ? kinds : PHASES.map((p) => p.id);

  const go = (s) => {
    stageT.current = 0;
    setStage(s);
  };

  useEffect(() => {
    audio.playMusic();
    const c = ref.current;
    const g = c.getContext("2d");
    const lais = loadImg(CHARACTERS.lais.src);
    const erick = loadImg(CHARACTERS.erick.src);
    const r = rng(5);
    const dust = Array.from({ length: 40 }, () => ({ x: 170 + r() * 150, y: 30 + r() * 200, p: r() * 6 }));
    const petals = Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 8 + r() * 14, s: r() * 6, c: ["#ff8aa8", "#ffd6e0", "#ff5a76", "#ffffff"][Math.floor(r() * 4)] }));
    const hearts = [];
    const fly = bouquetKinds.map((kind, i) => ({ kind, i }));
    const st = { lx: -24, ex: ERICK_CAGE_X, zoom: 1, fx: 240, fy: 135, cage: 1, warm: 0 };
    if (devStage) Object.assign(st, { lx: devStage === "end" || devStage === "hug" ? 214 : 205, ex: ["question", "hug", "end", "dlg2"].includes(devStage) ? 236 : ERICK_CAGE_X, cage: 0, warm: 1, zoom: 2, fx: 268, fy: 196 });
    let raf, last = performance.now();
    const t0 = last;

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      stageT.current += dt;
      const s = stageRef.current, k = stageT.current;
      let lAnim = "idle_right", eAnim = "idle_left";
      let targetZoom = 2, targetFx = 268, targetFy = 196;
      let bouquetAt = null, bouquetWrap = 0, showFly = false;

      if (s === "enter") {
        targetZoom = 1;
        targetFx = 240;
        targetFy = 135;
        if (st.lx < 205) {
          st.lx += 62 * dt;
          lAnim = "walk_right";
        } else go("free");
      } else if (s === "free") {
        st.cage = Math.max(0, 1 - k / 1.4);
        st.warm = Math.min(1, k / 1.6);
        if (k > 0.05 && !st.freed) {
          st.freed = true;
          audio.playSfx("door");
          audio.playSfx("rose");
          audio.setMusicVolume(0.12);
          startMusicBox(1);
          for (let i = 0; i < 40; i++) hearts.push({ x: ERICK_CAGE_X + (Math.random() - 0.5) * 60, y: FLOOR - Math.random() * 70, vy: -10 - Math.random() * 20, life: 1.5, spark: true });
        }
        if (k > 2.2) go("dlg1");
      } else if (s === "bouquet") {
        showFly = true;
        bouquetWrap = Math.max(0, (k - 2.6) / 0.8);
        if (k > 4.2) go("approach");
      } else if (s === "approach") {
        if (st.ex > 236) {
          st.ex -= 55 * dt;
          eAnim = "walk_left";
        } else go("dlg2");
        bouquetAt = [st.ex - 9, FLOOR - 19];
        bouquetWrap = 1;
      } else if (s === "dlg2" || s === "question") {
        bouquetAt = [st.ex - 9, FLOOR - 19];
        bouquetWrap = 1;
        if (s === "question") {
          targetZoom = 2.2;
          if (Math.floor(k / 1.2) !== Math.floor((k - dt) / 1.2)) audio.playSfx("heartbeat");
        }
      } else if (s === "hug" || s === "end") {
        if (st.lx < 212) {
          st.lx += 30 * dt;
          lAnim = "walk_right";
        }
        if (st.ex > 232) st.ex -= 20 * dt;
        bouquetAt = [st.lx + 9, FLOOR - 17];
        bouquetWrap = 1;
        targetFx = 222;
        if (Math.random() < dt * 5) hearts.push({ x: 222 + (Math.random() - 0.5) * 40, y: FLOOR - 40, vy: -16 - Math.random() * 10, life: 2.6 });
        if (s === "hug" && k > 2.6) go("end");
      } else if (s === "dlg1") {
        // Erick livre, olhando para ela
      }
      if (s !== "enter" && s !== "free") st.cage = 0;

      st.zoom += (targetZoom - st.zoom) * Math.min(1, dt * 1.6);
      st.fx += (targetFx - st.fx) * Math.min(1, dt * 1.6);
      st.fy += (targetFy - st.fy) * Math.min(1, dt * 1.6);
      const sc = 2 * st.zoom;
      const tx = 480 - st.fx * sc, ty = 270 - st.fy * sc;

      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#120c18";
      g.fillRect(0, 0, 960, 540);
      g.setTransform(sc, 0, 0, sc, tx, ty);
      g.imageSmoothingEnabled = false;
      drawRoom(g, t, st.warm);
      for (const d of dust) {
        g.globalAlpha = (Math.sin(t + d.p) + 1) * 0.22;
        R(g, d.x + Math.sin(t * 0.3 + d.p) * 8, d.y + Math.cos(t * 0.2 + d.p) * 6, 1, 1, "#fff2c8");
      }
      g.globalAlpha = 1;
      drawCage(g, t, st.cage);
      // personagens (o que está à direita primeiro; no abraço, Lais na frente)
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(Math.round(st.ex - 12), FLOOR - 1, 24, 2);
      g.fillRect(Math.round(st.lx - 12), FLOOR - 1, 24, 2);
      const hugging = s === "hug" || s === "end";
      const lean = hugging ? Math.min(1, k / 0.8) : 0;
      drawCharacter(g, erick.complete ? erick : null, CHARACTERS.erick, eAnim, t, st.ex - lean * 2, FLOOR);
      if (bouquetAt && !hugging) drawBouquet(g, bouquetAt[0], bouquetAt[1], t, bouquetKinds, bouquetWrap);
      drawCharacter(g, lais.complete ? lais : null, CHARACTERS.lais, lAnim, t, st.lx + lean * 2, FLOOR);
      if (bouquetAt && hugging) drawBouquet(g, bouquetAt[0], bouquetAt[1], t, bouquetKinds, 1);
      // rosas voando do inventário até as mãos de Erick
      if (showFly) {
        const hx = st.ex - 9, hy = FLOOR - 19;
        fly.forEach((f) => {
          const kk = ease((k - f.i * 0.4) / 1.6);
          if (kk <= 0) {
            const sxw = (40 + f.i * 30 - tx) / sc, syw = (40 - ty) / sc;
            drawRose(g, sxw, syw, f.kind, 0.7, t, false);
            return;
          }
          const sxw = (40 + f.i * 30 - tx) / sc, syw = (40 - ty) / sc;
          const [ox, oy] = BOUQUET_SLOTS[f.i];
          const ex = hx + ox, ey = hy + oy;
          const mx = (sxw + ex) / 2, my = Math.min(syw, ey) - 40;
          const x = (1 - kk) * (1 - kk) * sxw + 2 * (1 - kk) * kk * mx + kk * kk * ex;
          const y = (1 - kk) * (1 - kk) * syw + 2 * (1 - kk) * kk * my + kk * kk * ey;
          if (kk < 1) {
            const grd = g.createRadialGradient(x, y, 0, x, y, 12);
            grd.addColorStop(0, "rgba(255,200,220,0.7)");
            grd.addColorStop(1, "rgba(0,0,0,0)");
            g.fillStyle = grd;
            g.fillRect(x - 12, y - 12, 24, 24);
            if (Math.random() < 0.5) hearts.push({ x, y, vy: 4, life: 0.6, spark: true });
          }
          if (kk >= 1 && !f.landed) {
            f.landed = true;
            audio.playSfx("chime" + Math.min(5, f.i + 1));
          }
          drawRose(g, x, y, f.kind, 0.7 - (0.7 - RS) * kk, t, false);
        });
        if (bouquetWrap > 0) drawBouquet(g, hx, hy, t, bouquetKinds, bouquetWrap);
      }
      // corações e brilhos
      for (const h of hearts) {
        h.y += h.vy * dt;
        h.x += Math.sin(t * 3 + h.y) * 6 * dt;
        h.life -= dt;
        g.globalAlpha = Math.max(0, Math.min(1, h.life));
        if (h.spark) R(g, h.x, h.y, 1, 1, "#fff2c8");
        else drawHeart(g, Math.round(h.x), Math.round(h.y), "#ff5a76");
      }
      g.globalAlpha = 1;
      for (let i = hearts.length - 1; i >= 0; i--) if (hearts[i].life <= 0) hearts.splice(i, 1);
      // luzinhas ao redor dos dois
      if (s === "question" || hugging) {
        for (let i = 0; i < 10; i++) {
          const a = t * 0.8 + (i / 10) * Math.PI * 2;
          const x = (hugging ? 222 : (st.lx + st.ex) / 2) + Math.cos(a) * 46, y = FLOOR - 26 + Math.sin(a) * 22;
          const grd = g.createRadialGradient(x, y, 0, x, y, 3);
          grd.addColorStop(0, "rgba(255,240,200,0.95)");
          grd.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = grd;
          g.fillRect(x - 3, y - 3, 6, 6);
        }
      }
      // pétalas caindo (tela inteira)
      if (s === "question" || hugging || s === "bouquet") {
        g.setTransform(2, 0, 0, 2, 0, 0);
        for (const p of petals) {
          p.y += p.v * dt;
          p.x += Math.sin(t * 1.5 + p.s) * 10 * dt;
          if (p.y > H) {
            p.y = -4;
            p.x = Math.random() * W;
          }
          R(g, p.x, p.y, 2, Math.floor(t * 4 + p.s) % 2 ? 1 : 2, p.c);
        }
      }
      // calor da cena
      g.setTransform(1, 0, 0, 1, 0, 0);
      const warm = g.createRadialGradient(480, 300, 60, 480, 300, 620);
      warm.addColorStop(0, `rgba(255,190,120,${0.08 + st.warm * 0.12})`);
      warm.addColorStop(1, `rgba(40,10,30,${0.35 - st.warm * 0.1})`);
      g.fillStyle = warm;
      g.fillRect(0, 0, 960, 540);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stopMusicBox();
      audio.setMusicVolume(0.7);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = () => {
    audio.playSfx("rose");
    startMusicBox(1.7);
    go("hug");
    const fire = (opts) => {
      try {
        confetti(opts);
      } catch (e) {}
    };
    let heart;
    try {
      heart = confetti.shapeFromText ? confetti.shapeFromText({ text: "❤️", scalar: 2 }) : null;
    } catch (e) {
      heart = null;
    }
    fire({ particleCount: 90, spread: 100, origin: { y: 0.55 }, colors: ["#ff5a76", "#ff8aa8", "#ffd6e0", "#f5c542"] });
    if (heart) setTimeout(() => fire({ particleCount: 30, spread: 120, origin: { y: 0.5 }, shapes: [heart], scalar: 2 }), 400);
    setTimeout(() => fire({ particleCount: 60, spread: 140, startVelocity: 25, origin: { y: 0.3 }, colors: ["#ffffff", "#ff8aa8"] }), 1200);
  };

  return (
    <div className="final-screen">
      <canvas ref={ref} width={960} height={540} className="final-canvas" />

      {stage === "dlg1" && <DialogueOverlay dialogueLines={FINAL_PART_1} onFinish={() => go("bouquet")} />}
      {stage === "dlg2" && <DialogueOverlay dialogueLines={FINAL_PART_2} onFinish={() => go("question")} />}

      {stage === "question" && (
        <div className="proposal">
          <h2 className="proposal-question">{PROPOSAL.question}</h2>
          <div className="proposal-buttons">
            {PROPOSAL.answers.map((a) => (
              <button key={a} className="proposal-btn" onClick={accept}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "end" && (
        <div className="ending">
          <h2 className="ending-title">{ENDING.title}</h2>
          <p className="ending-signature">{ENDING.signature}</p>
          <p className="ending-highlight">{ENDING.highlight}</p>
          <button className="ending-menu" onClick={onMenu}>
            voltar ao menu
          </button>
        </div>
      )}
    </div>
  );
}
