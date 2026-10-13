import { useEffect, useRef } from "react";
import { TileGame } from "../game/engine/tileGame";

/** Ponte entre React e o motor da fase (src/game/engine/tileGame.js). */
export default function GameCanvas({ phase, attempt, paused, keys, actions, onHud, onEvent, gameRef }) {
  const canvasRef = useRef(null);
  const hooks = useRef({});
  hooks.current = { onHud, onEvent };

  useEffect(() => {
    const game = new TileGame(canvasRef.current, phase, {
      onHud: (s) => hooks.current.onHud(s),
      onEvent: (e) => hooks.current.onEvent(e)
    });
    gameRef.current = game;
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      game.update(dt);
      game.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt]);

  useEffect(() => {
    if (gameRef.current) gameRef.current.paused = paused;
  }, [paused, gameRef]);

  useEffect(() => {
    if (gameRef.current) gameRef.current.input = keys;
  }, [keys, gameRef]);

  useEffect(() => {
    const g = gameRef.current;
    if (!g || !actions.n) return;
    if (actions.type === "attack") g.attack();
    if (actions.type === "shoot") g.shoot();
    if (actions.type === "interact") g.interact();
  }, [actions, gameRef]);

  return (
    <div className="game-frame">
      <canvas ref={canvasRef} width={960} height={576} className="game-canvas" />
    </div>
  );
}
