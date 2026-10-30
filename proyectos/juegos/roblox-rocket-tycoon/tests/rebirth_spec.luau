-- Pruebas de src/shared/Rebirth.luau y src/shared/Offline.luau: renacer y ganancias sin conectar.

local Config = require("../src/shared/Config")
local Offline = require("../src/shared/Offline")
local Rebirth = require("../src/shared/Rebirth")

return function(T)
	T.section("Rebirth y Offline")
	local r = Config.Rebirth

	T.test("multiplicador: 1, 1.5, 2...", function()
		T.eq(Rebirth.multiplier(0, r.perRebirth), 1)
		T.eq(Rebirth.multiplier(1, r.perRebirth), 1.5)
		T.eq(Rebirth.multiplier(4, r.perRebirth), 3)
		T.eq(Rebirth.multiplier(-3, r.perRebirth), 1, "nunca menos de 1")
	end)

	T.test("precio: base · crecimiento^n y nil al máximo", function()
		T.eq(Rebirth.cost(0, r), 500000)
		T.eq(Rebirth.cost(1, r), 1000000)
		T.eq(Rebirth.cost(3, r), 4000000)
		T.eq(Rebirth.cost(r.maxRebirths, r), nil)
		T.eq(Rebirth.cost(r.maxRebirths - 1, r) ~= nil, true)
	end)

	T.test("check: hace falta el último botón y las monedas", function()
		T.eq(Rebirth.check(500000, 0, true, r), "ok")
		T.eq(Rebirth.check(499999, 0, true, r), "coins")
		T.eq(Rebirth.check(10 ^ 30, 0, false, r), "final")
		T.eq(Rebirth.check(10 ^ 30, r.maxRebirths, true, r), "max")
		T.eq(Rebirth.check(1000000, 1, true, r), "ok")
		T.eq(Rebirth.check(999999, 1, true, r), "coins")
	end)

	T.test("sin conectar: primera vez y menos de 2 minutos no cuentan", function()
		local o = Config.Offline
		T.eq(Offline.seconds(0, 1000000, o), 0, "primera vez")
		T.eq(Offline.seconds(1000000, 1000119, o), 0, "119 s")
		T.eq(Offline.seconds(1000000, 1000120, o), 120, "120 s")
		T.eq(Offline.seconds(1000000, 999000, o), 0, "reloj hacia atrás")
	end)

	T.test("sin conectar: la mitad, con tope de 4 horas", function()
		local o = Config.Offline
		T.eq(Offline.earnings(1000000, 1000000 + 3600, 10, o), 18000, "1 h a 10/s")
		T.eq(Offline.seconds(1000000, 1000000 + 30 * 86400, o), 14400, "tope")
		T.eq(Offline.earnings(1000000, 1000000 + 30 * 86400, 10, o), 72000, "tope: 4 h")
		T.eq(Offline.earnings(1000000, 1000000 + 3600, 0, o), 0, "base vacía")
		T.eq(Offline.earnings(1000000, 1000000 + 3600, 1.5, o), 2700)
		T.eq(Offline.earnings(1000000, 1000000 + 301, 0.3, o), 45, "redondea hacia abajo")
	end)
end
