--!strict
-- Renacer: precio de cada renacimiento, multiplicador permanente y si se puede renacer ahora. Puro.

local Rebirth = {}

export type RebirthParams = { baseCost: number, growth: number, maxRebirths: number, perRebirth: number }

export type RebirthResult = "ok" | "max" | "final" | "coins"

-- Multiplicador de ingresos: 1, 1,5, 2, 2,5...
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

-- ¿Se puede renacer? Hace falta no estar al máximo, tener el último botón de la base y las monedas.
function Rebirth.check(coins: number, rebirths: number, ownsFinal: boolean, params: RebirthParams): RebirthResult
	local cost = Rebirth.cost(rebirths, params)
	local result: RebirthResult = "max"
	if cost then
		if not ownsFinal then
			result = "final"
		elseif coins < cost then
			result = "coins"
		else
			result = "ok"
		end
	end
	return result
end

return Rebirth
