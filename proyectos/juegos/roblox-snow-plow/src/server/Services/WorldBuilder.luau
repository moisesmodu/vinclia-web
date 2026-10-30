--!strict
-- Construye el pueblo nevado al arrancar el servidor, sin mapas de Studio: el suelo de cada zona con su camino,
-- el depósito de nieve, la puerta de hielo de la zona siguiente, el adorno del centro (árbol, estanque, muñeco,
-- poste del Polo Norte) y, fuera del área de juego, casas, abetos, farolas, bastones de caramelo y regalos.
--
-- Ejes: las zonas van por +Z una detrás de otra (ver Zones.luau); el suelo está en y = 0.
-- La decoración usa un generador con semilla: el pueblo es siempre el mismo.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local Rng = require(ReplicatedStorage.Shared.Rng)
local Zones = require(ReplicatedStorage.Shared.Zones)

export type ZoneInfo = {
	index: number,
	depot: Vector3,
	arrival: Vector3,
}

export type World = {
	zones: { ZoneInfo },
	snowFolder: Folder,
}

local WorldBuilder = {}

WorldBuilder.Colors = {
	sky = Color3.fromRGB(79, 179, 255), -- cielo #4FB3FF
	ink = Color3.fromRGB(30, 42, 58), -- tinta #1E2A3A
	cloud = Color3.fromRGB(244, 250, 255), -- nube #F4FAFF
	sun = Color3.fromRGB(255, 201, 77), -- sol #FFC94D
	grass = Color3.fromRGB(88, 194, 106), -- hierba #58C26A
	pine = Color3.fromRGB(46, 128, 84),
	red = Color3.fromRGB(214, 64, 64),
	wood = Color3.fromRGB(150, 98, 60),
	ice = Color3.fromRGB(170, 222, 255),
	path = Color3.fromRGB(196, 210, 228),
	snow = Color3.fromRGB(250, 252, 255),
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

local function wedge(parent: Instance, size: Vector3, cframe: CFrame, color: Color3): WedgePart
	local part = Instance.new("WedgePart")
	part.Name = "Roof"
	part.Anchored = true
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.Parent = parent
	return part
end

-- Cilindro vertical (el eje de un cilindro de Roblox es X: se gira 90°).
local function column(
	parent: Instance,
	name: string,
	height: number,
	diameter: number,
	base: Vector3,
	color: Color3
): Part
	return WorldBuilder.part(
		parent,
		name,
		Vector3.new(height, diameter, diameter),
		CFrame.new(base + Vector3.new(0, height / 2, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		color
	)
end

function WorldBuilder.billboard(adornee: BasePart, text: string, size: UDim2, offsetY: number): TextLabel
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = size
	gui.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	gui.MaxDistance = 160
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

local LIGHT_COLORS = { C.red, C.sun, C.grass, C.sky }

-- Ristra de bombillas de neón entre dos puntos.
local function lights(parent: Instance, from: Vector3, to: Vector3, count: number)
	for i = 0, count - 1 do
		local t = if count > 1 then i / (count - 1) else 0.5
		local bulb = WorldBuilder.ball(
			parent,
			"Bulb",
			Vector3.new(0.6, 0.6, 0.6),
			CFrame.new(from:Lerp(to, t)),
			LIGHT_COLORS[i % #LIGHT_COLORS + 1]
		)
		bulb.Material = Enum.Material.Neon
		bulb.CanCollide = false
		bulb.CastShadow = false
	end
end

-- Casa de bloques con tejado a dos aguas nevado, ventanas encendidas y luces de Navidad. `facing` = +1/-1:
-- la fachada mira hacia +X o -X (hacia el camino).
local function house(parent: Instance, base: Vector3, facing: number, wall: Color3, scale: number)
	local model = Instance.new("Model")
	model.Name = "House"
	local w = 14 * scale -- a lo largo de Z
	local d = 12 * scale -- a lo largo de X
	local h = 9 * scale
	local body =
		WorldBuilder.part(model, "Body", Vector3.new(d, h, w), CFrame.new(base + Vector3.new(0, h / 2, 0)), wall)
	body.Material = Enum.Material.Brick
	-- tejado: dos cuñas con la cumbrera a lo largo de X
	local roofH = 5 * scale
	local top = base.Y + h + roofH / 2
	wedge(
		model,
		Vector3.new(d + 1.6, roofH, w / 2 + 0.8),
		CFrame.new(base.X, top, base.Z + w / 4 + 0.4) * CFrame.Angles(0, math.pi, 0),
		C.snow
	)
	wedge(model, Vector3.new(d + 1.6, roofH, w / 2 + 0.8), CFrame.new(base.X, top, base.Z - w / 4 - 0.4), C.snow)
	-- fachada: puerta y dos ventanas
	local front = base.X + facing * (d / 2 + 0.1)
	WorldBuilder.part(
		model,
		"Door",
		Vector3.new(0.3, 4.4 * scale, 2.6 * scale),
		CFrame.new(front, base.Y + 2.2 * scale, base.Z),
		C.wood
	)
	for _, side in { -1, 1 } do
		local window = WorldBuilder.part(
			model,
			"Window",
			Vector3.new(0.3, 2.4 * scale, 2.4 * scale),
			CFrame.new(front, base.Y + 5 * scale, base.Z + side * w * 0.3),
			C.sun
		)
		window.Material = Enum.Material.Neon
	end
	local chimney = WorldBuilder.part(
		model,
		"Chimney",
		Vector3.new(1.8, 4 * scale, 1.8),
		CFrame.new(base.X - facing * d * 0.2, base.Y + h + roofH * 0.7, base.Z + w * 0.25),
		Color3.fromRGB(140, 70, 60)
	)
	chimney.Material = Enum.Material.Brick
	lights(
		model,
		Vector3.new(front + facing * 0.6, base.Y + h - 0.2, base.Z - w / 2),
		Vector3.new(front + facing * 0.6, base.Y + h - 0.2, base.Z + w / 2),
		9
	)
	model.Parent = parent
end

-- Abeto de bloques: tronco, tres pisos girados y estrella. `lit` añade bolas de neón.
local function pine(parent: Instance, base: Vector3, scale: number, lit: boolean)
	local model = Instance.new("Model")
	model.Name = "Pine"
	column(model, "Trunk", 3 * scale, 1.6 * scale, base, C.wood)
	local y = base.Y + 3 * scale
	for i, width in { 9, 6.6, 4.2 } do
		local layer = WorldBuilder.part(
			model,
			"Layer",
			Vector3.new(width * scale, 3.2 * scale, width * scale),
			CFrame.new(base.X, y + 1.6 * scale, base.Z) * CFrame.Angles(0, if i % 2 == 0 then math.pi / 4 else 0, 0),
			C.pine
		)
		layer.Material = Enum.Material.Grass
		local cap = WorldBuilder.part(
			model,
			"SnowCap",
			Vector3.new(width * scale * 0.8, 0.5 * scale, width * scale * 0.8),
			layer.CFrame * CFrame.new(0, 1.6 * scale + 0.2, 0),
			C.snow
		)
		cap.CanCollide = false
		if lit then
			for k = 0, 3 do
				local angle = k * math.pi / 2 + i
				local ornament = WorldBuilder.ball(
					model,
					"Ornament",
					Vector3.new(0.9, 0.9, 0.9) * scale,
					CFrame.new(
						base.X + math.cos(angle) * width * scale * 0.5,
						y + 0.8 * scale,
						base.Z + math.sin(angle) * width * scale * 0.5
					),
					LIGHT_COLORS[(i + k) % #LIGHT_COLORS + 1]
				)
				ornament.Material = Enum.Material.Neon
				ornament.CanCollide = false
			end
		end
		y += 3 * scale
	end
	local star = WorldBuilder.part(
		model,
		"Star",
		Vector3.new(1.4, 1.4, 1.4) * scale,
		CFrame.new(base.X, y + 0.9 * scale, base.Z) * CFrame.Angles(0, 0, math.pi / 4),
		C.sun
	)
	star.Material = Enum.Material.Neon
	model.Parent = parent
end

local function lamp(parent: Instance, base: Vector3)
	local model = Instance.new("Model")
	model.Name = "Lamp"
	column(model, "Pole", 9, 0.6, base, C.ink)
	local bulb =
		WorldBuilder.ball(model, "Bulb", Vector3.new(1.8, 1.8, 1.8), CFrame.new(base + Vector3.new(0, 9.6, 0)), C.sun)
	bulb.Material = Enum.Material.Neon
	local light = Instance.new("PointLight")
	light.Color = C.sun
	light.Range = 16
	light.Brightness = 1.2
	light.Parent = bulb
	model.Parent = parent
end

local function candyCane(parent: Instance, base: Vector3, height: number)
	local model = Instance.new("Model")
	model.Name = "CandyCane"
	local pieces = math.floor(height / 1.5)
	for i = 0, pieces - 1 do
		column(model, "Stripe", 1.5, 1.2, base + Vector3.new(0, i * 1.5, 0), if i % 2 == 0 then C.red else C.snow)
	end
	-- gancho: tres trozos inclinados
	local top = base + Vector3.new(0, pieces * 1.5, 0)
	for k = 1, 3 do
		local angle = k * math.pi / 4
		local center = top + Vector3.new(1 - math.cos(angle), math.sin(angle) * 0.9, 0)
		WorldBuilder.part(
			model,
			"Hook",
			Vector3.new(1.2, 1.4, 1.2),
			CFrame.new(center) * CFrame.Angles(0, 0, -angle),
			if k % 2 == 0 then C.red else C.snow
		)
	end
	model.Parent = parent
end

local function gift(parent: Instance, base: Vector3, size: number, color: Color3)
	local model = Instance.new("Model")
	model.Name = "Gift"
	local box = WorldBuilder.part(
		model,
		"Box",
		Vector3.new(size, size, size),
		CFrame.new(base + Vector3.new(0, size / 2, 0)),
		color
	)
	WorldBuilder.part(model, "RibbonX", Vector3.new(size + 0.1, size + 0.1, size * 0.2), box.CFrame, C.sun)
	WorldBuilder.part(model, "RibbonZ", Vector3.new(size * 0.2, size + 0.1, size + 0.1), box.CFrame, C.sun)
	model.Parent = parent
end

local function snowman(parent: Instance, base: Vector3, scale: number)
	local model = Instance.new("Model")
	model.Name = "Snowman"
	local sizes = { 8, 6, 4.4 }
	local y = base.Y
	local headY = 0
	for i, s in sizes do
		local size = s * scale
		WorldBuilder.ball(
			model,
			"Ball" .. i,
			Vector3.new(size, size, size),
			CFrame.new(base.X, y + size * 0.45, base.Z),
			C.snow
		).Material =
			Enum.Material.Snow
		headY = y + size * 0.45
		y += size * 0.82
	end
	local head = 4.4 * scale
	local nose = WorldBuilder.part(
		model,
		"Nose",
		Vector3.new(0.6, 0.6, 2) * scale,
		CFrame.new(base.X, headY, base.Z - head / 2 - 0.6 * scale),
		Color3.fromRGB(255, 140, 40)
	)
	nose.CanCollide = false
	for _, side in { -1, 1 } do
		WorldBuilder.ball(
			model,
			"Eye",
			Vector3.new(0.6, 0.6, 0.4) * scale,
			CFrame.new(base.X + side * 0.8 * scale, headY + 0.7 * scale, base.Z - head * 0.46),
			C.ink
		)
	end
	column(model, "HatBrim", 0.4 * scale, 4.6 * scale, Vector3.new(base.X, headY + head * 0.4, base.Z), C.ink)
	column(model, "Hat", 2.6 * scale, 3 * scale, Vector3.new(base.X, headY + head * 0.4, base.Z), C.ink)
	column(model, "HatBand", 0.5 * scale, 3.05 * scale, Vector3.new(base.X, headY + head * 0.4 + 0.4, base.Z), C.red)
	model.Parent = parent
end

-- Adorno del centro de cada zona (dentro del hueco que deja la nieve).
local function centerpiece(parent: Instance, index: number, center: Vector3)
	if index == 1 then
		pine(parent, center, 2.2, true)
		for k = 0, 5 do
			local angle = k * math.pi / 3
			gift(
				parent,
				center + Vector3.new(math.cos(angle) * 8, 0, math.sin(angle) * 8),
				2 + k % 2,
				LIGHT_COLORS[k % #LIGHT_COLORS + 1]
			)
		end
	elseif index == 2 then
		local pond = WorldBuilder.part(
			parent,
			"Pond",
			Vector3.new(0.3, 24, 24),
			CFrame.new(center + Vector3.new(0, 0.1, 0)) * CFrame.Angles(0, 0, math.pi / 2),
			C.ice,
			Enum.Material.Ice
		)
		pond.Shape = Enum.PartType.Cylinder
		pond.Transparency = 0.15
		for k = 0, 3 do
			local angle = k * math.pi / 2 + math.pi / 4
			pine(parent, center + Vector3.new(math.cos(angle) * 13, 0, math.sin(angle) * 13), 0.4, false)
		end
	elseif index == 3 then
		snowman(parent, center, 2)
	else
		local pole = column(parent, "NorthPole", 22, 2, center, C.snow)
		pole.Material = Enum.Material.SmoothPlastic
		for i = 0, 6 do
			column(parent, "PoleStripe", 1.2, 2.1, center + Vector3.new(0, 1.5 + i * 3, 0), C.red)
		end
		local top = WorldBuilder.ball(
			parent,
			"PoleTop",
			Vector3.new(4, 4, 4),
			CFrame.new(center + Vector3.new(0, 23.5, 0)),
			C.sun
		)
		top.Material = Enum.Material.Neon
		for k = 0, 7 do
			local angle = k * math.pi / 4
			gift(
				parent,
				center + Vector3.new(math.cos(angle) * 9, 0, math.sin(angle) * 9),
				2.2,
				LIGHT_COLORS[k % #LIGHT_COLORS + 1]
			)
		end
	end
end

local HOUSE_COLORS = {
	Color3.fromRGB(214, 84, 84),
	Color3.fromRGB(88, 160, 110),
	Color3.fromRGB(240, 222, 190),
	Color3.fromRGB(110, 150, 214),
}

-- Decoración a los dos lados de la zona, fuera del área de juego.
local function sides(parent: Instance, index: number, bounds: Zones.Bounds, rng: Rng.Rng)
	for _, side in { -1, 1 } do
		local x = side * (bounds.maxX + 16)
		local z = bounds.minZ + 14
		while z < bounds.maxZ - 10 do
			local base = Vector3.new(x + (rng.next() - 0.5) * 4, 0, z)
			local roll = rng.next()
			if index == 1 then
				if roll < 0.7 then
					house(parent, base, -side, HOUSE_COLORS[rng.int(1, #HOUSE_COLORS)], 1)
				else
					pine(parent, base, 1, true)
				end
			elseif index == 2 then
				pine(parent, base, 0.8 + rng.next() * 0.6, roll < 0.3)
			elseif index == 3 then
				if roll < 0.6 then
					house(parent, base, -side, C.wood, 1.15)
				else
					pine(parent, base, 1.2, false)
				end
			else
				if roll < 0.35 then
					house(parent, base, -side, C.red, 1.3)
				elseif roll < 0.7 then
					candyCane(parent, base, 12)
				else
					gift(parent, base, 3 + rng.next() * 2, LIGHT_COLORS[rng.int(1, #LIGHT_COLORS)])
				end
			end
			z += 24 + rng.next() * 6
		end
		-- farolas en el borde del área de juego
		local lz = bounds.minZ + 30
		while lz < bounds.maxZ do
			lamp(parent, Vector3.new(side * (bounds.maxX + 3), 0, lz))
			lz += 50
		end
	end
	if index == 3 then
		-- montañas nevadas al fondo
		for _, side in { -1, 1 } do
			local mountain = wedge(
				parent,
				Vector3.new(bounds.maxZ - bounds.minZ, 60, 60),
				CFrame.new(side * (bounds.maxX + 70), 30, (bounds.minZ + bounds.maxZ) / 2)
					* CFrame.Angles(0, if side > 0 then math.pi / 2 else -math.pi / 2, 0),
				C.snow
			)
			mountain.Name = "Mountain"
			mountain.Material = Enum.Material.Snow
		end
	end
end

local function depot(parent: Instance, position: Vector3)
	local model = Instance.new("Model")
	model.Name = "Depot"
	local r = Config.World.depotRadius
	local pad = WorldBuilder.part(
		model,
		"Pad",
		Vector3.new(0.4, r * 2, r * 2),
		CFrame.new(position + Vector3.new(0, 0.2, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		C.sky
	)
	pad.Shape = Enum.PartType.Cylinder
	pad.CanCollide = false
	local ring = WorldBuilder.part(
		model,
		"Ring",
		Vector3.new(0.3, r * 2 + 1, r * 2 + 1),
		CFrame.new(position + Vector3.new(0, 0.1, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		C.sun
	)
	ring.Shape = Enum.PartType.Cylinder
	ring.Material = Enum.Material.Neon
	ring.CanCollide = false
	-- contenedor grande al fondo del depósito
	local bin = WorldBuilder.part(
		model,
		"Bin",
		Vector3.new(8, 6, 12),
		CFrame.new(position + Vector3.new(-r - 3, 3, 0)),
		C.sun,
		Enum.Material.Metal
	)
	local heap = WorldBuilder.ball(model, "Heap", Vector3.new(7, 5, 11), bin.CFrame * CFrame.new(0, 3.2, 0), C.snow)
	heap.Material = Enum.Material.Snow
	WorldBuilder.billboard(pad, "❄️ ➜ 🪙", UDim2.fromOffset(160, 70), 9)
	model.Parent = parent
end

local function gate(parent: Instance, index: number, z: number)
	local zone = Config.Zones[index]
	local width = Config.World.zoneWidth
	local wall = WorldBuilder.part(
		parent,
		"Gate" .. index,
		Vector3.new(width, 18, 2),
		CFrame.new(0, 9, z),
		C.ice,
		Enum.Material.Glass
	)
	wall.Transparency = 0.35
	wall:SetAttribute("Zone", index)
	local price = "🔒 " .. zone.icon .. "  🪙 " .. Economy.short(zone.cost)
	if zone.minRebirths > 0 then
		price ..= "  🔁 " .. zone.minRebirths
	end
	-- cartel y aviso en un poste en el camino, del lado de la zona anterior
	local post = WorldBuilder.part(parent, "GatePost" .. index, Vector3.new(4, 5, 2), CFrame.new(0, 2.5, z - 4), C.sun)
	post:SetAttribute("Zone", index)
	WorldBuilder.billboard(post, price, UDim2.fromOffset(300, 70), 8)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "UnlockPrompt"
	prompt.ActionText = "🔓"
	prompt.ObjectText = zone.icon
	prompt.HoldDuration = 0.3
	prompt.MaxActivationDistance = 14
	prompt.RequiresLineOfSight = false
	prompt.Parent = post
end

local function walls(parent: Instance, totalLength: number)
	local half = Config.World.zoneWidth / 2
	local function wall(name: string, size: Vector3, position: Vector3)
		local p = WorldBuilder.part(parent, name, size, CFrame.new(position), C.ice)
		p.Transparency = 1
		p.CastShadow = false
	end
	wall("WallLeft", Vector3.new(2, 40, totalLength + 4), Vector3.new(-half - 1, 20, totalLength / 2))
	wall("WallRight", Vector3.new(2, 40, totalLength + 4), Vector3.new(half + 1, 20, totalLength / 2))
	wall("WallBack", Vector3.new(half * 2 + 4, 40, 2), Vector3.new(0, 20, -1))
	wall("WallEnd", Vector3.new(half * 2 + 4, 40, 2), Vector3.new(0, 20, totalLength + 1))
end

local function atmosphere()
	local air = Instance.new("Atmosphere")
	air.Density = 0.32
	air.Offset = 0.1
	air.Color = Color3.fromRGB(214, 230, 250)
	air.Decay = Color3.fromRGB(150, 180, 220)
	air.Glare = 0.2
	air.Haze = 1.4
	air.Parent = Lighting
end

-- Construye todo y devuelve las zonas (depósito y llegada) y la carpeta para la nieve.
-- Los postes de las puertas se buscan en Workspace.World.Gates (atributo Zone).
function WorldBuilder.build(): World
	local w = Config.World
	local root = Instance.new("Folder")
	root.Name = "World"
	local decor = Instance.new("Folder")
	decor.Name = "Decor"
	decor.Parent = root
	local gates = Instance.new("Folder")
	gates.Name = "Gates"
	gates.Parent = root
	local depots = Instance.new("Folder")
	depots.Name = "Depots"
	depots.Parent = root

	local rng = Rng.new(20261201)
	local zones: { ZoneInfo } = {}
	for index, zone in Config.Zones do
		local b = Zones.bounds(index, w)
		local length = b.maxZ - b.minZ
		local midZ = (b.minZ + b.maxZ) / 2
		local ground = WorldBuilder.part(
			root,
			"Ground" .. index,
			Vector3.new(w.zoneWidth + 200, 4, length),
			CFrame.new(0, -2, midZ),
			WorldBuilder.rgb(zone.ground),
			Enum.Material.Snow
		)
		ground.Locked = true
		local path = WorldBuilder.part(
			root,
			"Path" .. index,
			Vector3.new(16, 0.1, length),
			CFrame.new(0, 0.05, midZ),
			C.path,
			Enum.Material.Slate
		)
		path.CanCollide = false

		local dx, dz = Zones.depot(index, w)
		local ax, az = Zones.arrival(index, w)
		local cx, cz = Zones.center(index, w)
		depot(depots, Vector3.new(dx, 0, dz))
		centerpiece(decor, index, Vector3.new(cx, 0, cz))
		sides(decor, index, b, rng)
		if index > 1 then
			gate(gates, index, b.minZ)
		end
		table.insert(zones, { index = index, depot = Vector3.new(dx, 0, dz), arrival = Vector3.new(ax, 3, az) })
	end
	walls(root, w.zoneLength * #Config.Zones)

	local spawnPad = Instance.new("SpawnLocation")
	spawnPad.Name = "Spawn"
	spawnPad.Anchored = true
	spawnPad.Size = Vector3.new(10, 0.4, 10)
	spawnPad.CFrame = CFrame.new(0, 0.2, w.spawnZ)
	spawnPad.Color = C.sky
	spawnPad.Material = Enum.Material.SmoothPlastic
	spawnPad.Neutral = true
	spawnPad.Duration = 0
	spawnPad.Parent = root

	local snowFolder = Instance.new("Folder")
	snowFolder.Name = "Snow"
	snowFolder.Parent = Workspace

	atmosphere()
	root.Parent = Workspace
	return { zones = zones, snowFolder = snowFolder }
end

return WorldBuilder
