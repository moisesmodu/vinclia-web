--!strict
-- Renacer: precio de cada renacimiento y multiplicador permanente de las monedas. Puro.

local Rebirth = {}

export type RebirthParams = { baseCost: number, growth: number, maxRebirths: number, perRebirth: number }

-- Multiplicador de monedas: 1, 1,5, 2, 2,5...
function Rebirth.multiplier(rebirths: number, perRebirth: number): number
	return 1 + math.max(math.floor(rebirths), 0) * perRebirth
end

-- Precio del siguiente renacimiento, o nil si ya se llegó al máximo.
function Rebirth.cost(rebirths: number, params: RebirthParams): number?
	local n = math.max(math.floor(rebirths), 0)
	if n >= params.maxRebirths then
		return nil
	end
	return math.floor(params.baseCost * params.growth ^ n + 0.5)
end

function Rebirth.canRebirth(coins: number, rebirths: number, params: RebirthParams): boolean
	local cost = Rebirth.cost(rebirths, params)
	if cost then
		return coins >= cost
	end
	return false
end

return Rebirth
