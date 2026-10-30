-- Pruebas de src/shared/Daily.luau: racha del premio diario.

local Config = require("../src/shared/Config")
local Daily = require("../src/shared/Daily")

return function(T)
	T.section("Daily")
	local max = Config.Daily.maxStreak

	T.test("número de día en UTC", function()
		T.eq(Daily.dayNumber(0), 0)
		T.eq(Daily.dayNumber(86399), 0)
		T.eq(Daily.dayNumber(86400), 1)
		T.eq(Daily.dayNumber(1_800_000_000), 20833)
	end)

	T.test("primera vez: racha 1", function()
		local ok, streak = Daily.claim(0, 0, 20000, max)
		T.eq(ok, true)
		T.eq(streak, 1)
	end)

	T.test("el mismo día no se puede repetir", function()
		local ok, streak = Daily.claim(20000, 3, 20000, max)
		T.eq(ok, false)
		T.eq(streak, 3)
		T.eq(Daily.canClaim(20000, 20000), false)
		T.eq(Daily.canClaim(20000, 20001), true)
	end)

	T.test("día seguido: la racha sube", function()
		local ok, streak = Daily.claim(20000, 3, 20001, max)
		T.eq(ok, true)
		T.eq(streak, 4)
	end)

	T.test("tras el día 7 vuelve a empezar", function()
		local _, streak = Daily.claim(20000, max, 20001, max)
		T.eq(streak, 1)
	end)

	T.test("si te saltas un día, racha 1", function()
		local ok, streak = Daily.claim(20000, 5, 20002, max)
		T.eq(ok, true)
		T.eq(streak, 1)
	end)

	T.test("reloj hacia atrás: no se reclama", function()
		local ok = Daily.claim(20005, 2, 20003, max)
		T.eq(ok, false)
	end)

	T.test("premio: base · racha y bonus el día 7", function()
		local p = Config.Daily
		T.eq(Daily.reward(1, p, 1), 25)
		T.eq(Daily.reward(3, p, 1), 75)
		T.eq(Daily.reward(7, p, 1), 375)
		T.eq(Daily.reward(7, p, 2), 750, "con multiplicador")
		T.eq(Daily.reward(0, p, 1), 25, "racha 0 cuenta como 1")
		T.eq(Daily.reward(30, p, 0.5), 375, "racha y multiplicador acotados")
	end)
end
