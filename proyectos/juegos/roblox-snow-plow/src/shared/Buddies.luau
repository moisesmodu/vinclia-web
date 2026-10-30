--!strict
-- Compañeros de nieve: tirada de rareza de los huevos, suma de bonus con tope, equipar y quitar, y elegir los
-- mejores. Puro: recibe los pesos, los bonus y un generador ({ next: () -> number }), así se prueba con Lune.

local Buddies = {}

export type SavedBuddy = { id: string, s: string, r: number } -- id único, especie, rareza (1..n)

export type RandomSource = { next: () -> number }

export type ToggleResult = "equipped" | "unequipped" | "full" | "missing"

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

-- Rareza elegida con probabilidad peso_i / suma, solo entre minIndex y el final (minIndex = 3 → Raro o mejor).
-- Si todos los pesos desde minIndex son 0, sale minIndex.
function Buddies.roll(rng: RandomSource, weights: { number }, minIndex: number?): number
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
function Buddies.chance(weights: { number }, index: number, minIndex: number?): number
	local from = firstIndex(weights, minIndex)
	local total = totalFrom(weights, from)
	if total <= 0 or index < from or index > #weights then
		return 0
	end
	return math.max(weights[index], 0) / total
end

function Buddies.find(owned: { SavedBuddy }, id: string): number?
	for i, buddy in owned do
		if buddy.id == id then
			return i
		end
	end
	return nil
end

-- Suma de los bonus, con tope (los bonus se suman: +10 % y +25 % = +35 %).
function Buddies.totalBoost(boosts: { number }, cap: number): number
	local total = 0
	for _, b in boosts do
		total += math.max(b, 0)
	end
	return math.min(total, math.max(cap, 0))
end

-- Bonus de los compañeros equipados (ids que no existen no cuentan).
function Buddies.equippedBoost(
	owned: { SavedBuddy },
	equipped: { string },
	rarityBoosts: { number },
	cap: number
): number
	local boosts: { number } = {}
	for _, id in equipped do
		local index = Buddies.find(owned, id)
		if index then
			table.insert(boosts, rarityBoosts[owned[index].r] or 0)
		end
	end
	return Buddies.totalBoost(boosts, cap)
end

-- Equipa o quita `id`. Devuelve la lista nueva (no toca la de entrada) y qué pasó.
function Buddies.toggle(
	owned: { SavedBuddy },
	equipped: { string },
	id: string,
	maxEquipped: number
): ({ string }, ToggleResult)
	local result = table.clone(equipped)
	local at = table.find(result, id)
	if at then
		table.remove(result, at)
		return result, "unequipped"
	end
	if Buddies.find(owned, id) == nil then
		return result, "missing"
	end
	if #result >= maxEquipped then
		return result, "full"
	end
	table.insert(result, id)
	return result, "equipped"
end

-- Los `maxEquipped` de más rareza (a igual rareza, el más antiguo de la lista).
function Buddies.best(owned: { SavedBuddy }, maxEquipped: number): { string }
	local order: { number } = {}
	for i in owned do
		table.insert(order, i)
	end
	table.sort(order, function(a, b)
		local ra = owned[a].r
		local rb = owned[b].r
		if ra ~= rb then
			return ra > rb
		end
		return a < b
	end)
	local result: { string } = {}
	for i = 1, math.min(maxEquipped, #order) do
		table.insert(result, owned[order[i]].id)
	end
	return result
end

-- Limpia la lista de equipados leída del guardado: sin ids desconocidos, sin repetidos, como mucho `maxEquipped`.
function Buddies.sanitize(owned: { SavedBuddy }, equipped: { string }, maxEquipped: number): { string }
	local result: { string } = {}
	for _, id in equipped do
		if #result < maxEquipped and Buddies.find(owned, id) ~= nil and table.find(result, id) == nil then
			table.insert(result, id)
		end
	end
	return result
end

return Buddies
