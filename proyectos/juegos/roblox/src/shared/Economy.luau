--!strict
-- Funciones puras de la economía. No tocan Roblox ni requieren otros módulos: reciben la configuración como
-- argumento, así se prueban con Lune (tests/economy.spec.luau) y el servidor y el cliente calculan lo mismo.

local Economy = {}

export type CostCurve = { baseCost: number, growth: number, maxLevel: number }

export type PayoutParams = {
	perEgg: number,
	distanceBonusPer100: number,
	fullLoadBonus: number,
}

export type FarmParams = {
	baseInterval: number,
	intervalFactor: number,
	minInterval: number,
	collectorsBase: number,
	collectorsSecondFarm: number,
	storagePerCollector: number,
}

export type TruckParams = {
	baseCapacity: number,
	capacityPerLevel: number,
	bigTruckBonus: number,
	baseWallHeight: number,
	wallPerLevel: number,
	baseDampingRatio: number,
	dampingPerLevel: number,
	maxDampingRatio: number,
	baseTravel: number,
	travelPerLevel: number,
}

export type EggParams = { baseBreakSpeed: number, breakSpeedPerSuspension: number }
export type GoldenEggParams = { minCoins: number, bestMultiplier: number }
export type RaceParams = { bonusBase: number, bonusPerEgg: number }
export type RarityBoostParams = {
	luckPerLevel: number,
	passMultiplier: number,
	boostMultiplier: number,
	eventMultiplier: number,
	maxMultiplier: number,
	maxRareShare: number,
}
export type DailyParams = { rewards: { number }, bestFactor: number }

local DAY = 86400
-- 1 de enero de 1970 (día 0) fue jueves: (día + 3) % 7 da 0 = lunes … 4 = viernes, 6 = domingo.
local WEEKDAY_OFFSET = 3
local EVENT_FIRST_WEEKDAY = 4 -- el evento va del viernes (4) al domingo (6), en UTC

local function clampLevel(level: number, maxLevel: number): number
	return math.clamp(math.floor(level), 0, maxLevel)
end

-- Precio para pasar de `level` a `level + 1`. nil si ya está al máximo.
function Economy.upgradeCost(curve: CostCurve, level: number): number?
	if level >= curve.maxLevel then
		return nil
	end
	local l = clampLevel(level, curve.maxLevel)
	return math.floor(curve.baseCost * curve.growth ^ l + 0.5)
end

-- Monedas por una entrega con huevos raros: `units` = suma del valor de cada huevo (1 el normal, Config.RarityTiers
-- el resto); `eggs` = cuántos huevos (para la bonificación de ir lleno). Con `units = eggs` es Economy.payout.
function Economy.payoutUnits(
	units: number,
	eggs: number,
	capacity: number,
	distance: number,
	params: PayoutParams,
	multiplier: number
): number
	if eggs <= 0 or units <= 0 then
		return 0
	end
	local base = math.max(units, math.floor(eggs)) * params.perEgg
	local distanceFactor = 1 + math.max(distance, 0) / 100 * params.distanceBonusPer100
	local fullFactor = if capacity > 0 and eggs >= capacity then 1 + params.fullLoadBonus else 1
	return math.floor(base * distanceFactor * fullFactor * math.max(multiplier, 1) + 0.5)
end

-- Monedas por una entrega. `distance` en studs; `multiplier` = 1, o 2 con el pase 2× dinero.
function Economy.payout(
	eggs: number,
	capacity: number,
	distance: number,
	params: PayoutParams,
	multiplier: number
): number
	return Economy.payoutUnits(math.floor(eggs), eggs, capacity, distance, params, multiplier)
end

-- HUEVOS RAROS

-- Multiplicador de la probabilidad de huevo raro: mejora 🍀, pase 2×, impulso del Huevo de oro y evento.
function Economy.rarityMultiplier(
	luckLevel: number,
	hasPass: boolean,
	boosted: boolean,
	eventActive: boolean,
	params: RarityBoostParams
): number
	local m = 1 + math.max(luckLevel, 0) * params.luckPerLevel
	if hasPass then
		m *= params.passMultiplier
	end
	if boosted then
		m *= params.boostMultiplier
	end
	if eventActive then
		m *= params.eventMultiplier
	end
	return math.min(m, params.maxMultiplier)
end

-- Tira el dado de rareza de un huevo. `roll` devuelve un número en [0, 1) (Random:NextNumber en el servidor, un
-- generador con semilla en las pruebas); `chances` son las probabilidades base de cada rareza, de la más común a la
-- más rara. Devuelve 0 (huevo normal) o el índice de la rareza en `chances`.
function Economy.rollRarity(roll: () -> number, chances: { number }, multiplier: number, maxRareShare: number): number
	local total = 0
	for _, chance in chances do
		total += math.max(chance, 0) * math.max(multiplier, 0)
	end
	local scale = math.max(multiplier, 0)
	if total > maxRareShare and total > 0 then
		scale *= maxRareShare / total
	end
	local r = roll()
	-- de la más rara a la más común: así la rara ocupa el principio del intervalo y no depende del orden de suma
	local acc = 0
	for i = #chances, 1, -1 do
		acc += math.max(chances[i], 0) * scale
		if r < acc then
			return i
		end
	end
	return 0
end

-- RECOMPENSA DIARIA

-- Día UTC (días enteros desde 1970) de un instante os.time().
function Economy.utcDay(osTime: number): number
	return math.floor(osTime / DAY)
end

