--!strict
-- Construye el mundo al arrancar el servidor, sin mapas de Studio: suelo, cinta central con sus dos nubes Nuvolet
-- (la que «suelta» gelatinas y la que se las traga), árboles de caramelo y nubes en el cielo.
--
-- Ejes: la cinta va por el eje X (de -length/2 a +length/2, en z = 0). Las bases están a los dos lados
-- (z > 0 y z < 0; ver BaseService).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

export type World = {
	conveyorStart: Vector3, -- encima de la cinta, donde aparecen las gelatinas
	conveyorEnd: Vector3,
	petsFolder: Folder, -- gelatinas de las bases
	conveyorFolder: Folder, -- gelatinas de la cinta
}

local WorldBuilder = {}

WorldBuilder.Colors = {
	sky = Color3.fromRGB(79, 179, 255), -- cielo #4FB3FF
	ink = Color3.fromRGB(30, 42, 58), -- tinta #1E2A3A
	cloud = Color3.fromRGB(244, 250, 255), -- nube #F4FAFF
	sun = Color3.fromRGB(255, 201, 77), -- sol #FFC94D
	grass = Color3.fromRGB(88, 194, 106), -- hierba #58C26A
	grassDark = Color3.fromRGB(74, 170, 92),
	pink = Color3.fromRGB(255, 150, 190),
	red = Color3.fromRGB(229, 75, 75),
	grey = Color3.fromRGB(160, 170, 185),
}

WorldBuilder.BELT_TOP = 1 -- altura de la superficie de la cinta

function WorldBuilder.rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

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

-- Bola (Part con malla esférica: admite tamaños no uniformes).
function WorldBuilder.ball(parent: Instance, name: string, size: Vector3, cframe: CFrame, color: Color3): Part
	local part = WorldBuilder.anchored(parent, name, size, cframe, color)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = part
	return part
end

function WorldBuilder.billboard(adornee: BasePart, text: string, size: UDim2, offsetY: number): TextLabel
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = size
	gui.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	gui.MaxDistance = 120
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

-- Nube Nuvolet: bolas blancas y, si `face`, ojos y sonrisa mirando hacia `lookAt`.
local function cloud(parent: Instance, center: Vector3, scale: number, face: boolean, lookAt: Vector3?)
	local model = Instance.new("Model")
	model.Name = "Cloud"
	local c = WorldBuilder.Colors
	local puffs = {
		{ 0, 0, 0, 1.0 },
		{ -0.9, -0.25, 0.1, 0.75 },
		{ 0.9, -0.25, -0.1, 0.75 },
		{ -0.45, 0.4, 0.2, 0.7 },
		{ 0.5, 0.35, -0.2, 0.65 },
	}
	for i, puff in puffs do
		local size = 10 * scale * puff[4]
		local part = WorldBuilder.ball(
			model,
			"Puff" .. i,
			Vector3.new(size * 1.3, size, size),
			CFrame.new(center + Vector3.new(puff[1], puff[2], puff[3]) * 10 * scale),
			c.cloud
		)
		part.CanCollide = false
		part.CastShadow = false
	end
	if face and lookAt then
		local frame = CFrame.lookAt(center, Vector3.new(lookAt.X, center.Y, lookAt.Z))
		local front = 4.6 * scale
		for _, side in { -1, 1 } do
			local eye = WorldBuilder.ball(
				model,
				"Eye",
				Vector3.new(1.1, 1.6, 0.6) * scale,
				frame * CFrame.new(side * 1.8 * scale, 0.8 * scale, -front),
				c.ink
			)
			eye.CanCollide = false
			local cheek = WorldBuilder.ball(
				model,
				"Cheek",
				Vector3.new(1.4, 0.8, 0.4) * scale,
				frame * CFrame.new(side * 3.2 * scale, -0.6 * scale, -front + 0.6 * scale),
				c.pink
			)
			cheek.CanCollide = false
		end
		local smile = WorldBuilder.ball(
			model,
			"Smile",
			Vector3.new(2, 0.6, 0.5) * scale,
			frame * CFrame.new(0, -0.9 * scale, -front - 0.1),
			c.ink
		)
		smile.CanCollide = false
	end
	model.Parent = parent
end

