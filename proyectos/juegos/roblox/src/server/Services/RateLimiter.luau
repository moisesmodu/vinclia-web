--!strict
-- Cubo de fichas por jugador: limita cuántas peticiones por segundo acepta el servidor de cada cliente.
-- Las tablas son débiles por clave: cuando el Player se destruye, su cubo desaparece solo.

export type Limiter = {
	allow: (self: Limiter, player: Player) -> boolean,
}

type Bucket = { tokens: number, last: number }

local RateLimiter = {}

function RateLimiter.new(perSecond: number, burst: number): Limiter
	local buckets: { [Player]: Bucket } = setmetatable({}, { __mode = "k" }) :: any

	local limiter = {}
	function limiter.allow(_self: Limiter, player: Player): boolean
		local now = os.clock()
		local bucket = buckets[player]
		if not bucket then
			bucket = { tokens = burst, last = now }
			buckets[player] = bucket
		end
		bucket.tokens = math.min(burst, bucket.tokens + (now - bucket.last) * perSecond)
		bucket.last = now
		if bucket.tokens < 1 then
			return false
		end
		bucket.tokens -= 1
		return true
	end
	return limiter :: Limiter
end

return RateLimiter
