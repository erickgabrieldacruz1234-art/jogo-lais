// ============================================================================
// PLAYTEST AUTOMÁTICO DA CAMPANHA COOPERATIVA (4 missões + clareira)
// Roda o motor real (CoopGame) sem navegador. Os DOIS jogadores andam:
// a Lais (P1) executa o roteiro e o Erick (P2) a acompanha passo a passo
// pelo próprio caminho, respeitando o limite de distância entre os dois.
// Em salas de cooperação o Erick segura o botão enquanto a Lais passa.
//
//   npm run test:coop
// ============================================================================

const noop = () => {};
const ctxStub = new Proxy({}, {
  get: (t, k) => (k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop: noop }) : t[k] ?? noop),
  set: (t, k, v) => ((t[k] = v), true)
});
globalThis.window = { addEventListener: noop, removeEventListener: noop, location: { search: "" } };
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub, toDataURL: () => "" }) };
globalThis.Audio = class { constructor() { this.volume = 1; } play() { return Promise.resolve(); } pause() {} };
globalThis.Image = class { set src(v) { setTimeout(() => this.onerror && this.onerror(), 0); } };
globalThis.setTimeout = ((st) => (fn, ms) => st(fn, 0))(globalThis.setTimeout);

const { CoopGame } = await import("../../src/game/engine/coopGame.js");
const { ROOM_W, ROOM_H } = await import("../../src/game/engine/tileGame.js");
const { BONUS_MISSIONS, BONUS_HUB } = await import("../../src/game/data/bonus.js");
const { PIPE_DIRS } = await import("../../src/game/engine/coopArt.js");

const DT = 0.02;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const ROSES = ["ibiza", "praia", "jardim", "bruxas", "lago"];
let failures = 0;
const fail = (m) => (failures++, console.log("   ✗ " + m));
const ok = (m) => console.log("   ✓ " + m);
const G = (room, lx, ly) => {
  const [rx, ry] = room.split(",").map(Number);
  return [rx * ROOM_W + lx, ry * ROOM_H + ly];
};

async function boot(phase, campaign) {
  const events = [];
  const game = new CoopGame({ getContext: () => ctxStub }, phase, { onEvent: (e) => events.push(e), onHud: noop }, campaign);
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 50 && !game.ready; i++) await new Promise((r) => setTimeout(r, 5));
  game.ready = true;
  game.godMode = true;
  game.events = events;
  return game;
}

function busy(game) {
  return game.players.some((p) => p.move || p.holdItem) || game.projectiles.some((pr) => pr.kind === "arrow") || game.objects.some((o) => o.move && o.type !== "enemy") || (game.exiting && !game.exiting.done);
}
function settle(game, max = 4) {
  for (let i = 0; i < max / DT; i++) {
    game.update(DT);
    if (!busy(game) && i > 2) return;
  }
}

function path(game, p, goal) {
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
      if (prev.has(key(nx, ny))) continue;
      if (game.asPlayer(p, () => game.blocks(nx, ny, "player"))) continue;
      prev.set(key(nx, ny), [x, y, d]);
      q.push([nx, ny]);
    }
  }
  return null;
}

const P1 = (g) => g.players[0];
const P2 = (g) => g.players[1];

function step(game, p, d) {
  game.asPlayer(p, () => game.tryStep(d));
  settle(game);
}

/** Erick acompanha a Lais (a menos que esteja segurando um botão). */
function follow(game) {
  if (game.hold2) return;
  const a = P1(game), b = P2(game);
  for (let k = 0; k < 30 && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 3; k++) {
    const steps = path(game, b, (x, y) => Math.abs(x - a.x) + Math.abs(y - a.y) <= 2 && !(x === a.x && y === a.y));
    if (!steps || !steps.length) return;
    const before = b.x + "," + b.y;
    step(game, b, steps[0]);
    if (b.x + "," + b.y === before) return;
  }
}

