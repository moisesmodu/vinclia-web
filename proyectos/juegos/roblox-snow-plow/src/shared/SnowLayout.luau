--!strict
-- Reparto de los montones de nieve de una zona. Puro y determinista: la misma semilla da siempre el mismo
-- pueblo (en Lune y en Roblox), dentro de los límites de la zona, sin montones pegados y fuera de los huecos
-- reservados (depósito, aparición, adorno del centro).
-- No requiere otros módulos (Lune los carga sueltos): el generador con semilla (Rng.new(seed)) se pasa como argumento.

local SnowLayout = {}

export type RandomSource = {
	next: () -> number, -- [0, 1)
	int: (a: number, b: number) -> number, -- entero en [a, b]
}

export type Circle = { x: number, z: number, r: number }

export type Params = {
	minX: number,
	maxX: number,
	minZ: number,
	maxZ: number,
	count: number,
	minSpacing: number,
	minSize: number,
	maxSize: number,
	maxTries: number,
	avoid: { Circle },
}

export type Pile = { x: number, z: number, size: number }

local function insideAvoid(x: number, z: number, avoid: { Circle }): boolean
	for _, c in avoid do
		local dx = x - c.x
		local dz = z - c.z
		if dx * dx + dz * dz < c.r * c.r then
			return true
		end
	end
	return false
end

local function tooClose(x: number, z: number, piles: { Pile }, spacing: number): boolean
	local s2 = spacing * spacing
	for _, p in piles do
		local dx = x - p.x
		local dz = z - p.z
		if dx * dx + dz * dz < s2 then
			return true
		end
	end
	return false
end

-- Hasta `count` montones. Si no cabe uno tras `maxTries` intentos, se salta (nunca se rompen las reglas).
-- Las coordenadas se redondean a décimas para que la lista sea idéntica en cualquier máquina.
-- `rng` debe ser nuevo (Rng.new(semilla)) para que el reparto sea siempre el mismo.
function SnowLayout.generate(params: Params, rng: RandomSource): { Pile }
	local piles: { Pile } = {}
	local width = math.max(params.maxX - params.minX, 0)
	local depth = math.max(params.maxZ - params.minZ, 0)
	for _ = 1, math.max(math.floor(params.count), 0) do
		for _ = 1, math.max(params.maxTries, 1) do
			local x = math.floor((params.minX + rng.next() * width) * 10 + 0.5) / 10
			local z = math.floor((params.minZ + rng.next() * depth) * 10 + 0.5) / 10
			if
				x >= params.minX
				and x <= params.maxX
				and z >= params.minZ
				and z <= params.maxZ
				and not insideAvoid(x, z, params.avoid)
				and not tooClose(x, z, piles, params.minSpacing)
			then
				table.insert(piles, { x = x, z = z, size = rng.int(params.minSize, params.maxSize) })
				break
			end
		end
	end
	return piles
end

-- Segundos hasta que un montón recogido vuelve a salir: más rápido mientras dura una Tormenta.
function SnowLayout.respawnDelay(baseSeconds: number, stormUntil: number, now: number, stormFactor: number): number
	if now < stormUntil and stormFactor > 1 then
		return baseSeconds / stormFactor
	end
	return baseSeconds
end

return SnowLayout
