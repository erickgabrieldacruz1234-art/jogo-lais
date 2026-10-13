// ============================================================================
// SPRITESHEETS DOS PERSONAGENS
// Cada animação: { row, from, count, flip }. Os quadros têm a base (pés)
// alinhada na parte de baixo, com 2px de margem.
// Para trocar um sprite, substitua o PNG mantendo a mesma grade — ou ajuste
// frameW/frameH e as linhas aqui.
// ============================================================================

export const CHARACTERS = {
  lais: {
    src: "/assets/sprites/characters/lais_v2.png",
    frameW: 65,
    frameH: 82,
    scale: 0.5,
    anims: {
      idle_down: { row: 0, from: 0, count: 4, fps: 4 },
      walk_down: { row: 1, from: 0, count: 6, fps: 10 },
      idle_up: { row: 2, from: 0, count: 4, fps: 4 },
      walk_up: { row: 3, from: 0, count: 6, fps: 10 },
      idle_right: { row: 4, from: 0, count: 4, fps: 4 },
      walk_right: { row: 4, from: 4, count: 6, fps: 10 },
      idle_left: { row: 4, from: 0, count: 4, fps: 4, flip: true },
      walk_left: { row: 4, from: 4, count: 6, fps: 10, flip: true }
    }
  },
  erick: {
    src: "/assets/sprites/characters/erick_v2.png",
    frameW: 57,
    frameH: 98,
    scale: 0.5,
    anims: {
      idle_down: { row: 0, from: 0, count: 4, fps: 4 },
      walk_down: { row: 0, from: 4, count: 6, fps: 10 },
      idle_up: { row: 1, from: 0, count: 4, fps: 4 },
      walk_up: { row: 1, from: 4, count: 6, fps: 10 },
      idle_left: { row: 2, from: 0, count: 4, fps: 4 },
      walk_left: { row: 2, from: 4, count: 6, fps: 10 },
      idle_right: { row: 3, from: 0, count: 4, fps: 4 },
      walk_right: { row: 3, from: 4, count: 6, fps: 10 }
    }
  }
};

/** Desenha um personagem com a base em (x, y) no contexto atual. */
export function drawCharacter(g, img, def, animName, time, x, y) {
  if (!img) return;
  const a = def.anims[animName] || def.anims.idle_down;
  const frame = a.from + (Math.floor(time * a.fps) % a.count);
  const dw = def.frameW * def.scale, dh = def.frameH * def.scale;
  const dx = Math.round((x - dw / 2) * 2) / 2;
  const dy = Math.round((y - dh + 1) * 2) / 2;
  if (a.flip) {
    g.save();
    g.translate(dx + dw, dy);
    g.scale(-1, 1);
    g.drawImage(img, frame * def.frameW, a.row * def.frameH, def.frameW, def.frameH, 0, 0, dw, dh);
    g.restore();
  } else {
    g.drawImage(img, frame * def.frameW, a.row * def.frameH, def.frameW, def.frameH, dx, dy, dw, dh);
  }
}
