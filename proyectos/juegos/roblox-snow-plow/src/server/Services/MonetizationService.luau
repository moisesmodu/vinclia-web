--!strict
-- Pases (2× nieve, Mochila grande, Imán) y productos de desarrollador (Tormenta, Bolsa de monedas, Huevo de la
-- suerte). Adaptado de Jelly Pets.
-- * Un ID a 0 en Config está apagado: no se consulta ni se concede nada.
-- * ProcessReceipt es idempotente: el PurchaseId se guarda en el DataStore en la misma escritura que la compra
--   (DataService.commitPurchase) y solo entonces se devuelve PurchaseGranted. Si algo falla, NotProcessedYet y
--   Roblox lo reintenta más tarde (también en otro servidor), sin conceder dos veces.
-- * Los efectos en el mundo (la tormenta, el compañero que aparece, el aviso) van después de guardar.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local Rebirth = require(ReplicatedStorage.Shared.Rebirth)
local BuddyService = require(script.Parent.BuddyService)
local DataService = require(script.Parent.DataService)
local PlowService = require(script.Parent.PlowService)
local SnowService = require(script.Parent.SnowService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

local MonetizationService = {}

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
	PlowService.applyStats(player)
end

-- Consulta qué pases tiene el jugador (antes de calcular su pala y su mochila).
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

	if productName == "SnowStorm" then
		-- no cambia los datos: solo se apunta el recibo; la tormenta es del servidor donde se compró
		effect = function()
			SnowService.startStorm(Config.SnowStorm.duration)
			for _, other in Players:GetPlayers() do
				Notify:FireClient(other, { kind = "storm", by = player.UserId })
			end
		end
	elseif productName == "CoinPack" then
		local session = DataService.get(player)
		local zones = if session then session.data.zones else 1
		local rebirths = if session then session.data.rebirths else 0
		local amount = Economy.coinPack(zones, Rebirth.multiplier(rebirths, Config.Rebirth.perRebirth), Config.CoinPack)
		mutate = function(data)
			data.coins += amount
		end
		revert = function(data)
			data.coins = math.max(0, data.coins - amount)
		end
		effect = function()
			Notify:FireClient(player, { kind = "coinpack", coins = amount })
		end
	elseif productName == "LuckyEgg" then
		-- la tirada se hace una vez: si Roblox reintenta el recibo, sale otra, pero solo se concede una
		local session = DataService.get(player)
		local egg = BuddyService.bestEgg(if session then session.data.zones else 1)
		local species, rarity = BuddyService.roll(egg, Config.LuckyEgg.minRarity)
		local refund = egg.cost -- si no le caben más compañeros, el precio del huevo en monedas
		local record: BuddyService.SavedBuddy? = nil
		mutate = function(data)
			if BuddyService.hasRoom(data) then
				record = BuddyService.newRecord(data, species, rarity)
			else
				data.coins += refund
			end
		end
		revert = function(data)
			local added = record
			if added then
				BuddyService.removeRecord(data, added.id)
			else
				data.coins = math.max(0, data.coins - refund)
			end
		end
		effect = function()
			local added = record
			if added then
				BuddyService.refresh(player)
			end
			Notify:FireClient(player, { kind = "lucky", s = species, r = rarity, coins = if added then 0 else refund })
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
