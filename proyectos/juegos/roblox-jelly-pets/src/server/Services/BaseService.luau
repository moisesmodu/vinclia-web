--!strict
-- Bases: 8 parcelas, 4 a cada lado de la cinta, con la entrada mirando a la cinta. Cada base tiene 12 pedestales
-- (los activos dependen del pase «Más pedestales»), un botón de candado, un poste con la foto del dueño y una
-- barrera de campo de fuerza que se ve mientras el candado está puesto. Al entrar, cada jugador recibe la
-- primera libre; al salir se libera.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local StealLock = require(ReplicatedStorage.Shared.StealLock)
local DataService = require(script.Parent.DataService)
local WorldBuilder = require(script.Parent.WorldBuilder)

export type Base = {
	index: number,
	side: number, -- +1: lado z > 0, -1: lado z < 0
	centerX: number,
	model: Model,
	pads: { BasePart },
	padTops: { Vector3 },
	spawnCFrame: CFrame,
	lockPrompt: ProximityPrompt,
	barrier: { BasePart },
	ownerImage: ImageLabel,
	owner: Player?,
	lock: StealLock.LockState,
	lockToken: number,
	characterConnection: RBXScriptConnection?,
}

export type LockResult = "locked" | "wait" | "none"

local BaseService = {}

local WIDTH = 44 -- a lo largo de X
local DEPTH = 40 -- desde la entrada hasta el fondo
local NEAR = 18 -- distancia de la entrada a la cinta (z)
local SPACING = 54
local FLOOR_TOP = 0.6
local PAD_TOP = FLOOR_TOP + 0.5
local PAD_COLUMNS = { -15, -5, 5, 15 }
local PAD_ROWS = { 33, 24, 15 } -- del fondo a la entrada: los primeros pedestales quedan más lejos de la puerta

local FLOOR_COLORS = {
	Color3.fromRGB(255, 214, 232),
	Color3.fromRGB(214, 236, 255),
	Color3.fromRGB(255, 240, 200),
	Color3.fromRGB(220, 246, 222),
	Color3.fromRGB(232, 222, 255),
	Color3.fromRGB(255, 226, 210),
	Color3.fromRGB(210, 244, 244),
	Color3.fromRGB(246, 232, 214),
}

local bases: { Base } = {}
local byPlayer: { [Player]: Base } = {}

local function now(): number
	return Workspace:GetServerTimeNow()
end

-- Punto del mundo a `dx` del centro de la base y `d` studs hacia dentro desde la entrada.
local function at(side: number, centerX: number, dx: number, d: number, y: number): Vector3
	return Vector3.new(centerX + dx, y, side * (NEAR + d))
end

