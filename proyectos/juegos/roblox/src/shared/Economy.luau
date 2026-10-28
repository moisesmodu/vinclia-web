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

-- Monedas por una entrega. `distance` en studs; `multiplier` = 1, o 2 con el pase 2× dinero.
function Economy.payout(
	eggs: number,
	capacity: number,
	distance: number,
	params: PayoutParams,
	multiplier: number
): number
	if eggs <= 0 then
		return 0
	end
	local base = math.floor(eggs) * params.perEgg
	local distanceFactor = 1 + math.max(distance, 0) / 100 * params.distanceBonusPer100
	local fullFactor = if capacity > 0 and eggs >= capacity then 1 + params.fullLoadBonus else 1
	return math.floor(base * distanceFactor * fullFactor * math.max(multiplier, 1) + 0.5)
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
