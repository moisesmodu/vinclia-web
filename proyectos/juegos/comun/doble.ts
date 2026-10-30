import Phaser from 'phaser';
import { bigNumber, PALETTE } from './ui';
import { audio } from './audio';
import { portal } from './portal';

/**
 * Botón "×2" de fin de partida: [vídeo] ×2 [moneda]. Pide un anuncio con recompensa y, si el jugador lo ve
 * entero, llama a onDoubled() (el juego suma otra vez lo ganado en la partida). Una vez por partida: el juego
 * guarda que ya se dobló y no vuelve a pedir el botón. No sale si el portal no tiene anuncios con recompensa o
 * si en la partida no se ganó nada. Va en una píldora sobre el borde superior del panel final, lejos de la fila
 * de botones (reiniciar, menú y revivir), para que no se confunda con revivir.
 */
export function doubleButton(scene: Phaser.Scene, o: {
  x: number; y: number; s: number; currencyIcon: string; earned: number;
  /** Se llama solo si el anuncio se vio entero. */
  onDoubled: () => void;
}): (Phaser.GameObjects.Container & { press: () => Promise<boolean> }) | null {
  if (!portal.hasRewarded || o.earned <= 0) return null;
  const s = o.s;
  const c = scene.add.container(o.x, o.y);
  const W = 230, H = 76;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillRoundedRect(-W / 2, -H / 2 + 8, W, H, H / 2);
  g.fillStyle(0xff8a4c).fillRoundedRect(-W / 2, -H / 2, W, H, H / 2);
  g.fillStyle(0xffffff, 0.4).fillRoundedRect(-W / 2 + 30, -H / 2 + 8, W - 60, 10, 5);
  g.lineStyle(7, PALETTE.white).strokeRoundedRect(-W / 2, -H / 2, W, H, H / 2);
  const vbg = scene.add.circle(-W / 2 + 40, 0, 28, PALETTE.purple).setStrokeStyle(4, PALETTE.white);
  const vic = scene.add.image(vbg.x, 0, 'ic-video').setDisplaySize(40, 40);
  const x2 = bigNumber(scene, 8, 2, 50, '×2');
  const cur = scene.add.image(W / 2 - 40, 0, o.currencyIcon).setDisplaySize(50, 50);
  c.add([g, vbg, vic, x2, cur]);
  c.setScale(s);
  c.setSize(W, H);
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
  const tw = scene.tweens.add({ targets: c, angle: { from: -3, to: 3 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  let busy = false, done = false;
  const press = async () => {
    if (busy || done) return false;
    busy = true;
    const ok = await portal.rewardedBreak();
    busy = false;
    if (!ok || !c.active) return false;
    done = true;
    tw.stop();
    c.disableInteractive();
    o.onDoubled();
    [523, 659, 784, 1047].forEach((f, j) => scene.time.delayedCall(j * 70, () => audio.tone(f, 0.15, 'square', 0.09)));
    const burst = scene.add.particles(0, 0, o.currencyIcon, {
      speed: { min: 160, max: 420 }, lifespan: 900, scale: { start: 0.3, end: 0 }, gravityY: 500, emitting: false,
    });
    c.add(burst);
    burst.explode(20);
    scene.tweens.add({ targets: [g, vbg, vic, x2, cur], alpha: 0, delay: 500, duration: 300 });
    return true;
  };
  c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    scene.tweens.add({ targets: c, scale: s * 0.92, duration: 60 });
  });
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: s, duration: 80 }));
  c.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    scene.tweens.add({ targets: c, scale: s, duration: 80 });
    void press();
  });
  return Object.assign(c, { press });
}
