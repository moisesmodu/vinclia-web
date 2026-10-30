--!strict
-- Gelatinas de las bases: aparecen en sus pedestales, generan monedas cada segundo, se fusionan, se venden y se
-- pueden llevar (sin daño) a la base de otro jugador.
--
-- Llevarse una gelatina: mantienes pulsado su aviso (no en tu base, no con el candado puesto, con un pedestal
-- libre en la tuya). Va encima de tu cabeza y caminas más lento. Si llegas a tu base, es tuya. Si su dueño te
-- toca (su aviso 👆), si tardas demasiado, te caes o te vas, vuelve sola a su pedestal.
-- El servidor decide todo: los avisos del cliente solo piden.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local Economy = require(ReplicatedStorage.Shared.Economy)
local Pets = require(ReplicatedStorage.Shared.Pets)
local StealLock = require(ReplicatedStorage.Shared.StealLock)
local BaseService = require(script.Parent.BaseService)
local DataService = require(script.Parent.DataService)
local PetBuilder = require(script.Parent.PetBuilder)
local RateLimiter = require(script.Parent.RateLimiter)

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local Notify = Remotes:WaitForChild("Notify") :: RemoteEvent
local InventoryRemote = Remotes:WaitForChild("Inventory") :: RemoteEvent

type PetState = "home" | "moving" | "carried"

type LivePet = {
	record: Pets.SavedPet,
	owner: Player,
	model: Model,
	body: BasePart,
	state: PetState,
	moveToken: number,
	prompt: ProximityPrompt?, -- «llévatela» en casa, «tócalo» en brazos de otro
}

type Carry = {
	pet: LivePet,
	thief: Player,
	startedAt: number,
	minTime: number, -- segundos mínimos para llegar a casa (anti-teletransporte)
	weld: WeldConstraint,
	humanoid: Humanoid,
	walkSpeed: number,
}

local PetService = {}

local folder: Folder? = nil
local live: { [Player]: { [string]: LivePet } } = {}
local carries: { [Player]: Carry } = {} -- por quien la lleva
local remainders: { [Player]: number } = {}
local pushQueued: { [Player]: boolean } = {}
local promptLimiter = RateLimiter.new(Config.RateLimit.perSecond, Config.RateLimit.burst)

-- declaradas más abajo (los avisos de las gelatinas las llaman)
local trySteal: (thief: Player, pet: LivePet) -> ()
local tagCarrier: (player: Player, pet: LivePet) -> ()

local incomes: { number } = {}
for _, def in Config.Rarities do
	table.insert(incomes, def.income)
end

local function notify(player: Player, payload: { [string]: any })
	Notify:FireClient(player, payload)
end

local function petsOf(player: Player): { [string]: LivePet }
	local map = live[player]
	if map then
		return map
	end
	local created: { [string]: LivePet } = {}
	live[player] = created
	return created
end

local function listOf(player: Player): { LivePet }
	local list: { LivePet } = {}
	local map = live[player]
	if map then
		for _, pet in map do
			table.insert(list, pet)
		end
	end
	return list
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

local function humanoidOf(player: Player): Humanoid?
	local character = player.Character
	if character then
		return character:FindFirstChildOfClass("Humanoid")
	end
	return nil
end

function PetService.padCount(player: Player): number
	local extra = if player:GetAttribute("Pass_ExtraPads") == true then Config.Pads.extraPadsBonus else 0
	return math.min(Config.Pads.base + extra, Config.Pads.max)
end

-- Gelatinas que no se pueden vender ni fusionar ahora (en camino o en brazos de alguien).
local function blockedIds(player: Player): { [string]: boolean }
	local blocked: { [string]: boolean } = {}
	for _, pet in listOf(player) do
		if pet.state ~= "home" then
			blocked[pet.record.id] = true
		end
	end
	return blocked
end

local function pushInventory(player: Player)
	if pushQueued[player] then
		return
	end
	pushQueued[player] = true
	task.defer(function()
		pushQueued[player] = nil
		local session = DataService.get(player)
		if session and player.Parent == Players then
			local list = {}
			for _, record in session.data.pets do
				table.insert(list, { s = record.s, r = record.r, pad = record.pad })
			end
			player:SetAttribute("PadsUsed", Pets.padsUsed(session.data.pets))
			player:SetAttribute("PadsTotal", PetService.padCount(player))
			InventoryRemote:FireClient(player, list)
		end
	end)
end

local function clearPrompt(pet: LivePet)
	local prompt = pet.prompt
	if prompt then
		prompt:Destroy()
		pet.prompt = nil
	end
