--!strict
-- Granja: gallineros construidos con Parts y WedgeParts que ponen huevos con el tiempo en la caja de la parcela.
-- La caja tiene un tope (gallineros · storagePerCollector); los huevos esperan ahí hasta que el camión los carga.
-- Huevos raros: el servidor tira el dado por cada huevo puesto (Economy.rollRarity con Config.RarityTiers) y lleva
-- la cuenta de cada rareza en la caja. Un huevo se identifica por su rareza: 0 = normal, i = Config.RarityTiers[i].

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)
local EventService = require(script.Parent.EventService)
local PlotService = require(script.Parent.PlotService)
local WorldBuilder = require(script.Parent.WorldBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type Farm = {
	player: Player,
	plot: PlotService.Plot,
	stored: number, -- huevos en la caja (normales + raros)
	rare: { number }, -- rare[i] = cuántos de esos huevos son de la rareza i
	capacity: number,
	coops: { Model },
	timer: number,
}

local FarmService = {}

local farms: { [Player]: Farm } = {}

local COOP_X = { -36, -50, -64 }

local rng = Random.new()
local function roll(): number
	return rng:NextNumber()
end

local chances: { number } = {}
for i, tier in Config.RarityTiers do
	chances[i] = tier.chance
end

local function rareTotal(farm: Farm): number
	local total = 0
	for _, n in farm.rare do
		total += n
	end
	return total
end

-- Quita raros (de los menos valiosos) hasta que no haya más raros que huevos en la caja.
local function clampRare(farm: Farm)
	local excess = rareTotal(farm) - farm.stored
	for i = 1, #farm.rare do
		if excess > 0 then
			local n = math.min(farm.rare[i], excess)
			farm.rare[i] -= n
			excess -= n
		end
	end
end

-- Multiplicador de rareza del jugador: mejora 🍀, pase 2×, impulso del Huevo de oro y evento de fin de semana.
local function rarityMultiplier(player: Player): number
	return Economy.rarityMultiplier(
		DataService.getLevel(player, "Luck"),
		player:GetAttribute("Pass_DoubleCash") == true,
		DataService.getLuckUntil(player) > os.time(),
		EventService.isActive(),
		Config.Rarity
	)
end

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
	local label = string.format("🥚 %d/%d", farm.stored, farm.capacity)
	for i, tier in Config.RarityTiers do
		local n = farm.rare[i] or 0
		if n > 0 then
			label ..= string.format(" %s%d", tier.icon, n)
		end
	end
	farm.plot.crateLabel.Text = label
	farm.player:SetAttribute("FarmStored", farm.stored)
	farm.player:SetAttribute("FarmCapacity", farm.capacity)
	farm.player:SetAttribute("FarmRare", rareTotal(farm))
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
	clampRare(farm)
	updateLabel(farm)
end

function FarmService.setup(player: Player)
	local plot = PlotService.get(player)
	if plot then
		local farm: Farm = {
			player = player,
			plot = plot,
			stored = 2, -- dos huevos de bienvenida: el primer viaje empieza ya
			rare = table.create(#Config.RarityTiers, 0),
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

local function takeFrom(farm: Farm, wanted: number): { number }
	local taken: { number } = {}
	local n = math.min(farm.stored, math.floor(wanted))
	-- primero los raros, del más valioso al menos
	for i = #farm.rare, 1, -1 do
		while farm.rare[i] > 0 and #taken < n do
			farm.rare[i] -= 1
			table.insert(taken, i)
		end
	end
	while #taken < n do
		table.insert(taken, 0)
	end
	farm.stored -= n
	updateLabel(farm)
	return taken
end

-- Saca hasta `wanted` huevos de la caja; devuelve la rareza de cada uno (0 = normal), primero los raros.
function FarmService.take(player: Player, wanted: number): { number }
	local farm = farms[player]
	if farm and wanted > 0 then
		return takeFrom(farm, wanted)
	end
	return {}
end

-- Devuelve huevos intactos a la caja (al reiniciar el camión en la parcela), con su rareza.
function FarmService.give(player: Player, eggs: { number })
	local farm = farms[player]
	if farm and #eggs > 0 then
		local space = farm.capacity - farm.stored
		local sorted = table.clone(eggs)
		table.sort(sorted, function(a, b)
			return a > b
		end)
		for _, tier in sorted do
			if space > 0 then
				space -= 1
				farm.stored += 1
				if tier > 0 and tier <= #farm.rare then
					farm.rare[tier] += 1
				end
			end
		end
		updateLabel(farm)
	end
end

-- Pone `count` huevos nuevos y tira el dado de rareza de cada uno. Devuelve la rareza más alta que salió.
local function lay(farm: Farm, count: number): number
	local multiplier = rarityMultiplier(farm.player)
	local best = 0
	for _ = 1, count do
		local tier = Economy.rollRarity(roll, chances, multiplier, Config.Rarity.maxRareShare)
		if tier > 0 then
			farm.rare[tier] += 1
			best = math.max(best, tier)
		end
	end
	farm.stored += count
	return best
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
				local best = lay(farm, math.min(farm.capacity - farm.stored, #farm.coops))
				updateLabel(farm)
				if best >= 2 then -- aviso solo de oro o mejor: la plata sale a menudo y taparía otros avisos
					Notify:FireClient(player, { kind = "rare_egg", tier = best })
				end
				for _, coop in farm.coops do
					pulse(coop)
				end
			end
		end
	end)
end

return FarmService
