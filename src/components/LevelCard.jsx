import { useEffect, useRef, useState } from "react";
import { iconURL } from "../game/engine/tileArt";
import { PHASES } from "../game/data/phases";

/** Cartão de título exibido na transição entre fases. */
export default function LevelCard({ index, title, subtitle, onDone }) {
  const [phase, setPhase] = useState("in");
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2600);
    const t2 = setTimeout(() => done.current(), 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const roseId = PHASES[index - 1]?.id;
  return (
    <div className={"level-card " + phase} onClick={() => done.current()}>
      <div className="level-card-inner">
        <div className="level-card-num">Fase {index} de 5</div>
        {roseId && <img className="level-card-rose" src={iconURL("rose", roseId)} alt="" />}
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="level-card-goal">Encontre a rosa e a chave para abrir a porta.</div>
      </div>
    </div>
  );
}
