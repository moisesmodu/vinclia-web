--!strict
-- Bolsa de monedas y formato corto de los números de la interfaz. Puro.

local Economy = {}

export type CoinPackParams = { baseCoins: number, zoneScale: number }

-- Monedas de la Bolsa: crecen con las zonas abiertas y con el multiplicador de renacer.
function Economy.coinPack(zonesUnlocked: number, rebirthMultiplier: number, params: CoinPackParams): number
	local extraZones = math.max(math.floor(zonesUnlocked) - 1, 0)
	return math.floor(params.baseCoins * params.zoneScale ^ extraZones * math.max(rebirthMultiplier, 1))
end

-- Formato corto para la interfaz: 950, 12.5K, 3.4M.
function Economy.short(n: number): string
	local a = math.abs(n)
	if a >= 1e12 then
		return string.format("%.1fT", n / 1e12)
	elseif a >= 1e9 then
		return string.format("%.1fB", n / 1e9)
	elseif a >= 1e6 then
		return string.format("%.1fM", n / 1e6)
	elseif a >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	end
	return tostring(math.floor(n))
end

return Economy
