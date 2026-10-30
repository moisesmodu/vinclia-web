-- Pruebas de src/shared/Buddies.luau: huevos, bonus con tope, equipar y elegir los mejores.

local Buddies = require("../src/shared/Buddies")
local Config = require("../src/shared/Config")
local Rng = require("../src/shared/Rng")

local function boosts(): { number }
	local list: { number } = {}
	for _, def in Config.BuddyRarities do
		table.insert(list, def.boost)
	end
	return list
end

local function fixed(value: number)
	return {
		next = function(): number
			return value
		end,
	}
end

return function(T)
	T.section("Buddies")

	T.test("tirada: cada valor cae en su rareza", function()
		local weights = { 70, 20, 10 }
		T.eq(Buddies.roll(fixed(0), weights), 1)
		T.eq(Buddies.roll(fixed(0.69), weights), 1)
		T.eq(Buddies.roll(fixed(0.71), weights), 2)
		T.eq(Buddies.roll(fixed(0.91), weights), 3)
		T.eq(Buddies.roll(fixed(0.999999), weights), 3)
	end)

	T.test("tirada con mínimo (Huevo de la suerte) y pesos a 0", function()
		local weights = Config.Eggs[1].weights
		for i = 1, 200 do
			local r = Buddies.roll(fixed((i - 1) / 200), weights, Config.LuckyEgg.minRarity)
			T.truthy(r >= Config.LuckyEgg.minRarity, "Raro o mejor")
			T.truthy(r < 5, "el huevo del pueblo no da Legendarios (peso 0)")
		end
		T.eq(Buddies.roll(fixed(0.5), { 0, 0, 0 }), 1, "todo a 0: la primera")
		T.eq(Buddies.roll(fixed(0.5), { 5, 0, 0 }, 2), 2, "nada desde el mínimo: el mínimo")
	end)

	T.test("las frecuencias se parecen a los pesos (semilla fija)", function()
		local weights = Config.Eggs[2].weights
		local rng = Rng.new(2512)
		local counts = { 0, 0, 0, 0, 0 }
		local n = 20000
		for _ = 1, n do
			local r = Buddies.roll(rng, weights)
			counts[r] += 1
		end
		for i = 1, #weights do
			T.near(counts[i] / n, Buddies.chance(weights, i), 0.015, "rareza " .. i)
		end
	end)

	T.test("probabilidades de cada huevo suman 1 y mejoran con la zona", function()
		local previousRare = -1
		for _, egg in Config.Eggs do
			T.eq(#egg.weights, #Config.BuddyRarities, "un peso por rareza")
			local sum = 0
			local rareOrBetter = 0
			for i = 1, #egg.weights do
				sum += Buddies.chance(egg.weights, i)
				if i >= 3 then
					rareOrBetter += Buddies.chance(egg.weights, i)
				end
			end
			T.near(sum, 1, 1e-9, egg.id)
			T.truthy(rareOrBetter > previousRare, egg.id .. " mejor que el anterior")
			previousRare = rareOrBetter
		end
		T.eq(Buddies.chance({ 1, 1 }, 3), 0, "rareza que no existe")
		T.eq(Buddies.chance({ 1, 1 }, 1, 2), 0, "por debajo del mínimo")
	end)

	T.test("los bonus se suman con tope", function()
		local cap = Config.Buddies.maxBoost
		T.near(Buddies.totalBoost({ 0.1, 0.25 }, cap), 0.35, 1e-9)
		T.eq(Buddies.totalBoost({}, cap), 0)
		T.eq(Buddies.totalBoost({ 2.5, 2.5, 2.5 }, cap), cap, "tres legendarios: tope")
		T.eq(Buddies.totalBoost({ 1, -5 }, cap), 1, "uno negativo no resta")
	end)

	local owned = {
		{ id = "b1", s = "Snowman", r = 1 },
		{ id = "b2", s = "Penguin", r = 3 },
		{ id = "b3", s = "Owl", r = 2 },
		{ id = "b4", s = "Fox", r = 3 },
		{ id = "b5", s = "Bear", r = 5 },
	}

	T.test("bonus de los equipados", function()
		local list = boosts()
		local cap = Config.Buddies.maxBoost
		T.near(Buddies.equippedBoost(owned, { "b1", "b2" }, list, cap), 0.6, 1e-9)
		T.near(Buddies.equippedBoost(owned, { "b1", "zz" }, list, cap), 0.1, 1e-9, "id desconocido")
		T.eq(Buddies.equippedBoost(owned, {}, list, cap), 0)
	end)

	T.test("equipar y quitar, como mucho 3", function()
		local max = Config.Buddies.maxEquipped
		local list, result = Buddies.toggle(owned, {}, "b1", max)
		T.eq(result, "equipped")
		T.eq(#list, 1)
		local full = { "b1", "b2", "b3" }
		local same, r2 = Buddies.toggle(owned, full, "b4", max)
		T.eq(r2, "full")
		T.eq(#same, 3)
		local fewer, r3 = Buddies.toggle(owned, full, "b2", max)
		T.eq(r3, "unequipped")
		T.eq(#fewer, 2)
		T.eq(#full, 3, "la lista de entrada no cambia")
		local _, r4 = Buddies.toggle(owned, {}, "nope", max)
		T.eq(r4, "missing")
	end)

	T.test("los mejores: más rareza primero, a igualdad el más antiguo", function()
		local best = Buddies.best(owned, 3)
		T.eq(#best, 3)
		T.eq(best[1], "b5")
		T.eq(best[2], "b2")
		T.eq(best[3], "b4")
		T.eq(#Buddies.best({}, 3), 0)
		T.eq(#Buddies.best(owned, 10), #owned)
	end)

	T.test("limpiar los equipados del guardado", function()
		local clean = Buddies.sanitize(owned, { "b1", "b1", "zz", "b2", "b3", "b4" }, 3)
		T.eq(#clean, 3)
		T.eq(clean[1], "b1")
		T.eq(clean[2], "b2")
		T.eq(clean[3], "b3")
	end)
end
