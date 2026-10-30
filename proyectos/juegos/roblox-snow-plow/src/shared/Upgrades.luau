--!strict
-- Precios de las mejoras de la máquina (pala, mochila, velocidad, descarga automática). Puro.

local Upgrades = {}

export type UpgradeDef = { id: string, baseCost: number, growth: number, maxLevel: number }

-- Precio para pasar del nivel `current` al siguiente, o nil si ya está al máximo.
function Upgrades.cost(def: UpgradeDef, current: number): number?
	local n = math.max(math.floor(current), 0)
	if n >= def.maxLevel then
		return nil
	end
	return math.floor(def.baseCost * def.growth ^ n + 0.5)
end

-- Lo que costó llegar desde 0 hasta `current` (suma de los precios pagados).
function Upgrades.totalSpent(def: UpgradeDef, current: number): number
	local total = 0
	for n = 0, math.min(math.floor(current), def.maxLevel) - 1 do
		total += math.floor(def.baseCost * def.growth ^ n + 0.5)
	end
	return total
end

return Upgrades
