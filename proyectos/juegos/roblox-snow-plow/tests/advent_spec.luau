-- Pruebas de src/shared/Advent.luau: fechas en UTC, límites del 1 y el 25 de diciembre, fuera de temporada,
-- un regalo por día y calendario nuevo cada año.

local Advent = require("../src/shared/Advent")
local Config = require("../src/shared/Config")

-- Instantes Unix comprobados con Date.UTC de JavaScript.
local NOV30_LAST = 1796083199 -- 2026-11-30 23:59:59 UTC
local DEC1 = 1796083200 -- 2026-12-01 00:00:00 UTC
local DEC24_NOON = 1798113600 -- 2026-12-24 12:00:00 UTC
local DEC25_LAST = 1798243199 -- 2026-12-25 23:59:59 UTC
local DEC26 = 1798243200 -- 2026-12-26 00:00:00 UTC
local DEC1_2027 = 1827619200 -- 2027-12-01 00:00:00 UTC
local DAY = 86400

return function(T)
	T.section("Advent")
	local p = Config.Advent

	T.test("fecha civil en UTC", function()
		local d = Advent.civil(0)
		T.eq(d.year, 1970)
		T.eq(d.month, 1)
		T.eq(d.day, 1)
		local leap = Advent.civil(1709208000) -- 2024-02-29 12:00
		T.eq(leap.year, 2024)
		T.eq(leap.month, 2)
		T.eq(leap.day, 29)
		local y2000 = Advent.civil(951868800) -- 2000-03-01
		T.eq(y2000.month, 3)
		T.eq(y2000.day, 1)
		local y2100 = Advent.civil(4107542400) -- 2100-03-01 (2100 no es bisiesto)
		T.eq(y2100.year, 2100)
		T.eq(y2100.month, 3)
		T.eq(y2100.day, 1)
		local eve = Advent.civil(DEC24_NOON)
		T.eq(eve.year, 2026)
		T.eq(eve.month, 12)
		T.eq(eve.day, 24)
	end)

	T.test("límites de la temporada (UTC)", function()
		T.eq(Advent.dayOf(NOV30_LAST, p), 0, "30 de noviembre, último segundo")
		T.eq(Advent.dayOf(DEC1, p), 1, "1 de diciembre, primer segundo")
		T.eq(Advent.dayOf(DEC1 + DAY - 1, p), 1)
		T.eq(Advent.dayOf(DEC1 + DAY, p), 2)
		T.eq(Advent.dayOf(DEC24_NOON, p), 24)
		T.eq(Advent.dayOf(DEC25_LAST, p), 25, "25 de diciembre, último segundo")
		T.eq(Advent.dayOf(DEC26, p), 0, "26 de diciembre: se acabó")
		T.eq(Advent.dayOf(DEC1 - 200 * DAY, p), 0, "en mayo no hay calendario")
	end)

	T.test("un regalo por día", function()
		local state = { year = 0, claimed = {} }
		local r1, d1, s1 = Advent.claim(state, DEC1 + 5, p)
		T.eq(r1, "ok")
		T.eq(d1, 1)
		T.eq(s1.year, 2026)
		T.eq(#s1.claimed, 1)
		T.eq(#state.claimed, 0, "el estado de entrada no cambia")
		local r2, d2, s2 = Advent.claim(s1, DEC1 + 3600, p)
		T.eq(r2, "claimed", "el mismo día no se repite")
		T.eq(d2, 1)
		T.eq(#s2.claimed, 1)
		T.eq(Advent.ready(s1, DEC1 + 3600, p), false)
		T.eq(Advent.ready(s1, DEC1 + DAY, p), true, "al día siguiente, otro")
		local r3, d3, s3 = Advent.claim(s1, DEC1 + DAY, p)
		T.eq(r3, "ok")
		T.eq(d3, 2)
		T.eq(#s3.claimed, 2)
	end)

	T.test("fuera de temporada no se abre nada", function()
		local state = { year = 2026, claimed = { 1, 2 } }
		local result, day, nextState = Advent.claim(state, DEC26, p)
		T.eq(result, "season")
		T.eq(day, 0)
		T.eq(nextState.year, 2026)
		T.eq(#nextState.claimed, 2, "se conserva")
		T.eq(Advent.ready(state, NOV30_LAST, p), false)
	end)

	T.test("cada diciembre, calendario nuevo", function()
		local last = { year = 2026, claimed = { 1, 2, 3 } }
		T.eq(Advent.isClaimed(last, 2026, 1), true)
		T.eq(Advent.isClaimed(last, 2027, 1), false)
		T.eq(Advent.ready(last, DEC1_2027, p), true)
		local result, day, nextState = Advent.claim(last, DEC1_2027, p)
		T.eq(result, "ok")
		T.eq(day, 1)
		T.eq(nextState.year, 2027)
		T.eq(#nextState.claimed, 1)
	end)

	T.test("regalos: monedas que crecen y compañeros los días marcados", function()
		local g1 = Advent.gift(1, p)
		T.eq(g1.kind, "coins")
		T.eq(g1.coins, p.baseCoins)
		T.eq(g1.rarity, 0)
		T.eq(Advent.gift(10, p).coins, p.baseCoins * 10)
		local g6 = Advent.gift(6, p)
		T.eq(g6.kind, "buddy")
		T.eq(g6.rarity, 3)
		T.eq(g6.coins, 0)
		local xmas = Advent.gift(25, p)
		T.eq(xmas.kind, "buddy")
		T.eq(xmas.rarity, #Config.BuddyRarities, "Navidad: Legendario")
		for day, rarity in p.buddyDays do
			T.truthy(day >= 1 and day <= p.lastDay, "día válido")
			T.truthy(rarity >= 1 and rarity <= #Config.BuddyRarities, "rareza válida")
		end
	end)
end
