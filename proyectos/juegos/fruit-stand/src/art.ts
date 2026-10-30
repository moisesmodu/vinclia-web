import Phaser from 'phaser';
import { PALETTE } from '@comun/ui';
import { WORLD, COUNTER } from './data';

/** Gráficos de Fruit Stand dibujados por código (estilo Nuvolet: contorno grueso, colores planos) y horneados en texturas. */
export const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

export function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void, replace = false) {
  if (scene.textures.exists(key)) { if (!replace) return; scene.textures.remove(key); }
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const shadow = (g: G, x: number, y: number, w: number, h: number) => { g.fillStyle(0x000000, 0.18); g.fillEllipse(x, y, w, h); };

/* ------------------------------------------------------------------ frutas (40×40, centro 20,20) */
export function drawFruit(g: G, item: string, cx = 20, cy = 20, s = 1) {
  g.lineStyle(3 * s, INK);
  if (item === 'apple') {
    g.fillStyle(0xff4b4b); g.fillCircle(cx - 4 * s, cy + 2 * s, 12 * s); g.fillCircle(cx + 4 * s, cy + 2 * s, 12 * s);
    g.lineStyle(3 * s, INK); g.strokeCircle(cx - 4 * s, cy + 2 * s, 12 * s); g.strokeCircle(cx + 4 * s, cy + 2 * s, 12 * s);
    g.fillStyle(0xff4b4b); g.fillEllipse(cx, cy + 3 * s, 26 * s, 20 * s);
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(cx - 7 * s, cy - 3 * s, 6 * s, 8 * s);
    g.lineStyle(3 * s, 0x6b3b1e); g.lineBetween(cx, cy - 9 * s, cx + 2 * s, cy - 16 * s);
    g.fillStyle(0x3ddc84); g.fillEllipse(cx + 8 * s, cy - 13 * s, 11 * s, 6 * s); g.lineStyle(2 * s, INK); g.strokeEllipse(cx + 8 * s, cy - 13 * s, 11 * s, 6 * s);
  } else if (item === 'banana') {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.15 + 0.7 * (i / 12)); pts.push(V(cx + Math.cos(a) * 16 * s, cy - 10 * s + Math.sin(a) * 22 * s)); }
    for (let i = 12; i >= 0; i--) { const a = Math.PI * (0.15 + 0.7 * (i / 12)); pts.push(V(cx + Math.cos(a) * 12 * s, cy - 10 * s + Math.sin(a) * 13 * s)); }
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.lineStyle(3 * s, INK); g.strokePoints(pts, true, true);
    g.fillStyle(0x6b3b1e); g.fillCircle(pts[0].x, pts[0].y, 2.5 * s); g.fillCircle(pts[12].x, pts[12].y, 2.5 * s);
    g.fillStyle(0xffffff, 0.5); g.fillEllipse(cx - 2 * s, cy + 9 * s, 10 * s, 3 * s);
  } else if (item === 'orange') {
    g.fillStyle(0xff9a1f); g.fillCircle(cx, cy + 2 * s, 14 * s); g.strokeCircle(cx, cy + 2 * s, 14 * s);
    g.fillStyle(0xffffff, 0.55); g.fillEllipse(cx - 5 * s, cy - 4 * s, 6 * s, 7 * s);
    g.fillStyle(0xd97a00); for (const [a, b] of [[5, 6], [-3, 9], [7, -2]]) g.fillCircle(cx + a * s, cy + b * s, 1.3 * s);
    g.fillStyle(0x3ddc84); g.fillEllipse(cx + 4 * s, cy - 13 * s, 10 * s, 5 * s); g.lineStyle(2 * s, INK); g.strokeEllipse(cx + 4 * s, cy - 13 * s, 10 * s, 5 * s);
  } else if (item === 'melon') {
    g.fillStyle(0x3fae4a); g.fillEllipse(cx, cy + 2 * s, 34 * s, 26 * s);
    g.lineStyle(3 * s, 0x1f7a2e);
    for (const k of [-10, -3, 4, 11]) { g.beginPath(); g.arc(cx + k * s - 30 * s, cy + 2 * s, 30 * s, -0.42, 0.42); g.strokePath(); }
    g.lineStyle(3 * s, INK); g.strokeEllipse(cx, cy + 2 * s, 34 * s, 26 * s);
    g.fillStyle(0xffffff, 0.45); g.fillEllipse(cx - 7 * s, cy - 4 * s, 9 * s, 5 * s);
  } else if (item === 'juice') {
    g.fillStyle(0xffffff, 0.85); g.fillRoundedRect(cx - 10 * s, cy - 10 * s, 20 * s, 26 * s, 4 * s);
    g.fillStyle(0xffa62b); g.fillRoundedRect(cx - 8 * s, cy - 3 * s, 16 * s, 17 * s, 3 * s);
    g.lineStyle(3 * s, INK); g.strokeRoundedRect(cx - 10 * s, cy - 10 * s, 20 * s, 26 * s, 4 * s);
    g.lineStyle(3 * s, 0xff5d8f); g.lineBetween(cx + 3 * s, cy - 2 * s, cx + 8 * s, cy - 18 * s);
    g.fillStyle(0xffd23f); g.fillCircle(cx - 9 * s, cy - 9 * s, 5 * s); g.lineStyle(2 * s, INK); g.strokeCircle(cx - 9 * s, cy - 9 * s, 5 * s);
  }
}

