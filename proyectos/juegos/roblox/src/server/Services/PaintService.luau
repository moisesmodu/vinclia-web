--!strict
-- Pinturas del camión. El cliente solo dice QUÉ pintura toca (un id); el servidor decide:
-- * si ya es tuya, te la pones;
-- * si se vende (no es del evento) y te llega, la paga, es tuya y te la pones;
-- * la del evento solo se gana entregando huevos el fin de semana (EventService).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local RateLimiter = require(script.Parent.RateLimiter)
local TruckService = require(script.Parent.TruckService)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local PaintAction = Remotes:WaitForChild("PaintAction") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local PaintService = {}

local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

local function findPaint(id: string): Config.PaintDef?
	for _, paintId in Config.PaintOrder do
		if paintId == id then
			return Config.Paints[paintId]
		end
	end
	return nil
end

local function equip(player: Player, def: Config.PaintDef)
	if DataService.setPaint(player, def.id) then
		TruckService.applyPaint(player)
		Notify:FireClient(player, { kind = "paint", id = def.id })
	end
end

local function useOrBuy(player: Player, def: Config.PaintDef)
	if DataService.ownsPaint(player, def.id) then
		equip(player, def)
	elseif def.event then
		Notify:FireClient(player, { kind = "event_locked" })
	elseif DataService.trySpend(player, def.cost) then
		DataService.grantPaint(player, def.id)
		equip(player, def)
	else
		Notify:FireClient(player, { kind = "nomoney" })
	end
end

function PaintService.choose(player: Player, paintId: string)
	local def = findPaint(paintId)
	if def and DataService.get(player) then
		useOrBuy(player, def)
	end
end

function PaintService.start()
	PaintAction.OnServerEvent:Connect(function(player: Player, paintId: unknown)
		-- el id llega del cliente: solo textos cortos (findPaint descarta los que no existen)
		if limiter:allow(player) and type(paintId) == "string" and #paintId <= 32 then
			PaintService.choose(player, paintId)
		end
	end)
end

return PaintService
