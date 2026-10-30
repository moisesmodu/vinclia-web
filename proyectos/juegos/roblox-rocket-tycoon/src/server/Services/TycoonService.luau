--!strict
-- El bucle del tycoon en la parcela de cada jugador:
-- * Baldosas de compra: se ven las que tienen todos sus requisitos comprados (Buttons.available). Al pisar una,
--   el servidor valida con Buttons.canBuy (dueño, requisitos, monedas), cobra, construye el objeto y enseña las
--   siguientes.
-- * Ingresos: cada segundo la refinería suma Income.perSecond a la caja de la parcela (🏦), que se cobra pisando
--   su baldosa; con el pase Auto-Collect va directo al bolsillo. Las rocas que se ven en la cinta las dibuja cada
--   cliente (OreView): son solo decoración, las cuentas están aquí.
-- * Sync: reconstruye la base desde los datos (al entrar, tras renacer o tras el producto Instant Upgrade).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Buttons = require(ReplicatedStorage.Shared.Buttons)
local Config = require(ReplicatedStorage.Shared.Config)
local Income = require(ReplicatedStorage.Shared.Income)
local Catalog = require(script.Parent.Catalog)
local DataService = require(script.Parent.DataService)
local ItemBuilder = require(script.Parent.ItemBuilder)
local PlotService = require(script.Parent.PlotService)
local RocketService = require(script.Parent.RocketService)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type Base = {
	player: Player,
	plot: PlotService.Plot,
	carry: number,
	rate: number,
	lastTouch: number,
	lastWarning: number,
}

local TycoonService = {}

local bases: { [Player]: Base } = {}

local function ownedSet(data: DataService.PlayerData): { [string]: boolean }
	return Buttons.toSet(data.owned)
end

-- Monedas por segundo de la base del jugador con todo aplicado.
function TycoonService.rate(player: Player, data: DataService.PlayerData): number
	local multiplier = Income.playerMultiplier({
		rebirths = data.rebirths,
		perRebirth = Config.Rebirth.perRebirth,
		crystals = data.crystals,
		doubleCash = player:GetAttribute("Pass_DoubleCash") == true,
		doubleCashMultiplier = Config.Income.doubleCashMultiplier,
	}, Config.Crystals)
	return Income.perSecond(Catalog.income, ownedSet(data), multiplier)
end

local function publishRate(player: Player, data: DataService.PlayerData): number
	local rate = TycoonService.rate(player, data)
	player:SetAttribute("Income", rate)
	player:SetAttribute("CrystalMultiplier", Income.crystalMultiplier(data.crystals, data.rebirths, Config.Crystals))
	player:SetAttribute("RebirthUnlocked", table.find(data.owned, Config.FinalButton) ~= nil)
	return rate
end

local function characterOwner(hit: BasePart): Player?
	local model = hit:FindFirstAncestorOfClass("Model")
	if model then
		return Players:GetPlayerFromCharacter(model)
	end
	return nil
end

local function updateVaultLabel(base: Base, data: DataService.PlayerData)
	if base.player:GetAttribute("Pass_AutoCollect") == true then
		base.plot.vaultLabel.Text = "🏦 🧲"
	else
		base.plot.vaultLabel.Text = "🏦 " .. Income.short(data.vault)
	end
end

local refreshPads: (base: Base) -> ()

local function buildItem(base: Base, def: Config.ButtonDef)
	if base.plot.items:FindFirstChild(def.id) == nil then
		ItemBuilder.build(base.plot.items, base.plot.origin, def)
	end
	if def.kind == "rocket" then
		RocketService.spawnRocket(base.plot, base.player)
	end
end

local function tryBuy(base: Base, id: string)
	local player = base.player
	local session = DataService.get(player)
	local def = Catalog.get(id)
	if session and def then
		local data = session.data
		local result, cost = Buttons.canBuy(Catalog.tree, ownedSet(data), data.coins, id)
		if result == "ok" and DataService.trySpend(player, cost) then
			table.insert(data.owned, id)
			DataService.touch(player)
			buildItem(base, def)
			refreshPads(base)
			publishRate(player, data)
			Notify:FireClient(player, { kind = "bought", id = id, icon = def.icon })
			if id == Config.FinalButton then
				Notify:FireClient(player, { kind = "rebirth_ready" })
			end
			task.spawn(DataService.save, player)
		elseif result == "coins" and os.clock() - base.lastWarning > 1.5 then
			base.lastWarning = os.clock()
			Notify:FireClient(player, { kind = "nomoney", price = cost })
		end
	end
