--!strict
-- Monedas por checkpoint y por llegar a la cima, multiplicador del reinicio de torre y reglas de las estelas.
-- Puro: lo prueban las specs de Lune y lo usan el servidor (que decide) y el cliente (que solo enseña).

local Rewards = {}

export type RewardParams = { stageBase: number, perStage: number, finishBonus: number }
export type RestartParams = { perRestart: number, maxMultiplier: number, maxRestarts: number }

export type TrailAction = "equip" | "unequip" | "buy" | "nomoney" | "needpass"

-- Multiplicador de monedas: 1 + perRestart · reinicios, con tope.
function Rewards.multiplier(restarts: number, params: RestartParams): number
	local n = math.max(0, math.floor(restarts))
	return math.min(1 + n * params.perRestart, params.maxMultiplier)
end

-- Monedas por llegar al checkpoint `checkpoint` (2..N + 1), es decir, por terminar la fase checkpoint − 1:
-- base + perStage · (fase − 1), por el multiplicador.
function Rewards.stageCoins(checkpoint: number, multiplier: number, params: RewardParams): number
	local stage = math.max(1, math.floor(checkpoint) - 1)
	return math.floor((params.stageBase + params.perStage * (stage - 1)) * math.max(multiplier, 1))
end

function Rewards.finishCoins(multiplier: number, params: RewardParams): number
	return math.floor(params.finishBonus * math.max(multiplier, 1))
end

-- Monedas de una subida completa sin saltar fases (para equilibrar precios).
function Rewards.runTotal(stageCount: number, multiplier: number, params: RewardParams): number
	local total = 0
	for checkpoint = 2, stageCount + 1 do
		total += Rewards.stageCoins(checkpoint, multiplier, params)
	end
	return total + Rewards.finishCoins(multiplier, params)
end

function Rewards.canRestart(restarts: number, params: RestartParams): boolean
	return restarts < params.maxRestarts
end

-- Qué pasa al pulsar una estela: quitarla si la llevas, ponerla si es tuya (o especial con el pase), comprarla si
-- llegan las monedas.
function Rewards.trailAction(
	price: number,
	premium: boolean,
	owned: boolean,
	equipped: boolean,
	coins: number,
	hasPass: boolean
): TrailAction
	if equipped then
		return "unequip"
	elseif premium then
		return if hasPass then "equip" else "needpass"
	elseif owned then
		return "equip"
	elseif coins >= price then
		return "buy"
	end
	return "nomoney"
end

return Rewards
