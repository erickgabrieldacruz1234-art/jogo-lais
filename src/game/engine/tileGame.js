// ============================================================================
// MOTOR DAS FASES (estilo Diamond Rush)
// Grade de tiles de 32, salas de 15x9 tiles, câmera que desliza entre salas.
//
// Hooks para a interface React:
//   onHud(state)   -> nome da fase, rosa/chave, vidas, chaves pequenas...
//   onEvent(ev)    -> { type: "toast"|"dialogue"|"rose"|"key"|"phaseComplete" }
// ============================================================================

import { audio } from "../audioManager";
import { CHARACTERS, drawCharacter } from "../data/characters";
import { THEMES, T, renderTerrain, paintFloor, decoFor, drawRose, drawKey, drawDiamond, drawHeart } from "./tileArt";
import { drawEnemy, drawGlyph, glow } from "./actors";
import { drawEnemyTile } from "./enemyArt";
import { QUIPS, LUMI } from "../data/quips";
import { PROPS, propSprite } from "./props";
import { R, E, L, makeCanvas, rng } from "./pixel";

export const ROOM_W = 15;
export const ROOM_H = 9;
export const VIEW_W = ROOM_W * T; // 480
export const VIEW_H = ROOM_H * T; // 288
const SCALE = 2;
const STEP_TIME = 0.15;
const PUSH_TIME = 0.22;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const DEFAULT_LEGEND = {
  P: { type: "start" },
  O: { type: "boulder" },
  B: { type: "crate" },
  K: { type: "key" },
  R: { type: "rose" },
  k: { type: "smallKey" },
  $: { type: "diamond" },
  "+": { type: "heart" },
  D: { type: "exit" },
  d: { type: "lock" },
  "^": { type: "spikes", offset: 0 },
  T: { type: "deco" },
  i: { type: "lamp" },
  v: { type: "turret", dir: "down" },
  M: { type: "altar" },
  Q: { type: "start2" },
  _: { type: "plate", group: "P3", glyph: 3 },
  "|": { type: "gate", group: "P3", glyph: 3 }
};

const PUSHABLE = new Set(["boulder", "crate"]);
const PICKUP = new Set(["key", "rose", "smallKey", "diamond", "heart"]);
const TRIGGER = new Set(["plate", "lever", "target", "crystal", "flowerSwitch"]);

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/** Monta a grade da fase a partir das salas em texto. */
export function parsePhase(phase) {
  const W = phase.roomsW * ROOM_W, H = phase.roomsH * ROOM_H;
  const grid = Array.from({ length: H }, () => Array(W).fill(" "));
  const objects = [];
  const legend = { ...DEFAULT_LEGEND, ...(phase.legend || {}) };
  let start = null, n = 0;
  for (const [key, rows] of Object.entries(phase.rooms)) {
    const [rx, ry] = key.split(",").map(Number);
    rows.forEach((row, ly) => {
      if (row.length !== ROOM_W) throw new Error(`Sala ${key} linha ${ly} tem ${row.length} colunas (esperado ${ROOM_W}): "${row}"`);
      for (let lx = 0; lx < ROOM_W; lx++) {
        const ch = row[lx];
        const x = rx * ROOM_W + lx, y = ry * ROOM_H + ly;
        if ("#.,~%=W ".includes(ch)) {
          grid[y][x] = ch;
          continue;
        }
        const def = legend[ch];
        if (!def) throw new Error(`Caractere desconhecido '${ch}' na sala ${key}`);
        grid[y][x] = def.on || (def.type === "exit" || def.type === "turret" ? "#" : def.type === "tide" ? "," : ".");
        if (def.type === "start") {
          start = { x, y };
          continue;
        }
        if (def.type === "start2") {
          objects.start2 = { x, y };
          continue;
        }
        objects.push({ ...def, id: `${def.type}_${n++}`, x, y, ch });
      }
    });
    if (rows.length !== ROOM_H) throw new Error(`Sala ${key} tem ${rows.length} linhas (esperado ${ROOM_H})`);
  }
  return { W, H, grid, objects, start, start2: objects.start2 || null };
}

