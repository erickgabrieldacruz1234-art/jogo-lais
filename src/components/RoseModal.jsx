import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { ROSES, drawRose } from "../game/engine/tileArt";

/** Tela especial de coleta da rosa da fase. */
export default function RoseModal({ phase, onClose }) {
  const ref = useRef(null);
  const opened = useRef(performance.now());
  const info = ROSES[phase.id];

  useEffect(() => {
    const c = ref.current;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    let raf;
    const petals = Array.from({ length: 26 }, () => ({ x: Math.random() * 96, y: Math.random() * 96, v: 6 + Math.random() * 10, s: Math.random() * 6 }));
    const draw = (now) => {
      const t = (now - opened.current) / 1000;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 96, 96);
      const grd = g.createRadialGradient(48, 44, 0, 48, 44, 46);
      grd.addColorStop(0, info.glow);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.15;
      g.fillStyle = grd;
      g.fillRect(0, 0, 96, 96);
      g.globalAlpha = 1;
      for (const p of petals) {
        p.y = (p.y + p.v * 0.016) % 100;
        g.fillStyle = info.petal[2];
        g.fillRect(Math.round(p.x + Math.sin(t * 2 + p.s) * 3), Math.round(p.y), 2, 1);
      }
      drawRose(g, 48, 40 + Math.sin(t * 2) * 1.5, phase.id, 2.4, t);
      for (let i = 0; i < 6; i++) {
        const a = t * 1.3 + (i / 6) * Math.PI * 2;
        g.fillStyle = info.sparkle;
        g.fillRect(Math.round(48 + Math.cos(a) * 34), Math.round(42 + Math.sin(a) * 30), 1, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 }, colors: [info.petal[1], info.petal[2], "#ffffff"], shapes: ["circle"], scalar: 0.7 });
    } catch (e) {}
    const onKey = (e) => {
      if (["Space", "Enter", "KeyE", "Escape"].includes(e.code) && performance.now() - opened.current > 900) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [info, onClose, phase.id]);

  return (
    <div className="modal-backdrop rose-backdrop" onClick={() => performance.now() - opened.current > 900 && onClose()}>
      <div className="rose-card">
        <div className="rose-kicker">Rosa {phase.index} de 5</div>
        <canvas ref={ref} width={96} height={96} className="rose-canvas" />
        <h3>{info.name}</h3>
        <p className="rose-message">{phase.roseMessage}</p>
        <div className="rose-hint">Toque ou aperte Espaço para continuar</div>
      </div>
    </div>
  );
}
