--!strict
-- Interfaz sin texto: iconos (emoji) y números. Monedas, huevos en la caja, huevos en la granja (y raros), carrera,
-- evento de fin de semana, botones grandes (cargar, reiniciar, mejoras, pinturas, tienda) y avisos breves.
-- Escala con la pantalla (móvil incluido).
-- Todo lo que se muestra sale de atributos que pone el servidor; el cliente solo pide, nunca decide.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local BuyUpgrade = Remotes:WaitForChild("BuyUpgrade") :: RemoteEvent
local LoadEggs = Remotes:WaitForChild("LoadEggs") :: RemoteEvent
local ResetTruck = Remotes:WaitForChild("ResetTruck") :: RemoteEvent
local PaintAction = Remotes:WaitForChild("PaintAction") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local player = Players.LocalPlayer

local C = {
	ink = Color3.fromRGB(30, 42, 58),
	sky = Color3.fromRGB(79, 179, 255),
	cloud = Color3.fromRGB(244, 250, 255),
	sun = Color3.fromRGB(255, 201, 77),
	grass = Color3.fromRGB(88, 194, 106),
	red = Color3.fromRGB(229, 75, 75),
	grey = Color3.fromRGB(120, 130, 145),
}
local FONT = Enum.Font.FredokaOne

local Hud = {}

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

local function pill(parent: Instance, order: number): (TextLabel, Frame)
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromOffset(150, 48)
	frame.BackgroundColor3 = C.ink
	frame.BackgroundTransparency = 0.15
	frame.LayoutOrder = order
	round(frame, 24)
	frame.Parent = parent
	local label = text(frame, "", UDim2.new(1, -16, 1, -10), UDim2.fromOffset(8, 5))
	return label, frame
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

-- Devuelve el panel y el contenedor de tarjetas.
local function panel(parent: Instance, width: number, height: number): (Frame, Frame)
	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 0.5)
	frame.Position = UDim2.fromScale(0.5, 0.55)
	frame.Size = UDim2.fromOffset(width, height)
	frame.BackgroundColor3 = C.ink
	frame.BackgroundTransparency = 0.1
	frame.Visible = false
	round(frame, 24)
	frame.Parent = parent
	local inner = Instance.new("Frame")
	inner.Name = "Cards"
	inner.BackgroundTransparency = 1
	inner.Size = UDim2.new(1, -24, 1, -24)
	inner.Position = UDim2.fromOffset(12, 12)
	inner.Parent = frame
	list(inner, Enum.FillDirection.Horizontal, 10)
	return frame, inner
end

local function attr(name: string): number
	local value = player:GetAttribute(name)
	return if type(value) == "number" then value else 0
end

local function clock(seconds: number): string
	local s = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", math.floor(s / 60), s % 60)
end

-- Cuenta atrás larga (horas:minutos:segundos) para el evento de fin de semana.
local function longClock(seconds: number): string
	local s = math.max(0, math.floor(seconds))
	return string.format("%d:%02d:%02d", math.floor(s / 3600), math.floor(s / 60) % 60, s % 60)
end

local function rarityIcon(tier: any): string
	local def = if type(tier) == "number" then Config.RarityTiers[tier] else nil
	return if def then def.icon else "✨"
end

