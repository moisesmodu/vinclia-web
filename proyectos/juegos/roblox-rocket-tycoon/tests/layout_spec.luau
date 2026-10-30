-- Pruebas de la geometría de la base (Config.Plot y Config.Buttons) y de src/shared/Layout.luau: ninguna
-- baldosa encima de otra ni de un objeto, todo dentro de la parcela y las parcelas sin solaparse.

local Config = require("../src/shared/Config")
local Layout = require("../src/shared/Layout")

type Rect = { x0: number, x1: number, z0: number, z1: number, name: string }

local function rectAround(x: number, z: number, sx: number, sz: number, name: string): Rect
	return { x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, name = name }
end

-- Separación entre dos rectángulos (negativa si se solapan).
local function rectGap(a: Rect, b: Rect): number
	local gx = math.max(a.x0 - b.x1, b.x0 - a.x1)
	local gz = math.max(a.z0 - b.z1, b.z0 - a.z1)
	return math.max(gx, gz)
end

local function fixedRects(): { Rect }
	local p = Config.Plot
	local b = p.belt
	return {
		{ x0 = b.x0, x1 = b.x1, z0 = b.z - b.width / 2, z1 = b.z + b.width / 2, name = "cinta" },
		rectAround(p.refinery.x, p.refinery.z, p.refinery.size, p.refinery.size, "refinería"),
		rectAround(p.vault.x, p.vault.z, p.vault.size, p.vault.size, "caja"),
		rectAround(p.spawn[1], p.spawn[2], 6, 6, "aparición"),
		rectAround(p.sign[1], p.sign[2], 6, 4, "cartel"),
	}
end

return function(T)
	T.section("Layout")
	local p = Config.Plot
	local half = p.padSize / 2

	T.test("baldosas dentro de la parcela", function()
		for _, def in Config.Buttons do
			T.truthy(math.abs(def.pad[1]) <= p.usable, def.id .. " x")
			T.truthy(math.abs(def.pad[2]) <= p.usable, def.id .. " z")
		end
	end)

	T.test("ninguna baldosa encima de otra", function()
		local defs = Config.Buttons
		for i = 1, #defs do
			for j = i + 1, #defs do
				local a, b = defs[i].pad, defs[j].pad
				local gap = math.max(math.abs(a[1] - b[1]), math.abs(a[2] - b[2])) - p.padSize
				T.truthy(gap >= p.padGap, defs[i].id .. " y " .. defs[j].id)
			end
		end
	end)

	T.test("ninguna baldosa encima de un objeto comprado", function()
		for _, pad in Config.Buttons do
			for _, item in Config.Buttons do
				if item.radius > 0 then
					local d = math.sqrt((pad.pad[1] - item.at[1]) ^ 2 + (pad.pad[2] - item.at[2]) ^ 2)
					T.truthy(d >= item.radius + half + p.padGap, "baldosa " .. pad.id .. " / objeto " .. item.id)
				end
			end
		end
	end)

	T.test("ninguna baldosa sobre la cinta, la refinería, la caja, la aparición o el cartel", function()
		for _, def in Config.Buttons do
			local r = rectAround(def.pad[1], def.pad[2], p.padSize, p.padSize, def.id)
			for _, fixed in fixedRects() do
				T.truthy(rectGap(r, fixed) >= p.padGap, def.id .. " / " .. fixed.name)
			end
		end
	end)

	T.test("objetos grandes sin solaparse entre sí ni con lo fijo", function()
		local defs = Config.Buttons
		for i = 1, #defs do
			local a = defs[i]
			if a.radius > 0 and a.kind ~= "dropper" and a.kind ~= "upgrader" then
				for j = i + 1, #defs do
					local b = defs[j]
					if b.radius > 0 then
						local d = math.sqrt((a.at[1] - b.at[1]) ^ 2 + (a.at[2] - b.at[2]) ^ 2)
						T.truthy(d >= a.radius + b.radius, a.id .. " y " .. b.id)
					end
				end
				local r = rectAround(a.at[1], a.at[2], a.radius * 2, a.radius * 2, a.id)
				for _, fixed in fixedRects() do
					T.truthy(rectGap(r, fixed) >= 0, a.id .. " / " .. fixed.name)
				end
			end
			T.truthy(math.abs(a.at[1]) <= p.size / 2 and math.abs(a.at[2]) <= p.size / 2, a.id .. " en la parcela")
		end
	end)

	T.test("extractores junto a la cinta y antes de todos los escáneres", function()
		local b = p.belt
		local lastDropper, firstScanner = -math.huge, math.huge
		for _, def in Config.Buttons do
			if def.kind == "dropper" then
				T.eq(math.abs(def.at[2] - b.z), 9, def.id .. " al lado de la cinta")
				T.truthy(def.at[1] > b.x0 and def.at[1] < b.x1, def.id .. " a lo largo de la cinta")
				T.truthy((def.value or 0) > 0 and (def.interval or 0) > 0, def.id .. " produce")
				lastDropper = math.max(lastDropper, def.at[1])
			elseif def.kind == "upgrader" then
				T.eq(def.at[2], b.z, def.id .. " sobre la cinta")
				T.truthy((def.multiplier or 0) > 1, def.id .. " multiplica")
				firstScanner = math.min(firstScanner, def.at[1])
			end
		end
		T.truthy(lastDropper + 4 < firstScanner - 5, "todas las rocas pasan por todos los escáneres")
	end)

	T.test("el cohete: plataforma en Config.Plot y botón en el mismo sitio", function()
		local found = false
		for _, def in Config.Buttons do
			if def.kind == "rocket" then
				found = true
				T.eq(def.at[1], p.rocketPad[1])
				T.eq(def.at[2], p.rocketPad[2])
			end
		end
		T.truthy(found)
	end)

	T.test("parcelas: 8 sitios distintos sin solaparse, el frente a la avenida", function()
		local n = Config.MaxPlayers
		local centers = {}
		for i = 1, n do
			local x, z, yaw = Layout.plotCenter(i, n, p)
			table.insert(centers, { x = x, z = z })
			T.truthy(math.abs(z) >= p.avenue / 2 + p.size / 2, "fuera de la avenida " .. i)
			-- el frente (0, +size/2 local) queda más cerca de la avenida (z = 0) que el centro
			local _, fz = Layout.toWorld(i, n, p, 0, p.size / 2)
			T.near(math.abs(fz), p.avenue / 2, 1e-6, "frente al borde de la avenida " .. i)
			T.truthy(yaw == 0 or math.abs(yaw - math.pi) < 1e-9, "giro " .. i)
		end
		for i = 1, n do
			for j = i + 1, n do
				local dx = math.abs(centers[i].x - centers[j].x)
				local dz = math.abs(centers[i].z - centers[j].z)
				T.truthy(math.max(dx, dz) >= p.size + p.gap - 1e-9, "parcelas " .. i .. " y " .. j)
			end
		end
	end)

	T.test("toWorld: la fila de arriba está girada", function()
		local n = Config.MaxPlayers
		local cx, cz = Layout.plotCenter(1, n, p)
		local wx, wz = Layout.toWorld(1, n, p, 10, 20)
		T.near(wx, cx + 10, 1e-9)
		T.near(wz, cz + 20, 1e-9)
		local ux, uz = Layout.plotCenter(5, n, p)
		local vx, vz = Layout.toWorld(5, n, p, 10, 20)
		T.near(vx, ux - 10, 1e-9)
		T.near(vz, uz - 20, 1e-9)
	end)
end
