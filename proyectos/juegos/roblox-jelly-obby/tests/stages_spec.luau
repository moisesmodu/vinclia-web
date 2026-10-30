-- Pruebas de src/shared/Stages.luau: la torre generada con la semilla real de Config.
-- Comprueban que es determinista, que tiene 40 fases en 4 zonas y que TODAS las fases tienen solución con la física
-- por defecto (saltos dentro del alcance seguro, cintas más lentas que andar, charcos saltables...).

local Config = require("../src/shared/Config")
local Rng = require("../src/shared/Rng")
local Stages = require("../src/shared/Stages")

local function params(seed)
	local tower = table.clone(Config.Tower)
	tower.seed = seed
	return { Physics = Config.Physics, Tower = tower, Zones = Config.Zones, Obstacles = Config.Obstacles }
end

local function startPad(stage)
	return {
		kind = "checkpoint",
		x = 0,
		z = 0,
		top = stage.startTop,
		length = Config.Tower.padSize,
		width = Config.Tower.padSize,
		launch = 0,
	}
end

local function endPad(stage)
	return {
		kind = "checkpoint",
		x = Config.Tower.side,
		z = 0,
		top = stage.endTop,
		length = Config.Tower.padSize,
		width = Config.Tower.padSize,
		launch = 0,
	}
end

