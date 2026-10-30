--!strict
-- Compañeros de nieve: abrir huevos con monedas (tirada ponderada en el servidor), equipar hasta 3, elegir los
-- mejores, soltar uno por monedas y los que te siguen por el pueblo. El bonus de los equipados (con tope) sube el
-- valor de la nieve: se publica en el atributo Boost y PlowService lo usa.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Buddies = require(ReplicatedStorage.Shared.Buddies)
local Config = require(ReplicatedStorage.Shared.Config)
local Rng = require(ReplicatedStorage.Shared.Rng)
local Zones = require(ReplicatedStorage.Shared.Zones)
local BuddyBuilder = require(script.Parent.BuddyBuilder)
local DataService = require(script.Parent.DataService)
local PlowService = require(script.Parent.PlowService)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent
local InventoryRemote = Remotes:WaitForChild("Inventory") :: RemoteEvent

export type SavedBuddy = Buddies.SavedBuddy

type Followers = {
	models: { Model },
	slots: { Attachment },
}

local BuddyService = {}

local rng = Rng.new(Random.new():NextInteger(1, 2 ^ 31 - 2))
local followers: { [Player]: Followers } = {}
local connections: { [Player]: RBXScriptConnection } = {}

local rarityBoosts: { number } = {}
for _, def in Config.BuddyRarities do
	table.insert(rarityBoosts, def.boost)
end

-- Sitios alrededor del jugador (detrás y a los lados), en coordenadas de su raíz.
local SLOTS = {
	Vector3.new(-3.4, -0.6, 2.6),
	Vector3.new(3.4, -0.6, 2.6),
	Vector3.new(0, 0.4, 4.6),
}

local folder = Instance.new("Folder")
folder.Name = "Buddies"
folder.Parent = Workspace