-- ¿Toca recompensa hoy? Devuelve (se puede cobrar, racha nueva). `lastDay` = día del último cobro (0 = nunca);
-- mismo día o reloj hacia atrás: no; día siguiente: racha + 1 (sin pasar de `maxStreak`); más tarde: racha 1.
function Economy.dailyStreak(lastDay: number, streak: number, today: number, maxStreak: number): (boolean, number)
	if today <= lastDay then
		return false, streak
	end
	if lastDay > 0 and today == lastDay + 1 then
		return true, math.clamp(streak + 1, 1, math.max(maxStreak, 1))
	end
	return true, 1
end

-- Monedas de la recompensa diaria con racha `streak` y mejor entrega `best`.
function Economy.dailyCoins(streak: number, best: number, params: DailyParams): number
	local count = #params.rewards
	if count == 0 then
		return 0
	end
	local s = math.clamp(math.floor(streak), 1, count)
	return math.max(params.rewards[s], math.floor(math.max(best, 0) * params.bestFactor * s))
end

-- EVENTO DE FIN DE SEMANA (viernes 00:00 → lunes 00:00 UTC)

-- 0 = lunes … 6 = domingo, en UTC.
function Economy.weekday(osTime: number): number
	return (Economy.utcDay(osTime) + WEEKDAY_OFFSET) % 7
end

-- Número de semana (de lunes a domingo, UTC): identifica cada evento para reiniciar el progreso.
function Economy.eventWeek(osTime: number): number
	return math.floor((Economy.utcDay(osTime) + WEEKDAY_OFFSET) / 7)
end

function Economy.isEventActive(osTime: number): boolean
	return Economy.weekday(osTime) >= EVENT_FIRST_WEEKDAY
end

-- Instante (os.time) en que empieza el evento de esa semana y en que termina (lunes siguiente a las 00:00 UTC).
function Economy.eventWindow(osTime: number): (number, number)
	local week = Economy.eventWeek(osTime)
	local monday = week * 7 - WEEKDAY_OFFSET
	return (monday + EVENT_FIRST_WEEKDAY) * DAY, (monday + 7) * DAY
end

-- Progreso del evento: (huevos de esta semana, ¿se acaba de llegar a la meta?). Si la semana guardada no es la
-- actual, el progreso empieza de 0.
function Economy.eventProgress(
	savedWeek: number,
	savedEggs: number,
	week: number,
	added: number,
	goal: number
): (number, boolean)
	local before = if savedWeek == week then math.max(savedEggs, 0) else 0
	local after = before + math.max(math.floor(added), 0)
	return after, before < goal and after >= goal
end

-- Segundos entre huevo y huevo de cada gallinero.
function Economy.farmInterval(level: number, params: FarmParams): number
	return math.max(params.minInterval, params.baseInterval * params.intervalFactor ^ math.max(level, 0))
end

function Economy.collectorCount(hasSecondFarm: boolean, params: FarmParams): number
	return params.collectorsBase + (if hasSecondFarm then params.collectorsSecondFarm else 0)
end

function Economy.farmStorage(collectors: number, params: FarmParams): number
	return collectors * params.storagePerCollector
end

function Economy.truckCapacity(level: number, hasBigTruck: boolean, params: TruckParams): number
	return params.baseCapacity
		+ math.max(level, 0) * params.capacityPerLevel
		+ (if hasBigTruck then params.bigTruckBonus else 0)
end

function Economy.wallHeight(level: number, params: TruckParams): number
	return params.baseWallHeight + math.max(level, 0) * params.wallPerLevel
end

-- Suspensión: devuelve (amortiguación relativa, recorrido en studs).
function Economy.suspension(level: number, params: TruckParams): (number, number)
	local l = math.max(level, 0)
	local damping = math.min(params.maxDampingRatio, params.baseDampingRatio + l * params.dampingPerLevel)
	local travel = params.baseTravel + l * params.travelPerLevel
	return damping, travel
end

-- Velocidad de impacto (studs/s) a partir de la cual se rompe un huevo.
function Economy.breakSpeed(suspensionLevel: number, params: EggParams): number
	return params.baseBreakSpeed + math.max(suspensionLevel, 0) * params.breakSpeedPerSuspension
end

function Economy.goldenEggValue(bestDelivery: number, params: GoldenEggParams): number
	return math.max(params.minCoins, math.floor(math.max(bestDelivery, 0) * params.bestMultiplier))
end

function Economy.raceBonus(eggs: number, params: RaceParams): number
	if eggs <= 0 then
		return 0
	end
	return params.bonusBase + math.floor(eggs) * params.bonusPerEgg
end

-- Ganadores de la carrera: todos los que empatan con la puntuación más alta (> 0), ordenados por id.
function Economy.raceWinners(scores: { [number]: number }): ({ number }, number)
	local best = 0
	for _, score in scores do
		if score > best then
			best = score
		end
	end
	local winners = {}
	if best <= 0 then
		return winners, 0
	end
	for userId, score in scores do
		if score == best then
			table.insert(winners, userId)
		end
	end
	table.sort(winners)
	return winners, best
end

-- Formato corto para la interfaz: 950, 1.2K, 3.4M.
function Economy.short(n: number): string
	local a = math.abs(n)
	if a >= 1e9 then
		return string.format("%.1fB", n / 1e9)
	elseif a >= 1e6 then
		return string.format("%.1fM", n / 1e6)
	elseif a >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	end
	return tostring(math.floor(n))
end

return Economy
