-- Pruebas de src/shared/Crystals.luau: asteroides al alcance del cohete, lluvia de meteoritos, tipos de cristal
-- y validación de las recogidas en el servidor.

local Config = require("../src/shared/Config")
local Crystals = require("../src/shared/Crystals")
local Rng = require("../src/shared/Rng")
local Rocket = require("../src/shared/Rocket")

local function area()
	return {
		usable = Config.Plot.usable,
		padX = Config.Plot.rocketPad[1],
		padZ = Config.Plot.rocketPad[2],
		maxRange = Config.Rocket.maxRange,
	}
end

local function reach(horizontal: number, height: number): boolean
	return Rocket.canReach(Config.Rocket, horizontal, height)
end

local function asteroidsOf(plot: number)
	return Crystals.layout(Rng.new(Config.Asteroids.seed + plot).next, Config.Asteroids, area(), reach)
end

local function pickup(overrides: { [string]: any })
	local input = {
		active = true,
		owner = true,
		distance = 3,
		now = 100,
		lastPickupAt = 90,
		travelled = 50,
		maxSpeed = Rocket.maxSpeed(Config.Rocket, false),
	}
	for k, v in overrides do
		input[k] = v
	end
	return Crystals.validatePickup(input, Config.Crystals)
end

return function(T)
	T.section("Crystals")
	local a = Config.Asteroids

	T.test("cada parcela tiene todos sus asteroides", function()
		for plot = 1, Config.MaxPlayers do
			T.eq(#asteroidsOf(plot), a.count, "parcela " .. plot)
		end
	end)

	T.test("asteroides: dentro de la parcela, entre las alturas y separados", function()
		local limit = Config.Plot.usable - a.radius
		for plot = 1, Config.MaxPlayers do
			local points = asteroidsOf(plot)
			for i, p in points do
				T.truthy(math.abs(p.x) <= limit and math.abs(p.z) <= limit, "dentro " .. plot .. "/" .. i)
				T.truthy(p.y >= a.minHeight and p.y <= a.maxHeight, "altura " .. plot .. "/" .. i)
				for j = i + 1, #points do
					local q = points[j]
					local d = math.sqrt((p.x - q.x) ^ 2 + (p.y - q.y) ^ 2 + (p.z - q.z) ^ 2)
					T.truthy(d >= a.minSpacing, "separación " .. plot .. "/" .. i .. "-" .. j)
				end
			end
		end
	end)

	T.test("asteroides: todos al alcance del cohete sin pase", function()
		local padX, padZ = Config.Plot.rocketPad[1], Config.Plot.rocketPad[2]
		for plot = 1, Config.MaxPlayers do
			for i, p in asteroidsOf(plot) do
				local horizontal = math.sqrt((p.x - padX) ^ 2 + (p.z - padZ) ^ 2)
				T.truthy(horizontal >= a.minPadDistance, "lejos de la plataforma " .. plot .. "/" .. i)
				T.truthy(horizontal + a.radius <= Config.Rocket.maxRange, "dentro del radio " .. plot .. "/" .. i)
				local climb = Crystals.topClearance(p.y, a)
				T.truthy(Rocket.canReach(Config.Rocket, horizontal, climb), "alcanzable " .. plot .. "/" .. i)
				T.truthy(climb < Config.Rocket.maxAltitude, "bajo el techo " .. plot .. "/" .. i)
			end
		end
	end)

	T.test("asteroides: misma semilla, mismo cielo; otra semilla, otro", function()
		local p1 = asteroidsOf(3)
		local p2 = asteroidsOf(3)
		local p3 = asteroidsOf(4)
		for i = 1, #p1 do
			T.eq(p1[i].x, p2[i].x)
			T.eq(p1[i].y, p2[i].y)
			T.eq(p1[i].z, p2[i].z)
		end
		T.truthy(p1[1].x ~= p3[1].x or p1[1].z ~= p3[1].z, "otra parcela, otro reparto")
	end)

	T.test("si nada es alcanzable no se pone ningún asteroide", function()
		local none = Crystals.layout(Rng.new(1).next, a, area(), function()
			return false
		end)
		T.eq(#none, 0)
	end)

	T.test("lluvia de meteoritos: dentro del patio, a ras de suelo y separados", function()
		local s = Config.MeteorShower
		local points = Crystals.showerLayout(Rng.new(s.seed).next, s)
		T.eq(#points, s.count)
		for i, p in points do
			T.truthy(p.x >= s.area.x0 and p.x <= s.area.x1 and p.z >= s.area.z0 and p.z <= s.area.z1, "patio " .. i)
			T.eq(p.y, s.height)
			T.truthy(math.abs(p.x) <= Config.Plot.usable and math.abs(p.z) <= Config.Plot.usable, "parcela " .. i)
			for j = i + 1, #points do
				local d = math.sqrt((p.x - points[j].x) ^ 2 + (p.z - points[j].z) ^ 2)
				T.truthy(d >= s.minSpacing, "separación " .. i .. "-" .. j)
			end
		end
		local again = Crystals.showerLayout(Rng.new(s.seed).next, s)
		T.eq(again[5].x, points[5].x, "determinista")
	end)

	T.test("tipo de cristal según los pesos", function()
		local w: { number } = {}
		for i, kind in Config.CrystalKinds do
			w[i] = kind.weight
		end
		T.eq(Crystals.rollKind(w, 0), 1)
		T.eq(Crystals.rollKind(w, 0.79), 1)
		T.eq(Crystals.rollKind(w, 0.8), 2)
		T.eq(Crystals.rollKind(w, 0.96), 2)
		T.eq(Crystals.rollKind(w, 0.975), 3)
		T.eq(Crystals.rollKind(w, 0.99999), 3)
		T.eq(Crystals.rollKind({ 0, 0 }, 0.5), 1, "sin pesos: el primero")
		T.near(Crystals.chance(w, 1), 0.8, 1e-9)
		T.near(Crystals.chance(w, 3), 0.03, 1e-9)
		T.eq(Crystals.chance(w, 4), 0)
	end)

	T.test("tipo de cristal: frecuencias en 20000 tiradas", function()
		local w: { number } = {}
		for i, kind in Config.CrystalKinds do
			w[i] = kind.weight
		end
		local rng = Rng.new(99)
		local counts = { 0, 0, 0 }
		for _ = 1, 20000 do
			local k = Crystals.rollKind(w, rng.next())
			counts[k] += 1
		end
		T.near(counts[1] / 20000, 0.8, 0.02, "azules")
		T.near(counts[2] / 20000, 0.17, 0.02, "rosas")
		T.near(counts[3] / 20000, 0.03, 0.01, "dorados")
	end)

	T.test("recogida: válida", function()
		T.eq(pickup({}), "ok")
		T.eq(pickup({ lastPickupAt = 0, travelled = 99999 }), "ok", "la primera no mira el viaje")
	end)

	T.test("recogida: cristal que no está o no es tuyo", function()
		T.eq(pickup({ active = false }), "gone")
		T.eq(pickup({ owner = false }), "owner")
	end)

	T.test("recogida: demasiado lejos (con margen de latencia)", function()
		local c = Config.Crystals
		local limit = c.pickupRadius * c.serverSlack + c.serverExtra
		T.eq(limit, 14)
		T.eq(pickup({ distance = 14 }), "ok")
		T.eq(pickup({ distance = 14.5 }), "far")
	end)

	T.test("recogida: dos seguidas demasiado rápido", function()
		T.eq(pickup({ now = 100, lastPickupAt = 99.9, travelled = 0 }), "cooldown")
		T.eq(pickup({ now = 100, lastPickupAt = 99.8, travelled = 0 }), "ok")
	end)

	T.test("recogida: viaje imposible desde la última", function()
		local max = Rocket.maxSpeed(Config.Rocket, false)
		local allowed = max * Config.Crystals.speedSlack * 10 + Config.Crystals.travelExtra
		T.eq(pickup({ now = 100, lastPickupAt = 90, travelled = allowed - 1 }), "ok")
		T.eq(pickup({ now = 100, lastPickupAt = 90, travelled = allowed + 1 }), "fast")
		local faster = Rocket.maxSpeed(Config.Rocket, true)
		T.eq(pickup({ travelled = allowed + 1, maxSpeed = faster }), "ok", "con el pase se llega más lejos")
	end)
end
