import Phaser from 'phaser';
import { iconButton, bigNumber, PALETTE } from './ui';
import { audio } from './audio';

/**
 * Tienda de cosméticos sin texto, pagada con la moneda que ya guarda cada juego (estrellas, regalos...).
 * Se abre como capa modal sobre el menú. Cada juego da su lista de objetos (icono = la propia textura del
 * cosmético, generada por código) y aplica lo equipado con sus propias texturas.
 *
 * Guardado (claves que añade cada juego a su Save): owned: string[] (ids comprados) y equipped: Record<hueco, id>.
 * Los objetos de precio 0 son de serie (siempre comprados). Un hueco con defecto '' admite "nada" (tocar lo
 * equipado lo quita), por ejemplo los gorros.
 */

/** Lo mínimo del Save de cada juego que usan la tienda y la recompensa diaria (Save<T> encaja tal cual). */
export interface KV { get(k: any): any; set(k: any, v: any): void }

export type ShopItem = {
  id: string;
  slot: string;
  price: number;
  /** Textura de la vista previa (la del propio cosmético). */
  icon: string;
  /** Color de fondo de la vista previa (por ejemplo cielo nocturno para unas luces). */
  bg?: number;
};

export type ShopOpts = {
  save: KV;
  /** Clave de la moneda en el Save del juego ('stars', 'gifts'...). */
  currency: string;
  /** Textura del icono de la moneda ('ic-star', 'gift0'...). */
  currencyIcon: string;
  items: ShopItem[];
  /** Objeto de serie por hueco ('' = nada). */
  defaults: Record<string, string>;
  /** Tras equipar o quitar: el juego vuelve a generar sus texturas. */
  onChange?: () => void;
  /** Al cerrar (o al cambiar la moneda): el menú refresca su contador. */
  onWallet?: (n: number) => void;
  onClose?: () => void;
  /** Color del panel (por defecto, crema). */
  panel?: number;
};

const MODAL = '__modal';
/** true mientras hay una tienda o recompensa diaria abierta (el menú no debe arrancar la partida con el teclado). */
export function modalOpen(scene: Phaser.Scene) { return !!scene.data?.get(MODAL); }
export function setModal(scene: Phaser.Scene, on: boolean) {
  scene.data.set(MODAL, on);
  // el teclado del menú (espacio/intro = jugar) no responde mientras hay una ventana abierta
  if (scene.input?.keyboard) scene.input.keyboard.enabled = !on;
}

export function wallet(save: KV, currency: string): number { return (save.get(currency) as number) || 0; }
export function addCurrency(save: KV, currency: string, n: number) { save.set(currency, wallet(save, currency) + n); }

function ownedList(save: KV): string[] { return (save.get('owned') as string[] | undefined) ?? []; }
function equippedMap(save: KV): Record<string, string> { return (save.get('equipped') as Record<string, string> | undefined) ?? {}; }

export function owns(save: KV, item: ShopItem) { return item.price <= 0 || ownedList(save).includes(item.id); }

/** Objeto equipado en un hueco (o el de serie). Se comprueba que siga siendo del jugador. */
export function equippedId(save: KV, slot: string, def: string, items?: ShopItem[]) {
  const id = equippedMap(save)[slot];
  if (id === undefined) return def;
  if (id === '' || !items) return id;
  const it = items.find((i) => i.id === id);
  return it && owns(save, it) ? id : def;
}

/** Hay algo que el jugador puede comprar ya (para el punto rojo del botón de la tienda). */
export function canAfford(save: KV, currency: string, items: ShopItem[]) {
  const n = wallet(save, currency);
  return items.some((i) => !owns(save, i) && i.price <= n);
}

/** Compra (si hace falta y alcanza) y equipa. Devuelve 'equip' | 'unequip' | 'buy' | 'poor'. Pura respecto a la escena. */
export function tapItem(save: KV, o: Pick<ShopOpts, 'currency' | 'defaults' | 'items'>, item: ShopItem): 'equip' | 'unequip' | 'buy' | 'poor' {
  const eq = { ...equippedMap(save) };
  const def = o.defaults[item.slot] ?? '';
  if (owns(save, item)) {
    const cur = equippedId(save, item.slot, def, o.items);
    if (cur === item.id) {
      if (def !== '') return 'equip'; // ya puesto y el hueco no admite "nada"
      eq[item.slot] = '';
      save.set('equipped', eq);
      return 'unequip';
    }
    eq[item.slot] = item.id;
    save.set('equipped', eq);
    return 'equip';
  }
  const n = wallet(save, o.currency);
  if (n < item.price) return 'poor';
  save.set(o.currency, n - item.price);
  save.set('owned', [...ownedList(save), item.id]);
  eq[item.slot] = item.id;
  save.set('equipped', eq);
  return 'buy';
}

