--!strict
-- Generador de la torre (puro, con semilla): mismas fases en todos los servidores y en las pruebas de Lune.
--
-- La torre es una espiral cuadrada: la fase k recorre un lado del cuadrado, de la esquina de su checkpoint a la
-- esquina siguiente (el checkpoint k + 1), y cada fase sube. Entre medias hay plataformas («piezas») de distintos
-- tipos. Cada salto entre dos piezas seguidas cumple los límites de la física del personaje (Config.Physics) con un
-- margen de seguridad: así todas las fases tienen solución sin pases ni bobinas.
--
-- Coordenadas locales de una pieza: x = centro a lo largo del lado (0 = esquina de salida), z = desplazamiento hacia
-- la columna central, top = altura de la cara de arriba. Las coordenadas del mundo (position, size) se calculan al
-- final; el servidor solo tiene que crear las Parts.

local Stages = {}

export type RandomSource = {
	next: () -> number,
	int: (a: number, b: number) -> number,
}

export type Physics = {
	gravity: number,
	walkSpeed: number,
	jumpHeight: number,
	safety: number,
}

export type TowerParams = {
	stages: number,
	stagesPerZone: number,
	seed: number,
	side: number,
	padSize: number,
	baseHeight: number,
	pieceThickness: number,
	minLength: number,
	minWidth: number,
	minGap: number,
	minStageRise: number,
	coreSize: number,
	maxLateral: number,
	maxPiecesPerStage: number,
}

export type ZoneParams = {
	id: string,
	icon: string,
	color: { number },
	accent: { number },
	kinds: { [string]: number },
}

export type ObstacleParams = {
	padLength: { number },
	padWidth: { number },
	beamLength: { number },
	beamWidth: { number },
	jellySize: { number },
	jellyDelay: { number },
	jellyRespawn: number,
	bounceSize: number,
	bounceLaunch: number,
	trampolineSize: number,
	trampolineLaunch: number,
	conveyorLength: { number },
	conveyorWidth: { number },
	conveyorSpeed: { number },
	maxBeltFraction: number,
	vanishSize: { number },
	vanishDelay: { number },
	vanishRespawn: number,
	movingLength: { number },
	movingRange: { number },
	movingSpeed: { number },
	rotatingLength: { number },
	rotatingWidth: { number },
	rotatingSpeed: { number },
	gooLength: { number },
	gooSafe: number,
	gapFactor: { number },
	riseFactor: { number },
	launchRise: { number },
}

export type GenParams = {
	Physics: Physics,
	Tower: TowerParams,
	Zones: { ZoneParams },
	Obstacles: ObstacleParams,
}

export type Piece = {
	kind: string, -- "checkpoint" o uno de Stages.KINDS
	stage: number,
	x: number,
	z: number,
	top: number,
	length: number, -- a lo largo del camino
	width: number,
	launch: number, -- velocidad vertical que da al tocarla (0 = ninguna)
	speed: number, -- cinta (con signo: + hacia delante), móvil (studs/s) o giratoria (rad/s, con signo)
	range: number, -- móvil: studs a cada lado
	delay: number, -- gelatina o baldosa: segundos hasta desaparecer
	gooLength: number, -- charco de baba en el centro
	gap: number, -- hueco (borde a borde) desde la pieza anterior
	position: { number }, -- mundo: centro de la cara de arriba { x, y, z }
	size: { number }, -- mundo: { sx, sy, sz }
	forward: { number }, -- mundo: dirección del camino { x, z }
	lateral: { number }, -- mundo: hacia la columna central { x, z }
}

export type Stage = {
	index: number,
	zone: number,
	difficulty: number,
	heading: number, -- 0..3: lado del cuadrado
	startTop: number,
	endTop: number,
	rise: number,
	pathLength: number,
	pieces: { Piece },
	finishGap: number, -- hueco del último salto, al checkpoint siguiente
}

export type Tower = {
	stages: { Stage },
	checkpoints: { { number } }, -- 1..N + 1 (N + 1 = cima): centro de la cara de arriba { x, y, z }
	top: number,
}

-- Orden fijo (no se recorre el diccionario de Config: así la tirada no depende del orden de una tabla hash).
Stages.KINDS = { "pad", "beam", "jelly", "bounce", "trampoline", "conveyor", "vanish", "moving", "goo", "rotating" }

