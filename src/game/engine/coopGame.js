// ============================================================================
// MODO COOPERATIVO LOCAL (2 jogadores no mesmo teclado)
// Estende o motor das fases (TileGame) sem alterá-lo:
//   - Lais (jogador 1) e Erick (jogador 2), cada um com entrada, vida,
//     colisão e animação próprias;
//   - câmera livre que enquadra os dois (e um "laço" que impede que se
//     afastem além da tela);
//   - inventário da equipe, objetivos de missão, chefes, baús, canos de
//     irrigação, canteiros de rosas, banco, cerca e a casa que evolui.
// ============================================================================

import { audio } from "../audioManager";
import { TileGame, ROOM_W, ROOM_H, VIEW_W, VIEW_H } from "./tileGame";
import { T, ROSES } from "./tileArt";
import { drawEnemyTile } from "./enemyArt";
import { drawWood, drawSpecialStone, drawSeed, drawMapItem, drawChest, drawPipe, drawSource, drawOutlet, drawPlot, drawRubble, drawBench, drawBenchFront, drawFence, drawBoard, drawHouse, PIPE_DIRS } from "./coopArt";
import { R } from "./pixel";

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: "down", down: "up", left: "right", right: "left" };
const NO_INPUT = { up: false, down: false, left: false, right: false };
const COOP_PICKUP = new Set(["wood", "stone", "seed", "map"]);
const SOLID_COOP = new Set(["chest", "rubble", "houseBlock", "board", "source", "outlet"]);
const BUILT_SOLID = new Set(["bench", "benchPart", "fence"]);
const LEASH_X = 13, LEASH_Y = 7;

