--!strict
-- Guardado con DataStoreService (adaptado de Egg Truck Tycoon).
-- * Bloqueo de sesión dentro del propio registro (UpdateAsync): un jugador que salta de servidor no puede tener
--   dos copias vivas de sus datos (ni duplicar gelatinas). Un bloqueo más viejo que Config.Save.lockExpiry se
--   considera abandonado.
-- * Reintentos con espera creciente y respeto del presupuesto de peticiones.
-- * Guardado automático, al salir y al cerrar el servidor (BindToClose desde Main).
-- * commitPurchase: registra el PurchaseId en el DataStore en la misma escritura que concede la compra.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Pets = require(ReplicatedStorage.Shared.Pets)

export type PlayerData = {
	coins: number,
	rebirths: number,
	lockLevel: number,
	pets: { Pets.SavedPet },
	nextId: number,
	dailyDay: number, -- último día (UTC) en que se reclamó el premio diario
	dailyStreak: number,
	lastOnline: number, -- os.time() del último guardado (para las ganancias sin conectar)
	receipts: { [string]: number }, -- PurchaseId → os.time() de la concesión
}

export type Session = {
	player: Player,
	key: string,
	data: PlayerData,
	canSave: boolean,
	busy: boolean,
	released: boolean,
	coinsValue: IntValue,
	rebirthsValue: IntValue,
	previousOnline: number, -- lastOnline tal como se leyó al cargar
}

export type CommitResult = "granted" | "already" | "failed"

local RECORD_VERSION = 1

local DataService = {}

local store: DataStore? = nil
local storeOk, storeErr = pcall(function()
	store = DataStoreService:GetDataStore(Config.Save.storeName)
end)
if not storeOk then
	warn("[DataService] DataStore no disponible:", storeErr)
end

local sessions: { [Player]: Session } = {}

local speciesIds: { [string]: boolean } = {}
for _, def in Config.Species do
	speciesIds[def.id] = true
end

local function defaultData(): PlayerData
	return {
		coins = Config.Pets.startCoins,
		rebirths = 0,
		lockLevel = 0,
		pets = {},
		nextId = 1,
		dailyDay = 0,
		dailyStreak = 0,
		lastOnline = 0,
		receipts = {},
	}
end

local function toNumber(value: any, fallback: number): number
	local n = tonumber(value)
	if n ~= nil and n == n and n ~= math.huge and n ~= -math.huge then
		return n
	end
	return fallback
end

local function toInt(value: any, fallback: number, low: number, high: number): number
	return math.clamp(math.floor(toNumber(value, fallback)), low, high)
end

