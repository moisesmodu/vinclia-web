# Aprova · Cerca · Català — configuració de la campanya (preparada, **SENSE ACTIVAR**)

> Escenari S1 prudent (VIABILIDAD §5): cap anunci fins al mes 2 i mai sense l'aprovació mensual de Moisés. Tots els elements s'importen a Google Ads Editor amb estat **Paused**.

| Paràmetre | Valor |
|---|---|
| Nom de campanya | `Aprova · Cerca · Català` |
| Tipus | Cerca (només xarxa de cerca; sense partners de cerca ni Display) |
| Pressupost | **100 €/mes** → 3,30 €/dia |
| Estratègia de puja | CPC manual al principi (CPC màx. per paraula clau al CSV); passar a «Maximitzar conversions» quan hi hagi 30 diagnòstics començats |
| Ubicació | Catalunya (presència física), amb exclusió de la resta d'Espanya |
| Idiomes | Català i castellà |
| Conversió principal | «Diagnòstic començat» (esdeveniment de l'analítica sense galetes); secundàries: «Diagnòstic acabat» i «Compra» |
| Calendari | Tot el dia; pujar la puja un 20 % del 15 de desembre al 28 de gener (inscripció DPL) i de l'1 d'abril al 8 de maig (proves) |
| Grups d'anuncis | `C1 oposicions` (≈ 50 % del pressupost), `B2` (≈ 20 %), `Sanitat` (≈ 30 %) |
| Concordança | Totes les paraules clau en **concordança de frase** (`Phrase`) |
| Anuncis | 1 anunci de cerca responsiu per grup i idioma (6 en total): 10 títols ≤ 30 i 4 descripcions ≤ 90, estat Paused |
| Negatives | A nivell de campanya (`negativas.csv`): PDF gratis, inscripció CPNL, traductors, diccionaris, altres llengües, valencià, nens i ESO, feina i sou, llibres, temari |
| Extensions | Enllaços de lloc: «Diagnòstic gratuït», «Calendari 2027», «Preus», «Quin nivell demanen». Fragments: «Nivells: B1, B2, C1, C2». Preu: Premium 9,99 €/mes · Anual 59,99 € · Passi 3 mesos 24,99 € |
| URL final | Provisional `https://aprova-catala.vercel.app` (config/marca.json). Canviar a `https://aprova.cat` quan Moisés compri el domini |

## Fitxers

- `palabras-clave.csv`: 45 paraules clau (26 ca, 19 es) en concordança de frase, amb CPC màxim de 0,40 a 0,90 €.
- `anuncios.csv`: 6 anuncis responsius (ca i es per a cada grup). Longituds comprovades per script (10 títols ≤ 30, 4 descripcions ≤ 90).
- `negativas.csv`: 59 negatives de campanya.

## Com importar a Google Ads Editor

1. Compte > Importar > Des d'un fitxer. Primer `palabras-clave.csv` (crea campanya i grups), després `anuncios.csv`, després `negativas.csv`.
2. Revisar la previsualització: les columnes `Idioma`, `Notas` i `Nivel` són informatives i s'ignoren en importar.
3. Comprovar que tot queda en **Paused** i publicar els canvis a l'Editor sense activar la campanya.
4. Activar només amb l'aprovació escrita de Moisés (PARA-MOISES.md), a partir del mes 2 i amb l'analítica de conversions ja funcionant.

## Primer mes d'activitat (quan s'activi)

- Setmana 1: revisar els termes de cerca cada dos dies i afegir negatives.
- Setmana 2: pausar les paraules clau sense impressions; pujar un 10 % les que tinguin CTR > 5 %.
- Setmana 4: cost per diagnòstic començat. Si és > 2 €, reduir a només el grup C1 oposicions; si és < 1 €, proposar a Moisés pujar a 150 €/mes.
