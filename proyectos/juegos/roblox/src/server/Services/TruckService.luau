--!strict
-- Camión de cada jugador: aparición en su plataforma, carga de huevos físicos en la caja, rotura de huevos y
-- entrega en el mercado. Todo lo que da monedas se decide aquí, en el servidor:
-- * los huevos solo los crea el servidor (nunca más que la capacidad ni más que los que había en la granja);
-- * la entrega cuenta los huevos que el servidor ve dentro de la caja al llegar al mercado;
-- * un viaje más rápido de lo físicamente posible no cobra;
-- * cada huevo lleva su rareza (0 = normal, i = Config.RarityTiers[i]) y paga su valor al entregarlo.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local DataService = require(script.Parent.DataService)
local EventService = require(script.Parent.EventService)
local FarmService = require(script.Parent.FarmService)
local PlotService = require(script.Parent.PlotService)
local RaceService = require(script.Parent.RaceService)
local TruckBuilder = require(script.Parent.TruckBuilder)
local WorldBuilder = require(script.Parent.WorldBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type EggInfo = { spawnedAt: number, tier: number }

type TruckState = {
	player: Player,
	plot: PlotService.Plot,
	parts: TruckBuilder.TruckParts,
	eggs: { [BasePart]: EggInfo },
	eggCount: number,
	loaded: number, -- huevos cargados en este viaje
	broken: number, -- huevos rotos en este viaje
	capacity: number,
	breakSpeed: number,
	leftPadAt: number?,
	busy: boolean, -- entregando o reapareciendo
	connections: { RBXScriptConnection },
}

local TruckService = {}

local world: WorldBuilder.World? = nil

local trucks: { [Player]: TruckState } = {}
local lastReset: { [Player]: number } = setmetatable({}, { __mode = "k" }) :: any

local trucksFolder = Instance.new("Folder")
trucksFolder.Name = "Trucks"
trucksFolder.Parent = Workspace

local YOLK = Color3.fromRGB(255, 201, 77)
local SHELL = Color3.fromRGB(255, 248, 231)

-- Aspecto de la pintura puesta del jugador (la de serie si algo no cuadra).
local function paintStyle(player: Player): (Color3, Enum.Material)
	local def = Config.Paints[DataService.getPaint(player)] or Config.Paints[Config.DefaultPaint]
	local material = Enum.Material.SmoothPlastic
	if def.material == "Metal" then
		material = Enum.Material.Metal
	elseif def.material == "Neon" then
		material = Enum.Material.Neon
	end
	return Color3.fromRGB(def.rgb[1], def.rgb[2], def.rgb[3]), material
end

-- Valor de un huevo al entregarlo (1 = normal).
local function eggValue(tier: number): number
	local def = Config.RarityTiers[tier]
	return if def then def.value else 1
end

-- Viste el huevo según su rareza: color, material y destellos.
local function styleEgg(egg: Part, tier: number)
	local def = Config.RarityTiers[tier]
	if def then
		egg.Color = Color3.fromRGB(def.rgb[1], def.rgb[2], def.rgb[3])
		if def.material == "Foil" then
			egg.Material = Enum.Material.Foil
		elseif def.material == "Neon" then
			egg.Material = Enum.Material.Neon
		end
		if def.sparkle then
			local sparkles = Instance.new("Sparkles")
			sparkles.SparkleColor = egg.Color
			sparkles.Parent = egg
		end
		egg:SetAttribute("Rarity", def.id)
	end
end

local function notify(player: Player, payload: { [string]: any })
	Notify:FireClient(player, payload)
end

local function updateAttributes(state: TruckState)
	local player = state.player
	player:SetAttribute("EggsInBed", state.eggCount)
	player:SetAttribute("Capacity", state.capacity)
	player:SetAttribute("EggsBroken", state.broken)
end

local function setOwner(state: TruckState, owner: Player?)
	for _, d in state.parts.model:GetDescendants() do
		if d:IsA("BasePart") and not d.Anchored then
			local part = d
			pcall(function()
				if part:CanSetNetworkOwnership() then
					part:SetNetworkOwner(owner)
				end
			end)
		end
	end
end

local function bedLocal(state: TruckState, position: Vector3): Vector3
	return state.parts.chassis.CFrame:PointToObjectSpace(position)
end

-- ¿Está la posición dentro de la caja (con `margin` studs de holgura)?
local function insideBed(state: TruckState, position: Vector3, margin: number): boolean
	local p = state.parts
	local l = bedLocal(state, position)
	return math.abs(l.X) <= p.bedHalfX + margin
		and l.Z >= p.bedMinZ - margin
		and l.Z <= p.bedMaxZ + margin
		and l.Y >= p.bedFloorY - 0.4 - margin
		and l.Y <= p.bedFloorY + p.wallHeight + 4 + margin
end

local function splat(position: Vector3)
	local mark = Instance.new("Part")
	mark.Name = "Splat"
	mark.Shape = Enum.PartType.Cylinder
	mark.Size = Vector3.new(0.15, 2.2, 2.2)
	mark.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.pi / 2)
	mark.Color = YOLK
	mark.Material = Enum.Material.SmoothPlastic
	mark.Anchored = true
	mark.CanCollide = false
	mark.CanTouch = false
	mark.CanQuery = false
	mark.Parent = Workspace
	task.delay(3, function()
		mark:Destroy()
	end)
