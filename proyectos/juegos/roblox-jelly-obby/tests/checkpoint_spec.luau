-- Pruebas de src/shared/Checkpoint.luau: solo se avanza de uno en uno, saltar fase suma 1 y nunca pasa de la última,
-- reiniciar solo desde la cima y los controles contra teletransportes.

local Checkpoint = require("../src/shared/Checkpoint")
local Config = require("../src/shared/Config")

return function(T)
	T.section("Checkpoint")
	local n = Config.Tower.stages

	T.test("la cima es el checkpoint N + 1", function()
		T.eq(Checkpoint.finish(n), n + 1)
	end)

	T.test("solo cuenta el checkpoint siguiente", function()
		T.eq(Checkpoint.reach(1, 2, n, 10, 1), "ok")
		T.eq(Checkpoint.reach(5, 6, n, 10, 1), "ok")
		T.eq(Checkpoint.reach(n, n + 1, n, 10, 1), "ok", "la cima")
		T.eq(Checkpoint.reach(5, 5, n, 10, 1), "same")
		T.eq(Checkpoint.reach(5, 3, n, 10, 1), "behind")
		T.eq(Checkpoint.reach(5, 7, n, 10, 1), "ahead", "saltarse un checkpoint")
		T.eq(Checkpoint.reach(1, n + 1, n, 999, 1), "ahead", "teletransporte a la cima")
	end)

	T.test("checkpoints imposibles", function()
		T.eq(Checkpoint.reach(n + 1, n + 2, n, 10, 1), "invalid", "más allá de la cima")
		T.eq(Checkpoint.reach(1, 0, n, 10, 1), "invalid")
		T.eq(Checkpoint.reach(1, 1.5, n, 10, 1), "invalid")
	end)

	T.test("demasiado rápido para ser de verdad", function()
		T.eq(Checkpoint.reach(3, 4, n, 0.2, 1.2), "early")
		T.eq(Checkpoint.reach(3, 4, n, 1.2, 1.2), "ok")
		local a = Config.AntiCheat
		local minimum = Checkpoint.minSeconds(Config.Tower.side, a.maxPlausibleSpeed, a.minTimeSlack)
		T.near(minimum, Config.Tower.side / a.maxPlausibleSpeed * a.minTimeSlack, 1e-9)
		T.truthy(minimum > 0.5 and minimum < 5, "ni regala ni castiga a los rápidos")
		T.eq(Checkpoint.minSeconds(10, 0, 1), 10, "velocidad 0 no divide por cero")
	end)

	T.test("saltar fase: +1, nunca más allá de la última", function()
		local ok, stage = Checkpoint.skip(1, n)
		T.eq(ok, true)
		T.eq(stage, 2)
		ok, stage = Checkpoint.skip(n - 1, n)
		T.eq(ok, true)
		T.eq(stage, n)
		ok, stage = Checkpoint.skip(n, n)
		T.eq(ok, false, "desde la última fase la cima hay que pisarla")
		T.eq(stage, n)
		ok, stage = Checkpoint.skip(n + 1, n)
		T.eq(ok, false, "desde la cima")
		T.eq(stage, n + 1)
		ok = Checkpoint.skip(0, n)
		T.eq(ok, false)
	end)

	T.test("reiniciar la torre solo desde la cima", function()
		T.eq(Checkpoint.canRestart(n + 1, n), true)
		T.eq(Checkpoint.canRestart(n, n), false)
		T.eq(Checkpoint.canRestart(1, n), false)
	end)

	T.test("fase guardada: siempre entre 1 y la cima", function()
		T.eq(Checkpoint.sanitize(7, n), 7)
		T.eq(Checkpoint.sanitize(7.9, n), 7)
		T.eq(Checkpoint.sanitize(-3, n), 1)
		T.eq(Checkpoint.sanitize(500, n), n + 1)
		T.eq(Checkpoint.sanitize(0 / 0, n), 1, "NaN")
	end)

	T.test("teletransportes: distancias cortas siempre, largas solo a velocidad posible", function()
		local a = Config.AntiCheat
		T.eq(Checkpoint.plausibleMove(10, 10, 0.01, a), true, "cerca: nunca es teletransporte")
		T.eq(Checkpoint.plausibleMove(30, 0, 0.5, a), true)
		T.eq(Checkpoint.plausibleMove(45, 0, 0.5, a), true, "90 studs/s: cabe")
		T.eq(Checkpoint.plausibleMove(300, 0, 0.5, a), false, "600 studs/s")
		T.eq(Checkpoint.plausibleMove(0, 200, 0, a), false)
		local coil = Config.Coils.speedWalkSpeed + Config.Obstacles.conveyorSpeed[2]
		T.truthy(coil <= a.maxPlausibleSpeed, "bobina + cinta a favor caben en la velocidad creíble")
		T.truthy(a.maxPlausibleSpeed < a.maxHorizontalSpeed)
	end)

	T.test("caer por debajo del checkpoint", function()
		T.eq(Checkpoint.fallen(100, 120, 40), false)
		T.eq(Checkpoint.fallen(79, 120, 40), true)
	end)
end
