--!strict
-- Cuentas de los ingresos de la base. Puro.
-- Cada extractor deja una roca de `value` monedas cada `interval` segundos; la roca pasa por todos los escáneres
-- comprados (están después de los extractores en la cinta) y cada uno multiplica su valor; las cúpulas suman un
-- bonus; y al final se aplican el renacer, los cristales y el pase 2× Cash.

local Income = {}

-- Lo que hace falta de cada botón (misma forma que esa parte de Config.ButtonDef).
export type Def = {
	id: string,
	kind: string,
	value: number?,
	interval: number?,
	multiplier: number?,
	bonus: number?,
}

export type CrystalParams = { perCrystal: number, maxBoost: number, maxBoostPerRebirth: number }

export type Boosts = {
	rebirths: number,
	perRebirth: number,
	crystals: number,
	doubleCash: boolean,
	doubleCashMultiplier: number,
}

export type CashPackParams = { seconds: number, minCoins: number }

-- Producto de los multiplicadores de los escáneres comprados.
function Income.upgradeFactor(defs: { Def }, owned: { [string]: boolean }): number
	local factor = 1
	for _, def in defs do
		if def.kind == "upgrader" and owned[def.id] == true then
			factor *= math.max(def.multiplier or 1, 1)
		end
	end
	return factor
end

-- 1 + suma de los bonus de las cúpulas compradas.
function Income.domeFactor(defs: { Def }, owned: { [string]: boolean }): number
	local factor = 1
	for _, def in defs do
		if def.kind == "dome" and owned[def.id] == true then
			factor += math.max(def.bonus or 0, 0)
		end
	end
	return factor
end

-- Monedas por segundo de los extractores, antes de escáneres y multiplicadores.
function Income.baseRate(defs: { Def }, owned: { [string]: boolean }): number
	local rate = 0
	for _, def in defs do
		if def.kind == "dropper" and owned[def.id] == true then
			local interval = def.interval or 0
			if interval > 0 then
				rate += (def.value or 0) / interval
			end
		end
	end
	return rate
end

-- Valor de una roca de `value` al llegar a la refinería (sin los multiplicadores del jugador).
function Income.oreValue(value: number, defs: { Def }, owned: { [string]: boolean }): number
	return value * Income.upgradeFactor(defs, owned) * Income.domeFactor(defs, owned)
end

-- Multiplicador de los cristales: 1 + cristales · perCrystal, con un tope que sube con cada renacimiento.
function Income.crystalMultiplier(crystals: number, rebirths: number, params: CrystalParams): number
	local cap = params.maxBoost + math.max(math.floor(rebirths), 0) * params.maxBoostPerRebirth
	return 1 + math.clamp(math.max(crystals, 0) * params.perCrystal, 0, cap)
end

function Income.rebirthMultiplier(rebirths: number, perRebirth: number): number
	return 1 + math.max(math.floor(rebirths), 0) * perRebirth
end

-- Multiplicador total del jugador: renacer · cristales · pase.
function Income.playerMultiplier(boosts: Boosts, crystalParams: CrystalParams): number
	local m = Income.rebirthMultiplier(boosts.rebirths, boosts.perRebirth)
		* Income.crystalMultiplier(boosts.crystals, boosts.rebirths, crystalParams)
	if boosts.doubleCash then
		m *= boosts.doubleCashMultiplier
	end
	return m
end

-- Monedas por segundo de la base con todo aplicado.
function Income.perSecond(defs: { Def }, owned: { [string]: boolean }, multiplier: number): number
	return Income.baseRate(defs, owned)
		* Income.upgradeFactor(defs, owned)
		* Income.domeFactor(defs, owned)
		* math.max(multiplier, 0)
end

-- Reparte un tick: suma lo ganado a lo que sobraba y devuelve (monedas enteras, resto para el siguiente tick).
function Income.accumulate(carry: number, perSecond: number, dt: number): (number, number)
	local total = carry + math.max(perSecond, 0) * math.max(dt, 0)
	local whole = math.floor(total)
	return whole, total - whole
end

-- Monedas del producto Cash Pack: `seconds` segundos de ingresos, con un mínimo.
function Income.cashPack(perSecond: number, params: CashPackParams): number
	return math.max(params.minCoins, math.floor(math.max(perSecond, 0) * params.seconds))
end

-- Formato corto para la interfaz: 950, 12.5K, 3.4M.
function Income.short(n: number): string
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

return Income