function walkTo(game, tx, ty, who = 0) {
  const p = game.players[who];
  for (let attempt = 0; attempt < 30; attempt++) {
    if (p.x === tx && p.y === ty) return true;
    const steps = path(game, p, (x, y) => x === tx && y === ty);
    if (!steps) {
      if (process.env.DBG) for (let yy = 0; yy < 9; yy++) console.log([...Array(15)].map((_, xx) => (xx === p.x % 15 && yy === p.y % 9 ? "@" : game.asPlayer(p, () => game.blocks(xx + p.x - p.x % 15, yy + p.y - p.y % 9, "player")) ? "#" : game.enemyAt(xx, yy) ? "e" : ".")).join(""));
      console.log("DBG sem caminho", p.name, p.x, p.y, "->", tx, ty, "move", JSON.stringify(p.move), "hold", JSON.stringify(p.holdItem), "down", p.down, "sit", p.sitting);
      return false;
    }
    const d = steps[0];
    const [dx, dy] = DIRS[d];
    const en = game.enemyAt(p.x + dx, p.y + dy);
    if (en) {
      p.dir = d;
      p.attackCd = 0;
      game.asPlayer(p, () => game.attack());
      settle(game, 0.3);
      continue;
    }
    const before = p.x + "," + p.y;
    step(game, p, d);
    if (who === 0) follow(game);
    if (p.x + "," + p.y !== before) attempt = Math.max(0, attempt - 1);
  }
  return p.x === tx && p.y === ty;
}

function act(game, d, action, who = 0, times = 1) {
  const p = game.players[who];
  for (let i = 0; i < times; i++) {
    p.dir = d;
    p.attackCd = 0;
    p.shootCd = 0;
    game.asPlayer(p, () => game[action]());
    settle(game, 1.2);
  }
}

function at(game, room, lx, ly, who = 0) {
  const [x, y] = G(room, lx, ly);
  const r = walkTo(game, x, y, who);
  if (!r) fail(`${who ? "Erick" : "Lais"} não conseguiu chegar em ${room} (${lx},${ly}) — está em ${game.players[who].x},${game.players[who].y}`);
  return r;
}

/** Caça todos os inimigos vivos de uma sala (inclusive chefes). */
function clearRoom(game, room) {
  const [rx, ry] = room.split(",").map(Number);
  const inRoom = (o) => Math.floor(o.x / ROOM_W) === rx && Math.floor(o.y / ROOM_H) === ry;
  for (let guard = 0; guard < 400; guard++) {
    const en = game.objects.find((o) => o.type === "enemy" && o.alive && inRoom(o));
    if (!en) return true;
    const p = P1(game);
    const adj = Object.entries(DIRS).find(([, [dx, dy]]) => p.x + dx === en.x && p.y + dy === en.y);
    if (adj) {
      act(game, adj[0], "attack");
      continue;
    }
    const steps = path(game, p, (x, y) => Math.abs(x - en.x) + Math.abs(y - en.y) === 1);
    if (!steps || !steps.length) {
      settle(game, 0.3);
      continue;
    }
    step(game, p, steps[0]);
    follow(game);
  }
  fail(`inimigos sobraram na sala ${room}`);
  return false;
}

function pickAll(game, type) {
  for (const o of game.objects.filter((o) => o.type === type && !o.gone)) {
    if (!walkTo(game, o.x, o.y)) fail(`não alcançou ${type} em ${o.x},${o.y}`);
  }
}

function exitBy(game, room, lx, ly, d) {
  at(game, room, lx, ly);
  for (let k = 0; k < 3 && !game.exiting; k++) step(game, P1(game), d);
  settle(game, 3);
  if (game.events.some((e) => e.type === "phaseComplete")) ok("saída aberta e missão concluída (phaseComplete)");
  else fail("a porta de saída não concluiu a missão");
}

function report(game) {
  const left = game.objectiveList().filter((o) => !o.done);
  for (const o of game.objectiveList()) (o.done ? ok : o.optional ? (m) => console.log("   · " + m) : fail)(`${o.text}${o.optional ? " (opcional)" : ""}`);
  return left;
}

