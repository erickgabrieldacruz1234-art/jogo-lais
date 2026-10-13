import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoopGame } from "../game/engine/coopGame";
import { BONUS_MISSIONS, BONUS_HUB, BONUS_STEPS, BONUS_INTRO, BONUS_FINAL_MESSAGE, newBonus } from "../game/data/bonus";
import { iconURL } from "../game/engine/tileArt";
import { drawWood, drawSpecialStone, drawSeed, drawMapItem } from "../game/engine/coopArt";
import { makeCanvas } from "../game/engine/pixel";
import { audio } from "../game/audioManager";
import DialogueOverlay from "./DialogueOverlay";

// ---------------------------------------------------------------- controles
// Jogador 1 (Lais): WASD / Espaço / F / E — Jogador 2 (Erick): setas / Enter / Shift dir. / Ctrl dir.
const MOVE = [
  { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right" },
  { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }
];
const ACTIONS = [
  { Space: "attack", KeyF: "shoot", KeyE: "interact" },
  { Enter: "attack", NumpadEnter: "attack", ShiftRight: "shoot", ControlRight: "interact" }
];

const icons = {};
function coopIcon(kind) {
  if (icons[kind]) return icons[kind];
  const { c, g } = makeCanvas(32, 32);
  ({ wood: drawWood, stone: drawSpecialStone, seed: drawSeed, map: drawMapItem })[kind](g, 16, 28, 0);
  return (icons[kind] = c.toDataURL());
}

/** Monta a fase do passo atual da campanha. */
function phaseFor(step) {
  const s = BONUS_STEPS[step];
  if (!s) return null;
  if (s.kind === "mission") return BONUS_MISSIONS[s.mission];
  if (s.kind === "hub") return BONUS_HUB;
  if (s.kind === "free") return { ...BONUS_MISSIONS[3], mission: null, free: true, intro: null };
  return null;
}

export default function CoopScreen({ progress, onSave, onMenu }) {
  const bonus = progress.bonus || newBonus();
  const [step, setStep] = useState(bonus.step || 0);
  const [attempt, setAttempt] = useState(0);
  const [hud, setHud] = useState(null);
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [paused, setPaused] = useState(false);
  const [banner, setBanner] = useState(null); // título da missão
  const [finalMsg, setFinalMsg] = useState(false);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const bonusRef = useRef(bonus);
  const current = queue[0] || null;
  const blocking = Boolean(current) || paused || Boolean(banner) || finalMsg;
  const blockingRef = useRef(blocking);
  blockingRef.current = blocking;
  const phase = useMemo(() => phaseFor(step), [step]);

  const save = useCallback(
    (patch) => {
      bonusRef.current = { ...bonusRef.current, ...patch };
      onSave(bonusRef.current);
    },
    [onSave]
  );

  const toast = useCallback((text) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const say = useCallback((lines, after) => lines && lines.length && setQueue((q) => [...q, { lines, after }]), []);

  const goStep = useCallback(
    (n) => {
      save({ step: n });
      setQueue([]);
      setHud(null);
      setStep(n);
      setAttempt((a) => a + 1);
    },
    [save]
  );

  // ---------------------------------------------------------------- eventos do motor
  const onEvent = useCallback(
    (ev) => {
      const game = gameRef.current;
      const st = BONUS_STEPS[step];
      if (ev.type === "toast") return toast(ev.text);
      if (ev.type === "dialogue") return say(ev.lines);
      if (ev.type === "rose") return;
      if (ev.type === "planted") {
        save({ planted: [...game.campaign.planted] });
        return toast(`Rosa plantada! (${ev.count}/5)`);
      }
      if (ev.type === "board") {
        if (st.kind === "hub") {
          const next = BONUS_MISSIONS[BONUS_STEPS[step + 1].mission];
          return say([{ speaker: "Quadro de missões", portrait: null, text: `Próxima missão: ${next.title}.\nVamos lá, juntos!` }], () => goStep(step + 1));
        }
        return toast("Todas as missões concluídas. Aproveitem o nosso cantinho! ❤️");
      }
      if (ev.type === "phaseComplete" && st.kind === "mission") {
        const t = bonusRef.current.totals || newBonus().totals;
        const inv = game.inv;
        save({
          totals: { wood: t.wood + (inv.wood || 0), stone: t.stone + (inv.stone || 0), seed: t.seed + (inv.seed || 0), kills: t.kills + game.kills, delivered: t.delivered + 1 },
          [`m${st.mission + 1}`]: true
        });
        return goStep(step + 1);
      }
      if (ev.type === "missionReady" && phase?.mission?.finale) {
        // ---- final da campanha: pôr do sol, banco, diálogo e mensagem
        setTimeout(() => {
          const g = gameRef.current;
          g.cutscene = true;
          g.startFinale();
          audio.playSfx("rose");
          g.deliver(4, () => {
            save({ houseStage: 4, built: { bench: true }, planted: [...g.campaign.planted], m4: true });
            say(phase.outro, () => setFinalMsg(true));
          });
        }, 1200);
      }
    },
    [step, phase, toast, say, save, goStep]
  );
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // ---------------------------------------------------------------- motor
  useEffect(() => {
    if (!phase) return;
    const b = bonusRef.current;
    const campaign = {
      roses: progress.roses.length ? [...progress.roses] : ["ibiza", "praia", "jardim", "bruxas", "lago"],
      houseStage: b.houseStage || 0,
      planted: [...(b.planted || [])],
      built: { ...(b.built || {}) }
    };
    const game = new CoopGame(canvasRef.current, phase, { onHud: setHud, onEvent: (e) => onEventRef.current(e) }, campaign);
    gameRef.current = game;
    const st = BONUS_STEPS[step];
    if (phase.free) {
      game.objects = game.objects.filter((o) => !["enemy", "seed", "wood"].includes(o.type));
      Object.assign(game.flags, { irrigated: true, bench: true });
      game.sunset = true;
    }
    if (st.kind === "mission") setBanner({ title: phase.title, subtitle: phase.subtitle, intro: phase.intro });
    if (st.kind === "hub" && b.hubSeen !== step) {
      // chegada à clareira: entrega de materiais e a casa evolui
      game.cutscene = true;
      setTimeout(() => {
        toast(st.reward);
        game.deliver(st.deliver, () => {
          save({ houseStage: st.deliver, hubSeen: step });
          game.cutscene = false;
          const m = BONUS_MISSIONS[st.after];
          say([...m.outro, ...(BONUS_HUB.houseLines[st.deliver] || [])], () => toast("Interajam com o quadro de missões (à direita da casa) para continuar."));
        });
      }, 900);
    }
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      game.paused = blockingRef.current;
      game.update(dt);
      game.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt]);

  // ---------------------------------------------------------------- teclado (2 jogadores ao mesmo tempo)
  useEffect(() => {
    if (!phase) return;
    const setMove = (e, val) => {
      for (let i = 0; i < 2; i++) {
        const d = MOVE[i][e.code];
        if (!d) continue;
        e.preventDefault();
        const p = gameRef.current?.players[i];
        if (p) p.input = { ...p.input, [d]: val && !blockingRef.current };
        return true;
      }
      return false;
    };
    const down = (e) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (!current && !banner && !finalMsg) setPaused((v) => !v);
        return;
      }
      if (setMove(e, true)) return;
      for (let i = 0; i < 2; i++) {
        const a = ACTIONS[i][e.code];
        if (!a) continue;
        e.preventDefault();
        if (blockingRef.current || e.repeat) return;
        gameRef.current?.act(i, a);
        return;
      }
    };
    const up = (e) => setMove(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, current, banner, finalMsg]);

  useEffect(() => {
    if (blocking) gameRef.current?.players.forEach((p) => (p.input = { up: false, down: false, left: false, right: false }));
  }, [blocking]);

  // ---------------------------------------------------------------- telas
  if (step === 0) {
    return (
      <div className="coop-intro">
        <h2 className="coop-intro-title">{BONUS_INTRO.title}</h2>
        <p className="coop-intro-text">{BONUS_INTRO.text}</p>
        <div className="coop-controls">
          {BONUS_INTRO.controls.map((c) => (
            <div key={c.who} className="coop-control-card" style={{ borderColor: c.color }}>
              <h3 style={{ color: c.color }}>{c.who}</h3>
              {c.keys.map(([what, key]) => (
                <div key={what} className="coop-key-row">
                  <span>{what}</span>
                  <kbd>{key}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
        <ul className="coop-tips">
          {BONUS_INTRO.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="coop-intro-buttons">
          <button className="fantasy-btn btn-primary" onClick={() => goStep(1)}>
            Começar a aventura juntos ❤️
          </button>
          <button className="fantasy-btn" onClick={onMenu}>
            Voltar ao menu
          </button>
        </div>
      </div>
    );
  }

  const st = BONUS_STEPS[step];
  const totals = bonusRef.current.totals || newBonus().totals;
  const inv = hud?.inv || {};
  const title = st.kind === "mission" ? `${phase.subtitle} — ${phase.title}` : st.kind === "hub" ? "Nosso Cantinho — a clareira" : "Nosso Cantinho — exploração livre";

  return (
    <div className="play-area coop-area">
      <div className="coop-hud">
        <div className="coop-hud-players">
          {(hud?.players || []).map((p, i) => (
            <div key={p.name} className={"coop-player" + (p.down ? " is-down" : "")} style={{ color: i ? "#7ad8ff" : "#ff8aa8" }}>
              <b>{i ? "P2" : "P1"} {p.name}</b>
              <span className="coop-hearts">
                {Array.from({ length: p.maxHp }, (_, k) => (
                  <img key={k} src={iconURL("heart", k < p.hp ? "full" : "empty")} alt="" />
                ))}
              </span>
              {p.down && <small> caiu…</small>}
            </div>
          ))}
        </div>
        <div className="coop-hud-title">{title}</div>
        <div className="coop-inventory" title="Inventário da equipe">
          <span><img src={coopIcon("wood")} alt="madeira" />{(inv.wood || 0) + totals.wood}</span>
          <span><img src={coopIcon("stone")} alt="pedras" />{(inv.stone || 0) + totals.stone}</span>
          <span><img src={coopIcon("seed")} alt="sementes" />{(inv.seed || 0) + totals.seed}</span>
          {(inv.map || bonusRef.current.m1) ? <span><img src={coopIcon("map")} alt="mapa" /></span> : null}
          {inv.smallKeys ? <span><img src={iconURL("key", "silver")} alt="chave" />{inv.smallKeys}</span> : null}
          <span className="coop-roses">
            {progress.roses.map((r) => (
              <img key={r} src={iconURL("rose", r)} alt={r} />
            ))}
          </span>
          <button className="hud-btn" onClick={() => setPaused(true)}>
            ❚❚
          </button>
        </div>
      </div>

      <div className="game-frame">
        <canvas ref={canvasRef} width={960} height={576} className="game-canvas" />
      </div>

      {hud?.objectives?.length > 0 && (
        <div className={"coop-objectives" + (hud.done ? " is-done" : "")}>
          <b>{hud.done ? "Tudo pronto! Vão até a porta de saída." : "Objetivos"}</b>
          {hud.objectives.map((o) => (
            <div key={o.id} className={"coop-obj" + (o.done ? " done" : "") + (o.optional ? " optional" : "")}>
              {o.done ? "✔" : o.optional ? "☆" : "○"} {o.text}
            </div>
          ))}
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>

      {current && (
        <DialogueOverlay
          key={queue.length + current.lines[0].text}
          dialogueLines={current.lines}
          onFinish={() => {
            setQueue((q) => q.slice(1));
            current.after && current.after();
          }}
        />
      )}

      {banner && (
        <div className="level-card" onClick={() => {
          const b = banner;
          setBanner(null);
          say(b.intro);
        }}>
          <div className="level-card-inner">
            <div className="level-card-num">{banner.subtitle} · Cooperativo</div>
            <h2 className="level-card-title">{banner.title}</h2>
            <button className="fantasy-btn btn-primary" onClick={(e) => {
              e.stopPropagation();
              const b = banner;
              setBanner(null);
              say(b.intro);
            }}>
              Começar
            </button>
          </div>
        </div>
      )}

      {finalMsg && (
        <div className="coop-final">
          <h2>{BONUS_FINAL_MESSAGE}</h2>
          <button
            className="fantasy-btn btn-primary"
            onClick={() => {
              setFinalMsg(false);
              save({ step: 8, done: true });
              const g = gameRef.current;
              g.cutscene = false;
              g.mission = null;
              g.objects = g.objects.filter((o) => o.type !== "enemy");
              setStep(8);
              toast("Exploração livre: passeiem, sentem no banco, visitem as rosas ❤️");
            }}
          >
            Explorar o nosso cantinho
          </button>
          <button className="fantasy-btn" onClick={onMenu}>
            Voltar ao menu
          </button>
        </div>
      )}

      {paused && (
        <div className="modal-backdrop">
          <div className="parchment-panel">
            <h3 className="panel-title">Pausa</h3>
            <p className="panel-text">{title}</p>
            <button className="fantasy-btn btn-primary" onClick={() => setPaused(false)}>
              Continuar
            </button>
            <button
              className="fantasy-btn"
              onClick={() => {
                const g = gameRef.current;
                g.resetRoomPuzzle(0);
                if (g.roomOf(g.players[1].x, g.players[1].y).key !== g.roomOf(g.players[0].x, g.players[0].y).key) g.resetRoomPuzzle(1);
                setPaused(false);
              }}
            >
              Reiniciar puzzle da sala <small>(pedras, caixas, alavancas, canos)</small>
            </button>
            {st.kind === "mission" && (
              <button
                className="fantasy-btn"
                onClick={() => {
                  setPaused(false);
                  setAttempt((a) => a + 1);
                  setQueue([]);
                }}
              >
                Reiniciar missão
              </button>
            )}
            <button className="fantasy-btn" onClick={onMenu}>
              Menu principal
            </button>
            <p className="panel-hint">P1 Lais: WASD · Espaço espada · F flecha · E interagir — P2 Erick: setas · Enter espada · Shift dir. flecha · Ctrl dir. interagir</p>
          </div>
        </div>
      )}
    </div>
  );
}
