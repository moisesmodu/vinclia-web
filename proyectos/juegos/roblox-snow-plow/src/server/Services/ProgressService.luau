--!strict
-- Progreso: mejoras de la máquina, abrir zonas, teletransporte entre zonas abiertas, premio diario con racha,
-- calendario de Adviento y renacer. El cliente solo pide; precios, rachas y fechas los decide el servidor con los
-- módulos puros de Shared.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Advent = require(ReplicatedStorage.Shared.Advent)
local Config = require(ReplicatedStorage.Shared.Config)
local Daily = require(ReplicatedStorage.Shared.Daily)
local Rebirth = require(ReplicatedStorage.Shared.Rebirth)
local Upgrades = require(ReplicatedStorage.Shared.Upgrades)
local Zones = require(ReplicatedStorage.Shared.Zones)
local BuddyService = require(script.Parent.BuddyService)
local DataService = require(script.Parent.DataService)
local PlowService = require(script.Parent.PlowService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local ProgressService = {}

local function today(): number
	return Daily.dayNumber(os.time())
end

local function multiplierOf(data: DataService.PlayerData): number
	return Rebirth.multiplier(data.rebirths, Config.Rebirth.perRebirth)
end

-- Atributos que la interfaz usa para encender los botones del premio diario y del calendario.
local function updateStatus(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local now = os.time()
		local state: Advent.AdventState = { year = data.adventYear, claimed = data.adventClaimed }
		player:SetAttribute("DailyReady", Daily.canClaim(data.dailyDay, today()))
		player:SetAttribute("AdventDay", Advent.dayOf(now, Config.Advent))
		player:SetAttribute("AdventReady", Advent.ready(state, now, Config.Advent))
		local cost = Rebirth.cost(data.rebirths, Config.Rebirth)
		player:SetAttribute("RebirthCost", cost or 0)
	end
end

function ProgressService.onJoin(player: Player)
	updateStatus(player)
end

function ProgressService.upgrade(player: Player, id: string)
	local session = DataService.get(player)
	if session then
		for _, def in Config.Upgrades do
			if def.id == id then
				local level = session.data.upgrades[id] or 0
				local cost = Upgrades.cost(def, level)
				if cost then
					if DataService.trySpend(player, cost) then
						session.data.upgrades[id] = level + 1
						DataService.touch(player)
						PlowService.applyStats(player)
						Notify:FireClient(player, { kind = "upgraded", id = id, level = level + 1 })
					else
						Notify:FireClient(player, { kind = "nomoney", price = cost })
					end
				else
					Notify:FireClient(player, { kind = "max" })
				end
			end
		end
	end
end

function ProgressService.unlockZone(player: Player, index: number)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local rule = Config.Zones[index]
		local result = Zones.canUnlock({
			unlocked = data.zones,
			target = index,
			count = #Config.Zones,
			coins = data.coins,
			rebirths = data.rebirths,
		}, rule)
		if result == "ok" and DataService.trySpend(player, rule.cost) then
			data.zones = index
			DataService.touch(player)
			PlowService.teleport(player, index)
			Notify:FireClient(player, { kind = "zone", zone = index })
			task.spawn(DataService.save, player)
		elseif result == "coins" then
			Notify:FireClient(player, { kind = "nomoney", price = rule.cost })
		elseif result == "rebirths" then
			Notify:FireClient(player, { kind = "need_rebirth", n = rule.minRebirths })
		elseif result == "owned" then
			PlowService.teleport(player, index)
		end
	end
end

function ProgressService.teleport(player: Player, index: number)
	if not PlowService.teleport(player, index) then
		Notify:FireClient(player, { kind = "locked", zone = index })
	end
end

function ProgressService.claimDaily(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local day = today()
		local ok, streak = Daily.claim(data.dailyDay, data.dailyStreak, day, Config.Daily.maxStreak)
		if ok then
			local coins = Daily.reward(streak, Config.Daily, multiplierOf(data))
			data.dailyDay = day
			data.dailyStreak = streak
			DataService.addCoins(player, coins)
			Notify:FireClient(player, { kind = "daily", coins = coins, streak = streak })
		else
			Notify:FireClient(player, { kind = "daily_wait" })
		end
		updateStatus(player)
	end
end

-- Casilla de hoy del calendario: monedas o, los días marcados, un compañero (si no cabe, sus monedas).
function ProgressService.claimAdvent(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local state: Advent.AdventState = { year = data.adventYear, claimed = data.adventClaimed }
		local result, day, nextState = Advent.claim(state, os.time(), Config.Advent)
		if result == "ok" then
			data.adventYear = nextState.year
			data.adventClaimed = nextState.claimed
			local gift = Advent.gift(day, Config.Advent)
			if gift.kind == "buddy" and BuddyService.hasRoom(data) then
				local species = if day == Config.Advent.lastDay
					then Config.Advent.christmasSpecies
					else Config.BuddySpecies[math.floor(day / 6) % #Config.BuddySpecies + 1].id
				BuddyService.newRecord(data, species, gift.rarity)
				BuddyService.refresh(player)
				Notify:FireClient(player, { kind = "advent", day = day, s = species, r = gift.rarity })
			else
				local coins = if gift.kind == "buddy"
					then Config.BuddyRarities[gift.rarity].recycle
					else math.floor(gift.coins * multiplierOf(data))
				DataService.addCoins(player, coins)
				Notify:FireClient(player, { kind = "advent", day = day, coins = coins })
			end
			task.spawn(DataService.save, player)
		elseif result == "claimed" then
			Notify:FireClient(player, { kind = "advent_wait" })
		end
		updateStatus(player)
	end
end

function ProgressService.rebirth(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local cost = Rebirth.cost(data.rebirths, Config.Rebirth)
		if cost == nil then
			Notify:FireClient(player, { kind = "max" })
		elseif Rebirth.canRebirth(data.coins, data.rebirths, Config.Rebirth) then
			data.rebirths += 1
			data.coins = Config.Rebirth.startCoins
			data.upgrades = DataService.defaultUpgrades()
			data.zones = 1
			data.snow = 0
			data.snowValue = 0
			DataService.touch(player)
			PlowService.applyStats(player)
			PlowService.teleport(player, 1)
			Notify:FireClient(player, { kind = "rebirth", n = data.rebirths, multiplier = multiplierOf(data) })
			updateStatus(player)
			task.spawn(DataService.save, player)
		else
			Notify:FireClient(player, { kind = "nomoney", price = cost or 0 })
		end
	end
end

function ProgressService.start()
	-- a medianoche (UTC) el premio diario y la casilla del calendario se encienden sin volver a entrar
	task.spawn(function()
		while true do
			task.wait(30)
			for _, player in Players:GetPlayers() do
				updateStatus(player)
			end
		end
	end)
end

return ProgressService
