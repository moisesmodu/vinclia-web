-- Pruebas de src/shared/Rebirth.luau y src/shared/Economy.luau: renacer, multiplicador y bolsa de monedas.

local Config = require("../src/shared/Config")
local Economy = require("../src/shared/Economy")
local Rebirth = require("../src/shared/Rebirth")

return function(T)
	T.section("Rebirth y Economy")
	local r = Config.Rebirth

	T.test("multiplicador: 1, 1.5, 2...", function()
		T.eq(Rebirth.multiplier(0, r.perRebirth), 1)
		T.eq(Rebirth.multiplier(1, r.perRebirth), 1.5)
		T.eq(Rebirth.multiplier(4, r.perRebirth), 3)
		T.eq(Rebirth.multiplier(-3, r.perRebirth), 1, "nunca menos de 1")
	end)

	T.test("precio de renacer y máximo", function()
		T.eq(Rebirth.cost(0, r), r.baseCost)
		T.eq(Rebirth.cost(1, r), r.baseCost * r.growth)
		T.eq(Rebirth.cost(r.maxRebirths, r), nil)
		T.eq(Rebirth.canRebirth(r.baseCost, 0, r), true)
		T.eq(Rebirth.canRebirth(r.baseCost - 1, 0, r), false)
		T.eq(Rebirth.canRebirth(10 ^ 30, r.maxRebirths, r), false, "al máximo no se renace")
	end)

	T.test("bolsa de monedas: crece con las zonas y el renacer", function()
		local c = Config.CoinPack
		T.eq(Economy.coinPack(1, 1, c), c.baseCoins)
		T.eq(Economy.coinPack(2, 1, c), c.baseCoins * c.zoneScale)
		T.eq(Economy.coinPack(2, 2, c), c.baseCoins * c.zoneScale * 2)
		T.eq(Economy.coinPack(0, 0, c), c.baseCoins, "valores raros: lo mínimo")
	end)

	T.test("formato corto", function()
		T.eq(Economy.short(950), "950")
		T.eq(Economy.short(9999), "9999")
		T.eq(Economy.short(12500), "12.5K")
		T.eq(Economy.short(3400000), "3.4M")
		T.eq(Economy.short(2.5e9), "2.5B")
	end)
end
