-- Pruebas de src/shared/Rng.luau y src/shared/Rarity.luau: tiradas ponderadas, con semilla y reproducibles.

local Config = require("../src/shared/Config")
local Rarity = require("../src/shared/Rarity")
local Rng = require("../src/shared/Rng")

local function weightsOf(): { number }
	local weights = {}
	for _, def in Config.Rarities do
		table.insert(weights, def.weight)
	end
	return weights
end

-- Generador falso que siempre devuelve el mismo valor.
local function fixed(value: number)
	return {
		next = function(): number
			return value
		end,
	}
end

return function(T)
	T.section("Rng y Rarity")
	local weights = weightsOf()

	T.test("hay 6 rarezas y 6 especies", function()
		T.eq(#Config.Rarities, 6, "rarezas")
		T.eq(#Config.Species, 6, "especies")
		T.eq(Config.Rarities[1].id, "Common")
		T.eq(Config.Rarities[6].id, "Mythic")
	end)

	T.test("cada rareza es más rara, más cara y genera más que la anterior", function()
		for i = 2, #Config.Rarities do
			local a, b = Config.Rarities[i - 1], Config.Rarities[i]
			T.truthy(b.weight < a.weight, "peso " .. b.id)
			T.truthy(b.price > a.price, "precio " .. b.id)
			T.truthy(b.income > a.income, "ingresos " .. b.id)
		end
	end)

	T.test("fusionar compensa: 3 de una rareza generan menos que 1 de la siguiente", function()
		for i = 2, #Config.Rarities do
			T.truthy(Config.Rarities[i].income > 3 * Config.Rarities[i - 1].income, Config.Rarities[i].id)
		end
	end)

	T.test("la misma semilla da la misma secuencia", function()
		local a, b = Rng.new(2026), Rng.new(2026)
		for _ = 1, 50 do
			T.eq(a.next(), b.next())
		end
		local c, d = Rng.new(1), Rng.new(2)
		T.truthy(c.next() ~= d.next(), "semillas distintas")
	end)

	T.test("Rng.next en [0, 1) e int dentro del rango", function()
		local rng = Rng.new(7)
		for _ = 1, 2000 do
			local x = rng.next()
			T.truthy(x >= 0 and x < 1, "next " .. x)
			local n = rng.int(1, 6)
			T.truthy(n >= 1 and n <= 6 and n == math.floor(n), "int " .. n)
		end
	end)

	T.test("límites exactos de la tirada (pesos 600/250/100/38/10/2)", function()
		T.eq(Rarity.roll(fixed(0), weights), 1, "0 → común")
		T.eq(Rarity.roll(fixed(0.5999), weights), 1, "0,5999 → común")
		T.eq(Rarity.roll(fixed(0.6001), weights), 2, "0,6001 → poco común")
		T.eq(Rarity.roll(fixed(0.8501), weights), 3, "0,8501 → rara")
		T.eq(Rarity.roll(fixed(0.9501), weights), 4, "0,9501 → épica")
		T.eq(Rarity.roll(fixed(0.9881), weights), 5, "0,9881 → legendaria")
		T.eq(Rarity.roll(fixed(0.9986), weights), 6, "0,9986 → mítica")
		T.eq(Rarity.roll(fixed(0.99999), weights), 6, "casi 1 → mítica")
	end)

	T.test("la Tirada de suerte (mínimo Épica) nunca da menos de Épica", function()
		T.eq(Rarity.roll(fixed(0), weights, Config.LuckyRoll.minRarity), 4)
		T.eq(Rarity.roll(fixed(0.99999), weights, Config.LuckyRoll.minRarity), 6)
		local rng = Rng.new(99)
		for _ = 1, 5000 do
			T.truthy(Rarity.roll(rng, weights, Config.LuckyRoll.minRarity) >= 4)
		end
	end)

	T.test("las frecuencias se parecen a los pesos (100.000 tiradas)", function()
		local rng = Rng.new(12345)
		local counts = { 0, 0, 0, 0, 0, 0 }
		local n = 100000
		for _ = 1, n do
			local i = Rarity.roll(rng, weights)
			counts[i] += 1
		end
		for i = 1, 6 do
			T.near(counts[i] / n, Rarity.chance(weights, i), 0.01, Config.Rarities[i].id)
		end
		T.truthy(counts[6] > 0, "sale alguna mítica")
	end)

	T.test("probabilidades: suman 1 y respetan el mínimo", function()
		local sum = 0
		for i = 1, 6 do
			sum += Rarity.chance(weights, i)
		end
		T.near(sum, 1, 1e-9, "suma")
		T.near(Rarity.chance(weights, 1), 0.6, 1e-9, "común")
		T.eq(Rarity.chance(weights, 2, 4), 0, "por debajo del mínimo")
		T.near(Rarity.chance(weights, 4, 4), 38 / 50, 1e-9, "épica en la Tirada de suerte")
	end)

	T.test("pesos a cero o mínimo fuera de rango no rompen la tirada", function()
		T.eq(Rarity.roll(fixed(0.5), { 0, 0, 0 }), 1)
		T.eq(Rarity.roll(fixed(0.5), weights, 99), 6)
		T.eq(Rarity.roll(fixed(0.5), weights, -3), 1)
	end)
end
