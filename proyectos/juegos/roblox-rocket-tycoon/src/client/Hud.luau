--!strict
-- Interfaz sin texto: iconos (emoji) y números. Arriba: monedas, ingresos por segundo, cristales con su
-- multiplicador, multiplicador de renacer y la cuenta atrás de la lluvia de meteoritos. A la derecha (lejos del
-- joystick del móvil) botones grandes: volver a la base, premio diario, renacer y tienda. Escala con la pantalla.
-- Lo que se muestra sale de atributos y avisos del servidor: el cliente solo pide.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Income = require(Shared:WaitForChild("Income"))
local Rebirth = require(Shared:WaitForChild("Rebirth"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local HomeRemote = Remotes:WaitForChild("Home") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

local player = Players.LocalPlayer

local C = {
	ink = Color3.fromRGB(30, 42, 58),
	sky = Color3.fromRGB(79, 179, 255),
	cloud = Color3.fromRGB(244, 250, 255),
	sun = Color3.fromRGB(255, 201, 77),
	grass = Color3.fromRGB(88, 194, 106),
	red = Color3.fromRGB(229, 75, 75),
	purple = Color3.fromRGB(150, 110, 230),
	grey = Color3.fromRGB(120, 130, 145),
}
local FONT = Enum.Font.FredokaOne
local CRYSTAL_ICONS = { "🔹", "💗", "⭐" }

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

-- ×1, ×1.5, ×2.25 (sin ceros de más)
local function multiplierText(x: number): string
	local value = string.gsub(string.format("%.2f", x), "%.?0+$", "")
	return "×" .. value
end

-- Botón que pide dos toques en 3 s (renacer). `setIcon` cambia lo que se ve: `icon` en reposo e `icon❓`
-- esperando el segundo toque.
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
	gui.Name = "RocketTycoonHud"
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
	local _, incomeLabel = pill(top, 2, 150)
	local _, crystalsLabel = pill(top, 3, 170)
	local _, rebirthLabel = pill(top, 4, 100)
	local showerFrame, showerLabel = pill(top, 5, 120)
	showerFrame.Visible = false

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
	actions.Position = UDim2.new(1, -10, 0.42, 0)
	actions.Size = UDim2.fromOffset(72, 320)
	actions.BackgroundTransparency = 1
	actions.Parent = gui
	list(actions, Enum.FillDirection.Vertical, 8)
	local function action(icon: string, color: Color3, order: number): TextButton
		local b = button(actions, icon, UDim2.fromOffset(64, 64), color)
		b.LayoutOrder = order
		return b
	end
	local homeButton = action("🏠", C.sky, 1)
	local dailyButton = action("🎁", C.red, 2)
	local rebirthButton = action("🔁", C.purple, 3)
	local shopButton = action("🛒", C.grass, 4)

	homeButton.Activated:Connect(function()
		HomeRemote:FireServer()
	end)
	dailyButton.Activated:Connect(function()
		ClaimDailyRemote:FireServer()
	end)

	-- RENACER: hace falta el Observatorio 🔭 y las monedas; dos toques
	local rebirthPanel = panel(gui, 330, 250)
	local rebirthCards = cardsArea(rebirthPanel)
	local needCard = button(rebirthCards, "", UDim2.fromOffset(130, 210), C.grey)
	needCard.LayoutOrder = 1
	needCard.AutoButtonColor = false
	text(needCard, "🔭", UDim2.fromScale(1, 0.36), UDim2.fromScale(0, 0.04))
	local needLabel = text(needCard, "🔒", UDim2.new(1, -12, 0.24, 0), UDim2.new(0, 6, 0.6, 0))
	local rebirthCard = button(rebirthCards, "", UDim2.fromOffset(150, 210), C.purple)
	rebirthCard.LayoutOrder = 2
	local rebirthIcon = text(rebirthCard, "🔁", UDim2.fromScale(1, 0.32), UDim2.fromScale(0, 0.04))
	local rebirthMultLabel = text(rebirthCard, "", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.4, 0))
	local rebirthPriceLabel = text(rebirthCard, "", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.7, 0))
	local function setRebirthIcon(value: string)
		rebirthIcon.Text = value
	end
	rebirthCard.Activated:Connect(twoTaps(setRebirthIcon, "🔁", function()
		RebirthRemote:FireServer()
	end))

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

	local panels = { rebirthPanel, shopPanel }
	local function toggle(target: Frame)
		local open = not target.Visible
		for _, p in panels do
			p.Visible = false
		end
		target.Visible = open
	end
	rebirthButton.Activated:Connect(function()
		toggle(rebirthPanel)
	end)
	shopButton.Activated:Connect(function()
		toggle(shopPanel)
	end)

	-- refresco desde los atributos del servidor
	local function refresh()
		local coins = attr("Coins")
		local rebirths = attr("Rebirths")
		coinsLabel.Text = "🪙 " .. Income.short(coins)
		incomeLabel.Text = "⚡ " .. Income.short(attr("Income")) .. "/s"
		local crystalMult = math.max(attr("CrystalMultiplier"), 1)
		crystalsLabel.Text = "💎 " .. Income.short(attr("Crystals")) .. " " .. multiplierText(crystalMult)
		local multiplier = Rebirth.multiplier(rebirths, Config.Rebirth.perRebirth)
		rebirthLabel.Text = "🔁 " .. multiplierText(multiplier)

		local unlocked = player:GetAttribute("RebirthUnlocked") == true
		needLabel.Text = if unlocked then "✅" else "🔒"
		needCard.BackgroundColor3 = if unlocked then C.grass else C.grey
		local cost = Rebirth.cost(rebirths, Config.Rebirth)
		local nextMultiplier = Rebirth.multiplier(rebirths + 1, Config.Rebirth.perRebirth)
		rebirthMultLabel.Text = multiplierText(multiplier) .. " ➜ " .. multiplierText(nextMultiplier)
		if cost then
			rebirthPriceLabel.Text = "🪙 " .. Income.short(cost)
			rebirthCard.BackgroundColor3 = if unlocked and coins >= cost then C.purple else C.grey
		else
			rebirthPriceLabel.Text = "⭐"
			rebirthCard.BackgroundColor3 = C.grey
		end
		rebirthButton.BackgroundColor3 = if unlocked then C.purple else C.grey

		dailyButton.Visible = player:GetAttribute("DailyReady") == true
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
			local coins = Income.short(tonumber(payload.coins) or 0)
			if kind == "bought" then
				show(tostring(payload.icon or "✅") .. " ✅", C.grass)
			elseif kind == "nomoney" then
				show("🪙 ❌ " .. Income.short(tonumber(payload.price) or 0), C.red)
			elseif kind == "collect" then
				show("🏦 ➜ 🪙 +" .. coins, C.sun)
			elseif kind == "crystal" then
				local icon = CRYSTAL_ICONS[tonumber(payload.crystal) or 1] or "🔹"
				show(icon .. " 💎 +" .. tostring(payload.value or 1), C.sky)
			elseif kind == "offline" then
				show("🌙 " .. clock(tonumber(payload.seconds) or 0) .. " ➜ 🏦 +" .. coins, C.sun)
			elseif kind == "daily" then
				show(string.format("🎁 🔥%d  🪙 +%s", tonumber(payload.streak) or 1, coins), C.sun)
			elseif kind == "daily_wait" then
				show("🎁 ⏳", C.cloud)
			elseif kind == "rebirth" then
				show("🔁 " .. multiplierText(tonumber(payload.multiplier) or 1) .. " 🎉", C.sun)
			elseif kind == "rebirth_ready" then
				show("🔭 ✅ ➜ 🔁", C.purple)
			elseif kind == "need_final" then
				show("🔭 🔒", C.red)
			elseif kind == "max" then
				show("⭐", C.sky)
			elseif kind == "cashpack" then
				show("🪙 +" .. coins, C.sun)
			elseif kind == "instant" then
				show("⏩ " .. tostring(payload.icon or "✅"), C.grass)
			elseif kind == "shower" then
				show("☄️☄️☄️", C.sky)
			elseif kind == "save_warning" then
				show("⚠️ 💾", C.red)
			elseif kind == "noplot" then
				show("🏠 ❌", C.red)
			end
		end
	end)

	local playerGui = player:WaitForChild("PlayerGui")
	gui.Parent = playerGui

	-- lluvia de meteoritos: cuenta atrás (el bucle empieza con la interfaz ya puesta)
	task.spawn(function()
		while true do
			local untilTime = player:GetAttribute("ShowerUntil")
			local remaining = if type(untilTime) == "number" then untilTime - Workspace:GetServerTimeNow() else 0
			showerFrame.Visible = remaining > 0
			if remaining > 0 then
				showerLabel.Text = "☄️ " .. clock(remaining)
			end
			task.wait(0.5)
		end
	end)
end

return Hud
