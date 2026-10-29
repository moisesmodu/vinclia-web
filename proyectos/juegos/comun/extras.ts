import Phaser from 'phaser';
import { shopButton, openShop, wallet, type KV, type ShopItem } from './tienda';
import { maybeShowDaily } from './diario';

/**
 * Lo que añade cada menú para la retención: botón de la tienda (con punto rojo si alcanza para algo) y la
 * ventana de recompensa diaria la primera vez del día. El juego solo coloca el botón en su layout y refresca su
 * contador de moneda con onWallet.
 */
export function menuExtras(scene: Phaser.Scene, o: {
  save: KV; currency: string; currencyIcon: string;
  items: ShopItem[]; defaults: Record<string, string>; daily: number[];
  /** Tras equipar: el juego vuelve a generar sus texturas. */
  onChange?: () => void;
  /** El contador de moneda del menú cambia (compra o premio diario). */
  onWallet: (n: number) => void;
  color?: number; panel?: number;
}) {
  const shop = shopButton(scene, {
    save: o.save, currency: o.currency, items: o.items, color: o.color,
    onClick: () => openShop(scene, {
      save: o.save, currency: o.currency, currencyIcon: o.currencyIcon, items: o.items, defaults: o.defaults, panel: o.panel,
      onChange: o.onChange,
      onWallet: (n) => { o.onWallet(n); shop.refresh(); },
    }),
  });
  maybeShowDaily(scene, {
    save: o.save, currency: o.currency, currencyIcon: o.currencyIcon, amounts: o.daily, panel: o.panel,
    onClaim: () => { o.onWallet(wallet(o.save, o.currency)); shop.refresh(); },
  });
  return {
    shop,
    /** Colocar en la esquina inferior izquierda (simétrico al botón de sonido). */
    place(s: number) { shop.setPosition(62 * s, scene.scale.height - 62 * s).setScale(s); },
  };
}
