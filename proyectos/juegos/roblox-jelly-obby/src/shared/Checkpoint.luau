--!strict
-- Reglas puras de los checkpoints (las aplica el servidor; el cliente nunca decide en qué fase está nadie).
--
-- Fases 1..N; el checkpoint k es el comienzo de la fase k y el N + 1 es la cima. Un jugador solo avanza de uno en
-- uno (k → k + 1), nunca se salta checkpoints, y entre dos tiene que pasar un tiempo mínimo creíble.
-- «Saltar fase» (producto) también suma exactamente 1, y nunca más allá de la última fase (la cima hay que pisarla).
-- Reiniciar la torre solo se puede desde la cima.

local Checkpoint = {}

export type Reach = "ok" | "same" | "behind" | "ahead" | "invalid" | "early"

export type AntiCheatParams = {
	maxHorizontalSpeed: number,
	minTeleportDistance: number,
}

function Checkpoint.finish(stageCount: number): number
	return stageCount + 1
end

-- Fase guardada (o recibida) → fase válida entre 1 y la cima.
function Checkpoint.sanitize(stage: number, stageCount: number): number
	if stage ~= stage then
		return 1
	end
	return math.clamp(math.floor(stage), 1, stageCount + 1)
end

-- ¿Cuenta tocar el checkpoint `target` estando en `current`? Solo «ok» avanza.
function Checkpoint.reach(
	current: number,
	target: number,
	stageCount: number,
	elapsed: number,
	minSeconds: number
): Reach
	if target ~= math.floor(target) or target < 1 or target > stageCount + 1 then
		return "invalid"
	elseif target == current then
		return "same"
	elseif target < current then
		return "behind"
	elseif target > current + 1 then
		return "ahead"
	elseif elapsed < minSeconds then
		return "early"
	end
	return "ok"
end

-- Tiempo mínimo creíble para recorrer una fase: recorrido / velocidad máxima posible · holgura.
function Checkpoint.minSeconds(pathLength: number, maxSpeed: number, slack: number): number
	return pathLength / math.max(maxSpeed, 1) * slack
end

-- Producto «Saltar fase»: (se puede, fase nueva). Solo desde las fases 1..N − 1.
function Checkpoint.skip(current: number, stageCount: number): (boolean, number)
	if current >= 1 and current < stageCount then
		return true, current + 1
	end
	return false, current
end

function Checkpoint.canRestart(current: number, stageCount: number): boolean
	return current == stageCount + 1
end

-- Movimiento horizontal entre dos muestras del servidor: ¿es posible sin teletransportarse?
function Checkpoint.plausibleMove(dx: number, dz: number, dt: number, params: AntiCheatParams): boolean
	local distance = math.sqrt(dx * dx + dz * dz)
	if distance < params.minTeleportDistance then
		return true
	end
	if dt <= 0 then
		return false
	end
	return distance / dt <= params.maxHorizontalSpeed
end

-- ¿Ha caído tan por debajo de su checkpoint que hay que devolverlo?
function Checkpoint.fallen(y: number, checkpointY: number, limit: number): boolean
	return y < checkpointY - limit
end

return Checkpoint
