import { useCallback, useEffect, useRef, useState } from "react";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import DialogueOverlay from "./components/DialogueOverlay";
import MainMenu from "./components/MainMenu";
import PauseModal from "./components/PauseModal";
import RoseModal from "./components/RoseModal";
import LevelCard from "./components/LevelCard";
import FinalScene from "./components/FinalScene";
import VirtualControls from "./components/VirtualControls";
import { PHASES } from "./game/data/phases";
import OpeningScene from "./components/OpeningScene";
import { audio } from "./game/audioManager";
import { saveManager, newProgress } from "./game/saveManager";

const NO_KEYS = { up: false, down: false, left: false, right: false };
const KEYMAP = { KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };

/** ?dev&fase=3 começa direto numa fase (com as rosas anteriores); ?dev&final abre o final. */
function devStart() {
  const q = new URLSearchParams(window.location.search);
  if (!q.has("dev")) return null;
  if (q.has("abertura")) return { screen: "OPENING", progress: newProgress() };
  if (q.has("final")) return { screen: "FINAL", progress: { ...newProgress(), phase: 5, roses: PHASES.map((p) => p.id) } };
  const n = Math.max(1, Math.min(5, Number(q.get("fase")) || 1));
  return { screen: "PLAYING", progress: { ...newProgress(), phase: n - 1, roses: PHASES.slice(0, n - 1).map((p) => p.id) } };
}

