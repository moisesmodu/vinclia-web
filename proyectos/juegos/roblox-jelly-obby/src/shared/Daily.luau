--!strict
-- Premio diario con racha. Pura: los días son números enteros (días desde 1970 en UTC), los da el servidor.

local Daily = {}

export type DailyParams = { baseReward: number, maxStreak: number, weekBonus: number }

function Daily.dayNumber(unixTime: number): number
	return math.floor(unixTime / 86400)
end

-- ¿Se puede reclamar hoy? Devuelve (sí/no, racha nueva). Día siguiente al último: la racha sube (tras el último
-- día vuelve a 1); si se saltó algún día, empieza en 1; el mismo día (o un reloj que va hacia atrás), no.
function Daily.claim(lastDay: number, streak: number, today: number, maxStreak: number): (boolean, number)
	if today <= lastDay then
		return false, streak
	end
	if today == lastDay + 1 and streak >= 1 then
		return true, (math.floor(streak) % maxStreak) + 1
	end
	return true, 1
end

function Daily.canClaim(lastDay: number, today: number): boolean
	return today > lastDay
end

-- Monedas del premio para una racha: base · racha, más el bonus del último día, por el multiplicador.
function Daily.reward(streak: number, params: DailyParams, multiplier: number): number
	local s = math.clamp(math.floor(streak), 1, params.maxStreak)
	local coins = params.baseReward * s + (if s == params.maxStreak then params.weekBonus else 0)
	return math.floor(coins * math.max(multiplier, 1))
end

return Daily
