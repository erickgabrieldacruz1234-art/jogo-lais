import { useEffect, useState } from "react";
import { audio } from "../game/audioManager";
import { PHASES } from "../game/data/phases";
import { iconURL } from "../game/engine/tileArt";

/** Interface da fase: nome, rosas (inventário), chave, vidas, progresso e objetivo. */
export default function HUD({ phase, hud, roses, keyFlash, muted, onToggleMusic, onPause }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!keyFlash) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1400);
    return () => clearTimeout(t);
  }, [keyFlash]);

  const click = (fn) => () => {
    audio.playSfx("button_click");
    fn();
  };

  return (
    <div className="hud-container">
      <div className="hud-left">
        <div className="hud-level">
          <span className="hud-level-num">Fase {phase.index}</span>
          <span className="hud-level-title">{phase.title}</span>
        </div>
        <div className={"hud-objective" + (hud.key && hud.rose ? " is-ready" : "")}>
          <span className="hud-objective-text">{hud.objective}</span>
        </div>
      </div>

      <div className="hud-right">
        <div className="hud-panel">
          <div className="hud-roses" title="Rosas coletadas">
            {PHASES.map((ph) => {
              const has = roses.includes(ph.id) || (ph.id === phase.id && hud.rose);
              return (
                <span key={ph.id} className={"hud-slot" + (has ? " has" : "") + (ph.id === phase.id ? " current" : "")}>
                  <img src={iconURL("rose", ph.id)} alt={has ? "rosa" : "?"} />
                </span>
              );
            })}
          </div>
          <div className="hud-row">
            <span className={"hud-key" + (hud.key ? " has" : "") + (pulse ? " pulse" : "")} title="Chave da fase">
              <img src={iconURL("key", "gold")} alt="chave" />
            </span>
            {hud.smallKeys > 0 && (
              <span className="hud-chip" title="Chaves pequenas">
                <img src={iconURL("key", "silver")} alt="" /> {hud.smallKeys}
              </span>
            )}
            <span className="hud-chip" title="Diamantes (tesouros opcionais)">
              <img src={iconURL("diamond", "")} alt="" /> {hud.diamonds}/{hud.diamondsTotal}
            </span>
            <span className="hud-chip" title="Salas visitadas">
              Sala {hud.rooms}/{hud.totalRooms}
            </span>
          </div>
          <div className="hud-hearts" title="Vida">
            {Array.from({ length: hud.maxHp }, (_, i) => (
              <img key={i} src={iconURL("heart", i < hud.hp ? "full" : "empty")} alt="" />
            ))}
          </div>
        </div>
        <div className="hud-buttons">
          <button className="hud-btn" onClick={click(onToggleMusic)} title="Música">
            {muted ? "♪̸" : "♪"}
          </button>
          <button className="hud-btn" onClick={click(onPause)} title="Pausar (Esc)">
            ❚❚
          </button>
        </div>
      </div>
    </div>
  );
}
