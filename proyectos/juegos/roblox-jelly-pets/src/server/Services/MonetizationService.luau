--!strict
-- Pases (2× monedas, más pedestales, candado rápido) y productos de desarrollador (Tirada de suerte, bolsa de
-- monedas). Adaptado de Egg Truck Tycoon.
-- * Un ID a 0 en Config está apagado: no se consulta ni se concede nada.
-- * ProcessReceipt es idempotente: el PurchaseId se guarda en el DataStore en la misma escritura que la compra
--   (DataService.commitPurchase) y solo entonces se devuelve PurchaseGranted. Si algo falla, NotProcessedYet y
--   Roblox lo reintenta más tarde (también en otro servidor), sin conceder dos veces.
-- * Los efectos en el mundo (la gelatina que cae del cielo, el aviso) van después de guardar.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local Pets = require(ReplicatedStorage.Shared.Pets)
local Rarity = require(ReplicatedStorage.Shared.Rarity)
local Rng = require(ReplicatedStorage.Shared.Rng)
local DataService = require(script.Parent.DataService)
local PetService = require(script.Parent.PetService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local MonetizationService = {}

local rng = Rng.new(Random.new():NextInteger(1, 2 ^ 31 - 2))
local weights: { number } = {}
for _, def in Config.Rarities do
	table.insert(weights, def.weight)
end

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
	if name == "ExtraPads" then
		PetService.refreshPads(player)
	end
end

-- Consulta qué pases tiene el jugador (antes de colocar sus gelatinas).
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
	local mutate: (DataService.PlayerData) -> () = function() end
	local revert: (DataService.PlayerData) -> () = function() end
	local effect: () -> () = function() end

	if productName == "LuckyRoll" then
		-- la tirada se hace una vez: si Roblox reintenta el recibo, sale otra, pero solo se concede una
		local rarity = Rarity.roll(rng, weights, Config.LuckyRoll.minRarity)
		local species = Config.Species[rng.int(1, #Config.Species)].id
		local padCount = PetService.padCount(player)
		local refund = Config.Rarities[rarity].price -- si ya tiene el máximo de gelatinas, su precio en monedas
		local record: Pets.SavedPet? = nil
		mutate = function(data)
			if #data.pets < Config.Pets.maxOwned then
				record = PetService.newRecord(data, species, rarity, padCount)
			else
				data.coins += refund
			end
		end
		revert = function(data)
			local added = record
			if added then
				Pets.remove(data.pets, added.id)
			else
				data.coins = math.max(0, data.coins - refund)
			end
		end
		effect = function()
			local added = record
			if added then
				PetService.showRecord(player, added)
			end
			local coins = if added then 0 else refund
			Notify:FireClient(player, { kind = "lucky", s = species, r = rarity, coins = coins })
		end
	elseif productName == "CoinPack" then
		local amount = Economy.coinPack(PetService.incomePerSecond(player), Config.CoinPack)
		mutate = function(data)
			data.coins += amount
		end
		revert = function(data)
			data.coins = math.max(0, data.coins - amount)
		end
		effect = function()
			Notify:FireClient(player, { kind = "coinpack", coins = amount })
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
