--!strict
-- Construye el mundo al arrancar el servidor, sin mapas de Studio: suelo, columna central de gelatina por zonas,
-- las piezas de todas las fases (Stages.generate) convertidas en Parts, los 41 checkpoints y nubes Nuvolet.
--
-- Lo que se mueve o reacciona (gelatinas que se encogen, baldosas que desaparecen, plataformas móviles, baba) se
-- devuelve en listas para ObstacleService y StageService. Las almohadillas y trampolines llevan el atributo
-- «Launch» (velocidad vertical): el impulso lo da el cliente a su propio personaje (Launcher.luau).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Stages = require(ReplicatedStorage.Shared.Stages)

export type Timed = {
	part: BasePart,
	delay: number,
	respawn: number,
	size: Vector3,
	color: Color3,
	transparency: number,
}

export type Mover = {
	align: AlignPosition,
	a: Vector3,
	b: Vector3,
	speed: number,
}

export type Built = {
	checkpoints: { BasePart }, -- 1..N + 1 (N + 1 = cima)
	goo: { BasePart },
	jelly: { Timed },
	vanish: { Timed },
	movers: { Mover },
	physics: { BasePart }, -- piezas sueltas (móviles y giratorias): el servidor es su dueño
}

local TowerBuilder = {}

TowerBuilder.Colors = {
	sky = Color3.fromRGB(79, 179, 255), -- cielo #4FB3FF
	ink = Color3.fromRGB(30, 42, 58), -- tinta #1E2A3A
	cloud = Color3.fromRGB(244, 250, 255), -- nube #F4FAFF
	sun = Color3.fromRGB(255, 201, 77), -- sol #FFC94D
	grass = Color3.fromRGB(88, 194, 106), -- hierba #58C26A
	pink = Color3.fromRGB(255, 150, 190),
	goo = Color3.fromRGB(150, 255, 70),
}

local WHITE = Color3.new(1, 1, 1)
local BLACK = Color3.new(0, 0, 0)

local function rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

