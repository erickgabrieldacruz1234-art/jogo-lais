// ============================================================================
// PLAYTEST AUTOMÁTICO DAS 5 FASES
// Roda o motor real (src/game/engine/tileGame.js) sem navegador e joga cada
// fase do começo ao fim, casa a casa, seguindo tests/web/plans.mjs.
//
// Dois modos:
//   lógico   (padrão)  sem dano — confirma que todo enigma tem solução e que
//                       nada pode ser pulado.
//   realista (--real)  COM dano — o robô espera o ritmo dos espinhos, das ondas
//                       e do fogo antes de pisar; a fase falha se a Lais morrer.
//
//   npm run test:fases                 (todas, nos dois modos)
//   node tests/web/.out/playtest.mjs jardim --real
// ============================================================================

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const REAL = args.includes("--real");
const only = args.find((a) => !a.startsWith("--"));

// ---- modo orquestrador: cada fase em um processo próprio (mais robusto)
if (!only) {
  const { PHASES } = await import("../../src/game/data/phases.js");
  const self = fileURLToPath(import.meta.url);
  let bad = 0;
  for (const mode of ["", "--real"]) {
    console.log(`\n=============== MODO ${mode ? "REALISTA (com dano)" : "LÓGICO (sem dano)"} ===============`);
    for (const ph of PHASES) {
      const r = spawnSync(process.execPath, ["--jitless", self, ph.id, ...(mode ? [mode] : [])], { encoding: "utf8" });
      process.stdout.write(r.stdout || "");
      if (r.status !== 0) {
        bad++;
        if (!r.stdout?.includes("FALHA")) console.log(`   ✗ processo terminou com erro (${r.status}) ${r.stderr?.slice(0, 300) || ""}`);
      }
    }
  }
  console.log(bad ? `\n${bad} FASE(S) COM FALHA` : "\nTODAS AS FASES PASSARAM NOS DOIS MODOS ✔");
  process.exit(bad ? 1 : 0);
}

// ---- modo fase única
const noop = () => {};
const ctxStub = new Proxy({}, {
  get: (t, k) => (k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop: noop }) : t[k] ?? noop),
  set: (t, k, v) => ((t[k] = v), true)
});
globalThis.window = { addEventListener: noop, removeEventListener: noop, location: { search: "" } };
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub, toDataURL: () => "" }) };
globalThis.Audio = class { constructor() { this.volume = 1; } play() { return Promise.resolve(); } pause() {} };
globalThis.Image = class { set src(v) { setTimeout(() => this.onerror && this.onerror(), 0); } };

const { TileGame, ROOM_W, ROOM_H } = await import("../../src/game/engine/tileGame.js");
const { PHASES } = await import("../../src/game/data/phases.js");
const { PLANS } = await import("./plans.mjs");

const DT = 0.02;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let failures = 0;
const fail = (m) => (failures++, console.log("   ✗ " + m));
const ok = (m) => console.log("   ✓ " + m);
const G = (room, lx, ly) => {
  const [rx, ry] = room.split(",").map(Number);
  return [rx * ROOM_W + lx, ry * ROOM_H + ly];
};

function settle(game, max = 4) {
  for (let i = 0; i < max / DT; i++) {
    game.update(DT);
    const p = game.player;
    const busy = p.move || game.cam.slide || p.holdItem || (game.exiting && !game.exiting.done) || game.projectiles.some((pr) => pr.kind === "arrow") || game.objects.some((o) => o.move && o.type !== "enemy");
    if (!busy && i > 2) return;
  }
}

function wait(game, secs) {
  for (let i = 0; i < secs / DT; i++) game.update(DT);
}

// ---------------------------------------------------------------- perigo previsto
function dangerAt(game, x, y, from, to) {
  const objs = game.objsAt(x, y);
  const t0 = game.time;
  for (let tt = from; tt <= to; tt += 0.05) {
    game.time = t0 + tt;
    for (const o of objs) {
      if (o.type === "spikes" && game.spikeUp(o)) return (game.time = t0), true;
      if (o.type === "tide" && game.tideLevel(o) > 0.4) return (game.time = t0), true;
    }
  }
  game.time = t0;
  // bolas de fogo já voando ou prestes a sair das gárgulas
  for (const pr of game.projectiles) {
    if (pr.kind === "arrow" || pr.dx !== 0 || pr.x !== x) continue;
    const dist = y - (pr.y + pr.t);
    if (dist < -0.6) continue;
    const eta = dist / pr.speed;
    if (eta > from - 0.35 && eta < to + 0.35) return true;
  }
  for (const o of game.objects) {
    if (o.type !== "turret" || o.x !== x || o.y > y) continue;
    if (game.roomOf(o.x, o.y).key !== game.roomOf(x, y).key) continue;
    const toFire = (o.period || 2) - o.timer;
    const eta = toFire + (y - o.y) / (o.speed || 5);
    if (eta > from - 0.35 && eta < to + 0.35) return true;
  }
  return false;
}