-- Tipos que se pueden acortar para que quepan. Los demás, si no caben, se cambian por una plataforma normal.
local FLEXIBLE: { [string]: boolean } = {
	beam = true,
	pad = true,
}

local FORWARD = { { 1, 0 }, { 0, 1 }, { -1, 0 }, { 0, -1 } }

local function lerp(range: { number }, t: number): number
	return range[1] + (range[2] - range[1]) * t
end

-- 0 en la primera fase, 1 en la última.
function Stages.difficulty(index: number, count: number): number
	if count <= 1 then
		return 0
	end
	return math.clamp((index - 1) / (count - 1), 0, 1)
end

function Stages.zoneOf(index: number, perZone: number, zoneCount: number): number
	return math.clamp(math.floor((index - 1) / perZone) + 1, 1, zoneCount)
end

-- Velocidad vertical de un salto normal: v = √(2 · g · h).
function Stages.jumpSpeed(p: Physics): number
	return math.sqrt(2 * p.gravity * p.jumpHeight)
end

-- Altura máxima que se alcanza saliendo con velocidad vertical v.
function Stages.maxRise(v: number, p: Physics): number
	return v * v / (2 * p.gravity)
end

-- Distancia horizontal recorrida en el aire (andando a walkSpeed) saliendo con velocidad vertical v y aterrizando
-- dh más arriba (dh < 0: más abajo). 0 si no se llega a esa altura.
function Stages.reach(v: number, dh: number, p: Physics): number
	local disc = v * v - 2 * p.gravity * dh
	if disc < 0 then
		return 0
	end
	return p.walkSpeed * (v + math.sqrt(disc)) / p.gravity
end

function Stages.takeoffSpeed(from: Piece, p: Physics): number
	if from.launch > 0 then
		return from.launch
	end
	return Stages.jumpSpeed(p)
end

-- Mayor hueco (de borde a borde) aceptado saliendo de `from` con un desnivel dh, ya con el margen de seguridad.
-- Una pieza que lanza lo hace al tocarla (por su borde cercano): su largo cuenta como parte del hueco.
-- Devuelve -1 si el desnivel es demasiado alto.
function Stages.allowedGap(from: Piece, dh: number, p: Physics): number
	local v = Stages.takeoffSpeed(from, p)
	if dh > p.safety * Stages.maxRise(v, p) then
		return -1
	end
	local gap = p.safety * Stages.reach(v, dh, p)
	if from.launch > 0 then
		gap -= from.length
	end
	return gap
end

-- Hueco entre el borde final de `a` y el borde inicial de `b` (b va después en el camino), contando el zigzag.
function Stages.edgeGap(a: Piece, b: Piece): number
	local gx = (b.x - b.length / 2) - (a.x + a.length / 2)
	local side = math.abs(b.z - a.z) - (a.width + b.width) / 2
	if side <= 0 then
		return gx
	end
	return math.sqrt(gx * gx + side * side)
end

-- ¿Se puede saltar de `a` a `b`? (las móviles y giratorias, cuando están alineadas con el camino).
function Stages.canJump(a: Piece, b: Piece, p: Physics): boolean
	return Stages.edgeGap(a, b) <= Stages.allowedGap(a, b.top - a.top, p)
end

-- ¿Se puede cruzar el charco de baba de una pieza «goo» saltando sobre el suelo seguro?
function Stages.canClearGoo(piece: Piece, p: Physics): boolean
	return piece.gooLength <= p.safety * Stages.reach(Stages.jumpSpeed(p), 0, p)
end

local function newPiece(kind: string, stage: number): Piece
	return {
		kind = kind,
		stage = stage,
		x = 0,
		z = 0,
		top = 0,
		length = 0,
		width = 0,
		launch = 0,
		speed = 0,
		range = 0,
		delay = 0,
		gooLength = 0,
		gap = 0,
		position = { 0, 0, 0 },
		size = { 0, 0, 0 },
		forward = { 1, 0 },
		lateral = { 0, 1 },
	}
end

local function pickKind(rng: RandomSource, zone: ZoneParams): string
	local total = 0
	for _, kind in Stages.KINDS do
		total += zone.kinds[kind] or 0
	end
	local roll = rng.next() * total
	for _, kind in Stages.KINDS do
		local weight = zone.kinds[kind] or 0
		if weight > 0 then
			if roll < weight then
				return kind
			end
			roll -= weight
		end
	end
	return "pad"
