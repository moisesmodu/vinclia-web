--!strict
-- Parcelas: 8 bases lunares a los lados de la avenida (Layout.plotCenter). Al entrar, cada jugador recibe la
-- primera libre; al salir se libera. Cada parcela trae lo fijo: suelo, cinta, refinería, baldosa de la caja
-- (🏦), cartel con la foto del dueño y carpetas para lo que se compra, las baldosas de compra y los cristales.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Layout = require(ReplicatedStorage.Shared.Layout)
local WorldBuilder = require(script.Parent.WorldBuilder)

export type Plot = {
	index: number,
	origin: CFrame,
	model: Model,
	items: Folder,
	pads: Folder,
	crystals: Folder,
	vaultPad: Part,
	vaultLabel: TextLabel,
	ownerImage: ImageLabel,
	owner: Player?,
	characterConnection: RBXScriptConnection?,
}

local PlotService = {}

local plots: { Plot } = {}
local byPlayer: { [Player]: Plot } = {}

local C = WorldBuilder.Colors
local ACCENTS = { C.sky, C.sun, C.grass, C.purple, C.red, C.sky, C.sun, C.grass }

function PlotService.cf(plot: Plot, x: number, y: number, z: number): CFrame
	return plot.origin * CFrame.new(x, y, z)
end

function PlotService.point(plot: Plot, x: number, y: number, z: number): Vector3
	return plot.origin:PointToWorldSpace(Vector3.new(x, y, z))
end

local function folder(parent: Instance, name: string): Folder
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

local function buildBelt(model: Model, origin: CFrame)
	local b = Config.Plot.belt
	local length = b.x1 - b.x0
	local mid = (b.x0 + b.x1) / 2
	local belt = WorldBuilder.part(
		model,
		"Belt",
		Vector3.new(length, b.height, b.width),
		origin * CFrame.new(mid, b.height / 2, b.z),
		C.ink,
		Enum.Material.Fabric
	)
	belt:AddTag("Ground")
	for _, side in { -1, 1 } do
		WorldBuilder.part(
			model,
			"Rail",
			Vector3.new(length, b.height + 0.6, 0.6),
			origin * CFrame.new(mid, (b.height + 0.6) / 2, b.z + side * (b.width / 2 + 0.3)),
			C.metal,
			Enum.Material.DiamondPlate
		)
	end
	-- flechas de neón que marcan hacia dónde va la roca
	local x = b.x0 + 3
	while x < b.x1 - 2 do
		local arrow = WorldBuilder.part(
			model,
			"Arrow",
			Vector3.new(0.6, 0.1, b.width * 0.5),
			origin * CFrame.new(x, b.height + 0.05, b.z),
			C.sky,
			Enum.Material.Neon
		)
		arrow.CanCollide = false
		x += 6
	end
end

local function buildRefinery(model: Model, origin: CFrame)
	local r = Config.Plot.refinery
	local h = 12
	local body = WorldBuilder.part(
		model,
		"Refinery",
		Vector3.new(r.size, h, r.size),
		origin * CFrame.new(r.x, h / 2, r.z),
		C.metal,
		Enum.Material.DiamondPlate
	)
	-- boca por donde entra la roca (mira a la cinta, -X)
	WorldBuilder.part(
		model,
		"Intake",
		Vector3.new(0.4, 4, Config.Plot.belt.width + 1),
		origin * CFrame.new(r.x - r.size / 2 - 0.1, 2.6, r.z),
		C.ink
	)
	local roof = WorldBuilder.part(
		model,
		"RefineryRoof",
		Vector3.new(r.size + 1, 1, r.size + 1),
		origin * CFrame.new(r.x, h + 0.5, r.z),
		C.sun
	)
	roof.Material = Enum.Material.SmoothPlastic
	for i, dx in { -3, 3 } do
		local chimney =
			WorldBuilder.column(model, "Chimney", 5 + i, 2.4, origin * CFrame.new(r.x + dx, h + 1, r.z - 3), C.cloud)
		chimney.Material = Enum.Material.SmoothPlastic
	end
	local light = WorldBuilder.part(
		model,
		"RefineryLight",
		Vector3.new(r.size + 0.2, 0.8, r.size + 0.2),
		origin * CFrame.new(r.x, h - 1.5, r.z),
		C.sky,
		Enum.Material.Neon
	)
	light.CanCollide = false
	WorldBuilder.billboard(body, "🪙", UDim2.fromOffset(70, 70), h / 2 + 4)
end

