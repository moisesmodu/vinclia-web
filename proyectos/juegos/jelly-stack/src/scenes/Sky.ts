import Phaser from 'phaser';
import { SKY } from '../config';
import type { Play } from './Play';

const lerpColor = (a: number, b: number, t: number) => {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};

/** Sky behind the tower (own scene, no zoom): gradient that changes with height, clouds, then stars at night. */
export class Sky extends Phaser.Scene {
  private play!: Play;
  private g!: Phaser.GameObjects.Graphics;
  private clouds: { img: Phaser.GameObjects.Image; x: number; y: number; speed: number }[] = [];
  private stars: Phaser.GameObjects.Image[] = [];
  private hills!: Phaser.GameObjects.Image;
  private h = -1;      // height (smoothed) used for the current gradient
  private shown = -1;

  constructor() { super('Sky'); }

  create() {
    this.play = this.scene.get('Play') as Play;
    this.h = 0; this.shown = -1; this.clouds = []; this.stars = [];
    this.g = this.add.graphics();
    for (let i = 0; i < 40; i++) {
      this.stars.push(this.add.image(0, 0, 'star-dot').setAlpha(0).setScale(0.6 + ((i * 7) % 5) * 0.2));
    }
    this.hills = this.add.image(0, 0, 'hills').setOrigin(0.5, 1);
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ img: this.add.image(0, 0, 'cloud').setAlpha(0.9), x: (i * 0.37) % 1, y: i / 6, speed: 0.004 + (i % 3) * 0.003 });
    }
    this.scale.on('resize', this.redraw, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.redraw, this));
    this.redraw();
  }

  private colors(h: number) {
    let i = 0;
    while (i < SKY.length - 2 && h > SKY[i + 1][0]) i++;
    const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
    const t = Phaser.Math.Clamp((h - h0) / (h1 - h0), 0, 1);
    return [lerpColor(t0, t1, t), lerpColor(b0, b1, t)];
  }

  private redraw() {
    const w = this.scale.width, h = this.scale.height;
    const [top, bottom] = this.colors(this.h);
    this.g.clear();
    this.g.fillGradientStyle(top, top, bottom, bottom, 1);
    this.g.fillRect(0, 0, w, h);
    this.shown = this.h;
    this.stars.forEach((s, i) => s.setPosition(((i * 397) % 1000) / 1000 * w, ((i * 211) % 1000) / 1000 * h * 0.85));
    this.hills.setX(w / 2).setScale(Math.max(w / this.hills.width, 0.6));
  }

  update(_t: number, dt: number) {
    if (!this.play?.scene.isActive()) return;
    const w = this.scale.width, h = this.scale.height;
    this.h += (this.play.height - this.h) * Math.min(1, dt / 600);
    if (Math.abs(this.h - this.shown) > 0.15) this.redraw();
    const rise = Math.max(0, -this.play.cameraY);            // world units climbed by the camera
    const night = Phaser.Math.Clamp((this.h - 36) / 14, 0, 1);
    for (const s of this.stars) s.setAlpha(night * 0.9);
    this.hills.setY(h + Math.min(h, rise * 0.3)).setVisible(rise * 0.3 < h);
    const u = Math.max(0.5, Math.min(w / 1280, h / 720) * 1.1);
    for (const c of this.clouds) {
      c.x = (c.x + c.speed * dt / 1000) % 1.2;
      const span = h + 260 * u;
      const y = ((c.y * span + rise * 0.18 * u) % span) - 130 * u;
      c.img.setPosition(c.x * (w + 300 * u) - 150 * u, y).setScale(u).setAlpha(0.9 * (1 - night * 0.8));
    }
  }
}
