--!strict
-- Árbol de dependencias de los botones de compra y reglas para comprarlos. Puro: recibe las definiciones
-- (Config.Buttons, copiadas a una lista de `Def` por el servidor) y lo comprado, y no toca Roblox.

local Buttons = {}

export type Def = {
	id: string,
	kind: string,
	cost: number,
	requires: { string },
}

export type BuyResult = "ok" | "unknown" | "owned" | "locked" | "coins"

local KINDS: { [string]: boolean } = {
	dropper = true,
	upgrader = true,
	wall = true,
	dome = true,
	rocket = true,
	deco = true,
}

function Buttons.byId(defs: { Def }): { [string]: Def }
	local map: { [string]: Def } = {}
	for _, def in defs do
		map[def.id] = def
	end
	return map
end

function Buttons.toSet(list: { string }): { [string]: boolean }
	local set: { [string]: boolean } = {}
	for _, id in list do
		set[id] = true
	end
	return set
end

local function requirementsMet(def: Def, owned: { [string]: boolean }): boolean
	for _, need in def.requires do
		if owned[need] ~= true then
			return false
		end
	end
	return true
end

-- Orden topológico estable (cada botón después de lo que necesita, respetando el orden de la lista cuando se
-- puede). Devuelve los ids ordenados y los que no se pudieron colocar (ciclo o requisito desconocido).
function Buttons.order(defs: { Def }): ({ string }, { string })
	local placed: { [string]: boolean } = {}
	local result: { string } = {}
	local progress = true
	while progress do
		progress = false
		for _, def in defs do
			if not placed[def.id] and requirementsMet(def, placed) then
				placed[def.id] = true
				table.insert(result, def.id)
				progress = true
			end
		end
	end
	local stuck: { string } = {}
	for _, def in defs do
		if not placed[def.id] then
			table.insert(stuck, def.id)
		end
	end
	return result, stuck
end

-- Lista de problemas del árbol (vacía si está bien): ids repetidos o vacíos, tipos desconocidos, precios
-- negativos, requisitos que no existen o que se repiten, ciclos y botones inalcanzables, y que haya al menos un
-- botón gratis y sin requisitos para empezar.
function Buttons.validate(defs: { Def }): { string }
	local problems: { string } = {}
	local seen: { [string]: boolean } = {}
	local hasStart = false
	for _, def in defs do
		if def.id == "" then
			table.insert(problems, "id vacío")
		elseif seen[def.id] then
			table.insert(problems, "id repetido: " .. def.id)
		end
		seen[def.id] = true
		if not KINDS[def.kind] then
			table.insert(problems, "tipo desconocido en " .. def.id .. ": " .. def.kind)
		end
		if def.cost < 0 or def.cost ~= math.floor(def.cost) then
			table.insert(problems, "precio no válido en " .. def.id)
		end
		if #def.requires == 0 and def.cost == 0 then
			hasStart = true
		end
	end
	for _, def in defs do
		local needs: { [string]: boolean } = {}
		for _, need in def.requires do
			if not seen[need] then
				table.insert(problems, def.id .. " necesita " .. need .. ", que no existe")
			elseif needs[need] then
				table.insert(problems, def.id .. " repite " .. need)
			elseif need == def.id then
				table.insert(problems, def.id .. " se necesita a sí mismo")
			end
			needs[need] = true
		end
	end
	local _, stuck = Buttons.order(defs)
	for _, id in stuck do
		table.insert(problems, "inalcanzable (ciclo o requisito roto): " .. id)
	end
	if not hasStart then
		table.insert(problems, "no hay ningún botón gratis y sin requisitos")
	end
	return problems
end

-- Botones que se ven ahora (no comprados y con todos sus requisitos comprados), en el orden de la lista.
function Buttons.available(defs: { Def }, owned: { [string]: boolean }): { string }
	local result: { string } = {}
	for _, def in defs do
		if owned[def.id] ~= true and requirementsMet(def, owned) then
			table.insert(result, def.id)
		end
	end
	return result
end

-- ¿Se puede comprar `id`? Devuelve el resultado y el precio (0 si el botón no existe).
function Buttons.canBuy(defs: { Def }, owned: { [string]: boolean }, coins: number, id: string): (BuyResult, number)
	for _, def in defs do
		if def.id == id then
			if owned[id] == true then
				return "owned", def.cost
			elseif not requirementsMet(def, owned) then
				return "locked", def.cost
			elseif coins < def.cost then
				return "coins", def.cost
			end
			return "ok", def.cost
		end
	end
	return "unknown", 0
end

-- Siguiente botón para el producto "Instant Upgrade": el más barato de los que se ven (a igual precio, el primero
-- de la lista). nil si ya está todo comprado.
function Buttons.nextButton(defs: { Def }, owned: { [string]: boolean }): string?
	local bestId: string? = nil
	local bestCost = math.huge
	for _, def in defs do
		if owned[def.id] ~= true and requirementsMet(def, owned) and def.cost < bestCost then
			bestId = def.id
			bestCost = def.cost
		end
	end
	return bestId
end

-- Limpia lo leído del guardado: solo ids conocidos, sin repetir y con sus requisitos también comprados (un botón
-- cuyo requisito falta se descarta). Devuelve la lista en orden topológico.
function Buttons.sanitize(defs: { Def }, raw: { any }): { string }
	local wanted: { [string]: boolean } = {}
	for _, value in raw do
		if type(value) == "string" then
			wanted[value] = true
		end
	end
	local ordered = Buttons.order(defs)
	local byId = Buttons.byId(defs)
	local kept: { [string]: boolean } = {}
	local result: { string } = {}
	for _, id in ordered do
		local def = byId[id]
		if wanted[id] and def and requirementsMet(def, kept) then
			kept[id] = true
			table.insert(result, id)
		end
	end
	return result
end

function Buttons.ownedCount(defs: { Def }, owned: { [string]: boolean }): number
	local n = 0
	for _, def in defs do
		if owned[def.id] == true then
			n += 1
		end
	end
	return n
end

function Buttons.totalCost(defs: { Def }): number
	local total = 0
	for _, def in defs do
		total += def.cost
	end
	return total
end

return Buttons
