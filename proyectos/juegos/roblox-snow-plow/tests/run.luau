-- Punto de entrada de las pruebas: `lune run tests/run` (desde proyectos/juegos/roblox-snow-plow).
-- Prueba la lógica pura de src/shared (reparto de la nieve, pala y mochila, mejoras, zonas, compañeros, premio
-- diario, calendario de Adviento, renacer y bolsa de monedas), sin Roblox.

local process = require("@lune/process")

local Harness = require("./harness")

require("./snowlayout_spec")(Harness)
require("./collection_spec")(Harness)
require("./upgrades_spec")(Harness)
require("./zones_spec")(Harness)
require("./buddies_spec")(Harness)
require("./daily_spec")(Harness)
require("./advent_spec")(Harness)
require("./rebirth_spec")(Harness)

local failed = Harness.summary()
process.exit(if failed > 0 then 1 else 0)
