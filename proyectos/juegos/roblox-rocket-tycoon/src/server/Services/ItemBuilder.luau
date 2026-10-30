--!strict
-- Construye con bloques lo que se compra en la base: extractores, escáneres, muros, cúpulas, la plataforma del
-- cohete y la decoración. Todo en coordenadas locales de la parcela (`origin`), sin mapas de Studio.
-- Cada modelo lleva el atributo Button = id del botón (el cliente lo usa para dibujar las rocas).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local WorldBuilder = require(script.Parent.WorldBuilder)

local ItemBuilder = {}

local C = WorldBuilder.Colors

-- Color de cada extractor según lo que vale su roca (de los baratos a los caros).
local DRILL_COLORS = {
	Color3.fromRGB(255, 160, 90),
	C.sun,
	C.grass,
	C.sky,
	C.purple,
	C.red,
	Color3.fromRGB(255, 120, 200),
	Color3.fromRGB(60, 220, 210),
}

local function drillIndex(def: Config.ButtonDef): number
	local n = 0
	for _, other in Config.Buttons do
		if other.kind == "dropper" then
			n += 1
			if other.id == def.id then
				return n
			end
		end
	end
	return 1
end

local function dropper(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	local belt = Config.Plot.belt
	local dir = if z < belt.z then 1 else -1 -- hacia la cinta
	local color = DRILL_COLORS[(drillIndex(def) - 1) % #DRILL_COLORS + 1]
	WorldBuilder.part(
		model,
		"Base",
		Vector3.new(7, 1, 7),
		origin * CFrame.new(x, 0.9, z),
		C.metal,
		Enum.Material.DiamondPlate
	)
	WorldBuilder.part(model, "Tower", Vector3.new(4.5, 7, 4.5), origin * CFrame.new(x, 4.9, z), color)
	local cap = WorldBuilder.ball(model, "Cap", Vector3.new(4.5, 3, 4.5), origin * CFrame.new(x, 8.4, z), C.cloud)
	cap.Material = Enum.Material.SmoothPlastic
	local light = WorldBuilder.part(
		model,
		"Light",
		Vector3.new(4.7, 0.6, 4.7),
		origin * CFrame.new(x, 6.6, z),
		C.sky,
		Enum.Material.Neon
	)
	light.CanCollide = false
	-- tolva hacia la cinta
	local chute = WorldBuilder.part(
		model,
		"Chute",
		Vector3.new(2.6, 0.6, 5),
		origin * CFrame.new(x, 4.6, z + dir * 4.4) * CFrame.Angles(dir * math.rad(-14), 0, 0),
		C.ink
	)
	chute.CanCollide = false
	-- broca que gira (solo se ve: no tiene física)
	local bit = WorldBuilder.part(
		model,
		"Bit",
		Vector3.new(1.4, 2.4, 1.4),
		origin * CFrame.new(x, 2.2, z - dir * 3.2),
		C.metal,
		Enum.Material.DiamondPlate
	)
	bit.CanCollide = false
end

local function upgrader(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x = def.at[1]
	local belt = Config.Plot.belt
	local span = belt.width / 2 + 1.4
	for _, side in { -1, 1 } do
		WorldBuilder.part(
			model,
			"Pillar",
			Vector3.new(1.6, 8, 1.6),
			origin * CFrame.new(x, 4.4, belt.z + side * span),
			C.metal,
			Enum.Material.DiamondPlate
		)
	end
	WorldBuilder.part(
		model,
		"Beam",
		Vector3.new(2.4, 1.6, span * 2 + 1.6),
		origin * CFrame.new(x, 8.6, belt.z),
		C.purple
	)
	local scanner = WorldBuilder.part(
		model,
		"Scanner",
		Vector3.new(0.4, 5, span * 2 - 1.6),
		origin * CFrame.new(x, 4.6, belt.z),
		C.purple,
		Enum.Material.ForceField
	)
	scanner.CanCollide = false
	scanner.CastShadow = false
	local label = WorldBuilder.part(
		model,
		"Badge",
		Vector3.new(0.4, 1, 1),
		origin * CFrame.new(x, 10, belt.z),
		C.sun,
		Enum.Material.Neon
	)
	label.CanCollide = false
	WorldBuilder.billboard(label, "×" .. tostring(def.multiplier or 1), UDim2.fromOffset(80, 40), 1.6)
end

local function wall(model: Model, origin: CFrame, def: Config.ButtonDef)
	local size = def.size or { 2, 2 }
	local h = 8
	WorldBuilder.part(
		model,
		"Wall",
		Vector3.new(size[1], h, size[2]),
		origin * CFrame.new(def.at[1], h / 2 + 0.4, def.at[2]),
		C.cloud,
		Enum.Material.SmoothPlastic
	)
	local top = WorldBuilder.part(
		model,
		"WallLight",
		Vector3.new(size[1] + 0.2, 0.5, size[2] + 0.2),
		origin * CFrame.new(def.at[1], h + 0.6, def.at[2]),
		C.sky,
		Enum.Material.Neon
	)
	top.CanCollide = false
end

local function dome(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	local d = def.radius * 2
	local ring = WorldBuilder.column(model, "Ring", 1, d + 1, origin * CFrame.new(x, 0.4, z), C.metal)
	ring.Material = Enum.Material.DiamondPlate
	local glass = WorldBuilder.ball(model, "Glass", Vector3.new(d, d * 0.8, d), origin * CFrame.new(x, 1.4, z), C.glass)
	glass.Material = Enum.Material.Glass
	glass.Transparency = 0.45
	glass.CastShadow = false
	-- dentro: un jardín y una lámpara
	local garden =
		WorldBuilder.ball(model, "Garden", Vector3.new(d * 0.5, 3, d * 0.5), origin * CFrame.new(x, 1.4, z), C.grass)
	garden.Material = Enum.Material.Grass
	local lamp = WorldBuilder.ball(model, "Lamp", Vector3.new(1.6, 1.6, 1.6), origin * CFrame.new(x, 5.5, z), C.sun)
	lamp.Material = Enum.Material.Neon
	local door = WorldBuilder.part(
		model,
		"Door",
		Vector3.new(3, 4.4, 1),
		origin * CFrame.new(x, 2.6, z + def.radius - 0.4),
		C.sun
	)
	door.CanCollide = false
	WorldBuilder.billboard(
		lamp,
		"+" .. tostring(math.floor((def.bonus or 0) * 100 + 0.5)) .. "%",
		UDim2.fromOffset(80, 40),
		6
	)
end

local function rocketPad(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	local d = def.radius * 2
	local pad = WorldBuilder.column(model, "LaunchPad", 0.8, d, origin * CFrame.new(x, 0.4, z), C.metal)
	pad.Material = Enum.Material.DiamondPlate
	local ring = WorldBuilder.column(model, "LaunchRing", 0.9, d * 0.55, origin * CFrame.new(x, 0.4, z), C.sun)
	ring.Material = Enum.Material.Neon
	local inner = WorldBuilder.column(model, "LaunchInner", 1, d * 0.45, origin * CFrame.new(x, 0.4, z), C.ink)
	inner.Material = Enum.Material.SmoothPlastic
	-- torre de lanzamiento a un lado
	local tx, tz = x + def.radius - 2, z - def.radius + 2
	WorldBuilder.part(model, "Tower", Vector3.new(2, 16, 2), origin * CFrame.new(tx, 8.4, tz), C.red)
	for i = 1, 3 do
		WorldBuilder.part(
			model,
			"TowerArm",
			Vector3.new(3, 0.6, 0.6),
			origin * CFrame.new(tx - 1.5, 4 * i + 1, tz),
			C.cloud
		)
	end
	local beacon =
		WorldBuilder.ball(model, "Beacon", Vector3.new(1.4, 1.4, 1.4), origin * CFrame.new(tx, 17, tz), C.red)
	beacon.Material = Enum.Material.Neon
end

local function flag(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	WorldBuilder.column(model, "Pole", 12, 0.5, origin * CFrame.new(x, 0.4, z), C.cloud)
	local cloth =
		WorldBuilder.part(model, "Flag", Vector3.new(5, 3.2, 0.2), origin * CFrame.new(x + 2.6, 10.6, z), C.sky)
	cloth.CanCollide = false
	local star = WorldBuilder.ball(
		model,
		"Star",
		Vector3.new(1.4, 1.4, 0.3),
		origin * CFrame.new(x + 2.6, 10.6, z + 0.15),
		C.sun
	)
	star.Material = Enum.Material.Neon
	star.CanCollide = false
end

local function lamps(model: Model, origin: CFrame, def: Config.ButtonDef)
	for _, dx in { -32, -16, 16, 32 } do
		local x, z = def.at[1] + dx, def.at[2]
		WorldBuilder.column(model, "LampPost", 7, 0.6, origin * CFrame.new(x, 0.4, z), C.metal)
		local bulb = WorldBuilder.ball(model, "Bulb", Vector3.new(1.8, 1.8, 1.8), origin * CFrame.new(x, 8, z), C.sun)
		bulb.Material = Enum.Material.Neon
		local light = Instance.new("PointLight")
		light.Color = C.sun
		light.Range = 18
		light.Brightness = 1.2
		light.Parent = bulb
	end
end

local function dish(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	WorldBuilder.column(model, "DishBase", 4, 2, origin * CFrame.new(x, 0.4, z), C.metal)
	local bowl = WorldBuilder.ball(
		model,
		"Dish",
		Vector3.new(8, 2, 8),
		origin * CFrame.new(x, 5.6, z) * CFrame.Angles(math.rad(-35), math.rad(45), 0),
		C.cloud
	)
	bowl.Material = Enum.Material.SmoothPlastic
	local tip = WorldBuilder.ball(
		model,
		"Tip",
		Vector3.new(0.8, 0.8, 0.8),
		origin * CFrame.new(x, 5.6, z) * CFrame.Angles(math.rad(-35), math.rad(45), 0) * CFrame.new(0, 2.5, 0),
		C.red
	)
	tip.Material = Enum.Material.Neon
end

local function observatory(model: Model, origin: CFrame, def: Config.ButtonDef)
	local x, z = def.at[1], def.at[2]
	local d = def.radius * 2
	local base = WorldBuilder.column(model, "Base", 6, d, origin * CFrame.new(x, 0.4, z), C.cloud)
	base.Material = Enum.Material.SmoothPlastic
	local top =
		WorldBuilder.ball(model, "Dome", Vector3.new(d - 1, d * 0.8, d - 1), origin * CFrame.new(x, 6.4, z), C.metal)
	top.Material = Enum.Material.DiamondPlate
	WorldBuilder.part(model, "Slit", Vector3.new(2, 6, d * 0.42), origin * CFrame.new(x, 9.4, z + d * 0.2), C.ink)
	local scope = WorldBuilder.column(
		model,
		"Telescope",
		10,
		1.8,
		origin * CFrame.new(x, 8, z + 2) * CFrame.Angles(math.rad(50), 0, 0),
		C.sun
	)
	scope.CanCollide = false
	local band = WorldBuilder.column(model, "Band", 0.6, d + 0.2, origin * CFrame.new(x, 5.9, z), C.purple)
	band.Material = Enum.Material.Neon
	band.CanCollide = false
end

local DECOS: { [string]: (Model, CFrame, Config.ButtonDef) -> () } = {
	flag = flag,
	lamps = lamps,
	dish = dish,
	observatory = observatory,
}

local BUILDERS: { [string]: (Model, CFrame, Config.ButtonDef) -> () } = {
	dropper = dropper,
	upgrader = upgrader,
	wall = wall,
	dome = dome,
	rocket = rocketPad,
}

-- Construye el objeto del botón `def` en la parcela con origen `origin`, dentro de `parent`.
function ItemBuilder.build(parent: Instance, origin: CFrame, def: Config.ButtonDef): Model
	local model = Instance.new("Model")
	model.Name = def.id
	model:SetAttribute("Button", def.id)
	model:SetAttribute("Kind", def.kind)
	local builder = if def.kind == "deco" then DECOS[def.id] else BUILDERS[def.kind]
	if builder then
		builder(model, origin, def)
	else
		-- decoración sin modelo propio: un pequeño monolito
		WorldBuilder.part(model, "Marker", Vector3.new(2, 4, 2), origin * CFrame.new(def.at[1], 2.4, def.at[2]), C.sun)
	end
	model.Parent = parent
	return model
end

-- Baldosa de compra: icono y precio encima. Se pisa para comprar.
function ItemBuilder.pad(parent: Instance, origin: CFrame, def: Config.ButtonDef, price: string): Part
	local s = Config.Plot.padSize
	local pad = WorldBuilder.part(
		parent,
		def.id,
		Vector3.new(s, 0.5, s),
		origin * CFrame.new(def.pad[1], 0.65, def.pad[2]),
		C.grass,
		Enum.Material.Neon
	)
	pad.CanCollide = false
	pad:SetAttribute("Button", def.id)
	local rim = WorldBuilder.part(
		pad,
		"Rim",
		Vector3.new(s + 1, 0.3, s + 1),
		origin * CFrame.new(def.pad[1], 0.55, def.pad[2]),
		C.ink
	)
	rim.CanCollide = false
	WorldBuilder.billboard(pad, def.icon .. " " .. price, UDim2.fromOffset(170, 56), 3.5)
	return pad
end

return ItemBuilder
