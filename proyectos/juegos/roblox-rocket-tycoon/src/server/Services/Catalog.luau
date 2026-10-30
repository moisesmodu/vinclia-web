--!strict
-- Los botones de Config en las formas que piden los módulos puros (Buttons.Def e Income.Def) y un índice por id.
-- Se construye una vez al arrancar.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Buttons = require(ReplicatedStorage.Shared.Buttons)
local Config = require(ReplicatedStorage.Shared.Config)
local Income = require(ReplicatedStorage.Shared.Income)

local Catalog = {}

local tree: { Buttons.Def } = {}
local income: { Income.Def } = {}
local byId: { [string]: Config.ButtonDef } = {}

for _, def in Config.Buttons do
	local node: Buttons.Def = { id = def.id, kind = def.kind, cost = def.cost, requires = def.requires }
	table.insert(tree, node)
	local entry: Income.Def = {
		id = def.id,
		kind = def.kind,
		value = def.value,
		interval = def.interval,
		multiplier = def.multiplier,
		bonus = def.bonus,
	}
	table.insert(income, entry)
	byId[def.id] = def
end

local problems = Buttons.validate(tree)
if #problems > 0 then
	warn("[Catalog] el árbol de botones tiene problemas:", table.concat(problems, "; "))
end

Catalog.tree = tree
Catalog.income = income

function Catalog.get(id: string): Config.ButtonDef?
	return byId[id]
end

return Catalog