/* ------------------------------------------------------------------ personajes (64×88, pies en 32,80) */
const SKIN = [0xffd9b3, 0xf2c094, 0xc98e63, 0x8d5a3b];
const HAIR = [0x6b3b1e, 0x2b2340, 0xffc94a, 0xd9572b, 0x8a5a3c, 0x4a3a6b];

export function drawPerson(g: G, o: { shirt: number; apron?: number; skin: number; hair: number; cap?: number; vest?: number }) {
  shadow(g, 32, 80, 40, 12);
  g.lineStyle(4, INK);
  // pies
  g.fillStyle(0x4a3a2a); g.fillEllipse(24, 77, 13, 8); g.fillEllipse(40, 77, 13, 8);
  // cuerpo
  g.fillStyle(o.shirt); g.fillRoundedRect(14, 44, 36, 32, 14); g.strokeRoundedRect(14, 44, 36, 32, 14);
  if (o.apron !== undefined) {
    g.fillStyle(o.apron); g.fillRoundedRect(19, 52, 26, 24, { tl: 4, tr: 4, bl: 12, br: 12 });
    g.lineStyle(3, INK); g.strokeRoundedRect(19, 52, 26, 24, { tl: 4, tr: 4, bl: 12, br: 12 });
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(25, 62, 14, 6, 3);
  }
  if (o.vest !== undefined) {
    g.fillStyle(o.vest); g.fillRect(16, 50, 9, 22); g.fillRect(39, 50, 9, 22);
    g.lineStyle(3, INK); g.strokeRect(16, 50, 9, 22); g.strokeRect(39, 50, 9, 22);
  }
  // brazos
  g.fillStyle(o.skin); g.lineStyle(3, INK);
  g.fillCircle(13, 60, 6); g.strokeCircle(13, 60, 6); g.fillCircle(51, 60, 6); g.strokeCircle(51, 60, 6);
  // cabeza
  g.fillStyle(o.skin); g.lineStyle(4, INK); g.fillCircle(32, 28, 21); g.strokeCircle(32, 28, 21);
  // pelo
  g.fillStyle(o.hair); g.beginPath(); g.arc(32, 26, 21, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fillPath();
  g.fillCircle(20, 16, 8); g.fillCircle(31, 11, 9); g.fillCircle(43, 15, 8);
  g.lineStyle(4, INK); g.strokeCircle(32, 28, 21);
  // cara
  g.fillStyle(INK); g.fillEllipse(25, 31, 5, 7); g.fillEllipse(39, 31, 5, 7);
  g.fillStyle(0xffffff); g.fillCircle(26, 29, 1.6); g.fillCircle(40, 29, 1.6);
  g.fillStyle(0xff8fa3, 0.75); g.fillCircle(19, 37, 4); g.fillCircle(45, 37, 4);
  g.lineStyle(2.5, INK); g.beginPath(); g.arc(32, 37, 5, 0.25, Math.PI - 0.25); g.strokePath();
  if (o.cap !== undefined) {
    g.fillStyle(o.cap); g.lineStyle(3, INK);
    g.beginPath(); g.arc(32, 16, 17, Math.PI, 0); g.closePath(); g.fillPath(); g.strokePath();
    g.fillRoundedRect(30, 12, 26, 7, 3); g.strokeRoundedRect(30, 12, 26, 7, 3);
  }
}

export const APRONS: Record<string, number> = { green: 0x3ddc84, blue: 0x4aa8ff, purple: 0x9b6bff, pink: 0xff6fae, gold: 0xffc21a };
export const AWNINGS: Record<string, [number, number]> = {
  red: [0xff4b4b, 0xffffff], blue: [0x4aa8ff, 0xffffff], green: [0x3ddc84, 0xfff6c8], purple: [0x9b6bff, 0xffe066], sun: [0xffc21a, 0xff7a3d],
};

/** Texturas que no dependen de cosméticos. */
export function makeArt(scene: Phaser.Scene) {
  for (const f of ['apple', 'banana', 'orange', 'melon', 'juice']) tex(scene, `f-${f}`, 40, 40, (g) => drawFruit(g, f));
  // clientes: 6 combinaciones de camiseta, piel y pelo
  const shirts = [0x4aa8ff, 0xff6fae, 0xffd23f, 0x9b6bff, 0x3fcfc4, 0xff8a4c];
  shirts.forEach((sh, i) => tex(scene, `cust${i}`, 64, 88, (g) => drawPerson(g, { shirt: sh, skin: SKIN[i % 4], hair: HAIR[i], cap: i === 2 ? 0x3ddc84 : i === 5 ? 0x4aa8ff : undefined })));
  tex(scene, 'helper', 64, 88, (g) => drawPerson(g, { shirt: 0xffffff, vest: 0xff8a1f, skin: SKIN[1], hair: HAIR[0], cap: 0xff8a1f }));
  tex(scene, 'cashier', 64, 88, (g) => drawPerson(g, { shirt: 0xffffff, vest: 0x9b6bff, skin: SKIN[2], hair: HAIR[1], cap: 0x9b6bff }));
  makeTrees(scene);
  makeProps(scene);
  makePadIcons(scene);
}

function makeTrees(scene: Phaser.Scene) {
  // manzano: copa redonda; platanero: hojas largas; naranjo: copa más oscura; sandía: mata en el suelo
  tex(scene, 'tree-apple', 150, 170, (g) => {
    shadow(g, 75, 156, 110, 26);
    g.fillStyle(0x8a5a3c); g.lineStyle(5, INK); g.fillRoundedRect(63, 96, 24, 60, 8); g.strokeRoundedRect(63, 96, 24, 60, 8);
    g.fillStyle(0x3fb950);
    for (const [x, y, r] of [[45, 70, 36], [105, 70, 36], [75, 45, 42], [75, 90, 34]]) g.fillCircle(x, y, r);
    g.lineStyle(5, INK); for (const [x, y, r] of [[45, 70, 36], [105, 70, 36], [75, 45, 42], [75, 90, 34]]) g.strokeCircle(x, y, r);
    g.fillStyle(0x3fb950); g.fillCircle(75, 70, 40);
    g.fillStyle(0x6fd96b); g.fillCircle(58, 38, 14); g.fillCircle(96, 52, 10);
  });
  tex(scene, 'tree-orange', 150, 170, (g) => {
    shadow(g, 75, 156, 110, 26);
    g.fillStyle(0x8a5a3c); g.lineStyle(5, INK); g.fillRoundedRect(63, 100, 24, 56, 8); g.strokeRoundedRect(63, 100, 24, 56, 8);
    g.fillStyle(0x1f9e5a); g.fillCircle(75, 66, 56); g.lineStyle(5, INK); g.strokeCircle(75, 66, 56);
    g.fillStyle(0x3dc47a); g.fillCircle(55, 44, 16); g.fillCircle(98, 60, 10);
  });
  tex(scene, 'tree-banana', 150, 170, (g) => {
    shadow(g, 75, 156, 90, 22);
    g.fillStyle(0xb58a4c); g.lineStyle(5, INK); g.fillRoundedRect(66, 70, 18, 86, 7); g.strokeRoundedRect(66, 70, 18, 86, 7);
    g.lineStyle(3, 0x8a6a3c); for (let y = 86; y < 150; y += 14) g.lineBetween(68, y, 82, y + 4);
    const leaf = (a: number) => {
      const ex = 75 + Math.cos(a) * 70, ey = 62 + Math.sin(a) * 46;
      const nx = -Math.sin(a) * 16, ny = Math.cos(a) * 12;
      const pts = [V(75, 62), V((75 + ex) / 2 + nx, (62 + ey) / 2 + ny), V(ex, ey), V((75 + ex) / 2 - nx, (62 + ey) / 2 - ny)];
      g.fillStyle(0x4cc95a); g.fillPoints(pts, true); g.lineStyle(4, INK); g.strokePoints(pts, true, true);
      g.lineStyle(2, 0x2f8f3e); g.lineBetween(75, 62, ex, ey);
    };
    for (const a of [-2.9, -2.2, -1.57, -0.9, -0.25, 2.7, 0.45]) leaf(a);
  });
  tex(scene, 'tree-melon', 150, 170, (g) => {
    shadow(g, 75, 140, 130, 30);
    g.fillStyle(0x9a6a44); g.lineStyle(5, INK); g.fillRoundedRect(12, 70, 126, 70, 26); g.strokeRoundedRect(12, 70, 126, 70, 26);
    g.lineStyle(3, 0x7a5030); for (const y of [90, 108, 124]) g.lineBetween(26, y, 124, y);
    g.lineStyle(4, 0x2f9e3e);
    g.beginPath(); g.moveTo(20, 100); g.lineTo(50, 86); g.lineTo(80, 104); g.lineTo(112, 84); g.lineTo(132, 100); g.strokePath();
    g.fillStyle(0x4cc95a); g.lineStyle(3, INK);
    for (const [x, y] of [[30, 84], [64, 100], [96, 82], [124, 112], [40, 124], [86, 128]]) { g.fillEllipse(x, y, 26, 18); g.strokeEllipse(x, y, 26, 18); }
  });
}

/** Posiciones de la fruta sobre cada árbol (respecto al centro de la textura). */
export const FRUIT_SPOTS: Record<string, [number, number][]> = {
  apple: [[-28, -18], [22, -34], [12, 4]],
  orange: [[-26, -30], [24, -20], [-4, 0]],
  banana: [[-8, -18], [8, -14], [0, -6]],
  melon: [[-30, 20], [26, 26]],
};

function makeProps(scene: Phaser.Scene) {
  // estante: mesa de madera con dos filas de cajas (8 huecos)
  tex(scene, 'shelf', 150, 110, (g) => {
    shadow(g, 75, 98, 140, 22);
    g.fillStyle(0x8a5a3c); g.lineStyle(5, INK);
    g.fillRect(16, 70, 10, 26); g.fillRect(124, 70, 10, 26); g.strokeRect(16, 70, 10, 26); g.strokeRect(124, 70, 10, 26);
    g.fillStyle(0xd9a066); g.fillRoundedRect(6, 16, 138, 66, 10); g.strokeRoundedRect(6, 16, 138, 66, 10);
    g.fillStyle(0xc28a52); g.fillRoundedRect(12, 22, 126, 26, 6); g.fillRoundedRect(12, 52, 126, 26, 6);
    g.lineStyle(3, 0x9a6a3c); for (const x of [43, 75, 107]) { g.lineBetween(x, 24, x, 46); g.lineBetween(x, 54, x, 76); }
    g.fillStyle(0xffffff, 0.3); g.fillRoundedRect(14, 18, 120, 4, 2);
  });
  // máquina de zumo: depósito naranja y bandeja delante
  tex(scene, 'machine', 150, 130, (g) => {
    shadow(g, 75, 118, 140, 22);
    g.lineStyle(5, INK);
    g.fillStyle(0xd9a066); g.fillRoundedRect(6, 66, 138, 46, 10); g.strokeRoundedRect(6, 66, 138, 46, 10);
    g.fillStyle(0xc9d3e0); g.fillRoundedRect(38, 8, 74, 66, 14); g.strokeRoundedRect(38, 8, 74, 66, 14);
    g.fillStyle(0xbfe9ff, 0.9); g.fillRoundedRect(50, 16, 50, 34, 10); g.lineStyle(4, INK); g.strokeRoundedRect(50, 16, 50, 34, 10);
    g.fillStyle(0xffa62b); g.fillRoundedRect(53, 30, 44, 17, 6);
    g.fillStyle(0xff5d5d); g.fillCircle(60, 60, 5); g.fillStyle(0x3ddc84); g.fillCircle(75, 60, 5); g.lineStyle(2, INK); g.strokeCircle(60, 60, 5); g.strokeCircle(75, 60, 5);
    g.fillStyle(0x8a94a6); g.fillRect(86, 54, 12, 14); g.lineStyle(3, INK); g.strokeRect(86, 54, 12, 14);
  });
  tex(scene, 'register', 50, 44, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0x7a8494); g.fillRoundedRect(4, 14, 42, 26, 6); g.strokeRoundedRect(4, 14, 42, 26, 6);
    g.fillStyle(0x3ddc84); g.fillRoundedRect(10, 3, 30, 14, 4); g.strokeRoundedRect(10, 3, 30, 14, 4);
    g.fillStyle(0xffffff); for (let i = 0; i < 3; i++) g.fillRect(12 + i * 10, 24, 6, 4);
  });
  tex(scene, 'coin', 34, 34, (g) => {
    g.fillStyle(0xc98a00); g.fillCircle(17, 19, 14); g.fillStyle(0xffd23f); g.fillCircle(17, 16, 14);
    g.lineStyle(3, INK); g.strokeCircle(17, 17, 15); g.fillStyle(0xffffff, 0.7); g.fillRect(15, 9, 4, 13);
  });
  tex(scene, 'dot', 12, 12, (g) => { g.fillStyle(0xffffff); g.fillCircle(6, 6, 6); });
  tex(scene, 'leaf', 16, 12, (g) => { g.fillStyle(0x4cc95a); g.fillEllipse(8, 6, 14, 8); });
  // alfombrilla de compra (borde blanco a trazos sobre fondo translúcido)
  tex(scene, 'pad', 120, 120, (g) => {
    g.fillStyle(0x2b2340, 0.18); g.fillRoundedRect(4, 8, 112, 108, 24);
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(4, 4, 112, 108, 24);
    g.fillStyle(0xffffff);
    for (let i = 0; i < 12; i++) {
      const t = i / 12, side = Math.floor(t * 4), u = (t * 4) % 1;
      const x = side === 0 ? 14 + u * 92 : side === 1 ? 106 : side === 2 ? 106 - u * 92 : 14;
      const y = side === 0 ? 14 : side === 1 ? 14 + u * 88 : side === 2 ? 102 : 102 - u * 88;
      g.fillRoundedRect(x - 6, y - 6, 12, 12, 4);
    }
  });
  tex(scene, 'bubble', 56, 56, (g) => {
    g.fillStyle(0xffffff); g.lineStyle(4, INK);
    g.fillCircle(28, 24, 21); g.strokeCircle(28, 24, 21);
    g.fillTriangle(20, 40, 30, 40, 18, 52); g.lineBetween(20, 42, 18, 52); g.lineBetween(18, 52, 30, 43);
    g.fillStyle(0xffffff); g.fillCircle(28, 24, 18);
  });
  tex(scene, 'arrow', 64, 64, (g) => {
    g.fillStyle(0xffd23f); g.lineStyle(5, INK);
    const pts = [V(32, 60), V(6, 30), V(20, 30), V(20, 4), V(44, 4), V(44, 30), V(58, 30)];
    g.fillPoints(pts, true); g.strokePoints(pts, true, true);
  });
  tex(scene, 'ring', 96, 96, (g) => { g.lineStyle(8, 0xffffff, 0.9); g.strokeCircle(48, 48, 42); });
  tex(scene, 'stick-base', 120, 120, (g) => { g.fillStyle(0xffffff, 0.22); g.fillCircle(60, 60, 56); g.lineStyle(6, 0xffffff, 0.6); g.strokeCircle(60, 60, 54); });
  tex(scene, 'stick-knob', 60, 60, (g) => { g.fillStyle(0xffffff, 0.85); g.fillCircle(30, 30, 26); g.lineStyle(5, INK, 0.5); g.strokeCircle(30, 30, 25); });
}

