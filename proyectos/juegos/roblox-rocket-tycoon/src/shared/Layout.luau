--!strict
-- Dónde va cada parcela en el mundo. Puro. Dos filas a los lados de la avenida (eje X); el frente de cada
-- parcela (su +Z local) mira a la avenida: la fila de abajo (z < 0) sin girar y la de arriba girada 180°.

local Layout = {}

export type PlotParams = { size: number, gap: number, avenue: number }

-- Centro (x, z) en el mundo y giro (radianes, eje Y) de la parcela `index` (1..count).
function Layout.plotCenter(index: number, count: number, params: PlotParams): (number, number, number)
	local perRow = math.max(math.ceil(count / 2), 1)
	local i = math.max(math.floor(index), 1) - 1
	local column = i % perRow
	local row = math.floor(i / perRow)
	local x = (column - (perRow - 1) / 2) * (params.size + params.gap)
	local offset = params.avenue / 2 + params.size / 2
	if row == 0 then
		return x, -offset, 0
	end
	return x, offset, math.pi
end

-- De coordenadas locales de la parcela a coordenadas del mundo (sin Roblox: solo el giro en Y).
function Layout.toWorld(index: number, count: number, params: PlotParams, lx: number, lz: number): (number, number)
	local cx, cz, yaw = Layout.plotCenter(index, count, params)
	local c, s = math.cos(yaw), math.sin(yaw)
	-- giro de Roblox alrededor de Y: x' = x·cos + z·sin, z' = -x·sin + z·cos
	return cx + lx * c + lz * s, cz - lx * s + lz * c
end

return Layout
