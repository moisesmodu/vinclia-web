-- Pruebas de src/shared/Pets.luau: pedestales, ingresos, fusión, venta y agrupación.

local Config = require("../src/shared/Config")
local Pets = require("../src/shared/Pets")

type SavedPet = Pets.SavedPet

local function pet(id: string, s: string, r: number, pad: number?): SavedPet
	return { id = id, s = s, r = r, pad = pad }
end

local function incomes(): { number }
	local list = {}
	for _, def in Config.Rarities do
		table.insert(list, def.income)
	end
	return list
end

local function speciesOrder(): { string }
	local list = {}
	for _, def in Config.Species do
		table.insert(list, def.id)
	end
	return list
end

return function(T)
	T.section("Pets")
	local maxRarity = #Config.Rarities

	T.test("primer pedestal libre", function()
		T.eq(Pets.firstFreePad({}, 8), 1, "vacío")
		T.eq(Pets.firstFreePad({ pet("a", "Blob", 1, 1), pet("b", "Blob", 1, 2), pet("c", "Blob", 1, 4) }, 8), 3)
		local full = {}
		for i = 1, 8 do
			table.insert(full, pet("p" .. i, "Blob", 1, i))
		end
		T.eq(Pets.firstFreePad(full, 8), nil, "lleno")
		T.eq(Pets.firstFreePad(full, 12), 9, "con más pedestales")
		T.eq(Pets.firstFreePad({}, 0), nil, "sin pedestales")
	end)

	T.test("las de reserva no ocupan pedestal", function()
		local list = { pet("a", "Blob", 1, nil), pet("b", "Blob", 1, 1) }
		T.eq(Pets.firstFreePad(list, 8), 2)
		T.eq(Pets.padsUsed(list), 1)
	end)

	T.test("ingresos: solo cuentan las de pedestal y no las que alguien lleva encima", function()
		local list = {
			pet("a", "Blob", 1, 1), -- 1
			pet("b", "Kitty", 3, 2), -- 15
			pet("c", "Dino", 6, nil), -- en reserva
			pet("d", "Octo", 4, 3), -- 60
		}
		T.eq(Pets.incomePerSecond(list, incomes()), 76)
		T.eq(Pets.incomePerSecond(list, incomes(), { d = true }), 16)
		T.eq(Pets.incomePerSecond({}, incomes()), 0)
	end)

	T.test("fusión: la rareza sube de una en una y la mítica no se fusiona", function()
		for r = 1, maxRarity - 1 do
			T.eq(Pets.fuseResult(r, maxRarity), r + 1)
		end
		T.eq(Pets.fuseResult(maxRarity, maxRarity), nil)
		T.eq(Pets.fuseResult(0, maxRarity), nil)
		T.eq(Pets.FUSE_COUNT, 3)
	end)

	T.test("fusión: hacen falta 3 iguales (misma especie y rareza)", function()
		local list = { pet("a", "Blob", 1, 1), pet("b", "Blob", 1, 2), pet("c", "Bunny", 1, 3), pet("d", "Blob", 2, 4) }
		T.eq(Pets.fusePick(list, "Blob", 1, maxRarity), nil, "solo 2")
		table.insert(list, pet("e", "Blob", 1, 5))
		local ids = Pets.fusePick(list, "Blob", 1, maxRarity)
		T.truthy(ids ~= nil and #ids == 3, "3 ids")
	end)

	T.test("fusión: no usa las bloqueadas y prefiere reserva y pedestales altos", function()
		local list = {
			pet("a", "Dino", 2, 1),
			pet("b", "Dino", 2, 7),
			pet("c", "Dino", 2, nil),
			pet("d", "Dino", 2, 3),
			pet("e", "Dino", 2, 5),
		}
		local ids = Pets.fusePick(list, "Dino", 2, maxRarity)
		T.truthy(ids ~= nil)
		if ids then
			T.eq(ids[1], "c", "reserva primero")
			T.eq(ids[2], "b", "luego el pedestal 7")
			T.eq(ids[3], "e", "luego el 5")
		end
		local blocked = Pets.fusePick(list, "Dino", 2, maxRarity, { c = true, b = true, e = true })
		T.eq(blocked, nil, "solo quedan 2 libres")
	end)

	T.test("la mítica no se fusiona aunque haya 3", function()
		local list = { pet("a", "Octo", 6, 1), pet("b", "Octo", 6, 2), pet("c", "Octo", 6, 3) }
		T.eq(Pets.fusePick(list, "Octo", 6, maxRarity), nil)
	end)

	T.test("vender elige una de la reserva antes que una de pedestal", function()
		local list = { pet("a", "Sprout", 1, 2), pet("b", "Sprout", 1, nil) }
		local ids = Pets.pick(list, "Sprout", 1, 1)
		T.truthy(ids ~= nil and ids[1] == "b")
		T.eq(Pets.pick(list, "Sprout", 2, 1), nil, "no hay de esa rareza")
	end)

	T.test("contar, buscar y quitar", function()
		local list = { pet("a", "Blob", 1, 1), pet("b", "Blob", 1, 2), pet("c", "Kitty", 1, 3) }
		T.eq(Pets.count(list, "Blob", 1), 2)
		T.eq(Pets.count(list, "Kitty", 2), 0)
		local found = Pets.find(list, "c")
		T.truthy(found ~= nil and found.s == "Kitty")
		local removed = Pets.remove(list, "a")
		T.truthy(removed ~= nil and removed.id == "a")
		T.eq(#list, 2)
		T.eq(Pets.remove(list, "zz"), nil)
	end)

	T.test("grupos: de la rareza más alta a la más baja y por especie", function()
		local list = {
			pet("a", "Kitty", 1, 1),
			pet("b", "Blob", 1, 2),
			pet("c", "Kitty", 1, 3),
			pet("d", "Dino", 4, 4),
		}
		local groups = Pets.groups(list, speciesOrder())
		T.eq(#groups, 3)
		T.eq(groups[1].s, "Dino")
		T.eq(groups[1].r, 4)
		T.eq(groups[2].s, "Blob")
		T.eq(groups[3].s, "Kitty")
		T.eq(groups[3].count, 2)
	end)
end
