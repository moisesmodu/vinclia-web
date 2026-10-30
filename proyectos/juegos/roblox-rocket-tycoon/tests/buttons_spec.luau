-- Pruebas de src/shared/Buttons.luau con los botones de Config: árbol sin ciclos, todo alcanzable, orden,
-- reglas de compra, siguiente botón (Instant Upgrade) y limpieza del guardado.

local Buttons = require("../src/shared/Buttons")
local Config = require("../src/shared/Config")

local function def(id: string, cost: number, requires: { string })
	return { id = id, kind = "deco", cost = cost, requires = requires }
end

local function count(t: { [string]: boolean }): number
	local n = 0
	for _ in t do
		n += 1
	end
	return n
end

return function(T)
	T.section("Buttons")
	local defs = Config.Buttons

	T.test("el árbol de Config no tiene problemas", function()
		local problems = Buttons.validate(defs)
		T.eq(#problems, 0, table.concat(problems, "; "))
	end)

	T.test("orden topológico: todos, y cada uno después de lo que necesita", function()
		local order, stuck = Buttons.order(defs)
		T.eq(#stuck, 0, "inalcanzables")
		T.eq(#order, #defs, "todos ordenados")
		local position: { [string]: number } = {}
		for i, id in order do
			position[id] = i
		end
		for _, d in defs do
			for _, need in d.requires do
				T.truthy(position[need] < position[d.id], d.id .. " antes que " .. need)
			end
		end
	end)

	T.test("comprando siempre el siguiente se llega al final", function()
		local owned: { [string]: boolean } = {}
		local spent = 0
		for _ = 1, #defs do
			local id = Buttons.nextButton(defs, owned)
			T.truthy(id ~= nil, "siempre hay siguiente hasta el final")
			if id then
				local result, cost = Buttons.canBuy(defs, owned, math.huge, id)
				T.eq(result, "ok", id)
				owned[id] = true
				spent += cost
			end
		end
		T.eq(Buttons.nextButton(defs, owned), nil, "todo comprado")
		T.eq(spent, Buttons.totalCost(defs))
		T.truthy(owned[Config.FinalButton], "el último botón existe")
	end)

	T.test("solo el primero se ve al empezar y es gratis", function()
		local available = Buttons.available(defs, {})
		T.eq(#available, 1)
		T.eq(available[1], defs[1].id)
		T.eq(defs[1].cost, 0)
	end)

	T.test("precios: crecen a lo largo del árbol y el total ronda 600K", function()
		local byId = Buttons.byId(defs)
		for _, d in defs do
			for _, need in d.requires do
				T.truthy(byId[need].cost <= d.cost * 4, d.id .. " no es mucho más barato que " .. need)
			end
		end
		local total = Buttons.totalCost(defs)
		T.truthy(total > 500000 and total < 800000, "total " .. total)
	end)

	T.test("validate detecta ciclos, repetidos y requisitos que no existen", function()
		local cyclic = { def("a", 0, {}), def("b", 10, { "c" }), def("c", 10, { "b" }) }
		T.eq(#Buttons.validate(cyclic), 2, "b y c inalcanzables")
		local dup = { def("a", 0, {}), def("a", 5, {}) }
		T.truthy(#Buttons.validate(dup) >= 1, "id repetido")
		local missing = { def("a", 0, {}), def("b", 5, { "zzz" }) }
		T.truthy(#Buttons.validate(missing) >= 2, "requisito inexistente y b inalcanzable")
		local noStart = { def("a", 5, {}) }
		T.eq(#Buttons.validate(noStart), 1, "sin botón gratis")
		local self = { def("a", 0, {}), def("b", 1, { "b" }) }
		T.truthy(#Buttons.validate(self) >= 2, "se necesita a sí mismo")
		local badKind = { { id = "a", kind = "laser", cost = 0, requires = {} } }
		T.eq(#Buttons.validate(badKind), 1, "tipo desconocido")
		local negative = { def("a", 0, {}), def("b", -5, { "a" }) }
		T.eq(#Buttons.validate(negative), 1, "precio negativo")
	end)

	T.test("canBuy: ok, comprado, bloqueado, sin monedas, desconocido", function()
		local owned = Buttons.toSet({ "drill1" })
		local r1, c1 = Buttons.canBuy(defs, owned, 30, "drill2")
		T.eq(r1, "ok")
		T.eq(c1, 30)
		local r2 = Buttons.canBuy(defs, owned, 29, "drill2")
		T.eq(r2, "coins")
		local r3 = Buttons.canBuy(defs, owned, 1e9, "drill1")
		T.eq(r3, "owned")
		local r4 = Buttons.canBuy(defs, owned, 1e9, "observatory")
		T.eq(r4, "locked")
		local r5, c5 = Buttons.canBuy(defs, owned, 1e9, "nope")
		T.eq(r5, "unknown")
		T.eq(c5, 0)
	end)

	T.test("canBuy con varios requisitos: hacen falta todos", function()
		local owned = Buttons.toSet({ "drill1", "drill2", "drill3", "drill4" })
		T.eq((Buttons.canBuy(defs, owned, 1e9, "drill5")), "locked", "falta scanner1")
		owned.scanner1 = true
		T.eq((Buttons.canBuy(defs, owned, 1e9, "drill5")), "ok")
	end)

	T.test("nextButton: el más barato de los visibles", function()
		local owned = Buttons.toSet({ "drill1" })
		-- visibles: drill2 (30) y wallBack (80)
		T.eq(Buttons.nextButton(defs, owned), "drill2")
		owned.drill2 = true
		-- visibles: wallBack 80, drill3 150, scanner1 300
		T.eq(Buttons.nextButton(defs, owned), "wallBack")
	end)

	T.test("sanitize: ids conocidos, sin repetir, con sus requisitos y en orden", function()
		local clean = Buttons.sanitize(defs, { "drill2", "drill1", "drill1", "nope", 42, "observatory", "wallBack" })
		T.eq(#clean, 3)
		T.eq(clean[1], "drill1")
		T.eq(clean[2], "drill2")
		T.eq(clean[3], "wallBack")
		T.eq(#Buttons.sanitize(defs, { "drill2" }), 0, "sin drill1 no vale drill2")
		T.eq(#Buttons.sanitize(defs, {}), 0)
	end)

	T.test("ownedCount y toSet", function()
		local set = Buttons.toSet({ "drill1", "drill2", "drill1" })
		T.eq(count(set), 2)
		T.eq(Buttons.ownedCount(defs, set), 2)
		set.unknown = true
		T.eq(Buttons.ownedCount(defs, set), 2, "los desconocidos no cuentan")
	end)
end
