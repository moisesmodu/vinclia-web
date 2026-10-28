import Phaser from 'phaser';

/**
 * Interfaz sin texto: iconos dibujados por código (ningún archivo que descargar) y botones redondos
 * grandes, pensados para el dedo. Así el juego vale para cualquier país sin traducir nada.
 */

export const PALETTE = {
  ink: 0x2b2340,
  white: 0xffffff,
  yellow: 0xffd23f,
  green: 0x3ddc84,
  red: 0xff5d5d,
  blue: 0x4aa8ff,
  purple: 0x9b6bff,
};

type Draw = (g: Phaser.GameObjects.Graphics, s: number) => void;

const ICONS: Record<string, Draw> = {
  play: (g, s) => { g.fillTriangle(s * 0.36, s * 0.24, s * 0.36, s * 0.76, s * 0.8, s * 0.5); },
  replay: (g, s) => {
    g.lineStyle(s * 0.12, PALETTE.white);
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.27, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(240));
    g.strokePath();
    const a = Phaser.Math.DegToRad(-60);
    const x = s / 2 + Math.cos(a) * s * 0.27, y = s / 2 + Math.sin(a) * s * 0.27;
    g.fillTriangle(x - s * 0.15, y - s * 0.06, x + s * 0.1, y - s * 0.12, x + s * 0.02, y + s * 0.14);
  },
  home: (g, s) => {
    g.fillTriangle(s * 0.18, s * 0.5, s * 0.5, s * 0.2, s * 0.82, s * 0.5);
    g.fillRect(s * 0.28, s * 0.48, s * 0.44, s * 0.3);
  },
  sound: (g, s) => {
    g.fillRect(s * 0.2, s * 0.4, s * 0.14, s * 0.2);
    g.fillTriangle(s * 0.3, s * 0.4, s * 0.52, s * 0.22, s * 0.52, s * 0.5);
    g.fillTriangle(s * 0.3, s * 0.6, s * 0.52, s * 0.78, s * 0.52, s * 0.5);
    g.lineStyle(s * 0.07, PALETTE.white);
    g.beginPath(); g.arc(s * 0.52, s * 0.5, s * 0.16, -0.9, 0.9); g.strokePath();
    g.beginPath(); g.arc(s * 0.52, s * 0.5, s * 0.28, -0.9, 0.9); g.strokePath();
  },
  mute: (g, s) => {
    ICONS.sound(g, s);
    g.lineStyle(s * 0.09, PALETTE.red);
    g.lineBetween(s * 0.18, s * 0.18, s * 0.82, s * 0.82);
  },
  video: (g, s) => {
    g.fillRoundedRect(s * 0.16, s * 0.3, s * 0.48, s * 0.4, s * 0.07);
    g.fillTriangle(s * 0.62, s * 0.5, s * 0.86, s * 0.32, s * 0.86, s * 0.68);
  },
  trophy: (g, s) => {
    g.fillStyle(PALETTE.yellow);
    g.fillRoundedRect(s * 0.28, s * 0.18, s * 0.44, s * 0.34, { tl: 0, tr: 0, bl: s * 0.2, br: s * 0.2 });
    g.fillRect(s * 0.45, s * 0.5, s * 0.1, s * 0.16);
    g.fillRoundedRect(s * 0.3, s * 0.66, s * 0.4, s * 0.12, s * 0.03);
    g.lineStyle(s * 0.06, PALETTE.yellow);
    g.strokeCircle(s * 0.27, s * 0.32, s * 0.09);
    g.strokeCircle(s * 0.73, s * 0.32, s * 0.09);
  },
  star: (g, s) => {
    g.fillStyle(PALETTE.yellow);
    g.lineStyle(s * 0.06, 0xc98a00);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.45 : s * 0.2;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(new Phaser.Math.Vector2(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r * 0.98 + s * 0.03));
    }
    g.fillPoints(pts, true);
    g.strokePoints(pts, true, true);
  },
  hand: (g, s) => {
    // Mano señalando hacia abajo (gesto de "mantén pulsado").
    g.fillStyle(PALETTE.white);
    g.lineStyle(s * 0.05, PALETTE.ink);
    g.fillRoundedRect(s * 0.42, s * 0.05, s * 0.16, s * 0.5, s * 0.08);
    g.strokeRoundedRect(s * 0.42, s * 0.05, s * 0.16, s * 0.5, s * 0.08);
    g.fillRoundedRect(s * 0.3, s * 0.38, s * 0.48, s * 0.5, s * 0.14);
    g.strokeRoundedRect(s * 0.3, s * 0.38, s * 0.48, s * 0.5, s * 0.14);
    g.fillRoundedRect(s * 0.42, s * 0.3, s * 0.16, s * 0.25, s * 0.08);
  },
};

/** Genera todas las texturas de iconos una vez (en Boot). */
export function makeIconTextures(scene: Phaser.Scene, size = 128) {
  for (const [name, draw] of Object.entries(ICONS)) {
    const key = `ic-${name}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(PALETTE.white);
    draw(g, size);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

/** Botón redondo con icono. Responde al soltar el dedo dentro del botón, con rebote al pulsar. */
export function iconButton(
  scene: Phaser.Scene, x: number, y: number, icon: string, color: number, radius: number, onClick: () => void,
) {
  const c = scene.add.container(x, y);
  const shadow = scene.add.circle(0, radius * 0.12, radius, 0x000000, 0.25);
  const bg = scene.add.circle(0, 0, radius, color).setStrokeStyle(radius * 0.12, PALETTE.white);
  const ic = scene.add.image(0, 0, `ic-${icon}`).setDisplaySize(radius * 1.25, radius * 1.25);
  c.add([shadow, bg, ic]);
  c.setSize(radius * 2, radius * 2);
  c.setInteractive(new Phaser.Geom.Circle(radius, radius, radius * 1.1), Phaser.Geom.Circle.Contains);
  c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    scene.tweens.add({ targets: c, scale: 0.9, duration: 60 });
  });
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 80 }));
  c.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    scene.tweens.add({ targets: c, scale: 1, duration: 80 });
    onClick();
  });
  return Object.assign(c, { setIcon: (name: string) => ic.setTexture(`ic-${name}`) });
}

/** Latido suave para llamar la atención sobre el botón principal. */
export function pulse(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, amount = 0.06) {
  return scene.tweens.add({ targets: target, scale: 1 + amount, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
}

/** Número grande con contorno (la única "tipografía" del juego: cifras). */
export function bigNumber(scene: Phaser.Scene, x: number, y: number, size: number, value = '0') {
  return scene.add.text(x, y, value, {
    fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
    fontSize: `${size}px`,
    color: '#ffffff',
    stroke: '#2b2340',
    strokeThickness: Math.max(4, size * 0.16),
  }).setOrigin(0.5);
}