local function buildBase(parent: Folder, index: number): Base
	local c = WorldBuilder.Colors
	local side = if index <= Config.MaxPlayers / 2 then 1 else -1
	local column = (index - 1) % (Config.MaxPlayers / 2)
	local centerX = (column - 1.5) * SPACING
	local facing = Vector3.new(0, 0, -side) -- hacia la cinta

	local model = Instance.new("Model")
	model.Name = "Base" .. index
	model:SetAttribute("Index", index)
	model:SetAttribute("OwnerId", 0)
	model:SetAttribute("LockedUntil", 0)

	WorldBuilder.anchored(
		model,
		"Floor",
		Vector3.new(WIDTH, FLOOR_TOP, DEPTH),
		CFrame.new(at(side, centerX, 0, DEPTH / 2, FLOOR_TOP / 2)),
		FLOOR_COLORS[(index - 1) % #FLOOR_COLORS + 1]
	)
	-- muros bajos: fondo y lados (la entrada queda abierta)
	WorldBuilder.anchored(
		model,
		"Wall",
		Vector3.new(WIDTH, 2.4, 1),
		CFrame.new(at(side, centerX, 0, DEPTH - 0.5, FLOOR_TOP + 1.2)),
		c.cloud
	)
	for _, dx in { -WIDTH / 2 + 0.5, WIDTH / 2 - 0.5 } do
		WorldBuilder.anchored(
			model,
			"Wall",
			Vector3.new(1, 2.4, DEPTH),
			CFrame.new(at(side, centerX, dx, DEPTH / 2, FLOOR_TOP + 1.2)),
			c.cloud
		)
	end

	-- pedestales
	local pads: { BasePart } = {}
	local padTops: { Vector3 } = {}
	for _, d in PAD_ROWS do
		for _, dx in PAD_COLUMNS do
			local top = at(side, centerX, dx, d, PAD_TOP)
			local pad = WorldBuilder.anchored(
				model,
				"Pad" .. (#pads + 1),
				Vector3.new(0.5, 7, 7),
				CFrame.new(top - Vector3.new(0, 0.25, 0)) * CFrame.Angles(0, 0, math.pi / 2),
				c.grey
			)
			pad.Shape = Enum.PartType.Cylinder
			table.insert(pads, pad)
			table.insert(padTops, top)
		end
	end

	-- botón del candado (solo lo ve y lo usa el dueño)
	local button = WorldBuilder.anchored(
		model,
		"LockButton",
		Vector3.new(1, 5, 5),
		CFrame.new(at(side, centerX, -16, 5, FLOOR_TOP + 0.5)) * CFrame.Angles(0, 0, math.pi / 2),
		c.sun,
		Enum.Material.Neon
	)
	button.Shape = Enum.PartType.Cylinder
	local lockLabel = WorldBuilder.billboard(button, "🔒", UDim2.fromOffset(110, 50), 3.5)
	lockLabel.Name = "LockLabel"
	local lockPrompt = Instance.new("ProximityPrompt")
	lockPrompt.Name = "LockPrompt"
	lockPrompt.ActionText = "🔒"
	lockPrompt.ObjectText = ""
	lockPrompt.HoldDuration = 0
	lockPrompt.MaxActivationDistance = 10
	lockPrompt.RequiresLineOfSight = false
	lockPrompt.KeyboardKeyCode = Enum.KeyCode.E
	lockPrompt:SetAttribute("Audience", "owner")
	lockPrompt:SetAttribute("OwnerId", 0)
	lockPrompt.Parent = button

	-- poste con la foto del dueño
	local post = WorldBuilder.anchored(
		model,
		"OwnerPost",
		Vector3.new(0.6, 7, 0.6),
		CFrame.new(at(side, centerX, 16, 4, FLOOR_TOP + 3.5)),
		c.cloud
	)
	local gui = Instance.new("BillboardGui")
	gui.Name = "Owner"
	gui.Size = UDim2.fromOffset(90, 90)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 5.5, 0)
	gui.MaxDistance = 160
	gui.LightInfluence = 0
	gui.Adornee = post
	local ownerImage = Instance.new("ImageLabel")
	ownerImage.Size = UDim2.fromScale(1, 1)
	ownerImage.BackgroundColor3 = c.cloud
	ownerImage.Image = ""
	ownerImage.Visible = false
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0.5, 0)
	corner.Parent = ownerImage
	ownerImage.Parent = gui
	gui.Parent = post

	-- barrera del candado (solo visual: lo que impide llevarse gelatinas es el servidor)
	local barrier: { BasePart } = {}
	local height = 12
	local walls = {
		{ Vector3.new(WIDTH, height, 0.6), at(side, centerX, 0, 0, height / 2) },
		{ Vector3.new(WIDTH, height, 0.6), at(side, centerX, 0, DEPTH, height / 2) },
		{ Vector3.new(0.6, height, DEPTH), at(side, centerX, -WIDTH / 2, DEPTH / 2, height / 2) },
		{ Vector3.new(0.6, height, DEPTH), at(side, centerX, WIDTH / 2, DEPTH / 2, height / 2) },
	}
	for _, wall in walls do
		local part =
			WorldBuilder.anchored(model, "Barrier", wall[1], CFrame.new(wall[2]), c.sky, Enum.Material.ForceField)
		part.Transparency = 1
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.CastShadow = false
		table.insert(barrier, part)
	end

	model.Parent = parent

	local spawnPosition = at(side, centerX, 0, 8, FLOOR_TOP + 3)
	return {
		index = index,
		side = side,
		centerX = centerX,
		model = model,
		pads = pads,
		padTops = padTops,
		spawnCFrame = CFrame.lookAt(spawnPosition, spawnPosition + facing),
		lockPrompt = lockPrompt,
		barrier = barrier,
		ownerImage = ownerImage,
		owner = nil,
		lock = StealLock.newState(),
		lockToken = 0,
		characterConnection = nil,
	}
end

function BaseService.build()
	local folder = Instance.new("Folder")
	folder.Name = "Bases"
	for i = 1, Config.MaxPlayers do
		table.insert(bases, buildBase(folder, i))
	end
	folder.Parent = Workspace
end

local function placeCharacter(base: Base, character: Model)
	task.defer(function()
		if character.Parent then
			character:PivotTo(base.spawnCFrame)
		end
	end)
end

