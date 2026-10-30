--!strict
-- El quitanieves de cada jugador: un carrito con pala soldado delante del personaje (se mueve con los controles
-- normales de Roblox: teclado, mando o joystick del móvil). Todo lo que da nieve y monedas se decide aquí:
-- * cada Config.Snow.tickSeconds el servidor mira dónde está la pala de cada jugador y qué montones toca
--   (o tiene cerca, con el pase Imán); nunca recoge más de lo que cabe en la mochila;
-- * un movimiento imposible entre dos vistazos (teletransporte, velocidad) no recoge nada;
-- * en una zona sin abrir no se recoge y el jugador vuelve a la última zona abierta;
-- * en el depósito de su zona se descarga la mochila; con la mejora de descarga automática, al llenarse se
--   cobra una parte sin moverse.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Collection = require(ReplicatedStorage.Shared.Collection)
local Config = require(ReplicatedStorage.Shared.Config)
local Rebirth = require(ReplicatedStorage.Shared.Rebirth)
local Zones = require(ReplicatedStorage.Shared.Zones)
local DataService = require(script.Parent.DataService)
local SnowService = require(script.Parent.SnowService)
local WorldBuilder = require(script.Parent.WorldBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type State = {
	player: Player,
	capacity: number,
	bladeWidth: number,
	speed: number,
	autoRate: number,
	boost: number,
	doubleSnow: boolean,
	magnet: boolean,
	builtWidth: number, -- ancho de la pala del carrito que lleva puesto (0 = ninguno)
	lastPos: Vector3?,
	lastAt: number,
	fullAt: number, -- último aviso de mochila llena
	connections: { RBXScriptConnection },
}

local PlowService = {}

local states: { [Player]: State } = {}
local world: WorldBuilder.World? = nil

local C = WorldBuilder.Colors

local function rootOf(player: Player): BasePart?
	local character = player.Character
	if character then
		local root = character:FindFirstChild("HumanoidRootPart")
		if root and root:IsA("BasePart") then
			return root
		end
	end
	return nil
end

local function humanoidOf(player: Player): Humanoid?
	local character = player.Character
	if character then
		return character:FindFirstChildOfClass("Humanoid")
	end
	return nil
end

local function boolAttr(player: Player, name: string): boolean
	return player:GetAttribute(name) == true
end

-- Pieza del carrito: sin colisiones ni masa, soldada a la raíz del personaje.
local function piece(
	model: Model,
	root: BasePart,
	name: string,
	size: Vector3,
	offset: CFrame,
	color: Color3,
	material: Enum.Material?
): Part
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.CFrame = root.CFrame * offset
	part.Color = color
	part.Material = material or Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Anchored = false
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Massless = true
	part.CastShadow = true
	part.Parent = model
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = root
	weld.Part1 = part
	weld.Parent = part
	return part
end

-- Carrito quitanieves de bloques: cuerpo rojo, motor, manillar, cuatro ruedas, faro y la pala amarilla.
local function buildPlow(character: Model, root: BasePart, humanoid: Humanoid, bladeWidth: number)
	local old = character:FindFirstChild("Plow")
	if old then
		old:Destroy()
	end
	local model = Instance.new("Model")
	model.Name = "Plow"
	local floor = -(humanoid.HipHeight + root.Size.Y / 2) -- y del suelo respecto a la raíz
	local forward = Config.Plow.bladeForward
	piece(model, root, "Body", Vector3.new(2.6, 1.3, 2.2), CFrame.new(0, floor + 1.15, -forward + 1.5), C.red)
	piece(model, root, "Engine", Vector3.new(1.8, 0.8, 1.2), CFrame.new(0, floor + 2.2, -forward + 1.7), C.sky)
	piece(
		model,
		root,
		"Chimney",
		Vector3.new(0.3, 0.9, 0.3),
		CFrame.new(0.6, floor + 2.9, -forward + 1.9),
		C.ink,
		Enum.Material.Metal
	)
	for _, side in { -1, 1 } do
		piece(
			model,
			root,
			"Handle",
			Vector3.new(0.2, 0.2, 1.3),
			CFrame.new(side * 0.9, floor + 2.2, -forward + 2.35) * CFrame.Angles(math.rad(40), 0, 0),
			C.ink,
			Enum.Material.Metal
		)
		for _, z in { -forward + 0.9, -forward + 2.2 } do
			local wheel =
				piece(model, root, "Wheel", Vector3.new(0.4, 0.9, 0.9), CFrame.new(side * 1.4, floor + 0.45, z), C.ink)
			wheel.Shape = Enum.PartType.Cylinder
		end
	end
	piece(model, root, "Grip", Vector3.new(2.0, 0.25, 0.25), CFrame.new(0, floor + 2.6, -forward + 2.8), C.ink)
	local lamp =
		piece(model, root, "Lamp", Vector3.new(0.8, 0.4, 0.1), CFrame.new(0, floor + 2.2, -forward + 1.05), C.sun)
	lamp.Material = Enum.Material.Neon
	-- pala: crece con la mejora
	piece(
		model,
		root,
		"Blade",
		Vector3.new(bladeWidth, 1.3, 0.35),
		CFrame.new(0, floor + 0.75, -forward) * CFrame.Angles(math.rad(-12), 0, 0),
		C.sun,
		Enum.Material.Metal
	)
	piece(
		model,
		root,
		"BladeEdge",
		Vector3.new(bladeWidth + 0.2, 0.2, 0.5),
		CFrame.new(0, floor + 0.12, -forward - 0.1),
		C.ink,
		Enum.Material.Metal
	)
	piece(model, root, "BladeArm", Vector3.new(0.4, 0.4, 0.9), CFrame.new(0, floor + 0.9, -forward + 0.5), C.ink)
	model.Parent = character
end

local function rebuild(state: State)
	local character = state.player.Character
	local root = rootOf(state.player)
	local humanoid = humanoidOf(state.player)
	if character and root and humanoid then
		buildPlow(character, root, humanoid, state.bladeWidth)
		state.builtWidth = state.bladeWidth
		humanoid.WalkSpeed = state.speed
	end
end

-- Vuelve a calcular capacidad, pala, velocidad y bonus (tras una mejora, un pase, un compañero o renacer).
function PlowService.applyStats(player: Player)
	local state = states[player]
	local session = DataService.get(player)
	if state and session then
		local data = session.data
		local p = Config.Plow
		state.doubleSnow = boolAttr(player, "Pass_DoubleSnow")
		state.magnet = boolAttr(player, "Pass_AutoCollect")
		state.capacity = Collection.capacity(data.upgrades.Capacity or 0, boolAttr(player, "Pass_BigBackpack"), p)
		state.bladeWidth = Collection.bladeWidth(data.upgrades.Blade or 0, p)
		state.speed = Collection.walkSpeed(data.upgrades.Speed or 0, p)
		state.autoRate = Collection.autoUnloadRate(data.upgrades.AutoUnload or 0, p)
		local boost = player:GetAttribute("Boost")
		state.boost = if type(boost) == "number" then boost else 0
		player:SetAttribute("Capacity", state.capacity)
		player:SetAttribute("BladeWidth", state.bladeWidth)
		player:SetAttribute("AutoRate", state.autoRate)
		player:SetAttribute("Multiplier", Rebirth.multiplier(data.rebirths, Config.Rebirth.perRebirth))
		local humanoid = humanoidOf(player)
		if humanoid then
			humanoid.WalkSpeed = state.speed
		end
		if state.builtWidth ~= state.bladeWidth then
			rebuild(state)
		end
	end
end

local function zoneInfo(index: number): WorldBuilder.ZoneInfo?
	local w = world
	if w then
		return w.zones[index]
	end
	return nil
end

-- Lleva al jugador a la llegada de una zona (junto a su depósito), mirando hacia el centro.
local function moveTo(state: State, index: number)
	local info = zoneInfo(index)
	local character = state.player.Character
	if info and character then
		local target = info.arrival
		character:PivotTo(CFrame.lookAt(target, target + Vector3.new(1, 0, 0)))
		state.lastPos = target
		state.lastAt = os.clock()
	end
end

-- Teletransporte pedido desde la interfaz: solo a zonas abiertas.
function PlowService.teleport(player: Player, index: number): boolean
	local state = states[player]
	local session = DataService.get(player)
	if state and session and Zones.isAllowed(index, session.data.zones) then
		moveTo(state, index)
		return true
	end
	return false
end

local function unload(player: Player, data: DataService.PlayerData, rate: number, kind: string)
	local multiplier = Rebirth.multiplier(data.rebirths, Config.Rebirth.perRebirth)
	local coins = Collection.unloadCoins(data.snowValue, multiplier, rate)
	local units = data.snow
	data.coins += coins
	data.snow = 0
	data.snowValue = 0
	DataService.touch(player)
	Notify:FireClient(player, { kind = kind, coins = coins, snow = units })
end

-- Recoge los montones que toca la pala (o el imán). Devuelve si cambió algo.
local function collect(state: State, data: DataService.PlayerData, root: BasePart, zone: number): boolean
	local changed = false
	local zoneValue = Config.Zones[zone].value
	local blade = root.CFrame * CFrame.new(0, 0, -Config.Plow.bladeForward)
	local halfWidth = state.bladeWidth / 2
	local depth = Config.Plow.bladeDepth
	local position = root.Position
	for _, pile in SnowService.pilesIn(zone) do
		if data.snow >= state.capacity then
			break
		end
		if pile.active then
			local dx = pile.x - position.X
			local dz = pile.z - position.Z
			-- descarte rápido: lejos de todo
			if dx * dx + dz * dz < 900 then
				local spot = blade:PointToObjectSpace(Vector3.new(pile.x, blade.Position.Y, pile.z))
				local hit = Collection.inBlade(spot.X, spot.Z, halfWidth, depth, pile.radius)
					or (state.magnet and Collection.inMagnet(dx, dz, Config.Plow.magnetRadius))
				if hit then
					local units = Collection.take(pile.amount, data.snow, state.capacity)
					if units > 0 then
						data.snow += units
						data.totalSnow += units
						data.snowValue += Collection.snowValue(
							units,
							zoneValue,
							state.boost,
							state.doubleSnow,
							Config.Plow
						)
						SnowService.take(pile, units)
						changed = true
					end
				end
			end
		end
	end
	return changed
end

local function tick(state: State, root: BasePart)
	local player = state.player
	local session = DataService.get(player)
	if session then
		local data = session.data
		local position = root.Position
		local now = os.clock()
		local plausible = true
		local last = state.lastPos
		if last then
			local distance = Vector3.new(position.X - last.X, 0, position.Z - last.Z).Magnitude
			plausible = Collection.plausibleMove(
				distance,
				now - state.lastAt,
				state.speed,
				Config.AntiCheat.speedSlack,
				Config.AntiCheat.extraStuds
			)
		end
		state.lastPos = position
		state.lastAt = now

		local zone = Zones.indexAt(position.Z, Config.World, #Config.Zones)
		if not Zones.isAllowed(zone, data.zones) then
			moveTo(state, data.zones)
			Notify:FireClient(player, { kind = "locked", zone = zone })
		elseif plausible then
			local changed = collect(state, data, root, zone)
			local info = zoneInfo(zone)
			local full = Collection.isFull(data.snow, state.capacity)
			if info and data.snow > 0 then
				local d = info.depot
				local ddx = position.X - d.X
				local ddz = position.Z - d.Z
				if ddx * ddx + ddz * ddz <= Config.World.depotRadius * Config.World.depotRadius then
					unload(player, data, 1, "sold")
					changed = false
					full = false
				end
			end
			if full and state.autoRate > 0 then
				unload(player, data, state.autoRate, "autosold")
				changed = false
			elseif full and now - state.fullAt > 4 then
				state.fullAt = now
				Notify:FireClient(player, { kind = "full" })
			end
			if changed then
				DataService.touch(player)
			end
		end
	end
end

local function onCharacter(state: State, character: Model)
	state.builtWidth = 0
	state.lastPos = nil
	local root = character:WaitForChild("HumanoidRootPart", 10)
	local humanoid = character:WaitForChild("Humanoid", 10)
	if root and root:IsA("BasePart") and humanoid and humanoid:IsA("Humanoid") then
		task.wait(0.2) -- deja que el personaje se coloque en el punto de aparición
		if character.Parent ~= nil and states[state.player] == state then
			buildPlow(character, root, humanoid, state.bladeWidth)
			state.builtWidth = state.bladeWidth
			humanoid.WalkSpeed = state.speed
		end
	end
end

-- Al entrar (con los datos ya cargados).
function PlowService.setup(player: Player)
	local state: State = {
		player = player,
		capacity = Config.Plow.baseCapacity,
		bladeWidth = Config.Plow.baseBlade,
		speed = Config.Plow.baseSpeed,
		autoRate = 0,
		boost = 0,
		doubleSnow = false,
		magnet = false,
		builtWidth = 0,
		lastPos = nil,
		lastAt = os.clock(),
		fullAt = 0,
		connections = {},
	}
	states[player] = state
	PlowService.applyStats(player)
	table.insert(
		state.connections,
		player.CharacterAdded:Connect(function(character: Model)
			onCharacter(state, character)
		end)
	)
	local character = player.Character
	if character then
		task.spawn(onCharacter, state, character)
	end
end

function PlowService.cleanup(player: Player)
	local state = states[player]
	if state then
		for _, connection in state.connections do
			connection:Disconnect()
		end
		states[player] = nil
	end
end

function PlowService.init(builtWorld: WorldBuilder.World)
	world = builtWorld
end

function PlowService.start()
	task.spawn(function()
		while true do
			task.wait(Config.Snow.tickSeconds)
			for _, player in Players:GetPlayers() do
				local state = states[player]
				local root = rootOf(player)
				local humanoid = humanoidOf(player)
				if state and root and humanoid and humanoid.Health > 0 then
					tick(state, root)
				end
			end
		end
	end)
end

return PlowService
