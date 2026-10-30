---
slug: hipoteca-fixa-o-variable
titulo: "Hipoteca fixa o variable? Compara amb escenaris d’Euríbor"
h1: "Hipoteca fixa o variable?"
descripcion: "Compara el cost total d’una hipoteca fixa i una de variable si l’Euríbor puja, baixa o es queda igual, i calcula l’Euríbor a partir del qual convé la fixa."
resumen: "Posa les dues ofertes i veuràs quant pagaries d’interessos amb cadascuna en tres escenaris d’Euríbor, i a partir de quin Euríbor mitjà la fixa surt més barata."
palabraClave: "hipoteca fixa o variable"
actualizado: 2026-10-30
fuentes:
  - nombre: "INE: Estadística d’Hipoteques, juliol del 2026"
    url: "https://www.ine.es/dyngs/Prensa/H0726.htm"
  - nombre: "Banc d’Espanya: tipus d’interès de referència oficials"
    url: "https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html"
  - nombre: "Llei 5/2019 reguladora dels contractes de crèdit immobiliari (BOE)"
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814"
faq:
  - p: "Què és l’Euríbor d’equilibri?"
    r: "És l’Euríbor mitjà, a partir de la primera revisió, amb el qual la variable et costaria exactament el mateix que la fixa. Si creus que l’Euríbor mitjà dels propers anys serà més alt, et convé la fixa."
  - p: "I si la variable té un primer any més barat?"
    r: "Ho tenim en compte: el primer any la variable va a l’interès inicial que escriguis i des del segon, a l’Euríbor més el diferencial."
  - p: "Puc passar de variable a fixa més endavant?"
    r: "Sí, amb una novació al teu banc o una subrogació a un altre. La comissió per canviar de variable a fixa té límit legal; la xifra exacta està pendent de confrontació i no la calculem."
---
La pregunta no té una resposta única: depèn del que faci l’**Euríbor** durant 20 o 30 anys, i això no ho sap ningú. El que sí que es pot calcular és **quant t’hi jugues** en cada cas.

Aquesta calculadora compara una oferta fixa amb una de variable en tres escenaris i et dona l’**Euríbor d’equilibri**.

## Com es calcula

1. **Fixa.** Quota amb el sistema francès i el TIN fix durant tot el termini.
2. **Variable.** El primer any, l’interès inicial de l’oferta. Des del segon, Euríbor més diferencial, amb la quota recalculada a cada revisió anual.
3. **Escenaris.** L’Euríbor es queda en el valor actual, puja els punts que triïs o baixa els mateixos punts des de la primera revisió, i s’hi manté fins al final.
4. **Equilibri.** Es busca per bisecció l’Euríbor constant amb el qual els interessos de la variable igualen els de la fixa.

## Exemple

Amb 180.785 € a 26 anys (la hipoteca mitjana de l’INE), una fixa al **3,03 %** i una variable al 2,97 % el primer any i Euríbor + 0,60 després:

- la fixa costa **80.683 € d’interessos** (quota de 838,04 €);
- si l’Euríbor es queda en el 3,247 % de setembre, la variable costaria uns 103.620 €;
- l’**Euríbor d’equilibri és del 2,43 %**: amb un Euríbor mitjà més baix, guanyaria la variable.

Els tipus inicials són els mitjans de l’INE de juliol del 2026; el diferencial és un exemple.

## El que no mesura

La fixa compra **tranquil·litat**: la quota no canvia passi el que passi. La variable pot sortir més barata, però exigeix poder pagar una quota més alta si l’Euríbor puja. Prova l’escenari de pujada amb el teu sou abans de decidir.
