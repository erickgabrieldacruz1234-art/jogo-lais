import { audio } from "../game/audioManager";

export default function PauseModal({ phase, hud, onResume, onRestartRoom, onRestartPhase, onMenu }) {
  const click = (fn) => () => {
    audio.playSfx("button_click");
    fn();
  };
  return (
    <div className="modal-backdrop">
      <div className="parchment-panel">
        <h3 className="panel-title">Pausa</h3>
        <p className="panel-text">
          Fase {phase.index} — {phase.title}
          {hud && (
            <>
              <br />
              Rosa: {hud.rose ? "encontrada" : "ainda não"} · Chave: {hud.key ? "encontrada" : "ainda não"}
            </>
          )}
        </p>
        <button className="fantasy-btn btn-primary" onClick={click(onResume)}>
          Continuar
        </button>
        <button className="fantasy-btn" onClick={click(onRestartRoom)}>
          Reiniciar sala <small>(se um enigma travar — tecla R)</small>
        </button>
        <button className="fantasy-btn" onClick={click(onRestartPhase)}>
          Reiniciar fase
        </button>
        <button className="fantasy-btn" onClick={click(onMenu)}>
          Menu principal
        </button>
        <p className="panel-hint">Setas/WASD andar · J/Z espada · K/X flecha · E/Espaço interagir</p>
      </div>
    </div>
  );
}
