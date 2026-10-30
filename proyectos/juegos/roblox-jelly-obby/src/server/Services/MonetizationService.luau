--!strict
-- Pases (bobina de velocidad, bobina de gravedad, estelas especiales) y el producto «Saltar fase».
-- Adaptado de Jelly Pets / Egg Truck Tycoon.
-- * Un ID a 0 en Config está apagado: no se consulta ni se concede nada.
-- * ProcessReceipt es idempotente: el PurchaseId se guarda en el DataStore en la misma escritura que la compra
--   (DataService.commitPurchase) y solo entonces se devuelve PurchaseGranted. Si algo falla, NotProcessedYet y
--   Roblox lo reintenta más tarde (también en otro servidor), sin conceder dos veces.
-- * «Saltar fase» suma exactamente 1 (Checkpoint.skip) y nunca pasa de la última fase. Si cuando llega el recibo ya
--   no se puede saltar (estás en la última fase o en la cima), se devuelven monedas en su lugar.
-- * Los efectos en el mundo (llevarte al checkpoint nuevo, el aviso) van después de guardar.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Checkpoint = require(ReplicatedStorage.Shared.Checkpoint)
local Config = require(ReplicatedStorage.Shared.Config)
local DataService = require(script.Parent.DataService)
local StageService = require(script.Parent.StageService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local MonetizationService = {}

local STAGES = Config.Tower.stages

local function nameById(list: { Config.ShopItem }, id: number): string?
	if id == 0 then
		return nil
	end
	for _, item in list do
		if item.id == id then
			return item.name
		end
	end
	return nil
end

local function applyPass(player: Player, name: string)
	player:SetAttribute("Pass_" .. name, true)
	if name == "SpeedCoil" or name == "GravityCoil" then
		StageService.giveCoils(player)
	elseif name == "TrailPack" then
		StageService.refreshTrail(player)
	end
end

-- Consulta qué pases tiene el jugador (antes de que aparezca en su checkpoint).
function MonetizationService.loadOwnership(player: Player)
	for _, pass in Config.GamePasses do
		if pass.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, pass.id)
			end)
			if ok and owns then
				player:SetAttribute("Pass_" .. pass.name, true)
			elseif not ok then
				warn("[Monetization] no se pudo consultar el pase", pass.name, owns)
			end
		end
	end
end

-- Concede el producto `productName` (ya validado) a un jugador con los datos cargados.
local function grantProduct(player: Player, productName: string, purchaseId: string): Enum.ProductPurchaseDecision
	if productName ~= "SkipStage" then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local refund = Config.Skip.refundCoins
	local skipped = false
	local previousStage = 0
	local previousBest = 0
	local function mutate(data: DataService.PlayerData)
		local ok, nextStage = Checkpoint.skip(data.stage, STAGES)
		skipped = ok
		if ok then
			previousStage = data.stage
			previousBest = data.best
			data.stage = nextStage
			data.best = math.max(data.best, nextStage)
		else
			data.coins += refund
		end
	end
	local function revert(data: DataService.PlayerData)
		if skipped then
			data.stage = previousStage
			data.best = previousBest
		else
			data.coins = math.max(0, data.coins - refund)
		end
	end

	local result = DataService.commitPurchase(player, purchaseId, mutate, revert)
	if result == "granted" then
		if skipped then
			task.spawn(StageService.afterSkip, player)
		else
			Notify:FireClient(player, { kind = "skip_refund", coins = refund })
		end
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
		local productName = nameById(Config.Products, receipt.ProductId)
		if productName then
			local session = DataService.waitFor(player, 20)
			if session then
				return grantProduct(player, productName, tostring(receipt.PurchaseId))
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
			if purchased then
				local name = nameById(Config.GamePasses, passId)
				if name then
					applyPass(player, name)
				end
			end
		end
	)
end

return MonetizationService
