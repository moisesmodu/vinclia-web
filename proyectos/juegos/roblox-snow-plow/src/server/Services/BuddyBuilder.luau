--!strict
-- Compañeros de nieve hechos con piezas (sin mallas subidas): muñeco de nieve, pingüino, búho, zorro ártico,
-- reno y oso polar. La especie da la forma; la rareza, el color de la bufanda, y desde Épico, luz y destellos.
-- Devuelve un Model cuya pieza raíz (Body) no está anclada: BuddyService la hace seguir al jugador.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local BuddyBuilder = {}

local INK = Color3.fromRGB(30, 42, 58)
local WHITE = Color3.fromRGB(248, 250, 255)
local ORANGE = Color3.fromRGB(255, 140, 40)
local BROWN = Color3.fromRGB(150, 98, 60)

type Builder = {
	model: Model,
	body: Part,
}

local function rgb(color: { number }): Color3
	return Color3.fromRGB(color[1] or 255, color[2] or 255, color[3] or 255)
end

local function basePart(name: string, size: Vector3, offset: Vector3, color: Color3, ball: boolean): Part
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.CFrame = CFrame.new(offset)
	part.Color = color
	part.Material = Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.CastShadow = false
	if ball then
		local mesh = Instance.new("SpecialMesh")
		mesh.MeshType = Enum.MeshType.Sphere
		mesh.Parent = part
	end
	return part
end

-- Añade una pieza soldada al cuerpo, en coordenadas locales del cuerpo (delante = -Z).
local function add(b: Builder, name: string, size: Vector3, offset: Vector3, color: Color3, ball: boolean): Part
	local part = basePart(name, size, offset, color, ball)
	part.Massless = true
	part.Parent = b.model
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = b.body
	weld.Part1 = part
	weld.Parent = part
	return part
end

local function eyes(b: Builder, y: number, z: number, spread: number, size: number)
	for _, side in { -1, 1 } do
		add(b, "Eye", Vector3.new(size, size, size * 0.6), Vector3.new(side * spread, y, z), INK, true)
	end
end

local function scarf(b: Builder, y: number, width: number, color: Color3)
	add(b, "Scarf", Vector3.new(width, 0.3, width), Vector3.new(0, y, 0), color, true)
end

local function snowman(b: Builder, accent: Color3)
	add(b, "Head", Vector3.new(1.2, 1.2, 1.2), Vector3.new(0, 1.15, 0), WHITE, true)
	eyes(b, 1.3, -0.5, 0.22, 0.2)
	add(b, "Nose", Vector3.new(0.18, 0.18, 0.6), Vector3.new(0, 1.15, -0.75), ORANGE, false)
	scarf(b, 0.6, 1.3, accent)
	add(b, "Hat", Vector3.new(0.8, 0.7, 0.8), Vector3.new(0, 1.9, 0), INK, false)
end

local function penguin(b: Builder, accent: Color3)
	add(b, "Belly", Vector3.new(1.1, 1.4, 0.6), Vector3.new(0, -0.05, -0.45), WHITE, true)
	add(b, "Head", Vector3.new(1.1, 1.0, 1.0), Vector3.new(0, 1.05, 0), INK, true)
	add(b, "Face", Vector3.new(0.8, 0.6, 0.4), Vector3.new(0, 1.0, -0.38), WHITE, true)
	eyes(b, 1.15, -0.55, 0.2, 0.16)
	add(b, "Beak", Vector3.new(0.3, 0.15, 0.4), Vector3.new(0, 0.95, -0.65), ORANGE, false)
	for _, side in { -1, 1 } do
		add(b, "Foot", Vector3.new(0.4, 0.12, 0.5), Vector3.new(side * 0.3, -0.85, -0.2), ORANGE, false)
	end
	scarf(b, 0.55, 1.15, accent)
end

local function owl(b: Builder, accent: Color3)
	for _, side in { -1, 1 } do
		add(
			b,
			"EyeRing",
			Vector3.new(0.55, 0.55, 0.2),
			Vector3.new(side * 0.28, 0.45, -0.65),
			Color3.fromRGB(255, 220, 120),
			true
		)
		add(b, "Ear", Vector3.new(0.25, 0.5, 0.25), Vector3.new(side * 0.45, 1.1, 0), WHITE, false)
		add(b, "Wing", Vector3.new(0.3, 1.0, 0.9), Vector3.new(side * 0.75, -0.05, 0.05), accent, true)
	end
	eyes(b, 0.45, -0.75, 0.28, 0.22)
	add(b, "Beak", Vector3.new(0.18, 0.25, 0.25), Vector3.new(0, 0.15, -0.72), ORANGE, false)
end

