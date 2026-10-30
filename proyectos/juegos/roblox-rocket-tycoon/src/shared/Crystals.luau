--!strict
-- Asteroides y cristales. Puro: reparto con semilla de los asteroides de cada parcela (siempre al alcance del
-- cohete), de los cristales de la lluvia de meteoritos, tirada del tipo de cristal y reglas con las que el
-- servidor acepta o rechaza una recogida.

local Crystals = {}

export type Point = { x: number, y: number, z: number }

export type AsteroidParams = {
	count: number,
	minHeight: number,
	maxHeight: number,
	minPadDistance: number,
	minSpacing: number,
	radius: number,
	maxTries: number,
}

-- Zona de la parcela: |x|, |z| <= usable; la plataforma del cohete en (padX, padZ); maxRange = radio de vuelo.
export type Area = { usable: number, padX: number, padZ: number, maxRange: number }

export type ShowerParams = {
	count: number,
	minSpacing: number,
	height: number,
	area: { x0: number, x1: number, z0: number, z1: number },
}

export type PickupParams = {
	pickupRadius: number,
	serverSlack: number,
	serverExtra: number,
	minInterval: number,
	speedSlack: number,
	travelExtra: number,
}

export type PickupInput = {
	active: boolean, -- el cristal está ahí (no recogido)
	owner: boolean, -- es de la parcela del jugador
	distance: number, -- del jugador al cristal, según el servidor
	now: number,
	lastPickupAt: number, -- 0 si es la primera
	travelled: number, -- distancia desde el punto de la última recogida
	maxSpeed: number, -- velocidad máxima posible del jugador (cohete con o sin pase)
}

export type PickupResult = "ok" | "gone" | "owner" | "far" | "cooldown" | "fast"

local function lerp(a: number, b: number, t: number): number
	return a + (b - a) * t
end

local function farEnough(points: { Point }, p: Point, spacing: number): boolean
	for _, q in points do
		local dx, dy, dz = p.x - q.x, p.y - q.y, p.z - q.z
		if dx * dx + dy * dy + dz * dz < spacing * spacing then
			return false
		end
	end
	return true
end

-- Asteroides de una parcela, en coordenadas locales (y = altura del centro). `nextRandom` da números en [0, 1)
-- (Rng.new(semilla).next); `reach(horizontal, alturaASubir)` dice si el cohete llega (Rocket.canReach).
-- Cada asteroide: dentro de la parcela, a minPadDistance..maxRange - radius de la plataforma, separado de los
-- demás y con su cara de arriba (más un margen para el cohete) al alcance.
function Crystals.layout(
	nextRandom: () -> number,
	params: AsteroidParams,
	area: Area,
	reach: (number, number) -> boolean
): { Point }
	local points: { Point } = {}
	local limit = area.usable - params.radius
	for _ = 1, params.count do
		for _ = 1, params.maxTries do
			local p: Point = {
				x = lerp(-limit, limit, nextRandom()),
				y = lerp(params.minHeight, params.maxHeight, nextRandom()),
				z = lerp(-limit, limit, nextRandom()),
			}
			local dx, dz = p.x - area.padX, p.z - area.padZ
			local horizontal = math.sqrt(dx * dx + dz * dz)
			local inRing = horizontal >= params.minPadDistance and horizontal <= area.maxRange - params.radius
			if
				inRing
				and reach(horizontal, Crystals.topClearance(p.y, params))
				and farEnough(points, p, params.minSpacing)
			then
				table.insert(points, p)
				break
			end
		end
	end
	return points
end

-- Altura a la que tiene que subir el cohete para posarse encima de un asteroide con centro en `y`.
function Crystals.topClearance(y: number, params: AsteroidParams): number
	return y + params.radius + 3
end

-- Cristales de la lluvia de meteoritos: a ras de suelo, repartidos por el rectángulo `area`.
function Crystals.showerLayout(nextRandom: () -> number, params: ShowerParams): { Point }
	local points: { Point } = {}
	local a = params.area
	for _ = 1, params.count do
		for _ = 1, 40 do
			local p: Point = {
				x = lerp(a.x0, a.x1, nextRandom()),
				y = params.height,
				z = lerp(a.z0, a.z1, nextRandom()),
			}
			if farEnough(points, p, params.minSpacing) then
				table.insert(points, p)
				break
			end
		end
	end
	return points
end

-- Índice del tipo de cristal según los pesos (probabilidad = peso / suma). `r` en [0, 1).
function Crystals.rollKind(weights: { number }, r: number): number
	local total = 0
	for _, w in weights do
		total += math.max(w, 0)
	end
	if total <= 0 then
		return 1
	end
	local target = math.clamp(r, 0, 1) * total
	local acc = 0
	for i, w in weights do
		acc += math.max(w, 0)
		if target < acc then
			return i
		end
	end
	return #weights
end

function Crystals.chance(weights: { number }, index: number): number
	local total = 0
	for _, w in weights do
		total += math.max(w, 0)
	end
	local w = weights[index]
	if total <= 0 or w == nil then
		return 0
	end
	return math.max(w, 0) / total
end

-- ¿Acepta el servidor esta recogida? El cristal tiene que estar, ser de tu parcela y estar cerca de ti (con
-- margen por la latencia); no vale recoger dos en menos de minInterval ni haber viajado desde la última
-- recogida más de lo que permite la velocidad máxima.
function Crystals.validatePickup(input: PickupInput, params: PickupParams): PickupResult
	local result: PickupResult = "ok"
	local dt = input.now - input.lastPickupAt
	if not input.active then
		result = "gone"
	elseif not input.owner then
		result = "owner"
	elseif input.distance > params.pickupRadius * params.serverSlack + params.serverExtra then
		result = "far"
	elseif input.lastPickupAt > 0 and dt < params.minInterval then
		result = "cooldown"
	elseif
		input.lastPickupAt > 0 and input.travelled > input.maxSpeed * params.speedSlack * dt + params.travelExtra
	then
		result = "fast"
	end
	return result
end

return Crystals