/** Iconos de las alfombrillas (64×64, a color). */
function makePadIcons(scene: Phaser.Scene) {
  tex(scene, 'pi-cap', 64, 64, (g) => {
    // mochila: más capacidad
    g.lineStyle(4, INK); g.fillStyle(0xff8a4c); g.fillRoundedRect(12, 14, 40, 44, 12); g.strokeRoundedRect(12, 14, 40, 44, 12);
    g.fillStyle(0xffb27a); g.fillRoundedRect(18, 34, 28, 18, 6); g.strokeRoundedRect(18, 34, 28, 18, 6);
    g.lineStyle(4, INK); g.beginPath(); g.arc(32, 14, 9, Math.PI, 0); g.strokePath();
    g.fillStyle(0xffffff); g.fillRect(29, 38, 6, 12); g.fillRect(26, 41, 12, 6);
  });
  tex(scene, 'pi-speed', 64, 64, (g) => {
    // zapatilla con rayas de velocidad
    g.lineStyle(4, INK); g.fillStyle(0x4aa8ff);
    const pts = [V(14, 22), V(30, 22), V(34, 34), V(56, 40), V(58, 50), V(12, 50)];
    g.fillPoints(pts, true); g.strokePoints(pts, true, true);
    g.fillStyle(0xffffff); g.fillRect(12, 46, 46, 6); g.lineStyle(3, INK); g.strokeRect(12, 46, 46, 6);
    g.lineStyle(4, 0xffffff); g.lineBetween(2, 28, 10, 28); g.lineBetween(0, 38, 8, 38);
  });
  tex(scene, 'pi-helper', 64, 64, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xf2c094); g.fillCircle(32, 34, 20); g.strokeCircle(32, 34, 20);
    g.fillStyle(0xff8a1f); g.beginPath(); g.arc(32, 28, 20, Math.PI, 0); g.closePath(); g.fillPath(); g.strokePath();
    g.fillRoundedRect(30, 24, 26, 7, 3); g.strokeRoundedRect(30, 24, 26, 7, 3);
    g.fillStyle(INK); g.fillCircle(25, 38, 3); g.fillCircle(39, 38, 3);
    g.lineStyle(3, INK); g.beginPath(); g.arc(32, 42, 5, 0.3, Math.PI - 0.3); g.strokePath();
    g.fillStyle(0x3ddc84); g.fillCircle(52, 52, 10); g.lineStyle(3, INK); g.strokeCircle(52, 52, 10);
    g.fillStyle(0xffffff); g.fillRect(50, 46, 4, 12); g.fillRect(46, 50, 12, 4);
  });
  tex(scene, 'pi-cashier', 64, 64, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0x7a8494); g.fillRoundedRect(8, 26, 48, 30, 6); g.strokeRoundedRect(8, 26, 48, 30, 6);
    g.fillStyle(0x3ddc84); g.fillRoundedRect(16, 10, 32, 18, 4); g.strokeRoundedRect(16, 10, 32, 18, 4);
    g.fillStyle(0xffd23f); g.fillCircle(46, 44, 9); g.lineStyle(3, INK); g.strokeCircle(46, 44, 9);
  });
  tex(scene, 'pi-gate', 64, 64, (g) => {
    // cartel con flecha: siguiente puesto
    g.lineStyle(4, INK); g.fillStyle(0x8a5a3c); g.fillRect(28, 30, 8, 30); g.strokeRect(28, 30, 8, 30);
    g.fillStyle(0x3ddc84); const pts = [V(8, 12), V(42, 12), V(58, 26), V(42, 40), V(8, 40)];
    g.fillPoints(pts, true); g.strokePoints(pts, true, true);
    g.fillStyle(0xffffff); g.fillTriangle(24, 18, 24, 34, 40, 26);
  });
  tex(scene, 'pi-shelf', 64, 64, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0xd9a066); g.fillRoundedRect(6, 22, 52, 30, 6); g.strokeRoundedRect(6, 22, 52, 30, 6);
    g.lineStyle(3, 0x9a6a3c); g.lineBetween(32, 26, 32, 48);
  });
  tex(scene, 'pi-tree', 64, 64, (g) => {
    g.lineStyle(4, INK); g.fillStyle(0x8a5a3c); g.fillRect(28, 38, 8, 20); g.strokeRect(28, 38, 8, 20);
    g.fillStyle(0x3fb950); g.fillCircle(32, 28, 20); g.strokeCircle(32, 28, 20);
  });
  tex(scene, 'pi-star', 64, 64, (g) => {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 12 : 28, a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push(V(32 + Math.cos(a) * r, 34 + Math.sin(a) * r)); }
    g.fillStyle(0xffd23f); g.fillPoints(pts, true); g.lineStyle(4, INK); g.strokePoints(pts, true, true);
  });
  tex(scene, 'ic-bolt', 128, 128, (g) => {
    g.fillStyle(0xffffff);
    g.fillPoints([V(72, 8), V(30, 72), V(60, 72), V(48, 120), V(98, 50), V(66, 50), V(84, 8)], true);
  });
}