export default function App() {
  const [screen, setScreen] = useState("MENU"); // MENU | OPENING | PLAYING | FINAL
  const [progress, setProgress] = useState(newProgress());
  const [attempt, setAttempt] = useState(0);
  const [hud, setHud] = useState(null);
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [card, setCard] = useState(null);
  const [keys, setKeys] = useState(NO_KEYS);
  const [actions, setActions] = useState({ n: 0 });
  const [keyFlash, setKeyFlash] = useState(0);
  const [muted, setMuted] = useState(false);
  const gameRef = useRef(null);

  const phase = PHASES[Math.min(progress.phase, PHASES.length - 1)];
  const current = queue[0] || null;
  const blocking = Boolean(current) || isPaused || Boolean(card);

  const startPhase = useCallback((p, withCard = true) => {
    setProgress(p);
    saveManager.save(p);
    setQueue([]);
    setHud(null);
    setIsPaused(false);
    setKeys(NO_KEYS);
    setAttempt((a) => a + 1);
    setScreen("PLAYING");
    const ph = PHASES[p.phase];
    const skip = new URLSearchParams(window.location.search).has("nocard");
    if (skip) return setCard(null);
    if (withCard) setCard({ index: ph.index, title: ph.title, subtitle: ph.subtitle, intro: ph.intro });
    else setCard(null);
  }, []);

  useEffect(() => {
    const d = devStart();
    if (!d) return;
    if (d.screen === "OPENING") setScreen("OPENING");
    else if (d.screen === "FINAL") {
      setProgress(d.progress);
      setScreen("FINAL");
    } else startPhase(d.progress, false);
  }, [startPhase]);

  // ---------------------------------------------------------------- eventos do motor
  const toast = useCallback((text, kind) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const completePhase = useCallback(() => {
    setProgress((p) => {
      const ph = PHASES[p.phase];
      const roses = p.roses.includes(ph.id) ? p.roses : [...p.roses, ph.id];
      const diamonds = { ...p.diamonds, [ph.id]: Math.max(p.diamonds[ph.id] || 0, gameRef.current?.inv.diamonds || 0) };
      const next = { ...p, roses, diamonds, phase: p.phase + 1 };
      saveManager.save(next);
      setTimeout(() => (next.phase >= PHASES.length ? setScreen("FINAL") : startPhase(next)), 60);
      return next;
    });
  }, [startPhase]);

  const onEvent = useCallback(
    (ev) => {
      if (ev.type === "toast") return toast(ev.text);
      if (ev.type === "key") {
        setKeyFlash((n) => n + 1);
        return toast("Você encontrou a chave da porta!", "key");
      }
      if (ev.type === "dialogue" || ev.type === "rose") return setQueue((q) => [...q, ev]);
      if (ev.type === "phaseComplete") completePhase();
    },
    [completePhase, toast]
  );

  // pausa o motor enquanto há diálogo, rosa, cartão ou pausa
  useEffect(() => {
    if (gameRef.current) gameRef.current.paused = blocking;
    if (blocking) setKeys(NO_KEYS);
  }, [blocking]);

  // ---------------------------------------------------------------- teclado
  useEffect(() => {
    if (screen !== "PLAYING") return;
    const down = (e) => {
      if (KEYMAP[e.code]) {
        e.preventDefault();
        if (!blocking) setKeys((k) => (k[KEYMAP[e.code]] ? k : { ...k, [KEYMAP[e.code]]: true }));
        return;
      }
      if (e.code === "Escape" || e.code === "KeyP") {
        if (!current && !card) setIsPaused((v) => !v);
        return;
      }
      if (blocking || e.repeat) return;
      if (e.code === "KeyJ" || e.code === "KeyZ") setActions((a) => ({ n: a.n + 1, type: "attack" }));
      if (e.code === "KeyK" || e.code === "KeyX") setActions((a) => ({ n: a.n + 1, type: "shoot" }));
      if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setActions((a) => ({ n: a.n + 1, type: "interact" }));
      }
      if (e.code === "KeyR") gameRef.current?.restoreRoom("Sala reiniciada.");
    };
    const up = (e) => {
      if (KEYMAP[e.code]) setKeys((k) => ({ ...k, [KEYMAP[e.code]]: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, blocking, current, card]);

  // ---------------------------------------------------------------- menu
  const newGame = () => {
    saveManager.clear();
    setProgress(newProgress());
    setScreen("OPENING");
  };
  const continueGame = () => {
    const p = saveManager.load();
    if (!p) return newGame();
    if (p.phase >= PHASES.length) {
      setProgress(p);
      setScreen("FINAL");
    } else startPhase(p);
  };
  const selectPhase = (i) => {
    const saved = saveManager.load() || newProgress();
    startPhase({ ...saved, phase: i });
  };

  return (
    <div className="game-viewport-wrapper">
      {screen === "MENU" && <MainMenu onStartGame={newGame} onContinueGame={continueGame} onSelectPhase={selectPhase} />}

      {screen === "OPENING" && (
        <OpeningScene onDone={() => startPhase(newProgress())} />
      )}

      {screen === "FINAL" && <FinalScene roses={progress.roses} onMenu={() => setScreen("MENU")} />}

      {screen === "PLAYING" && (
        <div className="play-area">
          {hud ? (
            <HUD
              phase={phase}
              hud={hud}
              roses={progress.roses}
              keyFlash={keyFlash}
              muted={muted}
              onToggleMusic={() => setMuted(!audio.toggleMusic())}
              onPause={() => setIsPaused(true)}
            />
          ) : (
            <div className="hud-container" />
          )}

          <GameCanvas phase={phase} attempt={attempt} paused={blocking} keys={keys} actions={actions} onHud={setHud} onEvent={onEvent} gameRef={gameRef} />

          <div className="toast-stack">
            {toasts.map((t) => (
              <div key={t.id} className={"toast" + (t.kind ? " " + t.kind : "")}>
                {t.text}
              </div>
            ))}
          </div>

          <VirtualControls setKeys={setKeys} onAction={(type) => !blocking && setActions((a) => ({ n: a.n + 1, type }))} />

          {current?.type === "dialogue" && (
            <DialogueOverlay key={queue.length + (current.lines[0]?.text || "")} dialogueLines={current.lines} onFinish={() => setQueue((q) => q.slice(1))} />
          )}
          {current?.type === "rose" && <RoseModal phase={phase} onClose={() => setQueue((q) => q.slice(1))} />}

          {isPaused && (
            <PauseModal
              phase={phase}
              hud={hud}
              onResume={() => setIsPaused(false)}
              onRestartRoom={() => {
                setIsPaused(false);
                gameRef.current?.restoreRoom("Sala reiniciada.");
              }}
              onRestartPhase={() => startPhase(progress, false)}
              onMenu={() => {
                setIsPaused(false);
                setScreen("MENU");
              }}
            />
          )}

          {card && (
            <LevelCard
              {...card}
              onDone={() => {
                const c = card;
                setCard(null);
                if (c?.intro) setQueue((q) => [...q, { type: "dialogue", lines: c.intro }]);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
