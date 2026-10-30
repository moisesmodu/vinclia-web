--!strict
-- Parcelas: 12 franjas en x < 0, cada una alineada con su carril de la pista. Al entrar, cada jugador recibe la
-- primera libre; al salir se libera. Cada parcela tiene plataforma de carga, caja de huevos (con ProximityPrompt),
-- poste con la foto del dueño y sitio para los gallineros (FarmService).

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local WorldBuilder = require(script.Parent.WorldBuilder)

export type Plot = {
	index: number,
	laneZ: number,
	model: Model,
	farmFolder: Folder,
	padPosition: Vector3,
	padCFrame: CFrame, -- donde aparece el camión, mirando a +X (la pista)
	spawnCFrame: CFrame, -- donde aparece el avatar
	crate: Part,
	crateLabel: TextLabel,
	prompt: ProximityPrompt,
	ownerImage: ImageLabel,
	owner: Player?,
	characterConnection: RBXScriptConnection?,
}

local PlotService = {}

local plots: { Plot } = {}
local byPlayer: { [Player]: Plot } = {}

local FACE_TRACK = CFrame.Angles(0, -math.pi / 2, 0) -- gira el -Z del modelo hacia +X

local function buildPlot(parent: Folder, index: number, halfWidth: number): Plot
	local c = WorldBuilder.Colors
	local w = Config.Track.laneWidth
	local z = -halfWidth + (index - 0.5) * w

	local model = Instance.new("Model")
	model.Name = "Plot" .. index

	WorldBuilder.anchored(
		model,
		"Base",
		Vector3.new(80, 1, w - 1),
		CFrame.new(-40, -0.45, z),
		if index % 2 == 0 then c.grass else c.grassDark,
		Enum.Material.Grass
	):AddTag("Ground")

	for _, side in { -1, 1 } do
		WorldBuilder.anchored(
			model,
			"Fence",
			Vector3.new(78, 1.4, 0.4),
			CFrame.new(-41, 0.7, z + side * (w / 2 - 0.6)),
			c.rail,
			Enum.Material.WoodPlanks
		):AddTag("Ground")
	end

	local padPosition = Vector3.new(-14, 0.1, z)
	local pad = WorldBuilder.anchored(model, "LoadingPad", Vector3.new(14, 0.2, 9), CFrame.new(padPosition), c.sky)
	pad:AddTag("Ground")

	local crate = WorldBuilder.anchored(
		model,
		"EggCrate",
		Vector3.new(3, 3, 3),
		CFrame.new(-17, 1.5, z + 7.5),
		Color3.fromRGB(196, 140, 84),
		Enum.Material.WoodPlanks
	)
	local crateLabel = WorldBuilder.billboard(crate, "🥚 0", UDim2.fromOffset(150, 50), 3.2)

	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "LoadPrompt"
	prompt.ActionText = "🥚 ➜ 🚚"
	prompt.ObjectText = ""
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 16
	prompt.RequiresLineOfSight = false
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.Enabled = false
	prompt.Parent = crate

	local post = WorldBuilder.anchored(
		model,
		"OwnerPost",
		Vector3.new(0.5, 6, 0.5),
		CFrame.new(-3, 3, z - 9),
		c.rail,
		Enum.Material.WoodPlanks
	)
	local gui = Instance.new("BillboardGui")
	gui.Name = "Owner"
	gui.Size = UDim2.fromOffset(90, 90)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 4.5, 0)
	gui.MaxDistance = 150
	gui.LightInfluence = 0
	gui.Adornee = post
	local ownerImage = Instance.new("ImageLabel")
	ownerImage.Size = UDim2.fromScale(1, 1)
	ownerImage.BackgroundColor3 = c.rail
	ownerImage.Image = ""
	ownerImage.Visible = false
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0.5, 0)
	corner.Parent = ownerImage
	ownerImage.Parent = gui
	gui.Parent = post

	local farmFolder = Instance.new("Folder")
	farmFolder.Name = "Farm"
	farmFolder.Parent = model

	model.Parent = parent

	return {
		index = index,
		laneZ = z,
		model = model,
		farmFolder = farmFolder,
		padPosition = padPosition,
		padCFrame = CFrame.new(padPosition + Vector3.new(0, 3, 0)) * FACE_TRACK,
		spawnCFrame = CFrame.new(-6, 3.5, z - 6) * FACE_TRACK,
		crate = crate,
		crateLabel = crateLabel,
		prompt = prompt,
		ownerImage = ownerImage,
		owner = nil,
		characterConnection = nil,
	}
end

function PlotService.build(halfWidth: number)
	local folder = Instance.new("Folder")
	folder.Name = "Plots"
	for i = 1, Config.MaxPlayers do
		table.insert(plots, buildPlot(folder, i, halfWidth))
	end
	folder.Parent = Workspace
end

local function placeCharacter(plot: Plot, character: Model)
	task.defer(function()
		if character.Parent then
			character:PivotTo(plot.spawnCFrame)
		end
	end)
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
			plot.prompt.Enabled = true
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

function PlotService.ownerOf(plot: Plot): Player?
	return plot.owner
end

function PlotService.release(player: Player)
	local plot = byPlayer[player]
	if not plot then
		return
	end
	byPlayer[player] = nil
	plot.owner = nil
	plot.prompt.Enabled = false
	plot.ownerImage.Visible = false
	plot.ownerImage.Image = ""
	plot.crateLabel.Text = "🥚 0"
	if plot.characterConnection then
		plot.characterConnection:Disconnect()
		plot.characterConnection = nil
	end
	plot.farmFolder:ClearAllChildren()
end

function PlotService.all(): { Plot }
	return plots
end

return PlotService
