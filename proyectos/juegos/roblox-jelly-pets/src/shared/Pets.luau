--!strict
-- Reglas puras de las gelatinas de un jugador: pedestales libres, ingresos, fusión (3 iguales → 1 de la siguiente
-- rareza), qué gelatina se vende o se fusiona primero y la agrupación que enseña la interfaz.
-- Sin Roblox: lo prueban las specs de Lune y lo usan el servidor (PetService) y el cliente (Hud).

local Pets = {}

-- Lo que se guarda de cada gelatina. `pad` = número de pedestal; nil = en reserva (no genera ni se puede llevar).
export type SavedPet = {
	id: string,
	s: string, -- especie (Config.Species[i].id)
	r: number, -- rareza (índice en Config.Rarities)
	pad: number?,
}

export type Group = { s: string, r: number, count: number }

local FUSE_COUNT = 3
Pets.FUSE_COUNT = FUSE_COUNT

-- Pedestal libre más bajo entre 1 y padCount, o nil si están todos ocupados.
function Pets.firstFreePad(pets: { SavedPet }, padCount: number): number?
	local used: { [number]: boolean } = {}
	for _, pet in pets do
		local pad = pet.pad
		if pad then
			used[pad] = true
		end
	end
	for pad = 1, math.max(math.floor(padCount), 0) do
		if not used[pad] then
			return pad
		end
	end
	return nil
end

function Pets.padsUsed(pets: { SavedPet }): number
	local n = 0
	for _, pet in pets do
		if pet.pad then
			n += 1
		end
	end
	return n
end

-- Monedas por segundo de las gelatinas en pedestal (sin multiplicadores). `skip`: ids que no cuentan (las que
-- alguien lleva encima en ese momento).
function Pets.incomePerSecond(pets: { SavedPet }, incomes: { number }, skip: { [string]: boolean }?): number
	local total = 0
	for _, pet in pets do
		local counts = pet.pad ~= nil and not (skip and skip[pet.id])
		if counts then
			total += incomes[pet.r] or 0
		end
	end
	return total
end

function Pets.count(pets: { SavedPet }, species: string, rarity: number): number
	local n = 0
	for _, pet in pets do
		if pet.s == species and pet.r == rarity then
			n += 1
		end
	end
	return n
end

-- Elige `n` gelatinas de una especie y rareza, sin las bloqueadas (en camino o en brazos de otro). Primero las de
-- la reserva y luego las de los pedestales más altos, para que los primeros pedestales sigan ocupados.
-- nil si no hay bastantes.
function Pets.pick(
	pets: { SavedPet },
	species: string,
	rarity: number,
	n: number,
	blocked: { [string]: boolean }?
): { string }?
	local candidates: { SavedPet } = {}
	for _, pet in pets do
		if pet.s == species and pet.r == rarity and not (blocked and blocked[pet.id]) then
			table.insert(candidates, pet)
		end
	end
	if #candidates < n then
		return nil
	end
	table.sort(candidates, function(a: SavedPet, b: SavedPet): boolean
		local pa = a.pad or math.huge
		local pb = b.pad or math.huge
		if pa ~= pb then
			return pa > pb
		end
		return a.id < b.id
	end)
	local ids: { string } = {}
	for i = 1, n do
		table.insert(ids, candidates[i].id)
	end
	return ids
end

-- Rareza que sale al fusionar tres de `rarity`, o nil si ya es la más alta.
function Pets.fuseResult(rarity: number, maxRarity: number): number?
	if rarity >= 1 and rarity < maxRarity then
		return math.floor(rarity) + 1
	end
	return nil
end

-- Los tres ids que se fusionan, o nil si no se puede (pocas, bloqueadas o rareza máxima).
function Pets.fusePick(
	pets: { SavedPet },
	species: string,
	rarity: number,
	maxRarity: number,
	blocked: { [string]: boolean }?
): { string }?
	if Pets.fuseResult(rarity, maxRarity) == nil then
		return nil
	end
	return Pets.pick(pets, species, rarity, FUSE_COUNT, blocked)
end

-- Grupos por especie y rareza para la interfaz: de la rareza más alta a la más baja; dentro, por especie.
function Pets.groups(pets: { SavedPet }, speciesOrder: { string }): { Group }
	local byKey: { [string]: Group } = {}
	local list: { Group } = {}
	for _, pet in pets do
		local key = pet.s .. "#" .. pet.r
		local group = byKey[key]
		if group then
			group.count += 1
		else
			local created: Group = { s = pet.s, r = pet.r, count = 1 }
			byKey[key] = created
			table.insert(list, created)
		end
	end
	local order: { [string]: number } = {}
	for i, id in speciesOrder do
		order[id] = i
	end
	table.sort(list, function(a: Group, b: Group): boolean
		if a.r ~= b.r then
			return a.r > b.r
		end
		return (order[a.s] or 0) < (order[b.s] or 0)
	end)
	return list
end

-- Quita la gelatina `id` de la lista. Devuelve la quitada (o nil).
function Pets.remove(pets: { SavedPet }, id: string): SavedPet?
	for i, pet in pets do
		if pet.id == id then
			table.remove(pets, i)
			return pet
		end
	end
	return nil
end

function Pets.find(pets: { SavedPet }, id: string): SavedPet?
	for _, pet in pets do
		if pet.id == id then
			return pet
		end
	end
	return nil
end

return Pets
