--!strict
-- Pases (2× dinero, camión grande, segunda granja) y productos de desarrollador (huevo de oro, reparación).
-- El pase 2× también hace algo más probables los huevos raros, y el Huevo de oro da además un impulso de rareza
-- de Config.GoldenEgg.luckSeconds (FarmService lo lee de los datos guardados).
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
		if id == passId and type(name) == "string" then
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
		if id == productId and type(name) == "string" then
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
		if type(name) == "string" and type(id) == "number" and id ~= 0 then
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

-- Concede el producto `productName` (ya validado) a un jugador con los datos cargados.
local function grantProduct(
	player: Player,
	productName: string,
	session: DataService.Session,
	purchaseId: string
): Enum.ProductPurchaseDecision
	local mutate: (DataService.PlayerData) -> () = function() end
	local revert: (DataService.PlayerData) -> () = function() end
	local effect: () -> () = function() end

	if productName == "GoldenEgg" then
		-- monedas al instante y un rato de huevos raros más probables (se guarda en la misma escritura)
		local amount = Economy.goldenEggValue(session.data.best, Config.GoldenEgg)
		local previousLuck = session.data.luckUntil
		local luckUntil = math.max(os.time(), previousLuck) + Config.GoldenEgg.luckSeconds
		mutate = function(data)
			data.coins += amount
			data.luckUntil = luckUntil
		end
		revert = function(data)
			data.coins = math.max(0, data.coins - amount)
			data.luckUntil = previousLuck
		end
		effect = function()
			Notify:FireClient(player, { kind = "golden", coins = amount, luckUntil = luckUntil })
		end
	elseif productName == "InstantRepair" then
		effect = function()
			TruckService.instantRepair(player)
		end
	else
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local result = DataService.commitPurchase(player, purchaseId, mutate, revert)
	if result == "granted" then
		task.spawn(effect)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	elseif result == "already" then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- El recibo llega de MarketplaceService: si falta el jugador, el producto o sus datos, Roblox lo reintentará.
local function processReceipt(receipt: { [string]: any }): Enum.ProductPurchaseDecision
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	if player then
		local productName = productNameById(receipt.ProductId)
		if productName then
			local session = DataService.waitFor(player, 20)
			if session then
				return grantProduct(player, productName, session, tostring(receipt.PurchaseId))
			end
		else
			warn("[Monetization] producto desconocido", receipt.ProductId)
		end
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
