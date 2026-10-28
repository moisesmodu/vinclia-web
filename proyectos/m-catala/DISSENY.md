# Disseny d'Aprova · pla i criteris (28/10/2026, segona passada)

Brief: la marca és fixa (MARCAS.md: família Nuevo en España, crema `#FBF5EC`, nit `#1F2A44`, terracota `#D9603B`, ocre `#E0B23A`, oliva
`#7A8F3C`; Outfit + Noto Sans; logotip sense redibuixar). El que es pot i s'ha de decidir és tot el que hi ha a sobre: jerarquia, ritme,
l'element memorable, el to del text, el moviment. Primera versió rebutjada: «kit de targetes» idèntiques amb ombra grisa, barres planes,
un «2 %» vermell com a primera emoció, etiquetes de sistema («0 congelacions aquest mes»).

## D'on surt el caràcter: el món de l'examen
Aprova no és una app d'idiomes: és la prova oficial, a casa. El vocabulari visual surt d'allà:
- **El full de respostes**: ítems numerats com a l'examen, opcions amb lletra en cercle, marca a llapis. Paper, no targeta.
- **La nota en l'escala real**: «27 / 40», «apte» amb el mínim marcat a la barra. Mai percentatges decimals.
- **El segell APTE**: un tampó inclinat, ocre, que apareix una sola vegada quan toca (resultat del simulacre).
- **El rellotge d'examen**: un cronòmetre sobri, tabular, que només es posa vermell els últims dos minuts.

## L'element memorable (només un): el dial de probabilitat
Un arc gran de 270°, traç gruixut ocre sobre crema, amb l'agulla a la probabilitat d'avui i una marca fixa al punt d'apte. El número al
centre en Outfit 64. Sota, una sola frase que diu què vol dir i què fer avui («Avui series no apte per l'oral. La sessió d'avui l'ataca.»).
Es dibuixa una vegada (1,2 s, cúbic) i mai més. Tota la resta de la pantalla és tranquil·la.

## Tokens
- Color: crema `#FBF5EC` (fons), paper `#FFFFFF` (fulls), nit `#1F2A44` (text, botó primari), ocre `#E0B23A` (acció i dial), ocre tenue
  `#F6E7BF`, terracota `#D9603B` (només alertes de termini i la ratxa), oliva `#7A8F3C` (apte, encert), vermell examen `#B9342E` (error, temps).
  Grisos del text: `#4A5570` (secundari), `#8A92A6` (terciari). Línies: `#E8DECB` (1 px). Cap ombra grisa: la profunditat és el paper sobre la crema.
- Tipografia: Outfit 700 per a títols i números (tracking −0,02 em a partir de 32 px); Noto Sans 400/600 per a tot el text. Escala:
  13 · 15 · 17 · 20 · 26 · 34 · 48 · 64. Línia ≤ 70 caràcters. Números sempre tabulars.
- Radi: 6 px (controls), 14 px (fulls); 999 (xips). Un sol nivell d'ombra, i només al botó primari premut.
- Espai: 4 · 8 · 12 · 16 · 24 · 32 · 48. Marge lateral 20 px al mòbil.

## Maquetació
Columna única al mòbil, 640 px màxim al centre a l'escriptori per a l'app, 760 per a les guies. Alineació a l'esquerra, sempre. Les
seccions se separen amb espai (32–48 px) i línies d'1 px, no amb targetes. Full (fons blanc amb vora `#E8DECB`) només per al que es respon.

```
Inici (mòbil)                        Avui                                Resultat
┌─────────────────────────┐          ┌─────────────────────────┐         ┌─────────────────────────┐
│ Aprova         Preus ES │          │ Dimarts 28 · C1 · 192 d │         │        ╭───────╮         │
│                         │          │ ◔ 38 %   🔥 4    ⏰ 192 │         │       ╱  38 %   ╲        │
│ 1 de cada 4 suspèn.     │          ├─────────────────────────┤         │      │ probabilitat│      │
│ Sàpiga-ho abans de      │          │ La sessió d'avui · 15'  │         │       ╲ d'aprovar ╱      │
│ pagar la taxa.          │          │ ▌repàs 6' ▌pronoms 6'   │         │        ╰───────╯         │
│                         │          │ ▌oral 3'                │         │ Avui series no apte per  │
│ ┌ Prova-ho ───────────┐ │          │ [ Començar ]            │         │ l'oral. Hi treballem.    │
│ │ 1. No ___ he parlat. │ │          ├─────────────────────────┤         ├─────────────────────────┤
│ │ ⓐ hi  ⓑ ho  ⓒ li     │ │          │ Minisessió 2' · Oral    │         │ Àrea 1 ▓▓▓▓▓▓▓░░ 27/40 │
│ └──────────────────────┘ │          │ Inscripció: 20–28 gen   │         │ Àrea 2 ▓▓▓▓▓░░░░ 31/45 │
│ [ Fes el diagnòstic ]    │          └─────────────────────────┘         │ Oral   ▓▓▓▓░░░░░ 16/30 │
└─────────────────────────┘                                              └─────────────────────────┘
```

## Principis
1. Una pantalla, una acció. El botó primari (nit) és un per pantalla; l'ocre només per a l'acció que fa avançar (començar, comprovar).
2. Res de gamificació per sobre de l'aprenentatge: la ratxa és un número petit amb una flama fina, mai un diàleg.
3. El text parla com una professora que ja ha aprovat: present, segona persona, cap etiqueta de sistema. «Et queden 2 congelacions», no
   «0 congelacions aquest mes». Les xifres dolentes van sempre amb el següent pas.
4. Moviment: un sol moment orquestrat (el dial). Els ítems entren lliscant des de la dreta (seqüència ordenada, View Transitions);
   la correcció apareix al lloc, sense salts. `prefers-reduced-motion` ho apaga tot.
5. Accessibilitat sense anunciar-la: focus visible (anell nit 2 px), contrast AA, mides de toc 44 px, `aria-live` a la correcció.

## Revisió contra el genèric
- Crema + accent càlid: és la marca, no una tria; per compensar, zero ombres grises, zero targetes repetides, cap «→» als botons, cap
  etiqueta en majúscules, cap «A · B · C» com a títol.
- El «gran número amb etiqueta petita»: només al dial, perquè la probabilitat ÉS el producte. A la resta, notes en l'escala real (27/40).
- Cap fade-in per secció. Cap gradient decoratiu.
