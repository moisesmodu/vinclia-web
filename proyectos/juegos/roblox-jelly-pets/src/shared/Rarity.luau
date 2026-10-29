--!strict
-- Tirada de rareza ponderada. Pura: recibe los pesos y un generador ({ next: () -> number }), así se prueba con
-- Lune con una semilla fija y el servidor usa el mismo código para la cinta y la Tirada de suerte.

local Rarity = {}

export type RandomSource = { next: () -> number }

local function firstIndex(weights: { number }, minIndex: number?): number
	return math.clamp(math.floor(minIndex or 1), 1, math.max(#weights, 1))
end

local function totalFrom(weights: { number }, from: number): number
	local total = 0
	for i = from, #weights do
		total += math.max(weights[i], 0)
	end
	return total
end

-- Índice elegido con probabilidad peso_i / suma, solo entre minIndex y el final (minIndex = 4 → Épica o mejor).
function Rarity.roll(rng: RandomSource, weights: { number }, minIndex: number?): number
	local from = firstIndex(weights, minIndex)
	local total = totalFrom(weights, from)
	if total <= 0 then
		return from
	end
	local r = rng.next() * total
	for i = from, #weights do
		r -= math.max(weights[i], 0)
		if r < 0 then
			return i
		end
	end
	return #weights
end

-- Probabilidad (0..1) de sacar `index` en una tirada con el mismo minIndex.
function Rarity.chance(weights: { number }, index: number, minIndex: number?): number
	local from = firstIndex(weights, minIndex)
	local total = totalFrom(weights, from)
	if total <= 0 or index < from or index > #weights then
		return 0
	end
	return math.max(weights[index], 0) / total
end

return Rarity
