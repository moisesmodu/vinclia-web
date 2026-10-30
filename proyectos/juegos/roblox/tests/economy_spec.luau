-- Pruebas de src/shared/Economy.luau con los valores reales de Config.

local Config = require("../src/shared/Config")
local Economy = require("../src/shared/Economy")

return function(T)
	T.section("Economy")

	T.test("el precio del nivel 0 es el precio base", function()
		for _, id in Config.UpgradeOrder do
			local def = Config.Upgrades[id]
			T.eq(Economy.upgradeCost(def, 0), def.baseCost, id)
		end
	end)

	T.test("los precios suben en cada nivel y se acaban en el máximo", function()
		for _, id in Config.UpgradeOrder do
			local def = Config.Upgrades[id]
			local previous = 0
			for level = 0, def.maxLevel - 1 do
				local cost = Economy.upgradeCost(def, level)
				T.truthy(cost ~= nil and cost > previous, id .. " nivel " .. level)
				previous = cost :: number
			end
			T.eq(Economy.upgradeCost(def, def.maxLevel), nil, id .. " en el máximo")
			T.eq(Economy.upgradeCost(def, def.maxLevel + 3), nil, id .. " por encima del máximo")
		end
	end)

	T.test("hay 10 niveles de cada mejora", function()
		for _, id in Config.UpgradeOrder do
			T.eq(Config.Upgrades[id].maxLevel, 10, id)
		end
	end)

	T.test("sin huevos no se cobra", function()
		T.eq(Economy.payout(0, 6, 900, Config.Payout, 1), 0)
		T.eq(Economy.payout(-3, 6, 900, Config.Payout, 2), 0)
	end)

	T.test("el pago crece con los huevos y con la distancia", function()
		local previous = 0
		for eggs = 1, 20 do
			local coins = Economy.payout(eggs, 30, 900, Config.Payout, 1)
			T.truthy(coins > previous, "huevos " .. eggs)
			previous = coins
		end
		T.truthy(Economy.payout(5, 30, 1200, Config.Payout, 1) > Economy.payout(5, 30, 300, Config.Payout, 1))
	end)

	T.test("ir lleno da bonificación", function()
		local full = Economy.payout(6, 6, 900, Config.Payout, 1)
		local almost = Economy.payout(6, 7, 900, Config.Payout, 1)
		T.truthy(full > almost, "lleno > casi lleno")
	end)

	T.test("el pase 2x duplica el pago", function()
		local one = Economy.payout(7, 10, 900, Config.Payout, 1)
		local two = Economy.payout(7, 10, 900, Config.Payout, Config.Payout.doubleCashMultiplier)
		T.near(two, one * 2, 1, "doble")
	end)

	T.test("un multiplicador menor que 1 no reduce el pago", function()
		T.eq(Economy.payout(4, 10, 900, Config.Payout, 0), Economy.payout(4, 10, 900, Config.Payout, 1))
	end)

	T.test("valor de ejemplo: 6 huevos, camión de 6, 900 studs", function()
		-- 6 · 6 = 36; · (1 + 9 · 0,05) = 52,2; · 1,25 (lleno) = 65,25 → 65
		T.eq(Economy.payout(6, 6, 900, Config.Payout, 1), 65)
	end)

	T.test("la granja va más rápido con cada nivel, sin bajar del mínimo", function()
		T.eq(Economy.farmInterval(0, Config.Farm), Config.Farm.baseInterval)
		local previous = math.huge
		for level = 0, 10 do
			local interval = Economy.farmInterval(level, Config.Farm)
			T.truthy(interval <= previous, "nivel " .. level)
			T.truthy(interval >= Config.Farm.minInterval, "mínimo en nivel " .. level)
			previous = interval
		end
		T.eq(Economy.farmInterval(100, Config.Farm), Config.Farm.minInterval)
	end)

	T.test("gallineros y almacén con y sin segunda granja", function()
		T.eq(Economy.collectorCount(false, Config.Farm), Config.Farm.collectorsBase)
		T.eq(Economy.collectorCount(true, Config.Farm), Config.Farm.collectorsBase + Config.Farm.collectorsSecondFarm)
		T.eq(Economy.farmStorage(3, Config.Farm), 3 * Config.Farm.storagePerCollector)
	end)

	T.test("capacidad del camión", function()
		local t = Config.Truck
		T.eq(Economy.truckCapacity(0, false, t), t.baseCapacity)
		T.eq(Economy.truckCapacity(3, false, t), t.baseCapacity + 3 * t.capacityPerLevel)
		T.eq(Economy.truckCapacity(3, true, t), t.baseCapacity + 3 * t.capacityPerLevel + t.bigTruckBonus)
		-- la caja del camión normal tiene 5 columnas · 6 filas = 30 huevos por capa
		T.truthy(Economy.truckCapacity(10, false, t) <= 30, "cabe en una capa")
	end)

	T.test("paredes y suspensión mejoran y se quedan en su rango", function()
		local t = Config.Truck
		T.truthy(Economy.wallHeight(10, t) > Economy.wallHeight(0, t))
		local d0, travel0 = Economy.suspension(0, t)
		local d10, travel10 = Economy.suspension(10, t)
		T.eq(d0, t.baseDampingRatio)
		T.truthy(d10 > d0 and d10 <= t.maxDampingRatio, "amortiguación")
		T.truthy(travel10 > travel0, "recorrido")
		T.truthy(Economy.breakSpeed(10, Config.Egg) > Economy.breakSpeed(0, Config.Egg), "huevos más duros")
	end)

	T.test("huevo de oro: mínimo o 3 veces la mejor entrega", function()
		T.eq(Economy.goldenEggValue(0, Config.GoldenEgg), Config.GoldenEgg.minCoins)
		T.eq(Economy.goldenEggValue(1000, Config.GoldenEgg), 3000)
	end)

	T.test("ganadores de la carrera", function()
		local winners, best = Economy.raceWinners({})
		T.eq(#winners, 0, "vacía")
		T.eq(best, 0)
		winners, best = Economy.raceWinners({ [10] = 0, [11] = 0 })
		T.eq(#winners, 0, "nadie entregó")
		winners, best = Economy.raceWinners({ [10] = 4, [11] = 9, [12] = 2 })
		T.eq(#winners, 1)
		T.eq(winners[1], 11)
		T.eq(best, 9)
		winners = Economy.raceWinners({ [30] = 5, [20] = 5, [40] = 1 })
		T.eq(#winners, 2, "empate")
		T.eq(winners[1], 20, "ordenados")
		T.eq(winners[2], 30)
	end)

	T.test("premio de la carrera", function()
		T.eq(Economy.raceBonus(0, Config.Race), 0)
		T.eq(Economy.raceBonus(5, Config.Race), Config.Race.bonusBase + 5 * Config.Race.bonusPerEgg)
	end)

	T.test("formato corto de números", function()
		T.eq(Economy.short(950), "950")
		T.eq(Economy.short(9999), "9999")
		T.eq(Economy.short(12500), "12.5K")
		T.eq(Economy.short(3400000), "3.4M")
	end)

	T.test("los IDs de la tienda son enteros >= 0 (0 = apagado)", function()
		for name, id in Config.GamePasses do
			T.truthy(type(id) == "number" and id >= 0 and id == math.floor(id), name)
		end
		for name, id in Config.Products do
			T.truthy(type(id) == "number" and id >= 0 and id == math.floor(id), name)
		end
	end)
end
