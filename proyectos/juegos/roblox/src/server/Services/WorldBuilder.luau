--!strict
-- Construye el mundo al arrancar el servidor, sin mapas de Studio: suelo, pista por tramos (TrackGen) con un
-- carril por parcela, mercado, nubes Nuvolet y grupos de colisión.
--
-- Ejes del mundo: la pista avanza por +X desde x = 0 (las parcelas están en x < 0); los carriles se reparten
-- a lo largo de Z. Las piezas con la etiqueta "Ground" rompen los huevos que las tocan.

local PhysicsService = game:GetService("PhysicsService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local TrackGen = require(ReplicatedStorage.Shared.TrackGen)

export type World = {
	track: TrackGen.Track,
	halfWidth: number,
	marketStartX: number,
	marketEndX: number,
	marketTopY: number,
}

local WorldBuilder = {}

WorldBuilder.Colors = {
	grass = Color3.fromRGB(88, 194, 106), -- hierba #58C26A
	grassDark = Color3.fromRGB(74, 170, 92),
	dirt = Color3.fromRGB(156, 106, 60),
	rail = Color3.fromRGB(244, 250, 255), -- nube #F4FAFF
	market = Color3.fromRGB(255, 201, 77), -- sol #FFC94D
	sky = Color3.fromRGB(79, 179, 255), -- cielo #4FB3FF
	ink = Color3.fromRGB(30, 42, 58), -- tinta #1E2A3A
	red = Color3.fromRGB(229, 75, 75),
}

function WorldBuilder.anchored(
	parent: Instance,
	name: string,
	size: Vector3,
	cframe: CFrame,
	color: Color3,
	material: Enum.Material?
): Part
	local part = Instance.new("Part")
	part.Name = name
	part.Anchored = true
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = material or Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = parent
	return part
end

function WorldBuilder.billboard(adornee: BasePart, text: string, size: UDim2, offsetY: number): TextLabel
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = size
	gui.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	gui.MaxDistance = 250
	gui.LightInfluence = 0
	gui.Adornee = adornee
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.TextScaled = true
	label.Font = Enum.Font.FredokaOne
	label.TextColor3 = Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0.3
	label.Text = text
	label.Parent = gui
	gui.Parent = adornee
	return label
end

function WorldBuilder.setupCollisionGroups()
	for _, name in { "TruckBody", "TruckWheels", "Eggs" } do
		if not PhysicsService:IsCollisionGroupRegistered(name) then
			PhysicsService:RegisterCollisionGroup(name)
		end
	end
	PhysicsService:CollisionGroupSetCollidable("TruckBody", "TruckWheels", false)
	PhysicsService:CollisionGroupSetCollidable("TruckWheels", "TruckWheels", false)
	PhysicsService:CollisionGroupSetCollidable("TruckWheels", "Eggs", false)
end

local function buildTrack(folder: Folder, track: TrackGen.Track, width: number)
	local c = WorldBuilder.Colors
	local p = Config.Track
	local half = width / 2
	local points = track.points
	for i = 1, #points - 1 do
		local a, b = points[i], points[i + 1]
		local dx, dy = b.x - a.x, b.y - a.y
		local len = math.sqrt(dx * dx + dy * dy)
		-- marco de la superficie: X a lo largo de la pista, Y = normal, Z = a lo ancho
		local surface = CFrame.new((a.x + b.x) / 2, (a.y + b.y) / 2, 0) * CFrame.Angles(0, 0, math.atan2(dy, dx))

		local plank = WorldBuilder.anchored(
			folder,
			"Plank",
			Vector3.new(len + 0.4, p.thickness, width + 2),
			surface * CFrame.new(0, -p.thickness / 2, 0),
			if i % 2 == 0 then c.grass else c.grassDark,
			Enum.Material.Grass
		)
		plank:AddTag("Ground")

		for lane = 0, Config.MaxPlayers do
			local rail = WorldBuilder.anchored(
				folder,
				"Rail",
				Vector3.new(len + 0.4, p.railHeight, 0.6),
				surface * CFrame.new(0, p.railHeight / 2, -half + lane * p.laneWidth),
				c.rail,
				Enum.Material.WoodPlanks
			)
			rail:AddTag("Ground")
		end

		local bottom = math.min(a.y, b.y) - p.thickness
		if bottom > 0.4 then
			local support = WorldBuilder.anchored(
				folder,
				"Support",
				Vector3.new(len, bottom + 0.1, width + 2),
				CFrame.new((a.x + b.x) / 2, (bottom - 0.1) / 2, 0),
				c.dirt,
				Enum.Material.Ground
			)
			support:AddTag("Ground")
		end
	end
end

local function buildMarket(folder: Folder, startX: number, width: number): number
	local c = WorldBuilder.Colors
	local p = Config.Track
	local topY = p.minHeight
	local pad = WorldBuilder.anchored(
		folder,
		"MarketPad",
		Vector3.new(p.marketLength, 1, width + 2),
		CFrame.new(startX + p.marketLength / 2, topY - 0.5, 0),
		c.market,
		Enum.Material.SmoothPlastic
	)
	pad:AddTag("Ground")
	-- tope final y un tejado de toldo a rayas
	local back = WorldBuilder.anchored(
		folder,
		"MarketWall",
		Vector3.new(2, 6, width + 2),
		CFrame.new(startX + p.marketLength + 1, topY + 3, 0),
		c.red
	)
	back:AddTag("Ground")
	local halfZ = (width + 2) / 2
	for i = 0, 7 do
		local stripe = WorldBuilder.anchored(
			folder,
			"Awning",
			Vector3.new(10, 0.6, (width + 2) / 8),
			CFrame.new(startX + p.marketLength - 4, topY + 14, -halfZ + (i + 0.5) * (width + 2) / 8)
				* CFrame.Angles(0, 0, math.rad(-12)),
			if i % 2 == 0 then c.red else c.rail
		)
		stripe.CanCollide = false
	end
	local post = WorldBuilder.anchored(
		folder,
		"MarketSign",
		Vector3.new(1, 1, 1),
		CFrame.new(startX + p.marketLength / 2, topY + 18, 0),
		c.market
	)
	post.Transparency = 1
	post.CanCollide = false
	WorldBuilder.billboard(post, "🏪 🥚 ➜ 🪙", UDim2.fromOffset(420, 110), 0)
	return topY
end

local function buildClouds(folder: Folder, length: number, width: number)
	local rng = Random.new(7)
	for _ = 1, 14 do
		local center =
			Vector3.new(rng:NextNumber(-150, length + 100), rng:NextNumber(70, 110), rng:NextNumber(-width, width))
		for k = 0, 2 do
			local size = rng:NextNumber(14, 22)
			local puff = WorldBuilder.anchored(
				folder,
				"Cloud",
				Vector3.new(size, size, size),
				CFrame.new(center + Vector3.new((k - 1) * size * 0.7, if k == 1 then size * 0.25 else 0, 0)),
				Color3.new(1, 1, 1)
			)
			puff.Shape = Enum.PartType.Ball
			puff.CanCollide = false
			puff.CanTouch = false
			puff.CanQuery = false
			puff.CastShadow = false
		end
	end
end

function WorldBuilder.build(seed: number): World
	WorldBuilder.setupCollisionGroups()

	local p = Config.Track
	local width = p.laneWidth * Config.MaxPlayers
	local track = TrackGen.generate(seed, p)
	Workspace:SetAttribute("TrackSeed", seed)
	Workspace:SetAttribute("TrackLength", track.length)

	local root = Instance.new("Folder")
	root.Name = "World"

	local ground = WorldBuilder.anchored(
		root,
		"Ground",
		Vector3.new(track.length + p.marketLength + 400, 1, width + 260),
		CFrame.new((track.length + p.marketLength) / 2, -0.6, 0),
		WorldBuilder.Colors.grass,
		Enum.Material.Grass
	)
	ground:AddTag("Ground")

	local trackFolder = Instance.new("Folder")
	trackFolder.Name = "Track"
	trackFolder.Parent = root
	buildTrack(trackFolder, track, width)

	local marketFolder = Instance.new("Folder")
	marketFolder.Name = "Market"
	marketFolder.Parent = root
	local marketTopY = buildMarket(marketFolder, track.length, width)

	local sky = Instance.new("Folder")
	sky.Name = "Clouds"
	sky.Parent = root
	buildClouds(sky, track.length, width)

	local lobby = Instance.new("SpawnLocation")
	lobby.Name = "Lobby"
	lobby.Anchored = true
	lobby.Size = Vector3.new(12, 1, 12)
	lobby.CFrame = CFrame.new(-100, 0, 0)
	lobby.Color = WorldBuilder.Colors.sky
	lobby.Duration = 0
	lobby.Neutral = true
	lobby.Parent = root

	root.Parent = Workspace

	return {
		track = track,
		halfWidth = width / 2,
		marketStartX = track.length,
		marketEndX = track.length + p.marketLength,
		marketTopY = marketTopY,
	}
end

return WorldBuilder
