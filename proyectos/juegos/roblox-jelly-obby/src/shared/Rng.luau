--!strict
-- Generador de números aleatorios con semilla (Park–Miller). Da exactamente la misma secuencia en Lune y en
-- Roblox (enteros exactos en doble precisión): la torre generada es la misma en todos los servidores y en las pruebas.

local Rng = {}

export type Rng = {
	next: () -> number, -- [0, 1)
	int: (a: number, b: number) -> number, -- entero en [a, b]
}

local MODULUS = 2147483647

function Rng.new(seed: number): Rng
	local state = math.floor(math.abs(seed)) % (MODULUS - 1) + 1
	local function nextFloat(): number
		state = (state * 48271) % MODULUS
		return (state - 1) / (MODULUS - 1)
	end
	return {
		next = nextFloat,
		int = function(a: number, b: number): number
			return math.min(b, a + math.floor((b - a + 1) * nextFloat()))
		end,
	}
end

return Rng
