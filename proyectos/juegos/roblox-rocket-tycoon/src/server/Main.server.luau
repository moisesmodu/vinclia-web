--!strict
-- Arranque del servidor: construye la Luna, las 8 parcelas y los asteroides, conecta los servicios y atiende la
-- entrada y salida de jugadores. Todas las peticiones del cliente se validan (tipos y rangos) y pasan por un
-- cubo de fichas.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Services = script.Parent.Services
local DataService = require(Services.DataService)
local MonetizationService = require(Services.MonetizationService)
local PlotService = require(Services.PlotService)
local ProgressService = require(Services.ProgressService)
local RateLimiter = require(Services.RateLimiter)
local RocketService = require(Services.RocketService)
local TycoonService = require(Services.TycoonService)
local WorldBuilder = require(Services.WorldBuilder)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local CollectCrystalRemote = Remotes:WaitForChild("CollectCrystal") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local HomeRemote = Remotes:WaitForChild("Home") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

-- Mundo
WorldBuilder.build()
PlotService.build()
RocketService.buildAsteroids()
RocketService.start()
TycoonService.start()
ProgressService.start()
MonetizationService.start()
DataService.startAutosave()

-- Peticiones del cliente
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)
local crystalLimiter = RateLimiter.new(Config.RateLimit.crystalPerSecond, Config.RateLimit.crystalBurst)

CollectCrystalRemote.OnServerEvent:Connect(function(player: Player, id: unknown)
	if type(id) == "string" and #id >= 2 and #id <= 16 and crystalLimiter:allow(player) then
		RocketService.collect(player, id)
	end
end)

ClaimDailyRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.claimDaily(player)
	end
end)

RebirthRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.rebirth(player)
	end
end)

HomeRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		PlotService.sendHome(player)
	end
end)

local function onPlayerRemoving(player: Player)
	TycoonService.cleanup(player)
	RocketService.cleanup(player, PlotService.get(player))
	PlotService.release(player)
	DataService.release(player)
end

local function onPlayerAdded(player: Player)
	player.CharacterAdded:Connect(function()
		RocketService.resetPickup(player)
	end)
	local session = DataService.load(player)
	if session and player.Parent == Players then
		if player:GetAttribute("SaveWarning") then
			Notify:FireClient(player, { kind = "save_warning" })
		end
		MonetizationService.loadOwnership(player)
		local plot = if player.Parent == Players then PlotService.assign(player) else nil
		if plot then
			TycoonService.setup(player, plot)
			RocketService.setupPlot(plot)
			ProgressService.onJoin(player)
		elseif player.Parent == Players then
			warn("[Main] no quedan parcelas libres para", player.UserId)
			Notify:FireClient(player, { kind = "noplot" })
		end
		if player.Parent ~= Players then
			-- se fue mientras se montaba su base: se libera todo (dos veces no pasa nada)
			onPlayerRemoving(player)
		end
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

game:BindToClose(function()
	DataService.releaseAll()
end)