end

refreshPads = function(base: Base)
	base.plot.pads:ClearAllChildren()
	local session = DataService.get(base.player)
	if session then
		for _, id in Buttons.available(Catalog.tree, ownedSet(session.data)) do
			local def = Catalog.get(id)
			if def then
				local price = if def.cost == 0 then "🎁" else "🪙 " .. Income.short(def.cost)
				local pad = ItemBuilder.pad(base.plot.pads, base.plot.origin, def, price)
				pad.Touched:Connect(function(hit: BasePart)
					if characterOwner(hit) == base.player and os.clock() - base.lastTouch > 0.4 then
						base.lastTouch = os.clock()
						tryBuy(base, id)
					end
				end)
			end
		end
	end
end

-- Reconstruye la base desde los datos: quita lo que ya no está comprado, construye lo que falta y repone las
-- baldosas. (Al entrar, tras renacer o tras Instant Upgrade.)
function TycoonService.sync(player: Player)
	local base = bases[player]
	local session = DataService.get(player)
	if base and session then
		local owned = ownedSet(session.data)
		for _, child in base.plot.items:GetChildren() do
			local id = child:GetAttribute("Button")
			if type(id) == "string" and owned[id] ~= true then
				child:Destroy()
			end
		end
		if owned.rocket ~= true then
			RocketService.despawnRocket(base.plot)
		end
		for _, id in session.data.owned do
			local def = Catalog.get(id)
			if def then
				buildItem(base, def)
			end
		end
		refreshPads(base)
		publishRate(player, session.data)
		updateVaultLabel(base, session.data)
	end
end

function TycoonService.setup(player: Player, plot: PlotService.Plot)
	bases[player] = {
		player = player,
		plot = plot,
		carry = 0,
		rate = 0,
		lastTouch = 0,
		lastWarning = 0,
	}
	TycoonService.sync(player)
end

function TycoonService.cleanup(player: Player)
	bases[player] = nil
end

-- Monedas por segundo actuales (para Cash Pack y para las ganancias sin conectar).
function TycoonService.currentRate(player: Player): number
	local session = DataService.get(player)
	if session then
		return TycoonService.rate(player, session.data)
	end
	return 0
end

local function collectVault(plot: PlotService.Plot, hit: BasePart)
	local player = characterOwner(hit)
	if player and plot.owner == player then
		local base = bases[player]
		local session = DataService.get(player)
		if base and session and session.data.vault > 0 and os.clock() - base.lastTouch > 0.4 then
			base.lastTouch = os.clock()
			local coins = session.data.vault
			session.data.vault = 0
			DataService.addCoins(player, coins)
			updateVaultLabel(base, session.data)
			Notify:FireClient(player, { kind = "collect", coins = coins })
		end
	end
end

function TycoonService.start()
	for _, plot in PlotService.all() do
		plot.vaultPad.Touched:Connect(function(hit: BasePart)
			collectVault(plot, hit)
		end)
	end

	local dt = Config.Income.tickSeconds
	task.spawn(function()
		while true do
			task.wait(dt)
			for player, base in bases do
				local session = DataService.get(player)
				if session then
					local data = session.data
					base.rate = publishRate(player, data)
					local whole, carry = Income.accumulate(base.carry, base.rate, dt)
					base.carry = carry
					if whole > 0 then
						if player:GetAttribute("Pass_AutoCollect") == true then
							data.coins += whole
						else
							data.vault += whole
						end
						DataService.touch(player)
					end
					updateVaultLabel(base, data)
				end
			end
		end
	end)
end

-- PRODUCTO Instant Upgrade: elige el siguiente botón (el más barato de los visibles). nil si no queda ninguno.
function TycoonService.nextButton(player: Player): string?
	local session = DataService.get(player)
	if session then
		return Buttons.nextButton(Catalog.tree, ownedSet(session.data))
	end
	return nil
end

return TycoonService
