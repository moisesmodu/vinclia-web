import Phaser from 'phaser';
import { onAdAudio } from './portal';

/**
 * Sonido: música (archivo) por el gestor de Phaser y efectos sintetizados con Web Audio
 * (cero bytes de descarga). Respeta el silencio del jugador y los anuncios del portal.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private userMuted = false;
  private adMuted = false;
  private game: Phaser.Game | null = null;

  attach(game: Phaser.Game, startMuted: boolean) {
    this.game = game;
    this.userMuted = startMuted;
    const sm = game.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = (sm as any).context ?? null;
    if (this.ctx) {
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    onAdAudio((m) => { this.adMuted = m; this.apply(); });
    // Pestaña oculta = silencio (y Phaser ya pausa el bucle).
    document.addEventListener('visibilitychange', () => this.apply());
    this.apply();
  }

  get muted() { return this.userMuted; }
  toggle() { this.userMuted = !this.userMuted; this.apply(); return this.userMuted; }

  private apply() {
    const off = this.userMuted || this.adMuted || document.hidden;
    if (this.game) this.game.sound.mute = off;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(off ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  private get ok() { return !!(this.ctx && this.master && this.ctx.state === 'running'); }

  /** Pitido con envolvente: base de todos los efectos. */
  tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, slideTo?: number) {
    if (!this.ok) return;
    const c = this.ctx!, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Ruido filtrado (golpes, crujidos). */
  noise(dur: number, vol = 0.3, freq = 800) {
    if (!this.ok) return;
    const c = this.ctx!, t = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }

  /** Motor continuo: devuelve un control para cambiar tono y volumen cada fotograma. */
  engine() {
    if (!this.ok) return null;
    const c = this.ctx!;
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.value = 50; o2.frequency.value = 25;
    f.type = 'lowpass'; f.frequency.value = 400;
    g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g).connect(this.master!);
    o.start(); o2.start();
    return {
      set(rpm01: number, vol01: number) {
        const t = c.currentTime;
        o.frequency.setTargetAtTime(45 + rpm01 * 90, t, 0.05);
        o2.frequency.setTargetAtTime(22 + rpm01 * 45, t, 0.05);
        g.gain.setTargetAtTime(0.05 * vol01, t, 0.08);
      },
      stop() { try { g.gain.value = 0; o.stop(); o2.stop(); } catch { /* */ } },
    };
  }
}

export const audio = new GameAudio();
