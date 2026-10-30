--!strict
-- Montones de nieve: los crea el servidor con el reparto determinista de SnowLayout (siempre el mismo pueblo),
-- los encoge o los quita cuando una pala los recoge y los hace volver a salir pasado un rato (más rápido durante
-- una Tormenta). Los montones no chocan con nadie: solo son lo que la pala recoge.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Rng = require(ReplicatedStorage.Shared.Rng)
local SnowLayout = require(ReplicatedStorage.Shared.SnowLayout)
local Zones = require(ReplicatedStorage.Shared.Zones)

export type Pile = {
	part: Part,
	zone: number,
	x: number,
	z: number,
	size: number, -- unidades de nieve del montón entero
	amount: number, -- unidades que le quedan
	radius: number, -- radio actual (studs)
	active: boolean,
	respawnAt: number,
}

local SnowService = {}

local byZone: { [number]: { Pile } } = {}
local stormUntil = 0

local SNOW_COLOR = Color3.fromRGB(250, 252, 255)
local GROW = TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

local function sizeFor(amount: number): Vector3
	local d = 2 + amount * 1.1
	return Vector3.new(d, d * 0.55, d)
end

local function shape(pile: Pile)
	local size = sizeFor(pile.amount)
	pile.part.Size = size
	pile.part.CFrame = CFrame.new(pile.x, size.Y * 0.3, pile.z)
	pile.radius = size.X / 2
end

local function newPart(folder: Folder): Part
	local part = Instance.new("Part")
	part.Name = "Pile"
	part.Anchored = true
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.CastShadow = false
	part.Material = Enum.Material.Snow
	part.Color = SNOW_COLOR
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = part
	part.Parent = folder
	return part
end

function SnowService.build(folder: Folder)
	for index, zone in Config.Zones do
		local area = Zones.snowArea(index, Config.World)
		local layout = SnowLayout.generate({
			minX = area.minX,
			maxX = area.maxX,
			minZ = area.minZ,
			maxZ = area.maxZ,
			count = zone.piles,
			minSpacing = Config.Snow.minSpacing,
			minSize = Config.Snow.minSize,
			maxSize = Config.Snow.maxSize,
			maxTries = Config.Snow.maxTries,
			avoid = area.avoid,
		}, Rng.new(zone.seed))
		local list: { Pile } = {}
		for _, spot in layout do
			local pile: Pile = {
				part = newPart(folder),
				zone = index,
				x = spot.x,
				z = spot.z,
				size = spot.size,
				amount = spot.size,
				radius = 0,
				active = true,
				respawnAt = 0,
			}
			shape(pile)
			table.insert(list, pile)
		end
		byZone[index] = list
	end
end

function SnowService.pilesIn(zone: number): { Pile }
	return byZone[zone] or {}
end

function SnowService.stormActive(): boolean
	return Workspace:GetServerTimeNow() < stormUntil
end

-- Quita `units` del montón. Si se acaba, desaparece y vuelve a salir más tarde.
function SnowService.take(pile: Pile, units: number)
	pile.amount = math.max(pile.amount - units, 0)
	if pile.amount <= 0 then
		local now = Workspace:GetServerTimeNow()
		pile.active = false
		pile.part.Transparency = 1
		pile.respawnAt = now
			+ SnowLayout.respawnDelay(Config.Snow.respawnSeconds, stormUntil, now, Config.SnowStorm.respawnFactor)
	else
		shape(pile)
	end
end

-- Tormenta (producto): durante `duration` segundos la nieve vuelve 3× más rápido en este servidor. Se acumula.
function SnowService.startStorm(duration: number)
	local now = Workspace:GetServerTimeNow()
	stormUntil = math.max(stormUntil, now) + duration
	Workspace:SetAttribute("StormUntil", stormUntil)
	local soon = now + Config.Snow.respawnSeconds / Config.SnowStorm.respawnFactor
	for _, list in byZone do
		for _, pile in list do
			if not pile.active then
				pile.respawnAt = math.min(pile.respawnAt, soon)
			end
		end
	end
end

local function respawn(pile: Pile)
	pile.amount = pile.size
	pile.active = true
	shape(pile)
	local target = pile.part.Size
	pile.part.Size = target * 0.2
	pile.part.Transparency = 0
	TweenService:Create(pile.part, GROW, { Size = target }):Play()
end

function SnowService.start()
	task.spawn(function()
		while true do
			task.wait(0.5)
			local now = Workspace:GetServerTimeNow()
			for _, list in byZone do
				for _, pile in list do
					if not pile.active and now >= pile.respawnAt then
						respawn(pile)
					end
				end
			end
		end
	end)
end

return SnowService
