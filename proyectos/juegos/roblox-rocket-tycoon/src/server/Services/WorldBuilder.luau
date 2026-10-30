--!strict
-- Construye la Luna al arrancar el servidor, sin mapas de Studio: suelo gris con cráteres, la avenida central con
-- luces, la plataforma de llegada, la Tierra en el cielo, estrellas y muros invisibles en el borde. También da las
-- piezas de bloques que usan el resto de constructores (parcelas, máquinas, cohete).
-- La decoración usa un generador con semilla: la Luna es siempre la misma.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Rng = require(ReplicatedStorage.Shared.Rng)

local WorldBuilder = {}

-- Marca Nuvolet: cielo, tinta, nube, sol y hierba; más los grises de la Luna.
WorldBuilder.Colors = {
	sky = Color3.fromRGB(79, 179, 255), -- cielo #4FB3FF
	ink = Color3.fromRGB(30, 42, 58), -- tinta #1E2A3A
	cloud = Color3.fromRGB(244, 250, 255), -- nube #F4FAFF
	sun = Color3.fromRGB(255, 201, 77), -- sol #FFC94D
	grass = Color3.fromRGB(88, 194, 106), -- hierba #58C26A
	red = Color3.fromRGB(229, 75, 75),
	moon = Color3.fromRGB(196, 198, 210),
	moonDark = Color3.fromRGB(150, 152, 168),
	metal = Color3.fromRGB(170, 180, 196),
	purple = Color3.fromRGB(150, 110, 230),
	glass = Color3.fromRGB(180, 230, 255),
}

local C = WorldBuilder.Colors

function WorldBuilder.rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

