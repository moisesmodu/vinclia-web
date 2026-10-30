--!strict
-- Arranque del servidor: construye el mundo y las bases, conecta los servicios y atiende la entrada y salida de
-- jugadores. Todas las peticiones del cliente se validan (tipos y rangos) y pasan por un cubo de fichas.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Services = script.Parent.Services
local BaseService = require(Services.BaseService)
local ConveyorService = require(Services.ConveyorService)
local DataService = require(Services.DataService)
local MonetizationService = require(Services.MonetizationService)
local PetService = require(Services.PetService)
local ProgressService = require(Services.ProgressService)
local RateLimiter = require(Services.RateLimiter)
local WorldBuilder = require(Services.WorldBuilder)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local FuseRemote = Remotes:WaitForChild("Fuse") :: RemoteEvent
local SellRemote = Remotes:WaitForChild("Sell") :: RemoteEvent
local RebirthRemote = Remotes:WaitForChild("Rebirth") :: RemoteEvent
local ClaimDailyRemote = Remotes:WaitForChild("ClaimDaily") :: RemoteEvent
local LockRemote = Remotes:WaitForChild("Lock") :: RemoteEvent
local UpgradeLockRemote = Remotes:WaitForChild("UpgradeLock") :: RemoteEvent
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent

-- Mundo
local world = WorldBuilder.build()
BaseService.build()
PetService.init(world.petsFolder)
ConveyorService.start(world.conveyorFolder, world.conveyorStart, world.conveyorEnd)
PetService.start()
ProgressService.start()
MonetizationService.start()
DataService.startAutosave()

-- Peticiones del cliente
local limiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

local speciesIds: { [string]: boolean } = {}
for _, def in Config.Species do
	speciesIds[def.id] = true
end

-- Llama a `action` solo si la especie y la rareza que manda el cliente existen.
local function withPet(player: Player, species: unknown, rarity: unknown, action: (Player, string, number) -> ())
	if
		limiter:allow(player)
		and type(species) == "string"
		and #species <= 16
		and speciesIds[species] == true
		and type(rarity) == "number"
		and rarity == math.floor(rarity)
		and rarity >= 1
		and rarity <= #Config.Rarities
	then
		action(player, species, rarity)
	end
end

FuseRemote.OnServerEvent:Connect(function(player: Player, species: unknown, rarity: unknown)
	withPet(player, species, rarity, PetService.fuse)
end)

SellRemote.OnServerEvent:Connect(function(player: Player, species: unknown, rarity: unknown)
	withPet(player, species, rarity, PetService.sell)
end)

RebirthRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.rebirth(player)
	end
end)

ClaimDailyRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.claimDaily(player)
	end
end)

LockRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.lock(player)
	end
end)

UpgradeLockRemote.OnServerEvent:Connect(function(player: Player)
	if limiter:allow(player) then
		ProgressService.upgradeLock(player)
	end
end)

for _, base in BaseService.all() do
	base.lockPrompt.Triggered:Connect(function(player: Player)
		if base.owner == player and limiter:allow(player) then
			ProgressService.lock(player)
		end
	end)
end

local function onPlayerAdded(player: Player)
	local session = DataService.load(player)
	if session and player.Parent == Players then
		if player:GetAttribute("SaveWarning") then
			Notify:FireClient(player, { kind = "save_warning" })
		end
		local base = BaseService.assign(player)
		if base then
			MonetizationService.loadOwnership(player)
			if player.Parent == Players then
				PetService.setup(player)
				ProgressService.onJoin(player)
			end
		else
			warn("[Main] no quedan bases libres para", player.UserId)
		end
	end
end

local function onPlayerRemoving(player: Player)
	PetService.cleanup(player)
	BaseService.release(player)
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
