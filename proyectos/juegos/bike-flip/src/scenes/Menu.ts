import Phaser from 'phaser';
import { iconButton, pulse, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { save, totalStars, nextLevel } from '../state';
import { LEVELS } from '../levels';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { ITEMS, DEFAULTS, DAILY, applyBike } from '../cosmeticos';

/** Arranca la música la primera vez que el jugador pulsa algo (los navegadores lo exigen). */
export function startMusic(scene: Phaser.Scene) {
  ((scene.sound as any).context as AudioContext | undefined)?.resume?.();
  if (scene.cache.audio.exists('music') && !scene.sound.get('music')) scene.sound.add('music', { loop: true, volume: 0.4 }).play();
}

/** Pantalla de inicio: arte, botón de jugar (siguiente nivel), niveles, estrellas y sonido. Sin texto salvo el nombre. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    const bg = this.textures.exists('menu-bg') && this.textures.get('menu-bg').key !== '__MISSING'
      ? this.add.image(0, 0, 'menu-bg') : this.add.image(0, 0, 'sky');
    const logo = this.add.text(0, 0, 'BIKE FLIP', {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif',
      fontSize: '104px', color: '#ffd23f', stroke: '#2b2340', strokeThickness: 18,
      shadow: { offsetX: 0, offsetY: 9, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5);
    this.tweens.add({ targets: logo, angle: { from: -2.5, to: 2.5 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    pulse(this, play);
    const lvl = bigNumber(this, 0, 0, 34, `${nextLevel()}`);
    const levels = iconButton(this, 0, 0, 'grid', PALETTE.purple, 40, () => this.levels());
    const star = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 44, `${totalStars()}/${LEVELS.length * 3}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });

    // tienda de cosméticos (abajo a la izquierda, con las monedas al lado) y recompensa diaria
    const coin = this.add.image(0, 0, 'ic-coin');
    const coins = bigNumber(this, 0, 0, 40, `${save.get('coins')}`).setOrigin(0, 0.5);
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY,
      onChange: () => applyBike(this), onWallet: (n) => coins.setText(`${n}`), panel: 0xfff6e8,
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      // en vertical se encuadra la moto (lado derecho del fondo)
      bg.setOrigin(portrait ? 0.74 : 0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const cx = portrait ? w / 2 : w * 0.3;
      logo.setPosition(cx, h * (portrait ? 0.16 : 0.22)).setScale(Math.max(0.42, Math.min(u * (portrait ? 1.4 : 1), w / 1000)));
      const ps = Math.max(0.7, u * 1.1);
      play.setPosition(cx, h * (portrait ? 0.4 : 0.53)).setScale(ps);
      lvl.setPosition(play.x + 54 * ps, play.y - 52 * ps).setScale(ps);
      const s = Math.max(0.6, u);
      const rowY = play.y + 120 * ps;
      levels.setPosition(cx - 90 * s, rowY).setScale(s);
      star.setPosition(cx - 18 * s, rowY).setDisplaySize(50 * s, 50 * s);
      stars.setPosition(star.x + 32 * s, rowY).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
      coin.setPosition(extras.shop.x + 70 * s, extras.shop.y).setDisplaySize(44 * s, 44 * s);
      coins.setPosition(coin.x + 28 * s, coin.y + 2 * s).setScale(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  /** Jugar: el siguiente nivel sin terminar (también lo usa scripts/sdk-test.mjs). */
  go(level = nextLevel()) {
    if (this.going) return;
    this.going = true;
    startMusic(this);
    this.cameras.main.fadeOut(160, 255, 210, 160);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('level', level);
      this.scene.start('Play', { level });
    });
  }

  private levels() {
    if (this.going) return;
    startMusic(this);
    this.scene.start('Levels');
  }
}
