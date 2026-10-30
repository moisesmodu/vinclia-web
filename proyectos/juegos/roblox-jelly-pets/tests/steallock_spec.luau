-- Pruebas de src/shared/StealLock.luau: tiempos del candado, mejoras y reglas para llevarse una gelatina.

local Config = require("../src/shared/Config")
local StealLock = require("../src/shared/StealLock")

type Overrides = {
	isOwn: boolean?,
	petHome: boolean?,
	ownerLocked: boolean?,
	thiefCarrying: boolean?,
	thiefHasFreePad: boolean?,
}

-- Contexto en el que se puede llevar la gelatina, con los cambios de `o`.
local function ctx(o: Overrides): StealLock.StealContext
	return {
		isOwn = o.isOwn == true,
		petHome = o.petHome ~= false,
		ownerLocked = o.ownerLocked == true,
		thiefCarrying = o.thiefCarrying == true,
		thiefHasFreePad = o.thiefHasFreePad ~= false,
	}
end

return function(T)
	T.section("StealLock")
	local p = Config.Lock

	T.test("duración: base, por nivel, tope de nivel y pase", function()
		T.eq(StealLock.duration(0, false, p), 30)
		T.eq(StealLock.duration(4, false, p), 50)
		T.eq(StealLock.duration(10, false, p), 80)
		T.eq(StealLock.duration(99, false, p), 80, "nivel acotado")
		T.eq(StealLock.duration(0, true, p), 45, "pase ×1,5")
		T.eq(StealLock.cooldown(false, p), 25)
		T.eq(StealLock.cooldown(true, p), 15)
	end)

	T.test("pulsar: bloquea N segundos y luego recarga", function()
		local state = StealLock.newState()
		T.eq(StealLock.isLocked(state, 100), false, "al principio está abierto")
		local locked = StealLock.press(state, 100, 30, 25)
		T.truthy(locked ~= nil, "se puede pulsar")
		if locked then
			T.eq(locked.lockedUntil, 130)
			T.eq(locked.readyAt, 155)
			T.eq(StealLock.isLocked(locked, 129.9), true)
			T.eq(StealLock.isLocked(locked, 130), false, "se abre a los 30 s")
			T.near(StealLock.remaining(locked, 110), 20, 1e-9, "quedan 20 s")
			T.eq(StealLock.remaining(locked, 500), 0)
			T.eq(StealLock.press(locked, 120, 30, 25), nil, "puesto: no se vuelve a pulsar")
			T.eq(StealLock.press(locked, 140, 30, 25), nil, "recargando")
			local again = StealLock.press(locked, 155, 30, 25)
			T.truthy(again ~= nil and again.lockedUntil == 185, "recargado")
		end
	end)

	T.test("mejora del candado: cada vez más cara y con máximo", function()
		T.eq(StealLock.upgradeCost(0, p), p.upgradeBaseCost)
		local previous = 0
		for level = 0, p.maxLevel - 1 do
			local cost = StealLock.upgradeCost(level, p)
			T.truthy(cost ~= nil and cost > previous, "nivel " .. level)
			previous = cost or 0
		end
		T.eq(StealLock.upgradeCost(p.maxLevel, p), nil)
	end)

	T.test("reglas: se puede llevar una gelatina ajena, quieta, sin candado y con sitio", function()
		T.eq(StealLock.canSteal(ctx({})), "ok")
		T.eq(StealLock.canSteal(ctx({ isOwn = true })), "own")
		T.eq(StealLock.canSteal(ctx({ petHome = false })), "busy")
		T.eq(StealLock.canSteal(ctx({ ownerLocked = true })), "locked")
		T.eq(StealLock.canSteal(ctx({ thiefCarrying = true })), "carrying")
		T.eq(StealLock.canSteal(ctx({ thiefHasFreePad = false })), "full")
	end)

	T.test("reglas: la tuya nunca, aunque todo lo demás falle", function()
		T.eq(
			StealLock.canSteal(ctx({ isOwn = true, ownerLocked = true, petHome = false, thiefHasFreePad = false })),
			"own"
		)
	end)

	T.test("tiempo máximo para llevarla a casa", function()
		T.eq(StealLock.carryExpired(100, 120, Config.Steal.carryTimeout), false)
		T.eq(StealLock.carryExpired(100, 145, Config.Steal.carryTimeout), true)
	end)
end