end

local function newPrompt(pet: LivePet, name: string, action: string, audience: string): ProximityPrompt
	clearPrompt(pet)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = name
	prompt.ActionText = action
	prompt.ObjectText = ""
	prompt.RequiresLineOfSight = false
	-- el cliente esconde los avisos que no son para él (PromptFilter): «others» o «owner»
	prompt:SetAttribute("Audience", audience)
	prompt:SetAttribute("OwnerId", pet.owner.UserId)
	pet.prompt = prompt
	return prompt
end

local function addStealPrompt(pet: LivePet)
	local prompt = newPrompt(pet, "StealPrompt", "✋🐾", "others")
	prompt.HoldDuration = Config.Steal.holdDuration
	prompt.MaxActivationDistance = Config.Steal.promptDistance
	prompt.KeyboardKeyCode = Enum.KeyCode.F
	prompt.Triggered:Connect(function(thief: Player)
		if promptLimiter:allow(thief) then
			trySteal(thief, pet)
		end
	end)
	prompt.Parent = pet.body
end

local function addTagPrompt(pet: LivePet)
	local prompt = newPrompt(pet, "TagPrompt", "👆", "owner")
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = Config.Steal.tagDistance
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.Triggered:Connect(function(player: Player)
		if promptLimiter:allow(player) then
			tagCarrier(player, pet)
		end
	end)
	prompt.Parent = pet.body
end

local function settle(pet: LivePet)
	pet.state = "home"
	addStealPrompt(pet)
end

local function facing(from: Vector3, to: Vector3, fallback: Vector3): Vector3
	local flat = Vector3.new(to.X - from.X, 0, to.Z - from.Z)
	if flat.Magnitude > 0.01 then
		return flat.Unit
	end
	return fallback
end

-- Lleva la gelatina a saltitos desde donde está hasta `target`; al llegar (si nadie la ha movido antes), `onArrive`.
local function walk(pet: LivePet, target: CFrame, onArrive: () -> ())
	pet.moveToken += 1
	local token = pet.moveToken
	pet.state = "moving"
	clearPrompt(pet)
	local from = pet.model:GetPivot().Position
	local distance = (target.Position - from).Magnitude
	local duration = math.max(0.5, distance / Config.Pets.walkSpeed)
	local hops = math.max(1, math.floor(distance / 4 + 0.5))
	local direction = facing(from, target.Position, target.LookVector)
	task.spawn(function()
		local started = os.clock()
		local t = 0
		while t < 1 and pet.moveToken == token and pet.model.Parent ~= nil do
			t = math.min((os.clock() - started) / duration, 1)
			local hop = math.abs(math.sin(t * hops * math.pi)) * 1.2
			local position = from:Lerp(target.Position, t) + Vector3.new(0, hop, 0)
			pet.model:PivotTo(CFrame.lookAt(position, position + direction))
			RunService.Heartbeat:Wait()
		end
		if pet.moveToken == token and pet.model.Parent ~= nil then
			pet.model:PivotTo(target)
			onArrive()
		end
	end)
end

local function homeCFrame(pet: LivePet): CFrame?
	local base = BaseService.get(pet.owner)
	local pad = pet.record.pad
	if base and pad then
		return BaseService.padCFrame(base, pad, PetBuilder.HEIGHT)
	end
	return nil
end

local function destroyLive(pet: LivePet)
	pet.moveToken += 1
	local map = live[pet.owner]
	if map and map[pet.record.id] == pet then
		map[pet.record.id] = nil
	end
	pet.model:Destroy()
end

-- Crea el modelo de una gelatina con pedestal. Si `from`, aparece ahí y va andando a su pedestal.
local function spawnLive(player: Player, record: Pets.SavedPet, from: CFrame?): LivePet?
	local base = BaseService.get(player)
	local pad = record.pad
	local parent = folder
	if base and pad and parent then
		local model, body = PetBuilder.build(record.s, record.r)
		model.Name = "Pet_" .. player.UserId .. "_" .. record.id
		model:SetAttribute("OwnerId", player.UserId)
		model:SetAttribute("Species", record.s)
		model:SetAttribute("Rarity", record.r)
		local pet: LivePet = {
			record = record,
			owner = player,
			model = model,
			body = body,
			state = "home",
			moveToken = 0,
			prompt = nil,
		}
		petsOf(player)[record.id] = pet
		local target = BaseService.padCFrame(base, pad, PetBuilder.HEIGHT)
		if from then
			model:PivotTo(from)
			model.Parent = parent
			walk(pet, target, function()
				settle(pet)
			end)
		else
			model:PivotTo(target)
			model.Parent = parent
			settle(pet)
		end
		return pet
	end
	return nil