-- Tirada de un huevo: especie al azar y rareza con los pesos del huevo (con un mínimo para el Huevo de la suerte).
function BuddyService.roll(egg: Config.EggDef, minRarity: number?): (string, number)
	local rarity = Buddies.roll(rng, egg.weights, minRarity)
	local species = Config.BuddySpecies[rng.int(1, #Config.BuddySpecies)].id
	return species, rarity
end

-- Añade un compañero a los datos (y lo equipa si hay hueco). Llamar solo si cabe (#buddies < maxOwned).
function BuddyService.newRecord(data: DataService.PlayerData, species: string, rarity: number): Buddies.SavedBuddy
	local record: Buddies.SavedBuddy = { id = "b" .. data.nextId, s = species, r = rarity }
	data.nextId += 1
	table.insert(data.buddies, record)
	if #data.equipped < Config.Buddies.maxEquipped then
		table.insert(data.equipped, record.id)
	end
	return record
end

-- Deshace newRecord (si una compra no se pudo guardar).
function BuddyService.removeRecord(data: DataService.PlayerData, id: string)
	local index = Buddies.find(data.buddies, id)
	if index then
		table.remove(data.buddies, index)
	end
	local at = table.find(data.equipped, id)
	if at then
		table.remove(data.equipped, at)
	end
end

function BuddyService.hasRoom(data: DataService.PlayerData): boolean
	return #data.buddies < Config.Buddies.maxOwned
end

-- Huevo de la mejor zona abierta (para el Huevo de la suerte).
function BuddyService.bestEgg(zones: number): Config.EggDef
	local best = Config.Eggs[1]
	for _, egg in Config.Eggs do
		if egg.zone <= zones then
			best = egg
		end
	end
	return best
end

local function clearFollowers(player: Player)
	local current = followers[player]
	if current then
		for _, model in current.models do
			model:Destroy()
		end
		for _, slot in current.slots do
			slot:Destroy()
		end
		followers[player] = nil
	end
end

local function spawnFollowers(player: Player, data: DataService.PlayerData)
	clearFollowers(player)
	local character = player.Character
	local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
	if root and root:IsA("BasePart") then
		local current: Followers = { models = {}, slots = {} }
		for i, id in data.equipped do
			local index = Buddies.find(data.buddies, id)
			local offset = SLOTS[i]
			if index and offset then
				local record = data.buddies[index]
				local model, body = BuddyBuilder.build(record.s, record.r)
				local slot = Instance.new("Attachment")
				slot.Name = "BuddySlot" .. i
				slot.Position = offset
				slot.Parent = root
				local attachment = Instance.new("Attachment")
				attachment.Parent = body
				local align = Instance.new("AlignPosition")
				align.Attachment0 = attachment
				align.Attachment1 = slot
				align.Responsiveness = 18
				align.MaxForce = 100000
				align.Parent = body
				local turn = Instance.new("AlignOrientation")
				turn.Attachment0 = attachment
				turn.Attachment1 = slot
				turn.Responsiveness = 18
				turn.MaxTorque = 100000
				turn.Parent = body
				model:PivotTo(root.CFrame * CFrame.new(offset))
				model.Parent = folder
				pcall(function()
					body:SetNetworkOwner(player)
				end)
				table.insert(current.models, model)
				table.insert(current.slots, slot)
			end
		end
		followers[player] = current
	end
end

function BuddyService.sendInventory(player: Player)
	local session = DataService.get(player)
	if session then
		local payload = {}
		for _, buddy in session.data.buddies do
			table.insert(payload, {
				id = buddy.id,
				s = buddy.s,
				r = buddy.r,
				e = table.find(session.data.equipped, buddy.id) ~= nil,
			})
		end
		InventoryRemote:FireClient(player, payload)
	end
end

-- Tras cualquier cambio de compañeros: bonus, estadísticas de la pala, los que siguen y el inventario.
function BuddyService.refresh(player: Player)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local boost = Buddies.equippedBoost(data.buddies, data.equipped, rarityBoosts, Config.Buddies.maxBoost)
		player:SetAttribute("Boost", boost)
		player:SetAttribute("BuddyCount", #data.buddies)
		PlowService.applyStats(player)
		spawnFollowers(player, data)
		BuddyService.sendInventory(player)
	end
end

function BuddyService.hatch(player: Player, eggIndex: number)
	local session = DataService.get(player)
	local egg = Config.Eggs[eggIndex]
	if session and egg then
		local data = session.data
		if not Zones.isAllowed(egg.zone, data.zones) then
			Notify:FireClient(player, { kind = "locked", zone = egg.zone })
		elseif not BuddyService.hasRoom(data) then
			Notify:FireClient(player, { kind = "buddies_full" })
		elseif DataService.trySpend(player, egg.cost) then
			local species, rarity = BuddyService.roll(egg)
			BuddyService.newRecord(data, species, rarity)
			BuddyService.refresh(player)
			Notify:FireClient(player, { kind = "hatch", s = species, r = rarity })
		else
			Notify:FireClient(player, { kind = "nomoney", price = egg.cost })
		end
	end
end

function BuddyService.toggle(player: Player, id: string)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local list, result = Buddies.toggle(data.buddies, data.equipped, id, Config.Buddies.maxEquipped)
		data.equipped = list
		if result == "full" then
			Notify:FireClient(player, { kind = "equip_full" })
		end
		BuddyService.refresh(player)
	end
end

function BuddyService.equipBest(player: Player)
	local session = DataService.get(player)
	if session then
		session.data.equipped = Buddies.best(session.data.buddies, Config.Buddies.maxEquipped)
		BuddyService.refresh(player)
	end
end

-- Soltar un compañero (vuelve a la nieve) a cambio de monedas.
function BuddyService.recycle(player: Player, id: string)
	local session = DataService.get(player)
	if session then
		local data = session.data
		local index = Buddies.find(data.buddies, id)
		if index then
			local record = data.buddies[index]
			local coins = Config.BuddyRarities[record.r].recycle
			BuddyService.removeRecord(data, id)
			DataService.addCoins(player, coins)
			BuddyService.refresh(player)
			Notify:FireClient(player, { kind = "recycled", s = record.s, r = record.r, coins = coins })
		end
	end
end

function BuddyService.setup(player: Player)
	connections[player] = player.CharacterAdded:Connect(function(character: Model)
		character:WaitForChild("HumanoidRootPart", 10)
		task.wait(0.3)
		local session = DataService.get(player)
		if session and player.Character == character then
			spawnFollowers(player, session.data)
		end
	end)
	BuddyService.refresh(player)
end

function BuddyService.cleanup(player: Player)
	clearFollowers(player)
	local connection = connections[player]
	if connection then
		connection:Disconnect()
		connections[player] = nil
	end
end

-- Si algún compañero se queda atrás (cayó del mapa, se atascó), vuelve junto a su jugador.
function BuddyService.start()
	task.spawn(function()
		while true do
			task.wait(3)
			for _, player in Players:GetPlayers() do
				local current = followers[player]
				local character = player.Character
				local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
				if current and root and root:IsA("BasePart") then
					for i, model in current.models do
						local slot = current.slots[i]
						if slot and (model:GetPivot().Position - slot.WorldPosition).Magnitude > 40 then
							model:PivotTo(CFrame.new(slot.WorldPosition))
						end
					end
				end
			end
		end
	end)
end

return BuddyService
