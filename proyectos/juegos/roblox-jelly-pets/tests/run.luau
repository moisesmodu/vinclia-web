-- Punto de entrada de las pruebas: `lune run tests/run` (desde proyectos/juegos/roblox-jelly-pets).
-- Prueba la lógica pura de src/shared (rarezas, gelatinas, economía, premio diario y candado), sin Roblox.

local process = require("@lune/process")

local Harness = require("./harness")

require("./rarity_spec")(Harness)
require("./pets_spec")(Harness)
require("./economy_spec")(Harness)
require("./daily_spec")(Harness)
require("./steallock_spec")(Harness)

local failed = Harness.summary()
process.exit(if failed > 0 then 1 else 0)
