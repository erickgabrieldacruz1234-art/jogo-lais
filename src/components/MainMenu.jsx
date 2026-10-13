import { useState } from "react";
import { audio } from "../game/audioManager";
import { saveManager } from "../game/saveManager";
import { PHASES } from "../game/data/phases";
import { iconURL } from "../game/engine/tileArt";
import MenuScene from "./MenuScene";

export default function MainMenu({ onStartGame, onContinueGame, onSelectPhase }) {
  const [modal, setModal] = useState(null); // "phases" | "confirm"
  const save = saveManager.load();
  const unlocked = save ? save.phase : 0;

  const click = (fn) => () => {
    audio.playSfx("button_click");
    audio.playMusic();
    fn();
  };

  return (
    <div className="main-menu-container">
      <MenuScene />
      <div className="main-menu-content">
        <div className="main-menu-kicker">✦ Uma aventura para Lais ✦</div>
        <h1 className="main-menu-title">A Lenda de Lais</h1>
        <h2 className="main-menu-subtitle">Cinco rosas, cinco portas e um caminho até Erick</h2>

        <div className="menu-roses">
          {PHASES.map((p) => (
            <img key={p.id} className={save?.roses.includes(p.id) ? "got" : ""} src={iconURL("rose", p.id)} alt="" />
          ))}
        </div>

        <div className="menu-buttons">
          {save && (
            <button className="fantasy-btn btn-primary" onClick={click(onContinueGame)}>
              Continuar
              <small>{save.phase >= PHASES.length ? "O final" : `Fase ${save.phase + 1}: ${PHASES[save.phase].title}`} · {save.roses.length}/5 rosas</small>
            </button>
          )}
          <button className={"fantasy-btn" + (save ? "" : " btn-primary")} onClick={click(() => (save ? setModal("confirm") : onStartGame()))}>
            Nova aventura
          </button>
          <button className="fantasy-btn" onClick={click(() => setModal("phases"))}>
            Fases
          </button>
        </div>

        <div className="main-menu-dedication">
          <span className="heart-pulse">♥</span> Feito por Erick, para Lais <span className="heart-pulse">♥</span>
        </div>
      </div>

      {modal === "confirm" && (
        <div className="modal-backdrop">
          <div className="parchment-panel">
            <h3 className="panel-title">Começar de novo?</h3>
            <p className="panel-text">As rosas guardadas e o progresso salvo serão apagados.</p>
            <button className="fantasy-btn btn-primary" onClick={click(onStartGame)}>
              Sim, nova aventura
            </button>
            <button className="fantasy-btn" onClick={click(() => setModal(null))}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {modal === "phases" && (
        <div className="modal-backdrop">
          <div className="parchment-panel wide">
            <h3 className="panel-title">As Cinco Lembranças</h3>
            <div className="level-list">
              {PHASES.map((p, i) => {
                const open = i <= unlocked;
                const got = save?.roses.includes(p.id);
                return (
                  <button key={p.id} className={"level-row" + (open ? "" : " locked")} disabled={!open} onClick={click(() => onSelectPhase(i))}>
                    <span className="level-row-num">{p.index}</span>
                    <span className="level-row-title">
                      {open ? p.title : "???"}
                      <small>{open ? p.subtitle : "Termine a fase anterior"}</small>
                    </span>
                    <img className={"level-row-item" + (got ? " got" : "")} src={iconURL("rose", p.id)} alt="" />
                  </button>
                );
              })}
            </div>
            <button className="fantasy-btn" onClick={click(() => setModal(null))}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
