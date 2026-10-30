--!strict
-- Compra de mejoras. El cliente solo dice QUÉ mejora quiere; el precio, el saldo y el nivel los decide el servidor.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)
local RateLimiter = require(script.Parent.RateLimiter)
local TruckService = require(script.Parent.TruckService)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local BuyUpgrade = Remotes:WaitForChild("BuyUpgrade") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local UpgradeService = {}

local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

local function findUpgrade(id: string): Config.UpgradeDef?
	for _, upgradeId in Config.UpgradeOrder do
		if upgradeId == id then
			return (Config.Upgrades :: any)[upgradeId] :: Config.UpgradeDef
		end
	end
	return nil
end

-- Sube un nivel de `def` si el jugador puede pagarlo.
local function buyLevel(player: Player, def: Config.UpgradeDef)
	local level = DataService.getLevel(player, def.id)
	local cost = Economy.upgradeCost(def, level)
	if cost ~= nil then
		if DataService.trySpend(player, cost) then
			DataService.setLevel(player, def.id, level + 1)
			Notify:FireClient(player, { kind = "upgrade", id = def.id, level = level + 1 })
			if def.id ~= "FarmSpeed" and def.id ~= "Luck" then
				TruckService.refresh(player)
			end
		else
			Notify:FireClient(player, { kind = "nomoney" })
		end
	else
		Notify:FireClient(player, { kind = "max", id = def.id })
	end
end

function UpgradeService.buy(player: Player, upgradeId: string)
	local def = findUpgrade(upgradeId)
	if def and DataService.get(player) then
		buyLevel(player, def)
	end
end

function UpgradeService.start()
	BuyUpgrade.OnServerEvent:Connect(function(player: Player, upgradeId: unknown)
		-- el id llega del cliente: solo textos cortos (findUpgrade descarta los que no existen)
		if limiter:allow(player) and type(upgradeId) == "string" and #upgradeId <= 32 then
			UpgradeService.buy(player, upgradeId)
		end
	end)
end

return UpgradeService