end

-- Vuelve a su pedestal andando desde donde esté (o reaparece en él si el modelo se perdió).
local function sendHome(pet: LivePet)
	local target = homeCFrame(pet)
	if target and pet.model.Parent ~= nil then
		PetBuilder.setAnchored(pet.model, true)
		walk(pet, target, function()
			settle(pet)
		end)
	elseif pet.owner.Parent == Players then
		destroyLive(pet)
		spawnLive(pet.owner, pet.record, nil)
	else
		destroyLive(pet)
	end
end

-- Coloca en pedestales libres las gelatinas que estaban en reserva.
local function promoteStored(player: Player)
	local session = DataService.get(player)
	if session then
		local padCount = PetService.padCount(player)
		for _, record in session.data.pets do
			if record.pad == nil then
				local pad = Pets.firstFreePad(session.data.pets, padCount)
				if pad then
					record.pad = pad
					spawnLive(player, record, nil)
				end
			end
		end
	end
end

-- Añade una gelatina a los datos (en el primer pedestal libre o en reserva) y la devuelve.
function PetService.newRecord(
	data: DataService.PlayerData,
	species: string,
	rarity: number,
	padCount: number
): Pets.SavedPet
	local record: Pets.SavedPet = {
		id = "p" .. data.nextId,
		s = species,
		r = rarity,
		pad = Pets.firstFreePad(data.pets, padCount),
	}
	data.nextId += 1
	table.insert(data.pets, record)
	return record
end

-- ¿Puede quedarse otra gelatina (pedestal libre y por debajo del máximo)?
function PetService.canAdopt(player: Player): boolean
	local session = DataService.get(player)
	if session then
		return #session.data.pets < Config.Pets.maxOwned
			and Pets.firstFreePad(session.data.pets, PetService.padCount(player)) ~= nil
	end
	return false
end

-- Gelatina comprada en la cinta: aparece en `from` y va andando a su pedestal.
function PetService.adopt(player: Player, species: string, rarity: number, from: CFrame): boolean
	local session = DataService.get(player)
	if session and #session.data.pets < Config.Pets.maxOwned then
		local record = PetService.newRecord(session.data, species, rarity, PetService.padCount(player))
		if record.pad then
			spawnLive(player, record, from)
		end
		pushInventory(player)
		return true
	end
	return false
end

-- Muestra una gelatina ya añadida a los datos (Tirada de suerte): cae del cielo sobre su pedestal.
function PetService.showRecord(player: Player, record: Pets.SavedPet)
	local base = BaseService.get(player)
	local pad = record.pad
	if base and pad then
		local target = BaseService.padCFrame(base, pad, PetBuilder.HEIGHT)
		spawnLive(player, record, target + Vector3.new(0, 14, 0))
	end
	pushInventory(player)
end

function PetService.incomePerSecond(player: Player): number
	local session = DataService.get(player)
	if session then
		local skip: { [string]: boolean } = {}
		for _, pet in listOf(player) do
			if pet.state == "carried" then
				skip[pet.record.id] = true
			end
		end
		local base = Pets.incomePerSecond(session.data.pets, incomes, skip)
		local hasDouble = player:GetAttribute("Pass_DoubleCoins") == true
		return base * Economy.multiplier(session.data.rebirths, hasDouble, Config.Income)
	end
	return 0
end

function PetService.sell(player: Player, species: string, rarity: number)
	local session = DataService.get(player)
	local ids = if session then Pets.pick(session.data.pets, species, rarity, 1, blockedIds(player)) else nil
	if session and ids then
		local id = ids[1]
		Pets.remove(session.data.pets, id)
		local pet = petsOf(player)[id]
		if pet then
			destroyLive(pet)
		end
		local coins = Economy.sellValue(Config.Rarities[rarity].price, Config.Pets.sellFraction)
		DataService.addCoins(player, coins)
		promoteStored(player)
		pushInventory(player)
		notify(player, { kind = "sold", s = species, r = rarity, coins = coins })
	end
end

