--!strict
-- Evento de fin de semana (viernes 00:00 → lunes 00:00 UTC, Economy.isEventActive):
-- * huevos raros más probables (FarmService pregunta EventService.isActive);
-- * entregar Config.Event.eggsGoal huevos durante el evento da la pintura limitada Config.Event.paint para siempre.
-- El estado va en atributos de Workspace (EventActive, EventWeek, EventStartsAt, EventEndsAt) para la interfaz.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local EventService = {}

function EventService.isActive(): boolean
	return Economy.isEventActive(os.time())
end

-- Cuenta los huevos entregados durante el evento; al llegar a la meta, da la pintura del evento (una sola vez).
function EventService.recordDelivery(player: Player, eggs: number)
	local now = os.time()
	if eggs > 0 and Economy.isEventActive(now) then
		local total = DataService.addEventEggs(player, Economy.eventWeek(now), eggs, Config.Event.eggsGoal)
		if total >= Config.Event.eggsGoal and DataService.grantPaint(player, Config.Event.paint) then
			Notify:FireClient(player, { kind = "event_paint", paint = Config.Event.paint })
		end
	end
end

local function publish()
	local now = os.time()
	local startsAt, endsAt = Economy.eventWindow(now)
	Workspace:SetAttribute("EventActive", Economy.isEventActive(now))
	Workspace:SetAttribute("EventWeek", Economy.eventWeek(now))
	Workspace:SetAttribute("EventStartsAt", startsAt)
	Workspace:SetAttribute("EventEndsAt", endsAt)
	Workspace:SetAttribute("EventGoal", Config.Event.eggsGoal)
end

function EventService.start()
	publish()
	task.spawn(function()
		while true do
			task.wait(15)
			publish()
		end
	end)
end

return EventService
