import Phaser from 'phaser';
import { PALETTE } from './ui';

/**
 * Iconos extra para la tienda, la recompensa diaria y el botón ×2 (mismo estilo que comun/ui.ts: 128 px, dibujados
 * por código). Archivo aparte para no tocar la API de ui.ts que importan todos los juegos.
 *  ic-shop (bolsa, blanco), ic-ok (marca, blanco), ic-x (cerrar, blanco), ic-padlock (candado, blanco),
 *  ic-gift (regalo, a color), ic-coin (moneda, a color).
 */
type Draw = (g: Phaser.GameObjects.Graphics, s: number) => void;
const INK = PALETTE.ink, W = PALETTE.white;

const EXTRA: Record<string, Draw> = {
  shop: (g, s) => {
    g.fillStyle(W);
    g.fillRoundedRect(s * 0.2, s * 0.36, s * 0.6, s * 0.48, s * 0.08);
    g.lineStyle(s * 0.08, W);
    g.beginPath(); g.arc(s / 2, s * 0.38, s * 0.15, Math.PI, 0); g.strokePath();
    g.fillStyle(INK, 0.35); g.fillCircle(s * 0.38, s * 0.5, s * 0.04); g.fillCircle(s * 0.62, s * 0.5, s * 0.04);
  },
  ok: (g, s) => {
    g.lineStyle(s * 0.16, W);
    g.beginPath(); g.moveTo(s * 0.22, s * 0.52); g.lineTo(s * 0.43, s * 0.72); g.lineTo(s * 0.8, s * 0.3); g.strokePath();
    g.fillStyle(W); g.fillCircle(s * 0.22, s * 0.52, s * 0.08); g.fillCircle(s * 0.43, s * 0.72, s * 0.08); g.fillCircle(s * 0.8, s * 0.3, s * 0.08);
  },
  x: (g, s) => {
    g.lineStyle(s * 0.15, W);
    g.lineBetween(s * 0.28, s * 0.28, s * 0.72, s * 0.72); g.lineBetween(s * 0.72, s * 0.28, s * 0.28, s * 0.72);
    g.fillStyle(W);
    for (const [x, y] of [[0.28, 0.28], [0.72, 0.72], [0.72, 0.28], [0.28, 0.72]]) g.fillCircle(s * x, s * y, s * 0.075);
  },
  padlock: (g, s) => {
    g.lineStyle(s * 0.1, W); g.beginPath(); g.arc(s / 2, s * 0.42, s * 0.17, Math.PI, 0); g.strokePath();
    g.lineBetween(s * 0.33, s * 0.42, s * 0.33, s * 0.5); g.lineBetween(s * 0.67, s * 0.42, s * 0.67, s * 0.5);
    g.fillStyle(W); g.fillRoundedRect(s * 0.24, s * 0.48, s * 0.52, s * 0.36, s * 0.07);
    g.fillStyle(INK); g.fillCircle(s / 2, s * 0.63, s * 0.05);
  },
  gift: (g, s) => {
    g.lineStyle(s * 0.05, INK);
    g.fillStyle(0xff4f5e); g.fillRoundedRect(s * 0.16, s * 0.42, s * 0.68, s * 0.46, s * 0.05); g.strokeRoundedRect(s * 0.16, s * 0.42, s * 0.68, s * 0.46, s * 0.05);
    g.fillStyle(0xff7782); g.fillRoundedRect(s * 0.1, s * 0.3, s * 0.8, s * 0.16, s * 0.05); g.strokeRoundedRect(s * 0.1, s * 0.3, s * 0.8, s * 0.16, s * 0.05);
    g.fillStyle(PALETTE.yellow); g.fillRect(s * 0.44, s * 0.3, s * 0.12, s * 0.58);
    g.lineStyle(s * 0.04, INK); g.strokeRect(s * 0.44, s * 0.3, s * 0.12, s * 0.58);
    // lazo
    g.fillStyle(PALETTE.yellow); g.lineStyle(s * 0.045, INK);
    g.fillEllipse(s * 0.36, s * 0.22, s * 0.22, s * 0.14); g.strokeEllipse(s * 0.36, s * 0.22, s * 0.22, s * 0.14);
    g.fillEllipse(s * 0.64, s * 0.22, s * 0.22, s * 0.14); g.strokeEllipse(s * 0.64, s * 0.22, s * 0.22, s * 0.14);
    g.fillCircle(s / 2, s * 0.27, s * 0.06); g.strokeCircle(s / 2, s * 0.27, s * 0.06);
    g.fillStyle(W, 0.45); g.fillRect(s * 0.2, s * 0.47, s * 0.2, s * 0.04);
  },
  coin: (g, s) => {
    g.fillStyle(0xc98a00); g.fillCircle(s / 2, s * 0.53, s * 0.4);
    g.fillStyle(PALETTE.yellow); g.fillCircle(s / 2, s * 0.49, s * 0.4);
    g.lineStyle(s * 0.06, 0xc98a00); g.strokeCircle(s / 2, s * 0.49, s * 0.28);
    g.fillStyle(W, 0.7); g.fillRoundedRect(s * 0.44, s * 0.31, s * 0.12, s * 0.36, s * 0.05);
    g.lineStyle(s * 0.05, INK); g.strokeCircle(s / 2, s * 0.51, s * 0.42);
  },
};

/** Genera los iconos extra una vez (en Boot, después de makeIconTextures). */
export function makeExtraIcons(scene: Phaser.Scene, size = 128) {
  for (const [name, draw] of Object.entries(EXTRA)) {
    const key = `ic-${name}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(W);
    draw(g, size);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

/** Vuelve a generar una textura con la misma clave (para aplicar un cosmético: color nuevo del vehículo, etc.). */
export function redrawTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
