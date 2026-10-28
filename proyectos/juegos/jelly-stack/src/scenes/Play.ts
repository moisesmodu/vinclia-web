import Phaser from 'phaser';
import { portal } from '@comun/portal';
import { audio } from '@comun/audio';
import { bigNumber, iconButton, PALETTE } from '@comun/ui';
import { tutorialHand, gameOverScreen, uiScale } from '@comun/pantallas';
import { save } from '../state';

/**
 * EJEMPLO DE MECÁNICA (sustitúyela): toca para saltar los bloques que llegan cada vez más rápido.
 * Lo que NO se toca al copiar la plantilla: el ciclo de partida (anuncio al reiniciar, gameplayStart/Stop,
 * revivir con anuncio, récord, tutorial de 10 s, reinicio en un clic).
 */
export class Play extends Phaser.Scene {
  private static firstRun = true;
  private hero!: Phaser.Physics.Arcade.Image;
  private blocks!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private alive = false;
  private revived = false;
  private speed = 420;
  private nextBlock = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private tutorial?: { done: () => void };

  constructor() { super('Play'); }

  async create() {
    this.score = 0; this.speed = 420; this.nextBlock = 0; this.revived = false; this.alive = false;
    const w = this.scale.width, h = this.scale.height;
    const floorY = h * 0.78;
    this.add.rectangle(0, floorY, w * 4, h, 0x58c556).setOrigin(0, 0);
    const floor = this.physics.add.staticImage(w / 2, floorY + 10, '__WHITE').setDisplaySize(w * 4, 20).refreshBody().setVisible(false);
    this.hero = this.physics.add.image(w * 0.25, floorY - 40, 'hero');
    this.blocks = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.collider(this.hero, floor);
    this.physics.add.overlap(this.hero, this.blocks, () => this.die());

    this.scoreText = bigNumber(this, w / 2, 56 * uiScale(this), 64 * uiScale(this), '0');
    const sound = iconButton(this, w - 46, 46, audio.muted ? 'mute' : 'sound', PALETTE.blue, 30, () => {
      const m = audio.toggle(); save.set('muted', m); sound.setIcon(m ? 'mute' : 'sound');
    });

    // La mecánica: un toque = un salto (solo en el suelo).
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: unknown[]) => { if (!over.length) this.action(); });
    this.input.keyboard?.on('keydown-SPACE', () => this.action());

    if (!save.get('tutorialDone')) this.tutorial = tutorialHand(this, { gesture: 'tap' });
    save.set('runs', save.get('runs') + 1);

    // Anuncio intersticial en pausa natural: antes de cada partida menos la primera de la sesión.
    if (!Play.firstRun) { this.physics.pause(); await portal.commercialBreak(); this.physics.resume(); }
    Play.firstRun = false;
    this.alive = true;
    portal.gameplayStart();
  }

  private action() {
    if (!this.alive) return;
    if (this.hero.body!.blocked.down) {
      this.hero.setVelocityY(-900);
      audio.tone(520, 0.1, 'square', 0.1, 780);
      if (this.tutorial) { this.tutorial.done(); this.tutorial = undefined; save.set('tutorialDone', true); }
    }
  }

  update(_t: number, dt: number) {
    if (!this.alive) return;
    // Dificultad progresiva: la velocidad sube con la puntuación (partidas de 1 a 3 minutos).
    this.speed = Math.min(1100, 420 + this.score * 6);
    this.nextBlock -= dt;
    if (this.nextBlock <= 0) {
      const b = this.blocks.create(this.scale.width + 60, this.scale.height * 0.78 - 30, 'block') as Phaser.Physics.Arcade.Image;
      b.setVelocityX(-this.speed);
      this.nextBlock = Phaser.Math.Between(700, 1500) * (420 / this.speed);
    }
    for (const b of this.blocks.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (b.x < -80) { b.destroy(); this.score++; this.scoreText.setText(`${this.score}`); }
    }
  }

  private die() {
    if (!this.alive) return;
    this.alive = false;
    this.tutorial?.done();
    this.tutorial = undefined;
    portal.gameplayStop();
    this.physics.pause();
    audio.noise(0.3, 0.4, 900);
    this.cameras.main.shake(200, 0.01);
    const prev = save.get('best');
    if (this.score > prev) save.set('best', this.score);
    gameOverScreen(this, {
      score: this.score, best: Math.max(prev, this.score), newBest: this.score > prev,
      canRevive: portal.hasRewarded && !this.revived,
      onReplay: () => this.scene.restart(),
      onHome: () => this.scene.start('Menu'),
      onRevive: () => {
        this.revived = true;
        this.blocks.clear(true, true);
        this.physics.resume();
        this.alive = true;
        portal.gameplayStart();
      },
    });
  }
}