-- Gelatinas leídas del DataStore: especie y rareza válidas, ids únicos y pedestales sin repetir.
local function reconcilePets(raw: any, data: PlayerData)
	if type(raw) ~= "table" then
		return
	end
	local usedIds: { [string]: boolean } = {}
	local usedPads: { [number]: boolean } = {}
	for _, item in raw do
		if #data.pets >= Config.Pets.maxOwned then
			break
		end
		if type(item) == "table" and type(item.s) == "string" and speciesIds[item.s] then
			local rarity = toInt(item.r, 1, 1, #Config.Rarities)
			local id = if type(item.id) == "string" and #item.id <= 16 then item.id else ""
			if id == "" or usedIds[id] then
				id = "p" .. data.nextId
				data.nextId += 1
			end
			local pad: number? = nil
			local rawPad = tonumber(item.pad)
			if rawPad then
				local p = math.floor(rawPad)
				if p >= 1 and p <= Config.Pads.max and not usedPads[p] then
					pad = p
					usedPads[p] = true
				end
			end
			usedIds[id] = true
			table.insert(data.pets, { id = id, s = item.s, r = rarity, pad = pad })
		end
	end
end

-- Acepta cualquier cosa leída del DataStore y devuelve datos válidos (campos nuevos con su valor por defecto).
local function reconcile(raw: any): PlayerData
	local data = defaultData()
	if type(raw) ~= "table" then
		return data
	end
	data.coins = math.max(0, math.floor(toNumber(raw.coins, data.coins)))
	data.rebirths = toInt(raw.rebirths, 0, 0, Config.Rebirth.maxRebirths)
	data.lockLevel = toInt(raw.lockLevel, 0, 0, Config.Lock.maxLevel)
	data.nextId = math.max(1, math.floor(toNumber(raw.nextId, 1)))
	data.dailyDay = math.max(0, math.floor(toNumber(raw.dailyDay, 0)))
	data.dailyStreak = toInt(raw.dailyStreak, 0, 0, Config.Daily.maxStreak)
	data.lastOnline = math.max(0, toNumber(raw.lastOnline, 0))
	reconcilePets(raw.pets, data)
	if type(raw.receipts) == "table" then
		for purchaseId, at in raw.receipts do
			if type(purchaseId) == "string" then
				data.receipts[purchaseId] = toNumber(at, 0)
			end
		end
	end
	return data
end

local function copyData(data: PlayerData): PlayerData
	local pets: { Pets.SavedPet } = {}
	for _, pet in data.pets do
		table.insert(pets, { id = pet.id, s = pet.s, r = pet.r, pad = pet.pad })
	end
	return {
		coins = data.coins,
		rebirths = data.rebirths,
		lockLevel = data.lockLevel,
		pets = pets,
		nextId = data.nextId,
		dailyDay = data.dailyDay,
		dailyStreak = data.dailyStreak,
		lastOnline = data.lastOnline,
		receipts = table.clone(data.receipts),
	}
end

local function pruneReceipts(data: PlayerData)
	local list: { { id: string, at: number } } = {}
	for id, at in data.receipts do
		table.insert(list, { id = id, at = at })
	end
	if #list <= Config.Save.maxReceipts then
		return
	end
	table.sort(list, function(a, b)
		return a.at > b.at
	end)
	for i = Config.Save.maxReceipts + 1, #list do
		data.receipts[list[i].id] = nil
	end
end

local function waitForBudget()
	local waited = 0
	while DataStoreService:GetRequestBudgetForRequestType(Enum.DataStoreRequestType.UpdateAsync) < 1 and waited < 30 do
		task.wait(1)
		waited += 1
	end
end

local function isLockedByOther(record: any, now: number): boolean
	if type(record) ~= "table" or type(record.lock) ~= "table" then
		return false
	end
	if record.lock.jobId == game.JobId then
		return false
	end
	return now - toNumber(record.lock.time, 0) < Config.Save.lockExpiry
end

local function acquire(session: Session)
	while session.busy do
		task.wait(0.05)
	end
	session.busy = true
end

local function refresh(session: Session)
	local data = session.data
	session.coinsValue.Value = math.floor(data.coins)
	session.rebirthsValue.Value = data.rebirths
	local player = session.player
	player:SetAttribute("Coins", math.floor(data.coins))
	player:SetAttribute("Rebirths", data.rebirths)
	player:SetAttribute("LockLevel", data.lockLevel)
	player:SetAttribute("DailyStreak", data.dailyStreak)
end

-- Escribe los datos de la sesión en `activeStore`, con reintentos. Debe llamarse con session.busy tomado.
local function writeTo(activeStore: DataStore, session: Session, release: boolean): boolean
	session.data.lastOnline = os.time()
	local snapshot = copyData(session.data)
	for attempt = 1, Config.Save.saveAttempts do
		waitForBudget()
		local stolen = false
		local ok, err = pcall(function()
			activeStore:UpdateAsync(session.key, function(old: any)
				stolen = false
				if type(old) == "table" and type(old.lock) == "table" and old.lock.jobId ~= game.JobId then
					stolen = true
					return nil -- otro servidor tiene la sesión: no pisar sus datos
				end
				local record: { [string]: any } = { v = RECORD_VERSION, data = snapshot }
				if not release then
					record.lock = { jobId = game.JobId, time = os.time() }
				end
				return record
			end)
		end)
		if ok and not stolen then
			return true
		elseif ok and stolen then
			warn("[DataService] la sesión de", session.player.UserId, "la tiene otro servidor; no se guarda")
			session.canSave = false
			return false
		end
		warn("[DataService] fallo al guardar (intento " .. attempt .. "):", err)
		task.wait(2 ^ (attempt - 1))
	end
	return false
end

-- Escribe los datos de la sesión si se puede guardar. Debe llamarse con session.busy tomado.
local function writeLocked(session: Session, release: boolean): boolean
	local activeStore = store
	if session.canSave and activeStore ~= nil then
		return writeTo(activeStore, session, release)
	end
	return false
end

local function createSession(player: Player, data: PlayerData, canSave: boolean): Session
	-- nombres con emoji: la lista de jugadores tampoco lleva texto
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local coinsValue = Instance.new("IntValue")
	coinsValue.Name = "🪙"
	coinsValue.Parent = leaderstats
	local rebirthsValue = Instance.new("IntValue")
	rebirthsValue.Name = "🔁"
	rebirthsValue.Parent = leaderstats
	leaderstats.Parent = player

	local session: Session = {
		player = player,
		key = "u_" .. player.UserId,
		data = data,
		canSave = canSave,
		busy = false,
		released = false,
		coinsValue = coinsValue,
		rebirthsValue = rebirthsValue,
		previousOnline = data.lastOnline,
	}
	sessions[player] = session
	refresh(session)
	return session
end

-- Carga (y bloquea) los datos del jugador. Puede tardar varios segundos. nil si el jugador se fue o fue expulsado.
function DataService.load(player: Player): Session?
	local activeStore = store
	local key = "u_" .. player.UserId
	local lockedByOther = false

	if activeStore ~= nil then
		for attempt = 1, Config.Save.loadAttempts do
			waitForBudget()
			local loaded: PlayerData? = nil
			local ok, err = pcall(function()
				activeStore:UpdateAsync(key, function(old: any)
					loaded = nil
					lockedByOther = false
					local now = os.time()
					if isLockedByOther(old, now) then
						lockedByOther = true
						return nil
					end
					local data = reconcile(if type(old) == "table" then old.data else nil)
					loaded = data
					return { v = RECORD_VERSION, data = copyData(data), lock = { jobId = game.JobId, time = now } }
				end)
			end)
			if player.Parent ~= Players then
				-- se fue mientras cargaba: si llegamos a bloquear, se libera
				if ok and loaded then
					createSession(player, loaded, true)
					DataService.release(player)
				end
				return nil
			end
			if ok and loaded then
				return createSession(player, loaded, true)
			end
			if not ok then
				warn("[DataService] fallo al cargar (intento " .. attempt .. "):", err)
			end
			task.wait(Config.Save.loadRetryDelay)
		end
	end

	if lockedByOther then
		player:Kick("Your save is still open on another server. Please rejoin in a minute.")
		return nil
	end
	-- DataStore caído: se juega, pero nada se guarda (y las compras esperan: ProcessReceipt devuelve NotProcessedYet)
	warn("[DataService] jugando sin guardado para", player.UserId)
	player:SetAttribute("SaveWarning", true)
	return createSession(player, defaultData(), false)
end

function DataService.get(player: Player): Session?
	local session = sessions[player]
	if session and not session.released then
		return session
	end
	return nil
end

function DataService.waitFor(player: Player, timeout: number): Session?
	local started = os.clock()
	while os.clock() - started < timeout do
		local session = DataService.get(player)
		if session then
			return session
		end
		if player.Parent ~= Players then
			return nil
		end
		task.wait(0.25)
	end
	return DataService.get(player)
end

-- Vuelve a publicar monedas, renacimientos y niveles en los atributos (tras cambiar session.data a mano).
function DataService.touch(player: Player)
	local session = DataService.get(player)
	if session then
		refresh(session)
	end
end

function DataService.addCoins(player: Player, amount: number)
	local session = DataService.get(player)
	if session and amount ~= 0 then
		session.data.coins = math.max(0, math.floor(session.data.coins + amount))
		refresh(session)
	end
end

function DataService.trySpend(player: Player, amount: number): boolean
	local session = DataService.get(player)
	if session and not (amount < 0 or session.data.coins < amount) then
		session.data.coins -= amount
		refresh(session)
		return true
	end
	return false
end

function DataService.save(player: Player): boolean
	local session = DataService.get(player)
	if session then
		acquire(session)
		local ok = writeLocked(session, false)
		session.busy = false
		return ok
	end
	return false
end

local function commitLocked(
	session: Session,
	purchaseId: string,
	mutate: (PlayerData) -> (),
	revert: (PlayerData) -> ()
): CommitResult
	acquire(session)
	if session.released then
		session.busy = false
		return "failed"
	end
	if session.data.receipts[purchaseId] ~= nil then
		session.busy = false
		return "already"
	end
	mutate(session.data)
	session.data.receipts[purchaseId] = os.time()
	pruneReceipts(session.data)
	local ok = writeLocked(session, false)
	if not ok then
		revert(session.data)
		session.data.receipts[purchaseId] = nil
	end
	session.busy = false
	refresh(session)
	return if ok then "granted" else "failed"
end

-- Concede una compra de forma idempotente: si el PurchaseId ya está, no hace nada; si no, aplica `mutate`,
-- guarda el PurchaseId y los datos en una sola escritura y, si la escritura falla, deshace con `revert`.
function DataService.commitPurchase(
	player: Player,
	purchaseId: string,
	mutate: (PlayerData) -> (),
	revert: (PlayerData) -> ()
): CommitResult
	local session = DataService.get(player)
	if session and session.canSave then
		return commitLocked(session, purchaseId, mutate, revert)
	end
	return "failed"
end

-- Guarda y suelta el bloqueo. Se llama al salir el jugador y al cerrar el servidor (dos veces no pasa nada).
function DataService.release(player: Player)
	local session = sessions[player]
	if session and not session.released then
		acquire(session)
		session.released = true
		writeLocked(session, true)
		session.busy = false
		sessions[player] = nil
	end
end

function DataService.releaseAll()
	local pending = 0
	for player in sessions do
		pending += 1
		task.spawn(function()
			DataService.release(player)
			pending -= 1
		end)
	end
	local started = os.clock()
	while pending > 0 and os.clock() - started < 25 do
		task.wait(0.1)
	end
end

function DataService.startAutosave()
	task.spawn(function()
		while true do
			task.wait(Config.Save.autosaveInterval)
			for player in sessions do
				task.spawn(DataService.save, player)
			end
		end
	end)
end

return DataService
