--!strict
-- El cohete de un botón (como en el Rocket Hop de la web): velocidades, combustible, alcance y el límite de la
-- zona de vuelo. Puro. El cliente lo usa para pilotar; el servidor, para saber qué es alcanzable y qué velocidad
-- es posible al validar los cristales.

local Rocket = {}

export type RocketParams = {
	climbSpeed: number,
	fallSpeed: number,
	horizontalSpeed: number,
	fasterMultiplier: number,
	fuelSeconds: number,
	refillPerSecond: number,
	maxRange: number,
	maxAltitude: number,
	reserve: number,
}

export type Speeds = { climb: number, fall: number, horizontal: number }

function Rocket.speeds(params: RocketParams, faster: boolean): Speeds
	local m = if faster then params.fasterMultiplier else 1
	return {
		climb = params.climbSpeed * m,
		fall = params.fallSpeed * m,
		horizontal = params.horizontalSpeed * m,
	}
end

-- Velocidad máxima posible del cohete (diagonal subiendo), para el antitrampas.
function Rocket.maxSpeed(params: RocketParams, faster: boolean): number
	local s = Rocket.speeds(params, faster)
	return math.sqrt(s.horizontal * s.horizontal + math.max(s.climb, s.fall) ^ 2)
end

-- Altura que se gana con el depósito lleno, sin pasar del techo.
function Rocket.climbReach(params: RocketParams): number
	return math.min(params.climbSpeed * params.fuelSeconds, params.maxAltitude)
end

-- ¿Se llega a un punto a `horizontal` studs de la plataforma y `height` de altura, sin pase y con la reserva?
-- Cuenta la altura que hay que subir con el reserve · depósito y que quede dentro del radio y del techo.
function Rocket.canReach(params: RocketParams, horizontal: number, height: number): boolean
	if horizontal < 0 or horizontal > params.maxRange or height > params.maxAltitude then
		return false
	end
	return height <= params.climbSpeed * params.fuelSeconds * params.reserve
end

-- Combustible tras `dt` segundos: empujando se gasta; posado y sin empujar se rellena; en el aire sin empujar
-- se queda igual. Sin combustible no se empuja (devuelve también si hay empuje de verdad).
function Rocket.stepFuel(
	fuel: number,
	holding: boolean,
	grounded: boolean,
	dt: number,
	params: RocketParams
): (number, boolean)
	local f = math.clamp(fuel, 0, params.fuelSeconds)
	if holding and f > 0 then
		return math.max(f - dt, 0), true
	elseif grounded and not holding then
		return math.min(f + params.refillPerSecond * dt, params.fuelSeconds), false
	end
	return f, false
end

-- Velocidad vertical: sube con empuje, baja planeando sin él; nunca pasa del techo.
function Rocket.verticalVelocity(thrusting: boolean, altitude: number, speeds: Speeds, params: RocketParams): number
	if thrusting then
		if altitude >= params.maxAltitude then
			return 0
		end
		return speeds.climb
	end
	return -speeds.fall
end

-- Límite del radio de vuelo: fuera de maxRange se quita la parte de la velocidad horizontal que aleja de la
-- plataforma (la que acerca se mantiene). offsetX/offsetZ = posición - centro de la plataforma.
function Rocket.clampHorizontal(
	offsetX: number,
	offsetZ: number,
	vx: number,
	vz: number,
	maxRange: number
): (number, number)
	local distance = math.sqrt(offsetX * offsetX + offsetZ * offsetZ)
	if distance <= maxRange or distance == 0 then
		return vx, vz
	end
	local nx, nz = offsetX / distance, offsetZ / distance
	local outward = vx * nx + vz * nz
	if outward <= 0 then
		return vx, vz
	end
	return vx - outward * nx, vz - outward * nz
end

return Rocket
