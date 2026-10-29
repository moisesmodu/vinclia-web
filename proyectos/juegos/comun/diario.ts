import Phaser from 'phaser';
import { iconButton, bigNumber, pulse, PALETTE } from './ui';
import { audio } from './audio';
import { modalPanel, setModal, wallet, type KV } from './tienda';

/**
 * Recompensa diaria: la primera vez que se abre el menú en un día natural sale un regalo con la cantidad de
 * moneda. Días seguidos = racha (1..7) y más premio; a partir del 7.º se queda en el máximo. Si se salta un día,
 * vuelve al 1. Guardado (claves que añade cada juego a su Save): dailyDate ('AAAA-MM-DD' local) y dailyStreak.
 */

export const DAILY_DAYS = 7;

/** Fecha local 'AAAA-MM-DD' (el día del jugador, no el de UTC). */
export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Días entre dos fechas 'AAAA-MM-DD' (b - a). NaN si alguna no es válida. */
export function daysBetween(a: string, b: string): number {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  };
  return Math.round((parse(b) - parse(a)) / 86400000);
}

/**
 * Lógica pura de la recompensa diaria. last: último día cobrado ('' = nunca); streak: racha guardada; today: hoy.
 * Devuelve si toca premio, la racha nueva (si se cobra) y el día de la escala (1..7) que corresponde.
 */
export function dailyCheck(last: string, streak: number, today: string): { due: boolean; streak: number; day: number } {
  const d = last ? daysBetween(last, today) : NaN;
  if (d === 0) return { due: false, streak, day: Math.min(Math.max(1, streak), DAILY_DAYS) };
  // ayer = racha + 1; nunca, más de un día o reloj hacia atrás = vuelve a empezar
  const next = d === 1 ? Math.max(0, streak) + 1 : 1;
  return { due: true, streak: next, day: Math.min(next, DAILY_DAYS) };
}

/** Cantidad del día (1..7) según la escala del juego (7 valores). */
export function dailyAmount(day: number, amounts: number[]) {
  return amounts[Math.min(Math.max(1, day), amounts.length) - 1];
}

export type DailyOpts = {
  save: KV;
  currency: string;
  currencyIcon: string;
  /** Escala de 7 premios (día 1..7). */
  amounts: number[];
  /** Tras cobrar: el menú refresca su contador. */
  onClaim?: (amount: number, total: number) => void;
  /** Para pruebas: fecha de hoy. */
  today?: string;
  panel?: number;
};

/** Muestra la ventana si hoy no se ha cobrado. Devuelve true si la ha abierto. */
export function maybeShowDaily(scene: Phaser.Scene, o: DailyOpts): boolean {
  const today = o.today ?? dayKey();
  const st = dailyCheck((o.save.get('dailyDate') as string) || '', (o.save.get('dailyStreak') as number) || 0, today);
  if (!st.due) return false;
  showDaily(scene, o, today, st.streak, st.day);
  return true;
}