function PetService.fuse(player: Player, species: string, rarity: number)
	local session = DataService.get(player)
	local maxRarity = #Config.Rarities
	local ids = if session
		then Pets.fusePick(session.data.pets, species, rarity, maxRarity, blockedIds(player))
		else nil
	local result = Pets.fuseResult(rarity, maxRarity)
	if session and ids and result then
		local spot: CFrame? = nil
		for _, id in ids do
			Pets.remove(session.data.pets, id)
			local pet = petsOf(player)[id]
			if pet then
				spot = spot or pet.model:GetPivot()
				destroyLive(pet)
			end
		end
		local record = PetService.newRecord(session.data, species, result, PetService.padCount(player))
		if record.pad then
			spawnLive(player, record, spot)
		end
		promoteStored(player)
		pushInventory(player)
		notify(player, { kind = "fused", s = species, r = result })
	else
		notify(player, { kind = "nofuse" })
	end
end

local function findCarry(pet: LivePet): Carry?
	for _, carry in carries do
		if carry.pet == pet then
			return carry
		end
	end
	return nil
end

-- Suelta la gelatina de quien la lleva (sin decidir aún adónde va).
local function releaseCarry(carry: Carry)
	carries[carry.thief] = nil
	carry.weld:Destroy()
	if carry.humanoid.Parent ~= nil then
		carry.humanoid.WalkSpeed = carry.walkSpeed
	end
	carry.thief:SetAttribute("Carrying", false)
	clearPrompt(carry.pet)
end

-- La gelatina vuelve a casa. `reason` llega al que la llevaba: "tagged" (le tocó el dueño) o "dropped".
local function dropCarry(carry: Carry, reason: string)
	releaseCarry(carry)
	if carry.thief.Parent == Players then
		notify(carry.thief, { kind = reason })
	end
	sendHome(carry.pet)
end

local function startCarry(thief: Player, humanoid: Humanoid, root: BasePart, pet: LivePet, thiefBase: BaseService.Base)
	pet.moveToken += 1
	pet.state = "carried"
	clearPrompt(pet)
	-- encima de la cabeza: primero se coloca (anclada), luego se suelda y se suelta
	pet.model:PivotTo(root.CFrame * CFrame.new(0, 4.4, 0))
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = root
	weld.Part1 = pet.body
	weld.Parent = pet.body
	PetBuilder.setAnchored(pet.model, false)

	local home = thiefBase.spawnCFrame.Position
	local distance = Vector3.new(home.X - root.Position.X, 0, home.Z - root.Position.Z).Magnitude
	carries[thief] = {
		pet = pet,
		thief = thief,
		startedAt = os.clock(),
		minTime = distance / (Config.Steal.carryWalkSpeed * 1.6),
		weld = weld,
		humanoid = humanoid,
		walkSpeed = humanoid.WalkSpeed,
	}
	humanoid.WalkSpeed = Config.Steal.carryWalkSpeed
	thief:SetAttribute("Carrying", true)
	addTagPrompt(pet)
	notify(thief, { kind = "carry", s = pet.record.s, r = pet.record.r })
	notify(pet.owner, { kind = "stolen", s = pet.record.s, r = pet.record.r })
end

trySteal = function(thief: Player, pet: LivePet)
	local session = DataService.get(thief)
	local thiefBase = BaseService.get(thief)
	local humanoid = humanoidOf(thief)
	local root = rootOf(thief)
	if session and thiefBase and humanoid and root and humanoid.Health > 0 and pet.model.Parent ~= nil then
		local hasRoom = #session.data.pets < Config.Pets.maxOwned
			and Pets.firstFreePad(session.data.pets, PetService.padCount(thief)) ~= nil
		local reason: StealLock.Reason = StealLock.canSteal({
			isOwn = thief == pet.owner,
			petHome = pet.state == "home",
			ownerLocked = BaseService.isLocked(pet.owner),
			thiefCarrying = carries[thief] ~= nil,
			thiefHasFreePad = hasRoom,
		})
		local near = (root.Position - pet.body.Position).Magnitude <= Config.Steal.promptDistance + 6
		if reason == "ok" and near then
			startCarry(thief, humanoid, root, pet, thiefBase)
		elseif reason ~= "ok" then
			notify(thief, { kind = "steal_" .. reason })
		end
	end
end

-- El dueño toca a quien se lleva su gelatina: la suelta y vuelve a casa.
tagCarrier = function(player: Player, pet: LivePet)
	local carry = if player == pet.owner and pet.state == "carried" then findCarry(pet) else nil
	local root = rootOf(player)
	if carry and root and (root.Position - pet.body.Position).Magnitude <= Config.Steal.tagDistance + 6 then
		dropCarry(carry, "tagged")
		notify(player, { kind = "saved", s = pet.record.s, r = pet.record.r })
	end