end

-- Tamaño y parámetros de una pieza según su tipo y la dificultad.
local function shape(piece: Piece, d: number, rng: RandomSource, o: ObstacleParams, t: TowerParams)
	local kind = piece.kind
	if kind == "pad" then
		piece.length = lerp(o.padLength, d) * (0.8 + 0.4 * rng.next())
		piece.width = lerp(o.padWidth, d) * (0.8 + 0.4 * rng.next())
	elseif kind == "beam" then
		piece.length = lerp(o.beamLength, d) * (0.9 + 0.2 * rng.next())
		piece.width = lerp(o.beamWidth, d)
	elseif kind == "jelly" then
		local s = lerp(o.jellySize, d) * (0.9 + 0.2 * rng.next())
		piece.length = s
		piece.width = s
		piece.delay = lerp(o.jellyDelay, d)
	elseif kind == "bounce" then
		piece.length = o.bounceSize
		piece.width = o.bounceSize
		piece.launch = o.bounceLaunch
	elseif kind == "trampoline" then
		piece.length = o.trampolineSize
		piece.width = o.trampolineSize
		piece.launch = o.trampolineLaunch
	elseif kind == "conveyor" then
		piece.length = lerp(o.conveyorLength, d)
		piece.width = lerp(o.conveyorWidth, d)
		piece.speed = lerp(o.conveyorSpeed, d) * (if rng.next() < 0.5 then -1 else 1)
	elseif kind == "vanish" then
		local s = lerp(o.vanishSize, d)
		piece.length = s
		piece.width = s
		piece.delay = lerp(o.vanishDelay, d)
	elseif kind == "moving" then
		local s = lerp(o.movingLength, d)
		piece.length = s
		piece.width = s
		piece.range = lerp(o.movingRange, d)
		piece.speed = lerp(o.movingSpeed, d)
	elseif kind == "rotating" then
		piece.length = lerp(o.rotatingLength, d)
		piece.width = lerp(o.rotatingWidth, d)
		piece.speed = lerp(o.rotatingSpeed, d) * (if rng.next() < 0.5 then -1 else 1)
	elseif kind == "goo" then
		piece.gooLength = lerp(o.gooLength, d)
		piece.length = 2 * o.gooSafe + piece.gooLength
		piece.width = math.max(4, lerp(o.padWidth, d))
	end
	piece.width = math.max(piece.width, t.minWidth)
end

-- La pieza no cabe: se cambia por una plataforma normal del largo que quede.
local function toPad(piece: Piece, d: number, o: ObstacleParams, t: TowerParams)
	piece.kind = "pad"
	piece.launch = 0
	piece.speed = 0
	piece.range = 0
	piece.delay = 0
	piece.gooLength = 0
	piece.width = math.max(t.minWidth, lerp(o.padWidth, d))
end

-- Cuánto sube el escalón siguiente al salir de `from`: una parte de la altura máxima segura, más si hace falta para
-- llegar a la subida mínima de la fase.
local function stepRise(from: Piece, d: number, rng: RandomSource, params: GenParams, need: number): number
	local p = params.Physics
	local safeMax = p.safety * Stages.maxRise(Stages.takeoffSpeed(from, p), p)
	local range = if from.launch > 0 then params.Obstacles.launchRise else params.Obstacles.riseFactor
	local dh = safeMax * lerp(range, d) * (0.6 + 0.4 * rng.next())
	return math.max(dh, math.min(need, 0.7 * safeMax))
end

