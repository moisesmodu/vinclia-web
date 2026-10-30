--!strict
-- Cinta central: cada pocos segundos la nube del principio suelta una gelatina (rareza por tirada ponderada con
-- semilla, especie al azar) que cruza el mapa. Quien tenga monedas y un pedestal libre la compra con su aviso y
-- la gelatina se va andando a su base. Las que llegan al final se las traga la otra nube.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local Rarity = require(ReplicatedStorage.Shared.Rarity)
local Rng = require(ReplicatedStorage.Shared.Rng)
local DataService = require(script.Parent.DataService)
local PetBuilder = require(script.Parent.PetBuilder)
local PetService = require(script.Parent.PetService)
local RateLimiter = require(script.Parent.RateLimiter)
local WorldBuilder = require(script.Parent.WorldBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type Item = {
	model: Model,
	species: string,
	rarity: number,
	price: number,
	x: number,
	facing: number, -- +1 / -1: mira a las bases de un lado o del otro
	sold: boolean,
}

local ConveyorService = {}

local items: { Item } = {}
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)
local weights: { number } = {}
for _, def in Config.Rarities do
	table.insert(weights, def.weight)
end

local function removeItem(item: Item)
	local index = table.find(items, item)
	if index then
		table.remove(items, index)
	end
end

local function buy(player: Player, item: Item)
	if item.sold or not DataService.get(player) then
		return
	end
	if not PetService.canAdopt(player) then
		Notify:FireClient(player, { kind = "padsfull" })
	elseif not DataService.trySpend(player, item.price) then
		Notify:FireClient(player, { kind = "nomoney", price = item.price })
	else
		item.sold = true
		removeItem(item)
		local from = item.model:GetPivot()
		item.model:Destroy()
		PetService.adopt(player, item.species, item.rarity, from)
		Notify:FireClient(player, { kind = "bought", s = item.species, r = item.rarity })
	end
end

local function spawnItem(parent: Folder, start: Vector3, rarity: number, species: string, facing: number)
	local def = Config.Rarities[rarity]
	local model, body = PetBuilder.build(species, rarity)
	model.Name = "ConveyorPet"
	model:SetAttribute("Species", species)
	model:SetAttribute("Rarity", rarity)
	local item: Item = {
		model = model,
		species = species,
		rarity = rarity,
		price = def.price,
		x = start.X,
		facing = facing,
		sold = false,
	}

	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "BuyPrompt"
	prompt.ActionText = "🪙 " .. Economy.short(def.price)
	prompt.ObjectText = def.icon
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.Triggered:Connect(function(player: Player)
		if limiter:allow(player) then
			buy(player, item)
		end
	end)
	prompt.Parent = body

	local label =
		WorldBuilder.billboard(body, def.icon .. " 🪙" .. Economy.short(def.price), UDim2.fromOffset(150, 40), 3.4)
	label.TextColor3 = WorldBuilder.rgb(def.color)

	local position = start + Vector3.new(0, PetBuilder.HEIGHT, 0)
	model:PivotTo(CFrame.lookAt(position, position + Vector3.new(0, 0, facing)))
	model.Parent = parent
	table.insert(items, item)
end

function ConveyorService.start(parent: Folder, start: Vector3, finish: Vector3)
	local rng = Rng.new(Random.new():NextInteger(1, 2 ^ 31 - 2))
	local y = start.Y + PetBuilder.HEIGHT

	task.spawn(function()
		while true do
			if #items < Config.Conveyor.maxItems then
				local rarity = Rarity.roll(rng, weights)
				local species = Config.Species[rng.int(1, #Config.Species)].id
				local facing = if rng.next() < 0.5 then 1 else -1
				spawnItem(parent, start, rarity, species, facing)
			end
			task.wait(Config.Conveyor.spawnInterval)
		end
	end)

	-- avance: las gelatinas de la cinta están ancladas y las mueve el servidor (con un leve bamboleo)
	RunService.Heartbeat:Connect(function(dt: number)
		local done: { Item } = {}
		local t = os.clock()
		for _, item in items do
			item.x += Config.Conveyor.speed * dt
			if item.x >= finish.X then
				table.insert(done, item)
			else
				local wobble = math.sin(t * 6 + item.x) * 0.12
				local position = Vector3.new(item.x, y + math.abs(wobble), start.Z)
				item.model:PivotTo(
					CFrame.lookAt(position, position + Vector3.new(0, 0, item.facing)) * CFrame.Angles(0, 0, wobble)
				)
			end
		end
		for _, item in done do
			removeItem(item)
			item.model:Destroy()
		end
	end)
end

return ConveyorService