local function anchored(
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
local function ball(parent: Instance, name: string, size: Vector3, cframe: CFrame, color: Color3): Part
	local part = anchored(parent, name, size, cframe, color)
	part.CanCollide = false
	part.CastShadow = false
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = part
	return part
end

local function billboard(adornee: BasePart, text: string, offsetY: number)
	local gui = Instance.new("BillboardGui")
	gui.Name = "Label"
	gui.Size = UDim2.fromOffset(90, 60)
	gui.StudsOffsetWorldSpace = Vector3.new(0, offsetY, 0)
	gui.MaxDistance = 90
	gui.LightInfluence = 0
	gui.Adornee = adornee
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.TextScaled = true
	label.Font = Enum.Font.FredokaOne
	label.TextColor3 = WHITE
	label.TextStrokeColor3 = TowerBuilder.Colors.ink
	label.TextStrokeTransparency = 0.2
	label.Text = text
	label.Parent = gui
	gui.Parent = adornee
end

-- Nube Nuvolet: bolas blancas y, si `lookAt`, ojos, mejillas y sonrisa mirando hacia ese punto.
local function cloud(parent: Instance, center: Vector3, scale: number, lookAt: Vector3?)
	local model = Instance.new("Model")
	model.Name = "Cloud"
	local c = TowerBuilder.Colors
	local puffs = {
		{ 0, 0, 0, 1.0 },
		{ -0.9, -0.25, 0.1, 0.75 },
		{ 0.9, -0.25, -0.1, 0.75 },
		{ -0.45, 0.4, 0.2, 0.7 },
		{ 0.5, 0.35, -0.2, 0.65 },
	}
	for i, puff in puffs do
		local size = 10 * scale * puff[4]
		ball(
			model,
			"Puff" .. i,
			Vector3.new(size * 1.3, size, size),
			CFrame.new(center + Vector3.new(puff[1], puff[2], puff[3]) * 10 * scale),
			c.cloud
		)
	end
	if lookAt then
		local frame = CFrame.lookAt(center, Vector3.new(lookAt.X, center.Y, lookAt.Z))
		local front = 4.6 * scale
		for _, side in { -1, 1 } do
			ball(
				model,
				"Eye",
				Vector3.new(1.1, 1.6, 0.6) * scale,
				frame * CFrame.new(side * 1.8 * scale, 0.8 * scale, -front),
				c.ink
			)
			ball(
				model,
				"Cheek",
				Vector3.new(1.4, 0.8, 0.4) * scale,
				frame * CFrame.new(side * 3.2 * scale, -0.6 * scale, -front + 0.6 * scale),
				c.pink
			)
		end
		ball(model, "Smile", Vector3.new(2, 0.6, 0.5) * scale, frame * CFrame.new(0, -0.9 * scale, -front - 0.1), c.ink)
	end
	model.Parent = parent
end

local function lollipopTree(parent: Instance, position: Vector3, color: Color3)
	local trunk = anchored(
		parent,
		"Trunk",
		Vector3.new(7, 1, 1),
		CFrame.new(position + Vector3.new(0, 3.5, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		TowerBuilder.Colors.cloud
	)
	trunk.Shape = Enum.PartType.Cylinder
	local top = ball(parent, "Top", Vector3.new(7, 7, 7), CFrame.new(position + Vector3.new(0, 9, 0)), color)
	top.CanCollide = true
end

local function pieceSize(piece: Stages.Piece): Vector3
	return Vector3.new(piece.size[1], piece.size[2], piece.size[3])
end

local function pieceCFrame(piece: Stages.Piece): CFrame
	return CFrame.new(piece.position[1], piece.position[2] - piece.size[2] / 2, piece.position[3])
end

local function forwardOf(piece: Stages.Piece): Vector3
	return Vector3.new(piece.forward[1], 0, piece.forward[2])
end

local function lateralOf(piece: Stages.Piece): Vector3
	return Vector3.new(piece.lateral[1], 0, piece.lateral[2])
end

-- Tamaño de una franja a lo largo del camino (`along` studs) que ocupa todo el ancho de la pieza.
local function stripe(piece: Stages.Piece, along: number, height: number): Vector3
	if piece.forward[1] ~= 0 then
		return Vector3.new(along, height, piece.size[3])
	end
	return Vector3.new(piece.size[1], height, along)
end

local function timed(part: BasePart, delay: number, respawn: number): Timed
	return {
		part = part,
		delay = delay,
		respawn = respawn,
		size = part.Size,
		color = part.Color,
		transparency = part.Transparency,
	}
end

local function buildMoving(folder: Instance, piece: Stages.Piece, color: Color3, built: Built)
	local part = anchored(folder, "Moving", pieceSize(piece), pieceCFrame(piece), color)
	local attachment = Instance.new("Attachment")
	attachment.Parent = part
	local align = Instance.new("AlignPosition")
	align.Mode = Enum.PositionAlignmentMode.OneAttachment
	align.Attachment0 = attachment
	align.MaxForce = 1e7
	align.MaxVelocity = piece.speed
	align.Responsiveness = 40
	align.Position = part.Position
	align.Parent = part
	local orientation = Instance.new("AlignOrientation")
	orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
	orientation.Attachment0 = attachment
	orientation.CFrame = CFrame.new()
	orientation.MaxTorque = 1e7
	orientation.Responsiveness = 40
	orientation.RigidityEnabled = true
	orientation.Parent = part
	part.Anchored = false
	local offset = lateralOf(piece) * piece.range
	table.insert(
		built.movers,
		{ align = align, a = part.Position - offset, b = part.Position + offset, speed = piece.speed }
	)
	table.insert(built.physics, part)
end

local function buildRotating(folder: Instance, piece: Stages.Piece, color: Color3, built: Built)
	local cframe = pieceCFrame(piece)
	local hub = anchored(folder, "Hub", Vector3.new(1, 1, 1), cframe, color)
	hub.Transparency = 1
	hub.CanCollide = false
	hub.CanTouch = false
	hub.CanQuery = false
	local bar = anchored(folder, "Rotating", pieceSize(piece), cframe, color)
	-- eje de la bisagra = eje X de las Attachments, girado para que apunte hacia arriba
	local a0 = Instance.new("Attachment")
	a0.CFrame = CFrame.Angles(0, 0, math.pi / 2)
	a0.Parent = hub
	local a1 = Instance.new("Attachment")
	a1.CFrame = CFrame.Angles(0, 0, math.pi / 2)
	a1.Parent = bar
	local hinge = Instance.new("HingeConstraint")
	hinge.Attachment0 = a0
	hinge.Attachment1 = a1
	hinge.ActuatorType = Enum.ActuatorType.Motor
	hinge.AngularVelocity = piece.speed
	hinge.MotorMaxTorque = 1e8
	hinge.Parent = bar
	-- un punto de color en el centro para ver que gira
	local dot =
		anchored(folder, "Dot", Vector3.new(1.4, 0.2, 1.4), cframe * CFrame.new(0, piece.size[2] / 2 + 0.1, 0), WHITE)
	dot.CanCollide = false
	dot.Anchored = false
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = bar
	weld.Part1 = dot
	weld.Parent = dot
	bar.Anchored = false
	table.insert(built.physics, bar)
end

local function buildPiece(folder: Instance, piece: Stages.Piece, zone: Config.ZoneDef, built: Built)
	local c = TowerBuilder.Colors
	local base = rgb(zone.color)
	local accent = rgb(zone.accent)
	local size = pieceSize(piece)
	local cframe = pieceCFrame(piece)
	local o = Config.Obstacles
	local kind = piece.kind
	if kind == "beam" then
		anchored(folder, "Beam", size, cframe, base:Lerp(BLACK, 0.18))
	elseif kind == "jelly" then
		local part = anchored(folder, "Jelly", size, cframe, base:Lerp(WHITE, 0.25), Enum.Material.Glass)
		part.Transparency = 0.25
		table.insert(built.jelly, timed(part, piece.delay, o.jellyRespawn))
	elseif kind == "bounce" or kind == "trampoline" then
		local diameter = math.min(size.X, size.Z)
		local isTrampoline = kind == "trampoline"
		local part = anchored(
			folder,
			if isTrampoline then "Trampoline" else "Bounce",
			Vector3.new(size.Y, diameter, diameter),
			cframe * CFrame.Angles(0, 0, math.pi / 2),
			if isTrampoline then c.pink else accent,
			Enum.Material.Neon
		)
		part.Shape = Enum.PartType.Cylinder
		part:SetAttribute("Launch", piece.launch)
		if isTrampoline then
			local ring = anchored(
				folder,
				"TrampolineRing",
				Vector3.new(size.Y * 0.6, diameter + 1, diameter + 1),
				cframe * CFrame.new(0, -size.Y * 0.3, 0) * CFrame.Angles(0, 0, math.pi / 2),
				c.ink
			)
			ring.Shape = Enum.PartType.Cylinder
		end
	elseif kind == "conveyor" then
		local part = anchored(folder, "Conveyor", size, cframe, c.ink, Enum.Material.DiamondPlate)
		part.AssemblyLinearVelocity = forwardOf(piece) * piece.speed
		-- bandas de color a los lados: verde = te ayuda, amarillo = va en contra
		local railColor = if piece.speed > 0 then c.grass else c.sun
		for _, side in { -1, 1 } do
			local offset = lateralOf(piece) * side * (piece.width / 2 + 0.3)
			local rail = anchored(
				folder,
				"Rail",
				stripe(piece, piece.length, 0.6) - lateralOf(piece):Abs() * (piece.width - 0.6),
				cframe + offset + Vector3.new(0, size.Y / 2, 0),
				railColor,
				Enum.Material.Neon
			)
			rail.CanCollide = false
			rail.CanTouch = false
		end
	elseif kind == "vanish" then
		local part = anchored(folder, "Vanish", size, cframe, accent)
		part.Transparency = 0.05
		table.insert(built.vanish, timed(part, piece.delay, o.vanishRespawn))
	elseif kind == "moving" then
		buildMoving(folder, piece, accent:Lerp(WHITE, 0.15), built)
	elseif kind == "rotating" then
		buildRotating(folder, piece, accent, built)
	elseif kind == "goo" then
		anchored(folder, "GooFloor", size, cframe, base:Lerp(BLACK, 0.1))
		local goo = anchored(
			folder,
			"Goo",
			stripe(piece, piece.gooLength, 0.4),
			cframe * CFrame.new(0, size.Y / 2 + 0.2, 0),
			c.goo,
			Enum.Material.Neon
		)
		local bubbles = Instance.new("ParticleEmitter")
		bubbles.Color = ColorSequence.new(c.goo)
		bubbles.Rate = 4
		bubbles.Lifetime = NumberRange.new(0.6, 1.2)
		bubbles.Speed = NumberRange.new(1, 3)
		bubbles.Size = NumberSequence.new(0.5)
		bubbles.Parent = goo
		table.insert(built.goo, goo)
	else
		anchored(folder, "Pad", size, cframe, base)
	end
end

local function buildCheckpoint(folder: Instance, index: number, position: { number }, zone: Config.ZoneDef): BasePart
	local t = Config.Tower
	local isFinish = index == t.stages + 1
	local color = if isFinish then TowerBuilder.Colors.sun else rgb(zone.accent)
	local part: BasePart
	if index == 1 then
		local spawnPad = Instance.new("SpawnLocation")
		spawnPad.Neutral = true
		spawnPad.Duration = 0
		part = spawnPad
	else
		part = Instance.new("Part")
	end
	part.Name = "Checkpoint" .. index
	part.Anchored = true
	part.Size = Vector3.new(t.padSize, 2, t.padSize)
	part.CFrame = CFrame.new(position[1], position[2] - 1, position[3])
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part:SetAttribute("Checkpoint", index)
	part.Parent = folder
	-- marco de neón: se ve desde lejos dónde está el siguiente
	local frame = anchored(
		folder,
		"CheckpointGlow",
		Vector3.new(t.padSize + 1, 1.4, t.padSize + 1),
		part.CFrame * CFrame.new(0, -0.4, 0),
		color:Lerp(WHITE, 0.4),
		Enum.Material.Neon
	)
	frame.CanCollide = false
	frame.CanTouch = false
	billboard(part, if isFinish then "🏆" else tostring(index), 6)
	return part
end

-- Columna central de gelatina: un tramo por zona, del primer checkpoint de la zona al primero de la siguiente.
local function buildCore(folder: Instance, tower: Stages.Tower)
	local t = Config.Tower
	for zoneIndex, zone in Config.Zones do
		local first = (zoneIndex - 1) * t.stagesPerZone + 1
		local last = math.min(zoneIndex * t.stagesPerZone + 1, #tower.checkpoints)
		local bottom = if zoneIndex == 1 then 0 else tower.checkpoints[first][2]
		local top = tower.checkpoints[last][2]
		if top > bottom then
			local core = anchored(
				folder,
				"Core" .. zone.id,
				Vector3.new(t.coreSize, top - bottom, t.coreSize),
				CFrame.new(0, (top + bottom) / 2, 0),
				rgb(zone.color),
				Enum.Material.Glass
			)
			core.Transparency = 0.3
			local band = anchored(
				folder,
				"Band",
				Vector3.new(t.coreSize + 1, 2, t.coreSize + 1),
				CFrame.new(0, top - 1, 0),
				rgb(zone.accent),
				Enum.Material.Neon
			)
			band.CanCollide = false
		end
	end
end

function TowerBuilder.build(tower: Stages.Tower): Built
	Workspace.Gravity = Config.Physics.gravity
	local c = TowerBuilder.Colors
	local built: Built = { checkpoints = {}, goo = {}, jelly = {}, vanish = {}, movers = {}, physics = {} }

	local map = Instance.new("Folder")
	map.Name = "Map"
	anchored(map, "Ground", Vector3.new(600, 1, 600), CFrame.new(0, -0.5, 0), c.grass, Enum.Material.Grass)

	local towerFolder = Instance.new("Folder")
	towerFolder.Name = "Tower"
	towerFolder.Parent = map
	buildCore(towerFolder, tower)

	for _, stage in tower.stages do
		local stageFolder = Instance.new("Folder")
		stageFolder.Name = "Stage" .. stage.index
		stageFolder.Parent = towerFolder
		local zone = Config.Zones[stage.zone]
		for _, piece in stage.pieces do
			buildPiece(stageFolder, piece, zone, built)
		end
	end

	local checkpoints = Instance.new("Folder")
	checkpoints.Name = "Checkpoints"
	checkpoints.Parent = towerFolder
	for index, position in tower.checkpoints do
		local zoneIndex = Stages.zoneOf(index, Config.Tower.stagesPerZone, #Config.Zones)
		table.insert(built.checkpoints, buildCheckpoint(checkpoints, index, position, Config.Zones[zoneIndex]))
	end

	-- en la cima: una nube Nuvolet sonriente y una corona
	local finish = tower.checkpoints[#tower.checkpoints]
	local finishPoint = Vector3.new(finish[1], finish[2], finish[3])
	local outward = Vector3.new(finish[1], 0, finish[3]).Unit
	local cloudCenter = finishPoint + Vector3.new(0, 20, 0) + outward * 10
	cloud(map, cloudCenter, 1.4, Vector3.new(0, cloudCenter.Y, 0))
	local crown = ball(map, "Crown", Vector3.new(4, 4, 4), CFrame.new(finishPoint + Vector3.new(0, 9, 0)), c.sun)
	crown.Material = Enum.Material.Neon

	-- decoración: árboles de caramelo y nubes alrededor de la torre (siempre las mismas)
	local treeColors = { c.pink, c.sky, c.sun, Color3.fromRGB(168, 120, 255) }
	local random = Random.new(7)
	for i = 1, 16 do
		local angle = (i / 16) * math.pi * 2
		local radius = random:NextNumber(95, 160)
		lollipopTree(
			map,
			Vector3.new(math.cos(angle) * radius, 0, math.sin(angle) * radius),
			treeColors[(i - 1) % 4 + 1]
		)
	end
	for i = 1, 18 do
		local angle = random:NextNumber(0, math.pi * 2)
		local radius = random:NextNumber(110, 170)
		local height = (i / 18) * tower.top + random:NextNumber(-10, 10)
		cloud(
			map,
			Vector3.new(math.cos(angle) * radius, height, math.sin(angle) * radius),
			random:NextNumber(1, 1.8),
			nil
		)
	end
	-- la nube de la entrada saluda junto al primer checkpoint
	local start = tower.checkpoints[1]
	cloud(map, Vector3.new(start[1] - 18, 14, start[3] - 18), 1.2, Vector3.new(start[1], 14, start[3]))

	map.Parent = Workspace
	for _, part in built.physics do
		part:SetNetworkOwner(nil)
	end
	return built
end

return TowerBuilder
