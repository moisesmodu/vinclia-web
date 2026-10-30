import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { modalPanel, setModal } from '@comun/tienda';
import { UP_IDS, MAX_LVL, price, type UpId } from './vuelo';
import { save, levels } from './state';

/**
 * Mejoras del avión entre vuelos (el gancho del juego): alas, cola, peso, lanzador e imán, 10 niveles cada una con
 * precios crecientes. Se pagan con las mismas monedas que la tienda de cosméticos, pero van aparte: estas cambian
 * cómo vuela, la tienda solo cómo se ve. Ventana modal sin texto: icono, 10 puntos de nivel y precio.
 */

const INK = PALETTE.ink;
type G = Phaser.GameObjects.Graphics;
export const UP_COLORS: Record<UpId, number> = { wings: 0x4aa8ff, tail: 0x9b6bff, weight: 0xff7a5c, launch: 0x3ddc84, magnet: 0xff5d5d };

/** Compra un nivel si alcanza. Devuelve 'buy' | 'poor' | 'max'. Pura respecto a la escena. */
export function buyLevel(id: UpId): 'buy' | 'poor' | 'max' {
  const lv = levels();
  if (lv[id] >= MAX_LVL) return 'max';
  const p = price(id, lv[id]);
  const n = save.get('coins');
  if (n < p) return 'poor';
  save.set('coins', n - p);
  save.set('levels', { ...lv, [id]: lv[id] + 1 });
  return 'buy';
}

/** Hay alguna mejora que ya se puede pagar (punto rojo del botón). */
export function canUpgrade() {
  const lv = levels(), n = save.get('coins');
  return UP_IDS.some((k) => lv[k] < MAX_LVL && price(k, lv[k]) <= n);
}