return function(T)
	T.section("Stages")
	local p = Config.Physics
	local t = Config.Tower
	local o = Config.Obstacles
	local tower = Stages.generate(params(t.seed), Rng.new)
	local EPS = 1e-9

	T.test("física: salto normal de 7,2 studs y alcance en llano", function()
		local v = Stages.jumpSpeed(p)
		T.near(Stages.maxRise(v, p), p.jumpHeight, 1e-6, "altura")
		T.near(Stages.reach(v, 0, p), 8.67, 0.02, "alcance en llano")
		T.truthy(Stages.reach(v, 3, p) < Stages.reach(v, 0, p), "subir acorta el salto")
		T.truthy(Stages.reach(v, -3, p) > Stages.reach(v, 0, p), "bajar lo alarga")
		T.eq(Stages.reach(v, 8, p), 0, "más alto que el salto: imposible")
	end)

	T.test("límites: más alto que el salto seguro o más lejos que el alcance, no", function()
		local a = startPad({ startTop = 0 })
		local b = { kind = "pad", x = 0, z = 0, top = 0, length = 4, width = 4, launch = 0 }
		b.x = a.length / 2 + 6 + b.length / 2
		b.top = 1
		T.eq(Stages.canJump(a, b, p), true, "6 studs subiendo 1")
		b.x = a.length / 2 + 7.5 + b.length / 2
		T.eq(Stages.canJump(a, b, p), false, "7,5 studs: fuera del margen")
		b.x = a.length / 2 + 2 + b.length / 2
		b.top = 6
		T.eq(Stages.canJump(a, b, p), false, "6 studs de alto: más que el 80 % del salto")
		T.eq(Stages.allowedGap(a, 6, p), -1)
	end)

	T.test("las piezas que lanzan cuentan su largo como hueco", function()
		local bounce =
			{ kind = "bounce", x = 0, z = 0, top = 0, length = o.bounceSize, width = 4, launch = o.bounceLaunch }
		local plain = { kind = "pad", x = 0, z = 0, top = 0, length = o.bounceSize, width = 4, launch = 0 }
		local v = o.bounceLaunch
		T.near(Stages.allowedGap(bounce, 5, p), p.safety * Stages.reach(v, 5, p) - o.bounceSize, 1e-9)
		T.eq(Stages.allowedGap(plain, 9, p), -1, "sin lanzar no se suben 9 studs")
		T.truthy(Stages.allowedGap(bounce, 9, p) > 0, "con la almohadilla, sí")
	end)

	T.test("hueco con zigzag", function()
		local a = { x = 0, z = 0, length = 4, width = 4 }
		local b = { x = 7, z = 0, length = 4, width = 4 }
		T.near(Stages.edgeGap(a, b), 3, 1e-9, "alineadas")
		b.z = 3
		T.near(Stages.edgeGap(a, b), 3, 1e-9, "aún se solapan de lado")
		b.z = 8
		T.near(Stages.edgeGap(a, b), 5, 1e-9, "3-4-5")
	end)

	T.test("dificultad de 0 a 1 y zonas de 10", function()
		T.eq(Stages.difficulty(1, 40), 0)
		T.eq(Stages.difficulty(40, 40), 1)
		local previous = -1
		for i = 1, 40 do
			local d = Stages.difficulty(i, 40)
			T.truthy(d > previous, "dificultad creciente en la fase " .. i)
			previous = d
		end
		T.eq(Stages.zoneOf(1, 10, 4), 1)
		T.eq(Stages.zoneOf(10, 10, 4), 1)
		T.eq(Stages.zoneOf(11, 10, 4), 2)
		T.eq(Stages.zoneOf(40, 10, 4), 4)
		T.eq(Stages.zoneOf(99, 10, 4), 4)
	end)

	T.test("40 fases, 41 checkpoints, 4 zonas de colores distintos", function()
		T.eq(#tower.stages, 40)
		T.eq(#tower.checkpoints, 41)
		T.eq(#Config.Zones, 4)
		for i = 1, 40 do
			T.eq(tower.stages[i].zone, math.floor((i - 1) / 10) + 1, "zona de la fase " .. i)
		end
		local seen = {}
		for _, zone in Config.Zones do
			local key = table.concat(zone.color, ",")
			T.truthy(seen[key] == nil, "color repetido " .. key)
			seen[key] = true
		end
	end)

	T.test("determinista: misma semilla, misma torre; otra semilla, otra", function()
		local again = Stages.generate(params(t.seed), Rng.new)
		T.eq(#again.stages, #tower.stages)
		for i, stage in tower.stages do
			local other = again.stages[i]
			T.eq(#other.pieces, #stage.pieces, "piezas de la fase " .. i)
			for j, piece in stage.pieces do
				T.eq(other.pieces[j].kind, piece.kind)
				T.eq(other.pieces[j].x, piece.x)
				T.eq(other.pieces[j].top, piece.top)
			end
		end
		local different = Stages.generate(params(t.seed + 1), Rng.new)
		local same = true
		for i, stage in tower.stages do
			if different.stages[i].endTop ~= stage.endTop then
				same = false
			end
		end
		T.eq(same, false)
	end)

	T.test("todas las fases tienen solución (con la semilla real y con otras)", function()
		for _, seed in { t.seed, 1, 7, 12345, 424242 } do
			local candidate = if seed == t.seed then tower else Stages.generate(params(seed), Rng.new)
			for _, stage in candidate.stages do
				local prev = startPad(stage)
				for j, piece in stage.pieces do
					T.truthy(
						Stages.canJump(prev, piece, p),
						string.format("semilla %d, fase %d, pieza %d (%s)", seed, stage.index, j, piece.kind)
					)
					prev = piece
				end
				T.truthy(
					Stages.canJump(prev, endPad(stage), p),
					string.format("semilla %d, fase %d: último salto", seed, stage.index)
				)
			end
		end
	end)

	T.test("medidas mínimas, cintas lentas y charcos saltables", function()
		for _, stage in tower.stages do
			T.truthy(#stage.pieces >= 3 and #stage.pieces <= t.maxPiecesPerStage, "piezas en la fase " .. stage.index)
			for _, piece in stage.pieces do
				local where = string.format("fase %d %s", stage.index, piece.kind)
				T.truthy(piece.width >= t.minWidth - EPS, "ancho " .. where)
				T.truthy(piece.length >= t.minLength - EPS, "largo " .. where)
				T.truthy(piece.gap >= t.minGap - EPS, "hueco " .. where)
				T.truthy(math.abs(piece.z) <= t.maxLateral + EPS, "zigzag " .. where)
				T.truthy(
					piece.x + piece.length / 2 <= t.side - t.padSize / 2 - t.minGap + EPS,
					"no pisa el checkpoint siguiente " .. where
				)
				if piece.kind == "conveyor" then
					T.truthy(math.abs(piece.speed) <= o.maxBeltFraction * p.walkSpeed, "cinta " .. where)
				elseif piece.kind == "goo" then
					T.truthy(Stages.canClearGoo(piece, p), "charco " .. where)
					T.near(piece.length, piece.gooLength + 2 * o.gooSafe, 1e-9, "suelo seguro " .. where)
				end
			end
		end
	end)

	T.test("la torre sube: cada fase al menos minStageRise y cada pieza más alta que la anterior", function()
		for _, stage in tower.stages do
			T.truthy(stage.rise >= t.minStageRise - EPS, "subida de la fase " .. stage.index)
			local top = stage.startTop
			for _, piece in stage.pieces do
				T.truthy(piece.top > top, "pieza más alta en la fase " .. stage.index)
				top = piece.top
			end
			T.truthy(stage.endTop > top, "checkpoint más alto en la fase " .. stage.index)
		end
		for k = 1, 40 do
			T.eq(tower.checkpoints[k][2], tower.stages[k].startTop)
		end
		T.eq(tower.checkpoints[41][2], tower.top)
	end)

	T.test("sitio encima de cada pieza: nada de la vuelta de arriba estorba al salto", function()
		for k = 1, 36 do
			local above = tower.stages[k + 4]
			local ceiling = above.startTop - 2
			for _, piece in tower.stages[k].pieces do
				local jump = if piece.launch > 0 then Stages.maxRise(piece.launch, p) else p.jumpHeight
				T.truthy(piece.top + jump + 6 <= ceiling, string.format("fase %d %s", k, piece.kind))
			end
		end
	end)

	T.test("nada choca con la columna central", function()
		for _, stage in tower.stages do
			for _, piece in stage.pieces do
				local inward = math.abs(piece.z) + piece.range + math.max(piece.length, piece.width) / 2
				T.truthy(t.side / 2 - inward > t.coreSize / 2, "fase " .. stage.index .. " " .. piece.kind)
			end
		end
	end)

	T.test("cada zona usa solo sus obstáculos y salen todos", function()
		local seen = {}
		for _, stage in tower.stages do
			local kinds = Config.Zones[stage.zone].kinds
			for _, piece in stage.pieces do
				seen[piece.kind] = true
				T.truthy(piece.kind == "pad" or kinds[piece.kind] ~= nil, piece.kind .. " en la zona " .. stage.zone)
			end
		end
		for _, kind in Stages.KINDS do
			T.truthy(seen[kind], "falta " .. kind)
		end
	end)

	T.test("la dificultad sube por zonas: huecos más largos y plataformas más estrechas", function()
		local ratio = { 0, 0, 0, 0 }
		local width = { 0, 0, 0, 0 }
		local count = { 0, 0, 0, 0 }
		for _, stage in tower.stages do
			local prev = startPad(stage)
			for _, piece in stage.pieces do
				local z = stage.zone
				ratio[z] += piece.gap / Stages.allowedGap(prev, piece.top - prev.top, p)
				width[z] += piece.width
				count[z] += 1
				prev = piece
			end
		end
		for z = 2, 4 do
			T.truthy(ratio[z] / count[z] > ratio[z - 1] / count[z - 1], "huecos de la zona " .. z)
		end
		T.truthy(width[4] / count[4] < width[1] / count[1], "plataformas de la zona 4")
	end)

	T.test("coordenadas del mundo: espiral cuadrada alrededor del origen", function()
		local half = t.side / 2
		local x1, z1 = Stages.corner(0, t.side)
		T.eq(x1, -half)
		T.eq(z1, -half)
		local x3, z3 = Stages.corner(2, t.side)
		T.eq(x3, half)
		T.eq(z3, half)
		T.eq(tower.checkpoints[2][1], half, "checkpoint 2 en la esquina 1")
		T.eq(tower.checkpoints[5][1], -half, "checkpoint 5 vuelve a la esquina 0")
		T.eq(tower.checkpoints[5][3], -half)
		for _, stage in tower.stages do
			for _, piece in stage.pieces do
				T.eq(piece.position[2], piece.top)
				T.eq(piece.size[2], t.pieceThickness)
				T.truthy(math.abs(piece.position[1]) <= half + t.maxLateral + EPS, "x dentro del cuadrado")
				T.truthy(math.abs(piece.position[3]) <= half + t.maxLateral + EPS, "z dentro del cuadrado")
			end
		end
	end)
end
