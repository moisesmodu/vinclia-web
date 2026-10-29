--!strict
-- Arranque del cliente: interfaz y filtro de avisos. Sin chat propio, sin enlaces externos.

local Hud = require(script.Parent.Hud)
local PromptFilter = require(script.Parent.PromptFilter)

PromptFilter.start()
Hud.start()