end

local function breakEgg(state: TruckState, egg: BasePart)
	if not state.eggs[egg] then
		return
	end
	state.eggs[egg] = nil
	state.eggCount -= 1
	state.broken += 1
	splat(egg.Position)
	egg:Destroy()
	updateAttributes(state)
end

local function clearEggs(state: TruckState)
	for egg in state.eggs do
		egg:Destroy()
	end
	table.clear(state.eggs)
	state.eggCount = 0
	updateAttributes(state)
end

-- Posición de la casilla `slot` (0, 1, 2…) en la caja, en coordenadas del chasis: rejilla de 5 columnas.
local function slotPosition(state: TruckState, slot: number): Vector3
	local p = state.parts
	local cols = 5
	local rows = math.max(1, math.floor((p.bedMaxZ - p.bedMinZ) / 1.05))
	local col = slot % cols
	local row = math.floor(slot / cols) % rows
	local layer = math.floor(slot / (cols * rows))
	local x = (col - (cols - 1) / 2) * 1.0
	local z = p.bedMinZ + 0.6 + row * 1.05
	local y = p.bedFloorY + Config.Egg.sizeY / 2 + 0.05 + layer * (Config.Egg.sizeY + 0.05)
	return Vector3.new(x, y, z)
end

-- Crea un huevo físico por cada rareza de `tiers` (hasta llenar la caja).
local function spawnEggs(state: TruckState, tiers: { number })
	local e = Config.Egg
	local chassis = state.parts.chassis
	for _, tier in tiers do
		if state.eggCount >= state.capacity then
			break
		end
		local egg = Instance.new("Part")
		egg.Name = "Egg"
		egg.Size = Vector3.new(e.sizeX, e.sizeY, e.sizeZ)
		egg.Color = SHELL
		egg.Material = Enum.Material.SmoothPlastic
		egg.CustomPhysicalProperties = PhysicalProperties.new(e.density, 0.9, 0, 1, 1)
		egg.CollisionGroup = "Eggs"
		local mesh = Instance.new("SpecialMesh")
		mesh.MeshType = Enum.MeshType.Sphere -- se escala con la pieza: elipsoide con forma de huevo
		mesh.Parent = egg
		styleEgg(egg, tier)
		egg.CFrame = chassis.CFrame * CFrame.new(slotPosition(state, state.eggCount))
		egg:AddTag("Egg")

		state.eggs[egg] = { spawnedAt = os.clock(), tier = tier }
		state.eggCount += 1

		egg.Touched:Connect(function(other: BasePart)
			local info = state.eggs[egg]
			if not info or os.clock() - info.spawnedAt < e.spawnGrace then
				return
			end
			if other:HasTag("Ground") then
				breakEgg(state, egg) -- tocó el suelo o la pista
				return
			end
			local impact = (egg.AssemblyLinearVelocity - other.AssemblyLinearVelocity).Magnitude
			if impact > state.breakSpeed then
				breakEgg(state, egg)
			end
		end)

		egg.Parent = state.parts.eggsFolder
		pcall(function()
			egg:SetNetworkOwner(state.player)
		end)
	end
	updateAttributes(state)
