-- Punto de entrada de las pruebas: `lune run tests/run` (desde proyectos/juegos/roblox-rocket-tycoon).
-- Prueba la lógica pura de src/shared (árbol de botones y reglas de compra, ingresos, renacer, ganancias sin
-- conectar, premio diario, cohete, asteroides y cristales, geometría de la base), sin Roblox.

local process = require("@lune/process")

local Harness = require("./harness")

require("./buttons_spec")(Harness)
require("./income_spec")(Harness)
require("./rebirth_spec")(Harness)
require("./daily_spec")(Harness)
require("./rocket_spec")(Harness)
require("./crystals_spec")(Harness)
require("./layout_spec")(Harness)

local failed = Harness.summary()
process.exit(if failed > 0 then 1 else 0)
