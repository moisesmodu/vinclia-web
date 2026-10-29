import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from '@comun/ui';
import { audio } from '@comun/audio';
import { portal } from '@comun/portal';
import { menuExtras } from '@comun/extras';
import { modalOpen } from '@comun/tienda';
import { save } from '../state';
import { ITEMS, DEFAULTS, DAILY, applyJelly } from '../cosmeticos';

/** Start screen: art, play button, best height, stars and sound. No text except the name. */
export class Menu extends Phaser.Scene {
  private going = false;

  constructor() { super('Menu'); }

  create() {
    this.going = false;
    portal.gameplayStop();
    // sky behind the art (shows above it in portrait, where the art is anchored to the bottom)
    const sky = this.add.graphics();
    const bg = this.textures.exists('menu-bg') && this.textures.get('menu-bg').key !== '__MISSING'
      ? this.add.image(0, 0, 'menu-bg').setOrigin(0.5) : null;
    if (!bg) this.cameras.main.setBackgroundColor('#ff8fcf');
    // Title in two bubbly lines, pink and lemon, like the cover art
    const word = (t: string, y: number, color: string) => this.add.text(0, y, t, {
      fontFamily: '"Arial Black", "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif', fontStyle: '900',
      fontSize: '128px', color, stroke: '#2b2340', strokeThickness: 22,
      shadow: { offsetX: 0, offsetY: 10, color: '#2b2340', fill: true, blur: 0, stroke: true },
    }).setOrigin(0.5).setPadding(10, 10, 10, 20);
    const jelly = word('JELLY', -66, '#ff6fae'), stack = word('STACK', 66, '#ffd23f');
    const logo = this.add.container(0, 0, [jelly, stack]);
    const logoW = Math.max(jelly.width, stack.width);
    this.tweens.add({ targets: jelly, scaleY: 0.9, scaleX: 1.05, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: stack, scaleY: 0.9, scaleX: 1.05, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 240 });
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const play = iconButton(this, 0, 0, 'play', PALETTE.green, 70, () => this.go());
    const trophy = this.add.image(0, 0, 'ic-trophy');
    const best = bigNumber(this, 0, 0, 44, `${save.get('best')}`).setOrigin(0, 0.5);
    const star = this.add.image(0, 0, 'ic-star');
    const stars = bigNumber(this, 0, 0, 44, `${save.get('coins')}`).setOrigin(0, 0.5);
    const sound = iconButton(this, 0, 0, audio.muted ? 'mute' : 'sound', PALETTE.blue, 34, () => {
      const m = audio.toggle();
      save.set('muted', m);
      sound.setIcon(m ? 'mute' : 'sound');
    });

    // cosmetics shop (bottom-left corner) and daily reward
    const extras = menuExtras(this, {
      save, currency: 'coins', currencyIcon: 'ic-star', items: ITEMS, defaults: DEFAULTS, daily: DAILY, color: 0xa67bff,
      onChange: () => applyJelly(this), onWallet: (n) => stars.setText(`${n}`),
    });

    this.input.keyboard?.on('keydown-SPACE', () => { if (!modalOpen(this)) this.go(); });
    this.input.keyboard?.on('keydown-ENTER', () => { if (!modalOpen(this)) this.go(); });

    const layout = () => {
      const w = this.scale.width, h = this.scale.height, portrait = h > w;
      // in portrait the tower (right side of the art) is framed
      // portrait: the art a bit smaller, anchored to the bottom, tower on the right, title in the sky above it
      sky.clear().fillGradientStyle(0x64c6fe, 0x64c6fe, 0x98aad9, 0x98aad9, 1).fillRect(0, 0, w, h);
      if (portrait) bg?.setOrigin(0.7, 1).setPosition(w / 2, h).setScale(Math.max(w / bg.width, (h * 0.8) / bg.height));
      else bg?.setOrigin(0.5, 0.5).setPosition(w / 2, h / 2).setScale(Math.max(w / bg.width, h / bg.height));
      const u = Math.min(w / 1280, h / 720);
      const ls = portrait ? Math.min(1.1, (w * 0.84) / logoW) : Math.min(u * 1.05, (w * 0.5) / logoW);
      logo.setPosition(portrait ? w / 2 : w * 0.31, h * (portrait ? 0.11 : 0.27)).setScale(Math.max(0.25, ls));
      const ps = portrait ? Math.max(0.7, Math.min(w / 720, h / 1280) * 1.43) : Math.max(0.55, u * 1.1);
      play.setPosition(w * (portrait ? 0.29 : 0.31), h * (portrait ? 0.56 : 0.64)).setScale(ps);
      // heartbeat around the layout scale (comun's pulse() tweens to an absolute 1.06)
      this.tweens.killTweensOf(play);
      this.tweens.add({ targets: play, scale: ps * 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const s = Math.max(0.6, portrait ? ps / 1.1 : u);
      const rowY = play.y + (portrait ? 120 : 108) * ps;
      // portrait: best and stars stacked in the left column; landscape: side by side
      trophy.setPosition(play.x - (portrait ? 44 : 110) * s, rowY).setDisplaySize(52 * s, 52 * s);
      best.setPosition(trophy.x + 34 * s, rowY).setScale(s);
      if (portrait) star.setPosition(trophy.x, rowY + 66 * s).setDisplaySize(50 * s, 50 * s);
      else star.setPosition(play.x + 40 * s, rowY).setDisplaySize(50 * s, 50 * s);
      stars.setPosition(star.x + 34 * s, star.y).setScale(s);
      sound.setPosition(w - 50 * s, h - 50 * s).setScale(s);
      extras.place(s);
    };
    layout();
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
  }

  go() {
    if (this.going) return;
    this.going = true;
    const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
    (sm as any).context?.resume?.();
    if (this.cache.audio.exists('music') && !this.sound.get('music')) this.sound.add('music', { loop: true, volume: 0.45 }).play();
    this.cameras.main.fadeOut(180, 255, 143, 207);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Play');
      this.going = false;
    });
  }
}