export class CoopGame extends TileGame {
  constructor(canvas, phase, hooks, campaign) {
    super(canvas, phase, hooks);
    this.coop = true;
    this.campaign = campaign || { roses: [], houseStage: 0, planted: [], built: {} };
    const s2 = this.start2 || { x: this.start.x + 1, y: this.start.y };
    const lais = Object.assign(this.player, { id: 0, char: "lais", name: "Lais", input: { ...NO_INPUT } });
    const erick = {
      id: 1, char: "erick", name: "Erick", input: { ...NO_INPUT },
      x: s2.x, y: s2.y, px: s2.x * T, py: s2.y * T, dir: "down", move: null, hp: 4, maxHp: 4, invuln: 0, animT: 0, pose: null, poseT: 0, holdItem: null, lunge: 0
    };
    this.players = [lais, erick];
    this.inv = { ...this.inv, wood: 0, stone: 0, seed: 0, map: 0, keyFound: 0 };
    this.kills = 0;
    this.flags = {};
    this.bossDead = false;
    this.mission = phase.mission || null;
    this.house = phase.house ? { ...phase.house, stage: this.campaign.houseStage || 0, buildK: 1 } : null;
    this.water = new Set();
    const hb = this.objects.filter((o) => o.type === "houseBlock");
    if (hb.length) hb.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x) ? b : a)).anchor = true;
    for (const o of this.objects.filter((o) => o.type === "plot" && o.rubble && !(this.campaign.planted || [])[o.index])) {
      const rb = { type: "rubble", id: "rubble_" + o.id, x: o.x, y: o.y };
      this.initObject(rb);
      this.objects.push(rb);
    }
    this.objects.forEach((o) => {
      if (o.type === "plot") {
        const planted = (this.campaign.planted || [])[o.index];
        if (planted) Object.assign(o, { rose: planted, grow: 9 });
      }
      if (o.type === "pipe") o.rot = o.rot ?? 0;
      if (o.type === "rubble") o.hp = 2;
    });
    if (this.campaign.built?.bench) this.flags.bench = true;
    this.recomputeWater();
    this.cam = { x: 0, y: 0, slide: null };
    this.updateCamera(1);
    this.snapshot();
  }

  // ------------------------------------------------------------------ jogadores
  playerAt(x, y, except) {
    return this.players.find((p) => p !== except && !p.down && p.x === x && p.y === y) || null;
  }

  partnerOf(p) {
    return this.players.find((q) => q !== p);
  }

  nearestPlayer(x, y) {
    let best = null, bd = Infinity;
    for (const p of this.players) {
      if (p.down) continue;
      const d = Math.abs(p.x - x) + Math.abs(p.y - y);
      if (d < bd) (bd = d), (best = p);
    }
    return best;
  }

  asPlayer(pl, fn) {
    const prevRoom = this.room;
    if (pl) this.room = this.roomOf(pl.x, pl.y);
    try {
      return super.asPlayer(pl, fn);
    } finally {
      this.room = prevRoom;
    }
  }

  roomActive(key) {
    return this.players.some((p) => this.roomOf(p.x, p.y).key === key);
  }

  /** Executa uma ação de um jogador (0 = Lais, 1 = Erick). */
  act(i, action) {
    const p = this.players[i];
    if (!p || p.down || p.sitting) return;
    this.asPlayer(p, () => this[action]());
  }

  // ------------------------------------------------------------------ colisão
  blocks(x, y, who) {
    if (super.blocks(x, y, who)) return true;
    for (const o of this.objsAt(x, y)) {
      if (SOLID_COOP.has(o.type) || (BUILT_SOLID.has(o.type) && this.flags.bench)) return true;
      if (o.type === "enemy" && o.boss && o.alive) return true;
      if (who === "block" && (COOP_PICKUP.has(o.type) || o.type === "plot")) return true;
    }
    // os dois podem passar um pelo outro (evita que um tranque o outro num corredor)
    if (who === "block" || who === "enemy") return Boolean(this.playerAt(x, y));
    return false;
  }

  platePressed(p) {
    if (super.platePressed(p)) return true;
    return Boolean(p.player && this.playerAt(p.x, p.y));
  }

  gateOpen(gt) {
    if (gt.wasOpen && this.playerAt(gt.x, gt.y)) return true;
    return super.gateOpen(gt);
  }

  groupActive(gid) {
    if (gid === "IRR") return Boolean(this.flags.irrigated);
    return super.groupActive(gid);
  }

  // ------------------------------------------------------------------ movimento
  tryStep(dir) {
    const p = this.player;
    if (p.down || p.sitting) {
      if (p.sitting) p.sitting = false;
      return false;
    }
    const [dx, dy] = DIRS[dir];
    const q = this.partnerOf(p);
    if (q && !q.down) {
      const nx = p.x + dx, ny = p.y + dy;
      if (Math.abs(nx - q.x) > LEASH_X || Math.abs(ny - q.y) > LEASH_Y) {
        p.dir = dir;
        if (!this.leashWarn || this.time - this.leashWarn > 3) {
          this.leashWarn = this.time;
          this.hooks.onEvent({ type: "toast", text: `${p.name}: "Espera por mim, ${q.name}!" (fiquem juntos na tela)` });
        }
        return false;
      }
    }
    return super.tryStep(dir);
  }

  arrive() {
    const p = this.player;
    const room = this.roomOf(p.x, p.y);
    if (!this.visited.has(room.key)) {
      this.visited.add(room.key);
      if (Math.random() < 0.35) setTimeout(() => this.quip("room"), 500);
      this.emitHud();
    }
    for (const o of this.objsAt(p.x, p.y)) {
      if (o.type === "plate") {
        audio.playSfx("switch");
        this.checkGroupFeedback(o.group);
      }
      if (["key", "rose", "smallKey", "diamond", "heart", ...COOP_PICKUP].includes(o.type) && !o.gone) {
        o.gone = true;
        this.collect(o);
      }
    }
  }

  collect(o) {
    const cx = o.x * T + 16, cy = o.y * T + 12;
    const name = this.player.name;
    if (o.type === "wood") {
      this.inv.wood += o.amount || 1;
      if (o.pile) this.inv.piles = (this.inv.piles || 0) + 1;
      audio.playSfx("treasure");
      this.burst(cx, cy, "#e0b878", 18);
      this.floaters.push({ x: cx, y: cy - 10, text: `+${o.amount || 1} madeira`, t: 0 });
    } else if (o.type === "stone") {
      this.inv.stone++;
      audio.playSfx("key");
      this.burst(cx, cy, "#ffd36a", 24);
      this.floaters.push({ x: cx, y: cy - 10, text: "+1 pedra especial", t: 0 });
      this.hooks.onEvent({ type: "toast", text: `${name} encontrou uma pedra especial!` });
    } else if (o.type === "seed") {
      this.inv.seed++;
      audio.playSfx("heal");
      this.burst(cx, cy, "#a0ff9a", 18);
      this.floaters.push({ x: cx, y: cy - 10, text: "+1 semente", t: 0 });
    } else if (o.type === "map") {
      this.inv.map = 1;
      audio.playSfx("rose");
      this.player.holdItem = { kind: "key", t: 0, dur: 1.2 };
      this.hooks.onEvent({ type: "toast", text: "Mapa da construção recuperado!" });
    } else if (o.type === "smallKey") {
      this.inv.keyFound++;
      super.collect(o);
    } else super.collect(o);
    this.emitHud();
  }

  tryExit(exit) {
    if (this.missionDone()) {
      if (this.exiting) return false;
      this.exiting = { t: 0, exit };
      audio.playSfx("door");
      audio.playSfx("treasure");
      return false;
    }
    if (!exit.warned || this.time - exit.warned > 2.5) {
      exit.warned = this.time;
      audio.playSfx("bump");
      const left = this.objectiveList().filter((o) => !o.done && !o.optional).map((o) => o.label);
      this.hooks.onEvent({ type: "toast", text: `Ainda falta: ${left.join(", ")}.` });
      this.quip("door", true);
    }
    return false;
  }

  // ------------------------------------------------------------------ interação
  interact() {
    if (this.busy()) return;
    const f = this.frontTile();
    for (const o of this.objsAt(f.x, f.y)) {
      if (o.type === "chest" && !o.open) return this.openChest(o);
      if (o.type === "pipe" && !o.fixed) return this.rotatePipe(o);
      if (o.type === "plot") return this.usePlot(o);
      if (o.type === "bench" || o.type === "benchPart") {
        const bench = this.objects.find((b) => b.type === "bench");
        return this.flags.bench ? this.sitOnBench(bench) : this.buildBench(bench);
      }
      if (o.type === "board") return this.hooks.onEvent({ type: "board" });
      if (o.type === "houseBlock" && this.house) return this.hooks.onEvent({ type: "dialogue", lines: this.phase.houseLines || [] });
    }
    return super.interact();
  }

  attack() {
    super.attack();
    const f = this.frontTile();
    for (const o of this.objsAt(f.x, f.y)) {
      if (o.type === "rubble" && !o.gone) {
        o.hp--;
        audio.playSfx("break");
        this.burst(o.x * T + 16, o.y * T + 14, "#a8a090", 14);
        this.shake = 0.1;
        if (o.hp <= 0) {
          o.gone = true;
          this.inv.rubble = (this.inv.rubble || 0) + 1;
          this.quip("secret");
          this.emitHud();
        }
      }
    }
  }

  openChest(o) {
    if (o.locked) {
      if (this.inv.smallKeys <= 0) {
        audio.playSfx("bump");
        this.hooks.onEvent({ type: "toast", text: "O baú está trancado. Precisa de uma chave." });
        this.quip("locked", true);
        return;
      }
      this.inv.smallKeys--;
    }
    o.open = true;
    this.flags[o.flag || "chest"] = true;
    audio.playSfx("treasure");
    this.burst(o.x * T + 16, o.y * T + 8, "#ffd36a", 30);
    const gives = o.gives || { wood: 2 };
    Object.entries(gives).forEach(([k, n]) => (this.inv[k] = (this.inv[k] || 0) + n));
    this.floaters.push({ x: o.x * T + 16, y: o.y * T - 6, text: Object.entries(gives).map(([k, n]) => `+${n} ${k === "wood" ? "madeira" : k === "seed" ? "semente" : k}`).join(" "), t: 0 });
    this.hooks.onEvent({ type: "toast", text: o.message || "Baú aberto!" });
    this.emitHud();
  }

  rotatePipe(o) {
    o.rot = (o.rot + 1) % 4;
    audio.playSfx("switch");
    const before = this.flags.irrigated;
    this.recomputeWater();
    if (this.flags.irrigated && !before) {
      audio.playSfx("rose");
      this.hooks.onEvent({ type: "toast", text: "A água chegou! Os canteiros estão irrigados." });
      this.quip("open", true);
    }
    this.emitHud();
  }

  /** Segue a água a partir da nascente pelos canos conectados. */
  recomputeWater() {
    this.water = new Set();
    const src = this.objects.find((o) => o.type === "source");
    if (!src) return;
    const conns = (o) => (o.type === "pipe" ? PIPE_DIRS[o.shape][o.rot % 4] : o.type === "outlet" || o.type === "source" ? [o.dir] : []);
    const q = [src];
    const seen = new Set([src.id]);
    this.water.add(src.x + "," + src.y);
    while (q.length) {
      const cur = q.shift();
      for (const d of conns(cur)) {
        const [dx, dy] = DIRS[d];
        const nb = this.objsAt(cur.x + dx, cur.y + dy).find((o) => o.type === "pipe" || o.type === "outlet");
        if (!nb || seen.has(nb.id) || !conns(nb).includes(OPP[d])) continue;
        seen.add(nb.id);
        this.water.add(nb.x + "," + nb.y);
        if (nb.type === "outlet") this.flags.irrigated = true;
        q.push(nb);
      }
    }
  }

  usePlot(o) {
    if (!this.mission?.plant && !o.rose) return this.hooks.onEvent({ type: "toast", text: "Um canteiro vazio... um dia ele vai ter rosas." });
    if (o.rose) {
      const info = ROSES[o.rose];
      return this.hooks.onEvent({ type: "toast", text: `${info ? info.name : "Rosa"} — florescendo no nosso jardim ♥` });
    }
    if (this.objsAt(o.x, o.y).some((r) => r.type === "rubble" && !r.gone)) return this.hooks.onEvent({ type: "toast", text: "Tem pedra em cima do canteiro. Quebre com a espada!" });
    const missing = this.mission?.plantNeeds ? this.objectiveList().filter((ob) => this.mission.plantNeeds.includes(ob.id) && !ob.done).map((ob) => ob.label) : [];
    if (missing.length) return this.hooks.onEvent({ type: "toast", text: `Antes de plantar: ${missing.join(", ")}.` });
    const next = (this.campaign.roses || []).find((r) => !(this.campaign.planted || []).includes(r));
    if (!next) return this.hooks.onEvent({ type: "toast", text: "Todas as rosas já foram plantadas." });
    o.rose = next;
    o.grow = 0;
    this.campaign.planted = [...(this.campaign.planted || [])];
    this.campaign.planted[o.index] = next;
    audio.playSfx("rose");
    for (let i = 0; i < 24; i++) this.particles.push({ x: o.x * T + 16, y: o.y * T + 10, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 60, life: 1, max: 1, color: i % 2 ? "#ff8aa8" : "#9ad06a", petal: true });
    this.hooks.onEvent({ type: "planted", rose: next, count: this.campaign.planted.filter(Boolean).length });
    this.emitHud();
  }

  buildBench() {
    if ((this.inv.wood || 0) < (this.mission?.benchWood || 2)) {
      audio.playSfx("bump");
      return this.hooks.onEvent({ type: "toast", text: `Precisamos de ${this.mission?.benchWood || 2} madeiras para a cerca e o banco.` });
    }
    this.flags.bench = true;
    this.campaign.built = { ...(this.campaign.built || {}), bench: true };
    audio.playSfx("push");
    audio.playSfx("treasure");
    for (const o of this.objects.filter((b) => b.type === "bench" || b.type === "fence")) this.burst(o.x * T + 16, o.y * T + 18, "#d8c8b0", 10);
    this.hooks.onEvent({ type: "toast", text: "Cerca e banco construídos!" });
    this.emitHud();
  }

  sitOnBench(o) {
    const seats = [{ x: o.x, y: o.y }, { x: o.x + 1, y: o.y }];
    const p = this.player;
    const seat = seats.find((s) => !this.playerAt(s.x, s.y, p)) || seats[0];
    p.x = seat.x;
    p.y = seat.y;
    p.px = p.x * T;
    p.py = p.y * T;
    p.dir = "down";
    p.sitting = true;
  }

  // ------------------------------------------------------------------ dano e chefes
  damage(src) {
    const p = this.player;
    if (p.invuln > 0 || this.godMode || p.down) return;
    p.hp--;
    p.invuln = 1.2;
    audio.playSfx("hurt");
    this.freeze = 0.06;
    this.burst(p.px + 16, p.py + 8, "#ff5a76", 12);
    this.shake = 0.2;
    this.quip("hurt", true);
    if (p.hp <= 0) {
      p.down = 3.5;
      p.move = null;
      this.hooks.onEvent({ type: "toast", text: `${p.name} caiu! Volta em 3 segundos...` });
      if (this.players.every((q) => q.down)) {
        this.hooks.onEvent({ type: "toast", text: "Os dois caíram! Recomeçando a sala..." });
        this.players.forEach((q) => (q.down = 1.5));
      }
    }
    this.emitHud();
  }

  hitEnemy(en, n) {
    const wasAlive = en.alive;
    super.hitEnemy(en, n);
    if (wasAlive && !en.alive) {
      if (en.boss) {
        this.bossDead = true;
        this.shake = 0.4;
        if (en.drops) {
          const d = { type: en.drops, id: "drop_" + en.id, x: en.x, y: en.y };
          this.initObject(d);
          this.objects = this.objects.filter((o) => !(o.type === "heart" && o.x === en.x && o.y === en.y));
          this.objects.push(d);
        }
        this.hooks.onEvent({ type: "toast", text: en.defeatText || "O monstrão foi derrotado!" });
      } else this.kills++;
      this.emitHud();
    }
  }

  // ------------------------------------------------------------------ missão
  objectiveList() {
    if (!this.mission) return [];
    return this.mission.objectives.map((ob) => {
      let cur = 0, target = ob.target || 1, done = false;
      if (ob.kind === "kills") cur = this.kills;
      else if (ob.kind === "count") cur = this.inv[ob.item] || 0;
      else if (ob.kind === "flag") cur = this.flags[ob.flag] ? 1 : 0;
      else if (ob.kind === "group") cur = this.groupActive(ob.group) ? 1 : 0;
      else if (ob.kind === "boss") cur = this.bossDead ? 1 : 0;
      else if (ob.kind === "planted") {
        cur = (this.campaign.planted || []).filter(Boolean).length;
        target = Math.max(1, Math.min(ob.target, (this.campaign.roses || []).length));
      }
      else if (ob.kind === "turrets") cur = this.blockedTurrets();
      done = cur >= target;
      let text;
      if (ob.states) text = `${ob.label}: ${done ? ob.states[1] : ob.states[0]}`;
      else if (target > 1) text = `${ob.label}: ${Math.min(cur, target)}/${target}`;
      else text = ob.label;
      return { id: ob.id, label: ob.label, text, done, optional: ob.optional };
    });
  }

  blockedTurrets() {
    return this.objects.filter((o) => o.type === "turret" && this.objects.some((b) => (b.type === "boulder" || b.type === "crate") && !b.gone && b.x === o.x && b.y > o.y && b.y - o.y <= 4)).length;
  }

  missionDone() {
    return this.objectiveList().every((o) => o.done || o.optional);
  }

  emitHud() {
    if (!this.players) return super.emitHud();
    this.hooks.onHud({
      coop: true,
      players: this.players.map((p) => ({ name: p.name, char: p.char, hp: Math.max(0, p.hp), maxHp: p.maxHp, down: Boolean(p.down) })),
      inv: { ...this.inv, kills: this.kills },
      objectives: this.objectiveList(),
      done: this.missionDone(),
      rooms: this.visited.size,
      totalRooms: this.totalRooms
    });
  }

  /** Reinicia os objetos móveis da sala de um jogador (pedras, alavancas...). */
  resetRoomPuzzle(i = 0) {
    const p = this.players[i];
    const key = this.roomOf(p.x, p.y).key;
    const inRoom = (o) => this.roomOf(o.x, o.y).key === key;
    const init = this.initialObjects.filter(inRoom);
    for (const o of this.objects.filter(inRoom)) {
      if (!["boulder", "crate", "lever", "plate", "target", "crystal", "flowerSwitch", "pipe"].includes(o.type)) continue;
      const orig = init.find((x) => x.id === o.id);
      if (!orig) continue;
      if (o.type === "boulder" || o.type === "crate") {
        if (this.playerAt(orig.x, orig.y)) continue;
        Object.assign(o, { x: orig.x, y: orig.y, px: orig.x * T, py: orig.y * T, gone: false, move: null });
      } else if (o.type === "lever") o.on = Boolean(o.startOn);
      else if (o.type === "pipe") o.rot = orig.rot;
      else o.lit = false;
    }
    for (const k of [...this.filled]) {
      const [x, y] = k.split(",").map(Number);
      if (this.roomOf(x, y).key === key) this.filled.delete(k);
    }
    Object.values(this.groups).forEach((g) => {
      if (g.mode === "sequence" && !g.done) g.progress = 0;
    });
    this.recomputeWater();
    this.fade = 0.5;
    this.hooks.onEvent({ type: "toast", text: "Puzzle da sala reiniciado." });
  }

  restoreRoom(msg) {
    this.resetRoomPuzzle(0);
  }

  snapshot() {
    if (!this.initialObjects) this.initialObjects = JSON.parse(JSON.stringify(this.objects.map(({ move, ...o }) => o)));
  }

  // ------------------------------------------------------------------ loop
  updateCamera(k) {
    const live = this.players.filter((p) => !p.down);
    const ps = live.length ? live : this.players;
    const mx = ps.reduce((s, p) => s + p.px, 0) / ps.length + 16;
    const my = ps.reduce((s, p) => s + p.py, 0) / ps.length + 16;
    const tx = Math.max(0, Math.min(this.W * T - VIEW_W, mx - VIEW_W / 2));
    const ty = Math.max(0, Math.min(this.H * T - VIEW_H, my - VIEW_H / 2));
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  update(dt) {
    this.time += dt;
    if (this.fade > 0) this.fade -= dt;
    if (this.shake > 0) this.shake -= dt;
    this.updateParticles(dt);
    if (this.bubble) {
      this.bubble.t += dt;
      if (this.bubble.t > this.bubble.dur) this.bubble = null;
    }
    if (this.emote) {
      this.emote.t += dt;
      if (this.emote.t > 1.6) this.emote = null;
    }
    this.player = this.players[0];
    this.updateFairy(dt);
    this.updateCamera(Math.min(1, dt * 6));
    if (this.house && this.house.buildK < 1) this.house.buildK = Math.min(1, this.house.buildK + dt / 1.6);
    for (const o of this.objects) if (o.type === "plot" && o.rose && o.grow < 9) o.grow += dt / 1.6;
    if (!this.ready || this.paused || this.cutscene) return;
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    if (!this.saidStart && this.time > 1.5) {
      this.saidStart = true;
      if (this.phase.startQuip) this.bubble = { text: this.phase.startQuip, t: 0, dur: 3.2, p: this.players[1] };
    }

    if (this.exiting) {
      this.exiting.t += dt;
      for (const p of this.players) this.asPlayer(p, () => this.tweenPlayer(dt));
      if (this.exiting.t > 1.8 && !this.exiting.done) {
        this.exiting.done = true;
        this.hooks.onEvent({ type: "phaseComplete" });
      }
      return;
    }

    for (const p of this.players) {
      this.player = p;
      this.room = this.roomOf(p.x, p.y);
      this.input = p.input;
      p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
      p.shootCd = Math.max(0, (p.shootCd || 0) - dt);
      p.lunge = Math.max(0, p.lunge - dt);
      if (p.down) {
        p.down -= dt;
        if (p.down <= 0) {
          p.down = 0;
          p.hp = Math.max(2, Math.ceil(p.maxHp / 2));
          p.invuln = 2;
          const q = this.partnerOf(p);
          if (q && !q.down && this.blocks(p.x, p.y, "player")) {
            const spot = Object.values(DIRS).map(([dx, dy]) => ({ x: q.x + dx, y: q.y + dy })).find((s) => !this.blocks(s.x, s.y, "player"));
            if (spot) Object.assign(p, spot, { px: spot.x * T, py: spot.y * T });
          }
          this.emitHud();
        }
        continue;
      }
      if (p.holdItem) {
        p.holdItem.t += dt;
        if (p.holdItem.t > p.holdItem.dur) {
          const it = p.holdItem;
          p.holdItem = null;
          if (it.after) it.after();
        }
        continue;
      }
      p.invuln = Math.max(0, p.invuln - dt);
      this.tweenPlayer(dt);
      if (!p.move) {
        const dir = p.input.up ? "up" : p.input.down ? "down" : p.input.left ? "left" : p.input.right ? "right" : null;
        if (dir) this.tryStep(dir);
        else p.pose = null;
      }
      this.updatePlayerTraps(p);
    }
    this.player = this.players[0];
    this.input = this.players[0].input;
    this.tweenObjects(dt);
    this.updateTurrets(dt);
    this.updateCoopEnemies(dt);
    this.updateCoopProjectiles(dt);
    this.updateGatesFeedback();
    if (this.mission && !this.announcedDone && this.missionDone()) {
      this.announcedDone = true;
      audio.playSfx("rose");
      this.hooks.onEvent({ type: "missionReady" });
    }
  }

  updatePlayerTraps(p) {
    for (const o of this.objsAt(p.x, p.y)) {
      if (o.type === "spikes" && !p.move && this.spikeUp(o)) this.damage(o);
      if (o.type === "tide" && !p.move && this.tideLevel(o) > 0.85) this.damage(o);
    }
  }

  updateTurrets(dt) {
    for (const o of this.objects) {
      if (o.type !== "turret") continue;
      o.timer += dt;
      if (o.timer >= (o.period || 2)) {
        o.timer = 0;
        if (this.roomActive(this.roomOf(o.x, o.y).key)) {
          const [dx, dy] = DIRS[o.dir || "down"];
          this.projectiles.push({ kind: "fire", x: o.x, y: o.y, fx: o.x * T + 16, fy: o.y * T + 16, dx, dy, t: 0, speed: o.speed || 5, life: 4, color: o.color || "#ff7a1a" });
          audio.playSfx("fire");
        }
      }
    }
  }

  updateCoopEnemies(dt) {
    for (const en of this.objects) {
      if (en.type !== "enemy" || !en.alive) continue;
      en.hurtT = Math.max(0, en.hurtT - dt);
      if (en.move) {
        en.move.t += dt / en.move.dur;
        const k = Math.min(1, en.move.t);
        en.px = (en.move.fx + (en.x - en.move.fx) * k) * T;
        en.py = (en.move.fy + (en.y - en.move.fy) * k) * T;
        if (k >= 1) en.move = null;
      }
      const key = this.roomOf(en.x, en.y).key;
      if (!this.roomActive(key)) continue;
      const p = this.nearestPlayer(en.x, en.y);
      if (!p) continue;
      this.player = p;
      const touching = this.players.find((q) => !q.down && q.x === en.x && q.y === en.y);
      if (touching) this.asPlayer(touching, () => this.damage(en));
      if (en.boss) this.bossAttack(en, dt, p);
      if (en.move) continue;
      en.moveT -= dt;
      if (en.moveT > 0) continue;
      en.moveT = en.speed || 0.6;
      let dir = null;
      const inRoom = (x, y) => this.roomOf(x, y).key === key;
      if (en.ai === "chase" && Math.abs(p.x - en.x) + Math.abs(p.y - en.y) <= (en.sight || 7)) {
        const dx = p.x - en.x, dy = p.y - en.y;
        const prim = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        const sec = Math.abs(dx) >= Math.abs(dy) ? (dy > 0 ? "down" : dy < 0 ? "up" : null) : dx > 0 ? "right" : dx < 0 ? "left" : null;
        for (const d of [prim, sec]) {
          if (!d) continue;
          const [ddx, ddy] = DIRS[d];
          const victim = this.playerAt(en.x + ddx, en.y + ddy);
          if (victim) {
            this.asPlayer(victim, () => this.damage(en));
            break;
          }
          if (!this.blocks(en.x + ddx, en.y + ddy, "enemy") && inRoom(en.x + ddx, en.y + ddy)) {
            dir = d;
            break;
          }
        }
      } else if (en.ai === "patrol") {
        const [ddx, ddy] = DIRS[en.dir];
        const victim = this.playerAt(en.x + ddx, en.y + ddy);
        if (victim) this.asPlayer(victim, () => this.damage(en));
        else if (this.blocks(en.x + ddx, en.y + ddy, "enemy") || !inRoom(en.x + ddx, en.y + ddy)) en.dir = OPP[en.dir];
        else dir = en.dir;
      } else {
        const opts = Object.keys(DIRS).filter((d) => {
          const [ddx, ddy] = DIRS[d];
          return !this.blocks(en.x + ddx, en.y + ddy, "enemy") && Math.abs(en.x + ddx - en.homeX) <= 3 && Math.abs(en.y + ddy - en.homeY) <= 3 && inRoom(en.x + ddx, en.y + ddy);
        });
        if (opts.length && this.rand() < 0.7) dir = opts[Math.floor(this.rand() * opts.length)];
      }
      if (dir) {
        const [ddx, ddy] = DIRS[dir];
        en.dir = dir;
        en.move = { fx: en.x, fy: en.y, tx: en.x + ddx, ty: en.y + ddy, t: 0, dur: Math.min(0.3, (en.speed || 0.6) * 0.6) };
        en.x += ddx;
        en.y += ddy;
      }
    }
    this.player = this.players[0];
  }

  /** Chefe: anda devagar e, de tempos em tempos, solta ondas em cruz (fuja das linhas!). */
  bossAttack(en, dt, p) {
    en.atkT = (en.atkT ?? 2) - dt;
    if (en.atkT > 0.7) return;
    en.warn = true;
    if (en.atkT > 0) return;
    en.warn = false;
    en.atkT = en.every || 3;
    for (const d of Object.values(DIRS)) this.projectiles.push({ kind: "fire", x: en.x, y: en.y, fx: en.x * T + 16, fy: en.y * T + 16, dx: d[0], dy: d[1], t: 0, speed: 4.5, life: 4, color: en.color || "#c58aff" });
    audio.playSfx("fire");
    this.shake = 0.15;
  }

  updateCoopProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.t += dt * pr.speed;
      pr.life -= dt;
      while (pr.t >= 1 && pr.life > 0) {
        pr.t -= 1;
        const nx = pr.x + pr.dx, ny = pr.y + pr.dy;
        if (pr.kind === "arrow") {
          const en = this.enemyAt(nx, ny);
          if (en) {
            this.hitEnemy(en, 1);
            pr.life = 0;
            break;
          }
          const trig = this.objsAt(nx, ny).find((o) => ["target", "crystal", "lever", "flowerSwitch"].includes(o.type));
          if (trig) {
            if (trig.type === "lever") this.toggleLever(trig);
            else if (trig.hitBy !== "sword") this.activate(trig);
            pr.life = 0;
            break;
          }
          if (this.blocks(nx, ny, "arrow") && !this.playerAt(nx, ny)) {
            this.burst(pr.fx + pr.dx * 16, pr.fy + pr.dy * 16, "#c9a070", 4);
            audio.playSfx("thunk");
            pr.life = 0;
            break;
          }
        } else {
          const victim = this.playerAt(nx, ny);
          if (victim) {
            this.asPlayer(victim, () => this.damage(pr));
            pr.life = 0;
            break;
          }
          const solid = this.objsAt(nx, ny).some((o) => (o.type === "boulder" || o.type === "crate") && !o.gone);
          if ((this.blocks(nx, ny, "arrow") || solid) && this.terrainAt(nx, ny) !== "v" && !this.objsAt(nx, ny).some((o) => o.type === "enemy" && o.boss)) {
            this.burst(nx * T + 16 - pr.dx * 16, ny * T + 16 - pr.dy * 16, pr.color, 6);
            pr.life = 0;
            break;
          }
        }
        pr.x = nx;
        pr.y = ny;
      }
      pr.fx = (pr.x + pr.dx * pr.t) * T + 16;
      pr.fy = (pr.y + pr.dy * pr.t) * T + (pr.kind === "arrow" ? 14 : 16);
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0);
    this.slashes.forEach((s) => (s.t += dt));
    this.slashes = this.slashes.filter((s) => s.t < s.dur);
  }

  /** Final da campanha: pôr do sol, os dois sentam no banco. */
  startFinale() {
    this.sunset = true;
    this.flags.bench = true;
    const bench = this.objects.find((o) => o.type === "bench");
    this.players.forEach((p, i) => {
      p.down = 0;
      p.move = null;
      if (bench) Object.assign(p, { x: bench.x + i, y: bench.y, px: (bench.x + i) * T, py: bench.y * T, dir: "down", sitting: true });
    });
    this.projectiles = [];
  }

  /** Entrega de materiais: a casa evolui uma etapa de cada vez. */
  deliver(toStage, onDone) {
    if (!this.house) return onDone && onDone();
    const steps = [];
    for (let s = this.house.stage + 1; s <= toStage; s++) steps.push(s);
    let i = 0;
    const next = () => {
      if (i >= steps.length) return onDone && onDone();
      this.house.stage = steps[i++];
      this.house.buildK = 0;
      audio.playSfx("push");
      setTimeout(() => audio.playSfx("break"), 400);
      setTimeout(() => audio.playSfx("treasure"), 1400);
      setTimeout(next, 1900);
    };
    next();
  }

  // ------------------------------------------------------------------ desenho
  render() {
    const sun = this.sunset;
    if (sun) this.theme = { ...this.theme, tint: "rgba(255, 140, 80, 0.22)" };
    super.render();
  }

  drawObject(g, o, t) {
    const x = o.x * T, y = o.y * T, cx = x + 16, by = y + 30;
    switch (o.type) {
      case "wood":
        return drawWood(g, cx, by, t);
      case "stone":
        return drawSpecialStone(g, cx, by, t);
      case "seed":
        return drawSeed(g, cx, by, t);
      case "map":
        return drawMapItem(g, cx, by, t);
      case "chest":
        return drawChest(g, cx, by, o.open, o.locked, t);
      case "pipe":
        return drawPipe(g, x, y, o.shape, o.rot, this.water.has(o.x + "," + o.y), t, o.fixed);
      case "source":
        return drawSource(g, x, y, o.dir, t);
      case "outlet":
        return drawOutlet(g, x, y, o.dir, this.water.has(o.x + "," + o.y), t);
      case "plot": {
        const rub = this.objsAt(o.x, o.y).find((r) => r.type === "rubble" && !r.gone);
        return drawPlot(g, x, y, this.flags.irrigated || this.phase.alwaysWatered, o.rose, o.grow || 0, t, rub ? rub.hp : 0);
      }
      case "rubble":
        if (this.objsAt(o.x, o.y).some((p) => p.type === "plot")) return;
        return drawRubble(g, cx, by, o.hp, t);
      case "bench":
        if (!this.flags.bench) {
          // marcação no chão de onde o banco vai ficar
          g.globalAlpha = 0.55 + Math.sin(t * 3) * 0.15;
          R(g, x + 4, y + 18, 56, 10, "#6b4226");
          R(g, x + 6, y + 20, 52, 2, "#a8743f");
          g.globalAlpha = 1;
          return;
        }
        return drawBench(g, cx + 16, by, this.sunset);
      case "fence":
        if (!this.flags.bench) return;
        return drawFence(g, x, y);
      case "benchPart":
        return;
      case "benchSpot":
        if (this.flags.bench) return;
        R(g, x + 4, y + 18, 24, 10, "#6b4226");
        R(g, x + 6, y + 16, 20, 3, "#a8743f");
        R(g, x + 8, y + 12, 16, 3, "#8a5a34");
        return;
      case "board":
        return drawBoard(g, cx, by, t, true);
      case "houseBlock":
        if (o.anchor && this.house) drawHouse(g, x, y, this.house.stage, t, this.sunset, this.house.buildK);
        return;
      case "enemy":
        if (o.boss) {
          g.save();
          g.translate(cx, by - 1);
          g.scale(1.7, 1.7);
          drawEnemyTile(g, { ...o }, t, 0, 0);
          g.restore();
          if (o.warn && Math.floor(t * 12) % 2) {
            g.globalAlpha = 0.35;
            g.fillStyle = o.color || "#c58aff";
            g.fillRect(x - 4 * T, y + 12, 9 * T, 8);
            g.fillRect(x + 12, y - 4 * T, 8, 9 * T);
            g.globalAlpha = 1;
          }
          if (o.hp < o.maxHp) {
            R(g, cx - 18, by - 56, 36, 4, "#1a0e18");
            R(g, cx - 17, by - 55, (34 * o.hp) / o.maxHp, 2, "#ff5a76");
          }
          return;
        }
        return super.drawObject(g, o, t);
      default:
        return super.drawObject(g, o, t);
    }
  }

  drawPlayer(g, t) {
    const p = this.player;
    if (p.down) {
      g.globalAlpha = 0.45;
      super.drawPlayer(g, t);
      g.globalAlpha = 1;
      R(g, p.px + 22, p.py - 30 - (t * 10) % 8, 4, 1, "#ffffff");
      g.fillStyle = "#ffffff";
      g.font = "bold 7px monospace";
      g.textAlign = "center";
      g.fillText(Math.ceil(p.down) + "", p.px + 16, p.py - 24);
      return;
    }
    super.drawPlayer(g, t);
    // etiqueta com o nome (ajuda a saber quem é quem)
    g.font = "7px 'Pixelify Sans', monospace";
    g.textAlign = "center";
    const label = p.id === 0 ? "P1" : "P2";
    g.fillStyle = "rgba(20,10,24,0.7)";
    g.fillRect(p.px + 9, p.py + 32, 14, 8);
    g.fillStyle = p.id === 0 ? "#ff8aa8" : "#7ad8ff";
    g.fillText(label, p.px + 16, p.py + 39);
    if (p.sitting) {
      const bench = this.objects.find((o) => o.type === "bench");
      if (bench) drawBenchFront(g, bench.x * T + 32, bench.y * T + 30);
    }
  }
}

export { ROOM_W, ROOM_H };
