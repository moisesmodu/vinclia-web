--!strict
-- Carrera de huevos del servidor: cada Config.Race.interval segundos, durante Config.Race.duration, cuenta los
-- huevos entregados por cada jugador. Gana quien más entrega (los empates ganan todos) y cobra un premio.
-- El estado va en atributos de Workspace para que la interfaz muestre la cuenta atrás sin más mensajes.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local RaceService = {}

local running = false
local scores: { [number]: number } = {}

function RaceService.isRunning(): boolean
	return running
end

function RaceService.recordDelivery(player: Player, eggs: number)
	if not running or eggs <= 0 then
		return
	end
	local total = (scores[player.UserId] or 0) + eggs
	scores[player.UserId] = total
	player:SetAttribute("RaceEggs", total)
end

function RaceService.remove(player: Player)
	scores[player.UserId] = nil
end

local function finish()
	running = false
	local winners, best = Economy.raceWinners(scores)
	local bonus = Economy.raceBonus(best, Config.Race)
	for _, userId in winners do
		local player = Players:GetPlayerByUserId(userId)
		if player then
			DataService.addCoins(player, bonus)
		end
	end
	Notify:FireAllClients({ kind = "race_end", winners = winners, eggs = best, bonus = bonus })
	for _, player in Players:GetPlayers() do
		player:SetAttribute("RaceEggs", nil)
	end
	table.clear(scores)
end

function RaceService.start()
	task.spawn(function()
		while true do
			Workspace:SetAttribute("RaceState", "waiting")
			Workspace:SetAttribute("RaceAt", Workspace:GetServerTimeNow() + Config.Race.interval)
			task.wait(Config.Race.interval)

			table.clear(scores)
			running = true
			for _, player in Players:GetPlayers() do
				player:SetAttribute("RaceEggs", 0)
			end
			Workspace:SetAttribute("RaceState", "running")
			Workspace:SetAttribute("RaceAt", Workspace:GetServerTimeNow() + Config.Race.duration)
			Notify:FireAllClients({ kind = "race_start", duration = Config.Race.duration })
			task.wait(Config.Race.duration)

			finish()
		end
	end)
end

return RaceService