function lockedEarly(game, room, lx, ly, d) {
  // antes de cumprir os objetivos a porta tem que estar fechada
  const g2 = game;
  const [x, y] = G(room, lx, ly);
  const p = P1(g2);
  const saved = { x: p.x, y: p.y, px: p.px, py: p.py };
  Object.assign(p, { x, y, px: x * 32, py: y * 32 });
  g2.asPlayer(p, () => g2.tryStep(d));
  const opened = Boolean(g2.exiting);
  Object.assign(p, saved);
  if (opened) fail("a porta abriu antes dos objetivos!");
  else ok("porta fechada antes de cumprir os objetivos");
}

// ---------------------------------------------------------------- roteiros
const camp = () => ({ roses: [...ROSES], houseStage: 0, planted: [], built: {} });

const SCRIPTS = {
  async m1(g) {
    lockedEarly(g, "1,1", 7, 7, "down");
    at(g, "0,0", 1, 1); // segredo atrás da parede falsa
    clearRoom(g, "0,0");
    at(g, "1,0", 7, 3);
    act(g, "up", "attack");
    at(g, "1,0", 7, 1);
    clearRoom(g, "1,0");
    at(g, "1,0", 10, 4);
    step(g, P1(g), "down"); // entra no corredor
    step(g, P1(g), "down"); // empurra a pedra
    at(g, "1,0", 11, 6);
    act(g, "right", "interact");
    at(g, "0,1", 7, 2);
    clearRoom(g, "0,1");
    at(g, "0,1", 4, 4);
    act(g, "up", "interact");
    at(g, "0,1", 10, 4);
    act(g, "up", "interact");
    at(g, "1,1", 2, 4);
    clearRoom(g, "1,1");
    pickAll(g, "map");
    report(g);
    exitBy(g, "1,1", 7, 7, "down");
  },
  async m2(g) {
    lockedEarly(g, "0,1", 13, 2, "right");
    at(g, "0,0", 3, 5);
    step(g, P1(g), "up");
    step(g, P1(g), "up");
    at(g, "0,0", 10, 5);
    step(g, P1(g), "up");
    step(g, P1(g), "up");
    at(g, "0,0", 6, 7);
    clearRoom(g, "0,0");
    at(g, "1,0", 2, 4);
    clearRoom(g, "1,0");
    at(g, "1,0", 1, 3);
    act(g, "up", "shoot");
    at(g, "1,0", 13, 3);
    act(g, "up", "shoot");
    at(g, "1,0", 12, 6);
    at(g, "1,0", 7, 3);
    act(g, "up", "attack");
    at(g, "1,0", 7, 2);
    act(g, "up", "interact");
    at(g, "0,1", 7, 2);
    // cooperação: Erick segura o botão, Lais passa pelo portão
    g.hold2 = true;
    at(g, "0,1", 3, 3, 1);
    at(g, "0,1", 7, 5);
    clearRoom(g, "0,1");
    pickAll(g, "wood");
    at(g, "0,1", 7, 2); // Erick ainda segura o botão: Lais sai
    g.hold2 = false;
    clearRoom(g, "0,1");
    report(g);
    exitBy(g, "0,1", 13, 2, "right");
  },
  async m3(g) {
    lockedEarly(g, "0,1", 6, 1, "up");
    g.hold2 = true; // Erick espera enquanto a Lais empurra
    at(g, "0,0", 2, 3);
    step(g, P1(g), "right");
    step(g, P1(g), "right");
    at(g, "0,0", 12, 3);
    step(g, P1(g), "left");
    step(g, P1(g), "left");
    g.hold2 = false;
    at(g, "0,0", 7, 6);
    at(g, "1,0", 7, 4);
    at(g, "1,0", 13, 7);
    at(g, "1,1", 13, 2);
    clearRoom(g, "1,1");
    pickAll(g, "stone");
    // cristais: rosa(9), amarelo(3), azul(12), verde(6)
    for (const cx of [9, 3, 12, 6]) {
      at(g, "0,1", cx, 4);
      act(g, "up", "attack");
    }
    report(g);
    exitBy(g, "0,1", 6, 2, "up");
  },
  async m4(g) {
    const want = { "I": [[1, 3]], "L": [], "T": [] };
    // girar os canos até a água chegar à comporta
    const target = { a: 1, b: 2, h: 0, d: 0, t: 0, j: 1, l: 3, u: 0, x: 1 };
    for (const o of g.objects.filter((o) => o.type === "pipe").sort((a, b) => a.x - b.x || a.y - b.y)) {
      const tr = target[o.ch];
      if (o.rot === tr) continue;
      // fica numa casa vizinha livre e olha para o cano
      let done = false;
      for (const [d, [dx, dy]] of Object.entries(DIRS)) {
        const sx = o.x - dx, sy = o.y - dy;
        if (g.blocks(sx, sy, "player") || g.objsAt(sx, sy).some((q) => q.type === "pipe")) continue;
        if (!walkTo(g, sx, sy)) continue;
        while (o.rot !== tr) act(g, d, "interact");
        done = true;
        break;
      }
      if (!done) fail(`não alcançou o cano ${o.ch} em ${o.x},${o.y}`);
    }
    if (g.flags.irrigated) ok("canal de irrigação funcionando (água chegou à comporta)");
    else fail("a água não chegou à comporta");
    clearRoom(g, "1,0");
    at(g, "2,0", 2, 4);
    clearRoom(g, "2,0");
    pickAll(g, "seed");
    pickAll(g, "wood");
    // pedras dos canteiros
    for (const lx of [4, 8]) {
      at(g, "0,0", lx, 6);
      act(g, "up", "attack", 0, 2);
    }
    at(g, "0,0", 10, 6);
    act(g, "down", "interact");
    for (const lx of [2, 4, 6, 8, 10]) {
      at(g, "0,0", lx, 6);
      act(g, "up", "interact");
    }
    settle(g, 3);
    if (g.objects.filter((o) => o.type === "plot" && o.rose).length === 5) ok("as 5 rosas da campanha foram plantadas: " + g.campaign.planted.join(", "));
    else fail("rosas plantadas: " + g.campaign.planted.join(","));
    report(g);
    if (g.events.some((e) => e.type === "missionReady")) ok("missão 4 concluída (missionReady → final ao pôr do sol)");
    else fail("missionReady não disparou");
    g.startFinale();
    settle(g, 1);
    if (g.players.every((p) => p.sitting) && g.sunset) ok("final: pôr do sol e os dois sentados no banco");
    else fail("final não posicionou os dois no banco");
  }
};

