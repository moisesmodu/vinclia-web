--!strict
-- Funciones puras de la economía: multiplicadores, renacer, venta, ganancias sin conectar y bolsa de monedas.
-- No tocan Roblox ni requieren otros módulos: reciben la configuración como argumento (pruebas con Lune).

local Economy = {}

export type IncomeParams = { doubleCoinsMultiplier: number, perRebirth: number }
export type RebirthParams = { baseCost: number, growth: number, maxRebirths: number }
export type OfflineParams = { rate: number, maxSeconds: number, minSeconds: number }
export type CoinPackParams = { minCoins: number, incomeSeconds: number }

-- Multiplicador permanente por renacimientos: 1, 1,5, 2, 2,5...
function Economy.rebirthMultiplier(rebirths: number, perRebirth: number): number
	return 1 + math.max(math.floor(rebirths), 0) * perRebirth
end

-- Multiplicador total de ingresos: renacimientos y, con el pase, ×2.
function Economy.multiplier(rebirths: number, hasDoubleCoins: boolean, params: IncomeParams): number
	local double = if hasDoubleCoins then params.doubleCoinsMultiplier else 1
	return Economy.rebirthMultiplier(rebirths, params.perRebirth) * double
end

-- Precio del siguiente renacimiento, o nil si ya se llegó al máximo.
function Economy.rebirthCost(rebirths: number, params: RebirthParams): number?
	local n = math.max(math.floor(rebirths), 0)
	if n >= params.maxRebirths then
		return nil
	end
	return math.floor(params.baseCost * params.growth ^ n + 0.5)
end

function Economy.sellValue(price: number, fraction: number): number
	return math.max(0, math.floor(price * math.clamp(fraction, 0, 1)))
end

-- Monedas ganadas sin conectar: incomePerSecond · min(elapsed, maxSeconds) · rate. Menos de minSeconds: nada.
function Economy.offlineEarnings(incomePerSecond: number, elapsedSeconds: number, params: OfflineParams): number
	if incomePerSecond <= 0 or elapsedSeconds < params.minSeconds then
		return 0
	end
	local seconds = math.min(elapsedSeconds, params.maxSeconds)
	return math.floor(incomePerSecond * seconds * params.rate)
end

function Economy.coinPack(incomePerSecond: number, params: CoinPackParams): number
	return math.max(params.minCoins, math.floor(math.max(incomePerSecond, 0) * params.incomeSeconds))
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
