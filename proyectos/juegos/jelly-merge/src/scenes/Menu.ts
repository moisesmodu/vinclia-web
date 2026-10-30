import Phaser from 'phaser';
import { menuScreen } from '@comun/pantallas';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyJelly } from '../cosmeticos';

/** Start screen (common): art, title, play, best score, coins, sound, shop and daily gift. */
export class Menu extends Phaser.Scene {
  private going = false;
  constructor() { super('Menu'); }

  create() {
    this.going = false;
    menuScreen(this, {
      title: 'JELLY MERGE',
      background: this.textures.exists('menu-bg') ? 'menu-bg' : undefined,
      best: save.get('best'),
      coins: save.get('coins'),
      muted: save.get('muted'),
      onMute: (m) => save.set('muted', m),
      onPlay: () => { if (!modalOpen(this)) this.go(); },
      bgPortraitOrigin: 0.78,
      portraitLogoY: 0.14,
      portraitPlayY: 0.36,
    });
    // menuScreen draws the wallet with a star: this game pays in coins
    const list = this.children.list;
    const i = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-star');
    (list[i] as Phaser.GameObjects.Image | undefined)?.setTexture('ic-coin');
    const coinIc = list[i] as Phaser.GameObjects.Image | undefined;
    const coins = list[i + 1] as Phaser.GameObjects.Text | undefined;
    // menuScreen spaces the best score and the coins for short numbers: push the coins right of a long best
    // score and centre the row again under the play button
    const t = list.findIndex((o) => (o as Phaser.GameObjects.Image).texture?.key === 'ic-trophy');
    const trophy = list[t] as Phaser.GameObjects.Image | undefined, best = list[t + 1] as Phaser.GameObjects.Text | undefined;
    const fixRow = () => {
      if (!trophy || !best || !coinIc || !coins) return;
      const gap = trophy.displayWidth * 0.45;
      const left0 = trophy.x - trophy.displayWidth / 2, right0 = coins.x + coins.displayWidth, mid = (left0 + right0) / 2;
      coinIc.x = Math.max(coinIc.x, best.x + best.displayWidth + gap + coinIc.displayWidth / 2);
      coins.x = coinIc.x + coinIc.displayWidth * 0.68;
      const dx = mid - (left0 + coins.x + coins.displayWidth) / 2;
      for (const o of [trophy, best, coinIc, coins]) o.x += dx;
    };
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-coin', items: ITEMS, defaults: DEFAULTS, daily: DAILY, color: 0xff6fae,
      onChange: () => applyJelly(this), onWallet: (n) => { coins?.setText?.(`${n}`); fixRow(); },
    });
    const place = () => { extras.place(Math.max(0.6, Math.min(this.scale.width / 1280, this.scale.height / 720))); fixRow(); };
    place();
    this.scale.on('resize', place);
    this.events.once('shutdown', () => this.scale.off('resize', place));
  }

  /** Start a run (the automated tests call it too). */
  go() {
    if (this.going) return;
    this.going = true;
    ((this.sound as any).context as AudioContext | undefined)?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.4 }).play();
    this.cameras.main.fadeOut(180, 255, 143, 207);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('Play'); this.going = false; });
  }
}
