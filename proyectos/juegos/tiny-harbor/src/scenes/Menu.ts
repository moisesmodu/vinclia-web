import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { bigNumber, PALETTE } from '@comun/ui';
import { menuExtras } from '@comun/extras';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyCosmetics } from '../cosmeticos';

/** Inicio (menuScreen común): fondo, título, jugar, monedas ganadas (trofeo), estrellas, puerto actual, tienda, diario y sonido. */
export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }
  private going = false;

  create() {
    this.going = false;
    const before = new Set(this.children.list);
    menuScreen(this, {
      title: 'TINY HARBOR',
      background: 'menu-bg',
      best: save.get('best'),
      coins: save.get('stars'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => this.go(),
      bgPortraitOrigin: 0.5,
      portraitLogoY: 0.16,
      portraitPlayY: 0.4,
    });
    // los textos que crea menuScreen, en orden: título, récord y estrellas (el de estrellas se refresca al comprar)
    const texts = this.children.list.filter((o) => !before.has(o) && o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[];
    const starsT = texts[2];
    const play = this.children.list.find((o) => !before.has(o) && o instanceof Phaser.GameObjects.Container) as Phaser.GameObjects.Container;
    const extras = menuExtras(this, {
      save, currency: 'stars', currencyIcon: 'ic-star', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => applyCosmetics(this),
      onWallet: (n) => starsT?.setText(`${n}`),
    });
    // puerto actual (1-3) y prestigio, junto al botón de jugar
    const g = save.get('game');
    const badge = this.add.circle(0, 0, 30, PALETTE.yellow).setStrokeStyle(6, PALETTE.ink);
    const portN = bigNumber(this, 0, 0, 36, `${(g.port | 0) + 1}`);
    const pres = g.prestige ? bigNumber(this, 0, 0, 26, `×${1 + 0.5 * g.prestige}`) : null;
    const layout = () => {
      const w = this.scale.width, h = this.scale.height, u = Math.min(w / 1280, h / 720);
      const s = Math.max(0.6, u), ps = Math.max(0.7, u * 1.1);
      badge.setPosition(play.x - 150 * ps, play.y).setScale(s);
      portN.setPosition(badge.x, badge.y + 2 * s).setScale(s);
      pres?.setPosition(badge.x, badge.y + 44 * s).setScale(s);
      extras.place(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Empezar (también lo llaman las pruebas). */
  go() {
    if (this.going) return;
    this.going = true;
    ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(180, 57, 184, 224);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