local function buildPlot(parent: Folder, index: number): Plot
	local p = Config.Plot
	local cx, cz, yaw = Layout.plotCenter(index, Config.MaxPlayers, p)
	local origin = CFrame.new(cx, 0, cz) * CFrame.Angles(0, yaw, 0)
	local accent = ACCENTS[(index - 1) % #ACCENTS + 1]

	local model = Instance.new("Model")
	model.Name = "Plot" .. index
	model:SetAttribute("Index", index)
	model:SetAttribute("Origin", origin)
	model:SetAttribute("Owner", 0)

	local floor = WorldBuilder.part(
		model,
		"Floor",
		Vector3.new(p.size, 0.4, p.size),
		origin * CFrame.new(0, 0.2, 0),
		if index % 2 == 0 then Color3.fromRGB(214, 214, 228) else Color3.fromRGB(206, 210, 226),
		Enum.Material.Concrete
	)
	floor:AddTag("Ground")
	-- borde de neón del color de la parcela
	local half = p.size / 2
	for _, edge in
		{
			{ Vector3.new(p.size, 0.2, 0.8), Vector3.new(0, 0.5, half - 0.4) },
			{ Vector3.new(p.size, 0.2, 0.8), Vector3.new(0, 0.5, -half + 0.4) },
			{ Vector3.new(0.8, 0.2, p.size), Vector3.new(half - 0.4, 0.5, 0) },
			{ Vector3.new(0.8, 0.2, p.size), Vector3.new(-half + 0.4, 0.5, 0) },
		}
	do
		local strip =
			WorldBuilder.part(model, "Edge", edge[1], origin * CFrame.new(edge[2]), accent, Enum.Material.Neon)
		strip.CanCollide = false
	end

	buildBelt(model, origin)
	buildRefinery(model, origin)

	local vaultPad = WorldBuilder.part(
		model,
		"VaultPad",
		Vector3.new(p.vault.size, 0.4, p.vault.size),
		origin * CFrame.new(p.vault.x, 0.6, p.vault.z),
		C.sun,
		Enum.Material.Neon
	)
	local vaultLabel = WorldBuilder.billboard(vaultPad, "🏦 0", UDim2.fromOffset(170, 56), 4)

	-- cartel con la foto del dueño
	local post = WorldBuilder.part(
		model,
		"OwnerPost",
		Vector3.new(0.8, 8, 0.8),
		origin * CFrame.new(p.sign[1], 4, p.sign[2]),
		C.metal,
		Enum.Material.DiamondPlate
	)
	local gui = Instance.new("BillboardGui")
	gui.Name = "Owner"
	gui.Size = UDim2.fromOffset(100, 100)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 6, 0)
	gui.MaxDistance = 180
	gui.LightInfluence = 0
	gui.Adornee = post
	local ownerImage = Instance.new("ImageLabel")
	ownerImage.Size = UDim2.fromScale(1, 1)
	ownerImage.BackgroundColor3 = accent
	ownerImage.Image = ""
	ownerImage.Visible = false
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0.5, 0)
	corner.Parent = ownerImage
	ownerImage.Parent = gui
	gui.Parent = post

	local items = folder(model, "Items")
	local pads = folder(model, "Pads")
	local crystals = folder(model, "Crystals")
	model.Parent = parent

	return {
		index = index,
		origin = origin,
		model = model,
		items = items,
		pads = pads,
		crystals = crystals,
		vaultPad = vaultPad,
		vaultLabel = vaultLabel,
		ownerImage = ownerImage,
		owner = nil,
		characterConnection = nil,
	}
end

function PlotService.build()
	local f = Instance.new("Folder")
	f.Name = "Plots"
	for i = 1, Config.MaxPlayers do
		table.insert(plots, buildPlot(f, i))
	end
	f.Parent = Workspace
end

function PlotService.spawnCFrame(plot: Plot): CFrame
	return PlotService.cf(plot, Config.Plot.spawn[1], 3.5, Config.Plot.spawn[2])
end

local function placeCharacter(plot: Plot, character: Model)
	task.defer(function()
		if character.Parent then
			character:PivotTo(PlotService.spawnCFrame(plot))
		end
	end)
end

-- Lleva al jugador a su base (botón 🏠 y al aparecer).
function PlotService.sendHome(player: Player)
	local plot = byPlayer[player]
	local character = player.Character
	if plot and character then
		placeCharacter(plot, character)
	end
end

function PlotService.assign(player: Player): Plot?
	local existing = byPlayer[player]
	if existing then
		return existing
	end
	for _, plot in plots do
		if plot.owner == nil then
			plot.owner = player
			byPlayer[player] = plot
			plot.model:SetAttribute("Owner", player.UserId)
			player:SetAttribute("Plot", plot.index)

			task.spawn(function()
				local ok, image = pcall(function()
					return Players:GetUserThumbnailAsync(
						player.UserId,
						Enum.ThumbnailType.HeadShot,
						Enum.ThumbnailSize.Size100x100
					)
				end)
				if ok and plot.owner == player then
					plot.ownerImage.Image = image
					plot.ownerImage.Visible = true
				end
			end)

			plot.characterConnection = player.CharacterAdded:Connect(function(character)
				placeCharacter(plot, character)
			end)
			if player.Character then
				placeCharacter(plot, player.Character)
			end
			return plot
		end
	end
	return nil
end

function PlotService.get(player: Player): Plot?
	return byPlayer[player]
end

function PlotService.release(player: Player)
	local plot = byPlayer[player]
	if plot then
		byPlayer[player] = nil
		plot.owner = nil
		plot.model:SetAttribute("Owner", 0)
		plot.ownerImage.Visible = false
		plot.ownerImage.Image = ""
		plot.vaultLabel.Text = "🏦 0"
		local connection = plot.characterConnection
		if connection then
			connection:Disconnect()
			plot.characterConnection = nil
		end
		plot.items:ClearAllChildren()
		plot.pads:ClearAllChildren()
		plot.crystals:ClearAllChildren()
	end
end

function PlotService.all(): { Plot }
	return plots
end

-- Parcela a la que pertenece una pieza (o nil).
function PlotService.fromPart(part: Instance): Plot?
	for _, plot in plots do
		if part:IsDescendantOf(plot.model) then
			return plot
		end
	end
	return nil
end

return PlotService
