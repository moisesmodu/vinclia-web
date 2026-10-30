--!strict
-- Pases (2× Cash, Auto-Collect, Faster Rocket) y productos de desarrollador (Cash Pack, Instant Upgrade, Meteor
-- Shower). Adaptado de Snow Plow Simulator.
-- * Un ID a 0 en Config está apagado: no se consulta ni se concede nada.
-- * ProcessReceipt es idempotente: el PurchaseId se guarda en el DataStore en la misma escritura que la compra
--   (DataService.commitPurchase) y solo entonces se devuelve PurchaseGranted. Si algo falla, NotProcessedYet y
--   Roblox lo reintenta más tarde (también en otro servidor), sin conceder dos veces.
-- * Los efectos en el mundo (construir el botón, la lluvia de cristales, el aviso) van después de guardar.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Buttons = require(ReplicatedStorage.Shared.Buttons)
local Config = require(ReplicatedStorage.Shared.Config)
local Income = require(ReplicatedStorage.Shared.Income)
local Catalog = require(script.Parent.Catalog)
local DataService = require(script.Parent.DataService)
local RocketService = require(script.Parent.RocketService)
local TycoonService = require(script.Parent.TycoonService)

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
end

-- Consulta qué pases tiene el jugador (antes de calcular sus ingresos).
function MonetizationService.loadOwnership(player: Player)
	for _, pass in Config.GamePasses do
		if pass.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, pass.id)
			end)
			if ok and owns then
				applyPass(player, pass.name)
			elseif not ok then
				warn("[Monetization] no se pudo consultar el pase", pass.name, owns)
			end
		end
	end
end

local function removeOwned(data: DataService.PlayerData, id: string)
	local index = table.find(data.owned, id)
	if index then
		table.remove(data.owned, index)
	end
end

-- Concede el producto `productName` (ya validado) a un jugador con los datos cargados.
local function grantProduct(player: Player, productName: string, purchaseId: string): Enum.ProductPurchaseDecision
	local mutate: (DataService.PlayerData) -> () = function() end
	local revert: (DataService.PlayerData) -> () = function() end
	local effect: () -> () = function() end
	-- 10 minutos de ingresos (también lo que da Instant Upgrade si ya está todo comprado)
	local packCoins = Income.cashPack(TycoonService.currentRate(player), Config.CashPack)

	if productName == "CashPack" then
		mutate = function(data)
			data.coins += packCoins
		end
		revert = function(data)
			data.coins = math.max(0, data.coins - packCoins)
		end
		effect = function()
			Notify:FireClient(player, { kind = "cashpack", coins = packCoins })
		end
	elseif productName == "InstantUpgrade" then
		-- el botón se elige dentro de la escritura, con los datos de ese momento
		local granted: string? = nil
		mutate = function(data)
			granted = Buttons.nextButton(Catalog.tree, Buttons.toSet(data.owned))
			local id = granted
			if id then
				table.insert(data.owned, id)
			else
				data.coins += packCoins
			end
		end
		revert = function(data)
			local id = granted
			if id then
				removeOwned(data, id)
			else
				data.coins = math.max(0, data.coins - packCoins)
			end
		end
		effect = function()
			local id = granted
			if id then
				TycoonService.sync(player)
				local def = Catalog.get(id)
				Notify:FireClient(player, { kind = "instant", icon = if def then def.icon else "⏩" })
			else
				Notify:FireClient(player, { kind = "cashpack", coins = packCoins })
			end
		end
	elseif productName == "MeteorShower" then
		-- no cambia los datos: solo se apunta el recibo; la lluvia cae en la parcela del comprador
		effect = function()
			RocketService.meteorShower(player)
			Notify:FireClient(player, { kind = "shower" })
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
