--!strict
-- Interfaz sin texto: iconos (emoji) y números. Monedas, ingresos por segundo, pedestales y multiplicador arriba;
-- a la derecha (lejos del joystick del móvil) botones grandes: gelatinas, candado, mejoras, premio diario y
-- tienda. Escala con la pantalla. Lo que se muestra sale de atributos y avisos del servidor: el cliente solo pide.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Economy = require(Shared:WaitForChild("Economy"))
local Pets = require(Shared:WaitForChild("Pets"))
local StealLock = require(Shared:WaitForChild("StealLock"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local FuseRemote = Remotes:WaitForChild("Fuse") :: RemoteEvent
local SellRemote = Remotes:WaitForChild("Sell") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local LockRemote = Remotes:WaitForChild("Lock") :: RemoteEvent
local UpgradeLockRemote = Remotes:WaitForChild("UpgradeLock") :: RemoteEvent
local InventoryRemote = Remotes:WaitForChild("Inventory") :: RemoteEvent
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

local Hud = {}

local speciesIcons: { [string]: string } = {}
local speciesOrder: { string } = {}
for _, def in Config.Species do
	speciesIcons[def.id] = def.icon
	table.insert(speciesOrder, def.id)
end

local function rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

local function petIcon(species: any, rarity: any): string
	local s = if type(species) == "string" then speciesIcons[species] or "🐾" else "🐾"
	local r = if type(rarity) == "number"
		then Config.Rarities[math.clamp(math.floor(rarity), 1, #Config.Rarities)]
		else nil
	return if r then r.icon .. s else s
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

local function cardsArea(frame: Frame): Frame
	local inner = Instance.new("Frame")
	inner.Name = "Cards"
	inner.BackgroundTransparency = 1
	inner.Size = UDim2.new(1, -24, 1, -24)
	inner.Position = UDim2.fromOffset(12, 12)
	inner.Parent = frame
	list(inner, Enum.FillDirection.Horizontal, 12)
	return inner
end

local function attr(name: string): number
	local value = player:GetAttribute(name)
	return if type(value) == "number" then value else 0
end

local function clock(seconds: number): string
	local s = math.max(0, math.floor(seconds))
	if s >= 3600 then
		return string.format("%d:%02d:%02d", math.floor(s / 3600), math.floor(s / 60) % 60, s % 60)
	end
	return string.format("%d:%02d", math.floor(s / 60), s % 60)
end

-- Lo que manda el servidor por Inventory → gelatinas válidas para Pets.groups.
local function toPets(payload: any): { Pets.SavedPet }
	local result: { Pets.SavedPet } = {}
	if type(payload) == "table" then
		for i, item in payload do
			if type(item) == "table" and type(item.s) == "string" and type(item.r) == "number" then
				local pad = if type(item.pad) == "number" then item.pad else nil
				table.insert(result, { id = tostring(i), s = item.s, r = item.r, pad = pad })
			end
		end
	end
	return result
end

function Hud.start()
	local gui = Instance.new("ScreenGui")
	gui.Name = "JellyPetsHud"
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
	top.Size = UDim2.fromOffset(640, 52)
	top.BackgroundTransparency = 1
	top.Parent = gui
	list(top, Enum.FillDirection.Horizontal, 8)
	local coinsLabel = pill(top, 1, 170)
	local incomeLabel = pill(top, 2, 160)
	local padsLabel = pill(top, 3, 130)
	local rebirthLabel = pill(top, 4, 120)

	-- aviso
	local toast = text(gui, "", UDim2.fromOffset(580, 54), UDim2.new(0.5, -290, 0, 66))
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

	-- llevas una gelatina: ve a casa
	local carryBanner = text(gui, "🐾 ➜ 🏠", UDim2.fromOffset(300, 60), UDim2.new(0.5, -150, 0, 120))
	carryBanner.TextColor3 = C.sun
	carryBanner.TextStrokeTransparency = 0.1
	carryBanner.TextStrokeColor3 = C.ink
	carryBanner.Visible = false

	-- columna de acciones
	local actions = Instance.new("Frame")
	actions.AnchorPoint = Vector2.new(1, 0.5)
	actions.Position = UDim2.new(1, -10, 0.47, 0)
	actions.Size = UDim2.fromOffset(84, 430)
	actions.BackgroundTransparency = 1
	actions.Parent = gui
	list(actions, Enum.FillDirection.Vertical, 10)
	local petsButton = button(actions, "🐾", UDim2.fromOffset(76, 76), C.pink)
	local lockButton = button(actions, "🔒", UDim2.fromOffset(76, 76), C.grass)
	local upgradesButton = button(actions, "⬆️", UDim2.fromOffset(76, 76), C.sun)
	local dailyButton = button(actions, "🎁", UDim2.fromOffset(76, 76), C.sky)
	local shopButton = button(actions, "🛒", UDim2.fromOffset(76, 76), C.red)
	petsButton.LayoutOrder = 1
	lockButton.LayoutOrder = 2
	upgradesButton.LayoutOrder = 3
	dailyButton.LayoutOrder = 4
	shopButton.LayoutOrder = 5

	lockButton.Activated:Connect(function()
		LockRemote:FireServer()
	end)
	dailyButton.Activated:Connect(function()
		ClaimDailyRemote:FireServer()
	end)

	-- panel de gelatinas: grupos por especie y rareza, con fusionar (3 → 1) y vender una
	local petsPanel = panel(gui, 660, 340)
	local scroll = Instance.new("ScrollingFrame")
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.Size = UDim2.new(1, -24, 1, -24)
	scroll.Position = UDim2.fromOffset(12, 12)
	scroll.ScrollBarThickness = 8
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.CanvasSize = UDim2.new()
	scroll.Parent = petsPanel
	local grid = Instance.new("UIGridLayout")
	grid.CellSize = UDim2.fromOffset(146, 150)
	grid.CellPadding = UDim2.fromOffset(10, 10)
	grid.SortOrder = Enum.SortOrder.LayoutOrder
	grid.Parent = scroll
	local emptyLabel = text(petsPanel, "🐾 0   🪙 ➜ 🫧", UDim2.new(1, -40, 0, 60), UDim2.new(0, 20, 0.5, -30))

	local function renderPets(pets: { Pets.SavedPet })
		for _, child in scroll:GetChildren() do
			if child:IsA("GuiObject") then
				child:Destroy()
			end
		end
		local groups = Pets.groups(pets, speciesOrder)
		emptyLabel.Visible = #groups == 0
		for i, group in groups do
			local def = Config.Rarities[group.r]
			local card = Instance.new("Frame")
			card.BackgroundColor3 = rgb(def.color)
			card.LayoutOrder = i
			round(card, 18)
			outline(card)
			card.Parent = scroll
			text(card, speciesIcons[group.s] or "🐾", UDim2.new(1, 0, 0.36, 0), UDim2.fromScale(0, 0.03))
			local info = text(
				card,
				string.format("%s ×%d", def.icon, group.count),
				UDim2.new(1, -12, 0.18, 0),
				UDim2.new(0, 6, 0.39, 0)
			)
			info.TextColor3 = C.ink
			local incomeText = text(
				card,
				"🪙 +" .. Economy.short(def.income) .. "/s",
				UDim2.new(1, -12, 0.15, 0),
				UDim2.new(0, 6, 0.57, 0)
			)
			incomeText.TextColor3 = C.ink
			local canFuse = group.count >= Pets.FUSE_COUNT and Pets.fuseResult(group.r, #Config.Rarities) ~= nil
			local fuse = button(card, "✨", UDim2.new(0.44, 0, 0.22, 0), if canFuse then C.sun else C.grey)
			fuse.Position = UDim2.new(0.04, 0, 0.75, 0)
			fuse.AutoButtonColor = canFuse
			local sell = button(card, "💰", UDim2.new(0.44, 0, 0.22, 0), C.grass)
			sell.Position = UDim2.new(0.52, 0, 0.75, 0)
			fuse.Activated:Connect(function()
				if canFuse then
					FuseRemote:FireServer(group.s, group.r)
				else
					show(
						string.format("✨ %s ×%d/%d", petIcon(group.s, group.r), group.count, Pets.FUSE_COUNT),
						C.cloud
					)
				end
			end)
			sell.Activated:Connect(function()
				SellRemote:FireServer(group.s, group.r)
			end)
		end
	end
	renderPets({})
	InventoryRemote.OnClientEvent:Connect(function(payload: any)
		renderPets(toPets(payload))
	end)

	-- panel de mejoras: candado y renacer (renacer pide dos toques)
	local upgradesPanel = panel(gui, 360, 220)
	local upgradeCards = cardsArea(upgradesPanel)
	local lockCard = button(upgradeCards, "", UDim2.fromOffset(150, 190), C.grass)
	lockCard.LayoutOrder = 1
	text(lockCard, "🔒⬆", UDim2.fromScale(1, 0.38), UDim2.fromScale(0, 0.04))
	local lockLevelLabel = text(lockCard, "0/10", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.44, 0))
	local lockPriceLabel = text(lockCard, "🪙 0", UDim2.new(1, -12, 0.22, 0), UDim2.new(0, 6, 0.7, 0))
	lockCard.Activated:Connect(function()
		UpgradeLockRemote:FireServer()
	end)

	local rebirthCard = button(upgradeCards, "", UDim2.fromOffset(150, 190), C.sun)
	rebirthCard.LayoutOrder = 2
	local rebirthIcon = text(rebirthCard, "🔁", UDim2.fromScale(1, 0.38), UDim2.fromScale(0, 0.04))
	local rebirthMultLabel = text(rebirthCard, "×1 ➜ ×1.5", UDim2.new(1, -12, 0.2, 0), UDim2.new(0, 6, 0.44, 0))
	local rebirthPriceLabel = text(rebirthCard, "🪙 0", UDim2.new(1, -12, 0.22, 0), UDim2.new(0, 6, 0.7, 0))
	local rebirthArmed = 0
	rebirthCard.Activated:Connect(function()
		if os.clock() - rebirthArmed < 3 then
			rebirthArmed = 0
			rebirthIcon.Text = "🔁"
			RebirthRemote:FireServer()
		else
			rebirthArmed = os.clock()
			rebirthIcon.Text = "🔁❓"
			task.delay(3, function()
				if os.clock() - rebirthArmed >= 3 then
					rebirthIcon.Text = "🔁"
				end
			end)
		end
	end)

	-- tienda (solo lo que tenga ID distinto de 0)
	local shopPanel = panel(gui, 600, 220)
	local shopCards = cardsArea(shopPanel)
	type Offer = { name: string, id: number, isPass: boolean, priceLabel: TextLabel }
	local offers: { Offer } = {}
	local order = 0
	local function addOffer(item: Config.ShopItem, isPass: boolean)
		if item.id ~= 0 then
			order += 1
			local card = button(shopCards, "", UDim2.fromOffset(104, 186), if isPass then C.sky else C.sun)
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

	local panels = { petsPanel, upgradesPanel, shopPanel }
	local function toggle(target: Frame)
		local open = not target.Visible
		for _, p in panels do
			p.Visible = false
		end
		target.Visible = open
	end
	petsButton.Activated:Connect(function()
		toggle(petsPanel)
	end)
	upgradesButton.Activated:Connect(function()
		toggle(upgradesPanel)
	end)
	shopButton.Activated:Connect(function()
		toggle(shopPanel)
	end)

	-- refresco desde los atributos del servidor
	local function refresh()
		local coins = attr("Coins")
		local rebirths = attr("Rebirths")
		coinsLabel.Text = "🪙 " .. Economy.short(coins)
		incomeLabel.Text = "📈 +" .. Economy.short(attr("Income")) .. "/s"
		padsLabel.Text = string.format("🐾 %d/%d", attr("PadsUsed"), attr("PadsTotal"))
		local multiplier = Economy.rebirthMultiplier(rebirths, Config.Income.perRebirth)
		rebirthLabel.Text = "🔁 ×" .. multiplier

		local lockLevel = attr("LockLevel")
		lockLevelLabel.Text = string.format("%d/%d", lockLevel, Config.Lock.maxLevel)
		local lockCost = StealLock.upgradeCost(lockLevel, Config.Lock)
		if lockCost then
			lockPriceLabel.Text = "🪙 " .. Economy.short(lockCost)
			lockCard.BackgroundColor3 = if coins >= lockCost then C.grass else C.grey
		else
			lockPriceLabel.Text = "⭐"
			lockCard.BackgroundColor3 = C.sky
		end

		local rebirthCost = Economy.rebirthCost(rebirths, Config.Rebirth)
		local nextMultiplier = Economy.rebirthMultiplier(rebirths + 1, Config.Income.perRebirth)
		rebirthMultLabel.Text = string.format("×%s ➜ ×%s", tostring(multiplier), tostring(nextMultiplier))
		if rebirthCost then
			rebirthPriceLabel.Text = "🪙 " .. Economy.short(rebirthCost)
			rebirthCard.BackgroundColor3 = if coins >= rebirthCost then C.sun else C.grey
		else
			rebirthPriceLabel.Text = "⭐"
			rebirthCard.BackgroundColor3 = C.sky
		end

		dailyButton.Visible = player:GetAttribute("DailyReady") == true
		carryBanner.Visible = player:GetAttribute("Carrying") == true
		for _, offer in offers do
			if offer.isPass and player:GetAttribute("Pass_" .. offer.name) == true then
				offer.priceLabel.Text = "✅"
			end
		end
	end
	player.AttributeChanged:Connect(refresh)
	refresh()

	-- 🏠 encima de tu base (solo lo ves tú) y cuenta atrás de los candados de todas las bases
	local homeMarker = Instance.new("BillboardGui")
	homeMarker.Name = "HomeMarker"
	homeMarker.Size = UDim2.fromOffset(70, 70)
	homeMarker.StudsOffsetWorldSpace = Vector3.new(0, 16, 0)
	homeMarker.AlwaysOnTop = true
	homeMarker.LightInfluence = 0
	homeMarker.MaxDistance = 400
	local homeIcon = text(homeMarker, "🏠", UDim2.fromScale(1, 1))
	homeIcon.TextStrokeTransparency = 0.3
	homeMarker.ResetOnSpawn = false

	task.spawn(function()
		while true do
			local now = Workspace:GetServerTimeNow()
			local basesFolder = Workspace:FindFirstChild("Bases")
			if basesFolder then
				for _, baseModel in basesFolder:GetChildren() do
					local button3d = baseModel:FindFirstChild("LockButton")
					local label = if button3d then button3d:FindFirstChild("LockLabel", true) else nil
					local lockedUntil = baseModel:GetAttribute("LockedUntil")
					if label and label:IsA("TextLabel") then
						local remaining = if type(lockedUntil) == "number" then lockedUntil - now else 0
						label.Text = if remaining > 0 then "🔒 " .. math.ceil(remaining) else "🔓"
					end
					if baseModel.Name == "Base" .. attr("Base") then
						local floor = baseModel:FindFirstChild("Floor")
						if floor and floor:IsA("BasePart") then
							homeMarker.Adornee = floor
						end
					end
				end
			end
			local state: StealLock.LockState = { lockedUntil = attr("LockedUntil"), readyAt = attr("LockReadyAt") }
			if StealLock.isLocked(state, now) then
				lockButton.Text = "🔒 " .. math.ceil(StealLock.remaining(state, now))
				lockButton.BackgroundColor3 = C.grass
			elseif not StealLock.canPress(state, now) then
				lockButton.Text = "⏳ " .. math.ceil(state.readyAt - now)
				lockButton.BackgroundColor3 = C.grey
			else
				lockButton.Text = "🔒"
				lockButton.BackgroundColor3 = C.sun
			end
			homeIcon.TextSize = if player:GetAttribute("Carrying") == true then 60 else 36
			task.wait(0.25)
		end
	end)

	-- avisos del servidor
	Notify.OnClientEvent:Connect(function(payload: any)
		if type(payload) ~= "table" then
			return
		end
		local kind = payload.kind
		local pet = petIcon(payload.s, payload.r)
		if kind == "bought" then
			show("🪙 ➜ " .. pet .. " 🏠", C.grass)
		elseif kind == "nomoney" then
			show("🪙 ❌ " .. Economy.short(tonumber(payload.price) or 0), C.red)
		elseif kind == "padsfull" or kind == "steal_full" then
			show("🐾 " .. attr("PadsUsed") .. "/" .. attr("PadsTotal") .. " ❌", C.red)
		elseif kind == "sold" then
			show(pet .. " ➜ 🪙 +" .. Economy.short(tonumber(payload.coins) or 0), C.sun)
		elseif kind == "fused" then
			show("✨ " .. pet .. " ✨", C.sun)
		elseif kind == "nofuse" then
			show("✨ ❌", C.red)
		elseif kind == "carry" then
			show("🐾 ➜ 🏠", C.sun)
		elseif kind == "stolen" then
			show("😱 " .. pet .. " 🏃 👆", C.red)
		elseif kind == "stole" then
			show("🎉 " .. pet .. " 🏠", C.grass)
		elseif kind == "lost" then
			show("😢 " .. pet, C.red)
		elseif kind == "tagged" then
			show("👆 " .. "🐾 ➜ 🏠", C.red)
		elseif kind == "saved" then
			show("🛡️ " .. pet .. " 🏠", C.grass)
		elseif kind == "dropped" then
			show("🐾 ⏳ 🏠", C.cloud)
		elseif kind == "steal_locked" then
			show("🔒", C.red)
		elseif kind == "steal_busy" then
			show("🐾 ⏳", C.cloud)
		elseif kind == "steal_carrying" then
			show("🐾 🏠 ⏳", C.cloud)
		elseif kind == "lock_locked" then
			show("🔒 ✅", C.grass)
		elseif kind == "lock_wait" then
			show("🔒 ⏳", C.cloud)
		elseif kind == "lock_up" then
			show("🔒 ⬆ " .. tostring(payload.level or 0), C.grass)
		elseif kind == "max" then
			show("⭐", C.sky)
		elseif kind == "daily" then
			show(
				string.format("🎁 🔥%d  🪙 +%s", payload.streak or 1, Economy.short(tonumber(payload.coins) or 0)),
				C.sun
			)
		elseif kind == "daily_wait" then
			show("🎁 ⏳", C.cloud)
		elseif kind == "rebirth" then
			show("🔁 ×" .. tostring(payload.multiplier or 1), C.sun)
		elseif kind == "offline" then
			show(
				string.format(
					"💤 %s  🪙 +%s",
					clock(tonumber(payload.seconds) or 0),
					Economy.short(tonumber(payload.coins) or 0)
				),
				C.sun
			)
		elseif kind == "lucky" then
			local coins = tonumber(payload.coins) or 0
			show("🎲 " .. pet .. (if coins > 0 then " ➜ 🪙 +" .. Economy.short(coins) else ""), C.sun)
		elseif kind == "coinpack" then
			show("🪙 +" .. Economy.short(tonumber(payload.coins) or 0), C.sun)
		elseif kind == "save_warning" then
			show("⚠️ 💾", C.red)
		end
	end)

	local playerGui = player:WaitForChild("PlayerGui")
	gui.Parent = playerGui
	homeMarker.Parent = playerGui
end

return Hud
