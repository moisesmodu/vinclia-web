# Importar en Google Ads Editor (cuando Moisés abra la cuenta)

Archivos listos (1/11/2026), en pausa hasta el 1/12 o hasta la aprobación mensual:

| Campaña | Palabras clave | Negativas | Anuncios | Presupuesto |
|---|---|---|---|---|
| Plaça - Busqueda Cataluña (Cataluña, ca+es) | `placa-palabras-clave.csv` (39, concordancia de frase, URL en oposita.digital) | `placa-negativas.csv` (28) | `placa-anuncios.csv` (6 adaptables con utm) | 220 €/mes: TCAI 60, Bombers 50, Ayuntamientos 50, Mossos 40, Generalitat 20 |
| CCSE - Busqueda España (España, es) | `ccse-palabras-clave.csv` (12, concordancia exacta) | `ccse-negativas.csv` (17) | `ccse-anuncios.csv` (2 adaptables) | 80 €/mes: Test 50, Nacionalidad 30 |

Pasos: Google Ads Editor → Cuenta → Importar → «Pegar texto» o archivo CSV, uno por tipo (palabras clave, negativas,
anuncios); asignar presupuesto diario por campaña (7,30 € y 2,65 €); estrategia «CPC manual» con CPC mejorado; las
conversiones se importan cada lunes desde Stripe con `scripts/conversiones-google-ads.mjs` de cada proyecto
(`ads/google-ads-diciembre-2026.md` §4). Regla de corte: §5 del mismo documento.
