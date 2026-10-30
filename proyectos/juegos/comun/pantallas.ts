import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from './ui';
import { audio } from './audio';
import { portal } from './portal';

/**
 * Pantallas genéricas sin texto, sacadas de Egg Truck para que cada juego nuevo solo escriba su mecánica:
 *  - menuScreen: fondo, nombre, botón de jugar, récord, monedas y sonido.
 *  - tutorialHand: mano animada de "toca" o "mantén" que desaparece sola (máx. 10 s).
 *  - gameOverScreen: puntuación, récord, reinicio en un clic, revivir con anuncio y volver al menú.
 */

export function uiScale(scene: Phaser.Scene) {
  return Phaser.Math.Clamp(Math.min(scene.scale.width / 1100, scene.scale.height / 640), 0.6, 1.4);
}

function onResize(scene: Phaser.Scene, fn: () => void) {
  fn();
  scene.scale.on('resize', fn);
  scene.events.once('shutdown', () => scene.scale.off('resize', fn));
}

export function menuScreen(scene: Phaser.Scene, o: {
  title: string; background?: string; best: number; coins?: number; muted: boolean;
  onMute: (m: boolean) => void; onPlay: () => void;
  /** En vertical: qué parte del fondo se encuadra en horizontal (0 = izquierda, 1 = derecha; por defecto 0,72). */
  bgPortraitOrigin?: number;
  /** En vertical: altura del nombre y del botón de jugar, en fracción de la pantalla (por defecto 0,18 y 0,42). */
  portraitLogoY?: number;
  portraitPlayY?: number;
}) {
  portal.gameplayStop();
  const bg = o.background ? scene.add.image(0, 0, o.background) : null;
  const logo = scene.add.text(0, 0, o.title, {
    fontFamily: '"Arial Black", system-ui, sans-serif', fontSize: '96px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 16,
    shadow: { offsetX: 0, offsetY: 8, color: '#2b2340', fill: true, blur: 0, stroke: true },
  }).setOrigin(0.5);
  scene.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  let going = false;
  const go = () => {
    if (going) return;
    going = true;
    ((scene.sound as any).context as AudioContext | undefined)?.resume?.();
    o.onPlay();
  };
  const play = iconButton(scene, 0, 0, 'play', PALETTE.green, 70, go);
  pulse(scene, play);
  const trophy = scene.add.image(0, 0, 'ic-trophy');
  const best = bigNumber(scene, 0, 0, 44, `${o.best}`).setOrigin(0, 0.5);
  const coin = o.coins !== undefined ? scene.add.image(0, 0, 'ic-star') : null;
  const coins = o.coins !== undefined ? bigNumber(scene, 0, 0, 44, `${o.coins}`).setOrigin(0, 0.5) : null;
  const sound = iconButton(scene, 0, 0, o.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
    const m = audio.toggle();
    o.onMute(m);
    sound.setIcon(m ? 'mute' : 'sound');
  });
  scene.input.keyboard?.on('keydown-SPACE', go);
  scene.input.keyboard?.on('keydown-ENTER', go);
  onResize(scene, () => {
    const w = scene.scale.width, h = scene.scale.height, u = Math.min(w / 1280, h / 720), portrait = h > w;
    bg?.setOrigin(portrait ? o.bgPortraitOrigin ?? 0.72 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
    logo.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? o.portraitLogoY ?? 0.18 : 0.22)).setScale(Math.max(0.45, Math.min(u * (portrait ? 1.5 : 1), w / 1100)));
    play.setPosition(portrait ? w / 2 : w * 0.3, h * (portrait ? o.portraitPlayY ?? 0.42 : 0.55)).setScale(Math.max(0.7, u * 1.1));
    const s = Math.max(0.6, u), rowY = play.y + 120 * Math.max(0.7, u * 1.1);
    trophy.setPosition(play.x - (coin ? 110 : 30) * s, rowY).setDisplaySize(52 * s, 52 * s);
    best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
    coin?.setPosition(play.x + 40 * s, rowY).setDisplaySize(50 * s, 50 * s);
    coins?.setPosition(play.x + 74 * s, rowY).setScale(s);
    sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
  });
}

