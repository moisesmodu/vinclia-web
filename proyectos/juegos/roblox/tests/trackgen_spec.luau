-- Pruebas de src/shared/TrackGen.luau: determinismo, continuidad y límites del perfil.

local Config = require("../src/shared/Config")
local TrackGen = require("../src/shared/TrackGen")

return function(T)
	T.section("TrackGen")
	local p = Config.Track

	T.test("la misma semilla da la misma pista", function()
		local a = TrackGen.generate(12345, p)
		local b = TrackGen.generate(12345, p)
		T.eq(#a.points, #b.points, "puntos")
		for i, point in a.points do
			T.eq(point.x, b.points[i].x, "x " .. i)
			T.eq(point.y, b.points[i].y, "y " .. i)
		end
	end)

	T.test("semillas distintas dan pistas distintas", function()
		local a = TrackGen.generate(1, p)
		local b = TrackGen.generate(2, p)
		local differs = #a.points ~= #b.points
		for i = 1, math.min(#a.points, #b.points) do
			if a.points[i].y ~= b.points[i].y then
				differs = true
			end
		end
		T.truthy(differs)
	end)

	T.test("el generador aleatorio se queda en su rango", function()
		local rng = TrackGen.newRng(99)
		for _ = 1, 2000 do
			local f = rng.next()
			T.truthy(f >= 0 and f < 1, "next " .. f)
			local n = rng.int(3, 6)
			T.truthy(n >= 3 and n <= 6 and n == math.floor(n), "int " .. n)
		end
		-- semillas extremas no rompen el generador
		T.truthy(TrackGen.newRng(0).next() >= 0)
		T.truthy(TrackGen.newRng(-5).next() >= 0)
		T.truthy(TrackGen.newRng(2 ^ 40).next() >= 0)
	end)

	local kinds: { [string]: boolean } = {}
	T.test("100 pistas: continuas, dentro de la banda, empiezan y acaban a ras de suelo", function()
		for seed = 1, 100 do
			local track = TrackGen.generate(seed * 7919, p)
			local segs = track.segments
			T.eq(segs[1].kind, "flat", "empieza en llano")
			T.eq(segs[1].length, p.startFlat, "llano inicial")
			T.eq(segs[#segs].kind, "flat", "acaba en llano")
			T.eq(segs[#segs].length, p.endFlat, "llano final")
			for i, seg in segs do
				kinds[seg.kind] = true
				if i > 1 then
					local prev = segs[i - 1]
					T.near(seg.x0, prev.x0 + prev.length, 1e-6, "tramos contiguos " .. seed)
					T.near(seg.y0, TrackGen.endHeight(prev), 1e-6, "alturas continuas " .. seed)
				end
			end
			local points = track.points
			T.eq(points[1].x, 0, "primer x")
			T.near(points[1].y, p.minHeight, 1e-9, "primer y")
			T.near(points[#points].x, track.length, 1e-9, "último x")
			T.near(points[#points].y, p.minHeight, 1e-9, "último y")
			T.truthy(track.length >= p.length - 60 and track.length <= p.length + 250, "longitud " .. track.length)
			for i, point in points do
				T.truthy(point.y >= p.minHeight - 1e-9 and point.y <= p.maxHeight + 1e-9, "altura " .. point.y)
				if i > 1 then
					local dx = point.x - points[i - 1].x
					local dy = point.y - points[i - 1].y
					T.truthy(dx > 0 and dx <= p.step + 1e-9, "paso " .. dx)
					-- ninguna pared vertical: como mucho la caída de una rampa
					T.truthy(math.abs(dy) <= p.step * 2, string.format("pendiente %.2f en semilla %d", dy, seed))
				end
			end
		end
	end)

	T.test("aparecen los cuatro tipos de tramo", function()
		for _, kind in { "flat", "hill", "bumps", "ramp" } do
			T.truthy(kinds[kind], kind)
		end
	end)

	T.test("heightAt interpola entre puntos", function()
		local track = TrackGen.generate(42, p)
		local a, b = track.points[10], track.points[11]
		T.near(TrackGen.heightAt(track.points, a.x), a.y, 1e-9, "en un punto")
		T.near(TrackGen.heightAt(track.points, (a.x + b.x) / 2), (a.y + b.y) / 2, 1e-9, "punto medio")
		T.eq(TrackGen.heightAt(track.points, -50), track.points[1].y, "antes del inicio")
		T.eq(TrackGen.heightAt(track.points, track.length + 50), track.points[#track.points].y, "después del final")
		T.eq(TrackGen.heightAt({}, 3), 0, "sin puntos")
	end)

	T.test("los baches acaban a la altura de salida y las rampas caen por debajo", function()
		for seed = 1, 60 do
			for _, seg in TrackGen.generate(seed, p).segments do
				if seg.kind == "bumps" then
					T.near(TrackGen.heightInSegment(seg, seg.x0 + seg.length), seg.y0, 1e-6, "bache")
				elseif seg.kind == "ramp" then
					T.truthy(seg.y1 <= seg.y0, "la rampa acaba más abajo")
					T.truthy(seg.y0 + seg.amp <= p.maxHeight + 1e-9, "la rampa cabe en la banda")
				end
			end
		end
	end)
end
