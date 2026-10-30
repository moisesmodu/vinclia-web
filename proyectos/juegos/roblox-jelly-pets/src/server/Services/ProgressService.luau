--!strict
-- Progreso: ganancias sin conectar (al entrar), premio diario con racha, renacer, candado y su mejora.
-- El cliente solo pide; precios, rachas y tiempos los decide el servidor con los módulos puros de Shared.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Daily = require(ReplicatedStorage.Shared.Daily)
local Economy = require(ReplicatedStorage.Shared.Economy)
local StealLock = require(ReplicatedStorage.Shared.StealLock)
local BaseService = require(script.Parent.BaseService)
local DataService = require(script.Parent.DataService)
local PetService = require(script.Parent.PetService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local ProgressService = {}

local function today(): number
	return Daily.dayNumber(os.time())
end

local function updateDaily(player: Player)
	local session = DataService.get(player)
	if session then
		player:SetAttribute("DailyReady", Daily.canClaim(session.data.dailyDay, today()))
	end
end

-- Al entrar (con las gelatinas ya en sus pedestales): monedas de mientras no estaba y aviso del premio diario.
function ProgressService.onJoin(player: Player)
	local session = DataService.get(player)
	if session then
		local previous = session.previousOnline
		session.previousOnline = 0
		if previous > 0 then
			local elapsed = os.time() - previous
			local coins = Economy.offlineEarnings(PetService.incomePerSecond(player), elapsed, Config.Offline)
			if coins > 0 then
				DataService.addCoins(player, coins)
				local seconds = math.min(elapsed, Config.Offline.maxSeconds)
				Notify:FireClient(player, { kind = "offline", coins = coins, seconds = seconds })
			end
		end
		updateDaily(player)
	end
end

function ProgressService.claimDaily(player: Player)
	local session = DataService.get(player)
	if session then
		local day = today()
		local ok, streak = Daily.claim(session.data.dailyDay, session.data.dailyStreak, day, Config.Daily.maxStreak)
		if ok then
			local multiplier = Economy.rebirthMultiplier(session.data.rebirths, Config.Income.perRebirth)
			local coins = Daily.reward(streak, Config.Daily, multiplier)
			session.data.dailyDay = day
			session.data.dailyStreak = streak
			DataService.addCoins(player, coins)
			Notify:FireClient(player, { kind = "daily", coins = coins, streak = streak })
		else
			Notify:FireClient(player, { kind = "daily_wait" })
		end
		updateDaily(player)
	end
end

function ProgressService.rebirth(player: Player)
	local session = DataService.get(player)
	local cost = if session then Economy.rebirthCost(session.data.rebirths, Config.Rebirth) else nil
	if session and cost then
		if session.data.coins >= cost then
			PetService.resetAll(player)
			session.data.rebirths += 1
			session.data.coins = Config.Pets.startCoins
			DataService.touch(player)
			local multiplier = Economy.rebirthMultiplier(session.data.rebirths, Config.Income.perRebirth)
			Notify:FireClient(player, { kind = "rebirth", n = session.data.rebirths, multiplier = multiplier })
			task.spawn(DataService.save, player)
		else
			Notify:FireClient(player, { kind = "nomoney", price = cost })
		end
	elseif session then
		Notify:FireClient(player, { kind = "max" })
	end
end

function ProgressService.upgradeLock(player: Player)
	local session = DataService.get(player)
	local cost = if session then StealLock.upgradeCost(session.data.lockLevel, Config.Lock) else nil
	if session and cost then
		if DataService.trySpend(player, cost) then
			session.data.lockLevel += 1
			DataService.touch(player)
			Notify:FireClient(player, { kind = "lock_up", level = session.data.lockLevel })
		else
			Notify:FireClient(player, { kind = "nomoney", price = cost })
		end
	elseif session then
		Notify:FireClient(player, { kind = "max" })
	end
end

function ProgressService.lock(player: Player)
	local result = BaseService.pressLock(player)
	if result ~= "none" then
		Notify:FireClient(player, { kind = "lock_" .. result })
	end
end

function ProgressService.start()
	-- a medianoche (UTC) el premio diario vuelve a estar listo sin tener que volver a entrar
	task.spawn(function()
		while true do
			task.wait(60)
			for _, player in Players:GetPlayers() do
				updateDaily(player)
			end
		end
	end)
end

return ProgressService
