# Marca Aprova · identitat (28/10/2026, tercera passada: marca nova)

Moisés ha rebutjat les dues primeres versions («es nota que està feta amb IA», «sembla d'un aprenent») i demana marca, logotip,
estil i personatge propis, amb ganxo. Aquest document és el brief resolt; `DISSENY.md` en recull l'aplicació a les pantalles.

## La idea: el full de respostes i el punt volat
Aprova no és una app d'idiomes: és l'examen oficial, a casa, abans de pagar la taxa. Tot el llenguatge visual surt de dues coses
que només té l'examen de català:
- **El full de respostes.** Paper blanc, bombolles que s'omplen amb bolígraf blau, marques de registre negres a les cantonades,
  quadrícula de llibreta escolar. Aquest és el material: res de targetes de SaaS ni de degradats.
- **El punt volat (l·l).** L'únic signe que només existeix en català i el que més costa als castellanoparlants. És el nostre
  personatge: **en Volat**, un punt blau amb cara que vola pel full, aterra sobre els errors i, quan aproves, es posa content.
  Al logotip s'asseu dins de la «v» d'«Aprova». A la portada fa de punt final de la frase. Mai és una mascota decorativa: apareix
  quan hi ha una cosa a dir (error trobat, resultat, ratxa, pantalla buida).

## Tokens
- **Color** (cinc, i prou):
  - Paper `#FFFFFF` (fons de tot) · Quadrícula `#DCE3F3` (línies de la llibreta, 1 px, només a la portada i als fulls)
  - Boli `#2140D6` (marca, acció, bombolla marcada) · Boli fosc `#1830A6` (premut) · Boli tenue `#E9EDFF` (fons de nota)
  - Tinta `#141C3A` (tot el text) · Llapis `#5B6480` (secundari) · Llapis clar `#8A92AB` (terciari) · Línia `#D9DEEC`
  - Marcador `#FFF056` (subratllat fluorescent de l'error i de les dates clau; mai de fons gran) · Marcador tenue `#FFF9B8`
  - Corrector `#E03A2F` (error, no apte, últims minuts) · Apte `#138A5C` (encert, apte). Tenues: `#FDE7E5`, `#DEF5EA`.
  No hi ha crema, ocre, terracota ni oliva. No hi ha ombres grises: la profunditat és la vora de tinta i la quadrícula.
- **Tipografia**: una sola família, **Archivo** variable (eix d'amplada 62–125). Titulars i números en *Expanded ExtraBold*
  (amplada 125, pes 800, interlletratge −0,02 em, interlineat 0,98): el pes dels cartells catalans, no d'un dashboard. Text en
  amplada 100, pes 400/600, 17 px, interlineat 1,55. Números sempre tabulars. Escala: 13 · 15 · 17 · 20 · 24 · 32 · 44 · 60.
- **Forma**: radi 8 px als controls, 4 px a les bombolles (són cercles), 12 px al full. Vores d'1,5 px de tinta o boli.
- **Espai**: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Marge lateral 20 px al mòbil. Amplada de lectura 640 px.

## Logotip
Marca denominativa «Aprova» en Archivo Expanded ExtraBold convertida a traçat (`public/marca/logo.svg`, `components/Logo.tsx`)
amb en Volat assegut dins de la «v». Versions: boli sobre paper, paper sobre boli, tinta. Icona: en Volat sobre fons boli
(`app/icon.svg`, `public/icons/*`). Mai es redibuixa el text ni es canvia la posició del personatge.

## En Volat (personatge)
Cercle boli (o paper sobre boli) amb dos ulls de tinta amb reflex i una boca petita. Postures (`components/Volat.tsx`):
`neutre`, `content` (ulls tancats de riure, boca ampla), `pensa` (una cella alçada, mira amunt), `sorpres` (ulls grans, boca
rodona) i `vola` (estela de dues línies). Es mou una sola vegada per pantalla (aterra), mai en bucle; amb `prefers-reduced-motion`
no es mou. Parla en segona persona i curt («Aquí hi ha un castellanisme.», «Apte. Demà en fem una altra.»).

## Veu i ganxo (la necessitat)
La necessitat és concreta i la diem amb números: un de cada quatre suspèn; la taxa (57,45 € a la DPL, fins a 120 € a la
universitat) no es torna; entre convocatòria i convocatòria passen mesos; sense el certificat no s'acredita el nivell a
l'oposició ni a l'ICS. La promesa: «Sabràs si aproves abans de pagar la taxa.» Sempre amb la data real de la propera inscripció
a la vista (compte enrere des de `config/convocatories.json`).

## Què no fem
Cors, avatars, confeti, gradients, targetes idèntiques, etiquetes en majúscules, «→» als botons, una paraula de color al titular.