export class TileGame {
  constructor(canvas, phase, hooks) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    this.phase = phase;
    this.hooks = { onHud: () => {}, onEvent: () => {}, ...hooks };
    this.theme = THEMES[phase.theme];
    const parsed = parsePhase(phase);
    Object.assign(this, parsed);
    this.level = { ...parsed, theme: phase.theme };
    this.objects.forEach((o) => this.initObject(o));
    this.groups = {};
    for (const [gid, def] of Object.entries(phase.groups || {})) this.groups[gid] = { mode: "all", ...def, progress: 0, done: false };
    this.objects.forEach((o) => {
      if (o.group && !this.groups[o.group]) this.groups[o.group] = { mode: "all", progress: 0, done: false };
    });
    if (this.groups.P3 && !this.groups.P3.message) this.groups.P3.message = "As três pedras estão nos três botões — o portão da porta se abriu!";
    this.hintSeen = { push: 0, bow: 0, sword: 0 };
    this.bubble = null;
    this.emote = null;
    this.lastQuip = -10;
    this.idleT = 0;
    this.freeze = 0;
    this.fairy = { x: 0, y: 0, mode: "follow", t: 0, seen: new Set(), trail: [] };
    this.filled = new Set();
    this.broken = new Set();
    this.found = new Set();
    this.rand = rng(1234 + phase.index * 77);
    this.input = { up: false, down: false, left: false, right: false };
    this.paused = false;
    this.godMode = false;
    this.time = 0;
    this.particles = [];
    this.projectiles = [];
    this.slashes = [];
    this.floaters = [];
    this.images = {};
    this.inv = { key: false, rose: false, smallKeys: 0, diamonds: 0 };
    this.diamondsTotal = this.objects.filter((o) => o.type === "diamond").length;
    const s = this.start;
    this.player = { x: s.x, y: s.y, px: s.x * T, py: s.y * T, dir: "down", move: null, hp: 4, maxHp: 4, invuln: 0, animT: 0, pose: null, poseT: 0, holdItem: null, lunge: 0 };
    this.room = this.roomOf(s.x, s.y);
    this.visited = new Set([this.room.key]);
    this.totalRooms = Object.keys(phase.rooms).length;
    this.cam = { x: this.room.x * VIEW_W, y: this.room.y * VIEW_H, slide: null };
    this.entry = { x: s.x, y: s.y };
    this.ready = false;
    this.snapshot();
    this.load();
  }

  initObject(o) {
    o.px = o.x * T;
    o.py = o.y * T;
    if (o.type === "enemy") Object.assign(o, { hp: o.hp || 1, maxHp: o.hp || 1, alive: true, homeX: o.x, homeY: o.y, moveT: 0.2 + (o.x % 3) * 0.1, dir: o.axis === "v" ? "down" : "right", hurtT: 0, move: null });
    if (o.type === "turret") o.timer = o.offset || 0;
    if (o.type === "lever") o.on = Boolean(o.startOn);
  }

  async load() {
    const terr = renderTerrain(this.level);
    this.terrain = terr.canvas;
    this.terrainG = this.terrain.getContext("2d");
    this.windowLights = terr.lights;
    this.torches = terr.torches;
    this.lightCanvas = makeCanvas(VIEW_W, VIEW_H);
    this.vignette = this.makeVignette();
    const r = rng(9);
    this.ambient = Array.from({ length: 40 }, () => ({ x: r() * VIEW_W, y: r() * VIEW_H, ph: r() * 6.28, s: r(), vx: (r() - 0.5) * 12, vy: (r() - 0.5) * 12 }));
    const imgs = await Promise.all(Object.entries(CHARACTERS).map(async ([k, c]) => [k, await loadImage(c.src)]));
    imgs.forEach(([k, img]) => (this.images[k] = img));
    this.ready = true;
    this.emitHud();
  }

  makeVignette() {
    const { c, g } = makeCanvas(VIEW_W, VIEW_H);
    const grd = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.42)");
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    return c;
  }

  // ------------------------------------------------------------------ consultas
  roomOf(x, y) {
    const rx = Math.floor(x / ROOM_W), ry = Math.floor(y / ROOM_H);
    return { x: rx, y: ry, key: rx + "," + ry };
  }

  terrainAt(x, y) {
    return this.grid[y]?.[x] ?? " ";
  }

  objsAt(x, y) {
    return this.objects.filter((o) => o.x === x && o.y === y && !o.gone);
  }

  enemyAt(x, y) {
    return this.objects.find((o) => o.type === "enemy" && o.alive && ((o.x === x && o.y === y) || (o.move && o.move.tx === x && o.move.ty === y)));
  }

  groupActive(gid) {
    const grp = this.groups[gid];
    if (!grp) return false;
    if (grp.mode === "sequence") return grp.done;
    if (grp.mode === "any") return this.objects.some((o) => o.group === gid && TRIGGER.has(o.type) && this.triggerOn(o));
    if (grp.mode === "clear") return this.objects.filter((o) => o.type === "enemy" && o.group === gid).every((o) => !o.alive);
    const triggers = this.objects.filter((o) => o.group === gid && TRIGGER.has(o.type));
    if (!triggers.length) return false;
    return triggers.every((t) => this.triggerOn(t));
  }

  triggerOn(t) {
    if (t.type === "plate") return this.platePressed(t);
    if (t.type === "lever") return t.on;
    return Boolean(t.lit);
  }

  platePressed(p) {
    if (this.objects.some((o) => PUSHABLE.has(o.type) && !o.gone && o.x === p.x && o.y === p.y)) return true;
    if (p.player && this.player.x === p.x && this.player.y === p.y) return true;
    return false;
  }

  gateOpen(gt) {
    const want = this.groupActive(gt.group);
    const open = gt.inverse ? !want : want;
    if (open) {
      gt.wasOpen = true;
      return true;
    }
    // não fecha em cima de alguém
    const occupied = (this.player.x === gt.x && this.player.y === gt.y) || this.objects.some((o) => !o.gone && o !== gt && (PUSHABLE.has(o.type) || (o.type === "enemy" && o.alive)) && o.x === gt.x && o.y === gt.y);
    if (occupied && gt.wasOpen) return true;
    gt.wasOpen = false;
    return false;
  }

  /** Tile bloqueia passagem? who: "player" | "block" | "enemy" | "arrow" */
  blocks(x, y, who) {
    const ch = this.terrainAt(x, y);
    if (ch === " " || ch === "#" || ch === "v") return true;
    if (ch === "W" && !this.broken.has(x + "," + y)) return true;
    if (ch === "=" && who !== "player") return true;
    if (ch === "~" && !this.filled.has(x + "," + y) && who !== "arrow") return true;
    for (const o of this.objsAt(x, y)) {
      if (o.type === "exit") return true;
      if (o.type === "gate" && !this.gateOpen(o)) return true;
      if (o.type === "lock" && !o.open) return true;
      if (PUSHABLE.has(o.type) || ["deco", "lamp", "lever", "target", "flowerSwitch", "altar", "sign", "statue"].includes(o.type)) return true;
      if (o.type === "crystal" && who !== "arrow") return true;
      if (who === "block" && (PICKUP.has(o.type) || o.type === "turret")) return true;
    }
    if (who === "block" || who === "enemy") {
      if (this.enemyAt(x, y)) return true;
      if (this.player.x === x && this.player.y === y) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ salas e reinício
  snapshot() {
    this.saved = {
      objects: JSON.parse(JSON.stringify(this.objects.map(({ move, ...o }) => o))),
      filled: [...this.filled],
      broken: [...this.broken],
      groups: JSON.parse(JSON.stringify(this.groups)),
      entry: { ...this.entry }
    };
  }

  restoreRoom(message) {
    const keep = new Map(this.objects.filter((o) => (PICKUP.has(o.type) && o.gone) || (o.type === "lock" && o.open)).map((o) => [o.id, o]));
    this.objects = this.saved.objects.map((o) => {
      const k = keep.get(o.id);
      const c = { ...o, move: null };
      if (k) Object.assign(c, { gone: k.gone, open: k.open });
      c.px = c.x * T;
      c.py = c.y * T;
      return c;
    });
    this.filled = new Set(this.saved.filled);
    this.broken = new Set(this.saved.broken);
    this.groups = JSON.parse(JSON.stringify(this.saved.groups));
    this.terrain = renderTerrain(this.level).canvas;
    this.terrainG = this.terrain.getContext("2d");
    this.broken.forEach((k) => {
      const [x, y] = k.split(",").map(Number);
      paintFloor(this.terrainG, this.level, x, y);
    });
    const p = this.player;
    Object.assign(p, { x: this.saved.entry.x, y: this.saved.entry.y, move: null, hp: p.maxHp, invuln: 1.2, pose: null, holdItem: null });
    p.px = p.x * T;
    p.py = p.y * T;
    this.projectiles = [];
    this.fade = 0.8;
    if (message) this.hooks.onEvent({ type: "toast", text: message });
    this.emitHud();
  }

  // ------------------------------------------------------------------ hud
  emitHud() {
    const inv = this.inv;
    let objective;
    if (!inv.rose && !inv.key) objective = "Encontre a rosa e a chave para abrir a porta.";
    else if (!inv.key) objective = "Rosa encontrada! Agora falta a chave da porta.";
    else if (!inv.rose) objective = "Chave encontrada! Agora falta a rosa.";
    else objective = "Você tem a rosa e a chave: vá até a porta de saída!";
    this.hooks.onHud({
      hp: this.player.hp, maxHp: this.player.maxHp, key: inv.key, rose: inv.rose, smallKeys: inv.smallKeys,
      diamonds: inv.diamonds, diamondsTotal: this.diamondsTotal, rooms: this.visited.size, totalRooms: this.totalRooms, objective
    });
  }

  // ------------------------------------------------------------------ ações
  busy() {
    return this.paused || !this.ready || this.cam.slide || this.player.holdItem || this.fade > 0.4 || this.exiting;
  }

  frontTile() {
    const [dx, dy] = DIRS[this.player.dir];
    return { x: this.player.x + dx, y: this.player.y + dy };
  }

  tryStep(dir) {
    const p = this.player;
    p.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = p.x + dx, ny = p.y + dy;
    // porta de saída
    const exit = this.objsAt(nx, ny).find((o) => o.type === "exit");
    if (exit) return this.tryExit(exit);
    const lock = this.objsAt(nx, ny).find((o) => o.type === "lock" && !o.open);
    if (lock) {
      if (this.inv.smallKeys > 0) {
        this.inv.smallKeys--;
        lock.open = true;
        audio.playSfx("door");
        this.burst(nx * T + 16, ny * T + 10, "#c9c9d6", 14);
        this.emitHud();
      } else if (!lock.warned || this.time - lock.warned > 2) {
        lock.warned = this.time;
        audio.playSfx("bump");
        this.hooks.onEvent({ type: "toast", text: "Porta trancada. Precisa de uma chave pequena." });
        this.quip("locked", true);
        this.emoteOn("?");
      }
      return false;
    }
    const pushable = this.objsAt(nx, ny).find((o) => PUSHABLE.has(o.type));
    if (pushable) {
      const bx = nx + dx, by = ny + dy;
      if (this.terrainAt(bx, by) === "~" && !this.filled.has(bx + "," + by) && !this.objsAt(bx, by).length && !this.enemyAt(bx, by)) {
        this.startPush(pushable, bx, by, true);
      } else if (!this.blocks(bx, by, "block")) {
        this.startPush(pushable, bx, by, false);
      } else {
        audio.playSfx("bump");
        return false;
      }
      p.move = { fx: p.x, fy: p.y, t: 0, dur: PUSH_TIME };
      p.x = nx;
      p.y = ny;
      p.pose = "push";
      this.hintSeen.push++;
      if (this.hintSeen.push === 1 || Math.random() < 0.12) this.quip("push", this.hintSeen.push === 1);
      return true;
    }
    const enemy = this.enemyAt(nx, ny);
    if (enemy) {
      this.damage(enemy);
      return false;
    }
    if (this.blocks(nx, ny, "player")) return false;
    p.move = { fx: p.x, fy: p.y, t: 0, dur: STEP_TIME };
    p.x = nx;
    p.y = ny;
    p.pose = null;
    if (this.terrainAt(nx, ny) === "=") this.found.add(nx + "," + ny);
    audio.playSfx("step");
    const dust = this.theme.floor === "sand" ? "#e8cf98" : this.theme.floor === "grass" ? "#9ad07a" : "#a8a0b0";
    for (let i = 0; i < 3; i++) this.particles.push({ x: p.px + 16 + (Math.random() - 0.5) * 8, y: p.py + 30, vx: (Math.random() - 0.5) * 16 - dx * 12, vy: -6 - Math.random() * 8, life: 0.35, max: 0.35, color: dust, dust: true });
    return true;
  }

  startPush(b, tx, ty, sink) {
    b.move = { fx: b.x, fy: b.y, t: 0, dur: PUSH_TIME, sink };
    b.x = tx;
    b.y = ty;
    audio.playSfx("push");
    for (let i = 0; i < 5; i++) this.particles.push({ x: b.px + 16, y: b.py + 28, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 20, life: 0.4, max: 0.4, color: "#c9b49a" });
  }

  tryExit(exit) {
    if (this.inv.key && this.inv.rose) {
      if (this.exiting) return false;
      this.exiting = { t: 0, exit };
      audio.playSfx("door");
      audio.playSfx("treasure");
      return false;
    }
    if (!exit.warned || this.time - exit.warned > 2.5) {
      exit.warned = this.time;
      audio.playSfx("bump");
      const missing = !this.inv.rose && !this.inv.key ? "a rosa e a chave" : !this.inv.rose ? "a rosa" : "a chave";
      this.hooks.onEvent({ type: "toast", text: `A porta não abre. Falta ${missing}.` });
      this.quip("door", true);
      this.emoteOn("?");
    }
    return false;
  }

  attack() {
    const p = this.player;
    if (this.busy() || p.attackCd > 0) return;
    this.hintSeen.sword++;
    p.attackCd = 0.32;
    p.lunge = 0.15;
    const f = this.frontTile();
    this.slashes.push({ x: p.x * T + 16 + DIRS[p.dir][0] * 14, y: p.y * T + 8 + DIRS[p.dir][1] * 14, dir: p.dir, t: 0, dur: 0.2 });
    audio.playSfx("swing");
    const en = this.enemyAt(f.x, f.y);
    if (en) this.hitEnemy(en, 1);
    if (this.terrainAt(f.x, f.y) === "W" && !this.broken.has(f.x + "," + f.y)) {
      this.broken.add(f.x + "," + f.y);
      paintFloor(this.terrainG, this.level, f.x, f.y);
      audio.playSfx("break");
      this.burst(f.x * T + 16, f.y * T + 16, "#8a8698", 26);
      this.hooks.onEvent({ type: "toast", text: "Uma passagem secreta!" });
      this.quip("secret", true);
      this.emoteOn("!");
    }
    for (const o of this.objsAt(f.x, f.y)) {
      if (o.type === "lever") this.toggleLever(o);
      if ((o.type === "flowerSwitch" || o.type === "crystal" || o.type === "target") && o.hitBy !== "arrow") this.activate(o);
    }
  }

  shoot() {
    const p = this.player;
    if (this.busy() || p.shootCd > 0) return;
    this.hintSeen.bow++;
    p.shootCd = 0.42;
    p.lunge = 0.1;
    const [dx, dy] = DIRS[p.dir];
    this.projectiles.push({ kind: "arrow", x: p.x, y: p.y, fx: p.x * T + 16, fy: p.y * T + 14, dx, dy, t: 0, speed: 14, life: 2 });
    audio.playSfx("arrow");
  }

  interact() {
    if (this.busy()) return;
    const f = this.frontTile();
    for (const o of this.objsAt(f.x, f.y)) {
      if (o.type === "lever") return this.toggleLever(o);
      if (o.type === "sign") return this.hooks.onEvent({ type: "dialogue", lines: o.lines });
      if (o.type === "altar") return this.playDemo(o);
      if ((o.type === "flowerSwitch" || o.type === "crystal" || o.type === "target") && o.interact) return this.activate(o);
    }
  }

  toggleLever(o) {
    if (o.links) {
      for (const lv of this.objects.filter((l) => l.type === "lever" && l.group === o.group && o.links.includes(l.link))) lv.on = !lv.on;
    } else o.on = !o.on;
    audio.playSfx("switch");
    this.burst(o.x * T + 16, o.y * T + 12, "#ffe9a0", 8);
    this.checkGroupFeedback(o.group);
  }

  checkGroupFeedback(gid) {
    const grp = this.groups[gid];
    if (!grp) return;
    const active = this.groupActive(gid);
    if (active && !grp.announced) {
      grp.announced = true;
      audio.playSfx("door");
      if (grp.message) this.hooks.onEvent({ type: "toast", text: grp.message });
      this.quip("open");
    } else if (!active) grp.announced = false;
  }

  activate(o) {
    const grp = this.groups[o.group];
    if (o.lit || (grp && grp.done)) return;
    if (grp && grp.mode === "sequence") {
      if (o.order === grp.progress + 1) {
        o.lit = true;
        grp.progress++;
        audio.playSfx("chime" + Math.min(grp.progress, 5));
        this.burst(o.x * T + 16, o.y * T + 10, o.color || "#ffe9a0", 14);
        if (grp.progress >= this.objects.filter((t) => t.group === o.group && TRIGGER.has(t.type)).length) {
          grp.done = true;
          this.checkGroupFeedback(o.group);
        }
      } else {
        grp.progress = 0;
        this.objects.filter((t) => t.group === o.group).forEach((t) => (t.lit = false));
        audio.playSfx("bump");
        this.hooks.onEvent({ type: "toast", text: grp.wrong || "Ordem errada... tudo se apagou." });
        this.quip("wrong", true);
      }
      return;
    }
    o.lit = true;
    audio.playSfx("switch");
    this.burst(o.x * T + 16, o.y * T + 10, o.color || "#ffe9a0", 14);
    this.checkGroupFeedback(o.group);
  }

  playDemo(altar) {
    const members = this.objects.filter((t) => t.group === altar.group && TRIGGER.has(t.type)).sort((a, b) => a.order - b.order);
    audio.playSfx("switch");
    members.forEach((m, i) => setTimeout(() => {
      m.flash = 0.6;
      audio.playSfx("chime" + Math.min(i + 1, 5));
    }, 500 + i * 800));
    if (altar.lines) this.hooks.onEvent({ type: "dialogue", lines: altar.lines });
  }

  /** Para onde uma flecha iria nesta direção? (usado pela mira de ajuda) */
  aimScan(dir) {
    const [dx, dy] = DIRS[dir];
    let x = this.player.x, y = this.player.y;
    for (let i = 0; i < 16; i++) {
      x += dx;
      y += dy;
      if (this.roomOf(x, y).key !== this.room.key) return null;
      const en = this.enemyAt(x, y);
      if (en) return { o: en, x, y, n: i + 1 };
      const trig = this.objsAt(x, y).find((o) => ["target", "crystal", "lever"].includes(o.type) && o.hitBy !== "sword");
      if (trig) return { o: trig, x, y, n: i + 1 };
      if (this.blocks(x, y, "arrow")) return null;
    }
    return null;
  }

  // ------------------------------------------------------------------ falas e emotes
  quip(kind, force = false) {
    const list = QUIPS[kind];
    if (!list || !list.length) return;
    if (!force && this.time - this.lastQuip < 4) return;
    this.lastQuip = this.time;
    this.bubble = { text: list[Math.floor(Math.random() * list.length)], t: 0, dur: 2.8, p: this.player };
  }

  emoteOn(icon) {
    this.emote = { icon, t: 0 };
  }

  // ------------------------------------------------------------------ dano
  damage(src) {
    const p = this.player;
    if (p.invuln > 0 || this.godMode) return;
    p.hp--;
    p.invuln = 1.2;
    audio.playSfx("hurt");
    this.freeze = 0.08;
    this.quip("hurt", true);
    this.emoteOn("sweat");
    this.burst(p.px + 16, p.py + 8, "#ff5a76", 12);
    this.shake = 0.25;
    this.emitHud();
    if (p.hp <= 0) this.restoreRoom("Lais respira fundo e tenta de novo.");
  }

  hitEnemy(en, n) {
    if (en.invulnerable) {
      this.burst(en.x * T + 16, en.y * T + 10, "#c8b8ff", 6);
      return;
    }
    en.hp -= n;
    en.hurtT = 0.3;
    this.freeze = 0.06;
    audio.playSfx("hit");
    const [dx, dy] = [Math.sign(en.x - this.player.x), Math.sign(en.y - this.player.y)];
    if (en.hp > 0 && !en.move && !this.blocks(en.x + dx, en.y + dy, "enemy")) {
      en.move = { fx: en.x, fy: en.y, tx: en.x + dx, ty: en.y + dy, t: 0, dur: 0.12 };
      en.x += dx;
      en.y += dy;
      en.move.tx = en.x;
      en.move.ty = en.y;
    }
    if (en.hp <= 0) {
      en.alive = false;
      this.burst(en.x * T + 16, en.y * T + 12, "#ffffff", 20);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.particles.push({ x: en.x * T + 16, y: en.y * T + 14, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 20, life: 0.6, max: 0.6, color: "#ffe066", star: true });
      }
      this.shake = 0.12;
      if (Math.random() < 0.6) this.quip("kill");
      audio.playSfx("poof");
      if (this.rand() < 0.25 && !this.objsAt(en.x, en.y).length) {
        const h = { type: "heart", id: "heart_drop_" + en.id, x: en.x, y: en.y };
        this.initObject(h);
        this.objects.push(h);
      }
      if (en.group) this.checkGroupFeedback(en.group);
    }
  }

  // ------------------------------------------------------------------ loop
  update(dt) {
    this.time += dt;
    if (this.fade > 0) this.fade -= dt;
    if (this.shake > 0) this.shake -= dt;
    const p = this.player;
    p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
    p.shootCd = Math.max(0, (p.shootCd || 0) - dt);
    p.lunge = Math.max(0, p.lunge - dt);
    this.updateParticles(dt);
    if (this.bubble) {
      this.bubble.t += dt;
      if (this.bubble.t > this.bubble.dur) this.bubble = null;
    }
    if (this.emote) {
      this.emote.t += dt;
      if (this.emote.t > 1.6) this.emote = null;
    }
    this.updateFairy(dt);
    if (!this.ready || this.paused) return;
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    if (!this.saidStart && this.time > 1.5) {
      this.saidStart = true;
      this.quip("start", true);
    }
    const anyInput = this.input.up || this.input.down || this.input.left || this.input.right;
    this.idleT = anyInput || this.player.move ? 0 : this.idleT + dt;
    if (this.idleT > 9) {
      this.idleT = -8;
      this.quip("idle", true);
      this.emoteOn("note");
    }

    if (this.cam.slide) {
      const s = this.cam.slide;
      s.t += dt / 0.45;
      const k = s.t >= 1 ? 1 : 1 - Math.pow(1 - s.t, 3);
      this.cam.x = s.fx + (s.tx - s.fx) * k;
      this.cam.y = s.fy + (s.ty - s.fy) * k;
      this.tweenPlayer(dt);
      if (s.t >= 1) {
        this.cam.slide = null;
        if (p.hp < p.maxHp) {
          p.hp++;
          this.emitHud();
        }
        this.entry = { x: p.x, y: p.y };
        this.snapshot();
      }
      return;
    }

    if (this.exiting) {
      this.exiting.t += dt;
      if (this.exiting.t > 1.3 && !this.exiting.walked) {
        this.exiting.walked = true;
        const ex = this.exiting.exit;
        p.move = { fx: p.x, fy: p.y, t: 0, dur: 0.4 };
        p.x = ex.x;
        p.y = ex.y;
        p.dir = "up";
      }
      this.tweenPlayer(dt);
      if (this.exiting.t > 2.0 && !this.exiting.done) {
        this.exiting.done = true;
        this.hooks.onEvent({ type: "phaseComplete" });
      }
      return;
    }

    if (p.holdItem) {
      p.holdItem.t += dt;
      if (p.holdItem.t > p.holdItem.dur) {
        const it = p.holdItem;
        p.holdItem = null;
        if (it.after) it.after();
      }
      return;
    }

    p.invuln = Math.max(0, p.invuln - dt);
    this.tweenPlayer(dt);
    this.tweenObjects(dt);

    if (!p.move) {
      const dir = this.input.up ? "up" : this.input.down ? "down" : this.input.left ? "left" : this.input.right ? "right" : null;
      if (dir) this.tryStep(dir);
      else p.pose = null;
    }
    this.updateTraps(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateGatesFeedback();
  }

  tweenPlayer(dt) {
    const p = this.player;
    if (p.move) {
      p.move.t += dt / p.move.dur;
      p.animT += dt;
      const k = Math.min(1, p.move.t);
      p.px = (p.move.fx + (p.x - p.move.fx) * k) * T;
      p.py = (p.move.fy + (p.y - p.move.fy) * k) * T;
      if (k >= 1) {
        p.move = null;
        this.arrive();
      }
    } else {
      p.px = p.x * T;
      p.py = p.y * T;
      p.animT += dt * 0.6;
    }
  }

  tweenObjects(dt) {
    for (const o of this.objects) {
      if (!o.move) continue;
      o.move.t += dt / o.move.dur;
      const k = Math.min(1, o.move.t);
      o.px = (o.move.fx + (o.x - o.move.fx) * k) * T;
      o.py = (o.move.fy + (o.y - o.move.fy) * k) * T;
      if (k >= 1) {
        const sink = o.move.sink;
        o.move = null;
        if (sink) {
          o.gone = true;
          this.filled.add(o.x + "," + o.y);
          audio.playSfx("splash");
          for (let i = 0; i < 16; i++) this.particles.push({ x: o.x * T + 16, y: o.y * T + 16, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 70, life: 0.6, max: 0.6, color: i % 2 ? "#ffffff" : this.theme.water[2] });
          this.hooks.onEvent({ type: "toast", text: "A pedra afundou e virou caminho!" });
          this.quip("splash");
        }
        for (const t of this.objsAt(o.x, o.y)) if (t.type === "plate") {
          for (let i = 0; i < 10; i++) this.particles.push({ x: o.x * T + 16 + (Math.random() - 0.5) * 24, y: o.y * T + 28, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 20, life: 0.5, max: 0.5, color: "#b0ffd0" });
          audio.playSfx("switch");
          this.checkGroupFeedback(t.group);
        }
      }
    }
  }

  arrive() {
    const p = this.player;
    // troca de sala
    const room = this.roomOf(p.x, p.y);
    if (room.key !== this.room.key) {
      this.cam.slide = { fx: this.room.x * VIEW_W, fy: this.room.y * VIEW_H, tx: room.x * VIEW_W, ty: room.y * VIEW_H, t: 0 };
      this.room = room;
      if (!this.visited.has(room.key) && Math.random() < 0.35) setTimeout(() => this.quip("room"), 600);
      this.visited.add(room.key);
      audio.playSfx("whoosh");
      this.emitHud();
    }
    for (const o of this.objsAt(p.x, p.y)) {
      if (o.type === "plate") {
        audio.playSfx("switch");
        this.checkGroupFeedback(o.group);
      }
      if (!PICKUP.has(o.type)) continue;
      o.gone = true;
      this.collect(o);
    }
  }

  collect(o) {
    const p = this.player;
    const cx = o.x * T + 16, cy = o.y * T + 12;
    if (o.type === "diamond") {
      this.inv.diamonds++;
      audio.playSfx("treasure");
      this.quip("diamond");
      this.burst(cx, cy, "#ff8ad8", 16);
      this.floaters.push({ x: cx, y: cy - 10, text: "+1 diamante", t: 0 });
    } else if (o.type === "heart") {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      audio.playSfx("heal");
      this.burst(cx, cy, "#ff5a76", 10);
    } else if (o.type === "smallKey") {
      this.inv.smallKeys++;
      audio.playSfx("key");
      p.holdItem = { kind: "smallKey", t: 0, dur: 0.7 };
    } else if (o.type === "key") {
      this.inv.key = true;
      audio.playSfx("key");
      this.quip("key", true);
      this.emoteOn("heart");
      p.dir = "down";
      p.holdItem = { kind: "key", t: 0, dur: 1.3, after: () => this.hooks.onEvent({ type: "key" }) };
      this.burst(cx, cy - 20, "#f5c542", 30);
    } else if (o.type === "rose") {
      this.inv.rose = true;
      audio.playSfx("rose");
      this.emoteOn("heart");
      p.dir = "down";
      p.holdItem = { kind: "rose", t: 0, dur: 1.8, after: () => this.hooks.onEvent({ type: "rose" }) };
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        this.particles.push({ x: cx, y: cy - 20, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 10, life: 1.4, max: 1.4, color: i % 3 ? "#ff8aa8" : "#fff2c0", petal: true });
      }
    }
    this.emitHud();
  }

  updateGatesFeedback() {
    for (const o of this.objects) {
      if (o.type !== "gate") continue;
      const open = this.gateOpen(o);
      o.anim = Math.max(0, Math.min(1, (o.anim ?? (open ? 1 : 0)) + (open ? 1 : -1) * 0.06));
    }
  }

  // ------------------------------------------------------------------ armadilhas
  spikeUp(o) {
    const period = o.period || 3, up = o.up || 1.0;
    return (this.time + (o.offset || 0)) % period < up;
  }

  tideLevel(o) {
    const period = o.period || 4.5, wet = o.wet || 1.8;
    const ph = (((this.time + (o.offset || 0) + o.x * (o.wave ?? 0.22)) % period) + period) % period;
    if (ph < wet) return Math.min(1, ph / 0.3, (wet - ph) / 0.3);
    return 0;
  }

  updateTraps(dt) {
    const p = this.player;
    for (const o of this.objects) {
      if (o.type === "spikes" && o.x === p.x && o.y === p.y && !p.move && this.spikeUp(o)) this.damage(o);
      if (o.type === "tide" && o.x === p.x && o.y === p.y && !p.move && this.tideLevel(o) > 0.85 && p.invuln <= 0 && !this.godMode) {
        this.hooks.onEvent({ type: "toast", text: "A onda levou Lais de volta à entrada da sala!" });
        this.damage(o);
        if (p.hp > 0) {
          p.x = this.entry.x;
          p.y = this.entry.y;
          p.move = null;
        }
      }
      if (o.type === "turret") {
        o.timer += dt;
        if (o.timer >= (o.period || 2)) {
          o.timer = 0;
          if (this.roomOf(o.x, o.y).key === this.room.key) {
            const [dx, dy] = DIRS[o.dir || "down"];
            this.projectiles.push({ kind: "fire", x: o.x, y: o.y, fx: o.x * T + 16, fy: o.y * T + 16, dx, dy, t: 0, speed: o.speed || 5, life: 4, color: o.color || "#ff7a1a" });
            audio.playSfx("fire");
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------ inimigos
  updateEnemies(dt) {
    const p = this.player;
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
      if (this.roomOf(en.x, en.y).key !== this.room.key) continue;
      if (en.x === p.x && en.y === p.y) this.damage(en);
      if (en.move) continue;
      en.moveT -= dt;
      if (en.moveT > 0) continue;
      en.moveT = en.speed || 0.6;
      let dir = null;
      if (en.ai === "chase" && Math.abs(p.x - en.x) + Math.abs(p.y - en.y) <= (en.sight || 7)) {
        const dx = p.x - en.x, dy = p.y - en.y;
        const prim = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        const sec = Math.abs(dx) >= Math.abs(dy) ? (dy > 0 ? "down" : dy < 0 ? "up" : null) : dx > 0 ? "right" : dx < 0 ? "left" : null;
        for (const d of [prim, sec]) {
          if (!d) continue;
          const [ddx, ddy] = DIRS[d];
          if (en.x + ddx === p.x && en.y + ddy === p.y) {
            this.damage(en);
            dir = null;
            break;
          }
          if (!this.blocks(en.x + ddx, en.y + ddy, "enemy") && this.roomOf(en.x + ddx, en.y + ddy).key === this.room.key) {
            dir = d;
            break;
          }
        }
      } else if (en.ai === "patrol") {
        const [ddx, ddy] = DIRS[en.dir];
        if (en.x + ddx === p.x && en.y + ddy === p.y) {
          this.damage(en);
        } else if (this.blocks(en.x + ddx, en.y + ddy, "enemy") || this.roomOf(en.x + ddx, en.y + ddy).key !== this.room.key) {
          en.dir = { up: "down", down: "up", left: "right", right: "left" }[en.dir];
        } else dir = en.dir;
      } else {
        const opts = Object.keys(DIRS).filter((d) => {
          const [ddx, ddy] = DIRS[d];
          return !this.blocks(en.x + ddx, en.y + ddy, "enemy") && Math.abs(en.x + ddx - en.homeX) <= 3 && Math.abs(en.y + ddy - en.homeY) <= 3 && this.roomOf(en.x + ddx, en.y + ddy).key === this.room.key;
        });
        if (opts.length && this.rand() < 0.7) dir = opts[Math.floor(this.rand() * opts.length)];
      }
      if (dir) {
        const [ddx, ddy] = DIRS[dir];
        en.dir = dir;
        en.move = { fx: en.x, fy: en.y, t: 0, dur: Math.min(0.3, (en.speed || 0.6) * 0.6) };
        en.x += ddx;
        en.y += ddy;
      }
    }
  }

  // ------------------------------------------------------------------ projéteis
  updateProjectiles(dt) {
    const p = this.player;
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
            else if (trig.hitBy !== "sword") {
              this.activate(trig);
              if (Math.random() < 0.5) this.quip("bow");
            }
            pr.life = 0;
            break;
          }
          if (this.blocks(nx, ny, "arrow")) {
            this.burst(pr.fx + pr.dx * 16, pr.fy + pr.dy * 16, "#c9a070", 4);
            audio.playSfx("thunk");
            pr.life = 0;
            break;
          }
        } else {
          if (nx === p.x && ny === p.y) {
            this.damage(pr);
            pr.life = 0;
            break;
          }
          if (this.blocks(nx, ny, "arrow") && !(this.terrainAt(nx, ny) === "v")) {
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
      if (pr.kind !== "arrow" && Math.abs(pr.fx - (p.px + 16)) < 10 && Math.abs(pr.fy - (p.py + 14)) < 12) {
        this.damage(pr);
        pr.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0);
    this.slashes.forEach((s) => (s.t += dt));
    this.slashes = this.slashes.filter((s) => s.t < s.dur);
  }

  /** Lumi: fadinha que segue a Lais e, quando ela fica parada, voa até a rosa ou a chave. */
  updateFairy(dt) {
    const f = this.fairy, p = this.player;
    f.t += dt;
    const homeX = p.px + 16 + Math.cos(f.t * 2.2) * 15, homeY = p.py - 20 + Math.sin(f.t * 3.1) * 5;
    if (!f.x) Object.assign(f, { x: homeX, y: homeY });
    let tx = homeX, ty = homeY;
    if (f.mode === "follow" && this.idleT > 3.2 && !this.busy?.()) {
      const target = this.objects.find((o) => (o.type === "rose" || o.type === "key") && !o.gone && this.roomOf(o.x, o.y).key === this.room.key);
      if (target) {
        f.mode = "scout";
        f.target = target;
        f.wait = 0;
        if (!f.seen.has(target.id)) {
          f.seen.add(target.id);
          this.bubble = { text: target.type === "rose" ? LUMI.rose : LUMI.key, t: 0, dur: 2.4, lumi: true };
        }
      }
    }
    if (f.mode === "scout") {
      const tg = f.target;
      if (!tg || tg.gone || this.idleT === 0) f.mode = "follow";
      else {
        tx = tg.x * T + 16 + Math.cos(f.t * 4) * 8;
        ty = tg.y * T - 4 + Math.sin(f.t * 5) * 4;
        if (Math.hypot(tx - f.x, ty - f.y) < 10) {
          f.wait += dt;
          if (f.wait > 1.8) f.mode = "follow";
        }
      }
    }
    const sp = f.mode === "scout" ? 4 : 6;
    f.x += (tx - f.x) * Math.min(1, dt * sp);
    f.y += (ty - f.y) * Math.min(1, dt * sp);
    f.trail.push({ x: f.x, y: f.y, life: 0.5 });
    for (const tr of f.trail) tr.life -= dt;
    f.trail = f.trail.filter((tr) => tr.life > 0);
  }

  drawFairy(g, t) {
    const f = this.fairy;
    if (!f.x) return;
    for (const tr of f.trail) {
      g.globalAlpha = tr.life * 1.2;
      R(g, tr.x + Math.sin(tr.life * 20) * 1.5, tr.y, 1, 1, "#ffd6ea");
    }
    g.globalAlpha = 1;
    glow(g, f.x, f.y, 14, "#ff9ad0", 0.55 + Math.sin(t * 6) * 0.15);
    const flap = Math.floor(t * 14) % 2;
    g.globalAlpha = 0.8;
    E(g, f.x - 3, f.y - 2 - flap, 3, 2 - flap * 0.8, "#e0f4ff");
    E(g, f.x + 3, f.y - 2 - flap, 3, 2 - flap * 0.8, "#e0f4ff");
    g.globalAlpha = 1;
    E(g, f.x, f.y, 2, 2.5, "#ffb0d8");
    R(g, f.x - 1, f.y - 1, 1, 1, "#ffffff");
  }

  drawBubble(g, t, cx, cy) {
    const b = this.bubble;
    const p = this.player;
    if (b) {
      const a = Math.min(1, b.t / 0.15, (b.dur - b.t) / 0.3);
      const bp = b.p || p;
      const anchorX = b.lumi ? this.fairy.x : bp.px + 16, anchorY = b.lumi ? this.fairy.y - 8 : bp.py - 22;
      g.font = "8px 'Pixelify Sans', monospace";
      const words = b.text.split(" ");
      const lines = [];
      let cur = "";
      for (const w of words) {
        const tryL = cur ? cur + " " + w : w;
        if (g.measureText(tryL).width > 120 && cur) {
          lines.push(cur);
          cur = w;
        } else cur = tryL;
      }
      lines.push(cur);
      const bw = Math.max(...lines.map((l) => g.measureText(l).width)) + 10, bh = lines.length * 9 + 6;
      let bx = Math.round(anchorX - bw / 2), by = Math.round(anchorY - bh - 10 - Math.sin(Math.min(1, b.t / 0.2) * Math.PI) * 2);
      bx = Math.max(cx + 3, Math.min(cx + VIEW_W - bw - 3, bx));
      by = Math.max(cy + 3, by);
      g.globalAlpha = a;
      R(g, bx - 1, by - 1, bw + 2, bh + 2, "#1a1024");
      R(g, bx, by, bw, bh, b.lumi ? "#ffe6f2" : "#fffaf0");
      R(g, bx, by + bh - 2, bw, 2, b.lumi ? "#f0c0d8" : "#e8dcc4");
      const tx = Math.max(bx + 4, Math.min(bx + bw - 6, Math.round(anchorX)));
      R(g, tx - 1, by + bh, 4, 2, "#1a1024");
      R(g, tx, by + bh, 2, 1, b.lumi ? "#ffe6f2" : "#fffaf0");
      R(g, tx, by + bh + 2, 2, 2, "#1a1024");
      g.fillStyle = b.lumi ? "#8a1f5e" : "#2a1a2a";
      g.textAlign = "left";
      g.textBaseline = "top";
      lines.forEach((l, i) => g.fillText(l, bx + 5, by + 4 + i * 9));
      g.textBaseline = "alphabetic";
      g.globalAlpha = 1;
    }
    const e = this.emote;
    if (e && !b) {
      const x = p.px + 16 + 10, y = p.py - 26 - Math.min(1, e.t / 0.15) * 4;
      g.globalAlpha = Math.min(1, (1.6 - e.t) / 0.3);
      R(g, x - 6, y - 7, 13, 12, "#1a1024");
      R(g, x - 5, y - 6, 11, 10, "#fffaf0");
      R(g, x - 2, y + 5, 3, 2, "#1a1024");
      if (e.icon === "heart") {
        for (const [dx, dy, w] of [[-3, -3, 2], [1, -3, 2], [-4, -2, 8], [-4, -1, 8], [-3, 0, 6], [-2, 1, 4], [-1, 2, 2]]) R(g, x + dx, y + dy, w, 1, "#ff3a5a");
      } else if (e.icon === "sweat") {
        E(g, x, y, 2, 3, "#7ad8ff");
        R(g, x, y - 4, 1, 2, "#7ad8ff");
      } else {
        g.fillStyle = e.icon === "!" ? "#e8453a" : "#2a1a2a";
        g.font = "bold 9px monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(e.icon === "note" ? "♪" : e.icon, x + 0.5, y);
        g.textBaseline = "alphabetic";
      }
      g.globalAlpha = 1;
    }
  }

  burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 20 + Math.random() * 60;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0.5 + Math.random() * 0.4, max: 0.9, color: Math.random() > 0.3 ? color : "#ffffff" });
    }
  }

  updateParticles(dt) {
    for (const pa of this.particles) {
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.vy += (pa.petal ? 20 : 70) * dt;
      pa.vx *= 0.97;
      pa.life -= dt;
    }
    this.particles = this.particles.filter((pa) => pa.life > 0);
    this.floaters.forEach((f) => (f.t += dt));
    this.floaters = this.floaters.filter((f) => f.t < 1.2);
    for (const o of this.objects) if (o.flash > 0) o.flash -= dt;
    for (const a of this.ambient || []) {
      const type = this.theme.ambient?.type;
      if (type === "petals") {
        a.x += (10 + a.s * 8) * dt;
        a.y += (14 + a.s * 10) * dt;
      } else if (type === "fog" || type === "seagulls") a.x += (8 + a.s * 10) * dt;
      else {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
      }
      if (a.x < -20) a.x = VIEW_W + 10;
      if (a.x > VIEW_W + 20) a.x = -10;
      if (a.y < -20) a.y = VIEW_H + 10;
      if (a.y > VIEW_H + 20) a.y = -10;
    }
  }

  // ------------------------------------------------------------------ render
  render() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = this.theme.bg;
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.terrain) return;
    const t = this.time;
    let cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    if (this.shake > 0) {
      cx += Math.round((Math.random() - 0.5) * 4);
      cy += Math.round((Math.random() - 0.5) * 4);
    }
    g.setTransform(SCALE, 0, 0, SCALE, -cx * SCALE, -cy * SCALE);
    const sx = Math.max(0, cx - T), sy = Math.max(0, cy - T);
    g.drawImage(this.terrain, sx, sy, VIEW_W + T * 2, VIEW_H + T * 2, sx, sy, VIEW_W + T * 2, VIEW_H + T * 2);

    const x0 = Math.floor(cx / T) - 1, y0 = Math.floor(cy / T) - 1, x1 = x0 + ROOM_W + 2, y1 = y0 + ROOM_H + 2;
    this.drawWater(g, t, x0, y0, x1, y1);
    this.drawFakeWalls(g, x0, y0, x1, y1);
    this.drawTorches(g, t, cx, cy);

    const inView = (o) => o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1;
    // chão: placas, espinhos, maré, portões abertos
    for (const o of this.objects) {
      if (o.gone || !inView(o)) continue;
      if (o.type === "plate") this.drawPlate(g, o);
      else if (o.type === "spikes") this.drawSpikes(g, o, t);
      else if (o.type === "tide") this.drawTide(g, o, t);
    }
    // camada ordenada por profundidade
    const list = [];
    for (const o of this.objects) {
      if (o.gone || !inView(o)) continue;
      if (["plate", "spikes", "tide"].includes(o.type)) continue;
      if (o.type === "enemy" && !o.alive) continue;
      list.push({ y: (o.py ?? o.y * T) + (o.type === "exit" ? -1 : 0), draw: () => this.drawObject(g, o, t) });
    }
    const p = this.player;
    for (const pl of this.players || [p]) list.push({ y: pl.py + 0.5, draw: () => this.asPlayer(pl, () => this.drawPlayer(g, t)) });
    list.sort((a, b) => a.y - b.y);
    list.forEach((it) => it.draw());

    for (const pr of this.projectiles) this.drawProjectile(g, pr, t);
    for (const s of this.slashes) this.drawSlash(g, s);
    for (const pa of this.particles) {
      g.globalAlpha = Math.max(0, pa.life / pa.max);
      if (pa.star) {
        R(g, pa.x - 1, pa.y, 3, 1, pa.color);
        R(g, pa.x, pa.y - 1, 1, 3, pa.color);
      } else if (pa.dust) {
        E(g, pa.x, pa.y, 2 + (1 - pa.life / pa.max) * 2, 1.5, pa.color);
      } else if (pa.petal) {
        R(g, pa.x, pa.y, 2, 1, pa.color);
        R(g, pa.x + 1, pa.y + 1, 1, 1, pa.color);
      } else R(g, pa.x, pa.y, 2, 2, pa.color);
    }
    g.globalAlpha = 1;
    for (const f of this.floaters) {
      g.globalAlpha = 1 - f.t / 1.2;
      g.fillStyle = "#fff";
      g.font = "bold 7px monospace";
      g.textAlign = "center";
      g.fillText(f.text, f.x, f.y - f.t * 12);
      g.globalAlpha = 1;
    }

    this.drawLighting(g, cx, cy, t);
    this.drawAmbient(g, t);
    this.drawFairy(g, t);
    for (const pl of this.players || [p]) {
      this.asPlayer(pl, () => {
        if (!this.bubble || this.bubble.p !== pl) this.drawHints(g, t);
        this.drawHold(g, t, cx, cy);
      });
    }
    this.drawBubble(g, t, cx, cy);

    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    if (this.theme.tint) {
      g.fillStyle = this.theme.tint;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    g.drawImage(this.vignette, 0, 0);
    if (this.exiting) {
      const k = Math.max(0, (this.exiting.t - 1.4) / 0.6);
      g.globalAlpha = Math.min(1, k);
      g.fillStyle = "#fff6e8";
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
    if (this.fade > 0) {
      g.globalAlpha = Math.min(1, this.fade / 0.4);
      g.fillStyle = "#07050c";
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
  }

  /** Executa fn com "pl" como jogador atual (usado no modo cooperativo). */
  asPlayer(pl, fn) {
    const prev = this.player;
    this.player = pl;
    try {
      return fn();
    } finally {
      this.player = prev;
    }
  }

  keyCap(g, x, y, label, t) {
    const w = label.length > 1 ? 9 + label.length * 5 : 13;
    y += Math.round(Math.sin(t * 5) * 1.5);
    R(g, x - w / 2 - 1, y - 7, w + 2, 15, "#1a1024");
    R(g, x - w / 2, y - 6, w, 13, "#f5e6c8");
    R(g, x - w / 2, y + 4, w, 3, "#c4ad86");
    g.fillStyle = "#1a1024";
    g.font = "bold 8px monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, x, y - 1);
    g.textBaseline = "alphabetic";
  }

  /** Dicas de contexto: mira da flecha, espada, interação e empurrão. */
  drawHints(g, t) {
    const p = this.player;
    if (this.busy() || p.move) return;
    const hx = p.px + 16, hy = p.py - 30;
    const ARROW = { up: "↑", down: "↓", left: "←", right: "→" };
    let aimed = null;
    for (const d of Object.keys(DIRS)) {
      const h = this.aimScan(d);
      if (h && h.o.type !== "enemy" && !h.o.lit && !(h.o.type === "lever" && h.o.on)) {
        aimed = { d, h };
        if (d === p.dir) break;
      }
    }
    if (aimed) {
      const [dx, dy] = DIRS[aimed.d];
      g.globalAlpha = 0.8;
      for (let i = 1; i < aimed.h.n * 4; i++) {
        if ((i + Math.floor(t * 8)) % 3) continue;
        R(g, p.px + 16 + dx * i * 8 - 1, p.py + 14 + dy * i * 8 - 1, 2, 2, "#fff2a0");
      }
      const tx = aimed.h.x * T + 16, ty = aimed.h.y * T + 4;
      g.strokeStyle = "#fff2a0";
      g.lineWidth = 1;
      g.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3;
      g.strokeRect(tx - 12, ty - 14, 24, 24);
      g.globalAlpha = 1;
      this.keyCap(g, hx, hy, aimed.d === p.dir ? "K" : ARROW[aimed.d] + " K", t);
      return;
    }
    const f = this.frontTile();
    const front = this.objsAt(f.x, f.y);
    if (this.enemyAt(f.x, f.y) || (this.terrainAt(f.x, f.y) === "W" && !this.broken.has(f.x + "," + f.y))) return this.keyCap(g, hx, hy, "J", t);
    if (front.some((o) => ["lever", "sign", "altar"].includes(o.type) || (o.interact && !o.lit))) return this.keyCap(g, hx, hy, "E", t);
    if (this.hintSeen.push < 4) {
      const pb = front.find((o) => PUSHABLE.has(o.type));
      if (pb) {
        const [dx, dy] = DIRS[p.dir];
        const bx = f.x + dx, by = f.y + dy;
        const canSink = this.terrainAt(bx, by) === "~" && !this.filled.has(bx + "," + by);
        if (canSink || !this.blocks(bx, by, "block")) this.keyCap(g, hx, hy, ARROW[p.dir], t);
      }
    }
  }

  drawWater(g, t, x0, y0, x1, y1) {
    const w = this.theme.water;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (this.terrainAt(x, y) !== "~") continue;
      const px = x * T, py = y * T;
      if (this.filled.has(x + "," + y)) {
        R(g, px + 2, py + 3, 28, 26, "rgba(0,0,0,0.3)");
        E(g, px + 16, py + 15, 13, 11, "#4a4a5a");
        E(g, px + 16, py + 14, 12, 10, "#8a8a99");
        E(g, px + 13, py + 11, 5, 3, "#a7aabd");
        for (let i = 0; i < 3; i++) R(g, px + 4 + i * 10 + Math.sin(t * 2 + i) * 2, py + 26, 5, 1, w[3]);
        continue;
      }
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.6 + i * 0.33 + (x * 0.17 + y * 0.29)) % 1;
        const lx = px + 4 + ((i * 11 + x * 7) % 18);
        const ly = py + 4 + k * 24;
        g.globalAlpha = Math.sin(k * Math.PI) * 0.8;
        R(g, lx, ly, 6, 1, w[2]);
        g.globalAlpha = 1;
      }
      if (Math.sin(t * 2.3 + x * 1.7 + y * 2.1) > 0.92) R(g, px + 10 + ((x * 5) % 12), py + 8 + ((y * 7) % 14), 2, 1, "#ffffff");
      const foam = (side, fx, fy, fw, fh) => {
        if (!side) return;
        g.globalAlpha = 0.55 + Math.sin(t * 3 + x + y) * 0.25;
        R(g, fx, fy, fw, fh, w[3]);
        g.globalAlpha = 1;
      };
      const land = (ax, ay) => this.terrainAt(ax, ay) !== "~" && !this.filled.has(ax + "," + ay);
      const wob = Math.round(Math.sin(t * 2 + x * 0.7) * 2);
      foam(land(x - 1, y), px + 2, py + 4 + wob, 2, 24);
      foam(land(x + 1, y), px + T - 4, py + 4 - wob, 2, 24);
      foam(land(x, y + 1), px + 4 + wob, py + T - 4, 24, 2);
    }
  }

  drawTorches(g, t, cx, cy) {
    for (const tc of this.torches || []) {
      if (tc.x < cx - 20 || tc.x > cx + VIEW_W + 20 || tc.y < cy - 20 || tc.y > cy + VIEW_H + 20) continue;
      R(g, tc.x - 2, tc.y, 4, 8, "#3a2418");
      R(g, tc.x - 3, tc.y - 1, 6, 2, "#6b4226");
      const f = Math.sin(t * 14 + tc.x) * 1.2, h = 6 + Math.sin(t * 9 + tc.y) * 1.5;
      E(g, tc.x + f * 0.3, tc.y - h / 2 - 1, 3, h / 2 + 1, tc.color);
      E(g, tc.x + f * 0.5, tc.y - h / 2, 1.5, h / 3, "#fff6d0");
      if (Math.sin(t * 7 + tc.x) > 0.7) R(g, tc.x + f, tc.y - h - 3 - ((t * 20) % 4), 1, 1, tc.color);
    }
  }

  drawFakeWalls(g, x0, y0, x1, y1) {
    for (const k of this.found) {
      const [x, y] = k.split(",").map(Number);
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      g.globalAlpha = 0.55;
      R(g, x * T, y * T, T, T, "#000");
      g.globalAlpha = 1;
    }
  }

  drawPlate(g, o) {
    const pressed = this.plateDisplay(o);
    const x = o.x * T, y = o.y * T;
    R(g, x + 4, y + 6, 24, 22, "#2a2a36");
    R(g, x + 5, y + (pressed ? 8 : 6), 22, pressed ? 19 : 20, pressed ? "#6ae0a0" : "#9a9aa8");
    R(g, x + 5, y + (pressed ? 8 : 6), 22, 2, pressed ? "#b0ffd0" : "#c0c0cc");
    drawGlyph(g, x + 16, y + 17, o.glyph ?? 3, pressed ? "#1a5a3a" : "#55576a");
    if (pressed) glow(g, x + 16, y + 16, 22, "#6ae0a0", 0.3);
  }

  plateDisplay(o) {
    return this.platePressed(o);
  }

  drawSpikes(g, o, t) {
    const x = o.x * T, y = o.y * T;
    const up = this.spikeUp(o);
    const period = o.period || 3, ph = (t + (o.offset || 0)) % period;
    const warn = !up && ph > period - 0.5;
    R(g, x + 3, y + 3, 26, 26, "#2a2430");
    R(g, x + 4, y + 4, 24, 24, "#4a4458");
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const hx = x + 7 + i * 8, hy = y + 9 + j * 8;
      R(g, hx, hy, 3, 2, "#16121e");
      if (up) {
        R(g, hx, hy - 6, 3, 7, "#a7aabd");
        R(g, hx + 1, hy - 8, 1, 3, "#e8e8f0");
        R(g, hx + 2, hy - 5, 1, 5, "#6a6a7a");
      } else if (warn) R(g, hx + 1, hy - 1, 1, 1, "#c8c8d8");
    }
  }

  drawTide(g, o, t) {
    const k = this.tideLevel(o);
    const x = o.x * T, y = o.y * T;
    const w = this.theme.water;
    if (k <= 0) {
      const period = o.period || 4.5;
      const ph = (((t + (o.offset || 0) + o.x * (o.wave ?? 0.22)) % period) + period) % period;
      if (ph > period - 1.2) for (let i = 0; i < 3; i++) R(g, x + 4 + i * 9 + Math.sin(t * 9 + i) * 2, y + 6 + i * 8, 5, 1, "#ffffff");
      R(g, x, y + 30, T, 2, "rgba(30,120,160,0.25)");
      return;
    }
    g.globalAlpha = 0.85 * k;
    R(g, x, y, T, T, w[1]);
    for (let i = 0; i < 4; i++) R(g, x + ((i * 9 + t * 20) % 26), y + 4 + i * 7, 6, 1, w[2]);
    R(g, x, y, T, 2, w[3]);
    g.globalAlpha = 1;
  }

  drawObject(g, o, t) {
    const x = o.px ?? o.x * T, y = o.py ?? o.y * T;
    const cx = x + 16, by = y + 30;
    switch (o.type) {
      case "deco": {
        const sp = decoFor(this.theme, o.x, o.y);
        g.drawImage(sp, Math.round(cx - 24), Math.round(by - 62));
        break;
      }
      case "lamp": {
        const sp = propSprite({ type: "lantern", color: o.color || "#ffd36a" });
        E(g, cx, by - 1, 6, 2, "rgba(0,0,0,0.3)");
        g.drawImage(sp.canvas, Math.round(cx - sp.w / 2), Math.round(by - sp.h - 2));
        break;
      }
      case "boulder": {
        E(g, cx, by - 1, 13, 4, "rgba(0,0,0,0.35)");
        const look = this.phase.boulderLook || "stone";
        const c = look === "moss" ? ["#1e2420", "#5d6a5c", "#7b8a78", "#4a8a3a"] : look === "sand" ? ["#3a2a1a", "#a8865a", "#c9a878", "#e8cf98"] : look === "dark" ? ["#14101c", "#4a4458", "#6a6680", "#8a86a0"] : ["#2a2a36", "#6e7084", "#9295a8", "#c0c3d4"];
        E(g, cx, by - 13, 14, 13, c[0]);
        E(g, cx, by - 14, 13, 12, c[1]);
        const roll = o.move ? Math.min(1, o.move.t) * Math.PI : 0;
        const ox = Math.cos(roll + 3.9) * 4, oy = Math.sin(roll + 3.9) * 4;
        E(g, cx - 2 + ox * 0.4, by - 17 + oy * 0.4, 9, 8, c[2]);
        E(g, cx + ox, by - 16 + oy, 4, 3, c[3]);
        R(g, cx - ox * 1.5, by - 12 - oy * 1.2, 2, 2, c[0]);
        R(g, cx + 4, by - 8, 5, 1, c[0]);
        R(g, cx - 8, by - 6, 4, 1, c[0]);
        if (look === "moss") E(g, cx + 2, by - 24, 7, 3, "#4a9a3a");
        break;
      }
      case "crate": {
        E(g, cx, by - 1, 13, 4, "rgba(0,0,0,0.35)");
        if (this.phase.crateLook === "wardrobe") {
          R(g, cx - 13, by - 40, 26, 40, "#1a0e10");
          R(g, cx - 12, by - 39, 24, 38, "#5a3428");
          R(g, cx - 12, by - 39, 24, 3, "#7a4a38");
          R(g, cx, by - 36, 1, 34, "#2a1410");
          R(g, cx - 4, by - 20, 2, 4, "#c9a040");
          R(g, cx + 3, by - 20, 2, 4, "#c9a040");
          R(g, cx - 10, by - 34, 8, 12, "#4a2a20");
          R(g, cx + 3, by - 34, 8, 12, "#4a2a20");
        } else {
          R(g, cx - 13, by - 26, 26, 26, "#2a170c");
          R(g, cx - 12, by - 25, 24, 24, "#b07a42");
          R(g, cx - 12, by - 25, 24, 3, "#d6a464");
          R(g, cx - 12, by - 14, 24, 2, "#7a4c26");
          L(g, cx - 10, by - 22, cx + 10, by - 3, 2, "#8a5a30");
          R(g, cx - 12, by - 25, 2, 24, "#7a4c26");
          R(g, cx + 10, by - 25, 2, 24, "#7a4c26");
        }
        break;
      }
      case "key":
      case "smallKey": {
        const fy = Math.sin(t * 3 + o.x) * 2;
        E(g, cx, by - 2, 7, 2, "rgba(0,0,0,0.3)");
        glow(g, cx, by - 16 + fy, 22, o.type === "key" ? "#ffd36a" : "#d0d0ff", 0.5);
        drawKey(g, cx, by - 15 + fy, o.type === "key" ? 1 : 0.75, o.type === "smallKey");
        break;
      }
      case "rose": {
        const fy = Math.sin(t * 2.4) * 2;
        E(g, cx, by - 2, 8, 2, "rgba(0,0,0,0.3)");
        glow(g, cx, by - 18 + fy, 30, (this.roseInfo || {}).glow || "#ff5a76", 0.55 + Math.sin(t * 3) * 0.15);
        drawRose(g, cx, by - 22 + fy, this.phase.id, 1, t);
        if (Math.sin(t * 5) > 0.6) R(g, cx + 8, by - 30 + fy, 1, 1, "#ffffff");
        break;
      }
      case "diamond": {
        const fy = Math.sin(t * 3 + o.x * 2) * 1.5;
        E(g, cx, by - 2, 6, 2, "rgba(0,0,0,0.3)");
        glow(g, cx, by - 12 + fy, 16, "#ff8ad8", 0.4);
        drawDiamond(g, cx, by - 12 + fy, t);
        break;
      }
      case "heart": {
        const fy = Math.sin(t * 4) * 1.5;
        g.save();
        g.translate(cx, by - 12 + fy);
        g.scale(1.5, 1.5);
        drawHeart(g, 0, 0);
        g.restore();
        break;
      }
      case "exit":
        this.drawExit(g, o, t);
        break;
      case "lock": {
        if (o.open) {
          R(g, x + 2, y + 26, 28, 4, "#3a2418");
          break;
        }
        R(g, x + 2, y - 6, 28, 36, "#1a0e08");
        R(g, x + 4, y - 4, 24, 33, "#7a4a28");
        for (let i = 0; i < 4; i++) R(g, x + 7 + i * 6, y - 4, 1, 33, "#5a3418");
        R(g, x + 4, y + 4, 24, 2, "#3a3a44");
        R(g, x + 4, y + 20, 24, 2, "#3a3a44");
        R(g, x + 11, y + 9, 10, 9, "#55576a");
        R(g, x + 12, y + 10, 8, 7, "#c9c9d6");
        R(g, x + 15, y + 12, 2, 3, "#2a2a36");
        break;
      }
      case "gate":
        this.drawGate(g, o);
        break;
      case "lever": {
        R(g, x + 8, by - 8, 16, 8, "#2a2a36");
        R(g, x + 9, by - 7, 14, 6, "#7d8094");
        const a = o.on ? 0.6 : -0.6;
        L(g, cx, by - 7, cx + Math.sin(a) * 14, by - 7 - Math.cos(a) * 14, 2, "#4a2c1a");
        E(g, cx + Math.sin(a) * 14, by - 7 - Math.cos(a) * 14, 3, 3, o.on ? "#5aff8a" : "#e8453a");
        if (o.on) glow(g, cx, by - 14, 18, "#5aff8a", 0.3);
        break;
      }
      case "target": {
        const lit = o.lit;
        if (o.look === "lantern") {
          R(g, cx - 1, by - 30, 2, 30, "#1e1a24");
          R(g, cx - 7, by - 34, 14, 3, "#2a2430");
          R(g, cx - 5, by - 31, 10, 12, "#1e1a24");
          R(g, cx - 4, by - 30, 8, 10, lit ? "#ff9a2a" : "#3a3040");
          if (lit) glow(g, cx, by - 25, 30, "#ff9a2a", 0.55);
        } else {
          R(g, cx - 1, by - 10, 3, 10, "#4a2c1a");
          E(g, cx, by - 20, 10, 10, "#2a170c");
          E(g, cx, by - 20, 9, 9, lit ? "#ffe066" : "#f2e6d8");
          E(g, cx, by - 20, 6, 6, lit ? "#ff9a2a" : "#e8456a");
          E(g, cx, by - 20, 3, 3, lit ? "#ffe066" : "#f2e6d8");
          if (lit) glow(g, cx, by - 20, 24, "#ffe066", 0.5);
        }
        break;
      }
      case "crystal":
      case "flowerSwitch": {
        const lit = o.lit || o.flash > 0;
        const col = o.color || "#7ad8ff";
        if (o.type === "flowerSwitch") {
          R(g, x + 9, by - 8, 14, 8, "#5a5466");
          R(g, x + 10, by - 7, 12, 2, "#8a8496");
          R(g, cx, by - 20, 1, 12, "#2f6b24");
          E(g, cx - 4, by - 13, 3, 1.5, "#3a8a3a");
          const s = lit ? 7 : 4;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + (lit ? t : 0) * 0.3;
            E(g, cx + Math.cos(a) * s * 0.7, by - 23 + Math.sin(a) * s * 0.6, s * 0.55, s * 0.45, col);
          }
          E(g, cx, by - 23, 2, 2, "#fff6b0");
          if (lit) glow(g, cx, by - 22, 30, col, o.flash > 0 ? 0.9 : 0.45);
        } else {
          E(g, cx, by - 2, 8, 2, "rgba(0,0,0,0.3)");
          const c = lit ? col : "#4a5a7a";
          for (let i = 0; i < 18; i++) {
            const half = i < 12 ? 2 + i * 0.5 : 2 + (18 - i) * 1.1;
            R(g, cx - half - 1, by - 28 + i, half * 2 + 2, 1, "#16162a");
            R(g, cx - half, by - 28 + i, half * 2, 1, i < 6 ? "#ffffff" : c);
          }
          R(g, cx - 3, by - 24, 1, 10, "#ffffff");
          if (lit) glow(g, cx, by - 18, o.flash > 0 ? 40 : 28, col, o.flash > 0 ? 0.9 : 0.5);
          if (o.order && o.showOrder) drawGlyph(g, cx, by - 36, o.order - 1, "#ffffff");
        }
        break;
      }
      case "altar": {
        R(g, x + 4, by - 12, 24, 12, "#1e2420");
        R(g, x + 5, by - 11, 22, 10, "#9aaa96");
        R(g, x + 8, by - 22, 16, 10, "#1e2420");
        R(g, x + 9, by - 21, 14, 9, "#7b8a78");
        E(g, cx, by - 24, 5, 3, "#c8b8ff");
        glow(g, cx, by - 24, 18, "#c8b8ff", 0.4 + Math.sin(t * 3) * 0.15);
        break;
      }
      case "sign": {
        R(g, cx - 1, by - 14, 3, 14, "#2a170c");
        R(g, cx - 11, by - 26, 22, 13, "#2a170c");
        R(g, cx - 10, by - 25, 20, 11, "#b07a42");
        R(g, cx - 8, by - 22, 14, 1, "#5c381c");
        R(g, cx - 8, by - 19, 10, 1, "#5c381c");
        break;
      }
      case "turret": {
        // gárgula na parede
        R(g, cx - 9, y + 4, 18, 16, "#1a1420");
        R(g, cx - 8, y + 5, 16, 14, "#5a5468");
        R(g, cx - 6, y + 9, 3, 3, "#ff7a1a");
        R(g, cx + 3, y + 9, 3, 3, "#ff7a1a");
        R(g, cx - 3, y + 15, 6, 4, "#14101a");
        const k = (o.timer || 0) / (o.period || 2);
        if (k > 0.75) glow(g, cx, y + 18, 14, "#ff7a1a", (k - 0.75) * 3);
        break;
      }
      case "enemy": {
        E(g, cx, by - 1, 10, 3, "rgba(0,0,0,0.3)");
        drawEnemyTile(g, o, t, cx, by - 1);
        break;
      }
      default:
        break;
    }
  }

  drawExit(g, o, t) {
    const x = o.x * T, y = o.y * T;
    const open = this.exiting ? Math.min(1, this.exiting.t / 1.1) : 0;
    const ready = this.inv.key && this.inv.rose;
    // moldura em arco na parede
    R(g, x - 4, y - 6, 40, 38, "#1a1018");
    E(g, x + 16, y - 6, 20, 12, "#1a1018");
    R(g, x - 2, y - 4, 36, 36, "#8a6a4a");
    E(g, x + 16, y - 4, 18, 10, "#8a6a4a");
    // interior (luz quando abre)
    R(g, x + 2, y, 28, 32, "#fff2d0");
    E(g, x + 16, y, 14, 8, "#fff2d0");
    const w = 14 * (1 - open);
    // folhas da porta
    for (const side of [0, 1]) {
      const lx = side ? x + 30 - w : x + 2;
      R(g, lx, y - 4 + (side ? 0 : 0), w, 36, "#5a2a1a");
      R(g, lx + 1, y - 2, Math.max(0, w - 2), 33, "#8a3a2a");
      for (let i = 0; i < 3; i++) R(g, lx + 1, y + 4 + i * 9, Math.max(0, w - 2), 1, "#5a2a1a");
    }
    if (open < 0.2) {
      // emblema: rosa + fechadura
      E(g, x + 16, y + 6, 6, 6, "#f5c542");
      E(g, x + 16, y + 6, 5, 5, "#c81d3a");
      R(g, x + 15, y + 14, 3, 6, "#f5c542");
      R(g, x + 15, y + 16, 2, 3, "#1a0e08");
    }
    // indicadores (rosa e chave)
    for (const [i, have, col] of [[0, this.inv.rose, "#ff5a76"], [1, this.inv.key, "#f5c542"]]) {
      const ix = x + 4 + i * 20, iy = y - 12;
      E(g, ix + 2, iy, 4, 4, "#1a1018");
      E(g, ix + 2, iy, 3, 3, have ? col : "#3a2a3a");
      if (have) glow(g, ix + 2, iy, 10, col, 0.6);
    }
    if (ready) glow(g, x + 16, y + 12, 36 + open * 30, "#ffe9b0", 0.25 + Math.sin(t * 3) * 0.1 + open * 0.5);
  }

  drawGate(g, o) {
    const x = o.x * T, y = o.y * T;
    const k = o.anim ?? 0; // 1 = aberto
    R(g, x, y - 8, 3, 38, "#1a1620");
    R(g, x + 29, y - 8, 3, 38, "#1a1620");
    R(g, x, y - 10, T, 4, "#2a2430");
    R(g, x + 1, y - 9, T - 2, 2, "#7d8094");
    const lift = k * 30;
    if (k < 1) {
      g.save();
      g.beginPath();
      g.rect(x, y - 6, T, 36);
      g.clip();
      for (let i = 0; i < 5; i++) {
        R(g, x + 3 + i * 6, y - 6 - lift, 3, 36, "#2a2a36");
        R(g, x + 4 + i * 6, y - 6 - lift, 1, 36, "#9a9aaa");
        R(g, x + 3 + i * 6, y + 26 - lift, 3, 4, "#55576a");
      }
      R(g, x + 2, y + 6 - lift, 28, 2, "#2a2a36");
      g.restore();
    }
    drawGlyph(g, x + 16, y - 8, o.glyph ?? 3, k > 0.5 ? "#5aff8a" : "#e8453a");
  }

  drawPlayer(g, t) {
    const p = this.player;
    if (p.invuln > 0 && Math.floor(t * 20) % 2 === 0) return;
    const [dx, dy] = DIRS[p.dir];
    const lunge = p.lunge > 0 ? Math.sin((p.lunge / 0.15) * Math.PI) * 4 : 0;
    const x = p.px + 16 + dx * lunge, y = p.py + 30 + dy * lunge;
    E(g, x, y - 1, 9, 3, "rgba(0,0,0,0.32)");
    let anim = (p.move ? "walk_" : "idle_") + p.dir;
    if (p.holdItem) anim = "idle_down";
    const speed = p.pose === "push" ? 0.6 : 1;
    const lean = p.pose === "push" && p.move ? 2 : 0;
    const back = p.dir === "up";
    if (back) this.drawWeapon(g, p, x, y);
    const k = p.move ? Math.min(1, p.move.t) : 0;
    const bounce = p.move ? Math.abs(Math.sin(k * Math.PI)) * 2 : 0;
    const sy = p.move ? 1 - Math.sin(k * Math.PI) * 0.04 : 1 + Math.sin(t * 2.4) * 0.015;
    g.save();
    g.translate(Math.round(x + dx * lean), Math.round(y - bounce));
    g.scale(1 / Math.sqrt(sy), sy);
    const ch = p.char || "lais";
    drawCharacter(g, this.images[ch], CHARACTERS[ch], anim, p.animT * speed, 0, 0);
    g.restore();
    if (!back) this.drawWeapon(g, p, x, y);
    if (p.pose === "push" && p.move) {
      R(g, x + dx * 12 - 1, y - 14 + dy * 4, 3, 2, "#f2c49a");
      if (Math.sin(t * 9) > 0.8) R(g, x - dx * 6 + 4, y - 40, 1, 2, "#9ad8ff");
    }
    if (p.invuln > 0.9) {
      g.globalAlpha = 0.3;
      E(g, x, y - 18, 10, 18, "#ff3a5a");
      g.globalAlpha = 1;
    }
  }

  drawWeapon(g, p, x, y) {
    const [dx, dy] = DIRS[p.dir];
    const base = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[p.dir];
    if (p.attackCd > 0.1) {
      const hx = x + dx * 6 + (dy ? 7 : 0), hy = y - 16 + dy * 4;
      const k = 1 - (p.attackCd - 0.1) / 0.22;
      const a = base - 1.1 + k * 2.2;
      const ex = hx + Math.cos(a) * 15, ey = hy + Math.sin(a) * 15;
      L(g, hx, hy, ex, ey, 3, "#3a3a4a");
      L(g, hx, hy, ex, ey, 1, "#f0f4ff");
      R(g, hx - 2, hy - 2, 4, 4, "#c9a040");
      R(g, ex - 1, ey - 1, 2, 2, "#ffffff");
    } else if (p.shootCd > 0.2) {
      const k = (p.shootCd - 0.2) / 0.22;
      const cx = x + dx * 6, cy = y - 15 + dy * 4;
      g.strokeStyle = "#6b3a1a";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, 9, base - 1.1, base + 1.1);
      g.stroke();
      const ax = cx + Math.cos(base - 1.1) * 9, ay = cy + Math.sin(base - 1.1) * 9;
      const bx = cx + Math.cos(base + 1.1) * 9, by = cy + Math.sin(base + 1.1) * 9;
      const pull = 2 + k * 4;
      g.strokeStyle = "#e8e4dc";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(cx - dx * pull, cy - dy * pull);
      g.lineTo(bx, by);
      g.stroke();
    }
  }

  drawHold(g, t) {
    const p = this.player;
    const h = p.holdItem;
    if (!h) return;
    const x = p.px + 16, y = p.py - 14 - Math.min(1, h.t / 0.3) * 6;
    glow(g, x, y, 34, h.kind === "rose" ? "#ff8aa8" : "#ffe08a", 0.7);
    for (let i = 0; i < 8; i++) {
      const a = t * 2 + (i / 8) * Math.PI * 2;
      R(g, x + Math.cos(a) * 16, y + Math.sin(a) * 10, 1, 1, "#ffffff");
    }
    if (h.kind === "rose") drawRose(g, x, y, this.phase.id, 1.3, t);
    else drawKey(g, x, y, h.kind === "key" ? 1.2 : 0.9, h.kind === "smallKey");
  }

  drawProjectile(g, pr) {
    if (pr.kind === "arrow") {
      const x = Math.round(pr.fx), y = Math.round(pr.fy);
      L(g, x - pr.dx * 10, y - pr.dy * 10, x, y, 1, "#8a5a34");
      R(g, x - 1 + pr.dx * 2, y - 1 + pr.dy * 2, 3, 3, "#e8e4dc");
      R(g, x - pr.dx * 10 - 1, y - pr.dy * 10 - 1, 3, 3, "#ff8ab0");
    } else {
      glow(g, pr.fx, pr.fy, 14, pr.color, 0.7);
      E(g, pr.fx, pr.fy, 4, 4, pr.color);
      E(g, pr.fx, pr.fy, 2, 2, "#fff2a0");
    }
  }

  drawSlash(g, s) {
    const k = 1 - s.t / s.dur;
    g.globalAlpha = Math.max(0, k);
    const base = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[s.dir];
    for (let i = -4; i <= 4; i++) {
      const a = base + i * 0.26 + (1 - k) * 0.5;
      R(g, s.x + Math.cos(a) * 14 - 1, s.y + Math.sin(a) * 14 - 1, 3, 3, i === 0 ? "#ffffff" : "#ffe9b0");
    }
    g.globalAlpha = 1;
  }

  collectLights(cx, cy) {
    const lights = [...this.windowLights, ...(this.torches || []).map((tc) => ({ x: tc.x, y: tc.y - 2, r: 56, color: tc.color, flicker: true }))];
    const t = this.time;
    for (const o of this.objects) {
      if (o.gone) continue;
      const ox = o.x * T + 16, oy = o.y * T + 12;
      if (o.type === "lamp") lights.push({ x: ox, y: oy - 18, r: 70, color: o.color || "#ffc867", flicker: true });
      else if (o.type === "rose") lights.push({ x: ox, y: oy - 8, r: 60, color: "#ff8aa8" });
      else if (o.type === "key") lights.push({ x: ox, y: oy - 6, r: 44, color: "#ffd36a" });
      else if (o.type === "diamond") lights.push({ x: ox, y: oy, r: 26, color: "#ff8ad8" });
      else if (o.type === "exit") lights.push({ x: ox, y: oy, r: this.inv.key && this.inv.rose ? 90 : 40, color: "#ffe2a0" });
      else if ((o.type === "crystal" || o.type === "flowerSwitch") ) lights.push({ x: ox, y: oy - 8, r: o.lit || o.flash > 0 ? 64 : 22, color: o.color || "#7ad8ff" });
      else if (o.type === "target" && o.lit) lights.push({ x: ox, y: oy - 10, r: 50, color: "#ff9a2a", flicker: true });
      else if (o.type === "altar") lights.push({ x: ox, y: oy - 8, r: 34, color: "#c8b8ff" });
      else if (o.type === "turret") lights.push({ x: ox, y: oy + 2, r: 26, color: "#ff7a1a" });
      else if (o.type === "enemy" && o.alive && (o.look === "ghost" || o.look === "shade")) lights.push({ x: (o.px ?? 0) + 16, y: (o.py ?? 0) + 10, r: 34, color: "#c8b8ff" });
      else if (o.type === "plate" && this.platePressed(o)) lights.push({ x: ox, y: oy + 4, r: 26, color: "#6ae0a0" });
    }
    for (const pr of this.projectiles) if (pr.kind !== "arrow") lights.push({ x: pr.fx, y: pr.fy, r: 40, color: pr.color });
    lights.push({ x: this.player.px + 16, y: this.player.py + 14, r: this.theme.lighting?.player || 70, color: "#ffe2b0", soft: true });
    if (this.fairy.x) lights.push({ x: this.fairy.x, y: this.fairy.y, r: 38, color: "#ff9ad0" });
    return lights.filter((l) => l.x + l.r > cx && l.x - l.r < cx + VIEW_W && l.y + l.r > cy && l.y - l.r < cy + VIEW_H);
  }

  drawLighting(g, cx, cy, t) {
    const lt = this.theme.lighting;
    if (!lt) return;
    const { c, g: lg } = this.lightCanvas;
    const lights = this.collectLights(cx, cy);
    lg.globalCompositeOperation = "source-over";
    lg.clearRect(0, 0, VIEW_W, VIEW_H);
    lg.fillStyle = lt.ambient;
    lg.fillRect(0, 0, VIEW_W, VIEW_H);
    lg.globalCompositeOperation = "destination-out";
    for (const l of lights) {
      const fl = l.flicker ? 1 + Math.sin(t * 13 + l.x) * 0.04 : 1;
      const r = l.r * fl, x = l.x - cx, y = l.y - cy;
      const grd = lg.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(0,0,0,1)");
      grd.addColorStop(0.5, "rgba(0,0,0,0.6)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      lg.fillStyle = grd;
      lg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.save();
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(c, 0, 0);
    g.globalCompositeOperation = "lighter";
    for (const l of lights) {
      if (l.soft) continue;
      const x = l.x - cx, y = l.y - cy, r = l.r * 0.85;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, l.color);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = lt.glow ?? 0.25;
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.restore();
  }

  drawAmbient(g, t) {
    const amb = this.theme.ambient;
    if (!amb || !this.ambient) return;
    g.save();
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    this.ambient.forEach((a, i) => {
      const c = amb.colors[i % amb.colors.length];
      if (amb.type === "fireflies") {
        const v = (Math.sin(t * 2 + a.ph) + 1) / 2;
        g.globalAlpha = v * 0.45;
        g.fillStyle = c;
        g.fillRect(Math.round(a.x) - 2, Math.round(a.y) - 2, 5, 5);
        g.globalAlpha = 0.4 + v * 0.6;
        R(g, a.x, a.y, 1, 1, "#ffffff");
      } else if (amb.type === "sparkles") {
        const v = Math.sin(t * 3 + a.ph);
        if (v > 0.3) {
          g.globalAlpha = v;
          R(g, a.x, a.y, 1, 1, c);
          if (v > 0.85) {
            R(g, a.x - 1, a.y, 3, 1, c);
            R(g, a.x, a.y - 1, 1, 3, c);
          }
        }
      } else if (amb.type === "petals") {
        g.globalAlpha = 0.9;
        R(g, a.x, a.y, 2, Math.floor(t * 4 + a.ph) % 2 ? 1 : 2, c);
      } else if (amb.type === "fog") {
        g.globalAlpha = 0.025 + a.s * 0.025;
        g.fillStyle = c;
        g.beginPath();
        g.ellipse(a.x, a.y, 50 + a.s * 50, 10 + a.s * 8, 0, 0, Math.PI * 2);
        g.fill();
      } else if (amb.type === "seagulls" && a.s < 0.25) {
        const k = Math.floor(t * 4 + a.ph) % 2;
        g.globalAlpha = 0.8;
        R(g, a.x - 3, a.y - k, 3, 1, "#ffffff");
        R(g, a.x + 1, a.y - k, 3, 1, "#ffffff");
      }
    });
    g.restore();
    g.globalAlpha = 1;
  }
}
