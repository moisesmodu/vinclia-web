# Prova de validesa de la correcció escrita (condició de llançament, JUICIO.md)

**Regla:** Aprova no es llança al públic fins que la nota de l'app coincideixi amb la d'un professor en **el 80 % dels casos dins d'un
criteri** sobre 20 redaccions reals de candidats al C1. Si no s'hi arriba, es revisa el corrector (prompt, pesos, regles) i es repeteix.
La prova la pot fer Moisés amb les acadèmies de Lleida o el CNL: l'app ja té el formulari i l'anàlisi automàtica.

## 1. Què es compara
- **Tasca:** una de les quatre tasques argumentatives de C1 del banc (`contenido/tasques/c1-escrit-000X.json`), la mateixa per a tots
  els candidats d'una tanda (recomanada: `c1-escrit-0001`, el teletreball a l'administració).
- **Rúbrica:** els quatre criteris oficials de la DPL, de 0 a 10 cadascun: adequació, coherència i cohesió, correcció, riquesa.
  La nota de l'àrea (sobre 40) és la mitjana ponderada (correcció pesa 1,5) × 4.
- **Coincidència:** un criteri «coincideix» si |nota_app − nota_professor| ≤ 1,5 punts sobre 10 (una banda de la rúbrica).
  Una redacció «coincideix» si coincideixen almenys 3 dels 4 criteris **i** la decisió apte/no apte de l'àrea (≥ 25/40) és la mateixa.
- **Llindar:** ≥ 16 de 20 redaccions coincidents (80 %). A més es publica la correlació de la nota global i l'acord apte/no apte.

## 2. Protocol (una tarda)
1. Moisés aconsegueix 20 candidats reals al C1 (acadèmia d'oposicions, CNL de Lleida o aula de C1 de l'EOI o la UdL) i un professor de
   català amb experiència de correcció DPL. Cada candidat rep un codi `V01`…`V20`; no es guarda cap nom ni correu.
2. Els candidats escriuen la redacció en 90 minuts (condicions d'examen) a `https://aprova-catala.vercel.app/ca/validesa`: trien «Soc
   candidat/a», posen el codi (de la llista `VALIDESA_CODIS`), escullen la tasca i envien el text. L'app el corregeix a l'instant i guarda la seva nota (taula `Validesa`).
   Els candidats no veuen la nota del professor; el professor no veu la de l'app.
3. El professor corregeix les 20 redaccions en paper o text amb la rúbrica oficial (0–10 per criteri) i, a la mateixa pàgina amb «Soc
   professor/a», introdueix el codi, la clau de la prova (`VALIDESA_CLAU`), enganxa el text i les quatre notes. (Si prefereix un full, la tasca setmanal les carrega des d'un CSV
   `codi,adequacio,coherencia,correccio,riquesa`.)
4. La sessió de Claude executa `node scripts/validesa-analitzar.mjs` (o la tasca setmanal ho fa sola) i escriu `validesa/informe-<data>.md`
   amb: coincidència per criteri i global, acord apte/no apte, correlació, les redaccions on l'app s'allunya més i la causa probable.
5. Decisió: ≥ 80 % → es llança; < 80 % → s'ajusta el corrector (pesos de criteris, prompt, regles noves, LanguageTool «picky») i es
   repeteix amb 20 redaccions noves (mai les mateixes).

## 2b. Seguretat de la prova (auditoria A6)
- **Codis de candidat:** la variable `VALIDESA_CODIS` (llista separada per comes, p. ex. `V01,V02,…,V20` o codis aleatoris d'una tanda)
  limita quins codis accepta `/api/validesa`. Sense la variable s'accepten `V01`–`V20`; és millor posar-la a cada tanda amb codis nous.
- **Rol professor:** cal la clau `VALIDESA_CLAU` (variable d'entorn; la té l'organitzador), que el formulari demana al triar «Soc professor/a».
  Sense la variable configurada no s'accepta cap nota de professor.
- **Límits:** text de 60 paraules a 6.000 caràcters; 10 enviaments per minut i IP.
- **Conservació:** cada redacció es guarda amb `esborrarEl` = 90 dies. Per esborrar-les: `curl -X DELETE https://<domini>/api/validesa -H 'content-type: application/json'
  -d '{"clau":"<VALIDESA_CLAU>"}'` (només les caducades) o amb `"tot":true` (totes, en acabar la prova). La política de privadesa ho declara.

## 3. Incentiu i consentiment
Tres mesos de premium gratis per candidat i professor. Consentiment per escrit (text a `validesa/consentiment.md`): les redaccions
s'usen només per validar el corrector, sense dades personals, i s'esborren quan acaba la prova si el candidat ho demana.

## 4. Fitxers
- Formulari: `/[idioma]/validesa` (`components/FormValidesa.tsx`, API `app/api/validesa/route.ts`, taula `Validesa`).
- Anàlisi: `scripts/validesa-analitzar.mjs` (llegeix la taula amb `DATABASE_URL`, o un JSON exportat amb `--json=fitxer`).
- Consentiment: `validesa/consentiment.md`. Full per al professor: `validesa/full-professor.md`.