end

local function destroyTruck(state: TruckState)
	for _, connection in state.connections do
		connection:Disconnect()
	end
	table.clear(state.connections)
	table.clear(state.eggs)
	state.parts.model:Destroy()
end

local function humanoidOf(player: Player): Humanoid?
	local character = player.Character
	if character then
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if humanoid and humanoid.Health > 0 then
			return humanoid
		end
	end
	return nil
end

local function seatPlayer(state: TruckState)
	local humanoid = humanoidOf(state.player)
	if humanoid and state.parts.seat.Parent then
		state.parts.seat:Sit(humanoid)
	end
end

type SpawnOptions = {
	at: CFrame?,
	eggs: { number }?, -- rareza de cada huevo con el que aparece
	loaded: number?,
	leftPadAt: number?,
	seat: boolean?,
}

-- Crea el camión de `player` en su parcela `plot` (sustituye al anterior, si lo hay).
local function buildTruck(player: Player, plot: PlotService.Plot, options: SpawnOptions): TruckState
	local old = trucks[player]
	if old then
		trucks[player] = nil
		destroyTruck(old)
	end

	local hasBig = player:GetAttribute("Pass_BigTruck") == true
	local wallLevel = DataService.getLevel(player, "BedWalls")
	local suspensionLevel = DataService.getLevel(player, "Suspension")
	local damping, travel = Economy.suspension(suspensionLevel, Config.Truck)

	local color, material = paintStyle(player)
	local parts = TruckBuilder.build({
		big = hasBig,
		wallHeight = Economy.wallHeight(wallLevel, Config.Truck),
		color = color,
		material = material,
	})
	parts.model.Name = "Truck_" .. player.UserId
	parts.model:SetAttribute("OwnerUserId", player.UserId)
	parts.model:PivotTo(options.at or plot.padCFrame)
	parts.model.Parent = trucksFolder
	TruckBuilder.tuneSuspension(parts, damping, travel)

	local state: TruckState = {
		player = player,
		plot = plot,
		parts = parts,
		eggs = {},
		eggCount = 0,
		loaded = options.loaded or 0,
		broken = 0,
		capacity = Economy.truckCapacity(DataService.getLevel(player, "Capacity"), hasBig, Config.Truck),
		breakSpeed = Economy.breakSpeed(suspensionLevel, Config.Egg),
		leftPadAt = options.leftPadAt,
		busy = false,
		connections = {},
	}
	trucks[player] = state

	-- solo el dueño conduce su camión
	table.insert(
		state.connections,
		parts.seat:GetPropertyChangedSignal("Occupant"):Connect(function()
			local occupant = parts.seat.Occupant
			if occupant then
				local who = Players:GetPlayerFromCharacter(occupant.Parent)
				if who == player then
					setOwner(state, player)
				else
					local weld = parts.seat:FindFirstChild("SeatWeld")
					if weld then
						weld:Destroy()
					end
					occupant.Sit = false
				end
			end
		end)
	)

	setOwner(state, player)
	local startEggs = options.eggs
	if startEggs then
		spawnEggs(state, startEggs)
	end
	updateAttributes(state)
	if options.seat then
		task.defer(seatPlayer, state)
	end
	return state
end

-- nil si el jugador no tiene parcela.
local function spawnTruck(player: Player, options: SpawnOptions): TruckState?
	local plot = PlotService.get(player)
	if plot then
		return buildTruck(player, plot, options)
	end
	return nil
