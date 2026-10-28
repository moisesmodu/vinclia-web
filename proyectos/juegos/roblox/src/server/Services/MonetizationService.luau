--!strict
-- Pases (2× dinero, camión grande, segunda granja) y productos de desarrollador (huevo de oro, reparación).
-- * Un ID a 0 en Config está apagado: no se consulta ni se concede nada.
-- * ProcessReceipt es idempotente: el PurchaseId se guarda en el DataStore en la misma escritura que la compra
--   (DataService.commitPurchase) y solo entonces se devuelve PurchaseGranted. Si algo falla, NotProcessedYet y
--   Roblox lo reintenta más tarde (también en otro servidor), sin conceder dos veces.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)
local FarmService = require(script.Parent.FarmService)
local TruckService = require(script.Parent.TruckService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local MonetizationService = {}

local function passNameById(passId: number): string?
	if passId == 0 then
		return nil
	end
	for name, id in Config.GamePasses do
		if id == passId then
			return name
		end
	end
	return nil
end

local function productNameById(productId: number): string?
	if productId == 0 then
		return nil
	end
	for name, id in Config.Products do
		if id == productId then
			return name
		end
	end
	return nil
end

local function applyPass(player: Player, name: string)
	player:SetAttribute("Pass_" .. name, true)
	if name == "BigTruck" then
		TruckService.refresh(player)
	elseif name == "SecondFarm" then
		FarmService.refresh(player)
	end
end

-- Consulta qué pases tiene el jugador (antes de construir su granja y su camión).
function MonetizationService.loadOwnership(player: Player)
	for name, id in Config.GamePasses do
		if id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id)
			end)
			if ok and owns then
				player:SetAttribute("Pass_" .. name, true)
			elseif not ok then
				warn("[Monetization] no se pudo consultar el pase", name, owns)
			end
		end
	end
end

local function processReceipt(receipt: { [string]: any }): Enum.ProductPurchaseDecision
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local productName = productNameById(receipt.ProductId)
	if not productName then
		warn("[Monetization] producto desconocido", receipt.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local session = DataService.waitFor(player, 20)
	if not session then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local mutate: (DataService.PlayerData) -> () = function() end
	local revert: (DataService.PlayerData) -> () = function() end
	local effect: () -> () = function() end

	if productName == "GoldenEgg" then
		local amount = Economy.goldenEggValue(session.data.best, Config.GoldenEgg)
		mutate = function(data)
			data.coins += amount
		end
		revert = function(data)
			data.coins = math.max(0, data.coins - amount)
		end
		effect = function()
			Notify:FireClient(player, { kind = "golden", coins = amount })
		end
	elseif productName == "InstantRepair" then
		effect = function()
			TruckService.instantRepair(player)
		end
	else
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local result = DataService.commitPurchase(player, tostring(receipt.PurchaseId), mutate, revert)
	if result == "granted" then
		task.spawn(effect)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	elseif result == "already" then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

function MonetizationService.start()
	MarketplaceService.ProcessReceipt = processReceipt

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(
		function(player: Player, passId: number, purchased: boolean)
			if not purchased then
				return
			end
			local name = passNameById(passId)
			if name then
				applyPass(player, name)
			end
		end
	)
end

return MonetizationService