/** Panel modal común (sombra que bloquea lo de debajo + rectángulo redondeado). */
export function modalPanel(scene: Phaser.Scene, pw: number, ph: number, color = 0xfff6e8, depth = 60) {
  const w = scene.scale.width, h = scene.scale.height;
  const c = scene.add.container(0, 0).setDepth(depth);
  const shade = scene.add.rectangle(w / 2, h / 2, w, h, 0x2b2340, 0.6).setInteractive();
  const g = scene.add.graphics();
  const s = Math.min(1.4, Math.max(0.5, Math.min(pw, ph) / 600));
  g.fillStyle(0x000000, 0.25).fillRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2 + 10 * s, pw, ph, 28 * s);
  g.fillStyle(color, 0.98).fillRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 28 * s);
  g.lineStyle(8 * s, PALETTE.ink).strokeRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 28 * s);
  c.add([shade, g]);
  return c;
}

/** Botón de la tienda para el menú: bolsa con un punto rojo si ya alcanza para algo nuevo. */
export function shopButton(scene: Phaser.Scene, o: { save: KV; currency: string; items: ShopItem[]; color?: number; onClick: () => void }) {
  const b = iconButton(scene, 0, 0, 'shop', o.color ?? 0xff6fae, 44, o.onClick);
  const dot = scene.add.circle(32, -32, 13, PALETTE.red).setStrokeStyle(5, PALETTE.white);
  b.add(dot);
  let tw: Phaser.Tweens.Tween | null = null;
  const refresh = () => {
    const on = canAfford(o.save, o.currency, o.items);
    dot.setVisible(on);
    if (on && !tw) tw = scene.tweens.add({ targets: dot, scale: 1.25, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (!on && tw) { tw.stop(); tw = null; dot.setScale(1); }
  };
  refresh();
  return Object.assign(b, { refresh });
}

/** Abre la tienda. Se reconstruye entera al comprar/equipar o al cambiar el tamaño de la pantalla. */
export function openShop(scene: Phaser.Scene, o: ShopOpts) {
  let root: Phaser.GameObjects.Container | null = null;
  let closed = false;
  setModal(scene, true);

  const build = () => {
    root?.destroy();
    const w = scene.scale.width, h = scene.scale.height, portrait = h > w;
    const pw = Math.min(w - 20, 1120), ph = Math.min(h - 20, 700);
    const c = modalPanel(scene, pw, ph, o.panel);
    root = c;
    const s = Phaser.Math.Clamp(Math.min(pw / 1000, ph / 620), 0.55, 1.2);
    const top = h / 2 - ph / 2, left = w / 2 - pw / 2;

    // cabecera: bolsa, monedero y cerrar
    const headY = top + 52 * s;
    const bag = scene.add.circle(left + 56 * s, headY, 34 * s, 0xff6fae).setStrokeStyle(5 * s, PALETTE.ink);
    const bagIc = scene.add.image(bag.x, headY, 'ic-shop').setDisplaySize(46 * s, 46 * s);
    const cur = scene.add.image(w / 2 - 40 * s, headY, o.currencyIcon).setDisplaySize(54 * s, 54 * s);
    const n = bigNumber(scene, cur.x + 36 * s, headY + 2 * s, 50 * s, `${wallet(o.save, o.currency)}`).setOrigin(0, 0.5);
    const close = iconButton(scene, left + pw - 50 * s, headY, 'x', PALETTE.red, 32 * s, () => shut());
    c.add([bag, bagIc, cur, n, close]);

    // rejilla: se elige el número de columnas que da casillas más grandes
    const gx0 = left + 20 * s, gy0 = top + 104 * s, gw = pw - 40 * s, gh = ph - 124 * s;
    const N = o.items.length;
    let cols = 1, cell = 0;
    for (let k = 1; k <= N; k++) {
      const rows = Math.ceil(N / k);
      const size = Math.min(gw / k, gh / rows);
      if (size > cell + 0.5) { cell = size; cols = k; }
    }
    if (!portrait) cols = Math.max(cols, Math.min(N, 3));
    const rows = Math.ceil(N / cols);
    const cw = Math.min(gw / cols, 250 * s), chh = Math.min(gh / rows, 250 * s);
    const card = Math.min(cw, chh) * 0.9;
    const k = card / 200; // escala de la casilla (diseño a 200 px)
    const ox = w / 2 - (cols * cw) / 2 + cw / 2, oy = gy0 + gh / 2 - (rows * chh) / 2 + chh / 2;
    const slots = [...new Set(o.items.map((i) => i.slot))];

    o.items.forEach((item, i) => {
      const x = ox + (i % cols) * cw, y = oy + Math.floor(i / cols) * chh;
      const own = owns(o.save, item);
      const def = o.defaults[item.slot] ?? '';
      const on = equippedId(o.save, item.slot, def, o.items) === item.id;
      const poor = !own && wallet(o.save, o.currency) < item.price;
      const cc = scene.add.container(x, y);
      const g = scene.add.graphics();
      const half = 100 * k;
      g.fillStyle(0x000000, 0.18).fillRoundedRect(-half, -half + 8 * k, 2 * half, 2 * half, 22 * k);
      const tone = slots.indexOf(item.slot) % 2 ? 0xefe6ff : 0xffffff;
      g.fillStyle(item.bg ?? tone).fillRoundedRect(-half, -half, 2 * half, 2 * half, 22 * k);
      g.fillStyle(0x000000, 0.06).fillRoundedRect(-half, half - 56 * k, 2 * half, 56 * k, { tl: 0, tr: 0, bl: 22 * k, br: 22 * k });
      g.lineStyle((on ? 10 : 6) * k, on ? PALETTE.green : PALETTE.ink).strokeRoundedRect(-half, -half, 2 * half, 2 * half, 22 * k);
      cc.add(g);
      const tex = scene.textures.get(item.icon).getSourceImage() as { width: number; height: number };
      const fit = Math.min((150 * k) / tex.width, (112 * k) / tex.height);
      const pic = scene.add.image(0, -26 * k, item.icon).setScale(fit);
      if (!own) pic.setAlpha(poor ? 0.55 : 0.9);
      cc.add(pic);
      const by = half - 28 * k;
      if (own) {
        // equipado: círculo verde con marca; comprado: círculo vacío (tocar = equipar)
        const ring = scene.add.circle(0, by, 20 * k, on ? PALETTE.green : 0xffffff, on ? 1 : 0.9).setStrokeStyle(5 * k, PALETTE.ink);
        cc.add(ring);
        if (on) cc.add(scene.add.image(0, by, 'ic-ok').setDisplaySize(34 * k, 34 * k));
      } else {
        const ci = scene.add.image(-26 * k, by, o.currencyIcon).setDisplaySize(38 * k, 38 * k);
        const pn = bigNumber(scene, -4 * k, by + 1 * k, 34 * k, `${item.price}`).setOrigin(0, 0.5);
        if (poor) pn.setColor('#ff8a8a');
        // precio centrado debajo
        const wTot = 38 * k + 4 * k + pn.displayWidth;
        ci.setX(-wTot / 2 + 19 * k); pn.setX(ci.x + 23 * k);
        const lock = scene.add.circle(-half + 26 * k, -half + 26 * k, 22 * k, poor ? 0x8a8296 : PALETTE.blue).setStrokeStyle(4 * k, PALETTE.white);
        const li = scene.add.image(lock.x, lock.y, 'ic-padlock').setDisplaySize(32 * k, 32 * k);
        cc.add([ci, pn, lock, li]);
      }
      cc.setSize(2 * half, 2 * half).setInteractive({ useHandCursor: true }).setData('item', item.id);
      cc.on('pointerdown', () => scene.tweens.add({ targets: cc, scale: 0.93, duration: 60 }));
      cc.on('pointerout', () => scene.tweens.add({ targets: cc, scale: 1, duration: 80 }));
      cc.on('pointerup', () => {
        cc.setScale(1);
        const r = tapItem(o.save, o, item);
        if (r === 'poor') {
          audio.tone(180, 0.18, 'square', 0.08, 120);
          scene.tweens.add({ targets: cc, x: x + 8 * k, duration: 50, yoyo: true, repeat: 3, onComplete: () => cc.setX(x) });
          return;
        }
        if (r === 'buy') {
          [784, 988, 1175, 1568].forEach((f, j) => scene.time.delayedCall(j * 70, () => audio.tone(f, 0.16, 'triangle', 0.12)));
          o.onWallet?.(wallet(o.save, o.currency));
        } else audio.tone(r === 'unequip' ? 440 : 880, 0.1, 'triangle', 0.12, r === 'unequip' ? 300 : 1200);
        o.onChange?.();
        build();
        if (r === 'buy' && root) {
          const burst = scene.add.particles(x, y, o.currencyIcon, {
            speed: { min: 150, max: 420 }, lifespan: 800, scale: { start: 0.3 * k, end: 0 }, gravityY: 500, emitting: false,
          }).setDepth(61);
          burst.explode(18);
          root.add(burst); // se va con la tienda
          scene.time.delayedCall(900, () => burst.destroy());
        }
      });
      c.add(cc);
    });
    c.setData('items', o.items.length);
  };

  const shut = () => {
    if (closed) return;
    closed = true;
    scene.scale.off('resize', build);
    root?.destroy();
    root = null;
    // el teclado del menú vuelve a responder en el fotograma siguiente
    scene.time.delayedCall(50, () => setModal(scene, false));
    o.onWallet?.(wallet(o.save, o.currency));
    o.onClose?.();
  };
  build();
  scene.scale.on('resize', build);
  scene.events.once('shutdown', () => { scene.scale.off('resize', build); setModal(scene, false); });
  return { close: shut, get container() { return root; } };
}
