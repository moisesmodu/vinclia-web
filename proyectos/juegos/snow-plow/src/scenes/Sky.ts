import Phaser from 'phaser';

/**
 * Cielo de noche detrás de la partida (sin zoom ni cámara que se mueva): degradado azul, luna y estrellas
 * que titilan. Va antes que Play en la lista de escenas, así que se pinta detrás. Coste: ~40 imágenes quietas.
 */
export class Sky extends Phaser.Scene {
  constructor() { super('Sky'); }

  create() {
    const sky = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    const moon = this.add.image(0, 0, 'moon');
    const rnd = new Phaser.Math.RandomDataGenerator(['sky']);
    const stars = Array.from({ length: 40 }, () => {
      const s = this.add.image(0, 0, 'dot').setScale(rnd.realInRange(0.25, 0.7)).setAlpha(rnd.realInRange(0.5, 1));
      s.setData('u', rnd.frac()).setData('v', rnd.frac() * 0.6);
      return s;
    });
    // solo unas pocas titilan (tweens baratos)
    stars.slice(0, 10).forEach((s, i) => this.tweens.add({ targets: s, alpha: 0.2, duration: 700 + i * 130, yoyo: true, repeat: -1, delay: i * 90 }));
    const layout = () => {
      const w = this.scale.width, h = this.scale.height;
      sky.setDisplaySize(w, h);
      moon.setPosition(w * 0.82, h * 0.16).setScale(Phaser.Math.Clamp(Math.min(w, h) / 700, 0.6, 1.4));
      for (const s of stars) s.setPosition(s.getData('u') * w, s.getData('v') * h);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }
}
