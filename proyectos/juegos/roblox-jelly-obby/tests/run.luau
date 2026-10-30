-- Punto de entrada de las pruebas: `lune run tests/run` (desde proyectos/juegos/roblox-jelly-obby).
-- Prueba la lógica pura de src/shared (torre generada, checkpoints, monedas, estelas y premio diario), sin Roblox.

local process = require("@lune/process")

local Harness = require("./harness")

require("./stages_spec")(Harness)
require("./checkpoint_spec")(Harness)
require("./rewards_spec")(Harness)
require("./daily_spec")(Harness)

local failed = Harness.summary()
process.exit(if failed > 0 then 1 else 0)
