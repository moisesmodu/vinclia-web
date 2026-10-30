-- Pruebas de src/shared/Rewards.luau: monedas, multiplicador del reinicio de torre y estelas.

local Config = require("../src/shared/Config")
local Rewards = require("../src/shared/Rewards")

return function(T)
	T.section("Rewards")
	local r = Config.Rewards
	local restart = Config.Restart

	T.test("multiplicador: +25 % por reinicio, con tope ×4", function()
		T.eq(Rewards.multiplier(0, restart), 1)
		T.eq(Rewards.multiplier(1, restart), 1.25)
		T.eq(Rewards.multiplier(4, restart), 2)
		T.eq(Rewards.multiplier(12, restart), 4)
		T.eq(Rewards.multiplier(500, restart), 4, "tope")
		T.eq(Rewards.multiplier(-3, restart), 1, "nunca menos de 1")
	end)

	T.test("monedas por checkpoint: suben con la fase", function()
		T.eq(Rewards.stageCoins(2, 1, r), 5, "fase 1 terminada")
		T.eq(Rewards.stageCoins(3, 1, r), 6)
		T.eq(Rewards.stageCoins(41, 1, r), 44, "fase 40")
		T.eq(Rewards.stageCoins(41, 2, r), 88, "con ×2")
		T.eq(Rewards.stageCoins(3, 1.25, r), 7, "redondea hacia abajo")
		T.eq(Rewards.stageCoins(2, 0.5, r), 5, "multiplicador mínimo 1")
		local previous = 0
		for checkpoint = 2, Config.Tower.stages + 1 do
			local coins = Rewards.stageCoins(checkpoint, 1, r)
			T.truthy(coins > previous, "checkpoint " .. checkpoint)
			previous = coins
		end
	end)

	T.test("cima y subida completa", function()
		T.eq(Rewards.finishCoins(1, r), 250)
		T.eq(Rewards.finishCoins(1.25, r), 312)
		-- 40 fases: 5 + 6 + ... + 44 = 980, más 250
		T.eq(Rewards.runTotal(Config.Tower.stages, 1, r), 1230)
	end)

	T.test("precios de las estelas: la primera en una subida, la más cara en unas pocas", function()
		local run = Rewards.runTotal(Config.Tower.stages, 1, r)
		local cheapest = math.huge
		local dearest = 0
		for _, trail in Config.Trails do
			if not trail.premium then
				cheapest = math.min(cheapest, trail.price)
				dearest = math.max(dearest, trail.price)
			else
				T.eq(trail.price, 0, "las especiales van con el pase")
			end
		end
		T.truthy(cheapest <= run, "la más barata cabe en una subida")
		T.truthy(dearest > run and dearest <= run * 3, "la más cara pide volver a subir")
	end)

	T.test("estelas: quitar, poner, comprar, sin monedas, sin pase", function()
		T.eq(Rewards.trailAction(150, false, true, true, 0, false), "unequip")
		T.eq(Rewards.trailAction(150, false, true, false, 0, false), "equip")
		T.eq(Rewards.trailAction(150, false, false, false, 150, false), "buy")
		T.eq(Rewards.trailAction(150, false, false, false, 149, false), "nomoney")
		T.eq(Rewards.trailAction(0, true, false, false, 99999, false), "needpass")
		T.eq(Rewards.trailAction(0, true, false, false, 0, true), "equip")
	end)

	T.test("ids de estelas únicos y colores válidos", function()
		local ids = {}
		for _, trail in Config.Trails do
			T.truthy(ids[trail.id] == nil, "repetida " .. trail.id)
			ids[trail.id] = true
			T.truthy(#trail.colors >= 2 and #trail.colors <= 3, "colores de " .. trail.id)
			for _, color in trail.colors do
				for _, channel in color do
					T.truthy(channel >= 0 and channel <= 255, "canal de " .. trail.id)
				end
			end
		end
	end)

	T.test("reinicios con máximo", function()
		T.eq(Rewards.canRestart(0, restart), true)
		T.eq(Rewards.canRestart(restart.maxRestarts, restart), false)
	end)

	T.test("tienda: todo apagado (id 0) hasta que Moisés pegue los IDs", function()
		local names = {}
		for _, item in Config.GamePasses do
			names[item.name] = true
			T.truthy(item.id >= 0 and item.id == math.floor(item.id), item.name)
		end
		for _, item in Config.Products do
			names[item.name] = true
			T.truthy(item.id >= 0 and item.id == math.floor(item.id), item.name)
		end
		for _, name in { "SpeedCoil", "GravityCoil", "TrailPack", "SkipStage" } do
			T.truthy(names[name], "falta " .. name)
		end
	end)
end
