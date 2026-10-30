--!strict
-- Cuentas de la pala y la mochila: ancho de pala, capacidad, velocidad, cuánta nieve cabe, cuánto vale y cuánto
-- se cobra al descargar. Puro: recibe la configuración como argumento (pruebas con Lune).

local Collection = {}

export type PlowParams = {
	baseBlade: number,
	bladePerLevel: number,
	bladeDepth: number,
	baseCapacity: number,
	capacityGrowth: number,
	bigBackpackMultiplier: number,
	baseSpeed: number,
	speedPerLevel: number,
	autoUnloadBase: number,
	autoUnloadPerLevel: number,
	doubleSnowMultiplier: number,
}

local function level(n: number): number
	return math.max(math.floor(n), 0)
end

-- Ancho de la pala (studs).
function Collection.bladeWidth(bladeLevel: number, params: PlowParams): number
	return params.baseBlade + level(bladeLevel) * params.bladePerLevel
end

-- Unidades de nieve que caben en la mochila.
function Collection.capacity(capacityLevel: number, hasBigBackpack: boolean, params: PlowParams): number
	local base = math.floor(params.baseCapacity * params.capacityGrowth ^ level(capacityLevel) + 0.5)
	return if hasBigBackpack then base * params.bigBackpackMultiplier else base
end

function Collection.walkSpeed(speedLevel: number, params: PlowParams): number
	return params.baseSpeed + level(speedLevel) * params.speedPerLevel
end

-- Parte del valor que se cobra al descargar sola la mochila llena (0 = sin mejora: hay que ir al depósito).
function Collection.autoUnloadRate(autoLevel: number, params: PlowParams): number
	local n = level(autoLevel)
	if n == 0 then
		return 0
	end
	return math.min(1, params.autoUnloadBase + (n - 1) * params.autoUnloadPerLevel)
end

-- Cuántas unidades de un montón de `amount` caben en una mochila con `snow` de `capacity`.
function Collection.take(amount: number, snow: number, capacity: number): number
	return math.clamp(math.min(amount, capacity - snow), 0, math.max(amount, 0))
end

function Collection.isFull(snow: number, capacity: number): boolean
	return snow >= capacity
end

-- Monedas que valen `units` de nieve de una zona: valor de la zona · (1 + compañeros) · (2 con el pase).
function Collection.snowValue(
	units: number,
	zoneValue: number,
	buddyBoost: number,
	hasDoubleSnow: boolean,
	params: PlowParams
): number
	local double = if hasDoubleSnow then params.doubleSnowMultiplier else 1
	return units * zoneValue * (1 + math.max(buddyBoost, 0)) * double
end

-- Monedas al descargar: valor acumulado · multiplicador de renacer · parte que se cobra (1 en el depósito).
function Collection.unloadCoins(value: number, rebirthMultiplier: number, rate: number): number
	return math.max(0, math.floor(value * math.max(rebirthMultiplier, 1) * math.clamp(rate, 0, 1)))
end

-- ¿Toca la pala un montón? Coordenadas del montón en el espacio de la pala (x a la derecha, z hacia atrás, la
-- pala centrada en 0): un rectángulo de `halfWidth` × `depth` ampliado con el radio del montón.
function Collection.inBlade(localX: number, localZ: number, halfWidth: number, depth: number, radius: number): boolean
	return math.abs(localX) <= halfWidth + radius and math.abs(localZ) <= depth / 2 + radius
end

-- Pase Imán: ¿está el montón a menos de `magnetRadius` (en horizontal)?
function Collection.inMagnet(dx: number, dz: number, magnetRadius: number): boolean
	return dx * dx + dz * dz <= magnetRadius * magnetRadius
end

-- ¿Es posible ese movimiento entre dos vistazos? (antitrampas: teletransportes o velocidades imposibles)
function Collection.plausibleMove(
	distance: number,
	seconds: number,
	speed: number,
	slack: number,
	extra: number
): boolean
	return distance <= speed * math.max(seconds, 0) * slack + extra
end

return Collection