end

local function minTripSeconds(): number
	local w = world
	if w then
		local topSpeed = Config.Truck.maxWheelSpeed * Config.Truck.wheelRadius
		return w.track.length / topSpeed * Config.Payout.minTripFactor
	end
	return math.huge
end

local function deliver(state: TruckState, w: WorldBuilder.World)
	state.busy = true
	local player = state.player

	local values: { number } = {}
	for egg, info in state.eggs do
		if insideBed(state, egg.Position, 0.5) then
			table.insert(values, eggValue(info.tier))
		end
	end
	local intact = math.min(#values, state.loaded, state.capacity)
	-- si hubiera que recortar, cuentan los de menos valor
	table.sort(values)
	local units = 0
	local rare = 0
	for i = 1, intact do
		units += values[i]
		if values[i] > 1 then
			rare += 1
		end
	end

	local coins = 0
	local elapsed = if state.leftPadAt then os.clock() - state.leftPadAt else 0
	if intact > 0 then
		if elapsed >= minTripSeconds() then
			local multiplier = if player:GetAttribute("Pass_DoubleCash") == true
				then Config.Payout.doubleCashMultiplier
				else 1
			coins = Economy.payoutUnits(units, intact, state.capacity, w.track.length, Config.Payout, multiplier)
			DataService.addCoins(player, coins)
			DataService.recordDelivery(player, intact, coins)
			RaceService.recordDelivery(player, intact)
			EventService.recordDelivery(player, intact)
		else
			warn(string.format("[TruckService] viaje de %d demasiado rápido (%.1fs)", player.UserId, elapsed))
			intact = 0
			rare = 0
		end
	end

	notify(player, { kind = "delivery", coins = coins, intact = intact, broken = state.broken, rare = rare })
	clearEggs(state)

	task.delay(1.5, function()
		if trucks[player] == state then
			spawnTruck(player, { seat = humanoidOf(player) ~= nil })
		end
	end)
end

function TruckService.init(w: WorldBuilder.World)
	world = w
end

function TruckService.setup(player: Player)
	spawnTruck(player, {})
end

function TruckService.loadEggs(player: Player)
	local state = trucks[player]
	if not state or state.busy then
		return
	end
	local chassis = state.parts.chassis
	local offset = (chassis.Position - state.plot.padPosition) * Vector3.new(1, 0, 1)
	if offset.Magnitude > 10 or chassis.AssemblyLinearVelocity.Magnitude > 6 then
		notify(player, { kind = "too_far" })
		return
	end
	local space = state.capacity - state.eggCount
	if space <= 0 then
		notify(player, { kind = "truck_full" })
		return
	end
	local taken = FarmService.take(player, space)
	if #taken <= 0 then
		notify(player, { kind = "farm_empty" })
		return
	end
	spawnEggs(state, taken)
	state.loaded += #taken
	state.leftPadAt = nil -- el viaje empieza al salir de la parcela
	notify(player, { kind = "loaded", n = #taken })
end

-- Vuelve a la plataforma. Los huevos intactos que siguen en la caja vuelven a la granja.
function TruckService.reset(player: Player)
	local now = os.clock()
	if now - (lastReset[player] or 0) < 3 then
		return
	end
	lastReset[player] = now
	local state = trucks[player]
	if state and state.busy then
		return
	end
	if state then
		local intact: { number } = {}
		for egg, info in state.eggs do
			if insideBed(state, egg.Position, 0.5) then
				table.insert(intact, info.tier)
			end
		end
		FarmService.give(player, intact)
	end
	spawnTruck(player, { seat = humanoidOf(player) ~= nil })
end

-- Producto "Reparación instantánea": endereza el camión donde está y repone los huevos rotos del viaje.
function TruckService.instantRepair(player: Player): boolean
	local state = trucks[player]
	if not state then
		return spawnTruck(player, { seat = true }) ~= nil
	end
	local chassis = state.parts.chassis
	local at: CFrame? = nil
	if chassis.Parent and chassis.Position.Y > -20 then
		local position = chassis.Position + Vector3.new(0, 4, 0)
		at = CFrame.lookAt(position, position + Vector3.new(1, 0, 0))
	end
	-- los huevos que quedan conservan su rareza; los rotos vuelven como normales
	local restore = math.min(state.capacity, state.eggCount + state.broken)
	local tiers: { number } = {}
	for _, info in state.eggs do
		table.insert(tiers, info.tier)
	end
	table.sort(tiers, function(a, b)
		return a > b
	end)
	while #tiers < restore do
		table.insert(tiers, 0)
	end
	while #tiers > restore do
		table.remove(tiers)
	end
	spawnTruck(player, {
		at = at,
		eggs = tiers,
		loaded = math.max(state.loaded, restore),
		leftPadAt = state.leftPadAt,
		seat = true,
	})
	notify(player, { kind = "repaired", n = restore })
	return true
end

-- Aplica mejoras o pases nuevos: si el camión está vacío y quieto, se cambia ya; si no, en la próxima aparición.
function TruckService.refresh(player: Player)
	local state = trucks[player]
	if not state then
		return
	end
	if state.busy or state.eggCount > 0 then
		local hasBig = player:GetAttribute("Pass_BigTruck") == true
		state.capacity = math.max(
			state.capacity,
			Economy.truckCapacity(DataService.getLevel(player, "Capacity"), hasBig, Config.Truck)
		)
		updateAttributes(state)
		return
	end
	local seated = state.parts.seat.Occupant ~= nil
	local chassis = state.parts.chassis
	local offset = (chassis.Position - state.plot.padPosition) * Vector3.new(1, 0, 1)
	local at: CFrame? = nil
	if offset.Magnitude > 10 and chassis.Position.Y > -20 then
		local position = chassis.Position + Vector3.new(0, 3, 0)
		at = CFrame.lookAt(position, position + Vector3.new(1, 0, 0))
	end
	spawnTruck(player, { at = at, seat = seated, leftPadAt = state.leftPadAt })
end

-- Pinta el camión actual con la pintura puesta del jugador (los camiones nuevos ya salen pintados).
function TruckService.applyPaint(player: Player)
	local state = trucks[player]
	if state then
		local color, material = paintStyle(player)
		TruckBuilder.applyPaint(state.parts, color, material)
	end
end

function TruckService.cleanup(player: Player)
	local state = trucks[player]
	if state then
		trucks[player] = nil
		destroyTruck(state)
	end
	player:SetAttribute("EggsInBed", nil)
end

local accumulator = 0

-- Revisa cada camión: caídas del mundo, salida de la parcela, huevos que se salen y llegada al mercado.
local function stepTrucks(w: WorldBuilder.World)
	for player, state in trucks do
		if state.busy then
			continue
		end
		local chassis = state.parts.chassis
		if not chassis.Parent then
			continue
		end
		local position = chassis.Position
		if position.Y < -40 then
			-- se cayó del mundo: los huevos se pierden
			state.broken += state.eggCount
			clearEggs(state)
			spawnTruck(player, { seat = humanoidOf(player) ~= nil })
			continue
		end
		if state.leftPadAt == nil and position.X > 0 then
			state.leftPadAt = os.clock()
		end
		-- huevos que salieron volando de la caja
		for egg in state.eggs do
			if not egg.Parent or not insideBed(state, egg.Position, 3) then
				breakEgg(state, egg)
			end
		end
		if position.X >= w.marketStartX + 4 and position.Y < w.marketTopY + 12 then
			deliver(state, w)
		end
	end
end

function TruckService.start()
	RunService.Heartbeat:Connect(function(dt)
		accumulator += dt
		if accumulator < 0.1 then
			return
		end
		accumulator = 0
		local w = world
		if w then
			stepTrucks(w)
		end
	end)
end

return TruckService
