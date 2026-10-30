--!strict
-- Progreso: ganancias sin conectar al entrar, premio diario con racha y renacer. El cliente solo pide; las
-- cuentas las hacen los módulos puros de Shared.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Buttons = require(ReplicatedStorage.Shared.Buttons)
local Config = require(ReplicatedStorage.Shared.Config)
local Daily = require(ReplicatedStorage.Shared.Daily)
local Offline = require(ReplicatedStorage.Shared.Offline)
local Rebirth = require(ReplicatedStorage.Shared.Rebirth)
local DataService = require(script.Parent.DataService)
local TycoonService = require(script.Parent.TycoonService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local ProgressService = {}

local function today(): number
	return Daily.dayNumber(os.time())
end

local function multiplierOf(data: DataService.PlayerData): number
	return Rebirth.multiplier(data.rebirths, Config.Rebirth.perRebirth)
end

local function ownsFinal(data: DataService.PlayerData): boolean
	return Buttons.toSet(data.owned)[Config.FinalButton] == true
end

-- Atributos que la interfaz usa para encender el premio diario y el renacer.
local function updateStatus(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		player:SetAttribute("DailyReady", Daily.canClaim(data.dailyDay, today()))
		local cost = Rebirth.cost(data.rebirths, Config.Rebirth)
		player:SetAttribute("RebirthCost", cost or 0)
		player:SetAttribute("RebirthUnlocked", ownsFinal(data))
	end
end

-- Al entrar: lo que ganó la base mientras no estaba (a la caja de la refinería).
function ProgressService.onJoin(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local now = os.time()
		local seconds = Offline.seconds(data.lastOnline, now, Config.Offline)
		local coins = Offline.earnings(data.lastOnline, now, TycoonService.currentRate(player), Config.Offline)
		if coins > 0 then
			data.vault += coins
			DataService.touch(player)
			Notify:FireClient(player, { kind = "offline", coins = coins, seconds = seconds })
		end
	end
	updateStatus(player)
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
			task.spawn(DataService.save, player)
		else
			Notify:FireClient(player, { kind = "daily_wait" })
		end
		updateStatus(player)
	end
end

-- Renacer: base nueva (monedas, caja y botones), cristales y multiplicador para siempre.
function ProgressService.rebirth(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local result = Rebirth.check(data.coins, data.rebirths, ownsFinal(data), Config.Rebirth)
		if result == "ok" then
			data.rebirths += 1
			data.coins = Config.Rebirth.startCoins
			data.vault = 0
			data.owned = {}
			DataService.touch(player)
			TycoonService.sync(player)
			Notify:FireClient(player, { kind = "rebirth", n = data.rebirths, multiplier = multiplierOf(data) })
			updateStatus(player)
			task.spawn(DataService.save, player)
		elseif result == "coins" then
			Notify:FireClient(player, { kind = "nomoney", price = Rebirth.cost(data.rebirths, Config.Rebirth) or 0 })
		elseif result == "final" then
			Notify:FireClient(player, { kind = "need_final" })
		else
			Notify:FireClient(player, { kind = "max" })
		end
	end
end

function ProgressService.refresh(player: Player)
	updateStatus(player)
end

function ProgressService.start()
	-- a medianoche (UTC) el premio diario se enciende sin volver a entrar
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
