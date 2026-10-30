--!strict
-- Fases, checkpoints y todo lo del jugador en la torre. El servidor decide; el cliente solo pide.
-- * Checkpoints: tocar el checkpoint k + 1 estando en k (con el personaje de verdad encima y tras un tiempo mínimo
--   creíble) avanza la fase, da monedas y guarda. Cualquier otro (saltarse uno, volver atrás) no hace nada.
-- * Teletransportes: cada medio segundo se compara la posición con la anterior; un salto imposible te devuelve a tu
--   checkpoint. Caer muy por debajo de tu checkpoint o tocar baba, también (sin daño).
-- * La cima (checkpoint N + 1): +1 trofeo de cima, monedas extra e insignia opcional. Desde ahí, «Reiniciar torre».
-- * Bobinas (pases): herramientas; mientras las tienes en la mano cambian WalkSpeed / JumpHeight en el servidor.
-- * Estelas, premio diario con racha y el multiplicador de monedas de los reinicios.

local BadgeService = game:GetService("BadgeService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Checkpoint = require(ReplicatedStorage.Shared.Checkpoint)
local Config = require(ReplicatedStorage.Shared.Config)
local Daily = require(ReplicatedStorage.Shared.Daily)
local Rewards = require(ReplicatedStorage.Shared.Rewards)
local Stages = require(ReplicatedStorage.Shared.Stages)
local DataService = require(script.Parent.DataService)
local TowerBuilder = require(script.Parent.TowerBuilder)

local Notify = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("Notify") :: RemoteEvent

type Tracker = {
	reachedAt: number, -- os.clock() al llegar al checkpoint actual
	lastPosition: Vector3?,
	lastAt: number,
	returning: boolean,
}

local StageService = {}

local STAGES = Config.Tower.stages
local tower: Stages.Tower? = nil
local trackers: { [Player]: Tracker } = {}

local function notify(player: Player, payload: { [string]: any })
	Notify:FireClient(player, payload)
end

local function multiplierOf(data: DataService.PlayerData): number
	return Rewards.multiplier(data.restarts, Config.Restart)
end

local function trackerOf(player: Player): Tracker
	local existing = trackers[player]
	if existing then
		return existing
	end
	local tracker: Tracker = { reachedAt = os.clock(), lastPosition = nil, lastAt = os.clock(), returning = false }
	trackers[player] = tracker
	return tracker
end

local function checkpointPosition(stage: number): Vector3
	local current = tower
	if current then
		local point = current.checkpoints[math.clamp(stage, 1, #current.checkpoints)]
		return Vector3.new(point[1], point[2], point[3])
	end
	return Vector3.new(0, 10, 0)
end

-- De pie en el checkpoint, mirando hacia el camino de su fase (en la cima, hacia la columna).
local function checkpointCFrame(stage: number): CFrame
	local position = checkpointPosition(stage) + Vector3.new(0, 3.5, 0)
	if stage > STAGES then
		return CFrame.lookAt(position, Vector3.new(0, position.Y, 0))
	end
	local heading = (stage - 1) % 4
	local cx, cz = Stages.corner(heading, Config.Tower.side)
	local nx, nz = Stages.corner(heading + 1, Config.Tower.side)
	return CFrame.lookAt(position, position + Vector3.new(nx - cx, 0, nz - cz))
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

local function moveTo(player: Player, root: BasePart, stage: number)
	local character = player.Character
	if character then
		root.AssemblyLinearVelocity = Vector3.zero
		character:PivotTo(checkpointCFrame(stage))
		local tracker = trackerOf(player)
		tracker.lastPosition = root.Position
		tracker.lastAt = os.clock()
	end
end

-- Lleva al jugador a su checkpoint (al aparecer, tras saltar fase o reiniciar).
local function teleport(player: Player)
	local session = DataService.get(player)
	local root = rootOf(player)
	if session and root then
		moveTo(player, root, session.data.stage)
	end
end

-- Igual, pero sin repetirse en ráfaga (baba, caídas y teletransportes rechazados).
function StageService.returnToCheckpoint(player: Player)
	local tracker = trackerOf(player)
	if not tracker.returning then
		tracker.returning = true
		teleport(player)
		task.delay(0.3, function()
			tracker.returning = false
		end)
	end
end

-- Después de que MonetizationService haya guardado la fase nueva.
function StageService.afterSkip(player: Player)
	local session = DataService.get(player)
	if session then
		trackerOf(player).reachedAt = os.clock()
		DataService.touch(player)
		teleport(player)
		notify(player, { kind = "skip", stage = session.data.stage })
	end
end

local function finish(player: Player, session: DataService.Session)
	local data = session.data
	data.completions += 1
	local coins = Rewards.finishCoins(multiplierOf(data), Config.Rewards)
	DataService.addCoins(player, coins)
	notify(player, { kind = "finish", coins = coins, completions = data.completions })
	local badgeId = Config.FinishBadgeId
	if badgeId ~= 0 then
		task.spawn(function()
			local ok, err = pcall(function()
				BadgeService:AwardBadge(player.UserId, badgeId)
			end)
			if not ok then
				warn("[StageService] no se pudo dar la insignia:", err)
			end
		end)
	end
end

-- El personaje ha tocado el checkpoint `index`.
function StageService.touchCheckpoint(player: Player, index: number)
	local session = DataService.get(player)
	local root = rootOf(player)
	local current = tower
	if session and root and current then
		local data = session.data
		-- el mismo, uno anterior o uno lejano: Checkpoint.reach lo rechaza (sin aviso, para no llenar la pantalla)
		local near = (root.Position - checkpointPosition(index)).Magnitude <= Config.AntiCheat.touchDistance
		local tracker = trackerOf(player)
		local a = Config.AntiCheat
		local stageData = current.stages[math.clamp(data.stage, 1, STAGES)]
		local minSeconds = Checkpoint.minSeconds(stageData.pathLength, a.maxPlausibleSpeed, a.minTimeSlack)
		local result = Checkpoint.reach(data.stage, index, STAGES, os.clock() - tracker.reachedAt, minSeconds)
		if result == "ok" and near then
			data.stage = index
			data.best = math.max(data.best, index)
			tracker.reachedAt = os.clock()
			local coins = Rewards.stageCoins(index, multiplierOf(data), Config.Rewards)
			DataService.addCoins(player, coins)
			if index == Checkpoint.finish(STAGES) then
				finish(player, session)
			else
				notify(player, { kind = "checkpoint", stage = index, coins = coins })
			end
			DataService.touch(player)
			if index == Checkpoint.finish(STAGES) then
				task.spawn(DataService.save, player)
			end
		elseif result == "early" then
			warn("[StageService] checkpoint demasiado pronto, se ignora:", player.UserId, index)
		end
	end
end

function StageService.restart(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		if Checkpoint.canRestart(data.stage, STAGES) and Rewards.canRestart(data.restarts, Config.Restart) then
			data.stage = 1
			data.restarts += 1
			trackerOf(player).reachedAt = os.clock()
			DataService.touch(player)
			teleport(player)
			notify(player, { kind = "restart", restarts = data.restarts, multiplier = multiplierOf(data) })
			task.spawn(DataService.save, player)
		end
	end
end

-- BOBINAS
local function makeCoil(name: string, color: Color3): Tool
	local tool = Instance.new("Tool")
	tool.Name = name
	tool.CanBeDropped = false
	tool:SetAttribute("Coil", name)
	tool.GripPos = Vector3.new(0, -0.6, 0)
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Shape = Enum.PartType.Cylinder
	handle.Size = Vector3.new(2.2, 1.2, 1.2)
	handle.Color = color
	handle.Material = Enum.Material.Neon
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool
	return tool
end

local COILS = {
	{ pass = "SpeedCoil", color = TowerBuilder.Colors.sun },
	{ pass = "GravityCoil", color = TowerBuilder.Colors.sky },
}

-- Recalcula velocidad y salto según la bobina que tenga en la mano (y que el pase sea suyo).
local function applyCoils(player: Player, character: Model)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		local speed = false
		local gravity = false
		for _, child in character:GetChildren() do
			if child:IsA("Tool") then
				local coil = child:GetAttribute("Coil")
				if coil == "SpeedCoil" and player:GetAttribute("Pass_SpeedCoil") == true then
					speed = true
				elseif coil == "GravityCoil" and player:GetAttribute("Pass_GravityCoil") == true then
					gravity = true
				end
			end
		end
		humanoid.UseJumpPower = false
		humanoid.WalkSpeed = if speed then Config.Coils.speedWalkSpeed else Config.Physics.walkSpeed
		humanoid.JumpHeight = if gravity then Config.Coils.gravityJumpHeight else Config.Physics.jumpHeight
	end
end

-- Da las bobinas de los pases que tenga: una en StarterGear (Roblox la copia a la mochila cada vez que reaparece)
-- y, la primera vez, otra directamente en la mochila.
function StageService.giveCoils(player: Player)
	local backpack = player:FindFirstChildOfClass("Backpack")
	local gear = player:FindFirstChild("StarterGear")
	for _, coil in COILS do
		if player:GetAttribute("Pass_" .. coil.pass) == true and gear and gear:FindFirstChild(coil.pass) == nil then
			local saved = makeCoil(coil.pass, coil.color)
			saved.Parent = gear
			local character = player.Character
			local held = if character then character:FindFirstChild(coil.pass) else nil
			if backpack and held == nil and backpack:FindFirstChild(coil.pass) == nil then
				local now = makeCoil(coil.pass, coil.color)
				now.Parent = backpack
			end
		end
	end
end

-- ESTELAS
local function trailDef(id: string): Config.TrailDef?
	for _, def in Config.Trails do
		if def.id == id then
			return def
		end
	end
	return nil
end

local function owns(data: DataService.PlayerData, id: string): boolean
	return table.find(data.trails, id) ~= nil
end

local function attachTrail(root: BasePart, def: Config.TrailDef)
	local top = Instance.new("Attachment")
	top.Name = "TrailTop"
	top.Position = Vector3.new(0, 0.9, 0)
	top.Parent = root
	local bottom = Instance.new("Attachment")
	bottom.Name = "TrailBottom"
	bottom.Position = Vector3.new(0, -0.9, 0)
	bottom.Parent = root
	local keypoints: { ColorSequenceKeypoint } = {}
	for i, color in def.colors do
		local time = if #def.colors > 1 then (i - 1) / (#def.colors - 1) else 0
		table.insert(keypoints, ColorSequenceKeypoint.new(time, Color3.fromRGB(color[1], color[2], color[3])))
	end
	local trail = Instance.new("Trail")
	trail.Name = "JellyTrail"
	trail.Attachment0 = top
	trail.Attachment1 = bottom
	trail.Color = ColorSequence.new(keypoints)
	trail.Lifetime = 0.6
	trail.LightEmission = 0.4
	trail.Transparency = NumberSequence.new(0.1, 1)
	trail.Parent = root
end

-- Pone en el personaje la estela elegida (si la puede llevar) y quita la anterior.
function StageService.refreshTrail(player: Player)
	local session = DataService.get(player)
	local root = rootOf(player)
	if session and root then
		for _, name in { "JellyTrail", "TrailTop", "TrailBottom" } do
			local old = root:FindFirstChild(name)
			if old then
				old:Destroy()
			end
		end
		local def = trailDef(session.data.trail)
		if def then
			local allowed = if def.premium
				then player:GetAttribute("Pass_TrailPack") == true
				else owns(session.data, def.id)
			if allowed then
				attachTrail(root, def)
			end
		end
	end
end

function StageService.pressTrail(player: Player, id: string)
	local session = DataService.get(player)
	local def = trailDef(id)
	if session and def then
		local data = session.data
		local action = Rewards.trailAction(
			def.price,
			def.premium,
			owns(data, def.id),
			data.trail == def.id,
			data.coins,
			player:GetAttribute("Pass_TrailPack") == true
		)
		if action == "unequip" then
			data.trail = ""
		elseif action == "equip" then
			data.trail = def.id
		elseif action == "buy" then
			if DataService.trySpend(player, def.price) then
				table.insert(data.trails, def.id)
				data.trail = def.id
				task.spawn(DataService.save, player)
			end
		elseif action == "nomoney" then
			notify(player, { kind = "nomoney", price = def.price })
		else
			notify(player, { kind = "needpass" })
		end
		DataService.touch(player)
		StageService.refreshTrail(player)
	end
end

-- PREMIO DIARIO
local function today(): number
	return Daily.dayNumber(os.time())
end

local function updateDaily(player: Player)
	local session = DataService.get(player)
	if session then
		player:SetAttribute("DailyReady", Daily.canClaim(session.data.dailyDay, today()))
	end
end

function StageService.claimDaily(player: Player)
	local session = DataService.get(player)
	if session then
		local day = today()
		local ok, streak = Daily.claim(session.data.dailyDay, session.data.dailyStreak, day, Config.Daily.maxStreak)
		if ok then
			local coins = Daily.reward(streak, Config.Daily, multiplierOf(session.data))
			session.data.dailyDay = day
			session.data.dailyStreak = streak
			DataService.addCoins(player, coins)
			notify(player, { kind = "daily", coins = coins, streak = streak })
		else
			notify(player, { kind = "daily_wait" })
		end
		updateDaily(player)
	end
end

-- PERSONAJE
local function setupCharacter(player: Player, character: Model)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if root and root:IsA("BasePart") and player.Character == character then
		task.wait() -- deja que Roblox termine de colocarlo en el SpawnLocation
		teleport(player)
		StageService.giveCoils(player)
		applyCoils(player, character)
		StageService.refreshTrail(player)
		character.ChildAdded:Connect(function()
			applyCoils(player, character)
		end)
		character.ChildRemoved:Connect(function()
			applyCoils(player, character)
		end)
	end
end

-- Con los datos ya cargados.
function StageService.onJoin(player: Player)
	trackerOf(player).reachedAt = os.clock()
	updateDaily(player)
	player.CharacterAdded:Connect(function(character: Model)
		setupCharacter(player, character)
	end)
	local character = player.Character
	if character then
		task.spawn(setupCharacter, player, character)
	end
end

function StageService.onLeave(player: Player)
	trackers[player] = nil
end

-- Comprueba un jugador: caídas y teletransportes.
local function inspect(player: Player, root: BasePart, stage: number, now: number)
	local tracker = trackerOf(player)
	local position = root.Position
	local last = tracker.lastPosition
	local suspicious = false
	if last then
		local delta = position - last
		suspicious = not Checkpoint.plausibleMove(delta.X, delta.Z, now - tracker.lastAt, Config.AntiCheat)
	end
	tracker.lastPosition = position
	tracker.lastAt = now
	if suspicious then
		warn("[StageService] movimiento imposible, vuelve al checkpoint:", player.UserId)
		StageService.returnToCheckpoint(player)
	elseif Checkpoint.fallen(position.Y, checkpointPosition(stage).Y, Config.AntiCheat.fallLimit) then
		StageService.returnToCheckpoint(player)
		notify(player, { kind = "fell" })
	end
end

function StageService.init(generated: Stages.Tower, built: TowerBuilder.Built)
	tower = generated
	for index, part in built.checkpoints do
		part.Touched:Connect(function(hit: BasePart)
			local model = hit:FindFirstAncestorOfClass("Model")
			local player = if model then Players:GetPlayerFromCharacter(model) else nil
			if player then
				StageService.touchCheckpoint(player, index)
			end
		end)
	end
end

function StageService.start()
	task.spawn(function()
		while true do
			task.wait(Config.AntiCheat.sampleInterval)
			local now = os.clock()
			for _, player in Players:GetPlayers() do
				local session = DataService.get(player)
				local root = rootOf(player)
				if session and root then
					inspect(player, root, session.data.stage, now)
				end
			end
		end
	end)
	-- a medianoche (UTC) el premio diario vuelve a estar listo sin tener que volver a entrar
	task.spawn(function()
		while true do
			task.wait(60)
			for _, player in Players:GetPlayers() do
				updateDaily(player)
			end
		end
	end)
end

return StageService