function Hud.start()
	local gui = Instance.new("ScreenGui")
	gui.Name = "EggTruckHud"
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
	if Workspace.CurrentCamera then
		Workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	end

	-- barra superior
	local top = Instance.new("Frame")
	top.AnchorPoint = Vector2.new(0.5, 0)
	top.Position = UDim2.new(0.5, 0, 0, 6)
	top.Size = UDim2.fromOffset(880, 52)
	top.BackgroundTransparency = 1
	top.Parent = gui
	list(top, Enum.FillDirection.Horizontal, 8)
	local coinsLabel = pill(top, 1)
	local bedLabel = pill(top, 2)
	local farmLabel = pill(top, 3)
	local raceLabel, raceFrame = pill(top, 4)
	raceFrame.Size = UDim2.fromOffset(180, 48)
	local eventLabel, eventFrame = pill(top, 5)
	eventFrame.Size = UDim2.fromOffset(210, 48)

	-- aviso
	local toast = text(gui, "", UDim2.fromOffset(560, 54), UDim2.new(0.5, -280, 0, 66))
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
			if token ~= toastToken then
				return
			end
			local fade = TweenService:Create(toast, TweenInfo.new(0.4), { TextTransparency = 1 })
			fade:Play()
			fade.Completed:Wait()
			if token == toastToken then
				toast.Visible = false
			end
		end)
	end

	-- columna de acciones (a la derecha, lejos del joystick del móvil)
	local actions = Instance.new("Frame")
	actions.AnchorPoint = Vector2.new(1, 0.5)
	actions.Position = UDim2.new(1, -10, 0.45, 0)
	actions.Size = UDim2.fromOffset(84, 430)
	actions.BackgroundTransparency = 1
	actions.Parent = gui
	list(actions, Enum.FillDirection.Vertical, 10)
	local loadButton = button(actions, "🥚⬆", UDim2.fromOffset(76, 76), C.grass)
	local resetButton = button(actions, "🔄", UDim2.fromOffset(76, 76), C.sky)
	local upgradesButton = button(actions, "⬆️", UDim2.fromOffset(76, 76), C.sun)
	local paintButton = button(actions, "🎨", UDim2.fromOffset(76, 76), C.grass)
	local shopButton = button(actions, "🛒", UDim2.fromOffset(76, 76), C.red)
	loadButton.LayoutOrder, resetButton.LayoutOrder, upgradesButton.LayoutOrder = 1, 2, 3
	paintButton.LayoutOrder, shopButton.LayoutOrder = 4, 5

	loadButton.Activated:Connect(function()
		LoadEggs:FireServer()
	end)
	resetButton.Activated:Connect(function()
		ResetTruck:FireServer()
	end)

	-- panel de mejoras
	local upgrades, upgradeCards = panel(gui, 744, 210)
	type Card = { id: string, levelLabel: TextLabel, priceLabel: TextLabel, button: TextButton }
	local cards: { Card } = {}
	for i, id in Config.UpgradeOrder do
		local def = (Config.Upgrades :: any)[id] :: Config.UpgradeDef
		local card = button(upgradeCards, "", UDim2.fromOffset(134, 186), C.grass)
		card.LayoutOrder = i
		text(card, def.icon, UDim2.fromScale(1, 0.45), UDim2.fromScale(0, 0.04))
		local levelLabel = text(card, "0/10", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.48, 0))
		local priceLabel = text(card, "🪙 0", UDim2.new(1, -12, 0.22, 0), UDim2.new(0, 6, 0.72, 0))
		card.Activated:Connect(function()
			BuyUpgrade:FireServer(id)
		end)
		table.insert(cards, { id = id, levelLabel = levelLabel, priceLabel = priceLabel, button = card })
	end

	-- tienda (solo lo que tenga ID distinto de 0)
	local shop, shopCards = panel(gui, 600, 210)
	type Offer = { name: string, id: number, isPass: boolean, priceLabel: TextLabel }
	local offers: { Offer } = {}
	local order = 0
	local function addOffer(name: string, id: number, icon: string, isPass: boolean)
		if id == 0 then
			return
		end
		order += 1
		local card = button(shopCards, "", UDim2.fromOffset(104, 186), if isPass then C.sky else C.sun)
		card.LayoutOrder = order
		text(card, icon, UDim2.fromScale(1, 0.5), UDim2.fromScale(0, 0.06))
		local priceLabel = text(card, "R$ …", UDim2.new(1, -10, 0.24, 0), UDim2.new(0, 5, 0.66, 0))
		card.Activated:Connect(function()
			if isPass then
				if player:GetAttribute("Pass_" .. name) ~= true then
					MarketplaceService:PromptGamePassPurchase(player, id)
				end
			else
				MarketplaceService:PromptProductPurchase(player, id)
			end
		end)
		table.insert(offers, { name = name, id = id, isPass = isPass, priceLabel = priceLabel })
		task.spawn(function()
			local ok, info = pcall(function()
				return MarketplaceService:GetProductInfo(
					id,
					if isPass then Enum.InfoType.GamePass else Enum.InfoType.Product
				)
			end)
			if ok and type(info) == "table" and type(info.PriceInRobux) == "number" then
				priceLabel.Text = "R$ " .. info.PriceInRobux
			end
		end)
	end
	for _, name in { "DoubleCash", "BigTruck", "SecondFarm" } do
		addOffer(name, (Config.GamePasses :: any)[name], (Config.PassIcons :: any)[name], true)
	end
	for _, name in { "GoldenEgg", "InstantRepair" } do
		addOffer(name, (Config.Products :: any)[name], (Config.ProductIcons :: any)[name], false)
	end
	shopButton.Visible = #offers > 0

	-- pinturas del camión: muestra de color, icono y precio (🪙), ✅ si es la puesta, 🎉 meta del evento
	local paints, paintCards = panel(gui, 700, 210)
	type PaintCard = { id: string, statusLabel: TextLabel, button: TextButton }
	local paintList: { PaintCard } = {}
	for i, id in Config.PaintOrder do
		local def = Config.Paints[id]
		local card = button(paintCards, "", UDim2.fromOffset(100, 186), C.grey)
		card.LayoutOrder = i
		local swatch = Instance.new("Frame")
		swatch.Size = UDim2.new(1, -24, 0.34, 0)
		swatch.Position = UDim2.new(0, 12, 0.08, 0)
		swatch.BackgroundColor3 = Color3.fromRGB(def.rgb[1], def.rgb[2], def.rgb[3])
		round(swatch, 12)
		outline(swatch)
		swatch.Parent = card
		text(card, def.icon, UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.46, 0))
		local statusLabel = text(card, "", UDim2.new(1, -10, 0.22, 0), UDim2.new(0, 5, 0.7, 0))
		card.Activated:Connect(function()
			PaintAction:FireServer(id)
		end)
		table.insert(paintList, { id = id, statusLabel = statusLabel, button = card })
	end

	local panels = { upgrades, shop, paints }
	local function toggle(target: Frame)
		local open = not target.Visible
		for _, frame in panels do
			frame.Visible = false
		end
		target.Visible = open
	end
	upgradesButton.Activated:Connect(function()
		toggle(upgrades)
	end)
	shopButton.Activated:Connect(function()
		toggle(shop)
	end)
	paintButton.Activated:Connect(function()
		toggle(paints)
	end)

	local function eventEggs(): number
		local week = Workspace:GetAttribute("EventWeek")
		return if player:GetAttribute("EventWeek") == week then attr("EventEggs") else 0
	end
	local function eventGoal(): number
		local goal = Workspace:GetAttribute("EventGoal")
		return if type(goal) == "number" then goal else Config.Event.eggsGoal
	end

	-- refresco desde los atributos del servidor
	local lastBroken = 0
	local function refresh()
		local coins = attr("Coins")
		coinsLabel.Text = "🪙 " .. Economy.short(coins)
		bedLabel.Text = string.format("🚚 🥚%d/%d", attr("EggsInBed"), attr("Capacity"))
		local farmText = string.format("🐔 🥚%d/%d", attr("FarmStored"), attr("FarmCapacity"))
		if attr("FarmRare") > 0 then
			farmText ..= string.format(" ✨%d", attr("FarmRare"))
		end
		if attr("LuckUntil") > Workspace:GetServerTimeNow() then
			farmText ..= " 🍀"
		end
		farmLabel.Text = farmText
		for _, card in cards do
			local def = (Config.Upgrades :: any)[card.id] :: Config.UpgradeDef
			local level = attr("Lvl_" .. card.id)
			local cost = Economy.upgradeCost(def, level)
			card.levelLabel.Text = string.format("%d/%d", level, def.maxLevel)
			if cost == nil then
				card.priceLabel.Text = "⭐"
				card.button.BackgroundColor3 = C.sky
			else
				card.priceLabel.Text = "🪙 " .. Economy.short(cost)
				card.button.BackgroundColor3 = if coins >= cost then C.grass else C.grey
			end
		end
		local equipped = player:GetAttribute("PaintEquipped")
		for _, paintCard in paintList do
			local def = Config.Paints[paintCard.id]
			local owned = player:GetAttribute("Paint_" .. paintCard.id) == true
			if equipped == paintCard.id then
				paintCard.statusLabel.Text = "✅"
				paintCard.button.BackgroundColor3 = C.sky
			elseif owned then
				paintCard.statusLabel.Text = "🎨"
				paintCard.button.BackgroundColor3 = C.grass
			elseif def.event then
				paintCard.statusLabel.Text = string.format("🥚%d/%d", math.min(eventEggs(), eventGoal()), eventGoal())
				paintCard.button.BackgroundColor3 = C.grey
			else
				paintCard.statusLabel.Text = "🪙 " .. Economy.short(def.cost)
				paintCard.button.BackgroundColor3 = if coins >= def.cost then C.sun else C.grey
			end
		end
		for _, offer in offers do
			if offer.isPass and player:GetAttribute("Pass_" .. offer.name) == true then
				offer.priceLabel.Text = "✅"
			end
		end
		local broken = attr("EggsBroken")
		if broken > lastBroken then
			show("💥🥚", C.sun)
		end
		lastBroken = broken
	end
	player.AttributeChanged:Connect(refresh)
	refresh()

	-- carrera: cuenta atrás
	task.spawn(function()
		while gui.Parent do
			local state = Workspace:GetAttribute("RaceState")
			local at = Workspace:GetAttribute("RaceAt")
			local remaining = if type(at) == "number" then at - Workspace:GetServerTimeNow() else 0
			if state == "running" then
				raceLabel.Text = string.format("🏁 %s 🥚%d", clock(remaining), attr("RaceEggs"))
				raceLabel.TextColor3 = C.sun
			else
				raceLabel.Text = "🏁 ⏳ " .. clock(remaining)
				raceLabel.TextColor3 = C.cloud
			end
			-- evento de fin de semana: tiempo que queda y huevos hacia la pintura (o tiempo hasta que empiece)
			local now = Workspace:GetServerTimeNow()
			local startsAt = Workspace:GetAttribute("EventStartsAt")
			local endsAt = Workspace:GetAttribute("EventEndsAt")
			if Workspace:GetAttribute("EventActive") == true and type(endsAt) == "number" then
				local prize = if player:GetAttribute("Paint_" .. Config.Event.paint) == true
					then "✅"
					else string.format("🥚%d/%d", math.min(eventEggs(), eventGoal()), eventGoal())
				eventLabel.Text = string.format("🎉 %s %s", longClock(endsAt - now), prize)
				eventLabel.TextColor3 = C.sun
			elseif type(startsAt) == "number" then
				eventLabel.Text = "🎉 ⏳ " .. longClock(startsAt - now)
				eventLabel.TextColor3 = C.cloud
			end
			task.wait(0.25)
		end
	end)

	-- avisos del servidor
	Notify.OnClientEvent:Connect(function(payload: any)
		if type(payload) ~= "table" then
			return
		end
		local kind = payload.kind
		if kind == "delivery" then
			local coins = tonumber(payload.coins) or 0
			local rare = tonumber(payload.rare) or 0
			show(
				string.format(
					"🏪 +%s 🪙   🥚%d  💥%d%s",
					Economy.short(coins),
					payload.intact or 0,
					payload.broken or 0,
					if rare > 0 then string.format("  ✨%d", rare) else ""
				),
				C.sun
			)
		elseif kind == "rare_egg" then
			show(rarityIcon(payload.tier) .. "🥚 ✨", C.sun)
		elseif kind == "daily" then
			show(
				string.format(
					"📅 🔥%d  +%s 🪙",
					tonumber(payload.streak) or 1,
					Economy.short(tonumber(payload.coins) or 0)
				),
				C.sun
			)
		elseif kind == "paint" then
			local def = if type(payload.id) == "string" then Config.Paints[payload.id] else nil
			show((if def then def.icon else "🎨") .. " 🚚 ✅", C.grass)
		elseif kind == "event_locked" then
			show("🎉 🔒 🥚", C.sky)
		elseif kind == "event_paint" then
			show("🎉 🏆 " .. Config.Paints[Config.Event.paint].icon .. " 🚚", C.sun)
		elseif kind == "loaded" then
			show(string.format("🥚 +%d 🚚", payload.n or 0), C.grass)
		elseif kind == "nomoney" then
			show("🪙 ❌", C.red)
		elseif kind == "max" then
			show("⭐", C.sky)
		elseif kind == "upgrade" then
			local def = (Config.Upgrades :: any)[payload.id]
			show(string.format("%s ⬆ %d", if def then def.icon else "⬆", payload.level or 0), C.grass)
		elseif kind == "farm_empty" then
			show("🐔 ⏳", C.cloud)
		elseif kind == "truck_full" then
			show("🚚 ✅", C.cloud)
		elseif kind == "too_far" then
			show("🚚 ➜ 🟦", C.sky)
		elseif kind == "repaired" then
			show(string.format("🔧 🥚%d", payload.n or 0), C.grass)
		elseif kind == "golden" then
			show(string.format("🌟 +%s 🪙  🍀", Economy.short(tonumber(payload.coins) or 0)), C.sun)
		elseif kind == "race_start" then
			show("🏁 🥚🥚🥚 " .. clock(tonumber(payload.duration) or 0), C.sun)
		elseif kind == "race_end" then
			local winners = if type(payload.winners) == "table" then payload.winners else {}
			if table.find(winners, player.UserId) then
				show(string.format("🏆 +%s 🪙", Economy.short(tonumber(payload.bonus) or 0)), C.sun)
			else
				show(string.format("🏁 🏆 🥚%d", payload.eggs or 0), C.cloud)
			end
		elseif kind == "save_warning" then
			show("⚠️ 💾", C.red)
		end
	end)

	gui.Parent = player:WaitForChild("PlayerGui")
end

return Hud
