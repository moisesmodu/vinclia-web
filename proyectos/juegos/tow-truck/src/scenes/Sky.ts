import Phaser from 'phaser';

/**
 * Cielo de atardecer detrás de la partida (sin zoom ni cámara que se mueva): degradado morado-naranja,
 * sol bajo y unas nubes rosadas que se mueven despacio. Va antes que Play en la lista de escenas.
 */
export class Sky extends Phaser.Scene {
  constructor() { super('Sky'); }

  create() {
    const sky = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    const sun = this.add.image(0, 0, 'sun');
    const rnd = new Phaser.Math.RandomDataGenerator(['sky']);
    const clouds = Array.from({ length: 4 }, (_, i) => this.add.image(0, 0, 'cloud')
      .setData('u', i / 4 + rnd.frac() * 0.15).setData('v', 0.08 + rnd.frac() * 0.28).setData('k', rnd.realInRange(0.6, 1.1)).setAlpha(0.9));
    const layout = () => {
      const w = this.scale.width, h = this.scale.height;
      sky.setDisplaySize(w, h);
      sun.setPosition(w * 0.72, h * 0.34).setScale(Phaser.Math.Clamp(Math.min(w, h) / 600, 0.6, 1.5));
      for (const c of clouds) c.setScale(c.getData('k') * Phaser.Math.Clamp(Math.min(w, h) / 700, 0.5, 1.3)).setY(c.getData('v') * h);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  update(t: number) {
    const w = this.scale.width + 300;
    for (const c of this.children.list) {
      if (!(c instanceof Phaser.GameObjects.Image) || c.texture.key !== 'cloud') continue;
      c.x = ((c.getData('u') * w - t * 0.008 * c.getData('k')) % w + w) % w - 150;
    }
  }
}
