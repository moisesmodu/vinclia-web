--!strict
-- Arranque del servidor: construye el pueblo y la nieve, conecta los servicios y atiende la entrada y salida de
-- jugadores. Todas las peticiones del cliente se validan (tipos y rangos) y pasan por un cubo de fichas.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Services = script.Parent.Services
local BuddyService = require(Services.BuddyService)
local DataService = require(Services.DataService)
local MonetizationService = require(Services.MonetizationService)
local PlowService = require(Services.PlowService)
local ProgressService = require(Services.ProgressService)
local RateLimiter = require(Services.RateLimiter)
local SnowService = require(Services.SnowService)
local WorldBuilder = require(Services.WorldBuilder)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local UpgradeRemote = Remotes:WaitForChild("Upgrade") :: RemoteEvent
local UnlockZoneRemote = Remotes:WaitForChild("UnlockZone") :: RemoteEvent
local TeleportRemote = Remotes:WaitForChild("Teleport") :: RemoteEvent
local HatchRemote = Remotes:WaitForChild("Hatch") :: RemoteEvent
local EquipRemote = Remotes:WaitForChild("Equip") :: RemoteEvent
local EquipBestRemote = Remotes:WaitForChild("EquipBest") :: RemoteEvent
local RecycleRemote = Remotes:WaitForChild("Recycle") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local ClaimAdventRemote = Remotes:WaitForChild("ClaimAdvent") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

-- Mundo
local world = WorldBuilder.build()
SnowService.build(world.snowFolder)
SnowService.start()
PlowService.init(world)
PlowService.start()
BuddyService.start()
ProgressService.start()
MonetizationService.start()
DataService.startAutosave()

-- Peticiones del cliente
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

local upgradeIds: { [string]: boolean } = {}
for _, def in Config.Upgrades do
	upgradeIds[def.id] = true
end

local function isIndex(value: number, count: number): boolean
	return value == math.floor(value) and value >= 1 and value <= count
end

local function isShortString(value: string): boolean
	return #value >= 1 and #value <= 16
end

-- Llama a `action` con un índice entre 1 y `count` (zona, huevo...).
local function withIndex(player: Player, value: unknown, count: number, action: (Player, number) -> ())
	if type(value) == "number" and isIndex(value, count) and limiter:allow(player) then
		action(player, value)
	end
end

-- Llama a `action` con un texto corto (id de mejora o de compañero).
local function withId(player: Player, value: unknown, action: (Player, string) -> ())
	if type(value) == "string" and isShortString(value) and limiter:allow(player) then
		action(player, value)
	end
end

UpgradeRemote.OnServerEvent:Connect(function(player: Player, id: unknown)
	if type(id) == "string" and upgradeIds[id] == true then
		withId(player, id, ProgressService.upgrade)
	end
end)

UnlockZoneRemote.OnServerEvent:Connect(function(player: Player, index: unknown)
	withIndex(player, index, #Config.Zones, ProgressService.unlockZone)
end)

TeleportRemote.OnServerEvent:Connect(function(player: Player, index: unknown)
	withIndex(player, index, #Config.Zones, ProgressService.teleport)
end)

HatchRemote.OnServerEvent:Connect(function(player: Player, index: unknown)
	withIndex(player, index, #Config.Eggs, BuddyService.hatch)
end)

EquipRemote.OnServerEvent:Connect(function(player: Player, id: unknown)
	withId(player, id, BuddyService.toggle)
end)

RecycleRemote.OnServerEvent:Connect(function(player: Player, id: unknown)
	withId(player, id, BuddyService.recycle)
end)

EquipBestRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		BuddyService.equipBest(player)
	end
end)

ClaimDailyRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.claimDaily(player)
	end
end)

ClaimAdventRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.claimAdvent(player)
	end
end)

RebirthRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.rebirth(player)
	end
end)

-- Avisos de las puertas de hielo (abrir la zona siguiente)
local gates = Workspace:WaitForChild("World"):WaitForChild("Gates")
for _, post in gates:GetChildren() do
	local prompt = post:FindFirstChild("UnlockPrompt")
	local zone = post:GetAttribute("Zone")
	if prompt and prompt:IsA("ProximityPrompt") and type(zone) == "number" then
		local index: number = zone
		prompt.Triggered:Connect(function(player: Player)
			if limiter:allow(player) then
				ProgressService.unlockZone(player, index)
			end
		end)
	end
end

local function onPlayerAdded(player: Player)
	local session = DataService.load(player)
	if session and player.Parent == Players then
		if player:GetAttribute("SaveWarning") then
			Notify:FireClient(player, { kind = "save_warning" })
		end
		MonetizationService.loadOwnership(player)
		if player.Parent == Players then
			PlowService.setup(player)
			BuddyService.setup(player)
			ProgressService.onJoin(player)
		end
	end
end

local function onPlayerRemoving(player: Player)
	BuddyService.cleanup(player)
	PlowService.cleanup(player)
	DataService.release(player)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

game:BindToClose(function()
	DataService.releaseAll()
end)
