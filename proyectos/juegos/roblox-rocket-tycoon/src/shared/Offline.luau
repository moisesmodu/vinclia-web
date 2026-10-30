--!strict
-- Ganancias mientras el jugador no está: una parte de lo que ganaba la base por segundo, con tope de tiempo.
-- Pura: el servidor le pasa el último guardado y la hora actual (os.time()).

local Offline = {}

export type OfflineParams = { rate: number, maxSeconds: number, minSeconds: number }

-- Segundos que cuentan: los que pasaron desde el último guardado, hasta maxSeconds. 0 si es la primera vez
-- (lastOnline = 0), si pasaron menos de minSeconds o si el reloj va hacia atrás.
function Offline.seconds(lastOnline: number, now: number, params: OfflineParams): number
	if lastOnline <= 0 then
		return 0
	end
	local elapsed = math.floor(now - lastOnline)
	if elapsed < params.minSeconds then
		return 0
	end
	return math.min(elapsed, params.maxSeconds)
end

-- Monedas ganadas sin conectar (enteras).
function Offline.earnings(lastOnline: number, now: number, perSecond: number, params: OfflineParams): number
	local seconds = Offline.seconds(lastOnline, now, params)
	return math.floor(seconds * math.max(perSecond, 0) * params.rate)
end

return Offline
