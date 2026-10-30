--!strict
-- Arranque del cliente: interfaz, cohete, recogida de cristales y rocas de la cinta.
-- Sin chat propio, sin enlaces externos. Cada módulo pone su interfaz antes de arrancar sus bucles.

local CrystalSeeker = require(script.Parent.CrystalSeeker)
local Hud = require(script.Parent.Hud)
local OreView = require(script.Parent.OreView)
local RocketController = require(script.Parent.RocketController)

Hud.start()
RocketController.start()
CrystalSeeker.start()
OreView.start()
