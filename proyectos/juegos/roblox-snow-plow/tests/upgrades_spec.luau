-- Pruebas de src/shared/Upgrades.luau: precios de las mejoras.

local Config = require("../src/shared/Config")
local Upgrades = require("../src/shared/Upgrades")

return function(T)
	T.section("Upgrades")

	T.test("precio = base · crecimiento^nivel", function()
		local def = { id = "X", baseCost = 40, growth = 1.8, maxLevel = 3 }
		T.eq(Upgrades.cost(def, 0), 40)
		T.eq(Upgrades.cost(def, 1), 72)
		T.eq(Upgrades.cost(def, 2), 130, "129,6 se redondea")
		T.eq(Upgrades.cost(def, 3), nil, "al máximo no hay precio")
		T.eq(Upgrades.cost(def, 9), nil)
		T.eq(Upgrades.totalSpent(def, 2), 112)
		T.eq(Upgrades.totalSpent(def, 3), 242)
		T.eq(Upgrades.totalSpent(def, 0), 0)
	end)

	T.test("todas las mejoras: precios crecientes hasta su máximo", function()
		local seen: { [string]: boolean } = {}
		for _, def in Config.Upgrades do
			T.truthy(not seen[def.id], "id repetido " .. def.id)
			seen[def.id] = true
			local previous = 0
			for level = 0, def.maxLevel - 1 do
				local cost = Upgrades.cost(def, level)
				T.truthy(cost ~= nil and cost > previous, def.id .. " nivel " .. level)
				previous = cost or previous
			end
			T.eq(Upgrades.cost(def, def.maxLevel), nil, def.id .. " al máximo")
		end
	end)
end
