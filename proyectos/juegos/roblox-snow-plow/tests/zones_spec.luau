-- Pruebas de src/shared/Zones.luau: geometría de las zonas y reglas para abrirlas.

local Config = require("../src/shared/Config")
local Zones = require("../src/shared/Zones")

return function(T)
	T.section("Zones")
	local w = Config.World
	local count = #Config.Zones

	T.test("las zonas van seguidas por el eje Z", function()
		local b1 = Zones.bounds(1, w)
		local b2 = Zones.bounds(2, w)
		T.eq(b1.minZ, 0)
		T.eq(b1.maxZ, w.zoneLength)
		T.eq(b2.minZ, b1.maxZ, "la 2 empieza donde acaba la 1")
		T.eq(b1.minX, -w.zoneWidth / 2)
		T.eq(b1.maxX, w.zoneWidth / 2)
	end)

	T.test("zona de una posición", function()
		T.eq(Zones.indexAt(0, w, count), 1)
		T.eq(Zones.indexAt(w.zoneLength - 0.01, w, count), 1)
		T.eq(Zones.indexAt(w.zoneLength, w, count), 2, "la puerta ya es de la siguiente")
		T.eq(Zones.indexAt(-50, w, count), 1, "antes del mapa: la primera")
		T.eq(Zones.indexAt(w.zoneLength * 99, w, count), count, "después: la última")
	end)

	T.test("depósito, centro y llegada dentro de su zona", function()
		for index = 1, count do
			local b = Zones.bounds(index, w)
			local dx, dz = Zones.depot(index, w)
			local ax, az = Zones.arrival(index, w)
			local cx, cz = Zones.center(index, w)
			for _, point in { { dx, dz }, { ax, az }, { cx, cz } } do
				T.truthy(point[1] > b.minX and point[1] < b.maxX, "x zona " .. index)
				T.truthy(point[2] > b.minZ and point[2] < b.maxZ, "z zona " .. index)
			end
			local ddx = ax - dx
			local ddz = az - dz
			T.truthy(math.sqrt(ddx * ddx + ddz * ddz) > w.depotRadius, "se llega fuera del depósito")
		end
	end)

	T.test("solo se puede estar en zonas abiertas", function()
		T.eq(Zones.isAllowed(1, 1), true)
		T.eq(Zones.isAllowed(2, 1), false)
		T.eq(Zones.isAllowed(2, 3), true)
		T.eq(Zones.isAllowed(0, 3), false)
	end)

	T.test("abrir zonas: en orden, con monedas y renacimientos", function()
		local park = Config.Zones[2]
		local pole = Config.Zones[4]
		local function ask(unlocked: number, target: number, coins: number, rebirths: number)
			local request = { unlocked = unlocked, target = target, count = count, coins = coins, rebirths = rebirths }
			return Zones.canUnlock(request, Config.Zones[target])
		end
		T.eq(ask(1, 2, park.cost, 0), "ok")
		T.eq(ask(1, 2, park.cost - 1, 0), "coins")
		T.eq(ask(2, 2, 10 ^ 9, 0), "owned")
		T.eq(ask(2, 1, 10 ^ 9, 0), "owned")
		T.eq(ask(1, 3, 10 ^ 9, 0), "order", "no se puede saltar una zona")
		T.eq(ask(3, 4, pole.cost, 0), "rebirths", "el Polo Norte pide haber renacido")
		T.eq(ask(3, 4, pole.cost, pole.minRebirths), "ok")
		T.eq(ask(3, 4, pole.cost - 1, 5), "coins")
		T.eq(ask(4, 5, 10 ^ 9, 9), "invalid", "no existe")
		T.eq(ask(1, 0, 10 ^ 9, 9), "invalid")
		local request = { unlocked = 1, target = 1.5, count = count, coins = 10 ^ 9, rebirths = 0 }
		T.eq(Zones.canUnlock(request, park), "invalid", "zona con decimales")
	end)

	T.test("cada zona vale más y cuesta más que la anterior", function()
		T.eq(Config.Zones[1].cost, 0, "la primera es gratis")
		for i = 2, count do
			T.truthy(Config.Zones[i].value > Config.Zones[i - 1].value, "valor " .. i)
			T.truthy(Config.Zones[i].cost > Config.Zones[i - 1].cost, "precio " .. i)
		end
	end)
end