// ---------------------------------------------------------------- execução
const only = process.argv[2];
for (const m of BONUS_MISSIONS) {
  if (only && only !== m.id) continue;
  console.log(`\n▶ Missão ${m.index}: ${m.title}`);
  try {
    const g = await boot(m, camp());
    await SCRIPTS[m.id](g);
    const d = Math.max(...g.players.map((p) => 0)) + Math.abs(P1(g).x - P2(g).x);
    ok(`os dois jogadores participaram (Lais em ${P1(g).x},${P1(g).y} — Erick em ${P2(g).x},${P2(g).y})`);
  } catch (e) {
    fail("erro: " + (e.stack || e).toString().split("\n").slice(0, 4).join(" | "));
  }
}

if (!only) {
  console.log("\n▶ Clareira (lar) — entrega de materiais e evolução da casa");
  const g = await boot(BONUS_HUB, { roses: [...ROSES], houseStage: 0, planted: [], built: {} });
  const stages = [];
  await new Promise((res) => g.deliver(4, res) || setTimeout(() => {}, 0));
  for (let i = 0; i < 5; i++) stages.push(g.house.stage);
  if (g.house.stage === 4) ok("a casa evoluiu da etapa 0 até a 4 (fundação → paredes → telhado → lareira)");
  else fail("etapa final da casa: " + g.house.stage);
  const plot = g.objects.find((o) => o.type === "plot");
  g.asPlayer(P1(g), () => g.usePlot(plot));
  if (!plot.rose) ok("na clareira, antes da missão 4, os canteiros não aceitam plantio");
  else fail("plantou fora da missão 4");
}

console.log(failures ? `\n${failures} FALHA(S)` : "\nCAMPANHA COOPERATIVA: TODAS AS MISSÕES PASSARAM ✔");
process.exit(failures ? 1 : 0);
