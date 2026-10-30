-- Pruebas de src/shared/Economy.luau con los valores reales de Config.

local Config = require("../src/shared/Config")
local Economy = require("../src/shared/Economy")

return function(T)
	T.section("Economy")

	T.test("multiplicador de renacer: 1, 1,5, 2...", function()
		T.eq(Economy.rebirthMultiplier(0, Config.Income.perRebirth), 1)
		T.eq(Economy.rebirthMultiplier(1, Config.Income.perRebirth), 1.5)
		T.eq(Economy.rebirthMultiplier(4, Config.Income.perRebirth), 3)
		T.eq(Economy.rebirthMultiplier(-2, Config.Income.perRebirth), 1, "nunca menos de 1")
	end)

	T.test("multiplicador total con y sin el pase 2×", function()
		T.eq(Economy.multiplier(0, false, Config.Income), 1)
		T.eq(Economy.multiplier(0, true, Config.Income), 2)
		T.eq(Economy.multiplier(2, true, Config.Income), 4)
	end)

	T.test("renacer cuesta cada vez más y tiene máximo", function()
		local p = Config.Rebirth
		T.eq(Economy.rebirthCost(0, p), p.baseCost)
		T.eq(Economy.rebirthCost(1, p), p.baseCost * p.growth)
		local previous = 0
		for n = 0, p.maxRebirths - 1 do
			local cost = Economy.rebirthCost(n, p)
			T.truthy(cost ~= nil and cost > previous, "renacer " .. n)
			previous = cost or 0
		end
		T.eq(Economy.rebirthCost(p.maxRebirths, p), nil)
	end)

	T.test("vender devuelve la mitad del precio, redondeando hacia abajo", function()
		T.eq(Economy.sellValue(25, Config.Pets.sellFraction), 12)
		T.eq(Economy.sellValue(120, Config.Pets.sellFraction), 60)
		T.eq(Economy.sellValue(100, 3), 100, "fracción como mucho 1")
		T.eq(Economy.sellValue(100, -1), 0)
	end)

	T.test("ganancias sin conectar: con tope de horas y a la mitad", function()
		local p = Config.Offline
		T.eq(Economy.offlineEarnings(10, 30, p), 0, "menos de un minuto")
		T.eq(Economy.offlineEarnings(10, 120, p), 600, "2 minutos a 10/s, al 50 %")
		T.eq(Economy.offlineEarnings(10, p.maxSeconds, p), 72000, "4 horas")
		T.eq(Economy.offlineEarnings(10, 1e7, p), 72000, "más de 4 horas: el tope")
		T.eq(Economy.offlineEarnings(0, 3600, p), 0, "sin gelatinas")
		T.eq(Economy.offlineEarnings(10, -500, p), 0, "reloj hacia atrás")
	end)

	T.test("bolsa de monedas: mínimo o 15 minutos de ingresos", function()
		T.eq(Economy.coinPack(0, Config.CoinPack), 1000)
		T.eq(Economy.coinPack(1, Config.CoinPack), 1000)
		T.eq(Economy.coinPack(10, Config.CoinPack), 9000)
	end)

	T.test("formato corto", function()
		T.eq(Economy.short(950), "950")
		T.eq(Economy.short(9999.7), "9999")
		T.eq(Economy.short(12500), "12.5K")
		T.eq(Economy.short(3400000), "3.4M")
		T.eq(Economy.short(2e9), "2.0B")
		T.eq(Economy.short(5e12), "5.0T")
	end)
end
