--!strict
-- Construye una gelatina con piezas (sin mallas subidas): cuerpo translúcido con un núcleo de neón, ojos con
-- brillo, mejillas y sonrisa. La especie añade orejas, pinchos, patitas o un brote; la rareza da el color, una luz
-- (Rara o más), destellos (Legendaria o más) y una corona (Mítica).
-- El modelo se construye en el origen mirando a -Z (la cara) y su pivote es el centro del cuerpo.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local WorldBuilder = require(script.Parent.WorldBuilder)

local PetBuilder = {}

PetBuilder.HEIGHT = 1.6 -- altura del centro del cuerpo sobre el suelo

local INK = Color3.fromRGB(30, 42, 58)
local WHITE = Color3.fromRGB(255, 255, 255)
local PINK = Color3.fromRGB(255, 150, 180)
local GOLD = Color3.fromRGB(255, 201, 77)
local LEAF = Color3.fromRGB(88, 194, 106)

local function finish(part: BasePart, material: Enum.Material, transparency: number)
	part.Material = material
	part.Transparency = transparency
	part.CanCollide = false
	part.CanTouch = false
	part.CastShadow = false
end

local function blob(model: Model, name: string, size: Vector3, cframe: CFrame, color: Color3): Part
	local part = WorldBuilder.ball(model, name, size, cframe, color)
	finish(part, Enum.Material.SmoothPlastic, 0)
	return part
end

local function block(model: Model, name: string, size: Vector3, cframe: CFrame, color: Color3): Part
	local part = WorldBuilder.anchored(model, name, size, cframe, color)
	finish(part, Enum.Material.SmoothPlastic, 0)
	return part
end

local function jelly(part: BasePart)
	part.Material = Enum.Material.Glass
	part.Transparency = 0.25
end

local function lighter(color: Color3): Color3
	return color:Lerp(WHITE, 0.45)
end

local function addFace(model: Model)
	for _, side in { -1, 1 } do
		blob(model, "Eye", Vector3.new(0.5, 0.62, 0.3), CFrame.new(side * 0.6, 0.35, -1.42), INK)
		local shine =
			blob(model, "Shine", Vector3.new(0.18, 0.18, 0.1), CFrame.new(side * 0.6 + 0.1, 0.5, -1.58), WHITE)
		shine.Material = Enum.Material.Neon
		blob(model, "Cheek", Vector3.new(0.45, 0.28, 0.14), CFrame.new(side * 1.0, 0.0, -1.22), PINK)
	end
	blob(model, "Mouth", Vector3.new(0.5, 0.18, 0.14), CFrame.new(0, -0.12, -1.56), INK)
end

local function addSpecies(model: Model, speciesId: string, color: Color3)
	if speciesId == "Bunny" then
		for _, side in { -1, 1 } do
			local ear = blob(
				model,
				"Ear",
				Vector3.new(0.55, 1.8, 0.45),
				CFrame.new(side * 0.55, 1.9, 0) * CFrame.Angles(0, 0, -side * 0.2),
				color
			)
			jelly(ear)
		end
	elseif speciesId == "Kitty" then
		for _, side in { -1, 1 } do
			local ear = block(
				model,
				"Ear",
				Vector3.new(0.8, 0.8, 0.3),
				CFrame.new(side * 0.75, 1.2, 0) * CFrame.Angles(0, 0, math.rad(45)),
				color
			)
			jelly(ear)
		end
	elseif speciesId == "Dino" then
		local spikes = { { 1.35, 0.3 }, { 1.12, 0.95 }, { 0.7, 1.42 } }
		for _, spike in spikes do
			block(
				model,
				"Spike",
				Vector3.new(0.25, 0.6, 0.6),
				CFrame.new(0, spike[1], spike[2]) * CFrame.Angles(math.rad(45), 0, 0),
				color:Lerp(INK, 0.25)
			)
		end
		local tail = blob(model, "Tail", Vector3.new(0.7, 0.7, 1.2), CFrame.new(0, -0.8, 1.7), color)
		jelly(tail)
	elseif speciesId == "Octo" then
		for _, x in { -0.8, 0.8 } do
			for _, z in { -0.6, 0.8 } do
				local leg = blob(model, "Leg", Vector3.new(0.7, 0.9, 0.7), CFrame.new(x, -1.2, z), color)
				jelly(leg)
			end
		end
	elseif speciesId == "Sprout" then
		local stem = block(
			model,
			"Stem",
			Vector3.new(0.9, 0.2, 0.2),
			CFrame.new(0, 1.75, 0) * CFrame.Angles(0, 0, math.pi / 2),
			LEAF
		)
		stem.Shape = Enum.PartType.Cylinder
		for _, side in { -1, 1 } do
			blob(
				model,
				"Leaf",
				Vector3.new(0.9, 0.25, 0.5),
				CFrame.new(side * 0.35, 2.2, 0) * CFrame.Angles(0, 0, side * 0.4),
				LEAF
			)
		end
	else -- Blob: un rizo en la cabeza
		local curl = blob(model, "Curl", Vector3.new(0.8, 0.6, 0.8), CFrame.new(0, 1.3, 0), color)
		jelly(curl)
	end
