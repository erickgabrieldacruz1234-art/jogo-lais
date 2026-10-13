/** Controles de toque para celular/tablet. */
export default function VirtualControls({ setKeys, onAction }) {
  const hold = (dir, on) => (e) => {
    e.preventDefault();
    setKeys((prev) => ({ ...prev, [dir]: on }));
  };
  const btn = (dir, label) => (
    <button className={"dpad-btn dpad-" + dir} onPointerDown={hold(dir, true)} onPointerUp={hold(dir, false)} onPointerLeave={hold(dir, false)} onPointerCancel={hold(dir, false)}>
      {label}
    </button>
  );
  const act = (type) => (e) => {
    e.preventDefault();
    onAction(type);
  };
  return (
    <div className="virtual-controls">
      <div className="dpad-container">
        {btn("up", "▲")}
        {btn("left", "◀")}
        {btn("right", "▶")}
        {btn("down", "▼")}
      </div>
      <div className="action-buttons">
        <button className="action-round-btn small" onPointerDown={act("interact")}>E</button>
        <button className="action-round-btn bow" onPointerDown={act("shoot")}>Arco</button>
        <button className="action-round-btn" onPointerDown={act("attack")}>Espada</button>
      </div>
    </div>
  );
}
