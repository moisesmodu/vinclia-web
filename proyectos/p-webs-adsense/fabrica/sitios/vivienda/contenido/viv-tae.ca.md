---
slug: calculadora-tae-hipoteca
titulo: "TAE de la hipoteca amb vinculacions: calculadora"
h1: "TAE de la hipoteca amb vinculacions"
descripcion: "Calcula la TAE real d’una hipoteca bonificada amb assegurances i productes vinculats i compara-la amb l’oferta sense bonificar: quota, cost total i si compensa."
resumen: "Posa el TIN amb i sense bonificacions i el que costen les assegurances: veuràs la TAE de cada opció i quant guanyes o perds en tot el termini bonificant-te."
palabraClave: "calcular tae hipoteca"
actualizado: 2026-10-30
fuentes:
  - nombre: "Ordre EHA/2899/2011 de transparència bancària (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-16970"
  - nombre: "Llei 5/2019 reguladora dels contractes de crèdit immobiliari (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "Banc d’Espanya: Portal del Client Bancari, préstec hipotecari"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
faq:
  - p: "Per què la TAE és més alta que el TIN?"
    r: "Perquè inclou les despeses a càrrec teu (taxació, comissió d’obertura) i les primes dels productes vinculats que exigeix el banc per donar-te aquest TIN."
  - p: "Estic obligat a contractar l’assegurança de vida?"
    r: "No. El banc pot oferir un interès més baix si la contractes, però no et pot obligar, llevat de l’assegurança de danys de l’immoble, que sí que és obligatòria i pots contractar amb qui vulguis."
  - p: "La TAE d’una variable és fixa?"
    r: "No. Es calcula amb l’Euríbor del moment i canviarà a cada revisió. Serveix per comparar ofertes el mateix dia."
---
Molts bancs ofereixen un interès més baix si contractes **assegurances**, domicilies la **nòmina** o fas servir la seva **targeta**. La **TAE** ho posa tot en una sola xifra per comparar ofertes.

## Com es calcula

1. **Diners que reps** = import − despeses a càrrec teu (taxació i comissió d’obertura).
2. **Pagaments mensuals** = quota amb el TIN + primes de les assegurances prorratejades per mes + altres productes vinculats.
3. **TAE**: es busca pel mètode de Newton l’interès mensual *r* que iguala el que reps amb el valor actual dels pagaments, i TAE = (1 + r)^12 − 1. És el mètode de l’annex de l’Ordre EHA/2899/2011, simplificat a quotes mensuals iguals.
4. Es repeteix per a l’oferta **sense bonificar** (sense productes vinculats) i es compara el cost total.

## Exemple

**180.000 € a 30 anys**. Amb bonificacions, TIN del **2,60 %**, assegurança de vida de 300 € i de la llar de 250 € l’any; sense bonificar, TIN del **3,40 %**; taxació de 350 €:

- TAE bonificada: **3,14 %**; TAE sense bonificar: **3,47 %**;
- bonificar-te t’estalvia uns **11.456 €** en tot el termini, si les assegurances no pugen.

Les primes de l’assegurança de vida solen pujar amb l’edat: demana el preu dels propers anys.
