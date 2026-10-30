--!strict
-- Arranque del cliente: interfaz, puertas de hielo abiertas solo para quien ya pagó la zona y nevada.
-- Sin chat propio, sin enlaces externos.

local GateView = require(script.Parent.GateView)
local Hud = require(script.Parent.Hud)
local Snowfall = require(script.Parent.Snowfall)

GateView.start()
Snowfall.start()
Hud.start()
