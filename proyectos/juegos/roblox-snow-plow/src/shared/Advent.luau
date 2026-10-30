--!strict
-- Calendario de Adviento: del 1 al 25 de diciembre (en UTC), un regalo al día. Puro: la fecha sale de os.time()
-- con aritmética entera (sin os.date), así se prueba igual en Lune que en Roblox. Solo se puede abrir la casilla
-- de hoy; los días perdidos no se recuperan. Cada diciembre empieza de cero.

local Advent = {}

export type AdventParams = {
	month: number,
	lastDay: number,
	baseCoins: number,
	buddyDays: { [number]: number }, -- día → rareza del compañero que regala
}

export type Date = { year: number, month: number, day: number }

export type AdventState = { year: number, claimed: { number } }

export type ClaimResult = "ok" | "claimed" | "season"

export type GiftKind = "coins" | "buddy"

export type Gift = { kind: GiftKind, coins: number, rarity: number }

-- Fecha civil (UTC) de un instante Unix. Algoritmo «days from civil» al revés (H. Hinnant), en enteros.
function Advent.civil(unixTime: number): Date
	local days = math.floor(unixTime / 86400)
	local z = days + 719468
	local era = math.floor(z / 146097)
	local doe = z - era * 146097
	local yoe = math.floor((doe - math.floor(doe / 1460) + math.floor(doe / 36524) - math.floor(doe / 146096)) / 365)
	local doy = doe - (365 * yoe + math.floor(yoe / 4) - math.floor(yoe / 100))
	local mp = math.floor((5 * doy + 2) / 153)
	local day = doy - math.floor((153 * mp + 2) / 5) + 1
	local month = if mp < 10 then mp + 3 else mp - 9
	local year = yoe + era * 400 + (if month <= 2 then 1 else 0)
	return { year = year, month = month, day = day }
end

-- Casilla del calendario de hoy (1..lastDay) o 0 fuera de temporada.
function Advent.dayOf(unixTime: number, params: AdventParams): number
	local date = Advent.civil(unixTime)
	if date.month == params.month and date.day >= 1 and date.day <= params.lastDay then
		return date.day
	end
	return 0
end

function Advent.isClaimed(state: AdventState, year: number, day: number): boolean
	return state.year == year and table.find(state.claimed, day) ~= nil
end

-- ¿Hay regalo por abrir ahora mismo?
function Advent.ready(state: AdventState, unixTime: number, params: AdventParams): boolean
	local day = Advent.dayOf(unixTime, params)
	return day > 0 and not Advent.isClaimed(state, Advent.civil(unixTime).year, day)
end

-- Abre la casilla de hoy. Devuelve qué pasó, el día y el estado nuevo (la entrada no se toca). Un año nuevo
-- empieza con el calendario vacío.
function Advent.claim(state: AdventState, unixTime: number, params: AdventParams): (ClaimResult, number, AdventState)
	local day = Advent.dayOf(unixTime, params)
	local year = Advent.civil(unixTime).year
	local claimed: { number } = if state.year == year then table.clone(state.claimed) else {}
	local nextState: AdventState = { year = year, claimed = claimed }
	if day == 0 then
		return "season", 0, { year = state.year, claimed = table.clone(state.claimed) }
	end
	if table.find(claimed, day) ~= nil then
		return "claimed", day, nextState
	end
	table.insert(claimed, day)
	return "ok", day, nextState
end

-- Regalo de un día: un compañero en los días marcados; monedas (base · día) el resto.
function Advent.gift(day: number, params: AdventParams): Gift
	local rarity = params.buddyDays[day]
	local kind: GiftKind = if rarity then "buddy" else "coins"
	return {
		kind = kind,
		coins = if rarity then 0 else params.baseCoins * math.clamp(math.floor(day), 1, params.lastDay),
		rarity = rarity or 0,
	}
end

return Advent
