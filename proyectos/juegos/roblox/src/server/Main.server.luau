--!strict
-- Arranque del servidor: construye el mundo, conecta los servicios y atiende la entrada y salida de jugadores.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Services = script.Parent.Services
local DataService = require(Services.DataService)
local FarmService = require(Services.FarmService)
local MonetizationService = require(Services.MonetizationService)
local PlotService = require(Services.PlotService)
local RaceService = require(Services.RaceService)
local RateLimiter = require(Services.RateLimiter)
local TruckService = require(Services.TruckService)
local UpgradeService = require(Services.UpgradeService)
local WorldBuilder = require(Services.WorldBuilder)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local LoadEggs = Remotes:WaitForChild("LoadEggs") :: RemoteEvent
local ResetTruck = Remotes:WaitForChild("ResetTruck") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

-- Mundo: una pista nueva en cada servidor (la semilla queda en Workspace.TrackSeed)
local seed = Random.new():NextInteger(1, 2 ^ 31 - 2)
local world = WorldBuilder.build(seed)
PlotService.build(world.halfWidth)
TruckService.init(world)

FarmService.start()
TruckService.start()
RaceService.start()
UpgradeService.start()
MonetizationService.start()
DataService.startAutosave()

-- Peticiones del cliente: validadas y limitadas
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

LoadEggs.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		TruckService.loadEggs(player)
	end
end)

ResetTruck.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		TruckService.reset(player)
	end
end)

for _, plot in PlotService.all() do
	plot.prompt.Triggered:Connect(function(player: Player)
		if PlotService.ownerOf(plot) == player and limiter:allow(player) then
			TruckService.loadEggs(player)
		end
	end)
end

local function onPlayerAdded(player: Player)
	local session = DataService.load(player)
	if not session or player.Parent ~= Players then
		return
	end
	if player:GetAttribute("SaveWarning") then
		Notify:FireClient(player, { kind = "save_warning" })
	end
	local plot = PlotService.assign(player)
	if not plot then
		warn("[Main] no quedan parcelas libres para", player.UserId)
		return
	end
	MonetizationService.loadOwnership(player)
	if player.Parent ~= Players then
		return
	end
	FarmService.setup(player)
	TruckService.setup(player)
end

local function onPlayerRemoving(player: Player)
	TruckService.cleanup(player)
	FarmService.cleanup(player)
	PlotService.release(player)
	RaceService.remove(player)
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
