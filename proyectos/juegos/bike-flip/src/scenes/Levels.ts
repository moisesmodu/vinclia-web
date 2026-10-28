import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { portal } from '@comun/portal';
import { save, levelStars, totalStars } from '../state';
import { LEVELS } from '../levels';

/** Selector de niveles: 20 casillas (5×4 en horizontal, 4×5 en vertical), candado o 0–3 estrellas. */
export class Levels extends Phaser.Scene {
  constructor() { super('Levels'); }

  create() {
    portal.gameplayStop();
    const bg = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    const mesa = this.add.tileSprite(0, 0, 10, 420, 'mesas-far').setOrigin(0, 1).setAlpha(0.9);
    const home = iconButton(this, 0, 0, 'home', PALETTE.purple, 38, () => this.scene.start('Menu'));
    const star = this.add.image(0, 0, 'ic-star');
    const total = bigNumber(this, 0, 0, 42, `${totalStars()}/${LEVELS.length * 3}`).setOrigin(0, 0.5);
    const unlocked = save.get('unlocked');
    const cells = LEVELS.map((_, i) => {
      const n = i + 1, open = n <= unlocked;
      const c = this.add.container(0, 0);
      const shadow = this.add.rectangle(0, 8, 120, 120, 0x000000, 0.22).setOrigin(0.5);
      const box = this.add.rectangle(0, 0, 120, 120, open ? (n === unlocked && !levelStars(n) ? PALETTE.green : 0xff8a4c) : 0xb59a8a)
        .setStrokeStyle(8, PALETTE.ink);
      c.add([shadow, box]);
      if (open) {
        c.add(bigNumber(this, 0, -12, 52, `${n}`));
        const st = levelStars(n);
        for (let k = 0; k < 3; k++) c.add(this.add.image((k - 1) * 32, 36, st > k ? 'ic-star' : 'ic-star-off').setDisplaySize(34, 34));
        c.setSize(120, 120).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => this.tweens.add({ targets: c, scale: c.getData('s') * 0.92, duration: 60 }));
        c.on('pointerout', () => c.setScale(c.getData('s')));
        c.on('pointerup', () => this.start(n));
      } else {
        c.add(this.add.image(0, 0, 'ic-lock').setDisplaySize(64, 64).setAlpha(0.85));
      }
      return c;
    });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      bg.setDisplaySize(w, h);
      mesa.setSize(w, 420).setPosition(0, h + 40);
      const cols = portrait ? 4 : 5, rows = Math.ceil(LEVELS.length / cols);
      const top = 120 * Math.min(1, h / 720);
      const cell = Math.min((w - 40) / cols, (h - top - 30) / rows);
      const s = Math.min(1.25, (cell * 0.84) / 120);
      const gx = w / 2 - ((cols - 1) * cell) / 2, gy = top + cell / 2;
      cells.forEach((c, i) => c.setPosition(gx + (i % cols) * cell, gy + Math.floor(i / cols) * cell).setScale(s).setData('s', s));
      const u = Phaser.Math.Clamp(Math.min(w / 1100, h / 640), 0.6, 1.2);
      home.setPosition(54 * u, 54 * u).setScale(u);
      star.setPosition(w / 2 - 70 * u, 56 * u).setDisplaySize(50 * u, 50 * u);
      total.setPosition(star.x + 32 * u, 58 * u).setScale(u);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Menu'));
  }

  private start(level: number) {
    this.registry.set('level', level);
    this.scene.start('Play', { level });
  }
}