local function lollipopTree(parent: Instance, position: Vector3, color: Color3)
	local trunk = WorldBuilder.anchored(
		parent,
		"Trunk",
		Vector3.new(7, 1, 1),
		CFrame.new(position + Vector3.new(0, 3.5, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		WorldBuilder.Colors.cloud
	)
	trunk.Shape = Enum.PartType.Cylinder
	WorldBuilder.ball(parent, "Top", Vector3.new(7, 7, 7), CFrame.new(position + Vector3.new(0, 9, 0)), color)
end

function WorldBuilder.build(): World
	local c = WorldBuilder.Colors
	local map = Instance.new("Folder")
	map.Name = "Map"

	-- suelo
	WorldBuilder.anchored(map, "Ground", Vector3.new(320, 1, 260), CFrame.new(0, -0.5, 0), c.grass, Enum.Material.Grass)
	-- camino a los dos lados de la cinta
	WorldBuilder.anchored(map, "Path", Vector3.new(240, 0.2, 34), CFrame.new(0, 0.1, 0), c.sun, Enum.Material.Sand)

	-- cinta: pieza anclada con velocidad (arrastra lo que se pone encima, también a los jugadores)
	local length = Config.Conveyor.length
	local width = Config.Conveyor.width
	local belt = WorldBuilder.anchored(
		map,
		"Belt",
		Vector3.new(length, 1, width),
		CFrame.new(0, WorldBuilder.BELT_TOP - 0.5, 0),
		c.ink,
		Enum.Material.DiamondPlate
	)
	belt.AssemblyLinearVelocity = Vector3.new(Config.Conveyor.speed, 0, 0)
	for _, side in { -1, 1 } do
		WorldBuilder.anchored(
			map,
			"BeltRail",
			Vector3.new(length, 1.4, 0.8),
			CFrame.new(0, 0.7, side * (width / 2 + 0.4)),
			c.sun
		)
	end
	-- flechas en el borde (fijas) que dicen hacia dónde va la cinta, sin texto
	for x = -length / 2 + 10, length / 2 - 10, 20 do
		local arrow = WorldBuilder.anchored(
			map,
			"Arrow",
			Vector3.new(1.2, 0.2, 1.2),
			CFrame.new(x, 1.45, width / 2 + 0.4) * CFrame.Angles(0, math.rad(45), 0),
			c.cloud,
			Enum.Material.Neon
		)
		arrow.CanCollide = false
	end

	-- las dos nubes de la cinta
	local startX = -length / 2
	local endX = length / 2
	cloud(map, Vector3.new(startX - 4, 9, 0), 1.2, true, Vector3.new(0, 9, 0))
	cloud(map, Vector3.new(endX + 4, 9, 0), 1.2, true, Vector3.new(0, 9, 0))

	-- punto de aparición neutro (cada jugador se lleva luego a su base)
	local spawnPoint = Instance.new("SpawnLocation")
	spawnPoint.Name = "Spawn"
	spawnPoint.Anchored = true
	spawnPoint.Neutral = true
	spawnPoint.Size = Vector3.new(8, 0.4, 8)
	spawnPoint.CFrame = CFrame.new(0, 0.3, 12)
	spawnPoint.Color = c.sky
	spawnPoint.Material = Enum.Material.SmoothPlastic
	spawnPoint.Duration = 0
	spawnPoint.Parent = map

	-- decoración: árboles de caramelo y nubes altas (siempre los mismos)
	local treeColors = { c.pink, c.sky, c.sun, Color3.fromRGB(168, 120, 255) }
	local trees = {
		Vector3.new(-140, 0, 70),
		Vector3.new(-140, 0, -70),
		Vector3.new(140, 0, 70),
		Vector3.new(140, 0, -70),
		Vector3.new(-140, 0, 0),
		Vector3.new(140, 0, 0),
		Vector3.new(-54, 0, 112),
		Vector3.new(0, 0, 112),
		Vector3.new(54, 0, 112),
		Vector3.new(-54, 0, -112),
		Vector3.new(0, 0, -112),
		Vector3.new(54, 0, -112),
	}
	for i, position in trees do
		lollipopTree(map, position, treeColors[(i - 1) % #treeColors + 1])
	end
	local random = Random.new(7)
	for _ = 1, 10 do
		local position =
			Vector3.new(random:NextNumber(-150, 150), random:NextNumber(55, 80), random:NextNumber(-130, 130))
		cloud(map, position, random:NextNumber(0.9, 1.6), false, nil)
	end

	map.Parent = Workspace

	local petsFolder = Instance.new("Folder")
	petsFolder.Name = "Pets"
	petsFolder.Parent = Workspace
	local conveyorFolder = Instance.new("Folder")
	conveyorFolder.Name = "Conveyor"
	conveyorFolder.Parent = Workspace

	return {
		conveyorStart = Vector3.new(startX + 3, WorldBuilder.BELT_TOP, 0),
		conveyorEnd = Vector3.new(endX - 3, WorldBuilder.BELT_TOP, 0),
		petsFolder = petsFolder,
		conveyorFolder = conveyorFolder,
	}
end

return WorldBuilder