/** Iconos de las cinco mejoras y del botón (128 px, blancos sobre el círculo de color). Una vez, en Boot. */
export function makeUpgradeIcons(scene: Phaser.Scene) {
  const draw: Record<string, (g: G, s: number) => void> = {
    // flecha hacia arriba con un ala detrás (botón de mejoras)
    upg: (g, s) => {
      g.fillStyle(0xffffff);
      g.fillTriangle(s * 0.5, s * 0.12, s * 0.18, s * 0.48, s * 0.82, s * 0.48);
      g.fillRect(s * 0.38, s * 0.46, s * 0.24, s * 0.36);
      g.fillRect(s * 0.24, s * 0.8, s * 0.52, s * 0.08);
    },
    wings: (g, s) => {
      g.fillStyle(0xffffff);
      g.fillTriangle(s * 0.08, s * 0.62, s * 0.92, s * 0.24, s * 0.5, s * 0.7);
      g.fillStyle(0xffffff, 0.6); g.fillTriangle(s * 0.5, s * 0.7, s * 0.92, s * 0.24, s * 0.62, s * 0.84);
    },
    tail: (g, s) => {
      g.fillStyle(0xffffff);
      g.fillTriangle(s * 0.2, s * 0.8, s * 0.82, s * 0.8, s * 0.7, s * 0.14);
      g.fillStyle(0xffffff, 0.6); g.fillRect(s * 0.1, s * 0.78, s * 0.8, s * 0.1);
    },
    weight: (g, s) => {
      g.fillStyle(0xffffff);
      g.lineStyle(s * 0.08, 0xffffff); g.strokeCircle(s * 0.5, s * 0.26, s * 0.12);
      g.fillTriangle(s * 0.3, s * 0.36, s * 0.7, s * 0.36, s * 0.86, s * 0.84);
      g.fillTriangle(s * 0.3, s * 0.36, s * 0.86, s * 0.84, s * 0.14, s * 0.84);
    },
    launch: (g, s) => {
      // tirachinas
      g.lineStyle(s * 0.1, 0xffffff);
      g.lineBetween(s * 0.5, s * 0.9, s * 0.5, s * 0.55);
      g.lineBetween(s * 0.5, s * 0.58, s * 0.24, s * 0.18); g.lineBetween(s * 0.5, s * 0.58, s * 0.76, s * 0.18);
      g.lineStyle(s * 0.05, 0xffffff, 0.7); g.lineBetween(s * 0.24, s * 0.2, s * 0.5, s * 0.4); g.lineBetween(s * 0.76, s * 0.2, s * 0.5, s * 0.4);
      g.fillStyle(0xffffff); g.fillCircle(s * 0.5, s * 0.4, s * 0.08);
    },
    magnet: (g, s) => {
      g.lineStyle(s * 0.2, 0xffffff); g.beginPath(); g.arc(s * 0.5, s * 0.46, s * 0.24, 0, Math.PI, false); g.strokePath();
      g.fillStyle(0xffffff); g.fillRect(s * 0.16, s * 0.18, s * 0.2, s * 0.28); g.fillRect(s * 0.64, s * 0.18, s * 0.2, s * 0.28);
      g.fillStyle(INK, 0.35); g.fillRect(s * 0.16, s * 0.18, s * 0.2, s * 0.1); g.fillRect(s * 0.64, s * 0.18, s * 0.2, s * 0.1);
    },
  };
  for (const [name, d] of Object.entries(draw)) {
    const key = `ic-${name}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    d(g, 128);
    g.generateTexture(key, 128, 128);
    g.destroy();
  }
}

/** Botón de mejoras (flecha arriba, naranja) con punto rojo si alcanza para alguna. */
export function upgradeButton(scene: Phaser.Scene, radius: number, onClick: () => void) {
  const b = iconButton(scene, 0, 0, 'upg', 0xff9f43, radius, onClick);
  const dot = scene.add.circle(radius * 0.72, -radius * 0.72, radius * 0.28, PALETTE.red).setStrokeStyle(radius * 0.11, PALETTE.white);
  b.add(dot);
  let tw: Phaser.Tweens.Tween | null = null;
  const refresh = () => {
    const on = canUpgrade();
    dot.setVisible(on);
    if (on && !tw) tw = scene.tweens.add({ targets: dot, scale: 1.25, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (!on && tw) { tw.stop(); tw = null; dot.setScale(1); }
  };
  refresh();
  return Object.assign(b, { refresh });
}

/** Ventana de mejoras. onWallet: el contador de monedas de la escena cambia. */
export function openUpgrades(scene: Phaser.Scene, o: { onWallet?: (n: number) => void; onClose?: () => void; depth?: number }) {
  let root: Phaser.GameObjects.Container | null = null;
  let closed = false;
  setModal(scene, true);
  const depth = o.depth ?? 60;

  const build = (flash?: UpId) => {
    root?.destroy();
    const w = scene.scale.width, h = scene.scale.height, portrait = h < w ? false : true;
    const pw = Math.min(w - 20, Math.max(1160, h * 1.6)), ph = Math.min(h - 20, portrait ? 900 : Math.max(500, h * 0.62));
    const c = modalPanel(scene, pw, ph, 0xeaf7ff, depth);
    root = c;
    const s = Phaser.Math.Clamp(Math.min(pw / 1000, ph / 520), 0.5, 1.6);
    const top = h / 2 - ph / 2, left = w / 2 - pw / 2;
    const headY = top + 50 * s;
    const badge = scene.add.circle(left + 54 * s, headY, 32 * s, 0xff9f43).setStrokeStyle(5 * s, INK);
    const bIc = scene.add.image(badge.x, headY, 'ic-upg').setDisplaySize(44 * s, 44 * s);
    const cur = scene.add.image(w / 2 - 40 * s, headY, 'coin').setDisplaySize(52 * s, 52 * s);
    const n = bigNumber(scene, cur.x + 34 * s, headY + 2 * s, 48 * s, `${save.get('coins')}`).setOrigin(0, 0.5);
    const close = iconButton(scene, left + pw - 48 * s, headY, 'x', PALETTE.red, 30 * s, () => shut());
    c.add([badge, bIc, cur, n, close]);

    // cartas: 5 en fila (apaisado) o 2 columnas (vertical)
    const cols = portrait ? 2 : 5, rows = Math.ceil(UP_IDS.length / cols);
    const gy0 = top + 96 * s, gh = ph - 112 * s, gw = pw - 30 * s;
    const cw = gw / cols, chh = gh / rows;
    const card = Math.min(cw * 0.92, chh * 0.92 * 0.8);
    const k = card / 200; // diseño a 200 × 250
    const lv = levels(), coins = save.get('coins');
    UP_IDS.forEach((id, i) => {
      const r = Math.floor(i / cols), col = i % cols;
      const inRow = Math.min(cols, UP_IDS.length - r * cols);
      const x = w / 2 + (col - (inRow - 1) / 2) * cw, y = gy0 + chh * (r + 0.5);
      const L = lv[id], max = L >= MAX_LVL, p = price(id, L), can = !max && p <= coins;
      const cc = scene.add.container(x, y);
      const g = scene.add.graphics();
      const hw = 100 * k, hh = 125 * k;
      g.fillStyle(0x000000, 0.18).fillRoundedRect(-hw, -hh + 8 * k, 2 * hw, 2 * hh, 22 * k);
      g.fillStyle(0xffffff).fillRoundedRect(-hw, -hh, 2 * hw, 2 * hh, 22 * k);
      g.lineStyle((can ? 9 : 6) * k, can ? PALETTE.green : INK).strokeRoundedRect(-hw, -hh, 2 * hw, 2 * hh, 22 * k);
      cc.add(g);
      const disc = scene.add.circle(0, -hh + 70 * k, 52 * k, UP_COLORS[id]).setStrokeStyle(6 * k, INK);
      const ic = scene.add.image(0, disc.y, `ic-${id}`).setDisplaySize(74 * k, 74 * k);
      cc.add([disc, ic]);
      // 10 puntos de nivel en 2 filas
      for (let j = 0; j < MAX_LVL; j++) {
        const px = (j % 5 - 2) * 30 * k, py = -hh + 146 * k + Math.floor(j / 5) * 28 * k;
        const on = j < L;
        cc.add(scene.add.circle(px, py, 10 * k, on ? UP_COLORS[id] : 0xe3e6ef).setStrokeStyle(4 * k, on ? INK : 0xb9bfd0));
      }
      const by = hh - 34 * k;
      if (max) {
        const ok = scene.add.circle(0, by, 22 * k, PALETTE.green).setStrokeStyle(5 * k, INK);
        cc.add([ok, scene.add.image(0, by, 'ic-ok').setDisplaySize(34 * k, 34 * k)]);
      } else {
        const ci = scene.add.image(0, by, 'coin').setDisplaySize(40 * k, 40 * k);
        const pn = bigNumber(scene, 0, by + 1 * k, 36 * k, `${p}`).setOrigin(0, 0.5);
        if (!can) pn.setColor('#ff8a8a');
        const tot = 40 * k + 6 * k + pn.displayWidth;
        ci.setX(-tot / 2 + 20 * k); pn.setX(ci.x + 26 * k);
        cc.add([ci, pn]);
        if (can) {
          const up = scene.add.circle(hw - 18 * k, -hh + 18 * k, 22 * k, PALETTE.green).setStrokeStyle(4 * k, PALETTE.white);
          const ua = scene.add.image(up.x, up.y, 'ic-upg').setDisplaySize(30 * k, 30 * k);
          cc.add([up, ua]);
          scene.tweens.add({ targets: [up, ua], scale: '*=1.15', duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
      }
      cc.setSize(2 * hw, 2 * hh).setInteractive({ useHandCursor: true }).setData('up', id);
      cc.on('pointerdown', () => scene.tweens.add({ targets: cc, scale: 0.94, duration: 60 }));
      cc.on('pointerout', () => scene.tweens.add({ targets: cc, scale: 1, duration: 80 }));
      cc.on('pointerup', () => {
        cc.setScale(1);
        const res = buyLevel(id);
        if (res !== 'buy') {
          audio.tone(180, 0.18, 'square', 0.08, 120);
          scene.tweens.add({ targets: cc, x: x + 8 * k, duration: 50, yoyo: true, repeat: 3, onComplete: () => cc.setX(x) });
          return;
        }
        [523, 784, 1047, 1319].forEach((f, j) => scene.time.delayedCall(j * 60, () => audio.tone(f, 0.14, 'triangle', 0.12)));
        o.onWallet?.(save.get('coins'));
        build(id);
      });
      if (flash === id) {
        const burst = scene.add.particles(0, disc.y, 'ic-star', {
          speed: { min: 140, max: 380 }, lifespan: 700, scale: { start: 0.3 * k, end: 0 }, gravityY: 500, emitting: false,
        });
        cc.add(burst);
        burst.explode(16);
        scene.tweens.add({ targets: [disc, ic], scale: '*=1.25', duration: 140, yoyo: true });
      }
      c.add(cc);
    });
    c.setData('upgrades', UP_IDS.length);
  };

  const onResize = () => build();
  const shut = () => {
    if (closed) return;
    closed = true;
    scene.scale.off('resize', onResize);
    root?.destroy();
    root = null;
    scene.time.delayedCall(50, () => setModal(scene, false));
    o.onWallet?.(save.get('coins'));
    o.onClose?.();
  };
  build();
  scene.scale.on('resize', onResize);
  scene.events.once('shutdown', () => { scene.scale.off('resize', onResize); setModal(scene, false); });
  return { close: shut, get container() { return root; } };
}
