-- Pruebas de los sistemas de vuelta diaria y monetización suave: huevos raros, recompensa diaria con racha,
-- evento de fin de semana y pinturas (funciones puras de src/shared/Economy.luau y datos de Config).

local Config = require("../src/shared/Config")
local Economy = require("../src/shared/Economy")

-- Generador con semilla (Park-Miller): siempre la misma secuencia, en (0, 1). Sin desbordes: 48271 · 2^31 < 2^53.
local function seeded(seed: number): () -> number
	local state = seed % 2147483647
	if state <= 0 then
		state += 2147483646
	end
	return function(): number
		state = (state * 48271) % 2147483647
		return state / 2147483647
	end
end

local function constant(value: number): () -> number
	return function(): number
		return value
	end
end

local function chancesOf(): { number }
	local chances = {}
	for i, tier in Config.RarityTiers do
		chances[i] = tier.chance
	end
	return chances
end

-- Cuenta cuántas veces sale cada rareza en `n` tiradas.
local function histogram(roll: () -> number, multiplier: number, n: number): { [number]: number }
	local counts: { [number]: number } = {}
	local chances = chancesOf()
	for i = 0, #chances do
		counts[i] = 0
	end
	for _ = 1, n do
		local tier = Economy.rollRarity(roll, chances, multiplier, Config.Rarity.maxRareShare)
		counts[tier] += 1
	end
	return counts
end

local DAY = 86400
local THU_LAST = 1793318399 -- jueves 29-10-2026 23:59:59 UTC
local FRI_START = 1793318400 -- viernes 30-10-2026 00:00:00 UTC
local SAT_NOON = 1793448000 -- sábado 31-10-2026 12:00:00 UTC
local SUN_LAST = 1793577599 -- domingo 01-11-2026 23:59:59 UTC
local MON_START = 1793577600 -- lunes 02-11-2026 00:00:00 UTC