function showDaily(scene: Phaser.Scene, o: DailyOpts, today: string, streak: number, day: number) {
  const amount = dailyAmount(day, o.amounts);
  let root: Phaser.GameObjects.Container | null = null;
  let claimed = false;
  setModal(scene, true);

  const claim = () => {
    if (claimed) return;
    claimed = true;
    window.removeEventListener('keydown', onKey);
    o.save.set(o.currency, wallet(o.save, o.currency) + amount);
    o.save.set('dailyDate', today);
    o.save.set('dailyStreak', streak);
    [659, 784, 988, 1319].forEach((f, j) => scene.time.delayedCall(j * 80, () => audio.tone(f, 0.18, 'triangle', 0.13)));
    const w = scene.scale.width, h = scene.scale.height;
    const burst = scene.add.particles(w / 2, h / 2, o.currencyIcon, {
      speed: { min: 200, max: 560 }, lifespan: 1000, scale: { start: 0.4, end: 0 }, gravityY: 600, emitting: false,
    }).setDepth(70);
    burst.explode(30);
    scene.time.delayedCall(1100, () => burst.destroy());
    scene.scale.off('resize', build);
    const r = root;
    root = null;
    if (r) scene.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
    scene.time.delayedCall(50, () => setModal(scene, false));
    o.onClaim?.(amount, wallet(o.save, o.currency));
  };

  const build = () => {
    root?.destroy();
    const w = scene.scale.width, h = scene.scale.height;
    // el panel guarda la proporción del diseño (720×520): en vertical no queda un hueco enorme
    const s = Phaser.Math.Clamp(Math.min((w - 24) / 720, (h - 24) / 520), 0.4, 1.1);
    const pw = 720 * s, ph = 520 * s;
    const c = modalPanel(scene, pw, ph, o.panel);
    root = c;
    const cy = h / 2;
    // regalo grande que se balancea, con rayos detrás
    const rays = scene.add.graphics({ x: w / 2, y: cy - 130 * s });
    rays.fillStyle(PALETTE.yellow, 0.35);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.fillTriangle(0, 0, Math.cos(a - 0.12) * 120 * s, Math.sin(a - 0.12) * 120 * s, Math.cos(a + 0.12) * 120 * s, Math.sin(a + 0.12) * 120 * s);
    }
    scene.tweens.add({ targets: rays, angle: 360, duration: 9000, repeat: -1 });
    const gift = scene.add.image(w / 2, cy - 130 * s, 'ic-gift').setDisplaySize(150 * s, 150 * s);
    scene.tweens.add({ targets: gift, angle: { from: -8, to: 8 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    c.add([rays, gift]);
    // escala de 7 días: cobrados (verde con marca), hoy (amarillo, latiendo), próximos (gris)
    const step = Math.min(88 * s, (pw - 40 * s) / DAILY_DAYS);
    const r = step * 0.42;
    for (let i = 1; i <= DAILY_DAYS; i++) {
      const x = w / 2 + (i - (DAILY_DAYS + 1) / 2) * step, y = cy + 4 * s;
      const past = i < day, now = i === day;
      const dot = scene.add.circle(x, y, r, past ? PALETTE.green : now ? PALETTE.yellow : 0xd9d2e6).setStrokeStyle(Math.max(2, 5 * s), PALETTE.ink);
      c.add(dot);
      if (past) c.add(scene.add.image(x, y, 'ic-ok').setDisplaySize(r * 1.5, r * 1.5));
      else {
        const num = bigNumber(scene, x, y, r * 0.8, `${dailyAmount(i, o.amounts)}`);
        if (!now) num.setAlpha(0.8);
        c.add(num);
      }
      if (now) {
        dot.setScale(1.15);
        scene.tweens.add({ targets: dot, scale: 1.3, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }
    // premio de hoy y botón de cobrar
    const ry = cy + 96 * s;
    const plus = bigNumber(scene, w / 2 + 34 * s, ry, 78 * s, `+${amount}`).setOrigin(1, 0.5);
    const ic = scene.add.image(w / 2 + 76 * s, ry, o.currencyIcon).setDisplaySize(76 * s, 76 * s);
    const totalW = plus.displayWidth + 12 * s + 76 * s;
    plus.setX(w / 2 - totalW / 2 + plus.displayWidth); ic.setX(plus.x + 12 * s + 38 * s);
    c.add([plus, ic]);
    const ok = iconButton(scene, w / 2, cy + 190 * s, 'ok', PALETTE.green, 50 * s, claim);
    pulse(scene, ok, 0.06);
    c.add(ok);
    c.setData('daily', day);
  };

  // teclado: espacio o intro cobran (el teclado de Phaser está parado mientras la ventana está abierta)
  const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); claim(); } };
  window.addEventListener('keydown', onKey);
  build();
  scene.scale.on('resize', build);
  scene.events.once('shutdown', () => { scene.scale.off('resize', build); window.removeEventListener('keydown', onKey); setModal(scene, false); });
  return { claim };
}
