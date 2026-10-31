---
slug: simulador-hipoteca
titulo: "Simulador d’hipoteca 2027: quota, interessos i Euríbor"
h1: "Simulador d’hipoteca"
descripcion: "Calcula la quota mensual de la teva hipoteca fixa, variable o mixta, els interessos totals i el quadre per anys, amb el tipus mitjà de l’INE i l’últim Euríbor."
resumen: "Posa l’import, el termini i l’interès: veuràs la quota de cada mes, els interessos i com baixa el deute any rere any, sense deixar dades."
palabraClave: "simulador hipoteca 2027"
actualizado: 2026-10-30
fuentes:
  - nombre: "Llei 5/2019 reguladora dels contractes de crèdit immobiliari (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "INE: Estadística d’Hipoteques, juliol del 2026"
    url: "https://www.ine.es/dyngs/Prensa/H0726.htm"
  - nombre: "Banc d’Espanya: tipus d’interès de referència oficials"
    url: "https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html"
  - nombre: "Banc d’Espanya: Portal del Client Bancari, préstec hipotecari"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
faq:
  - p: "Quin interès hi poso si encara no tinc oferta?"
    r: "Per defecte fem servir el tipus mitjà de les hipoteques sobre habitatge que publica l’INE (3,01 % el juliol del 2026). És una mitjana: la teva oferta dependrà dels teus ingressos, el teu estalvi i les vinculacions que acceptis."
  - p: "Quina diferència hi ha entre TIN i TAE?"
    r: "El TIN és l’interès que s’aplica al capital i amb ell es calcula la quota. La TAE hi suma les comissions i les assegurances vinculades, i serveix per comparar ofertes. Tens la calculadora de TAE en aquest mateix lloc."
  - p: "Per què gairebé tota la quota són interessos al principi?"
    r: "En el sistema francès la quota és fixa, però els interessos es calculen sobre el deute pendent. Al principi el deute és màxim i els interessos també; amb els anys pesa més el capital."
  - p: "El simulador serveix per a una hipoteca mixta?"
    r: "Sí. Tria «Mixt», indica els anys a tipus fix i l’Euríbor i el diferencial del tram variable. En acabar el tram fix la quota es recalcula amb el capital pendent."
---
Aquest simulador calcula la **quota mensual** d’una hipoteca amb el sistema francès, el que fan servir tots els bancs a Espanya, i t’ensenya quant pagaràs d’**interessos** i quant deus al final de cada any.

Pots simular tres tipus d’hipoteca: **fixa** (l’interès no canvia), **variable** (Euríbor més un diferencial, revisat cada any) i **mixta** (uns anys a tipus fix i la resta variable).

## Com es calcula

1. **Interès mensual.** El TIN anual es divideix entre 12. Amb un 3,01 %, l’interès de cada mes és el 0,2508 % del que deus.
2. **Quota.** Amb el capital *P*, l’interès mensual *i* i el nombre de quotes *n*, la quota és C = P·i / (1 − (1 + i)^−n). És la mateixa cada mes mentre no canviï l’interès.
3. **Interessos i capital de cada mes.** Els interessos del mes són el deute pendent per *i*; la resta de la quota amortitza capital i redueix el deute.
4. **Variable i mixta.** A cada revisió anual l’interès passa a ser l’Euríbor més el diferencial, i la quota es recalcula amb el deute pendent i els mesos que queden. El simulador suposa que l’Euríbor que escrius es manté tot el termini. L’interès mai no baixa de zero (Llei 5/2019).

## Exemple

La hipoteca mitjana que va registrar l’INE el juliol del 2026 va ser de **180.785 € a 26 anys** amb un interès mitjà del **3,01 %**. La seva quota és de **836,14 € al mes**: en 312 quotes retornes 260.875,78 €, dels quals 80.090,78 € són interessos.

Amb 200.000 € a 30 anys al mateix 3,01 %, la quota seria de 844,29 €.

## Abans de signar

El banc t’ha de donar la **FEIN** (fitxa europea d’informació normalitzada) amb la quota, la TAE i el quadre d’amortització de la teva oferta, i el notari t’assessora gratis almenys un dia abans de la signatura. Aquest simulador és orientatiu: la xifra que val és la de la FEIN.