local function buildStage(index: number, startTop: number, rng: RandomSource, params: GenParams): Stage
	local p = params.Physics
	local t = params.Tower
	local o = params.Obstacles
	local d = Stages.difficulty(index, t.stages)
	local zoneIndex = Stages.zoneOf(index, t.stagesPerZone, #params.Zones)
	local zone = params.Zones[zoneIndex]
	local half = t.padSize / 2
	local endEdge = t.side - half
	local closeGap = t.minGap + 0.5

	local prev = newPiece("checkpoint", index)
	prev.length = t.padSize
	prev.width = t.padSize
	prev.top = startTop

	local target = newPiece("checkpoint", index + 1)
	target.x = t.side
	target.length = t.padSize
	target.width = t.padSize

	local pieces: { Piece } = {}
	local finalRise = 0
	local finishGap = 0
	for _ = 1, t.maxPiecesPerStage + 1 do
		local remaining = endEdge - (prev.x + prev.length / 2)
		local risen = prev.top - startTop
		local jumpsLeft = math.max(1, math.floor(remaining / 10))

		-- ¿último salto, al checkpoint siguiente?
		local dhFinal = stepRise(prev, d, rng, params, t.minStageRise - risen)
		target.top = prev.top + dhFinal
		local roomForMore = remaining - closeGap >= t.minGap + t.minLength
		local tallEnough = risen + dhFinal >= t.minStageRise
		if not roomForMore or #pieces >= t.maxPiecesPerStage or (tallEnough and Stages.canJump(prev, target, p)) then
			finalRise = dhFinal
			finishGap = Stages.edgeGap(prev, target)
			break
		end

		local piece = newPiece(pickKind(rng, zone), index)
		shape(piece, d, rng, o, t)
		local dh = stepRise(prev, d, rng, params, (t.minStageRise - risen) / jumpsLeft)
		local allowed = Stages.allowedGap(prev, dh, p)
		local gap = math.max(t.minGap, allowed * lerp(o.gapFactor, d) * (0.85 + 0.15 * rng.next()))
		local room = remaining - closeGap
		if gap + piece.length > room then
			if not FLEXIBLE[piece.kind] then
				toPad(piece, d, o, t)
			end
			piece.length = room - gap
			if piece.length < t.minLength then
				gap = math.max(t.minGap, room - t.minLength)
				piece.length = room - gap
			end
		end
		piece.top = prev.top + dh
		piece.x = prev.x + prev.length / 2 + gap + piece.length / 2
		local swing = (rng.next() * 2 - 1) * t.maxLateral * (0.3 + 0.7 * d)
		piece.z = math.clamp(prev.z + swing, -t.maxLateral, t.maxLateral)
		if not Stages.canJump(prev, piece, p) then
			piece.z = prev.z
		end
		piece.gap = Stages.edgeGap(prev, piece)
		table.insert(pieces, piece)
		prev = piece
	end

	local endTop = prev.top + finalRise
	return {
		index = index,
		zone = zoneIndex,
		difficulty = d,
		heading = (index - 1) % 4,
		startTop = startTop,
		endTop = endTop,
		rise = endTop - startTop,
		pathLength = t.side,
		pieces = pieces,
		finishGap = finishGap,
	}
end

-- Esquina del cuadrado de la que sale el lado `heading` (0..3), centrado en el origen.
function Stages.corner(heading: number, side: number): (number, number)
	local half = side / 2
	local h = heading % 4
	if h == 0 then
		return -half, -half
	elseif h == 1 then
		return half, -half
	elseif h == 2 then
		return half, half
	end
	return -half, half
end

local function place(piece: Piece, heading: number, t: TowerParams)
	local cx, cz = Stages.corner(heading, t.side)
	local f = FORWARD[heading % 4 + 1]
	local lx, lz = -f[2], f[1]
	piece.forward = { f[1], f[2] }
	piece.lateral = { lx, lz }
	piece.position = { cx + f[1] * piece.x + lx * piece.z, piece.top, cz + f[2] * piece.x + lz * piece.z }
	if f[1] ~= 0 then
		piece.size = { piece.length, t.pieceThickness, piece.width }
	else
		piece.size = { piece.width, t.pieceThickness, piece.length }
	end
end

-- Genera la torre entera. `makeRng` = Rng.new (cada fase tiene su propio generador: cambiar una no mueve las demás).
function Stages.generate(params: GenParams, makeRng: (number) -> RandomSource): Tower
	local t = params.Tower
	local stages: { Stage } = {}
	local checkpoints: { { number } } = {}
	local top = t.baseHeight
	for index = 1, t.stages do
		local rng = makeRng(t.seed * 31 + index * 7919)
		local stage = buildStage(index, top, rng, params)
		for _, piece in stage.pieces do
			place(piece, stage.heading, t)
		end
		local cx, cz = Stages.corner(stage.heading, t.side)
		table.insert(checkpoints, { cx, top, cz })
		table.insert(stages, stage)
		top = stage.endTop
	end
	local fx, fz = Stages.corner(t.stages % 4, t.side)
	table.insert(checkpoints, { fx, top, fz })
	return { stages = stages, checkpoints = checkpoints, top = top }
end

return Stages