/** Mano de tutorial. gesture 'tap' (toques) o 'hold' (mantener). Devuelve done() para quitarla antes. */
export function tutorialHand(scene: Phaser.Scene, o: { gesture: 'tap' | 'hold'; x?: number; y?: number; maxMs?: number }) {
  const c = scene.add.container(0, 0).setDepth(20);
  const ring = scene.add.circle(0, 0, 46, 0xffffff, 0.25).setStrokeStyle(6, 0xffffff, 0.9);
  const hand = scene.add.image(12, -10, 'ic-hand').setDisplaySize(110, 110).setOrigin(0.45, 0.05);
  c.add([ring, hand]);
  const press = o.gesture === 'hold' ? 500 : 0;
  scene.tweens.add({ targets: hand, y: 4, duration: o.gesture === 'hold' ? 420 : 220, yoyo: true, repeat: -1, ease: 'Sine.inOut', hold: press });
  scene.tweens.add({ targets: ring, scale: 1.35, alpha: 0.2, duration: o.gesture === 'hold' ? 840 : 440, repeat: -1 });
  onResize(scene, () => c.setPosition(o.x ?? scene.scale.width / 2, o.y ?? scene.scale.height * 0.62).setScale(uiScale(scene)));
  let gone = false;
  const done = () => {
    if (gone) return;
    gone = true;
    scene.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
  };
  scene.time.delayedCall(o.maxMs ?? 10000, done);
  return { done, container: c };
}

/** Fin de partida. Reinicio en un clic (botón grande o espacio). Revivir solo si el portal tiene anuncios con recompensa. */
export function gameOverScreen(scene: Phaser.Scene, o: {
  score: number; best: number; newBest: boolean; unit?: string; canRevive: boolean; icon?: string;
  onReplay: () => void; onRevive: () => void; onHome: () => void;
}) {
  const w = scene.scale.width, h = scene.scale.height, s = uiScale(scene);
  const c = scene.add.container(0, 0).setDepth(30);
  const shade = scene.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.45).setInteractive();
  const panel = scene.add.rectangle(w / 2, h / 2 - 20 * s, 520 * s, 300 * s, 0xffffff, 0.96).setStrokeStyle(8 * s, PALETTE.ink);
  const score = bigNumber(scene, w / 2 + (o.icon ? 40 : 0) * s, h / 2 - 78 * s, 96 * s, `${o.score}`);
  c.add([shade, panel, score]);
  if (o.icon) c.add(scene.add.image(w / 2 - 170 * s, h / 2 - 76 * s, o.icon).setDisplaySize(90 * s, 90 * s));
  if (o.unit) c.add(bigNumber(scene, score.x + score.displayWidth / 2 + 26 * s, h / 2 - 66 * s, 40 * s, o.unit));
  const trophy = scene.add.image(w / 2 - 40 * s, h / 2 + 30 * s, 'ic-trophy').setDisplaySize(52 * s, 52 * s);
  const best = bigNumber(scene, w / 2 - 6 * s, h / 2 + 32 * s, 46 * s, `${o.best}`).setOrigin(0, 0.5);
  c.add([trophy, best]);
  if (o.newBest) {
    const burst = scene.add.particles(w / 2, h / 2 - 80 * s, 'ic-star', {
      speed: { min: 200, max: 520 }, lifespan: 1000, scale: { start: 0.35 * s, end: 0 }, gravityY: 500, emitting: false,
    });
    burst.explode(26);
    c.add(burst);
    portal.happyTime();
  }
  let busy = false;
  const once = (fn: () => void | Promise<void>) => async () => { if (busy) return; busy = true; await fn(); busy = false; };
  const by = h / 2 + 175 * s;
  const replay = iconButton(scene, w / 2, by, 'replay', PALETTE.green, 62 * s, once(o.onReplay));
  pulse(scene, replay, 0.05);
  c.add([replay, iconButton(scene, w / 2 - 150 * s, by + 10 * s, 'home', PALETTE.purple, 38 * s, once(o.onHome))]);
  if (o.canRevive) {
    c.add(iconButton(scene, w / 2 + 150 * s, by + 10 * s, 'video', PALETTE.yellow, 44 * s, once(async () => {
      if (await portal.rewardedBreak()) { c.destroy(); o.onRevive(); }
    })));
  }
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 180 });
  scene.input.keyboard?.once('keydown-SPACE', once(o.onReplay));
  return c;
}
