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

function UpgradeService.buy(player: Player, upgradeId: string)
	local def = findUpgrade(upgradeId)
	if not def or not DataService.get(player) then
		return
	end
	local level = DataService.getLevel(player, def.id)
	local cost = Economy.upgradeCost(def, level)
	if cost == nil then
		Notify:FireClient(player, { kind = "max", id = def.id })
		return
	end
	if not DataService.trySpend(player, cost) then
		Notify:FireClient(player, { kind = "nomoney" })
		return
	end
	DataService.setLevel(player, def.id, level + 1)
	Notify:FireClient(player, { kind = "upgrade", id = def.id, level = level + 1 })
	if def.id ~= "FarmSpeed" then
		TruckService.refresh(player)
	end
end

function UpgradeService.start()
	BuyUpgrade.OnServerEvent:Connect(function(player: Player, upgradeId: unknown)
		if not limiter:allow(player) then
			return
		end
		if type(upgradeId) ~= "string" or #upgradeId > 32 then
			return
		end
		UpgradeService.buy(player, upgradeId)
	end)
end

return UpgradeService
