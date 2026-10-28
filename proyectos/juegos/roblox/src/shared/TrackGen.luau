--!strict
-- Generador puro de la pista: a partir de una semilla devuelve los tramos (llano, colina, baches, rampa) y el
-- perfil de alturas muestreado cada `step` studs. Mismas reglas que egg-truck/src/terrain.ts, en studs y con el
-- eje Y hacia arriba. Sin dependencias de Roblox: lo prueba Lune (tests/trackgen.spec.luau) y lo construye
-- el servidor (WorldBuilder) con Parts.

local TrackGen = {}

export type SegmentKind = "flat" | "hill" | "bumps" | "ramp"

export type Segment = {
	kind: SegmentKind,
	x0: number,
	length: number,
	y0: number,
	y1: number,
	amp: number,
	wavelength: number,
}

export type Point = { x: number, y: number }

export type Params = {
	length: number,
	step: number,
	minHeight: number,
	maxHeight: number,
	startFlat: number,
	endFlat: number,
}

export type Track = {
	seed: number,
	segments: { Segment },
	points: { Point },
	length: number,
}

export type Rng = {
	next: () -> number,
	range: (a: number, b: number) -> number,
	int: (a: number, b: number) -> number,
}

local RAMP_UP = 0.78 -- fracción del tramo de rampa que sube; el resto es la caída (salto)
local MODULUS = 2147483647

-- Generador Park–Miller (enteros exactos en doble precisión): el mismo resultado en Lune y en Roblox.
function TrackGen.newRng(seed: number): Rng
	local state = math.floor(math.abs(seed)) % (MODULUS - 1) + 1
	local function nextFloat(): number
		state = (state * 48271) % MODULUS
		return (state - 1) / (MODULUS - 1)
	end
	return {
		next = nextFloat,
		range = function(a: number, b: number): number
			return a + (b - a) * nextFloat()
		end,
		int = function(a: number, b: number): number
			return math.min(b, a + math.floor((b - a + 1) * nextFloat()))
		end,
	}
end

-- Altura al final del tramo (el siguiente empieza exactamente ahí: perfil continuo).
function TrackGen.endHeight(seg: Segment): number
	if seg.kind == "flat" or seg.kind == "bumps" then
		return seg.y0
	end
	return seg.y1
end

-- Altura dentro de un tramo en la coordenada x.
function TrackGen.heightInSegment(seg: Segment, x: number): number
	local t = if seg.length > 0 then math.clamp((x - seg.x0) / seg.length, 0, 1) else 1
	if seg.kind == "flat" then
		return seg.y0
	elseif seg.kind == "hill" then
		return seg.y0 + (seg.y1 - seg.y0) * (0.5 - 0.5 * math.cos(math.pi * t))
	elseif seg.kind == "bumps" then
		return seg.y0 + math.abs(math.sin(((x - seg.x0) / seg.wavelength) * math.pi)) * seg.amp
	else
		-- rampa: sube cada vez más empinada y cae de golpe por debajo de la salida
		if t < RAMP_UP then
			return seg.y0 + seg.amp * (t / RAMP_UP) ^ 2
		end
		local top = seg.y0 + seg.amp
		return top + (seg.y1 - top) * ((t - RAMP_UP) / (1 - RAMP_UP))
	end
end

local function difficulty(x: number, p: Params): number
	local span = math.max(1, p.length - p.startFlat - p.endFlat)
	return math.clamp((x - p.startFlat) / span, 0, 1)
end

local function pickKind(rng: Rng, d: number): SegmentKind
	local weights: { { kind: SegmentKind, w: number } } = {
		{ kind = "flat", w = 0.3 - 0.25 * d },
		{ kind = "hill", w = 0.5 - 0.1 * d },
		{ kind = "bumps", w = 0.12 + 0.13 * d },
		{ kind = "ramp", w = 0.08 + 0.22 * d },
	}
	local total = 0
	for _, entry in weights do
		total += entry.w
	end
	local pick = rng.next() * total
	for _, entry in weights do
		pick -= entry.w
		if pick <= 0 then
			return entry.kind
		end
	end
	return "hill"
end