function hazardTile(game, x, y) {
  return game.objsAt(x, y).some((o) => o.type === "spikes" || o.type === "tide") || game.objects.some((o) => o.type === "turret" && o.x === x && o.y < y && game.roomOf(o.x, o.y).key === game.roomOf(x, y).key);
}

/** Dá um passo com cuidado: no modo realista espera o momento seguro. */
function stepCarefully(game, d, nextD) {
  if (REAL) {
    const p = game.player;
    const [dx, dy] = DIRS[d];
    const nx = p.x + dx, ny = p.y + dy;
    let nnx = null, nny = null;
    if (nextD) {
      const [ex, ey] = DIRS[nextD];
      nnx = nx + ex;
      nny = ny + ey;
    }
    for (let k = 0; k < 400; k++) {
      const hereSafe = !dangerAt(game, p.x, p.y, 0, 0.1);
      const destOk = !dangerAt(game, nx, ny, 0, 0.55);
      const nextOk = nnx === null || !hazardTile(game, nx, ny) || !dangerAt(game, nnx, nny, 0.15, 0.7);
      if (destOk && nextOk) break;
      if (!hereSafe) break; // ficar parado é pior: vai
      game.update(DT);
    }
  }
  game.tryStep(d);
  settle(game);
}

function passable(game, x, y) {
  if (game.objsAt(x, y).some((o) => o.type === "lock" && !o.open)) return game.inv.smallKeys > 0;
  return !game.blocks(x, y, "player");
}

function path(game, goal) {
  const p = game.player;
  const key = (x, y) => x + "," + y;
  const prev = new Map([[key(p.x, p.y), null]]);
  const q = [[p.x, p.y]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (goal(x, y)) {
      const out = [];
      let k = key(x, y);
      while (prev.get(k)) {
        const [px, py, d] = prev.get(k);
        out.unshift(d);
        k = key(px, py);
      }
      return out;
    }
    for (const [d, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy;
      if (prev.has(key(nx, ny)) || !passable(game, nx, ny)) continue;
      prev.set(key(nx, ny), [x, y, d]);
      q.push([nx, ny]);
    }
  }
  return null;
}

function fightBlocker(game, d) {
  const [dx, dy] = DIRS[d];
  for (let k = 0; k < 12; k++) {
    if (!game.enemyAt(game.player.x + dx, game.player.y + dy)) return;
    game.player.dir = d;
    game.player.attackCd = 0;
    game.attack();
    settle(game, 0.3);
  }
}

function walkTo(game, tx, ty) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const steps = path(game, (x, y) => x === tx && y === ty);
    if (!steps) return false;
    for (let i = 0; i < steps.length; i++) {
      const d = steps[i];
      const before = [game.player.x, game.player.y];
      fightBlocker(game, d);
      stepCarefully(game, d, steps[i + 1]);
      if (game.player.x === before[0] && game.player.y === before[1]) {
        game.tryStep(d); // porta trancada: a 1ª tentativa abre
        settle(game);
      }
      if (game.player.x === before[0] && game.player.y === before[1]) break;
    }
    if (game.player.x === tx && game.player.y === ty) return true;
  }
  return false;
}

function killAll(game, room) {
  const [rx, ry] = room.split(",").map(Number);
  const inRoom = (o) => Math.floor(o.x / ROOM_W) === rx && Math.floor(o.y / ROOM_H) === ry;
  for (let k = 0; k < 300; k++) {
    const en = game.objects.find((o) => o.type === "enemy" && o.alive && inRoom(o));
    if (!en) return null;
    const p = game.player;
    if (Math.abs(p.x - en.x) + Math.abs(p.y - en.y) === 1) {
      game.player.dir = en.x > p.x ? "right" : en.x < p.x ? "left" : en.y > p.y ? "down" : "up";
      game.player.attackCd = 0;
      game.attack();
      settle(game, 0.3);
      continue;
    }
    const steps = path(game, (x, y) => Math.abs(x - en.x) + Math.abs(y - en.y) === 1);
    if (!steps) return `não alcança inimigo em ${en.x},${en.y}`;
    for (const [i, d] of steps.slice(0, 2).entries()) {
      fightBlocker(game, d);
      stepCarefully(game, d, steps[i + 1]);
    }
  }
  const left = game.objects.filter((o) => o.type === "enemy" && o.alive && inRoom(o)).map((o) => `${o.look}@${o.x},${o.y} hp${o.hp}`);
  const st = path(game, (x, y) => x === 36 && y === 14);
  return `inimigos não foram derrotados: ${left.join(" ")} | Lais em ${game.player.x},${game.player.y} move=${!!game.player.move} slide=${!!game.cam.slide} hold=${!!game.player.holdItem} fade=${game.fade} path=${st ? st.join(",") : "nenhum"}`;
}