/** Mostrador con toldo (color del cosmético). */
export function makeCounter(scene: Phaser.Scene, awning: string) {
  const [a, b] = AWNINGS[awning] ?? AWNINGS.red;
  tex(scene, 'counter', 200, 190, (g) => {
    shadow(g, 100, 172, 190, 30);
    g.lineStyle(5, INK);
    g.fillStyle(0x8a5a3c); g.fillRect(14, 40, 12, 120); g.fillRect(174, 40, 12, 120); g.strokeRect(14, 40, 12, 120); g.strokeRect(174, 40, 12, 120);
    // mostrador
    g.fillStyle(0xd9a066); g.fillRoundedRect(8, 104, 184, 62, 10); g.strokeRoundedRect(8, 104, 184, 62, 10);
    g.lineStyle(3, 0x9a6a3c); for (const x of [54, 100, 146]) g.lineBetween(x, 124, x, 160);
    g.fillStyle(0xe8b67a); g.fillRoundedRect(8, 104, 184, 18, { tl: 10, tr: 10, bl: 0, br: 0 });
    // toldo a rayas
    const n = 7, w = 196 / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle(i % 2 ? b : a); g.fillRect(2 + i * w, 10, w, 40);
      g.beginPath(); g.arc(2 + i * w + w / 2, 50, w / 2, 0, Math.PI); g.closePath(); g.fillPath();
    }
    g.lineStyle(5, INK); g.strokeRect(2, 10, 196, 40);
    for (let i = 0; i < n; i++) { g.beginPath(); g.arc(2 + i * w + w / 2, 50, w / 2, 0, Math.PI); g.strokePath(); }
    g.fillStyle(0xffffff, 0.3); g.fillRect(6, 14, 188, 6);
  }, true);
  tex(scene, 'awn-' + awning, 120, 80, (g) => {
    const n = 5, w = 110 / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle(i % 2 ? b : a); g.fillRect(5 + i * w, 10, w, 36);
      g.beginPath(); g.arc(5 + i * w + w / 2, 46, w / 2, 0, Math.PI); g.closePath(); g.fillPath();
    }
    g.lineStyle(5, INK); g.strokeRect(5, 10, 110, 36);
    for (let i = 0; i < n; i++) { g.beginPath(); g.arc(5 + i * w + w / 2, 46, w / 2, 0, Math.PI); g.strokePath(); }
    g.fillStyle(0x8a5a3c); g.fillRect(10, 46, 8, 30); g.fillRect(102, 46, 8, 30); g.lineStyle(4, INK); g.strokeRect(10, 46, 8, 30); g.strokeRect(102, 46, 8, 30);
  });
}

