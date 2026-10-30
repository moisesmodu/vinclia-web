--!strict
-- Interfaz sin texto: iconos (emoji) y números. Arriba: monedas, barra de nieve de la mochila, bonus de los
-- compañeros, multiplicador de renacer y tormenta. A la derecha (lejos del joystick del móvil) botones grandes:
-- mejoras, huevos, compañeros, zonas, premio diario, calendario de Adviento y tienda. Escala con la pantalla.
-- Lo que se muestra sale de atributos y avisos del servidor: el cliente solo pide.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Buddies = require(Shared:WaitForChild("Buddies"))
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))
local Rebirth = require(Shared:WaitForChild("Rebirth"))
local Upgrades = require(Shared:WaitForChild("Upgrades"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local UpgradeRemote = Remotes:WaitForChild("Upgrade") :: RemoteEvent
local UnlockZoneRemote = Remotes:WaitForChild("UnlockZone") :: RemoteEvent
local TeleportRemote = Remotes:WaitForChild("Teleport") :: RemoteEvent
local HatchRemote = Remotes:WaitForChild("Hatch") :: RemoteEvent
local EquipRemote = Remotes:WaitForChild("Equip") :: RemoteEvent
local EquipBestRemote = Remotes:WaitForChild("EquipBest") :: RemoteEvent
local RecycleRemote = Remotes:WaitForChild("Recycle") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local ClaimAdventRemote = Remotes:WaitForChild("ClaimAdvent") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local InventoryRemote = Remotes:WaitForChild("Inventory") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local player = Players.LocalPlayer

local C = {
	ink = Color3.fromRGB(30, 42, 58),
	sky = Color3.fromRGB(79, 179, 255),
	cloud = Color3.fromRGB(244, 250, 255),
	sun = Color3.fromRGB(255, 201, 77),
	grass = Color3.fromRGB(88, 194, 106),
	red = Color3.fromRGB(229, 75, 75),
	ice = Color3.fromRGB(150, 210, 255),
	grey = Color3.fromRGB(120, 130, 145),
}
local FONT = Enum.Font.FredokaOne

local Hud = {}

type InventoryItem = { id: string, s: string, r: number, e: boolean }

local speciesIcons: { [string]: string } = {}
for _, def in Config.BuddySpecies do
	speciesIcons[def.id] = def.icon
end

local function rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

local function buddyIcon(species: any, rarity: any): string
	local s = if type(species) == "string" then speciesIcons[species] or "⛄" else "⛄"
	local r = if type(rarity) == "number"
		then Config.BuddyRarities[math.clamp(math.floor(rarity), 1, #Config.BuddyRarities)]
		else nil
	return if r then r.icon .. s else s
end

local function percent(x: number): string
	return tostring(math.floor(x * 100 + 0.5)) .. "%"
end

local function round(parent: GuiObject, radius: number)
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = parent
end

local function outline(parent: GuiObject)
	local stroke = Instance.new("UIStroke")
	stroke.Color = C.ink
	stroke.Thickness = 3
	stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	stroke.Parent = parent
end

local function text(parent: Instance, value: string, size: UDim2, position: UDim2?): TextLabel
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = size
	label.Position = position or UDim2.fromScale(0, 0)
	label.Font = FONT
	label.TextScaled = true
	label.TextColor3 = C.cloud
	label.Text = value
	label.Parent = parent
	return label
end

local function button(parent: Instance, value: string, size: UDim2, color: Color3): TextButton
	local b = Instance.new("TextButton")
	b.Size = size
	b.BackgroundColor3 = color
	b.AutoButtonColor = true
	b.Font = FONT
	b.TextScaled = true
	b.TextColor3 = C.cloud
	b.Text = value
	round(b, 18)
	outline(b)
	b.Parent = parent
	return b
end

local function pill(parent: Instance, order: number, width: number): (Frame, TextLabel)
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromOffset(width, 48)
	frame.BackgroundColor3 = C.ink
	frame.BackgroundTransparency = 0.15
	frame.LayoutOrder = order
	round(frame, 24)
	frame.Parent = parent
	local label = text(frame, "", UDim2.new(1, -16, 1, -10), UDim2.fromOffset(8, 5))
	label.ZIndex = 3
	return frame, label
end

local function list(parent: Instance, direction: Enum.FillDirection, padding: number)
	local layout = Instance.new("UIListLayout")
	layout.FillDirection = direction
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	layout.Padding = UDim.new(0, padding)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Parent = parent
end

local function panel(parent: Instance, width: number, height: number): Frame
	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 0.5)
	frame.Position = UDim2.fromScale(0.46, 0.56)
	frame.Size = UDim2.fromOffset(width, height)
	frame.BackgroundColor3 = C.ink
	frame.BackgroundTransparency = 0.1
	frame.Visible = false
	round(frame, 24)
	frame.Parent = parent
	local close = button(frame, "✖", UDim2.fromOffset(44, 44), C.red)
	close.AnchorPoint = Vector2.new(1, 0)
	close.Position = UDim2.new(1, 10, 0, -10)
	close.ZIndex = 3
	close.Activated:Connect(function()
		frame.Visible = false
	end)
	return frame
end

local function cardsArea(frame: Frame): Frame
	local inner = Instance.new("Frame")
	inner.Name = "Cards"
	inner.BackgroundTransparency = 1
	inner.Size = UDim2.new(1, -24, 1, -24)
	inner.Position = UDim2.fromOffset(12, 12)
	inner.Parent = frame
	list(inner, Enum.FillDirection.Horizontal, 10)
	return inner
end

local function attr(name: string): number
	local value = player:GetAttribute(name)
	return if type(value) == "number" then value else 0
end

local function clock(seconds: number): string
	local s = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", math.floor(s / 60), s % 60)
end

-- Lo que manda el servidor por Inventory → compañeros válidos.
local function toInventory(payload: any): { InventoryItem }
	local result: { InventoryItem } = {}
	if type(payload) == "table" then
		for _, item in payload do
			if type(item) == "table" and type(item.id) == "string" and type(item.s) == "string" then
				if type(item.r) == "number" then
					table.insert(result, { id = item.id, s = item.s, r = item.r, e = item.e == true })
				end
			end
		end
	end
	return result
end

-- Botón que pide dos toques en 3 s (renacer, soltar un compañero). `setIcon` cambia lo que se ve: `icon` en
-- reposo e `icon❓` esperando el segundo toque.
local function twoTaps(setIcon: (string) -> (), icon: string, action: () -> ()): () -> ()
	local armedAt = 0
	return function()
		if os.clock() - armedAt < 3 then
			armedAt = 0
			setIcon(icon)
			action()
		else
			armedAt = os.clock()
			setIcon(icon .. "❓")
			task.delay(3, function()
				if os.clock() - armedAt >= 3 then
					setIcon(icon)
				end
			end)
		end
	end
end

function Hud.start()
	local gui = Instance.new("ScreenGui")
	gui.Name = "SnowPlowHud"
	gui.ResetOnSpawn = false
	gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

	local scale = Instance.new("UIScale")
	scale.Parent = gui
	local function rescale()
		local camera = Workspace.CurrentCamera
		if camera then
			local v = camera.ViewportSize
			scale.Scale = math.clamp(math.min(v.X / 1000, v.Y / 620), 0.55, 1.3)
		end
	end
	rescale()
	local currentCamera = Workspace.CurrentCamera
	if currentCamera then
		currentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	end

	-- barra superior
	local top = Instance.new("Frame")
	top.AnchorPoint = Vector2.new(0.5, 0)
	top.Position = UDim2.new(0.5, 0, 0, 6)
	top.Size = UDim2.fromOffset(760, 52)
	top.BackgroundTransparency = 1
	top.Parent = gui
	list(top, Enum.FillDirection.Horizontal, 8)
	local _, coinsLabel = pill(top, 1, 160)
	local snowFrame, snowLabel = pill(top, 2, 230)
	local fill = Instance.new("Frame")
	fill.Name = "Fill"
	fill.BackgroundColor3 = C.ice
	fill.Size = UDim2.fromScale(0, 1)
	fill.ZIndex = 2
	round(fill, 24)
	fill.Parent = snowFrame
	local _, boostLabel = pill(top, 3, 120)
	local _, rebirthLabel = pill(top, 4, 100)
	local stormFrame, stormLabel = pill(top, 5, 120)
	stormFrame.Visible = false

	-- aviso
	local toast = text(gui, "", UDim2.fromOffset(600, 54), UDim2.new(0.5, -300, 0, 66))
	toast.TextStrokeTransparency = 0.2
	toast.TextStrokeColor3 = C.ink
	toast.Visible = false
	local toastToken = 0
	local function show(message: string, color: Color3?)
		toastToken += 1
		local token = toastToken
		toast.Text = message
		toast.TextColor3 = color or C.cloud
		toast.TextTransparency = 0
		toast.Visible = true
		task.delay(2.4, function()
			if token == toastToken then
				local fade = TweenService:Create(toast, TweenInfo.new(0.4), { TextTransparency = 1 })
				fade:Play()
				fade.Completed:Wait()
				if token == toastToken then
					toast.Visible = false
				end
			end
		end)
	end

	-- columna de acciones
	local actions = Instance.new("Frame")
	actions.AnchorPoint = Vector2.new(1, 0.5)
	actions.Position = UDim2.new(1, -10, 0.5, 0)
	actions.Size = UDim2.fromOffset(72, 500)
	actions.BackgroundTransparency = 1
	actions.Parent = gui
	list(actions, Enum.FillDirection.Vertical, 8)
	local function action(icon: string, color: Color3, order: number): TextButton
		local b = button(actions, icon, UDim2.fromOffset(64, 64), color)
		b.LayoutOrder = order
		return b
	end
	local upgradesButton = action("⬆️", C.sun, 1)
	local eggsButton = action("🥚", C.grass, 2)
	local buddiesButton = action("🐧", C.sky, 3)
	local zonesButton = action("🗺️", C.ice, 4)
	local dailyButton = action("🎁", C.red, 5)
	local adventButton = action("🎄", C.grass, 6)
	local shopButton = action("🛒", C.red, 7)

	dailyButton.Activated:Connect(function()
		ClaimDailyRemote:FireServer()
	end)
	adventButton.Activated:Connect(function()
		ClaimAdventRemote:FireServer()
	end)

	-- MEJORAS: pala, mochila, velocidad, descarga automática y renacer (dos toques)
	local upgradesPanel = panel(gui, 720, 230)
	local upgradeCards = cardsArea(upgradesPanel)
	type UpgradeCard = { def: Config.UpgradeDef, card: TextButton, level: TextLabel, price: TextLabel }
	local upgradeViews: { UpgradeCard } = {}
	for i, def in Config.Upgrades do
		local card = button(upgradeCards, "", UDim2.fromOffset(124, 200), C.sun)
		card.LayoutOrder = i
		text(card, def.icon, UDim2.fromScale(1, 0.36), UDim2.fromScale(0, 0.04))
		local levelLabel = text(card, "0/0", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.42, 0))
		local priceLabel = text(card, "🪙 0", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.72, 0))
		card.Activated:Connect(function()
			UpgradeRemote:FireServer(def.id)
		end)
		table.insert(upgradeViews, { def = def, card = card, level = levelLabel, price = priceLabel })
	end
	local rebirthCard = button(upgradeCards, "", UDim2.fromOffset(124, 200), C.sky)
	rebirthCard.LayoutOrder = 10
	local rebirthIcon = text(rebirthCard, "🔁", UDim2.fromScale(1, 0.36), UDim2.fromScale(0, 0.04))
	local rebirthMultLabel = text(rebirthCard, "×1 ➜ ×1.5", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.42, 0))
	local rebirthPriceLabel = text(rebirthCard, "🪙 0", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.72, 0))
	local function setRebirthIcon(value: string)
		rebirthIcon.Text = value
	end
	rebirthCard.Activated:Connect(twoTaps(setRebirthIcon, "🔁", function()
		RebirthRemote:FireServer()
	end))

	-- HUEVOS: uno por zona, con las probabilidades de cada rareza
	local eggsPanel = panel(gui, 640, 250)
	local eggCards = cardsArea(eggsPanel)
	type EggCard = { egg: Config.EggDef, card: TextButton, price: TextLabel }
	local eggViews: { EggCard } = {}
	for i, egg in Config.Eggs do
		local card = button(eggCards, "", UDim2.fromOffset(142, 220), C.grass)
		card.LayoutOrder = i
		text(card, egg.icon .. Config.Zones[egg.zone].icon, UDim2.fromScale(1, 0.3), UDim2.fromScale(0, 0.03))
		local odds: { string } = {}
		for r, def in Config.BuddyRarities do
			local chance = Buddies.chance(egg.weights, r)
			if chance > 0 then
				table.insert(odds, def.icon .. percent(chance))
			end
		end
		local oddsLabel = text(card, table.concat(odds, "\n"), UDim2.new(1, -12, 0.42, 0), UDim2.new(0, 6, 0.33, 0))
		oddsLabel.TextColor3 = C.ink
		local priceLabel =
			text(card, "🪙 " .. Economy.short(egg.cost), UDim2.new(1, -12, 0.16, 0), UDim2.new(0, 6, 0.8, 0))
		card.Activated:Connect(function()
			HatchRemote:FireServer(i)
		end)
		table.insert(eggViews, { egg = egg, card = card, price = priceLabel })
	end

	-- COMPAÑEROS: equipar (toque), soltar por monedas (dos toques en 💰) y equipar los mejores
	local buddiesPanel = panel(gui, 680, 360)
	local header = Instance.new("Frame")
	header.BackgroundTransparency = 1
	header.Size = UDim2.new(1, -60, 0, 50)
	header.Position = UDim2.fromOffset(12, 10)
	header.Parent = buddiesPanel
	list(header, Enum.FillDirection.Horizontal, 10)
	local _, countLabel = pill(header, 1, 150)
	local _, equippedBoostLabel = pill(header, 2, 150)
	local bestButton = button(header, "⭐", UDim2.fromOffset(90, 46), C.sun)
	bestButton.LayoutOrder = 3
	bestButton.Activated:Connect(function()
		EquipBestRemote:FireServer()
	end)
	local scroll = Instance.new("ScrollingFrame")
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.Size = UDim2.new(1, -24, 1, -76)
	scroll.Position = UDim2.fromOffset(12, 66)
	scroll.ScrollBarThickness = 8
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.CanvasSize = UDim2.new()
	scroll.Parent = buddiesPanel
	local grid = Instance.new("UIGridLayout")
	grid.CellSize = UDim2.fromOffset(118, 130)
	grid.CellPadding = UDim2.fromOffset(8, 8)
	grid.SortOrder = Enum.SortOrder.LayoutOrder
	grid.Parent = scroll
	local emptyLabel = text(buddiesPanel, "🐧 0  ➜  🥚", UDim2.new(1, -40, 0, 60), UDim2.new(0, 20, 0.5, -10))

	local inventory: { InventoryItem } = {}
	local function renderBuddies()
		for _, child in scroll:GetChildren() do
			if child:IsA("GuiObject") then
				child:Destroy()
			end
		end
		emptyLabel.Visible = #inventory == 0
		-- equipados primero, luego por rareza
		local sorted = table.clone(inventory)
		table.sort(sorted, function(a, b)
			if a.e ~= b.e then
				return a.e
			end
			if a.r ~= b.r then
				return a.r > b.r
			end
			return a.id < b.id
		end)
		for i, item in sorted do
			local def = Config.BuddyRarities[math.clamp(item.r, 1, #Config.BuddyRarities)]
			local card = button(scroll, "", UDim2.fromScale(1, 1), rgb(def.color))
			card.LayoutOrder = i
			text(card, speciesIcons[item.s] or "⛄", UDim2.fromScale(1, 0.45), UDim2.fromScale(0, 0.03))
			local info =
				text(card, def.icon .. " +" .. percent(def.boost), UDim2.new(1, -10, 0.2, 0), UDim2.new(0, 5, 0.48, 0))
			info.TextColor3 = C.ink
			if item.e then
				local mark = text(card, "✅", UDim2.fromOffset(30, 30), UDim2.new(0, 4, 0, 4))
				mark.ZIndex = 3
			end
			card.Activated:Connect(function()
				EquipRemote:FireServer(item.id)
			end)
			local sell = button(card, "💰", UDim2.new(0.5, 0, 0.24, 0), C.ink)
			sell.Position = UDim2.new(0.25, 0, 0.72, 0)
			local function setSellIcon(value: string)
				sell.Text = value
			end
			sell.Activated:Connect(twoTaps(setSellIcon, "💰", function()
				RecycleRemote:FireServer(item.id)
			end))
		end
	end
	renderBuddies()
	InventoryRemote.OnClientEvent:Connect(function(payload: any)
		inventory = toInventory(payload)
		renderBuddies()
	end)

	-- ZONAS: ir a una abierta, abrir la siguiente
	local zonesPanel = panel(gui, 640, 230)
	local zoneCards = cardsArea(zonesPanel)
	type ZoneCard = { card: TextButton, status: TextLabel }
	local zoneViews: { ZoneCard } = {}
	for i, zone in Config.Zones do
		local card = button(zoneCards, "", UDim2.fromOffset(140, 200), C.ice)
		card.LayoutOrder = i
		text(card, zone.icon, UDim2.fromScale(1, 0.36), UDim2.fromScale(0, 0.04))
		local valueLabel = text(card, "❄️ ×" .. zone.value, UDim2.new(1, -12, 0.18, 0), UDim2.new(0, 6, 0.42, 0))
		valueLabel.TextColor3 = C.ink
		local status = text(card, "", UDim2.new(1, -12, 0.22, 0), UDim2.new(0, 6, 0.7, 0))
		card.Activated:Connect(function()
			if i <= attr("Zones") then
				TeleportRemote:FireServer(i)
			else
				UnlockZoneRemote:FireServer(i)
			end
		end)
		table.insert(zoneViews, { card = card, status = status })
	end

	-- TIENDA (solo lo que tenga ID distinto de 0)
	local shopPanel = panel(gui, 660, 220)
	local shopCards = cardsArea(shopPanel)
	type Offer = { name: string, id: number, isPass: boolean, priceLabel: TextLabel }
	local offers: { Offer } = {}
	local order = 0
	local function addOffer(item: Config.ShopItem, isPass: boolean)
		if item.id ~= 0 then
			order += 1
			local card = button(shopCards, "", UDim2.fromOffset(98, 186), if isPass then C.sky else C.sun)
			card.LayoutOrder = order
			text(card, item.icon, UDim2.fromScale(1, 0.5), UDim2.fromScale(0, 0.06))
			local priceLabel = text(card, "R$ …", UDim2.new(1, -10, 0.24, 0), UDim2.new(0, 5, 0.66, 0))
			card.Activated:Connect(function()
				if isPass then
					if player:GetAttribute("Pass_" .. item.name) ~= true then
						MarketplaceService:PromptGamePassPurchase(player, item.id)
					end
				else
					MarketplaceService:PromptProductPurchase(player, item.id)
				end
			end)
			table.insert(offers, { name = item.name, id = item.id, isPass = isPass, priceLabel = priceLabel })
			task.spawn(function()
				local infoType = if isPass then Enum.InfoType.GamePass else Enum.InfoType.Product
				local ok, info = pcall(function()
					return MarketplaceService:GetProductInfo(item.id, infoType)
				end)
				if ok and type(info) == "table" and type(info.PriceInRobux) == "number" then
					priceLabel.Text = "R$ " .. info.PriceInRobux
				end
			end)
		end
	end
	for _, item in Config.GamePasses do
		addOffer(item, true)
	end
	for _, item in Config.Products do
		addOffer(item, false)
	end
	shopButton.Visible = #offers > 0

	local panels = { upgradesPanel, eggsPanel, buddiesPanel, zonesPanel, shopPanel }
	local function toggle(target: Frame)
		local open = not target.Visible
		for _, p in panels do
			p.Visible = false
		end
		target.Visible = open
	end
	upgradesButton.Activated:Connect(function()
		toggle(upgradesPanel)
	end)
	eggsButton.Activated:Connect(function()
		toggle(eggsPanel)
	end)
	buddiesButton.Activated:Connect(function()
		toggle(buddiesPanel)
	end)
	zonesButton.Activated:Connect(function()
		toggle(zonesPanel)
	end)
	shopButton.Activated:Connect(function()
		toggle(shopPanel)
	end)

	-- refresco desde los atributos del servidor
	local function refresh()
		local coins = attr("Coins")
		local snow = attr("Snow")
		local capacity = math.max(attr("Capacity"), 1)
		local rebirths = attr("Rebirths")
		local zones = math.max(attr("Zones"), 1)
		local boost = attr("Boost")
		coinsLabel.Text = "🪙 " .. Economy.short(coins)
		snowLabel.Text = "❄️ " .. Economy.short(snow) .. "/" .. Economy.short(capacity)
		local ratio = math.clamp(snow / capacity, 0, 1)
		fill.Size = UDim2.fromScale(ratio, 1)
		fill.BackgroundColor3 = if ratio >= 1 then C.red else C.ice
		boostLabel.Text = "✨ +" .. percent(boost)
		local multiplier = Rebirth.multiplier(rebirths, Config.Rebirth.perRebirth)
		rebirthLabel.Text = "🔁 ×" .. tostring(multiplier)

		for _, view in upgradeViews do
			local level = attr("Lvl_" .. view.def.id)
			view.level.Text = string.format("%d/%d", level, view.def.maxLevel)
			local cost = Upgrades.cost(view.def, level)
			if cost then
				view.price.Text = "🪙 " .. Economy.short(cost)
				view.card.BackgroundColor3 = if coins >= cost then C.sun else C.grey
			else
				view.price.Text = "⭐"
				view.card.BackgroundColor3 = C.sky
			end
		end

		local rebirthCost = Rebirth.cost(rebirths, Config.Rebirth)
		local nextMultiplier = Rebirth.multiplier(rebirths + 1, Config.Rebirth.perRebirth)
		rebirthMultLabel.Text = string.format("×%s ➜ ×%s", tostring(multiplier), tostring(nextMultiplier))
		if rebirthCost then
			rebirthPriceLabel.Text = "🪙 " .. Economy.short(rebirthCost)
			rebirthCard.BackgroundColor3 = if coins >= rebirthCost then C.sky else C.grey
		else
			rebirthPriceLabel.Text = "⭐"
		end

		for _, view in eggViews do
			local open = view.egg.zone <= zones
			view.card.BackgroundColor3 = if not open then C.grey elseif coins >= view.egg.cost then C.grass else C.ice
			view.price.Text = if open
				then "🪙 " .. Economy.short(view.egg.cost)
				else "🔒 " .. Config.Zones[view.egg.zone].icon
		end

		for i, view in zoneViews do
			local zone = Config.Zones[i]
			if i <= zones then
				view.status.Text = "🚀"
				view.card.BackgroundColor3 = C.grass
			elseif i == zones + 1 then
				local need = if zone.minRebirths > rebirths then "  🔁" .. zone.minRebirths else ""
				view.status.Text = "🪙 " .. Economy.short(zone.cost) .. need
				view.card.BackgroundColor3 = if coins >= zone.cost and need == "" then C.sun else C.ice
			else
				view.status.Text = "🔒"
				view.card.BackgroundColor3 = C.grey
			end
		end

		countLabel.Text = string.format("🐧 %d/%d", attr("BuddyCount"), Config.Buddies.maxOwned)
		equippedBoostLabel.Text = "✨ +" .. percent(boost)

		dailyButton.Visible = player:GetAttribute("DailyReady") == true
		local adventDay = attr("AdventDay")
		adventButton.Visible = adventDay > 0
		local adventReady = player:GetAttribute("AdventReady") == true
		adventButton.Text = if adventReady then "🎄" .. adventDay else "🎄✅"
		adventButton.BackgroundColor3 = if adventReady then C.grass else C.grey
		for _, offer in offers do
			if offer.isPass and player:GetAttribute("Pass_" .. offer.name) == true then
				offer.priceLabel.Text = "✅"
			end
		end
	end
	player.AttributeChanged:Connect(refresh)
	refresh()

	-- avisos del servidor
	Notify.OnClientEvent:Connect(function(payload: any)
		if type(payload) == "table" then
			local kind = payload.kind
			local coins = Economy.short(tonumber(payload.coins) or 0)
			local buddy = buddyIcon(payload.s, payload.r)
			if kind == "sold" then
				show("❄️ " .. tostring(payload.snow or 0) .. " ➜ 🪙 +" .. coins, C.sun)
			elseif kind == "autosold" then
				show("🚚 ➜ 🪙 +" .. coins, C.sun)
			elseif kind == "full" then
				show("🎒 ❌  ➜  ❄️➜🪙", C.red)
			elseif kind == "locked" then
				local zone = Config.Zones[tonumber(payload.zone) or 0]
				show("🔒 " .. (if zone then zone.icon else ""), C.red)
			elseif kind == "nomoney" then
				show("🪙 ❌ " .. Economy.short(tonumber(payload.price) or 0), C.red)
			elseif kind == "need_rebirth" then
				show("🔁 " .. tostring(payload.n or 1) .. " ❌", C.red)
			elseif kind == "upgraded" then
				show("⬆️ " .. tostring(payload.level or 0), C.grass)
			elseif kind == "zone" then
				local zone = Config.Zones[tonumber(payload.zone) or 0]
				show("🔓 " .. (if zone then zone.icon else "") .. " 🎉", C.sun)
			elseif kind == "hatch" then
				show("🥚 ➜ " .. buddy, C.sun)
			elseif kind == "buddies_full" then
				show("🐧 " .. Config.Buddies.maxOwned .. "/" .. Config.Buddies.maxOwned .. " ❌", C.red)
			elseif kind == "equip_full" then
				show("✅ " .. Config.Buddies.maxEquipped .. "/" .. Config.Buddies.maxEquipped, C.red)
			elseif kind == "recycled" then
				show(buddy .. " ➜ 🪙 +" .. coins, C.sun)
			elseif kind == "max" then
				show("⭐", C.sky)
			elseif kind == "daily" then
				show(string.format("🎁 🔥%d  🪙 +%s", tonumber(payload.streak) or 1, coins), C.sun)
			elseif kind == "daily_wait" then
				show("🎁 ⏳", C.cloud)
			elseif kind == "advent" then
				local day = tostring(payload.day or 0)
				if type(payload.s) == "string" then
					show("🎄" .. day .. " ➜ " .. buddy, C.grass)
				else
					show("🎄" .. day .. " ➜ 🪙 +" .. coins, C.grass)
				end
			elseif kind == "advent_wait" then
				show("🎄 ⏳", C.cloud)
			elseif kind == "rebirth" then
				show("🔁 ×" .. tostring(payload.multiplier or 1), C.sun)
			elseif kind == "storm" then
				show("🌨️🌨️🌨️", C.ice)
			elseif kind == "lucky" then
				local refund = tonumber(payload.coins) or 0
				show("🍀 " .. buddy .. (if refund > 0 then " ➜ 🪙 +" .. Economy.short(refund) else ""), C.sun)
			elseif kind == "coinpack" then
				show("🪙 +" .. coins, C.sun)
			elseif kind == "save_warning" then
				show("⚠️ 💾", C.red)
			end
		end
	end)

	local playerGui = player:WaitForChild("PlayerGui")
	gui.Parent = playerGui

	-- tormenta: cuenta atrás (el bucle empieza con la interfaz ya puesta)
	task.spawn(function()
		while true do
			local stormUntil = Workspace:GetAttribute("StormUntil")
			local remaining = if type(stormUntil) == "number" then stormUntil - Workspace:GetServerTimeNow() else 0
			stormFrame.Visible = remaining > 0
			if remaining > 0 then
				stormLabel.Text = "🌨️ " .. clock(remaining)
			end
			task.wait(0.5)
		end
	end)
end

return Hud
