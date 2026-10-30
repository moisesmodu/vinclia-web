--!strict
-- Arranque del servidor: genera la torre con la semilla de Config, la construye, conecta los servicios y atiende
-- la entrada y salida de jugadores. Las peticiones del cliente se validan (tipos y rangos) y pasan por un cubo de
-- fichas. Los checkpoints, la baba y las caídas los detecta el servidor, no el cliente.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Rng = require(ReplicatedStorage.Shared.Rng)
local Stages = require(ReplicatedStorage.Shared.Stages)
local Services = script.Parent.Services
local DataService = require(Services.DataService)
local MonetizationService = require(Services.MonetizationService)
local ObstacleService = require(Services.ObstacleService)
local RateLimiter = require(Services.RateLimiter)
local StageService = require(Services.StageService)
local TowerBuilder = require(Services.TowerBuilder)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RestartRemote = Remotes:WaitForChild("Restart") :: RemoteEvent
local TrailRemote = Remotes:WaitForChild("Trail") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

-- Torre
local tower = Stages.generate({
	Physics = Config.Physics,
	Tower = Config.Tower,
	Zones = Config.Zones,
	Obstacles = Config.Obstacles,
}, Rng.new)
local built = TowerBuilder.build(tower)
StageService.init(tower, built)
ObstacleService.start(built, StageService.returnToCheckpoint)
StageService.start()
MonetizationService.start()
DataService.startAutosave()

-- Peticiones del cliente
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

local trailIds: { [string]: boolean } = {}
for _, def in Config.Trails do
	trailIds[def.id] = true
end

RestartRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		StageService.restart(player)
	end
end)

TrailRemote.OnServerEvent:Connect(function(player: Player, id: unknown)
	if limiter:allow(player) and type(id) == "string" and #id <= 24 and trailIds[id] == true then
		StageService.pressTrail(player, id)
	end
end)

ClaimDailyRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		StageService.claimDaily(player)
	end
end)

local function onPlayerAdded(player: Player)
	local session = DataService.load(player)
	if session and player.Parent == Players then
		if player:GetAttribute("SaveWarning") then
			Notify:FireClient(player, { kind = "save_warning" })
		end
		MonetizationService.loadOwnership(player)
		if player.Parent == Players then
			StageService.onJoin(player)
		end
	end
end

local function onPlayerRemoving(player: Player)
	StageService.onLeave(player)
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