function WorldBuilder.part(
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
	local part = WorldBuilder.part(parent, name, size, cframe, color)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = part
	return part
end

function WorldBuilder.wedge(parent: Instance, name: string, size: Vector3, cframe: CFrame, color: Color3): WedgePart
	local part = Instance.new("WedgePart")
	part.Name = name
	part.Anchored = true
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.Parent = parent
	return part
end

-- Cilindro vertical con la base en `base` (el eje de un cilindro de Roblox es X: se gira 90°).
function WorldBuilder.column(
	parent: Instance,
	name: string,
	height: number,
	diameter: number,
	base: CFrame,
	color: Color3
): Part
	local part = WorldBuilder.part(
		parent,
		name,
		Vector3.new(height, diameter, diameter),
		base * CFrame.new(0, height / 2, 0) * CFrame.Angles(0, 0, math.pi / 2),
		color
	)
	part.Shape = Enum.PartType.Cylinder
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
	label.TextStrokeTransparency = 0.2
	label.TextStrokeColor3 = C.ink
	label.Text = text
	label.Parent = gui
	gui.Parent = adornee
	return label
end

-- Cráter: mancha más oscura en el suelo con rocas alrededor del borde.
local function crater(parent: Instance, position: Vector3, diameter: number, rng: Rng.Rng)
	local floor = WorldBuilder.column(parent, "Crater", 0.2, diameter, CFrame.new(position), C.moonDark)
	floor.Material = Enum.Material.Slate
	floor.CanCollide = false
	local rocks = 5 + rng.int(0, 3)
	for i = 1, rocks do
		local angle = (i / rocks) * math.pi * 2 + rng.next()
		local size = 1.5 + rng.next() * diameter * 0.12
		local rock = WorldBuilder.part(
			parent,
			"Rock",
			Vector3.new(size, size * 0.7, size),
			CFrame.new(position + Vector3.new(math.cos(angle), 0, math.sin(angle)) * diameter * 0.5)
				* CFrame.Angles(rng.next(), rng.next() * 3, rng.next()),
			C.moon,
			Enum.Material.Slate
		)
		rock.Color = Color3.fromRGB(176, 178, 192)
	end
end

local function earth(parent: Instance)
	local center = Vector3.new(-180, 300, -1100)
	local planet = WorldBuilder.ball(parent, "Earth", Vector3.new(240, 240, 240), CFrame.new(center), C.sky)
	planet.CanCollide = false
	planet.CastShadow = false
	planet.Material = Enum.Material.Neon
	planet.Color = Color3.fromRGB(70, 150, 240)
	for i, offset in { Vector3.new(-40, 30, 92), Vector3.new(50, -20, 96), Vector3.new(-10, -60, 98) } do
		local land = WorldBuilder.ball(
			parent,
			"Land",
			Vector3.new(70 - i * 10, 50 - i * 6, 30),
			CFrame.new(center + offset),
			C.grass
		)
		land.CanCollide = false
		land.CastShadow = false
		land.Material = Enum.Material.Neon
	end
end

local function sky()
	local s = Instance.new("Sky")
	s.StarCount = 5000
	s.CelestialBodiesShown = false
	s.Parent = Lighting
end

local function bounds(parent: Instance, halfX: number, halfZ: number)
	local function wall(name: string, size: Vector3, position: Vector3)
		local p = WorldBuilder.part(parent, name, size, CFrame.new(position), C.moon)
		p.Transparency = 1
		p.CastShadow = false
	end
	wall("WallWest", Vector3.new(2, 300, halfZ * 2), Vector3.new(-halfX, 150, 0))
	wall("WallEast", Vector3.new(2, 300, halfZ * 2), Vector3.new(halfX, 150, 0))
	wall("WallNorth", Vector3.new(halfX * 2, 300, 2), Vector3.new(0, 150, -halfZ))
	wall("WallSouth", Vector3.new(halfX * 2, 300, 2), Vector3.new(0, 150, halfZ))
end

-- Construye la Luna y devuelve la carpeta raíz (Workspace.World).
function WorldBuilder.build(): Folder
	local p = Config.Plot
	local perRow = math.ceil(Config.MaxPlayers / 2)
	local halfX = perRow * (p.size + p.gap) / 2 + 70
	local halfZ = p.avenue / 2 + p.size + 70

	local root = Instance.new("Folder")
	root.Name = "World"
	local decor = Instance.new("Folder")
	decor.Name = "Decor"
	decor.Parent = root

	local ground = WorldBuilder.part(
		root,
		"Ground",
		Vector3.new(halfX * 2, 4, halfZ * 2),
		CFrame.new(0, -2, 0),
		C.moon,
		Enum.Material.Slate
	)
	ground.Locked = true

	-- avenida con luces a los lados
	local avenueLength = halfX * 2 - 40
	local avenue = WorldBuilder.part(
		root,
		"Avenue",
		Vector3.new(avenueLength, 0.1, p.avenue - 8),
		CFrame.new(0, 0.05, 0),
		Color3.fromRGB(120, 124, 150),
		Enum.Material.Concrete
	)
	avenue.CanCollide = false
	for _, side in { -1, 1 } do
		local x = -avenueLength / 2
		while x <= avenueLength / 2 do
			local light = WorldBuilder.part(
				decor,
				"AvenueLight",
				Vector3.new(1.2, 0.3, 1.2),
				CFrame.new(x, 0.2, side * (p.avenue / 2 - 5)),
				if side < 0 then C.sky else C.sun,
				Enum.Material.Neon
			)
			light.CanCollide = false
			x += 12
		end
	end

	-- llegada en el centro de la avenida
	local spawnPad = Instance.new("SpawnLocation")
	spawnPad.Name = "Spawn"
	spawnPad.Anchored = true
	spawnPad.Size = Vector3.new(12, 0.4, 12)
	spawnPad.CFrame = CFrame.new(0, 0.2, 0)
	spawnPad.Color = C.sky
	spawnPad.Material = Enum.Material.SmoothPlastic
	spawnPad.Neutral = true
	spawnPad.Duration = 0
	spawnPad.Parent = root

	-- cráteres fuera de las parcelas
	local rng = Rng.new(19690720)
	local plotHalfX = perRow * (p.size + p.gap) / 2
	local plotHalfZ = p.avenue / 2 + p.size
	for _ = 1, 40 do
		local x = (rng.next() * 2 - 1) * (halfX - 15)
		local z = (rng.next() * 2 - 1) * (halfZ - 15)
		if math.abs(x) > plotHalfX + 12 or math.abs(z) > plotHalfZ + 12 then
			crater(decor, Vector3.new(x, 0, z), 8 + rng.next() * 18, rng)
		end
	end

	earth(decor)
	sky()
	bounds(root, halfX, halfZ)
	root.Parent = Workspace
	return root
end

return WorldBuilder
