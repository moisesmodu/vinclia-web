--!strict
-- El cohete de cada parcela, los asteroides que flotan encima y sus cristales.
-- * Asteroides: rocas fijas repartidas con Crystals.layout (semilla por parcela), siempre al alcance del cohete.
-- * Cohete: modelo de bloques con un VehicleSeat. Al subir el dueño, el servidor le da la propiedad de red y el
--   cliente lo pilota con LinearVelocity (física de Roblox); AlignOrientation lo mantiene derecho. Si se queda
--   vacío unos segundos, vuelve solo a su plataforma. Nadie más que el dueño puede sentarse.
-- * Cristales: el cliente pide recogerlos; el servidor valida (Crystals.validatePickup) que el cristal está, es de
--   tu parcela, estás cerca, no vas demasiado rápido y no recoges dos a la vez. Vuelven a salir a los 40 s.
-- * Lluvia de meteoritos (producto): cristales extra que caen en el patio de tu parcela durante 90 s.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Crystals = require(ReplicatedStorage.Shared.Crystals)
local Rng = require(ReplicatedStorage.Shared.Rng)
local Rocket = require(ReplicatedStorage.Shared.Rocket)
local DataService = require(script.Parent.DataService)
local PlotService = require(script.Parent.PlotService)
local WorldBuilder = require(script.Parent.WorldBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type CrystalState = {
	id: string,
	plot: PlotService.Plot,
	part: Part,
	kind: number,
	active: boolean,
	shower: boolean,
	position: Vector3,
}

type RocketState = {
	plot: PlotService.Plot,
	owner: Player,
	model: Model,
	body: Part,
	seat: VehicleSeat,
	thrust: LinearVelocity,
	vacantToken: number,
}

type PickupState = { at: number, position: Vector3 }

local RocketService = {}

local C = WorldBuilder.Colors

local crystals: { [string]: CrystalState } = {}
local asteroidPoints: { [number]: { Crystals.Point } } = {}
local rockets: { [PlotService.Plot]: RocketState } = {}
local pickups: { [Player]: PickupState } = {}
local nextCrystal = 0
local random = Random.new()

local weights: { number } = {}
for i, kind in Config.CrystalKinds do
	weights[i] = kind.weight
end

local function reach(horizontal: number, height: number): boolean
	return Rocket.canReach(Config.Rocket, horizontal, height)
end

local function padCenter(plot: PlotService.Plot): CFrame
	return PlotService.cf(plot, Config.Plot.rocketPad[1], 0.8, Config.Plot.rocketPad[2])
end

-- ASTEROIDES ----------------------------------------------------------------------------------------------

local function buildAsteroids(plot: PlotService.Plot, parent: Instance)
	local a = Config.Asteroids
	local area: Crystals.Area = {
		usable = Config.Plot.usable,
		padX = Config.Plot.rocketPad[1],
		padZ = Config.Plot.rocketPad[2],
		maxRange = Config.Rocket.maxRange,
	}
	local points = Crystals.layout(Rng.new(a.seed + plot.index).next, a, area, reach)
	asteroidPoints[plot.index] = points
	local rng = Rng.new(a.seed * 7 + plot.index)
	for i, p in points do
		local model = Instance.new("Model")
		model.Name = "Asteroid" .. i
		local center = PlotService.cf(plot, p.x, p.y, p.z)
		local rock = WorldBuilder.part(
			model,
			"Rock",
			Vector3.new(a.radius * 2, a.radius * 1.2, a.radius * 2),
			center * CFrame.Angles(0, rng.next() * math.pi, 0),
			C.moonDark,
			Enum.Material.Slate
		)
		rock:AddTag("Ground")
		-- bultos para que no parezca una caja
		for k = 1, 3 do
			local bump = WorldBuilder.part(
				model,
				"Bump",
				Vector3.new(a.radius * 1.2, a.radius * 0.9, a.radius * 1.2),
				center
					* CFrame.new((rng.next() - 0.5) * a.radius, -a.radius * 0.4, (rng.next() - 0.5) * a.radius)
					* CFrame.Angles(rng.next() * 2, rng.next() * 2, rng.next() * 2),
				if k % 2 == 0 then C.moon else C.moonDark,
				Enum.Material.Slate
			)
			bump.CanCollide = false
		end
		model.Parent = parent
	end
end

function RocketService.buildAsteroids()
	local folder = Instance.new("Folder")
	folder.Name = "Asteroids"
	for _, plot in PlotService.all() do
		local sub = Instance.new("Folder")
		sub.Name = "Plot" .. plot.index
		buildAsteroids(plot, sub)
		sub.Parent = folder
	end
	folder.Parent = Workspace
end

-- CRISTALES -----------------------------------------------------------------------------------------------

local function crystalColor(kind: number): Color3
	local def = Config.CrystalKinds[kind]
	return if def then WorldBuilder.rgb(def.color) else C.sky
end

local function makeCrystal(plot: PlotService.Plot, position: Vector3, shower: boolean): CrystalState
	nextCrystal += 1
	local id = "c" .. nextCrystal
	local kind = Crystals.rollKind(weights, random:NextNumber())
	local part = Instance.new("Part")
	part.Name = id
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.CastShadow = false
	part.Size = Vector3.new(1.6, 2.6, 1.6)
	part.CFrame = CFrame.new(position) * CFrame.Angles(0, math.rad(45), math.rad(20))
	part.Color = crystalColor(kind)
	part.Material = Enum.Material.Neon
	part:SetAttribute("Kind", kind)
	local light = Instance.new("PointLight")
	light.Color = part.Color
	light.Range = 10
	light.Brightness = 1.5
	light.Parent = part
	part.Parent = plot.crystals
	local state: CrystalState = {
		id = id,
		plot = plot,
		part = part,
		kind = kind,
		active = true,
		shower = shower,
		position = position,
	}
	crystals[id] = state
	return state
end

local function removeCrystal(state: CrystalState)
	state.active = false
	crystals[state.id] = nil
	state.part:Destroy()
end

local function clearPlotCrystals(plot: PlotService.Plot)
	for _, state in crystals do
		if state.plot == plot then
			removeCrystal(state)
		end
	end
end

-- Pone un cristal encima de cada asteroide de la parcela.
local function fillAsteroids(plot: PlotService.Plot)
	local points = asteroidPoints[plot.index]
	if points then
		for _, p in points do
			local top = p.y + Config.Asteroids.radius * 0.6 + 1.6
			makeCrystal(plot, PlotService.point(plot, p.x, top, p.z), false)
		end
	end
end

local function hideAndRespawn(state: CrystalState)
	state.active = false
	if state.shower then
		removeCrystal(state)
	else
		state.part.Transparency = 1
		local light = state.part:FindFirstChildOfClass("PointLight")
		if light then
			light.Enabled = false
		end
		task.delay(Config.Crystals.respawnSeconds, function()
			if crystals[state.id] == state and state.plot.owner ~= nil then
				state.kind = Crystals.rollKind(weights, random:NextNumber())
				state.part.Color = crystalColor(state.kind)
				state.part:SetAttribute("Kind", state.kind)
				state.part.Transparency = 0
				local l = state.part:FindFirstChildOfClass("PointLight")
				if l then
					l.Color = state.part.Color
					l.Enabled = true
				end
				state.active = true
			end
		end)
	end
end

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

-- Petición del cliente: recoger el cristal `id`.
function RocketService.collect(player: Player, id: string)
	local state = crystals[id]
	local root = rootOf(player)
	local session = DataService.get(player)
	if state and root and session then
		local now = os.clock()
		local last = pickups[player]
		local position = root.Position
		local result = Crystals.validatePickup({
			active = state.active,
			owner = state.plot.owner == player,
			distance = (position - state.part.Position).Magnitude,
			now = now,
			lastPickupAt = if last then last.at else 0,
			travelled = if last then (position - last.position).Magnitude else 0,
			maxSpeed = Rocket.maxSpeed(Config.Rocket, player:GetAttribute("Pass_FasterRocket") == true),
		}, Config.Crystals)
		if result == "ok" then
			pickups[player] = { at = now, position = position }
			local value = Config.CrystalKinds[state.kind].value
			session.data.crystals += value
			DataService.touch(player)
			Notify:FireClient(player, { kind = "crystal", value = value, crystal = state.kind })
			hideAndRespawn(state)
		end
	end
end

-- PRODUCTO: lluvia de meteoritos en la parcela del jugador.
function RocketService.meteorShower(player: Player)
	local plot = PlotService.get(player)
	if plot then
		local s = Config.MeteorShower
		local points = Crystals.showerLayout(Rng.new(s.seed + random:NextInteger(1, 100000)).next, s)
		local showerStates: { CrystalState } = {}
		for i, p in points do
			local target = PlotService.point(plot, p.x, p.y, p.z)
			local state = makeCrystal(plot, target + Vector3.new(0, 80, 0), true)
			state.active = false
			state.position = target
			table.insert(showerStates, state)
			task.delay(i * 0.12, function()
				if crystals[state.id] == state then
					local fall = TweenService:Create(
						state.part,
						TweenInfo.new(1.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
						{ CFrame = CFrame.new(target) * CFrame.Angles(0, math.rad(45), math.rad(20)) }
					)
					fall:Play()
					fall.Completed:Wait()
					if crystals[state.id] == state then
						state.active = true
					end
				end
			end)
		end
		player:SetAttribute("ShowerUntil", Workspace:GetServerTimeNow() + s.duration)
		task.delay(s.duration, function()
			for _, state in showerStates do
				if crystals[state.id] == state then
					removeCrystal(state)
				end
			end
		end)
	end
end

-- COHETE --------------------------------------------------------------------------------------------------

local function weld(a: BasePart, b: BasePart)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = a
end

local function decorPart(model: Model, body: Part, name: string, size: Vector3, cframe: CFrame, color: Color3): Part
	local part = WorldBuilder.part(model, name, size, cframe, color)
	part.Anchored = false
	part.CanCollide = false
	part.Massless = true
	weld(body, part)
	return part
end

local function buildRocket(plot: PlotService.Plot, owner: Player): RocketState
	local base = padCenter(plot) * CFrame.new(0, 3.4, 0)
	local model = Instance.new("Model")
	model.Name = "Rocket"

	local body = WorldBuilder.part(model, "Body", Vector3.new(3, 5.6, 3), base, C.cloud)
	body.Anchored = true
	body.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.3, 0.1)
	model.PrimaryPart = body

	decorPart(model, body, "Stripe", Vector3.new(3.1, 0.8, 3.1), base * CFrame.new(0, 0.6, 0), C.red)
	local window = decorPart(model, body, "Window", Vector3.new(1.6, 1.6, 0.3), base * CFrame.new(0, 1.6, -1.55), C.sky)
	window.Material = Enum.Material.Neon
	local nose = WorldBuilder.wedge(model, "Nose", Vector3.new(3, 2, 1.5), base * CFrame.new(0, 3.8, -0.75), C.red)
	nose.Anchored = false
	nose.CanCollide = false
	nose.Massless = true
	weld(body, nose)
	for i = 0, 3 do
		local angle = i * math.pi / 2 + math.pi / 4
		decorPart(
			model,
			body,
			"Fin",
			Vector3.new(0.4, 2.4, 2),
			base * CFrame.Angles(0, angle, 0) * CFrame.new(0, -2.2, 2),
			C.sun
		)
	end
	local flame = decorPart(model, body, "Flame", Vector3.new(1.6, 1.8, 1.6), base * CFrame.new(0, -3.6, 0), C.sun)
	flame.Material = Enum.Material.Neon
	flame.Transparency = 1
	local fire = Instance.new("Fire")
	fire.Enabled = false
	fire.Size = 4
	fire.Heat = -12
	fire.Color = Color3.fromRGB(255, 160, 60)
	fire.SecondaryColor = C.sun
	fire.Parent = flame

	-- asiento detrás del morro (media parte delantera): el jugador va montado encima del cohete
	local seat = Instance.new("VehicleSeat")
	seat.Name = "Seat"
	seat.Size = Vector3.new(2, 0.6, 2)
	seat.CFrame = base * CFrame.new(0, 3.1, 0.75)
	seat.Color = C.ink
	seat.Anchored = false
	seat.Massless = true
	seat.CanCollide = false
	seat.MaxSpeed = 0
	seat.Torque = 0
	seat.HeadsUpDisplay = false
	seat:SetAttribute("RocketSeat", true)
	seat.Parent = model
	weld(body, seat)

	local attachment = Instance.new("Attachment")
	attachment.Name = "Root"
	attachment.Parent = body
	local thrust = Instance.new("LinearVelocity")
	thrust.Name = "Thrust"
	thrust.Attachment0 = attachment
	thrust.RelativeTo = Enum.ActuatorRelativeTo.World
	thrust.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
	thrust.MaxForce = 200000
	thrust.VectorVelocity = Vector3.zero
	thrust.Parent = body
	local upright = Instance.new("AlignOrientation")
	upright.Name = "Upright"
	upright.Mode = Enum.OrientationAlignmentMode.OneAttachment
	upright.Attachment0 = attachment
	upright.MaxTorque = 200000
	upright.Responsiveness = 25
	upright.CFrame = CFrame.new()
	upright.Parent = body

	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "BoardPrompt"
	prompt.ActionText = "🚀"
	prompt.ObjectText = ""
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.Parent = body

	local pad = padCenter(plot).Position
	model:SetAttribute("Owner", owner.UserId)
	model:SetAttribute("Pad", pad)
	model:SetAttribute("Plot", plot.index)
	model.Parent = plot.items

	return {
		plot = plot,
		owner = owner,
		model = model,
		body = body,
		seat = seat,
		thrust = thrust,
		vacantToken = 0,
	}
end

local function eject(seat: VehicleSeat)
	local seatWeld = seat:FindFirstChild("SeatWeld")
	if seatWeld then
		seatWeld:Destroy()
	end
end

-- Devuelve el cohete a su plataforma, quieto y anclado.
local function resetRocket(state: RocketState)
	eject(state.seat)
	state.thrust.VectorVelocity = Vector3.zero
	state.body.Anchored = true
	state.body.AssemblyLinearVelocity = Vector3.zero
	state.body.AssemblyAngularVelocity = Vector3.zero
	state.model:PivotTo(padCenter(state.plot) * CFrame.new(0, 3.4, 0))
end

local function onOccupant(state: RocketState)
	local occupant = state.seat.Occupant
	state.vacantToken += 1
	if occupant then
		local rider = Players:GetPlayerFromCharacter(occupant.Parent)
		if rider == state.owner then
			state.body.Anchored = false
			pcall(function()
				state.body:SetNetworkOwner(state.owner)
			end)
		else
			eject(state.seat)
		end
	else
		local token = state.vacantToken
		task.delay(Config.Rocket.resetDelay, function()
			if state.vacantToken == token and rockets[state.plot] == state and state.seat.Occupant == nil then
				resetRocket(state)
			end
		end)
	end
end

-- Crea el cohete de la parcela (al comprar la plataforma o al entrar con ella ya comprada).
function RocketService.spawnRocket(plot: PlotService.Plot, owner: Player)
	if rockets[plot] == nil then
		local state = buildRocket(plot, owner)
		rockets[plot] = state
		state.seat:GetPropertyChangedSignal("Occupant"):Connect(function()
			onOccupant(state)
		end)
		local prompt = state.body:FindFirstChild("BoardPrompt")
		if prompt and prompt:IsA("ProximityPrompt") then
			prompt.Triggered:Connect(function(player: Player)
				local character = player.Character
				local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
				if player == state.owner and humanoid and state.seat.Occupant == nil and humanoid.Health > 0 then
					state.seat:Sit(humanoid)
				end
			end)
		end
	end
end

function RocketService.despawnRocket(plot: PlotService.Plot)
	local state = rockets[plot]
	if state then
		rockets[plot] = nil
		eject(state.seat)
		state.model:Destroy()
	end
end

-- Al recibir el dueño la parcela: cristales en los asteroides.
function RocketService.setupPlot(plot: PlotService.Plot)
	clearPlotCrystals(plot)
	fillAsteroids(plot)
end

function RocketService.cleanup(player: Player, plot: PlotService.Plot?)
	pickups[player] = nil
	if plot then
		RocketService.despawnRocket(plot)
		clearPlotCrystals(plot)
	end
end

-- Al reaparecer, el punto de la última recogida ya no sirve para medir el viaje.
function RocketService.resetPickup(player: Player)
	pickups[player] = nil
end

-- Vigilancia: un cohete muy fuera de su zona de vuelo (o cuyo piloto se fue) vuelve a la plataforma.
function RocketService.start()
	task.spawn(function()
		while true do
			task.wait(1)
			for plot, state in rockets do
				if not state.body.Anchored then
					local pad = padCenter(plot).Position
					local offset = state.body.Position - pad
					local horizontal = Vector3.new(offset.X, 0, offset.Z).Magnitude
					if horizontal > Config.Rocket.maxRange + 25 or offset.Y > Config.Rocket.maxAltitude + 30 then
						resetRocket(state)
					end
				end
			end
		end
	end)
end

return RocketService