end

local function addRarity(model: Model, core: BasePart, rarityIndex: number, color: Color3)
	if rarityIndex >= 3 then
		local light = Instance.new("PointLight")
		light.Color = color
		light.Range = 6 + rarityIndex * 1.5
		light.Brightness = 0.6 + rarityIndex * 0.2
		light.Parent = core
	end
	if rarityIndex >= 5 then
		local sparkles = Instance.new("Sparkles")
		sparkles.SparkleColor = lighter(color)
		sparkles.Parent = core
	end
	if rarityIndex >= #Config.Rarities then
		local ring = block(
			model,
			"Crown",
			Vector3.new(0.45, 1.3, 1.3),
			CFrame.new(0, 1.45, 0) * CFrame.Angles(0, 0, math.pi / 2),
			GOLD
		)
		ring.Shape = Enum.PartType.Cylinder
		ring.Material = Enum.Material.Neon
		for i = 0, 2 do
			local angle = i * math.pi * 2 / 3
			local gem = blob(
				model,
				"CrownGem",
				Vector3.new(0.35, 0.35, 0.35),
				CFrame.new(math.cos(angle) * 0.5, 1.85, math.sin(angle) * 0.5),
				GOLD
			)
			gem.Material = Enum.Material.Neon
		end
	end
end

-- Gelatina de la especie y rareza dadas: (modelo, cuerpo). Todas las piezas ancladas y soldadas al cuerpo, que es
-- también el PrimaryPart.
function PetBuilder.build(speciesId: string, rarityIndex: number): (Model, BasePart)
	local r = math.clamp(math.floor(rarityIndex), 1, #Config.Rarities)
	local color = WorldBuilder.rgb(Config.Rarities[r].color)

	local model = Instance.new("Model")
	model.Name = "JellyPet"

	local body = blob(model, "Body", Vector3.new(3.2, 2.8, 3.2), CFrame.new(), color)
	jelly(body)
	body.CastShadow = true
	body.CanQuery = true
	local core = blob(model, "Core", Vector3.new(1.8, 1.5, 1.8), CFrame.new(0, -0.2, 0), lighter(color))
	finish(core, Enum.Material.Neon, 0.35)

	addFace(model)
	addSpecies(model, speciesId, color)
	addRarity(model, core, r, color)

	for _, child in model:GetChildren() do
		if child ~= body and child:IsA("BasePart") then
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = body
			weld.Part1 = child
			weld.Parent = body
		end
	end
	model.PrimaryPart = body
	return model, body
end

-- Ancla (gelatina quieta o andando por código) o suelta (en brazos de un jugador: sin masa ni colisión).
function PetBuilder.setAnchored(model: Model, anchored: boolean)
	for _, item in model:GetDescendants() do
		if item:IsA("BasePart") then
			item.Anchored = anchored
			item.Massless = not anchored
			item.CanCollide = false
		end
	end
end

return PetBuilder