local function showBarrier(base: Base, visible: boolean)
	for _, part in base.barrier do
		part.Transparency = if visible then 0.55 else 1
	end
end

local function clearLock(base: Base)
	base.lock = StealLock.newState()
	base.lockToken += 1
	base.model:SetAttribute("LockedUntil", 0)
	showBarrier(base, false)
end

function BaseService.assign(player: Player): Base?
	local existing = byPlayer[player]
	if existing then
		return existing
	end
	for _, base in bases do
		if base.owner == nil then
			base.owner = player
			byPlayer[player] = base
			clearLock(base)
			base.model:SetAttribute("OwnerId", player.UserId)
			base.lockPrompt:SetAttribute("OwnerId", player.UserId)
			player:SetAttribute("Base", base.index)
			player:SetAttribute("LockedUntil", 0)
			player:SetAttribute("LockReadyAt", 0)

			task.spawn(function()
				local ok, image = pcall(function()
					return Players:GetUserThumbnailAsync(
						player.UserId,
						Enum.ThumbnailType.HeadShot,
						Enum.ThumbnailSize.Size100x100
					)
				end)
				if ok and base.owner == player then
					base.ownerImage.Image = image
					base.ownerImage.Visible = true
				end
			end)

			base.characterConnection = player.CharacterAdded:Connect(function(character)
				placeCharacter(base, character)
			end)
			if player.Character then
				placeCharacter(base, player.Character)
			end
			return base
		end
	end
	return nil
end

function BaseService.get(player: Player): Base?
	return byPlayer[player]
end

function BaseService.release(player: Player)
	local base = byPlayer[player]
	if base then
		byPlayer[player] = nil
		base.owner = nil
		clearLock(base)
		base.model:SetAttribute("OwnerId", 0)
		base.lockPrompt:SetAttribute("OwnerId", 0)
		base.ownerImage.Visible = false
		base.ownerImage.Image = ""
		BaseService.setPadCount(base, 0)
		local connection = base.characterConnection
		if connection then
			connection:Disconnect()
			base.characterConnection = nil
		end
	end
end

function BaseService.all(): { Base }
	return bases
end

-- Pinta los pedestales activos (1..count) y apaga el resto.
function BaseService.setPadCount(base: Base, count: number)
	for i, pad in base.pads do
		local active = i <= count
		pad.Color = if active then WorldBuilder.Colors.cloud else WorldBuilder.Colors.grey
		pad.Material = if active then Enum.Material.SmoothPlastic else Enum.Material.Slate
		pad.Transparency = if active then 0 else 0.4
	end
end

-- Dónde va el centro del cuerpo de una gelatina en el pedestal `pad`, mirando hacia la cinta.
function BaseService.padCFrame(base: Base, pad: number, height: number): CFrame
	local top = base.padTops[math.clamp(pad, 1, #base.padTops)]
	local position = top + Vector3.new(0, height, 0)
	return CFrame.lookAt(position, position + Vector3.new(0, 0, -base.side))
end

-- ¿Está `position` dentro de la base (con un poco de margen)?
function BaseService.contains(base: Base, position: Vector3): boolean
	local d = base.side * position.Z - NEAR
	return math.abs(position.X - base.centerX) <= WIDTH / 2 + 1 and d >= -1 and d <= DEPTH + 1
end

function BaseService.isLocked(player: Player): boolean
	local base = byPlayer[player]
	if base then
		return StealLock.isLocked(base.lock, now())
	end
	return false
end

-- Pulsa el candado de la base de `player`.
function BaseService.pressLock(player: Player): LockResult
	local base = byPlayer[player]
	local session = DataService.get(player)
	if base and session then
		local hasPass = player:GetAttribute("Pass_FasterLock") == true
		local duration = StealLock.duration(session.data.lockLevel, hasPass, Config.Lock)
		local cooldown = StealLock.cooldown(hasPass, Config.Lock)
		local nextState = StealLock.press(base.lock, now(), duration, cooldown)
		if nextState then
			base.lock = nextState
			base.lockToken += 1
			local token = base.lockToken
			base.model:SetAttribute("LockedUntil", nextState.lockedUntil)
			player:SetAttribute("LockedUntil", nextState.lockedUntil)
			player:SetAttribute("LockReadyAt", nextState.readyAt)
			showBarrier(base, true)
			task.delay(duration, function()
				if base.lockToken == token then
					showBarrier(base, false)
				end
			end)
			return "locked"
		end
		return "wait"
	end
	return "none"
end

return BaseService
