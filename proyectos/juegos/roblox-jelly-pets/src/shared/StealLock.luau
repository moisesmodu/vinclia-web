--!strict
-- Candado de la base y reglas para llevarse una gelatina. Puro: el tiempo (`now`, en segundos) lo da quien llama.
-- Al pulsar el candado nadie puede llevarse gelatinas durante `duración`; después hay una recarga antes de poder
-- volver a pulsarlo, así ninguna base queda cerrada para siempre.

local StealLock = {}

export type LockParams = {
	baseDuration: number,
	perLevel: number,
	maxLevel: number,
	cooldown: number,
	fasterLockMultiplier: number,
	fasterLockCooldown: number,
	upgradeBaseCost: number,
	upgradeGrowth: number,
}

export type LockState = { lockedUntil: number, readyAt: number }

-- Motivo por el que se puede (o no) llevar una gelatina.
export type Reason = "ok" | "own" | "busy" | "locked" | "carrying" | "full"

export type StealContext = {
	isOwn: boolean, -- la gelatina es tuya
	petHome: boolean, -- está quieta en su pedestal (no en camino ni en brazos de otro)
	ownerLocked: boolean, -- la base del dueño tiene el candado puesto
	thiefCarrying: boolean, -- ya llevas otra
	thiefHasFreePad: boolean, -- te queda un pedestal libre
}

function StealLock.newState(): LockState
	return { lockedUntil = 0, readyAt = 0 }
end

function StealLock.duration(level: number, hasFasterLock: boolean, params: LockParams): number
	local l = math.clamp(math.floor(level), 0, params.maxLevel)
	local seconds = params.baseDuration + l * params.perLevel
	return if hasFasterLock then seconds * params.fasterLockMultiplier else seconds
end

function StealLock.cooldown(hasFasterLock: boolean, params: LockParams): number
	return if hasFasterLock then params.fasterLockCooldown else params.cooldown
end

function StealLock.isLocked(state: LockState, now: number): boolean
	return now < state.lockedUntil
end

function StealLock.remaining(state: LockState, now: number): number
	return math.max(0, state.lockedUntil - now)
end

function StealLock.canPress(state: LockState, now: number): boolean
	return now >= state.readyAt
end

-- Pulsa el candado: estado nuevo, o nil si aún está puesto o recargando.
function StealLock.press(state: LockState, now: number, duration: number, cooldown: number): LockState?
	if not StealLock.canPress(state, now) then
		return nil
	end
	return { lockedUntil = now + duration, readyAt = now + duration + cooldown }
end

-- Precio para subir el candado de `level` a `level + 1`, o nil en el máximo.
function StealLock.upgradeCost(level: number, params: LockParams): number?
	if level >= params.maxLevel then
		return nil
	end
	local l = math.max(math.floor(level), 0)
	return math.floor(params.upgradeBaseCost * params.upgradeGrowth ^ l + 0.5)
end

function StealLock.canSteal(ctx: StealContext): Reason
	if ctx.isOwn then
		return "own"
	elseif not ctx.petHome then
		return "busy"
	elseif ctx.ownerLocked then
		return "locked"
	elseif ctx.thiefCarrying then
		return "carrying"
	elseif not ctx.thiefHasFreePad then
		return "full"
	end
	return "ok"
end

-- ¿Ha pasado el tiempo máximo para llevar una gelatina a casa?
function StealLock.carryExpired(startedAt: number, now: number, timeout: number): boolean
	return now - startedAt >= timeout
end

return StealLock
