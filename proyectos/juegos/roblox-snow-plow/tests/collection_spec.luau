-- Pruebas de src/shared/Collection.luau: pala, mochila, valor de la nieve y descarga.

local Collection = require("../src/shared/Collection")
local Config = require("../src/shared/Config")

return function(T)
	T.section("Collection")
	local p = Config.Plow

	T.test("ancho de la pala por nivel", function()
		T.eq(Collection.bladeWidth(0, p), p.baseBlade)
		T.eq(Collection.bladeWidth(3, p), p.baseBlade + 3 * p.bladePerLevel)
		T.eq(Collection.bladeWidth(-2, p), p.baseBlade, "nivel negativo cuenta como 0")
	end)

	T.test("capacidad: crece por nivel y se dobla con la mochila grande", function()
		T.eq(Collection.capacity(0, false, p), p.baseCapacity)
		T.eq(Collection.capacity(1, false, p), 30)
		T.eq(Collection.capacity(2, false, p), 45)
		T.eq(Collection.capacity(0, true, p), p.baseCapacity * p.bigBackpackMultiplier)
		local previous = 0
		for level = 0, 12 do
			local c = Collection.capacity(level, false, p)
			T.truthy(c > previous, "siempre crece")
			previous = c
		end
	end)

	T.test("velocidad y descarga automática", function()
		T.eq(Collection.walkSpeed(0, p), 16)
		T.eq(Collection.walkSpeed(2, p), 19)
		T.eq(Collection.autoUnloadRate(0, p), 0, "sin mejora no hay descarga automática")
		T.near(Collection.autoUnloadRate(1, p), 0.5, 1e-9)
		T.near(Collection.autoUnloadRate(5, p), 0.9, 1e-9)
		T.eq(Collection.autoUnloadRate(50, p), 1, "nunca más del 100 %")
	end)

	T.test("solo cabe lo que queda libre", function()
		T.eq(Collection.take(3, 0, 20), 3)
		T.eq(Collection.take(3, 18, 20), 2, "a medias")
		T.eq(Collection.take(3, 20, 20), 0, "llena")
		T.eq(Collection.take(3, 25, 20), 0, "más que llena (capacidad bajada)")
		T.eq(Collection.take(0, 0, 20), 0)
		T.eq(Collection.isFull(20, 20), true)
		T.eq(Collection.isFull(19, 20), false)
	end)

	T.test("valor de la nieve: zona, compañeros y pase 2×", function()
		T.eq(Collection.snowValue(3, 4, 0, false, p), 12)
		T.near(Collection.snowValue(3, 4, 0.5, false, p), 18, 1e-9)
		T.near(Collection.snowValue(3, 4, 0.5, true, p), 36, 1e-9)
		T.eq(Collection.snowValue(3, 4, -1, false, p), 12, "un bonus negativo no resta")
	end)

	T.test("monedas al descargar", function()
		T.eq(Collection.unloadCoins(100, 1, 1), 100)
		T.eq(Collection.unloadCoins(100, 2.5, 1), 250)
		T.eq(Collection.unloadCoins(100, 1, 0.5), 50, "descarga automática al 50 %")
		T.eq(Collection.unloadCoins(99.9, 1, 1), 99, "se redondea hacia abajo")
		T.eq(Collection.unloadCoins(100, 0, 1), 100, "el multiplicador nunca baja de 1")
		T.eq(Collection.unloadCoins(100, 1, 3), 100, "nunca más del 100 %")
	end)

	T.test("la pala toca lo que tiene delante", function()
		-- inBlade(localX, localZ, halfWidth, depth, radius)
		T.eq(Collection.inBlade(0, 0, 2, 2.5, 1), true, "centro")
		T.eq(Collection.inBlade(2.9, 0, 2, 2.5, 1), true, "borde con radio")
		T.eq(Collection.inBlade(3.1, 0, 2, 2.5, 1), false, "fuera por un lado")
		T.eq(Collection.inBlade(0, 2.2, 2, 2.5, 1), true, "fondo con radio")
		T.eq(Collection.inBlade(0, 2.3, 2, 2.5, 1), false, "demasiado lejos")
		T.eq(Collection.inBlade(-6, 0, 7, 2.5, 0), true, "pala ancha")
	end)

	T.test("imán y antitrampas", function()
		T.eq(Collection.inMagnet(6, 8, 10), true)
		T.eq(Collection.inMagnet(6, 8.1, 10), false)
		-- plausibleMove(distance, seconds, speed, slack, extra)
		T.eq(Collection.plausibleMove(5, 0.1, 16, 1.6, 4), true, "andando")
		T.eq(Collection.plausibleMove(40, 0.1, 16, 1.6, 4), false, "teletransporte")
		T.eq(Collection.plausibleMove(3, -1, 16, 1.6, 4), true, "reloj raro: solo el margen")
	end)
end