local function fox(b: Builder, accent: Color3)
	add(b, "Head", Vector3.new(1.0, 0.9, 0.9), Vector3.new(0, 0.7, -0.8), WHITE, true)
	add(b, "Snout", Vector3.new(0.35, 0.3, 0.5), Vector3.new(0, 0.6, -1.3), WHITE, true)
	add(b, "Nose", Vector3.new(0.14, 0.14, 0.14), Vector3.new(0, 0.66, -1.55), INK, true)
	eyes(b, 0.85, -1.2, 0.22, 0.14)
	for _, side in { -1, 1 } do
		add(b, "Ear", Vector3.new(0.25, 0.45, 0.15), Vector3.new(side * 0.3, 1.25, -0.75), WHITE, false)
	end
	add(b, "Tail", Vector3.new(0.6, 0.6, 1.3), Vector3.new(0, 0.35, 1.2), WHITE, true)
	add(b, "TailTip", Vector3.new(0.45, 0.45, 0.5), Vector3.new(0, 0.45, 1.75), accent, true)
	scarf(b, 0.35, 1.0, accent)
end

local function reindeer(b: Builder, accent: Color3)
	add(b, "Head", Vector3.new(0.9, 0.9, 1.0), Vector3.new(0, 0.95, -0.8), BROWN, true)
	local nose =
		add(b, "Nose", Vector3.new(0.3, 0.3, 0.3), Vector3.new(0, 0.85, -1.35), Color3.fromRGB(230, 60, 60), true)
	nose.Material = Enum.Material.Neon
	eyes(b, 1.1, -1.2, 0.22, 0.14)
	for _, side in { -1, 1 } do
		add(
			b,
			"Antler",
			Vector3.new(0.12, 0.7, 0.12),
			Vector3.new(side * 0.3, 1.6, -0.7),
			Color3.fromRGB(230, 200, 150),
			false
		)
		add(
			b,
			"AntlerTip",
			Vector3.new(0.5, 0.12, 0.12),
			Vector3.new(side * 0.45, 1.85, -0.7),
			Color3.fromRGB(230, 200, 150),
			false
		)
		for _, z in { -0.4, 0.4 } do
			add(b, "Leg", Vector3.new(0.2, 0.6, 0.2), Vector3.new(side * 0.3, -0.6, z), BROWN, false)
		end
	end
	scarf(b, 0.5, 1.0, accent)
end

local function bear(b: Builder, accent: Color3)
	add(b, "Head", Vector3.new(1.0, 0.95, 0.95), Vector3.new(0, 0.85, -0.75), WHITE, true)
	add(b, "Snout", Vector3.new(0.45, 0.35, 0.35), Vector3.new(0, 0.75, -1.2), WHITE, true)
	add(b, "Nose", Vector3.new(0.18, 0.14, 0.14), Vector3.new(0, 0.85, -1.38), INK, true)
	eyes(b, 1.0, -1.15, 0.25, 0.14)
	for _, side in { -1, 1 } do
		add(b, "Ear", Vector3.new(0.3, 0.3, 0.2), Vector3.new(side * 0.38, 1.3, -0.7), WHITE, true)
	end
	scarf(b, 0.4, 1.2, accent)
end

-- Construye un compañero. `rarity` 1..n según Config.BuddyRarities.
function BuddyBuilder.build(species: string, rarity: number): (Model, Part)
	local def = Config.BuddyRarities[math.clamp(math.floor(rarity), 1, #Config.BuddyRarities)]
	local accent = rgb(def.color)
	local model = Instance.new("Model")
	model.Name = "Buddy"

	local bodySize = Vector3.new(1.4, 1.4, 1.4)
	local bodyColor = WHITE
	if species == "Penguin" then
		bodySize = Vector3.new(1.3, 1.7, 1.2)
		bodyColor = INK
	elseif species == "Owl" then
		bodySize = Vector3.new(1.4, 1.8, 1.3)
	elseif species == "Fox" then
		bodySize = Vector3.new(1.0, 0.9, 1.6)
	elseif species == "Reindeer" then
		bodySize = Vector3.new(1.0, 1.0, 1.6)
		bodyColor = BROWN
	elseif species == "Bear" then
		bodySize = Vector3.new(1.5, 1.3, 1.9)
	end
	local body = basePart("Body", bodySize, Vector3.zero, bodyColor, true)
	body.CustomPhysicalProperties = PhysicalProperties.new(0.2, 0.3, 0, 1, 1)
	body.Parent = model
	model.PrimaryPart = body
	local b: Builder = { model = model, body = body }

	if species == "Penguin" then
		penguin(b, accent)
	elseif species == "Owl" then
		owl(b, accent)
	elseif species == "Fox" then
		fox(b, accent)
	elseif species == "Reindeer" then
		reindeer(b, accent)
	elseif species == "Bear" then
		bear(b, accent)
	else
		snowman(b, accent)
	end

	if rarity >= 4 then
		local light = Instance.new("PointLight")
		light.Color = accent
		light.Range = 8
		light.Brightness = 1.5
		light.Parent = body
	end
	if rarity >= 5 then
		local sparkles = Instance.new("Sparkles")
		sparkles.SparkleColor = accent
		sparkles.Parent = body
	end
	return model, body
end

return BuddyBuilder
