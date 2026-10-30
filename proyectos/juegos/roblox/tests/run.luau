-- Punto de entrada de las pruebas: `lune run tests/run` (desde proyectos/juegos/roblox).
-- Prueba la lógica pura de src/shared (Economy y TrackGen), que no depende de Roblox: economía, pista, huevos raros,
-- recompensa diaria, evento de fin de semana y pinturas.

local process = require("@lune/process")

local Harness = require("./harness")

require("./economy_spec")(Harness)
require("./trackgen_spec")(Harness)
require("./systems_spec")(Harness)

local failed = Harness.summary()
process.exit(if failed > 0 then 1 else 0)