return function(T)
	T.section("Huevos raros")

	T.test("las rarezas van de más común a más rara y de menos a más valor", function()
		local tiers = Config.RarityTiers
		T.truthy(#tiers >= 3, "al menos plata, oro y arcoíris")
		for i, tier in tiers do
			T.truthy(tier.chance > 0 and tier.chance < 1, tier.id .. " probabilidad")
			T.truthy(tier.value > 1, tier.id .. " vale más que un huevo normal")
			T.eq(#tier.rgb, 3, tier.id .. " color")
			if i > 1 then
				T.truthy(tier.chance < tiers[i - 1].chance, tier.id .. " más rara que la anterior")
				T.truthy(tier.value > tiers[i - 1].value, tier.id .. " más valiosa que la anterior")
			end
		end
	end)

	T.test("la misma semilla da la misma secuencia de rarezas", function()
		local a, b = seeded(42), seeded(42)
		local chances = chancesOf()
		for i = 1, 500 do
			T.eq(Economy.rollRarity(a, chances, 3, 0.5), Economy.rollRarity(b, chances, 3, 0.5), "tirada " .. i)
		end
	end)

	T.test("la distribución con semilla se ajusta a las probabilidades base", function()
		local n = 200000
		local counts = histogram(seeded(20261029), 1, n)
		local tolerance = { 0.004, 0.002, 0.0008 }
		local rare = 0
		for i, tier in Config.RarityTiers do
			T.near(counts[i] / n, tier.chance, tolerance[i] or 0.002, tier.id)
			rare += tier.chance
		end
		T.near(counts[0] / n, 1 - rare, 0.005, "normales")
	end)

	T.test("con multiplicador 2 sale el doble de raros", function()
		local n = 200000
		local base = histogram(seeded(7), 1, n)
		local doubled = histogram(seeded(7), 2, n)
		T.near(doubled[1] / base[1], 2, 0.15, "plata ×2")
		T.near(doubled[2] / base[2], 2, 0.3, "oro ×2")
	end)

	T.test("los raros nunca pasan de maxRareShare", function()
		local n = 100000
		local counts = histogram(seeded(99), 1000, n)
		T.near((n - counts[0]) / n, Config.Rarity.maxRareShare, 0.01, "tope de raros")
		-- y se reparten en proporción a su probabilidad base
		local tiers = Config.RarityTiers
		T.near(counts[1] / counts[2], tiers[1].chance / tiers[2].chance, 0.4, "plata / oro")
	end)

	T.test("bordes del dado: 0 da la más rara, casi 1 da normal, multiplicador 0 nunca da raros", function()
		local chances = chancesOf()
		T.eq(Economy.rollRarity(constant(0), chances, 1, 0.5), #chances, "0 → la más rara")
		T.eq(Economy.rollRarity(constant(0.999999), chances, 1, 0.5), 0, "casi 1 → normal")
		T.eq(Economy.rollRarity(constant(0), chances, 0, 0.5), 0, "multiplicador 0")
		T.eq(Economy.rollRarity(constant(0), {}, 5, 0.5), 0, "sin rarezas")
	end)

	T.test("multiplicador de rareza: 🍀, pase 2×, 🌟 y evento, con tope", function()
		local r = Config.Rarity
		T.eq(Economy.rarityMultiplier(0, false, false, false, r), 1, "sin nada")
		T.near(Economy.rarityMultiplier(10, false, false, false, r), 1 + 10 * r.luckPerLevel, 1e-9, "nivel 10")
		T.near(Economy.rarityMultiplier(0, true, false, false, r), r.passMultiplier, 1e-9, "pase 2×")
		T.near(Economy.rarityMultiplier(0, false, true, false, r), r.boostMultiplier, 1e-9, "Huevo de oro")
		T.near(Economy.rarityMultiplier(0, false, false, true, r), r.eventMultiplier, 1e-9, "evento")
		T.eq(r.eventMultiplier, 1.5, "el evento da ×1,5")
		T.eq(Economy.rarityMultiplier(10, true, true, true, r), r.maxMultiplier, "todo junto, con tope")
		T.eq(Economy.rarityMultiplier(-3, false, false, false, r), 1, "nivel negativo")
	end)

	T.test("los huevos raros pagan más; con valor 1 es el pago de siempre", function()
		local p = Config.Payout
		T.eq(Economy.payoutUnits(6, 6, 6, 900, p, 1), Economy.payout(6, 6, 900, p, 1), "solo normales")
		local silver = Config.RarityTiers[1].value
		local withSilver = Economy.payoutUnits(5 + silver, 6, 6, 900, p, 1)
		T.truthy(withSilver > Economy.payout(6, 6, 900, p, 1), "un huevo de plata sube el pago")
		T.near(Economy.payoutUnits(12, 6, 6, 900, p, 2), Economy.payoutUnits(12, 6, 6, 900, p, 1) * 2, 1, "pase 2×")
		T.eq(Economy.payoutUnits(0, 0, 6, 900, p, 1), 0, "nada")
	end)

	T.section("Recompensa diaria")

	T.test("día UTC", function()
		T.eq(Economy.utcDay(0), 0)
		T.eq(Economy.utcDay(DAY - 1), 0)
		T.eq(Economy.utcDay(DAY), 1)
		T.eq(Economy.utcDay(FRI_START), Economy.utcDay(THU_LAST) + 1, "medianoche UTC")
	end)

	T.test("primera vez: se cobra con racha 1", function()
		local ok, streak = Economy.dailyStreak(0, 0, 20000, 7)
		T.eq(ok, true)
		T.eq(streak, 1)
	end)

	T.test("mismo día: no se cobra y la racha no cambia", function()
		local ok, streak = Economy.dailyStreak(20000, 3, 20000, 7)
		T.eq(ok, false)
		T.eq(streak, 3)
	end)

	T.test("día siguiente: racha + 1", function()
		local ok, streak = Economy.dailyStreak(20000, 3, 20001, 7)
		T.eq(ok, true)
		T.eq(streak, 4)
	end)

	T.test("racha de 7 seguidos y luego se queda en 7", function()
		local day, streak = 20000, 0
		local lastDay = 0
		for expected = 1, 7 do
			local ok
			ok, streak = Economy.dailyStreak(lastDay, streak, day, 7)
			T.eq(ok, true, "día " .. expected)
			T.eq(streak, expected, "racha día " .. expected)
			lastDay = day
			day += 1
		end
		local ok, after = Economy.dailyStreak(lastDay, streak, day, 7)
		T.eq(ok, true, "día 8")
		T.eq(after, 7, "tope")
	end)

	T.test("saltarse un día devuelve la racha a 1", function()
		local ok, streak = Economy.dailyStreak(20000, 5, 20002, 7)
		T.eq(ok, true)
		T.eq(streak, 1)
		ok, streak = Economy.dailyStreak(20000, 7, 20030, 7)
		T.eq(ok, true, "un mes después")
		T.eq(streak, 1)
	end)

	T.test("reloj hacia atrás: no se cobra", function()
		local ok, streak = Economy.dailyStreak(20005, 2, 20004, 7)
		T.eq(ok, false)
		T.eq(streak, 2)
	end)

	T.test("monedas de la recompensa: suben con la racha y escalan con la mejor entrega", function()
		local d = Config.Daily
		T.eq(#d.rewards, 7, "7 días")
		local previous = 0
		for s = 1, #d.rewards do
			local coins = Economy.dailyCoins(s, 0, d)
			T.eq(coins, d.rewards[s], "día " .. s)
			T.truthy(coins > previous, "sube el día " .. s)
			previous = coins
		end
		T.eq(Economy.dailyCoins(30, 0, d), d.rewards[#d.rewards], "tope")
		T.eq(Economy.dailyCoins(0, 0, d), d.rewards[1], "racha 0 cuenta como 1")
		T.eq(Economy.dailyCoins(3, 10000, d), math.floor(10000 * d.bestFactor * 3), "jugador avanzado")
	end)

	T.section("Evento de fin de semana")

	T.test("día de la semana UTC", function()
		T.eq(Economy.weekday(THU_LAST), 3, "jueves")
		T.eq(Economy.weekday(FRI_START), 4, "viernes")
		T.eq(Economy.weekday(SUN_LAST), 6, "domingo")
		T.eq(Economy.weekday(MON_START), 0, "lunes")
		T.eq(Economy.weekday(0), 3, "1-1-1970 fue jueves")
	end)

	T.test("isEventActive en los bordes de viernes a domingo", function()
		T.eq(Economy.isEventActive(THU_LAST), false, "jueves 23:59:59")
		T.eq(Economy.isEventActive(FRI_START), true, "viernes 00:00:00")
		T.eq(Economy.isEventActive(SAT_NOON), true, "sábado")
		T.eq(Economy.isEventActive(SUN_LAST), true, "domingo 23:59:59")
		T.eq(Economy.isEventActive(MON_START), false, "lunes 00:00:00")
		T.eq(Economy.isEventActive(MON_START + 3 * DAY), false, "jueves siguiente")
		T.eq(Economy.isEventActive(FRI_START + 7 * DAY), true, "viernes siguiente")
	end)

	T.test("ventana del evento y semana", function()
		local startsAt, endsAt = Economy.eventWindow(THU_LAST)
		T.eq(startsAt, FRI_START, "empieza el viernes")
		T.eq(endsAt, MON_START, "acaba el lunes")
		startsAt, endsAt = Economy.eventWindow(SUN_LAST)
		T.eq(startsAt, FRI_START, "mismo evento el domingo")
		T.eq(endsAt, MON_START)
		T.eq(Economy.eventWeek(FRI_START), Economy.eventWeek(SUN_LAST), "un evento, una semana")
		T.eq(Economy.eventWeek(MON_START), Economy.eventWeek(SUN_LAST) + 1, "el lunes cambia de semana")
	end)

	T.test("progreso del evento: suma, meta y reinicio cada semana", function()
		local goal = Config.Event.eggsGoal
		local eggs, reached = Economy.eventProgress(100, 10, 100, 5, goal)
		T.eq(eggs, 15, "suma")
		T.eq(reached, false)
		eggs, reached = Economy.eventProgress(100, goal - 2, 100, 5, goal)
		T.eq(eggs, goal + 3, "pasa la meta")
		T.eq(reached, true, "meta alcanzada ahora")
		eggs, reached = Economy.eventProgress(100, goal + 3, 100, 5, goal)
		T.eq(reached, false, "ya estaba alcanzada")
		eggs, reached = Economy.eventProgress(99, goal + 50, 100, 4, goal)
		T.eq(eggs, 4, "semana nueva: empieza de 0")
		T.eq(reached, false)
	end)

	T.section("Pinturas")

	T.test("pinturas: ids coherentes, la de serie gratis y la del evento solo del evento", function()
		local seen = 0
		for _, id in Config.PaintOrder do
			local def = Config.Paints[id]
			T.truthy(def ~= nil, id .. " existe")
			T.eq(def.id, id, id .. " id")
			T.eq(#def.rgb, 3, id .. " color")
			T.truthy(def.cost >= 0 and def.cost == math.floor(def.cost), id .. " precio")
			seen += 1
		end
		local count = 0
		for _ in Config.Paints do
			count += 1
		end
		T.eq(count, seen, "todas en PaintOrder")
		T.eq(Config.Paints[Config.DefaultPaint].cost, 0, "la de serie es gratis")
		T.eq(Config.Paints[Config.DefaultPaint].event, false)
		T.eq(Config.Paints[Config.Event.paint].event, true, "la del evento no se vende")
		T.eq(Config.Upgrades.Luck.maxLevel, 10, "mejora 🍀")
	end)
end
