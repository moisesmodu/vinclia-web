import Phaser from 'phaser';
import { makeIconTextures } from '@comun/ui';
import { makeExtraIcons } from '@comun/iconos';
import { bootDone } from '@comun/boot';
import { save } from '../state';
import { makeGameIcons, makeBadges, makeHeads, makeStadium } from '../art';
import { makeCosmetics } from '../cosmeticos';
import { SHOOTERS, KEEPER } from '../logic';

/** Loads the menu art (Higgsfield) and the music (ElevenLabs); everything else is drawn by code and baked here. */
export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('menu-bg', 'assets/menu-bg.jpg');
    this.load.audio('music', 'assets/music.mp3');
  }

  create() {
    makeIconTextures(this);
    makeExtraIcons(this);
    makeGameIcons(this);
    save.load();
    makeCosmetics(this);
    makeBadges(this);
    for (const sp of [...SHOOTERS, KEEPER]) makeHeads(this, sp);
    makeStadium(this);
    bootDone(this.game, save.get('muted'));
    this.scene.start('Menu');
  }
}