end

-- Llega a su base con la gelatina: pasa a ser suya (o vuelve a casa si ya no le cabe).
local function deliver(carry: Carry)
	local pet = carry.pet
	local owner = pet.owner
	local thief = carry.thief
	local ownerSession = DataService.get(owner)
	local thiefSession = DataService.get(thief)
	releaseCarry(carry)
	if ownerSession and thiefSession and #thiefSession.data.pets < Config.Pets.maxOwned then
		local from = pet.model:GetPivot()
		Pets.remove(ownerSession.data.pets, pet.record.id)
		destroyLive(pet)
		local record = PetService.newRecord(thiefSession.data, pet.record.s, pet.record.r, PetService.padCount(thief))
		if record.pad then
			spawnLive(thief, record, from)
		end
		notify(thief, { kind = "stole", s = record.s, r = record.r })
		notify(owner, { kind = "lost", s = record.s, r = record.r })
		promoteStored(owner)
		pushInventory(owner)
		pushInventory(thief)
		task.spawn(DataService.save, owner)
		task.spawn(DataService.save, thief)
	else
		sendHome(pet)
	end
end

local function checkCarry(carry: Carry)
	local thief = carry.thief
	local root = rootOf(thief)
	local base = BaseService.get(thief)
	local alive = thief.Parent == Players and carry.humanoid.Parent ~= nil and carry.humanoid.Health > 0
	local expired = StealLock.carryExpired(carry.startedAt, os.clock(), Config.Steal.carryTimeout)
	if root and base and alive and not expired and carry.pet.model.Parent ~= nil then
		if BaseService.contains(base, root.Position) and os.clock() - carry.startedAt >= carry.minTime then
			deliver(carry)
		end
	else
		dropCarry(carry, "dropped")
	end
end

-- Quita todos los modelos de un jugador: devuelve la gelatina que llevaba y suelta las suyas que otro llevaba.
local function clearLive(player: Player)
	local own = carries[player]
	if own then
		dropCarry(own, "dropped")
	end
	for _, pet in listOf(player) do
		local carry = findCarry(pet)
		if carry then
			releaseCarry(carry)
			notify(carry.thief, { kind = "dropped" })
		end
		destroyLive(pet)
	end
	live[player] = nil
end

-- Al entrar: modelos de las gelatinas en sus pedestales.
function PetService.setup(player: Player)
	local session = DataService.get(player)
	local base = BaseService.get(player)
	if session and base then
		local padCount = PetService.padCount(player)
		BaseService.setPadCount(base, padCount)
		for _, record in session.data.pets do
			local pad = record.pad
			if pad and pad > padCount then
				record.pad = nil
			end
		end
		for _, record in session.data.pets do
			if record.pad then
				spawnLive(player, record, nil)
			end
		end
		promoteStored(player)
		pushInventory(player)
	end
end

-- Tras comprar «Más pedestales»: se encienden los nuevos y se llenan con la reserva.
function PetService.refreshPads(player: Player)
	local base = BaseService.get(player)
	if base then
		BaseService.setPadCount(base, PetService.padCount(player))
		promoteStored(player)
		pushInventory(player)
	end
end

-- Renacer: quita todas las gelatinas (modelos y datos).
function PetService.resetAll(player: Player)
	clearLive(player)
	local session = DataService.get(player)
	if session then
		table.clear(session.data.pets)
	end
	pushInventory(player)
end

function PetService.cleanup(player: Player)
	clearLive(player)
	remainders[player] = nil
	pushQueued[player] = nil
end

function PetService.init(petsFolder: Folder)
	folder = petsFolder
end

function PetService.start()
	-- monedas cada segundo (con los decimales que sobran guardados para el siguiente)
	task.spawn(function()
		while true do
			task.wait(1)
			for _, player in Players:GetPlayers() do
				local income = PetService.incomePerSecond(player)
				player:SetAttribute("Income", income)
				if income > 0 then
					local total = (remainders[player] or 0) + income
					local whole = math.floor(total)
					remainders[player] = total - whole
					DataService.addCoins(player, whole)
				end
			end
		end
	end)
	-- quien lleva una gelatina: ¿ha llegado, se ha caído, ha tardado demasiado?
	task.spawn(function()
		while true do
			task.wait(0.2)
			local list: { Carry } = {}
			for _, carry in carries do
				table.insert(list, carry)
			end
			for _, carry in list do
				if carries[carry.thief] == carry then
					checkCarry(carry)
				end
			end
		end
	end)
end

return PetService
