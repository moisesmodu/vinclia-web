---
slug: taula-amortitzacio-hipoteca
titulo: "Taula d’amortització de la hipoteca mes a mes"
h1: "Taula d’amortització de la hipoteca"
descripcion: "Genera el quadre d’amortització de la teva hipoteca per anys o mes a mes: quota, interessos, capital amortitzat i deute pendent, amb el sistema francès."
resumen: "Posa l’import, el termini i l’interès: veuràs quant de cada quota són interessos i quant capital, i quant deus després de cada any o de cada mes."
palabraClave: "taula amortització hipoteca"
actualizado: 2026-10-30
fuentes:
  - nombre: "Llei 5/2019 reguladora dels contractes de crèdit immobiliari (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
  - nombre: "Banc d’Espanya: Portal del Client Bancari, préstec hipotecari"
    url: "https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/"
  - nombre: "INE: Estadística d’Hipoteques, juliol del 2026"
    url: "https://www.ine.es/dyngs/Prensa/H0726.htm"
faq:
  - p: "Per què amortitzo tan poc al principi?"
    r: "Perquè els interessos es calculen sobre el deute pendent, que al principi és màxim. Amb 150.000 € al 3,01 %, el primer mes 376 € dels 712 € de quota són interessos."
  - p: "Coincideix amb el quadre del meu banc?"
    r: "Hauria de coincidir al cèntim si l’interès és fix i el banc fa servir mesos iguals. Alguns bancs calculen els interessos per dies reals i la quota pot variar uns cèntims."
  - p: "Puc descarregar la taula?"
    r: "La pots imprimir o desar en PDF amb el botó de sota el resultat, i copiar l’enllaç amb les teves dades per tornar-hi."
---
El **quadre d’amortització** mostra, quota a quota, quina part va a pagar **interessos** i quina part redueix el **deute**. És la mateixa taula que acompanya la FEIN del teu banc.

## Com es calcula

1. **Quota fixa** amb el sistema francès: C = P·i / (1 − (1 + i)^−n), amb *i* = TIN / 12.
2. **Cada mes**: interessos = deute pendent × *i*; capital = quota − interessos; deute nou = deute − capital.
3. **Per anys**: se sumen les 12 quotes, els interessos i el capital de cada any i es mostra el deute al final de l’any i el percentatge ja amortitzat.
4. L’última quota s’ajusta perquè el deute quedi exactament a zero.

## Exemple

**150.000 € a 25 anys al 3,01 %**:

- quota de **712,10 €** al mes;
- el primer any pagues 4.458,93 € d’interessos i amortitzes uns 4.086 €;
- fins a la quota **25** no pagues més capital que interessos;
- en total, **63.629,22 € d’interessos**.

Tria «Mes a mes» per veure les 300 quotes.