local function makeSegment(rng: Rng, x0: number, y0: number, p: Params): Segment
	local d = difficulty(x0, p)
	local kind = pickKind(rng, d)
	local mid = (p.minHeight + p.maxHeight) / 2
	local toward = if y0 < mid then 1 else -1 -- tiende a volver al centro de la banda

	if kind == "ramp" and y0 + 3 > p.maxHeight then
		kind = "hill" -- sin sitio para subir: se convierte en bajada
		toward = -1
	end

	if kind == "flat" then
		return { kind = kind, x0 = x0, length = rng.range(24, 48), y0 = y0, y1 = y0, amp = 0, wavelength = 1 }
	elseif kind == "hill" then
		local length = rng.range(50 - 6 * d, 100 - 16 * d)
		local dy = (4 + 14 * d) * rng.range(0.5, 1)
		local dir = if rng.next() < 0.55 then toward else -toward
		local y1 = math.clamp(y0 + dy * dir, p.minHeight, p.maxHeight)
		return { kind = kind, x0 = x0, length = length, y0 = y0, y1 = y1, amp = 0, wavelength = 1 }
	elseif kind == "bumps" then
		local wavelength = rng.int(8, 12)
		local count = rng.int(3, 6)
		local amp = math.min(0.5 + 1.3 * d, p.maxHeight - y0)
		return {
			kind = kind,
			x0 = x0,
			length = wavelength * count, -- número entero de baches: acaba a la altura de salida
			y0 = y0,
			y1 = y0,
			amp = math.max(amp, 0),
			wavelength = wavelength,
		}
	else
		local amp = math.min(3.5 + 5 * d, p.maxHeight - y0)
		local y1 = math.clamp(y0 - (1 + 3 * d), p.minHeight, p.maxHeight)
		return { kind = kind, x0 = x0, length = rng.range(36, 46), y0 = y0, y1 = y1, amp = amp, wavelength = 1 }
	end
end

-- Genera la pista completa. Empieza llana a minHeight (sale de la parcela) y acaba bajando a minHeight y en
-- llano (entra en el mercado). `length` es la longitud aproximada; la real va en Track.length.
function TrackGen.generate(seed: number, p: Params): Track
	local rng = TrackGen.newRng(seed)
	local segments: { Segment } = {}

	local start: Segment =
		{ kind = "flat", x0 = 0, length = p.startFlat, y0 = p.minHeight, y1 = p.minHeight, amp = 0, wavelength = 1 }
	table.insert(segments, start)

	local x = p.startFlat
	local y = p.minHeight
	local limit = p.length - p.endFlat
	while true do
		-- la bajada final necesita sitio: unos 4 studs de avance por cada stud de altura
		local descent = math.max(40, (y - p.minHeight) * 4)
		if x + descent >= limit then
			break
		end
		local seg = makeSegment(rng, x, y, p)
		table.insert(segments, seg)
		x += seg.length
		y = TrackGen.endHeight(seg)
	end

	if y - p.minHeight > 0.01 then
		local descent = math.max(40, (y - p.minHeight) * 4)
		table.insert(
			segments,
			{ kind = "hill", x0 = x, length = descent, y0 = y, y1 = p.minHeight, amp = 0, wavelength = 1 }
		)
		x += descent
	end
	table.insert(
		segments,
		{ kind = "flat", x0 = x, length = p.endFlat, y0 = p.minHeight, y1 = p.minHeight, amp = 0, wavelength = 1 }
	)
	x += p.endFlat

	return {
		seed = seed,
		segments = segments,
		points = TrackGen.sample(segments, p.step, x),
		length = x,
	}
end

-- Muestrea el perfil cada `step` studs (el último punto cae exactamente en `total`).
function TrackGen.sample(segments: { Segment }, step: number, total: number): { Point }
	local points: { Point } = {}
	local index = 1
	local count = math.ceil(total / step)
	for i = 0, count do
		local px = math.min(i * step, total)
		while index < #segments and px > segments[index].x0 + segments[index].length do
			index += 1
		end
		table.insert(points, { x = px, y = TrackGen.heightInSegment(segments[index], px) })
		if px >= total then
			break
		end
	end
	return points
end

-- Altura del perfil en x (interpolación lineal entre puntos).
function TrackGen.heightAt(points: { Point }, x: number): number
	if #points == 0 then
		return 0
	end
	if x <= points[1].x then
		return points[1].y
	end
	for i = 2, #points do
		local a, b = points[i - 1], points[i]
		if x <= b.x then
			local t = if b.x > a.x then (x - a.x) / (b.x - a.x) else 0
			return a.y + (b.y - a.y) * t
		end
	end
	return points[#points].y
end

return TrackGen
