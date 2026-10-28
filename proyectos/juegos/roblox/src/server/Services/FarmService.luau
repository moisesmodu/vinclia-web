--!strict
-- Granja: gallineros construidos con Parts y WedgeParts que ponen huevos con el tiempo en la caja de la parcela.
-- La caja tiene un tope (gallineros · storagePerCollector); los huevos esperan ahí hasta que el camión los carga.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)
local PlotService = require(script.Parent.PlotService)
local WorldBuilder = require(script.Parent.WorldBuilder)

type Farm = {
	player: Player,
	plot: PlotService.Plot,
	stored: number,
	capacity: number,
	coops: { Model },
	timer: number,
}

local FarmService = {}

local farms: { [Player]: Farm } = {}

local COOP_X = { -36, -50, -64 }

local function buildCoop(parent: Instance, position: Vector3): Model
	local c = WorldBuilder.Colors
	local coop = Instance.new("Model")
	coop.Name = "Coop"
	local base = WorldBuilder.anchored(
		coop,
		"House",
		Vector3.new(6, 4, 6),
		CFrame.new(position + Vector3.new(0, 2, 0)),
		c.rail,
		Enum.Material.WoodPlanks
	)
	coop.PrimaryPart = base
	-- tejado a dos aguas: dos WedgeParts con la parte alta hacia el centro
	for _, side in { -1, 1 } do
		local roof = Instance.new("WedgePart")
		roof.Name = "Roof"
		roof.Anchored = true
		roof.Size = Vector3.new(6.6, 2, 3.3)
		local rotation = if side == 1 then CFrame.Angles(0, math.pi, 0) else CFrame.new()
		roof.CFrame = CFrame.new(position + Vector3.new(0, 5, side * 1.65)) * rotation
		roof.Color = c.red
		roof.Material = Enum.Material.SmoothPlastic
		roof.Parent = coop
	end
	WorldBuilder.anchored(
		coop,
		"Door",
		Vector3.new(0.2, 2.4, 2),
		CFrame.new(position + Vector3.new(3.05, 1.2, 0)),
		c.ink
	)
	local hen = WorldBuilder.anchored(
		coop,
		"Hen",
		Vector3.new(1.6, 1.6, 1.6),
		CFrame.new(position + Vector3.new(4.2, 0.8, 1.5)),
		Color3.new(1, 1, 1)
	)
	hen.Shape = Enum.PartType.Ball
	WorldBuilder.anchored(
		coop,
		"Comb",
		Vector3.new(0.3, 0.5, 0.6),
		CFrame.new(position + Vector3.new(4.2, 1.8, 1.5)),
		c.red
	)
	coop.Parent = parent
	return coop
end

local function pulse(coop: Model)
	local house = coop.PrimaryPart
	if house then
		local tween = TweenService:Create(
			house,
			TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, 0, true),
			{ Size = house.Size * 1.08 }
		)
		tween:Play()
	end
end

local function updateLabel(farm: Farm)
	farm.plot.crateLabel.Text = string.format("🥚 %d/%d", farm.stored, farm.capacity)
	farm.player:SetAttribute("FarmStored", farm.stored)
	farm.player:SetAttribute("FarmCapacity", farm.capacity)
end

local function rebuildCoops(farm: Farm)
	farm.plot.farmFolder:ClearAllChildren()
	table.clear(farm.coops)
	local hasSecond = farm.player:GetAttribute("Pass_SecondFarm") == true
	local count = Economy.collectorCount(hasSecond, Config.Farm)
	for i = 1, count do
		local row = if i <= #COOP_X then 1 else -1
		local x = COOP_X[(i - 1) % #COOP_X + 1]
		local position = Vector3.new(x, 0, farm.plot.laneZ + row * 5)
		table.insert(farm.coops, buildCoop(farm.plot.farmFolder, position))
	end
	farm.capacity = Economy.farmStorage(count, Config.Farm)
	farm.stored = math.min(farm.stored, farm.capacity)
	updateLabel(farm)
end

function FarmService.setup(player: Player)
	local plot = PlotService.get(player)
	if plot then
		local farm: Farm = {
			player = player,
			plot = plot,
			stored = 2, -- dos huevos de bienvenida: el primer viaje empieza ya
			capacity = 0,
			coops = {},
			timer = 0,
		}
		farms[player] = farm
		rebuildCoops(farm)
	end
end

-- Tras comprar el pase de segunda granja.
function FarmService.refresh(player: Player)
	local farm = farms[player]
	if farm then
		rebuildCoops(farm)
	end
end

-- Saca hasta `wanted` huevos de la caja; devuelve cuántos salieron.
function FarmService.take(player: Player, wanted: number): number
	local farm = farms[player]
	if not farm or wanted <= 0 then
		return 0
	end
	local n = math.min(farm.stored, math.floor(wanted))
	farm.stored -= n
	updateLabel(farm)
	return n
end

-- Devuelve huevos intactos a la caja (al reiniciar el camión en la parcela).
function FarmService.give(player: Player, amount: number)
	local farm = farms[player]
	if not farm or amount <= 0 then
		return
	end
	farm.stored = math.min(farm.capacity, farm.stored + math.floor(amount))
	updateLabel(farm)
end

function FarmService.cleanup(player: Player)
	farms[player] = nil
end

function FarmService.start()
	RunService.Heartbeat:Connect(function(dt)
		for player, farm in farms do
			if farm.stored >= farm.capacity then
				farm.timer = 0
				continue
			end
			farm.timer += dt
			local interval = Economy.farmInterval(DataService.getLevel(player, "FarmSpeed"), Config.Farm)
			if farm.timer >= interval then
				farm.timer -= interval
				farm.stored = math.min(farm.capacity, farm.stored + #farm.coops)
				updateLabel(farm)
				for _, coop in farm.coops do
					pulse(coop)
				end
			end
		end
	end)
end

return FarmService
