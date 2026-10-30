--!strict
-- Arranque del cliente: interfaz y conducción. Sin chat propio, sin enlaces externos.

local Hud = require(script.Parent.Hud)
local TruckController = require(script.Parent.TruckController)

TruckController.start()
Hud.start()
