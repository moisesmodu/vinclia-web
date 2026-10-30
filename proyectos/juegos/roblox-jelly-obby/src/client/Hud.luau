--!strict
-- Interfaz sin texto: iconos (emoji) y números. Arriba: fase (con el icono de la zona), barra de progreso de la
-- torre, monedas y trofeos con su multiplicador. A la derecha (lejos del joystick del móvil), botones grandes:
-- saltar fase (solo si el producto tiene ID), estelas, tienda de pases, premio diario y reiniciar torre (solo en la
-- cima, con dos toques). Todo sale de atributos y avisos del servidor: el cliente solo pide.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rewards = require(Shared:WaitForChild("Rewards"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RestartRemote = Remotes:WaitForChild("Restart") :: RemoteEvent
local TrailRemote = Remotes:WaitForChild("Trail") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local player = Players.LocalPlayer

local C = {
	ink = Color3.fromRGB(30, 42, 58),
	sky = Color3.fromRGB(79, 179, 255),
	cloud = Color3.fromRGB(244, 250, 255),
	sun = Color3.fromRGB(255, 201, 77),
	grass = Color3.fromRGB(88, 194, 106),
	pink = Color3.fromRGB(255, 120, 180),
	red = Color3.fromRGB(229, 75, 75),
	grey = Color3.fromRGB(120, 130, 145),
}
local FONT = Enum.Font.FredokaOne
local STAGES = Config.Tower.stages

local Hud = {}

local function rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
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

local function pill(parent: Instance, order: number, width: number): TextLabel
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromOffset(width, 48)
	frame.BackgroundColor3 = C.ink
	frame.BackgroundTransparency = 0.15
	frame.LayoutOrder = order
	round(frame, 24)
	frame.Parent = parent
	return text(frame, "", UDim2.new(1, -16, 1, -10), UDim2.fromOffset(8, 5))
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
	frame.Position = UDim2.fromScale(0.47, 0.55)
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

local function grid(frame: Frame, cell: Vector2): ScrollingFrame
	local scroll = Instance.new("ScrollingFrame")
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.Size = UDim2.new(1, -24, 1, -24)
	scroll.Position = UDim2.fromOffset(12, 12)
	scroll.ScrollBarThickness = 8
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.CanvasSize = UDim2.new()
	scroll.Parent = frame
	local layout = Instance.new("UIGridLayout")
	layout.CellSize = UDim2.fromOffset(cell.X, cell.Y)
	layout.CellPadding = UDim2.fromOffset(10, 10)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
	layout.Parent = scroll
	return scroll
end

local function attr(name: string): number
	local value = player:GetAttribute(name)
	return if type(value) == "number" then value else 0
end

local function short(n: number): string
	local v = math.floor(n)
	if v >= 1e6 then
		return string.format("%.1fM", v / 1e6)
	elseif v >= 1e4 then
		return string.format("%.1fK", v / 1e3)
	end
	return tostring(v)
end

local function ownedTrails(): { [string]: boolean }
	local owned: { [string]: boolean } = {}
	local raw = player:GetAttribute("OwnedTrails")
	if type(raw) == "string" then
		for _, id in string.split(raw, ",") do
			if id ~= "" then
				owned[id] = true
			end
		end
	end
	return owned
end

local function passId(name: string): number
	for _, item in Config.GamePasses do
		if item.name == name then
			return item.id
		end
	end
	return 0
end

local function productId(name: string): number
	for _, item in Config.Products do
		if item.name == name then
			return item.id
		end
	end
	return 0
end

type TrailCard = { def: Config.TrailDef, card: TextButton, status: TextLabel }
type Offer = { name: string, priceLabel: TextLabel }

function Hud.start()
	local gui = Instance.new("ScreenGui")
	gui.Name = "JellyTowerHud"
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
	top.Size = UDim2.fromOffset(560, 52)
	top.BackgroundTransparency = 1
	top.Parent = gui
	list(top, Enum.FillDirection.Horizontal, 8)
	local stageLabel = pill(top, 1, 190)
	local coinsLabel = pill(top, 2, 160)
	local trophyLabel = pill(top, 3, 170)

	-- progreso de la torre
	local bar = Instance.new("Frame")
	bar.AnchorPoint = Vector2.new(0.5, 0)
	bar.Position = UDim2.new(0.5, 0, 0, 62)
	bar.Size = UDim2.fromOffset(420, 14)
	bar.BackgroundColor3 = C.ink
	bar.BackgroundTransparency = 0.2
	round(bar, 7)
	bar.Parent = gui
	local fill = Instance.new("Frame")
	fill.Size = UDim2.fromScale(0, 1)
	fill.BackgroundColor3 = C.sun
	round(fill, 7)
	fill.Parent = bar

	-- aviso
	local toast = text(gui, "", UDim2.fromOffset(580, 54), UDim2.new(0.5, -290, 0, 84))
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
	actions.Size = UDim2.fromOffset(84, 430)
	actions.BackgroundTransparency = 1
	actions.Parent = gui
	list(actions, Enum.FillDirection.Vertical, 10)
	local skipButton = button(actions, "⏭️", UDim2.fromOffset(76, 76), C.pink)
	local trailsButton = button(actions, "✨", UDim2.fromOffset(76, 76), C.sky)
	local shopButton = button(actions, "🛒", UDim2.fromOffset(76, 76), C.red)
	local dailyButton = button(actions, "🎁", UDim2.fromOffset(76, 76), C.grass)
	local restartButton = button(actions, "🔁", UDim2.fromOffset(76, 76), C.sun)
	skipButton.LayoutOrder = 1
	trailsButton.LayoutOrder = 2
	shopButton.LayoutOrder = 3
	dailyButton.LayoutOrder = 4
	restartButton.LayoutOrder = 5

	local skipProduct = productId("SkipStage")
	skipButton.Activated:Connect(function()
		if skipProduct ~= 0 and attr("Stage") < STAGES then
			MarketplaceService:PromptProductPurchase(player, skipProduct)
		end
	end)
	dailyButton.Activated:Connect(function()
		ClaimDailyRemote:FireServer()
	end)

	-- reiniciar la torre: dos toques (el primero pregunta)
	local restartArmed = 0
	restartButton.Activated:Connect(function()
		if os.clock() - restartArmed < 3 then
			restartArmed = 0
			restartButton.Text = "🔁"
			RestartRemote:FireServer()
		else
			restartArmed = os.clock()
			restartButton.Text = "🔁❓"
			task.delay(3, function()
				if os.clock() - restartArmed >= 3 then
					restartButton.Text = "🔁"
				end
			end)
		end
	end)

	-- estelas: con monedas o, las especiales 👑, con el pase
	local trailPass = passId("TrailPack")
	local trailsPanel = panel(gui, 600, 330)
	local trailGrid = grid(trailsPanel, Vector2.new(130, 140))
	local trailCards: { TrailCard } = {}
	for i, def in Config.Trails do
		if not def.premium or trailPass ~= 0 then
			local card = button(trailGrid, "", UDim2.new(), C.ink)
			card.LayoutOrder = i
			local swatch = Instance.new("Frame")
			swatch.Size = UDim2.new(1, -20, 0.22, 0)
			swatch.Position = UDim2.new(0, 10, 0.5, 0)
			swatch.BackgroundColor3 = Color3.new(1, 1, 1)
			round(swatch, 8)
			swatch.Parent = card
			local keypoints: { ColorSequenceKeypoint } = {}
			for k, color in def.colors do
				local time = if #def.colors > 1 then (k - 1) / (#def.colors - 1) else 0
				table.insert(keypoints, ColorSequenceKeypoint.new(time, rgb(color)))
			end
			local gradient = Instance.new("UIGradient")
			gradient.Color = ColorSequence.new(keypoints)
			gradient.Parent = swatch
			text(card, def.icon, UDim2.new(1, 0, 0.42, 0), UDim2.fromScale(0, 0.05))
			local status = text(card, "", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.76, 0))
			card.Activated:Connect(function()
				if def.premium and player:GetAttribute("Pass_TrailPack") ~= true then
					MarketplaceService:PromptGamePassPurchase(player, trailPass)
				else
					TrailRemote:FireServer(def.id)
				end
			end)
			table.insert(trailCards, { def = def, card = card, status = status })
		end
	end

	-- tienda de pases (solo los que tengan ID distinto de 0)
	local shopPanel = panel(gui, 460, 230)
	local shopGrid = grid(shopPanel, Vector2.new(120, 190))
	local offers: { Offer } = {}
	for i, item in Config.GamePasses do
		if item.id ~= 0 then
			local card = button(shopGrid, "", UDim2.new(), C.sky)
			card.LayoutOrder = i
			text(card, item.icon, UDim2.fromScale(1, 0.5), UDim2.fromScale(0, 0.06))
			local priceLabel = text(card, "R$ …", UDim2.new(1, -10, 0.24, 0), UDim2.new(0, 5, 0.66, 0))
			card.Activated:Connect(function()
				if player:GetAttribute("Pass_" .. item.name) ~= true then
					MarketplaceService:PromptGamePassPurchase(player, item.id)
				end
			end)
			table.insert(offers, { name = item.name, priceLabel = priceLabel })
			task.spawn(function()
				local ok, info = pcall(function()
					return MarketplaceService:GetProductInfo(item.id, Enum.InfoType.GamePass)
				end)
				if ok and type(info) == "table" and type(info.PriceInRobux) == "number" then
					priceLabel.Text = "R$ " .. info.PriceInRobux
				end
			end)
		end
	end
	shopButton.Visible = #offers > 0

	local panels = { trailsPanel, shopPanel }
	local function toggle(target: Frame)
		local open = not target.Visible
		for _, p in panels do
			p.Visible = false
		end
		target.Visible = open
	end
	trailsButton.Activated:Connect(function()
		toggle(trailsPanel)
	end)
	shopButton.Activated:Connect(function()
		toggle(shopPanel)
	end)

	-- refresco desde los atributos del servidor
	local function refresh()
		local stage = math.max(1, attr("Stage"))
		local coins = attr("Coins")
		local restarts = attr("Restarts")
		local finished = stage > STAGES
		local zoneIndex = math.clamp(math.floor((stage - 1) / Config.Tower.stagesPerZone) + 1, 1, #Config.Zones)
		local zone = Config.Zones[zoneIndex]
		stageLabel.Text = if finished
			then "🏆 " .. STAGES .. "/" .. STAGES
			else string.format("%s %d/%d", zone.icon, stage, STAGES)
		coinsLabel.Text = "🪙 " .. short(coins)
		trophyLabel.Text =
			string.format("🏆 %d  ×%s", attr("Completions"), tostring(Rewards.multiplier(restarts, Config.Restart)))
		fill.Size = UDim2.fromScale(math.clamp((stage - 1) / STAGES, 0, 1), 1)
		fill.BackgroundColor3 = if finished then C.sun else rgb(zone.color)

		skipButton.Visible = skipProduct ~= 0 and stage < STAGES
		restartButton.Visible = finished
		dailyButton.Visible = player:GetAttribute("DailyReady") == true

		local owned = ownedTrails()
		local equipped = player:GetAttribute("Trail")
		local hasPass = player:GetAttribute("Pass_TrailPack") == true
		for _, entry in trailCards do
			local def = entry.def
			local action =
				Rewards.trailAction(def.price, def.premium, owned[def.id] == true, equipped == def.id, coins, hasPass)
			if action == "unequip" then
				entry.status.Text = "✅"
				entry.card.BackgroundColor3 = C.grass
			elseif action == "equip" then
				entry.status.Text = "👆"
				entry.card.BackgroundColor3 = C.sky
			elseif action == "needpass" then
				entry.status.Text = "👑"
				entry.card.BackgroundColor3 = C.pink
			elseif action == "buy" then
				entry.status.Text = "🪙 " .. short(def.price)
				entry.card.BackgroundColor3 = C.sun
			else
				entry.status.Text = "🪙 " .. short(def.price)
				entry.card.BackgroundColor3 = C.grey
			end
		end
		for _, offer in offers do
			if player:GetAttribute("Pass_" .. offer.name) == true then
				offer.priceLabel.Text = "✅"
			end
		end
	end
	player.AttributeChanged:Connect(refresh)
	refresh()

	-- avisos del servidor
	Notify.OnClientEvent:Connect(function(payload: any)
		if type(payload) ~= "table" then
			return
		end
		local kind = payload.kind
		local coins = short(tonumber(payload.coins) or 0)
		if kind == "checkpoint" then
			show(string.format("🚩 %d  🪙 +%s", tonumber(payload.stage) or 0, coins), C.grass)
		elseif kind == "finish" then
			show("🏆 🎉  🪙 +" .. coins, C.sun)
		elseif kind == "restart" then
			show("🔁 🏆 " .. tostring(payload.restarts or 0) .. "  ×" .. tostring(payload.multiplier or 1), C.sun)
		elseif kind == "skip" then
			show("⏭️ " .. tostring(payload.stage or 0), C.pink)
		elseif kind == "skip_refund" then
			show("⏭️ ➜ 🪙 +" .. coins, C.sun)
		elseif kind == "fell" then
			show("🫧 🚩", C.cloud)
		elseif kind == "nomoney" then
			show("🪙 ❌ " .. short(tonumber(payload.price) or 0), C.red)
		elseif kind == "needpass" then
			show("👑 🔒", C.red)
		elseif kind == "daily" then
			show(string.format("🎁 🔥%d  🪙 +%s", tonumber(payload.streak) or 1, coins), C.sun)
		elseif kind == "daily_wait" then
			show("🎁 ⏳", C.cloud)
		elseif kind == "save_warning" then
			show("⚠️ 💾", C.red)
		end
	end)

	gui.Parent = player:WaitForChild("PlayerGui")
end

return Hud
