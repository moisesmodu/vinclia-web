--!strict
-- Geometría de las zonas (Pueblo → Parque → Pueblo de esquí → Polo Norte) y reglas para abrirlas. Puro.
-- Las zonas van una detrás de otra por el eje Z: la zona i ocupa z ∈ [(i-1)·L, i·L] y x ∈ [-W/2, W/2].

local Zones = {}

export type WorldParams = {
	zoneWidth: number,
	zoneLength: number,
	margin: number,
	depotRadius: number,
	depotInsetX: number,
	depotInsetZ: number,
	centerRadius: number,
	spawnZ: number,
}

export type Bounds = { minX: number, maxX: number, minZ: number, maxZ: number }

export type Circle = { x: number, z: number, r: number }

export type SnowArea = {
	minX: number,
	maxX: number,
	minZ: number,
	maxZ: number,
	avoid: { Circle },
}

export type ZoneRule = { cost: number, minRebirths: number }

-- Lo que pide un jugador: abrir la zona `target` teniendo abiertas de la 1 a la `unlocked`.
export type UnlockRequest = {
	unlocked: number,
	target: number,
	count: number, -- número de zonas que hay
	coins: number,
	rebirths: number,
}

export type UnlockResult = "ok" | "owned" | "order" | "rebirths" | "coins" | "invalid"

function Zones.bounds(index: number, world: WorldParams): Bounds
	local half = world.zoneWidth / 2
	local minZ = (index - 1) * world.zoneLength
	return { minX = -half, maxX = half, minZ = minZ, maxZ = minZ + world.zoneLength }
end

-- Zona en la que está una posición z (fuera del mapa cuenta la más cercana).
function Zones.indexAt(z: number, world: WorldParams, count: number): number
	return math.clamp(math.floor(z / world.zoneLength) + 1, 1, math.max(count, 1))
end

-- Centro del depósito de nieve de la zona (cerca de su entrada, a la izquierda).
function Zones.depot(index: number, world: WorldParams): (number, number)
	local b = Zones.bounds(index, world)
	return b.minX + world.depotInsetX, b.minZ + world.depotInsetZ
end

function Zones.center(index: number, world: WorldParams): (number, number)
	local b = Zones.bounds(index, world)
	return 0, (b.minZ + b.maxZ) / 2
end

-- Punto de llegada al entrar o teletransportarse a una zona (junto a su depósito).
function Zones.arrival(index: number, world: WorldParams): (number, number)
	local x, z = Zones.depot(index, world)
	return x + world.depotRadius + 6, z
end

-- Dónde pueden salir montones: la zona menos el margen, sin el depósito, el centro ni la llegada.
function Zones.snowArea(index: number, world: WorldParams): SnowArea
	local b = Zones.bounds(index, world)
	local dx, dz = Zones.depot(index, world)
	local cx, cz = Zones.center(index, world)
	local ax, az = Zones.arrival(index, world)
	local avoid: { Circle } = {
		{ x = dx, z = dz, r = world.depotRadius + 4 },
		{ x = cx, z = cz, r = world.centerRadius },
		{ x = ax, z = az, r = 6 },
	}
	if index == 1 then
		table.insert(avoid, { x = 0, z = world.spawnZ, r = 10 })
	end
	return {
		minX = b.minX + world.margin,
		maxX = b.maxX - world.margin,
		minZ = b.minZ + world.margin,
		maxZ = b.maxZ - world.margin,
		avoid = avoid,
	}
end

-- ¿Puede el jugador estar (y recoger nieve) en la zona `index`?
function Zones.isAllowed(index: number, unlocked: number): boolean
	return index >= 1 and index <= unlocked
end

local function check(request: UnlockRequest, rule: ZoneRule): UnlockResult
	local target = request.target
	if target ~= math.floor(target) or target < 1 or target > request.count then
		return "invalid"
	end
	if target <= request.unlocked then
		return "owned"
	end
	if target ~= request.unlocked + 1 then
		return "order"
	end
	if request.rebirths < rule.minRebirths then
		return "rebirths"
	end
	if request.coins < rule.cost then
		return "coins"
	end
	return "ok"
end

-- Se abren en orden, una a una; cada una pide monedas y, la última, haber renacido.
function Zones.canUnlock(request: UnlockRequest, rule: ZoneRule?): UnlockResult
	if rule then
		return check(request, rule)
	end
	return "invalid"
end

return Zones
