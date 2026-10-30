-- Pruebas de src/shared/Income.luau: extractores, escáneres, cúpulas, cristales, pase, ticks y Cash Pack.

local Buttons = require("../src/shared/Buttons")
local Config = require("../src/shared/Config")
local Income = require("../src/shared/Income")

return function(T)
	T.section("Income")
	local defs = Config.Buttons
	local all: { string } = {}
	for _, d in defs do
		table.insert(all, d.id)
	end

	T.test("un extractor: 3 monedas cada 2 s = 1.5/s", function()
		local owned = Buttons.toSet({ "drill1" })
		T.eq(Income.baseRate(defs, owned), 1.5)
		T.eq(Income.upgradeFactor(defs, owned), 1)
		T.eq(Income.domeFactor(defs, owned), 1)
		T.eq(Income.perSecond(defs, owned, 1), 1.5)
	end)

	T.test("el escáner multiplica lo de todos los extractores", function()
		local owned = Buttons.toSet({ "drill1", "drill2", "drill3", "scanner1" })
		T.eq(Income.baseRate(defs, owned), 6.5)
		T.eq(Income.upgradeFactor(defs, owned), 1.5)
		T.near(Income.perSecond(defs, owned, 1), 9.75, 1e-9)
	end)

	T.test("base completa: 149/s · 7.5 · 1.3", function()
		local owned = Buttons.toSet(all)
		T.eq(Income.baseRate(defs, owned), 149)
		T.eq(Income.upgradeFactor(defs, owned), 7.5)
		T.near(Income.domeFactor(defs, owned), 1.3, 1e-9)
		T.near(Income.perSecond(defs, owned, 1), 1452.75, 1e-6)
		T.near(Income.perSecond(defs, owned, 2), 2905.5, 1e-6, "con multiplicador")
		T.near(Income.oreValue(160, defs, owned), 1560, 1e-6, "roca del último extractor")
	end)

	T.test("sin nada comprado no se gana nada", function()
		T.eq(Income.perSecond(defs, {}, 5), 0)
		T.eq(Income.perSecond(defs, Buttons.toSet(all), -1), 0, "multiplicador negativo = 0")
	end)

	T.test("cristales: +1 % cada uno, tope ×3 que sube con el renacer", function()
		local p = Config.Crystals
		T.eq(Income.crystalMultiplier(0, 0, p), 1)
		T.near(Income.crystalMultiplier(100, 0, p), 2, 1e-9)
		T.near(Income.crystalMultiplier(200, 0, p), 3, 1e-9)
		T.near(Income.crystalMultiplier(500, 0, p), 3, 1e-9, "tope")
		T.near(Income.crystalMultiplier(500, 2, p), 4, 1e-9, "tope con 2 renacimientos")
		T.eq(Income.crystalMultiplier(-50, 0, p), 1, "nunca menos de 1")
	end)

	T.test("multiplicador del jugador: renacer · cristales · pase", function()
		local boosts = {
			rebirths = 2,
			perRebirth = Config.Rebirth.perRebirth,
			crystals = 100,
			doubleCash = true,
			doubleCashMultiplier = Config.Income.doubleCashMultiplier,
		}
		T.near(Income.playerMultiplier(boosts, Config.Crystals), 8, 1e-9)
		boosts.doubleCash = false
		T.near(Income.playerMultiplier(boosts, Config.Crystals), 4, 1e-9)
		T.eq(Income.rebirthMultiplier(0, 0.5), 1)
		T.eq(Income.rebirthMultiplier(3, 0.5), 2.5)
	end)

	T.test("ticks: monedas enteras y el resto se guarda", function()
		local coins, carry = Income.accumulate(0.5, 1.5, 1)
		T.eq(coins, 2)
		T.eq(carry, 0)
		local c2, r2 = Income.accumulate(0, 0.3, 1)
		T.eq(c2, 0)
		T.near(r2, 0.3, 1e-9)
		local total = 0
		local rest = 0
		for _ = 1, 8 do
			local got
			got, rest = Income.accumulate(rest, 0.25, 1)
			total += got
		end
		T.eq(total, 2, "8 ticks de 0.25 = 2 monedas")
		T.eq(rest, 0)
		local c3, r3 = Income.accumulate(0.25, -4, 1)
		T.eq(c3, 0, "ingresos negativos no restan")
		T.eq(r3, 0.25)
	end)

	T.test("Cash Pack: 10 minutos de ingresos, mínimo 500", function()
		T.eq(Income.cashPack(0, Config.CashPack), 500)
		T.eq(Income.cashPack(0.5, Config.CashPack), 500)
		T.eq(Income.cashPack(1452.75, Config.CashPack), 871650)
	end)

	T.test("formato corto", function()
		T.eq(Income.short(950), "950")
		T.eq(Income.short(9999), "9999")
		T.eq(Income.short(12500), "12.5K")
		T.eq(Income.short(3400000), "3.4M")
		T.eq(Income.short(2.5e9), "2.5B")
		T.eq(Income.short(1.3e12), "1.3T")
	end)
end