const phase = PHASES.find((p) => p.id === only);
if (!phase) {
  console.log("fase desconhecida: " + only);
  process.exit(1);
}
console.log(`\n▶ Fase ${phase.index}: ${phase.title}${REAL ? "  [realista]" : ""}`);
const events = [];
let game;
try {
  game = new TileGame({ width: 960, height: 576, getContext: () => ctxStub }, phase, { onHud: noop, onEvent: (e) => events.push(e) });
} catch (e) {
  fail("erro ao montar a fase: " + e.message);
  process.exit(1);
}
game.godMode = !REAL;
await new Promise((r) => setTimeout(r, 10));
game.ready = true;
let deaths = 0, hits = 0;
const origDamage = game.damage.bind(game);
game.damage = (src) => {
  const before = game.player.hp;
  origDamage(src);
  if (game.player.hp < before || game.fade > 0.7) hits++;
};
const origRestore = game.restoreRoom.bind(game);
game.restoreRoom = (msg) => {
  if (msg && msg.includes("respira")) deaths++;
  origRestore(msg);
};

const t0 = Date.now();
for (const [kind, room, lx, ly, dir, n] of PLANS[phase.id] || []) {
  const [x, y] = room ? G(room, lx, ly) : [0, 0];
  events.length = 0;
  let err = null;
  const deathsBefore = deaths;
  if (kind === "walk") {
    if (!walkTo(game, x, y)) err = `não chega em ${room} (${lx},${ly})`;
    else ok(`andou até ${room} (${lx},${ly})`);
  } else if (kind === "unreach") {
    if (path(game, (px, py) => px === x && py === y)) err = `${room} (${lx},${ly}) é alcançável ANTES do desafio`;
    else ok(`${room} (${lx},${ly}) bloqueado antes do desafio`);
  } else if (kind === "push") {
    if (!walkTo(game, x, y)) err = `não chega na posição de empurrar ${room} (${lx},${ly})`;
    else {
      for (let i = 0; i < n; i++) {
        const snap = () => game.objects.filter((o) => (o.type === "boulder" || o.type === "crate") && !o.gone).map((o) => o.x + "," + o.y).join("|");
        const before = snap();
        stepCarefully(game, dir, null);
        if (before === snap()) {
          err = `empurrão ${i + 1}/${n} para ${dir} não moveu nada (sala ${room})`;
          break;
        }
      }
      if (!err) ok(`empurrou ${n}x para ${dir} a partir de ${room} (${lx},${ly})`);
    }
  } else if (kind === "interact" || kind === "shoot" || kind === "attack") {
    if (!walkTo(game, x, y)) err = `não chega em ${room} (${lx},${ly})`;
    else {
      game.player.dir = dir;
      game.player.attackCd = 0;
      game.player.shootCd = 0;
      game[kind]();
      settle(game, 2.5);
      ok(`${kind} para ${dir} em ${room} (${lx},${ly})${events.length ? " → " + events.map((e) => e.text || e.type).join(" | ") : ""}`);
    }
  } else if (kind === "kill") {
    err = killAll(game, room);
    if (!err) ok(`derrotou os inimigos da sala ${room}`);
  } else if (kind === "exitLocked" || kind === "exit") {
    const ex = game.objects.find((o) => o.type === "exit");
    if (!walkTo(game, ex.x, ex.y + 1)) err = "não chega na frente da porta";
    else {
      game.tryStep("up");
      settle(game, 3);
      const done = events.some((e) => e.type === "phaseComplete");
      if (kind === "exitLocked") {
        if (done) err = "a porta abriu sem rosa e chave!";
        else ok("porta trancada sem rosa e chave (" + (events.find((e) => e.text)?.text || "") + ")");
      } else if (!done) err = "a porta não abriu no fim da fase";
      else ok("porta aberta — fase concluída!");
    }
  }
  if (deaths > deathsBefore) err = (err ? err + " | " : "") + `a Lais morreu durante "${kind} ${room || ""} ${lx ?? ""},${ly ?? ""}"`;
  if (err) fail(err);
}
if (!game.inv.rose) fail("rosa não foi coletada");
if (!game.inv.key) fail("chave não foi coletada");
const dTotal = game.diamondsTotal;
console.log(`   · diamantes: ${game.inv.diamonds}/${dTotal} · golpes recebidos: ${hits} · mortes: ${deaths} · tempo simulado: ${game.time.toFixed(0)}s`);
console.log(failures ? `   ${failures} FALHA(S)` : "   ✔ fase concluída");
process.exit(failures ? 1 : 0);
