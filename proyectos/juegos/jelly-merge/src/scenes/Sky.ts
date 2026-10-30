import Phaser from 'phaser';
import { theme } from '../cosmeticos';

/** Sky behind the jar (own scene, no zoom): theme gradient, far and near hills, drifting clouds, stars at night. */
export class Sky extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private clouds: { img: Phaser.GameObjects.Image; x: number; y: number; speed: number }[] = [];
  private stars: Phaser.GameObjects.Image[] = [];
  private hills: Phaser.GameObjects.Image[] = [];

  constructor() { super('Sky'); }

  create() {
    this.clouds = []; this.stars = []; this.hills = [];
    const th = theme();
    this.g = this.add.graphics();
    if (th.stars) for (let i = 0; i < 40; i++) this.stars.push(this.add.image(0, 0, 'star-dot').setScale(0.6 + ((i * 7) % 5) * 0.2));
    for (let i = 0; i < 5; i++) {
      this.clouds.push({ img: this.add.image(0, 0, 'sky-cloud').setAlpha(th.stars ? 0.18 : 0.85), x: (i * 0.41) % 1, y: 0.06 + (i * 0.13) % 0.5, speed: 0.005 + (i % 3) * 0.003 });
    }
    for (let i = 0; i < 4; i++) this.hills.push(this.add.image(0, 0, 'hill').setOrigin(0.5, 1).setTint(i < 2 ? th.far : th.hill));
    this.scale.on('resize', this.redraw, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.redraw, this));
    this.redraw();
  }

  private redraw() {
    const w = this.scale.width, h = this.scale.height, th = theme();
    this.g.clear().fillGradientStyle(th.top, th.top, th.bottom, th.bottom, 1).fillRect(0, 0, w, h);
    const rnd = (n: number) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    this.stars.forEach((s, i) => s.setPosition(rnd(i + 1) * w, rnd(i + 101) * h * 0.75));
    const u = Math.max(w, h) / 1200;
    const spots = [[0.12, 1.1, 1.3], [0.85, 1.0, 1.5], [0.3, 1.25, 1.6], [0.78, 1.3, 1.4]];
    this.hills.forEach((hl, i) => hl.setPosition(w * spots[i][0], h * spots[i][1] - (i < 2 ? 40 : 0) * u).setScale(spots[i][2] * u));
  }

  update(_t: number, dt: number) {
    const w = this.scale.width, h = this.scale.height, u = Math.max(0.5, Math.min(w / 1280, h / 720) * 1.1);
    const d = Math.min(this.game.loop.rawDelta || dt, 100) / 1000;
    for (const c of this.clouds) {
      c.x = (c.x + c.speed * d) % 1.2;
      c.img.setPosition(c.x * (w + 300 * u) - 150 * u, c.y * h).setScale(u);
    }
  }
}
