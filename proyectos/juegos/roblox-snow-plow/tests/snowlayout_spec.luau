-- Pruebas de src/shared/SnowLayout.luau: reparto determinista de los montones de cada zona.

local Config = require("../src/shared/Config")
local Rng = require("../src/shared/Rng")
local SnowLayout = require("../src/shared/SnowLayout")
local Zones = require("../src/shared/Zones")

local function paramsFor(index: number)
	local area = Zones.snowArea(index, Config.World)
	return {
		minX = area.minX,
		maxX = area.maxX,
		minZ = area.minZ,
		maxZ = area.maxZ,
		count = Config.Zones[index].piles,
		minSpacing = Config.Snow.minSpacing,
		minSize = Config.Snow.minSize,
		maxSize = Config.Snow.maxSize,
		maxTries = Config.Snow.maxTries,
		avoid = area.avoid,
	}
end

local function layout(index: number, seed: number?)
	return SnowLayout.generate(paramsFor(index), Rng.new(seed or Config.Zones[index].seed))
end

return function(T)
	T.section("SnowLayout")

	T.test("la misma semilla da el mismo pueblo", function()
		local a = layout(1)
		local b = layout(1)
		T.eq(#a, #b, "cuántos")
		for i = 1, #a do
			T.eq(a[i].x, b[i].x, "x " .. i)
			T.eq(a[i].z, b[i].z, "z " .. i)
			T.eq(a[i].size, b[i].size, "tamaño " .. i)
		end
	end)

	T.test("otra semilla da otro reparto", function()
		local a = layout(1, 1)
		local b = layout(1, 2)
		local same = 0
		for i = 1, math.min(#a, #b) do
			if a[i].x == b[i].x and a[i].z == b[i].z then
				same += 1
			end
		end
		T.truthy(same < 3, "casi todos distintos")
	end)

	T.test("cada zona tiene casi todos sus montones", function()
		for index, zone in Config.Zones do
			local piles = layout(index)
			T.truthy(#piles <= zone.piles, "no más de los pedidos")
			T.truthy(#piles >= zone.piles * 0.9, "zona " .. index .. ": " .. #piles .. " montones")
		end
	end)

	T.test("dentro de los límites de su zona y fuera de los huecos", function()
		for index in Config.Zones do
			local area = Zones.snowArea(index, Config.World)
			for _, p in layout(index) do
				T.truthy(p.x >= area.minX and p.x <= area.maxX, "x dentro")
				T.truthy(p.z >= area.minZ and p.z <= area.maxZ, "z dentro")
				T.eq(Zones.indexAt(p.z, Config.World, #Config.Zones), index, "en su zona")
				for _, c in area.avoid do
					local dx = p.x - c.x
					local dz = p.z - c.z
					T.truthy(dx * dx + dz * dz >= c.r * c.r, "fuera del hueco")
				end
			end
		end
	end)

	T.test("separación mínima y tamaños válidos", function()
		local piles = layout(2)
		local spacing = Config.Snow.minSpacing
		for i, a in piles do
			T.truthy(a.size >= Config.Snow.minSize and a.size <= Config.Snow.maxSize, "tamaño")
			T.eq(a.size, math.floor(a.size), "tamaño entero")
			for j = i + 1, #piles do
				local b = piles[j]
				local dx = a.x - b.x
				local dz = a.z - b.z
				T.truthy(dx * dx + dz * dz >= spacing * spacing, "separados " .. i .. "-" .. j)
			end
		end
	end)

	T.test("zona imposible: ningún montón, sin colgarse", function()
		local params = paramsFor(1)
		params.avoid = { { x = 0, z = 100, r = 1000 } }
		T.eq(#SnowLayout.generate(params, Rng.new(7)), 0)
		params.avoid = {}
		params.count = 0
		T.eq(#SnowLayout.generate(params, Rng.new(7)), 0)
	end)

	T.test("tormenta: la nieve vuelve 3× más rápido mientras dura", function()
		local base = Config.Snow.respawnSeconds
		local factor = Config.SnowStorm.respawnFactor
		T.near(SnowLayout.respawnDelay(base, 1000, 999, factor), base / factor, 1e-9)
		T.eq(SnowLayout.respawnDelay(base, 1000, 1000, factor), base, "se acabó")
		T.eq(SnowLayout.respawnDelay(base, 0, 50, factor), base, "sin tormenta")
		T.eq(SnowLayout.respawnDelay(base, 1000, 10, 1), base, "factor 1")
	end)
end