/* ------------------------------------------------------------------ suelo de cada puesto (una textura grande) */
export const THEME_BG: Record<string, number> = { orchard: 0x5fb54a, village: 0x6aa84f, city: 0x8d97a6 };

export function makeGround(scene: Phaser.Scene, theme: string) {
  const key = `ground-${theme}`;
  if (scene.textures.exists(key)) return key;
  const W = WORLD.w, H = WORLD.h;
  // a media resolución (se dibuja ×2): la cuarta parte de memoria de vídeo
  const k = 0.5;
  tex(scene, key, W * k, H * k, (g) => {
    const R = (x: number, y: number, w: number, h: number, r = 0) => (r ? g.fillRoundedRect(x * k, y * k, w * k, h * k, r * k) : g.fillRect(x * k, y * k, w * k, h * k));
    const C = (x: number, y: number, r: number) => g.fillCircle(x * k, y * k, r * k);
    let seed = theme.length * 977;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (theme === 'city') {
      g.fillStyle(0xb7bfcc); R(0, 0, W, H);
      g.lineStyle(2, 0x9aa3b2);
      for (let x = 0; x <= W; x += 80) g.lineBetween(x * k, 0, x * k, H * k);
      for (let y = 0; y <= H; y += 80) g.lineBetween(0, y * k, W * k, y * k);
      // edificios arriba
      const cols = [0xff8a7a, 0xffd27a, 0x8ac7ff, 0xb59cff, 0x9be3b0];
      for (let x = 0, i = 0; x < W; i++) {
        const w = 150 + rnd() * 90;
        g.fillStyle(cols[i % cols.length]); R(x, 0, w - 8, 70);
        g.fillStyle(0xffffff, 0.75); for (let wx = x + 18; wx < x + w - 40; wx += 40) R(wx, 18, 22, 30, 4);
        x += w;
      }
      g.fillStyle(0x6b7488); R(0, 70, W, 10);
      // jardineras
      for (const [x, y] of [[40, 300], [40, 600], [1360, 700], [640, 960]]) { g.fillStyle(0x8a5a3c); C(x, y, 30); g.fillStyle(0x4cc95a); C(x, y - 6, 26); }
      // huerto urbano: tierra
      g.fillStyle(0x7fb35a); R(40, 120, 560, 660, 30);
    } else {
      g.fillStyle(theme === 'village' ? 0x86c95a : 0x8fd36b); R(0, 0, W, H);
      // manchas de hierba
      for (let i = 0; i < 140; i++) { g.fillStyle(rnd() < 0.5 ? 0x9ddc78 : 0x7fc45c, 0.6); C(rnd() * W, rnd() * H, 8 + rnd() * 26); }
      if (theme === 'village') {
        // plaza empedrada bajo el puesto
        g.fillStyle(0xe2cfa6); R(600, 180, 800, 820, 40);
        for (let i = 0; i < 260; i++) { g.fillStyle(rnd() < 0.5 ? 0xd2bd92 : 0xeedcb8); g.fillEllipse((620 + rnd() * 760) * k, (200 + rnd() * 780) * k, (22 + rnd() * 16) * k, (14 + rnd() * 8) * k); }
      } else {
        // camino de tierra hacia el mostrador
        g.fillStyle(0xe8c98f); R(600, 220, 760, 120, 50); R(1020, 300, 200, 700, 60); R(600, 220, 120, 560, 50);
      }
      // flores
      for (let i = 0; i < 70; i++) {
        const x = rnd() * W, y = rnd() * H;
        g.fillStyle([0xffffff, 0xffe066, 0xff8fb8][i % 3]); C(x, y, 5); g.fillStyle(0xffd23f); C(x, y, 2);
      }
    }
    // valla alrededor
    g.fillStyle(theme === 'city' ? 0x6b7488 : 0x8a5a3c);
    for (let x = 10; x < W; x += 60) { R(x, 4, 14, 26, 4); R(x, H - 26, 14, 24, 4); }
    for (let y = 10; y < H; y += 60) { R(4, y, 14, 26, 4); R(W - 18, y, 14, 26, 4); }
    R(0, 14, W, 8); R(0, H - 18, W, 8); R(6, 0, 8, H); R(W - 14, 0, 8, H);
    // entrada de clientes abajo a la derecha
    g.fillStyle(theme === 'city' ? 0xb7bfcc : 0xe8c98f); R(1000, H - 40, 400, 40);
    // alfombrillas de mejoras (zona marcada)
    g.fillStyle(0xffffff, 0.18); R(70, 810, 620, 150, 30);
  });
  return key;
}

export const COUNTER_POS = COUNTER;
